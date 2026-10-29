import {
  RawCandidateResource,
  ResourceProvider,
  EducationalDomain,
  MasterEducatorMatch,
} from '../types';
import { educatorIntelligence } from '../educator-intelligence';

interface CacheEntry {
  data: RawCandidateResource[];
  timestamp: number;
}

export class YouTubeProvider implements ResourceProvider {
  readonly id = 'youtube' as const;
  readonly name = 'YouTube Data API v3 Provider';

  private apiKey?: string;
  private cache = new Map<string, CacheEntry>();
  private readonly cacheTtlMs = 15 * 60 * 1000; // 15 mins
  private circuitBreakerTrippedUntil = 0;
  private isQuotaExhausted = false;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.YOUTUBE_API_KEY?.trim();
  }

  public getQuotaStatus(): { isQuotaExhausted: boolean; isCircuitOpen: boolean } {
    return {
      isQuotaExhausted: this.isQuotaExhausted,
      isCircuitOpen: Date.now() < this.circuitBreakerTrippedUntil,
    };
  }

  public async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    if (this.isQuotaExhausted) return false;
    if (Date.now() < this.circuitBreakerTrippedUntil) return false;
    return true;
  }

  public async search(
    query: string,
    options?: {
      maxResults?: number;
      targetConcept?: string;
      domain?: EducationalDomain;
      matchedEducators?: MasterEducatorMatch[];
    }
  ): Promise<RawCandidateResource[]> {
    const limit = options?.maxResults || 5;
    const cacheKey = `yt:${query.toLowerCase().trim()}:${limit}`;

    // 1. Check in-memory cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.data;
    }

    // 2. Check if circuit breaker is open or quota exhausted
    if (!this.apiKey || this.isQuotaExhausted || Date.now() < this.circuitBreakerTrippedUntil) {
      // Graceful fallback: return verified catalog resources from matched educators if available
      return this.getEducatorCatalogFallback(query, options?.matchedEducators, options?.domain);
    }

    try {
      const candidates = await this.executeYouTubeSearch(query, limit, options?.matchedEducators);
      if (candidates.length > 0) {
        this.cache.set(cacheKey, { data: candidates, timestamp: Date.now() });
        return candidates;
      }
    } catch (err: any) {
      console.warn(`[YouTubeProvider] Search failed for query "${query}":`, err.message);
      if (err.isQuota) {
        this.isQuotaExhausted = true;
        this.circuitBreakerTrippedUntil = Date.now() + 5 * 60 * 1000; // 5 min cooldown
      } else {
        this.circuitBreakerTrippedUntil = Date.now() + 30 * 1000; // 30s transient cooldown
      }
    }

    // Fallback if live search produced 0 or tripped
    return this.getEducatorCatalogFallback(query, options?.matchedEducators, options?.domain);
  }

  private async executeYouTubeSearch(
    query: string,
    limit: number,
    matchedEducators?: MasterEducatorMatch[]
  ): Promise<RawCandidateResource[]> {
    if (!this.apiKey) return [];

    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('maxResults', String(Math.min(limit * 2, 15)));
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('key', this.apiKey);

    const res = await fetch(searchUrl.toString(), {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const errText = await res.text();
      let isQuota = false;
      try {
        const parsed = JSON.parse(errText);
        if (
          res.status === 429 ||
          parsed.error?.status === 'RESOURCE_EXHAUSTED' ||
          parsed.error?.errors?.[0]?.reason === 'quotaExceeded' ||
          errText.includes('Quota exceeded')
        ) {
          isQuota = true;
        }
      } catch {}

      const err: any = new Error(`YouTube API HTTP ${res.status}: ${res.statusText}`);
      err.isQuota = isQuota;
      throw err;
    }

    const data = await res.json();
    const items = data.items || [];
    if (items.length === 0) return [];

    const videoIds = items
      .map((item: any) => item.id?.videoId)
      .filter((id: string) => Boolean(id));

    if (videoIds.length === 0) return [];

    // Hydrate video details (duration, embeddable, tags) in a single batch
    const detailsMap = await this.hydrateVideoDetails(videoIds);

    const candidates: RawCandidateResource[] = [];

    for (const item of items) {
      const vid = item.id?.videoId;
      if (!vid) continue;

      const details = detailsMap.get(vid);
      // Skip unembeddable videos
      if (details?.status?.embeddable === false) continue;

      const channelTitle = item.snippet?.channelTitle || details?.snippet?.channelTitle || 'YouTube Creator';
      const channelId = item.snippet?.channelId || details?.snippet?.channelId;

      // Check if creator matches directory
      const verifiedEducator = channelId
        ? educatorIntelligence.findByChannelId(channelId)
        : educatorIntelligence.findByNameOrHandle(channelTitle);

      const durationSeconds = this.parseIsoDuration(details?.contentDetails?.duration);

      candidates.push({
        providerId: 'youtube',
        externalId: vid,
        title: details?.snippet?.title || item.snippet?.title || 'Educational Lecture',
        url: `https://www.youtube.com/watch?v=${vid}`,
        description: details?.snippet?.description || item.snippet?.description || '',
        modality: 'video',
        authorOrChannel: verifiedEducator?.name || channelTitle,
        channelId: channelId || verifiedEducator?.channelId,
        durationSeconds,
        publishedDate: details?.snippet?.publishedAt || item.snippet?.publishedAt,
        isEmbeddable: details?.status?.embeddable !== false,
        thumbnailUrl:
          details?.snippet?.thumbnails?.high?.url ||
          details?.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.high?.url ||
          `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
        licenseOrAttribution: 'Standard YouTube License',
        rawMetadata: {
          isVerifiedEducator: Boolean(verifiedEducator),
          educatorId: verifiedEducator?.educatorId,
          channelName: verifiedEducator?.channelName || channelTitle,
        },
      });

      if (candidates.length >= limit) break;
    }

    return candidates;
  }

  private async hydrateVideoDetails(videoIds: string[]): Promise<Map<string, any>> {
    const map = new Map<string, any>();
    if (!this.apiKey || videoIds.length === 0) return map;

    try {
      const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      detailsUrl.searchParams.set('part', 'snippet,contentDetails,status');
      detailsUrl.searchParams.set('id', videoIds.join(','));
      detailsUrl.searchParams.set('key', this.apiKey);

      const res = await fetch(detailsUrl.toString(), {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const json = await res.json();
        for (const item of json.items || []) {
          if (item.id) {
            map.set(item.id, item);
          }
        }
      }
    } catch (e) {
      console.warn('[YouTubeProvider] Could not hydrate video details:', e);
    }

    return map;
  }

  private parseIsoDuration(durationStr?: string): number {
    if (!durationStr) return 1800; // default 30 mins
    const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 1800;
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
  }

  private getEducatorCatalogFallback(
    query: string,
    matchedEducators?: MasterEducatorMatch[],
    domain?: EducationalDomain
  ): RawCandidateResource[] {
    const fallbackResults: RawCandidateResource[] = [];
    const educatorsToUse = matchedEducators && matchedEducators.length > 0
      ? matchedEducators
      : educatorIntelligence.matchEducatorsForObjective(query, domain, 3);

    for (const ed of educatorsToUse) {
      if (ed.channelUrl) {
        fallbackResults.push({
          providerId: 'curated_directory',
          externalId: ed.channelId || ed.educatorId,
          title: `${ed.name} (${ed.channelName}): Key Lectures & Series on ${query}`,
          url: ed.channelUrl,
          description: ed.bestUse || `Verified academic video playlist and lectures by ${ed.name} covering ${ed.subjects.join(', ')}.`,
          modality: 'video',
          authorOrChannel: ed.name,
          channelId: ed.channelId,
          durationSeconds: 2400, // 40 mins estimated
          isEmbeddable: true,
          thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
          licenseOrAttribution: 'Master YouTube Educator Directory',
          rawMetadata: {
            isVerifiedEducator: true,
            educatorId: ed.educatorId,
            channelName: ed.channelName,
            isCatalogFallback: true,
          },
        });
      }
    }

    return fallbackResults;
  }
}
