import {
  QueryProviderTarget,
  SearchQueryItem,
  NormalizedResourceCandidate,
  ProviderCapabilities,
  ProviderExecutionOptions,
  ProviderHealthStatus,
  ProviderSearchResult,
  ProviderError,
  ProviderConfigurationError,
  ProviderQuotaExhaustedError,
  ProviderRateLimitError,
  ProviderTimeoutError,
  ProviderNetworkError,
  ProviderResponseError,
  ProviderMalformedResponseError,
} from '../types';
import { ResourceProviderAdapter } from './base-adapter';
import { CircuitBreaker, CircuitBreakerConfig } from '../resilience/circuit-breaker';
import { InMemoryCache, CacheConfig } from '../resilience/cache';
import { executeWithRetry } from '../resilience/retry-policy';
import { parseIsoDurationToSeconds } from '../normalization/duration-parser';
import { buildYouTubeVideoUrl, buildYouTubePlaylistUrl } from '../normalization/url-normalizer';
import { normalizeCandidate, deduplicateCandidates } from '../normalization/normalizer';

const YOUTUBE_SEARCH_ENDPOINT = 'https://www.googleapis.com/youtube/v3/search';
const YOUTUBE_VIDEOS_ENDPOINT = 'https://www.googleapis.com/youtube/v3/videos';
const YOUTUBE_PLAYLIST_ITEMS_ENDPOINT = 'https://www.googleapis.com/youtube/v3/playlistItems';

export interface YouTubeAdapterConfig {
  apiKey?: string;
  fetchFn?: typeof fetch;
  circuitBreakerConfig?: CircuitBreakerConfig;
  cacheConfig?: CacheConfig;
  defaultTimeoutMs?: number;
  maxPlaylistItemsExpanded?: number;
}

interface RawYouTubeSearchItem {
  id?: {
    kind?: string;
    videoId?: string;
    playlistId?: string;
  };
  snippet?: {
    publishedAt?: string;
    channelId?: string;
    title?: string;
    description?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
    channelTitle?: string;
  };
}

interface RawYouTubeVideoItem {
  id?: string;
  snippet?: {
    publishedAt?: string;
    channelId?: string;
    title?: string;
    description?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
    channelTitle?: string;
    tags?: string[];
  };
  contentDetails?: {
    duration?: string;
    caption?: string;
    definition?: string;
  };
  status?: {
    embeddable?: boolean;
    privacyStatus?: string;
    uploadStatus?: string;
  };
}

interface RawYouTubePlaylistItem {
  id?: string;
  snippet?: {
    publishedAt?: string;
    channelId?: string;
    title?: string;
    description?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
    };
    channelTitle?: string;
    position?: number;
    resourceId?: {
      kind?: string;
      videoId?: string;
    };
  };
  status?: {
    privacyStatus?: string;
  };
}

/**
 * YouTube Data API v3 Adapter (Resource Engine 2.0)
 * 
 * Implements genuine video and playlist item retrieval, quota-aware circuit breaking,
 * in-memory caching, and rigorous ISO 8601 duration extraction.
 */
export class YouTubeAdapterV2 implements ResourceProviderAdapter {
  readonly id: QueryProviderTarget = 'youtube';
  readonly name = 'YouTube Data API v3 Adapter';

  readonly capabilities: ProviderCapabilities = {
    supportedModalities: ['video', 'monograph', 'practice'],
    maxBatchSize: 25,
    supportsCancellation: true,
    supportsPlaylistExpansion: true,
    quotaLimited: true,
    requiresApiKey: true,
  };

  private readonly apiKey?: string;
  private readonly fetchFn: typeof fetch;
  private readonly defaultTimeoutMs: number;
  private readonly maxPlaylistItemsExpanded: number;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly cache: InMemoryCache<NormalizedResourceCandidate[]>;

  constructor(config: YouTubeAdapterConfig = {}) {
    this.apiKey = config.apiKey || (typeof process !== 'undefined' ? process.env?.YOUTUBE_API_KEY : undefined);
    this.fetchFn = config.fetchFn || globalThis.fetch;
    this.defaultTimeoutMs = config.defaultTimeoutMs ?? 8000;
    this.maxPlaylistItemsExpanded = config.maxPlaylistItemsExpanded ?? 20;

    this.circuitBreaker = new CircuitBreaker('YouTube', config.circuitBreakerConfig ?? {
      failureThreshold: 3,
      cooldownMs: 30_000,
      quotaCooldownMs: 300_000, // 5 min cooldown for 429 quota exhaustion
    });

    this.cache = new InMemoryCache<NormalizedResourceCandidate[]>(config.cacheConfig ?? {
      defaultTtlMs: 15 * 60 * 1000, // 15 min cache
      maxEntries: 250,
    });
  }

  public supportsQuery(query: SearchQueryItem): boolean {
    return query.providerCompatibility.includes('youtube');
  }

  public getHealthStatus(): ProviderHealthStatus {
    const breakerStatus = this.circuitBreaker.canExecute();
    return {
      available: !!this.apiKey && breakerStatus.allowed,
      quotaExhausted: breakerStatus.state === 'OPEN' && breakerStatus.cooldownRemainingMs > 60_000,
      cooldownRemainingMs: breakerStatus.cooldownRemainingMs,
      circuitBreakerState: breakerStatus.state,
      reason: !this.apiKey ? 'YOUTUBE_API_KEY is not configured' : breakerStatus.reason,
    };
  }

  public async search(
    query: SearchQueryItem,
    options: ProviderExecutionOptions = {}
  ): Promise<ProviderSearchResult> {
    const startTime = Date.now();
    const partialFailures: string[] = [];

    // 1. Check Circuit Breaker
    const breaker = this.circuitBreaker.canExecute();
    if (!breaker.allowed) {
      throw new ProviderQuotaExhaustedError(
        'YouTube',
        `YouTube API circuit breaker active: ${breaker.reason || 'cooldown in effect'}`,
        YOUTUBE_SEARCH_ENDPOINT
      );
    }

    // 2. Validate API Key
    if (!this.apiKey || !this.apiKey.trim()) {
      throw new ProviderConfigurationError(
        'YouTube',
        'YOUTUBE_API_KEY is required but not configured in environment or adapter options',
        YOUTUBE_SEARCH_ENDPOINT
      );
    }

    // 3. Check Cache
    const cacheKey = InMemoryCache.createKey('youtube', {
      q: query.queryString,
      intent: query.intent,
      limit: options.limit ?? 10,
    });

    if (!options.bypassCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return {
          provider: 'youtube',
          query: query.queryString,
          candidates: cached,
          metadata: {
            latencyMs: Date.now() - startTime,
            cacheHit: true,
            totalFetched: cached.length,
          },
        };
      }
    }

    // 4. Execute Search with Timeout and Retry
    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const candidates: NormalizedResourceCandidate[] = [];

    try {
      const searchItems = await this.executeSearchList(query, options, timeoutMs);

      // Separate videos and playlists
      const directVideoIds: string[] = [];
      const playlistItems: RawYouTubeSearchItem[] = [];

      for (const item of searchItems) {
        if (item.id?.kind === 'youtube#video' && item.id.videoId) {
          directVideoIds.push(item.id.videoId);
        } else if (item.id?.kind === 'youtube#playlist' && item.id.playlistId) {
          playlistItems.push(item);
        }
      }

      // Deduplicate video IDs before fetching metadata
      const uniqueVideoIds = Array.from(new Set(directVideoIds));

      // Fetch video details (genuine duration and embed status)
      let videoDetailsMap = new Map<string, RawYouTubeVideoItem>();
      if (uniqueVideoIds.length > 0) {
        videoDetailsMap = await this.executeVideosList(uniqueVideoIds, options, timeoutMs);
      }

      // Normalize direct video candidates
      for (const videoId of uniqueVideoIds) {
        const details = videoDetailsMap.get(videoId);
        if (!details) continue;

        // Skip non-embeddable or private videos
        if (details.status?.embeddable === false || details.status?.privacyStatus === 'private') {
          continue;
        }

        const durationSeconds = parseIsoDurationToSeconds(details.contentDetails?.duration);
        const norm = normalizeCandidate({
          provider: 'youtube',
          externalId: videoId,
          title: details.snippet?.title || '',
          description: details.snippet?.description,
          rawUrl: buildYouTubeVideoUrl(videoId),
          modality: 'video',
          creator: details.snippet?.channelTitle
            ? { name: details.snippet.channelTitle, channelId: details.snippet.channelId }
            : undefined,
          publishedAt: details.snippet?.publishedAt,
          durationSeconds,
          thumbnailUrl: details.snippet?.thumbnails?.high?.url || details.snippet?.thumbnails?.medium?.url,
          isEmbeddable: details.status?.embeddable ?? true,
          verificationStatus: 'unverified_candidate',
          provenance: {
            queryId: query.id,
            queryString: query.queryString,
            intent: query.intent,
          },
          rawMetadata: {
            definition: details.contentDetails?.definition,
            tags: details.snippet?.tags,
          },
        });

        if (norm.candidate) {
          candidates.push(norm.candidate);
        } else if (norm.error) {
          partialFailures.push(`Video ${videoId}: ${norm.error}`);
        }
      }

      // Expand playlists if enabled
      if (options.expandPlaylists && playlistItems.length > 0) {
        for (const plItem of playlistItems) {
          const playlistId = plItem.id?.playlistId;
          if (!playlistId) continue;

          try {
            const expanded = await this.expandPlaylist(playlistId, plItem, query, options, timeoutMs);
            candidates.push(...expanded.candidates);
            if (expanded.partialFailures) {
              partialFailures.push(...expanded.partialFailures);
            }
          } catch (plErr: unknown) {
            const msg = plErr instanceof Error ? plErr.message : String(plErr);
            partialFailures.push(`Playlist ${playlistId} expansion failed: ${msg}`);
          }
        }
      }

      // Deduplicate results
      const deduplicated = deduplicateCandidates(candidates);

      // Record successful search in Circuit Breaker
      this.circuitBreaker.recordSuccess();

      // Store in Cache
      this.cache.set(cacheKey, deduplicated);

      return {
        provider: 'youtube',
        query: query.queryString,
        candidates: deduplicated,
        partialFailures: partialFailures.length > 0 ? partialFailures : undefined,
        metadata: {
          latencyMs: Date.now() - startTime,
          cacheHit: false,
          totalFetched: deduplicated.length,
          quotaUsedEstimate: 100 + (uniqueVideoIds.length > 0 ? 1 : 0),
        },
      };
    } catch (err: unknown) {
      if (err instanceof ProviderError) {
        if (err.code === 'QUOTA_EXHAUSTED') {
          this.circuitBreaker.recordFailure(true, err.message);
        } else if (err.code === 'TIMEOUT' || err.code === 'NETWORK_ERROR' || err.code === 'RESPONSE_ERROR') {
          this.circuitBreaker.recordFailure(false, err.message);
        }
      }
      throw err;
    }
  }

  // --- PRIVATE RETRIEVAL HELPERS ---

  private async executeSearchList(
    query: SearchQueryItem,
    options: ProviderExecutionOptions,
    timeoutMs: number
  ): Promise<RawYouTubeSearchItem[]> {
    const url = new URL(YOUTUBE_SEARCH_ENDPOINT);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', query.queryString);
    url.searchParams.set('type', 'video,playlist');
    url.searchParams.set('maxResults', String(Math.min(options.limit ?? 10, 25)));
    url.searchParams.set('safeSearch', 'moderate');
    url.searchParams.set('key', this.apiKey!);

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    try {
      return await executeWithRetry(
        async () => {
          let response: Response;
          try {
            response = await this.fetchFn(url.toString(), {
              signal: controller.signal,
              headers: { Accept: 'application/json' },
            });
          } catch (fetchErr: unknown) {
            if (controller.signal.aborted) {
              throw new ProviderTimeoutError('YouTube', `Search request timed out after ${timeoutMs}ms`, YOUTUBE_SEARCH_ENDPOINT);
            }
            throw new ProviderNetworkError('YouTube', 'Network failure during search request', fetchErr, YOUTUBE_SEARCH_ENDPOINT);
          }

          if (!response.ok) {
            await this.handleHttpError(response, YOUTUBE_SEARCH_ENDPOINT);
          }

          let json: unknown;
          try {
            json = await response.json();
          } catch (jsonErr: unknown) {
            throw new ProviderMalformedResponseError('YouTube', 'Failed to parse JSON search response', jsonErr, YOUTUBE_SEARCH_ENDPOINT);
          }

          const parsed = json as { items?: RawYouTubeSearchItem[]; error?: { message?: string } };
          return parsed.items || [];
        },
        { maxRetries: 1, signal: options.signal }
      );
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  private async executeVideosList(
    videoIds: string[],
    options: ProviderExecutionOptions,
    timeoutMs: number
  ): Promise<Map<string, RawYouTubeVideoItem>> {
    const url = new URL(YOUTUBE_VIDEOS_ENDPOINT);
    url.searchParams.set('part', 'snippet,contentDetails,status');
    url.searchParams.set('id', videoIds.slice(0, 50).join(','));
    url.searchParams.set('key', this.apiKey!);

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    try {
      let response: Response;
      try {
        response = await this.fetchFn(url.toString(), {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
      } catch (fetchErr: unknown) {
        if (controller.signal.aborted) {
          throw new ProviderTimeoutError('YouTube', `Videos detail request timed out after ${timeoutMs}ms`, YOUTUBE_VIDEOS_ENDPOINT);
        }
        throw new ProviderNetworkError('YouTube', 'Network failure during videos detail request', fetchErr, YOUTUBE_VIDEOS_ENDPOINT);
      }

      if (!response.ok) {
        await this.handleHttpError(response, YOUTUBE_VIDEOS_ENDPOINT);
      }

      const json = (await response.json()) as { items?: RawYouTubeVideoItem[] };
      const map = new Map<string, RawYouTubeVideoItem>();
      for (const item of json.items || []) {
        if (item.id) map.set(item.id, item);
      }
      return map;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  private async expandPlaylist(
    playlistId: string,
    playlistSearchItem: RawYouTubeSearchItem,
    query: SearchQueryItem,
    options: ProviderExecutionOptions,
    timeoutMs: number
  ): Promise<{ candidates: NormalizedResourceCandidate[]; partialFailures?: string[] }> {
    const partialFailures: string[] = [];
    const maxItems = Math.min(options.maxPlaylistItems ?? this.maxPlaylistItemsExpanded, 50);

    const url = new URL(YOUTUBE_PLAYLIST_ITEMS_ENDPOINT);
    url.searchParams.set('part', 'snippet,status');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('maxResults', String(Math.min(maxItems, 50)));
    url.searchParams.set('key', this.apiKey!);

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await this.fetchFn(url.toString(), {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        await this.handleHttpError(response, YOUTUBE_PLAYLIST_ITEMS_ENDPOINT);
      }

      const json = (await response.json()) as {
        items?: RawYouTubePlaylistItem[];
        nextPageToken?: string;
        pageInfo?: { totalResults?: number };
      };

      const rawItems = json.items || [];
      const constituentVideoIds: string[] = [];
      let inaccessibleCount = 0;

      for (const item of rawItems) {
        const vid = item.snippet?.resourceId?.videoId;
        // Check for deleted, private, or unavailable videos in playlist
        const title = item.snippet?.title?.toLowerCase() || '';
        const isDeletedOrPrivate =
          title === 'private video' ||
          title === 'deleted video' ||
          item.status?.privacyStatus === 'private';

        if (isDeletedOrPrivate || !vid) {
          inaccessibleCount++;
          continue;
        }

        constituentVideoIds.push(vid);
      }

      // Fetch video details for constituent items to get genuine durations
      let videoDetailsMap = new Map<string, RawYouTubeVideoItem>();
      if (constituentVideoIds.length > 0) {
        videoDetailsMap = await this.executeVideosList(constituentVideoIds, options, timeoutMs);
      }

      const expandedCandidates: NormalizedResourceCandidate[] = [];
      const incompleteExpansion = Boolean(json.nextPageToken && constituentVideoIds.length < (json.pageInfo?.totalResults ?? 0));

      for (let i = 0; i < constituentVideoIds.length; i++) {
        const vid = constituentVideoIds[i];
        const details = videoDetailsMap.get(vid);
        if (!details) continue;

        const durationSeconds = parseIsoDurationToSeconds(details.contentDetails?.duration);
        const norm = normalizeCandidate({
          provider: 'youtube',
          externalId: vid,
          title: details.snippet?.title || `Lesson ${i + 1}`,
          description: details.snippet?.description,
          rawUrl: buildYouTubeVideoUrl(vid),
          modality: 'video',
          creator: details.snippet?.channelTitle
            ? { name: details.snippet.channelTitle, channelId: details.snippet.channelId }
            : undefined,
          publishedAt: details.snippet?.publishedAt,
          durationSeconds,
          thumbnailUrl: details.snippet?.thumbnails?.high?.url || details.snippet?.thumbnails?.medium?.url,
          isEmbeddable: details.status?.embeddable !== false,
          playlist: {
            isPlaylist: false,
            playlistId,
            playlistIndex: i + 1,
            playlistItemCount: json.pageInfo?.totalResults,
            incompleteExpansion,
            inaccessibleCount,
          },
          verificationStatus: 'unverified_candidate',
          provenance: {
            queryId: query.id,
            queryString: query.queryString,
            intent: query.intent,
          },
        });

        if (norm.candidate) {
          expandedCandidates.push(norm.candidate);
        }
      }

      return {
        candidates: expandedCandidates,
        partialFailures: inaccessibleCount > 0
          ? [`Playlist ${playlistId} contained ${inaccessibleCount} inaccessible/deleted items.`]
          : undefined,
      };
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  private async handleHttpError(response: Response, endpoint: string): Promise<never> {
    let errorBody: string = '';
    let parsedJson: { error?: { code?: number; message?: string; errors?: Array<{ reason?: string }> } } | null = null;

    try {
      errorBody = await response.text();
      parsedJson = JSON.parse(errorBody);
    } catch {
      // Body not JSON
    }

    const message = parsedJson?.error?.message || response.statusText || `HTTP ${response.status}`;
    const reason = parsedJson?.error?.errors?.[0]?.reason;

    // Detect Quota Exhaustion
    if (
      response.status === 429 ||
      reason === 'quotaExceeded' ||
      reason === 'dailyLimitExceeded' ||
      message.toLowerCase().includes('quota')
    ) {
      throw new ProviderQuotaExhaustedError('YouTube', `YouTube API quota exhausted: ${message}`, endpoint);
    }

    // Detect Rate Limiting (transient)
    if (reason === 'rateLimitExceeded' || reason === 'userRateLimitExceeded') {
      throw new ProviderRateLimitError('YouTube', `YouTube rate limit exceeded: ${message}`, 10, endpoint);
    }

    // Detect Configuration / Auth errors
    if (response.status === 400 && reason === 'keyInvalid') {
      throw new ProviderConfigurationError('YouTube', `Invalid YOUTUBE_API_KEY: ${message}`, endpoint);
    }

    if (response.status === 403) {
      throw new ProviderConfigurationError('YouTube', `Access denied (HTTP 403): ${message}`, endpoint);
    }

    throw new ProviderResponseError('YouTube', response.status, message, endpoint);
  }
}
