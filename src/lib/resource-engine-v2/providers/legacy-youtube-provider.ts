import { ResourceProvider, ProviderSearchOptions } from './base-provider';
import { EngineResource, EngineResourceType, ResourceDifficulty } from '../types/legacy-contracts';
import { canonicalizeUrl, extractYouTubeVideoId } from '../utils/url-utils';
import { calculateSourceAuthorityScore, calculateFreshnessScore } from '../utils/scoring-utils';
import { DEFAULT_ENGINE_CONFIG } from '../config';
import { ChannelVerifier } from '../educators/channel-verifier';
import { educatorRegistry } from '../educators/educator-registry';
import { tokenize, stemWord } from '../utils/text-utils';
import {
  extractPracticalLearningSignals,
  calculateDurationSuitability,
} from '../evaluation/duration-manager';

const YOUTUBE_SEARCH_ENDPOINT = 'https://www.googleapis.com/youtube/v3/search';
const YOUTUBE_VIDEOS_ENDPOINT = 'https://www.googleapis.com/youtube/v3/videos';

interface YouTubeSearchItem {
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

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
  error?: {
    code?: number;
    message?: string;
  };
}

interface YouTubeVideoDetailsResponse {
  items?: Array<{
    id?: string;
    contentDetails?: {
      duration?: string;
      definition?: string;
      caption?: string;
    };
    status?: {
      embeddable?: boolean;
      privacyStatus?: string;
      uploadStatus?: string;
    };
    snippet?: {
      title?: string;
      tags?: string[];
      description?: string;
      publishedAt?: string;
      channelTitle?: string;
      channelId?: string;
    };
    statistics?: {
      viewCount?: string;
      likeCount?: string;
    };
  }>;
}

interface CacheEntry {
  expiresAt: number;
  data: EngineResource[];
}

const queryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_CACHE_SIZE = 250;

function getCached(key: string): EngineResource[] | null {
  const entry = queryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    queryCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: EngineResource[]): void {
  if (queryCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = queryCache.keys().next().value;
    if (oldestKey) queryCache.delete(oldestKey);
  }
  queryCache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    data,
  });
}

let youtubeQuotaExhaustedUntil: number = 0;
const YOUTUBE_QUOTA_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

export function isYouTubeQuotaExhausted(): boolean {
  return Date.now() < youtubeQuotaExhaustedUntil;
}

export function recordYouTubeQuotaExhaustion(cooldownMs: number = YOUTUBE_QUOTA_COOLDOWN_MS): void {
  youtubeQuotaExhaustedUntil = Date.now() + cooldownMs;
  console.warn(`[YouTubeProvider] Circuit breaker tripped: YouTube API quota exhausted. Cooling down for ${Math.round(cooldownMs / 1000)}s.`);
}

export function resetYouTubeQuotaForTesting(): void {
  youtubeQuotaExhaustedUntil = 0;
}

function sanitizeLog(msg: string, key?: string): string {
  if (!key) return msg;
  return msg.split(key).join('[REDACTED_YOUTUBE_KEY]');
}

import { parseIsoDurationToMinutes } from '../normalization/duration-parser';
import { findVerifiedDirectoryResources } from '../educators/educator-matcher';
export { parseIsoDurationToMinutes, findVerifiedDirectoryResources };

export class YouTubeProvider implements ResourceProvider {
  readonly id = 'youtube-provider';
  readonly name = 'YouTube Data API v3';
  readonly providerType = 'youtube' as const;
  readonly supportedTypes: EngineResourceType[] = ['video_lecture', 'youtube_playlist', 'full_course'];

  private getApiKey(): string | undefined {
    if (typeof window !== 'undefined') {
      console.error('[YouTubeProvider] Security Violation: YouTube API cannot be accessed in browser contexts.');
      return undefined;
    }
    return process.env.YOUTUBE_API_KEY?.trim();
  }

  isAvailable(): boolean {
    const key = this.getApiKey();
    if (key && key.length > 0) return true;
    return educatorRegistry.getVerifiedLearningResources().length > 0;
  }

  getAvailabilityStatus(): { available: boolean; reason?: string; isQuotaExhausted?: boolean } {
    const isExhausted = isYouTubeQuotaExhausted();
    const key = this.getApiKey();
    if (isExhausted) {
      if (educatorRegistry.getVerifiedLearningResources().length > 0) {
        return {
          available: true,
          isQuotaExhausted: true,
          reason: 'YouTube API daily quota exhausted. Serving verified directory resources seamlessly.',
        };
      }
      return {
        available: false,
        isQuotaExhausted: true,
        reason: 'YouTube API daily quota exhausted and no verified directory resources available.',
      };
    }
    if (key && key.length > 0) {
      return { available: true };
    }
    if (educatorRegistry.getVerifiedLearningResources().length > 0) {
      return {
        available: true,
        reason: 'Operating in Verified Master Educator Directory mode (YOUTUBE_API_KEY optional).',
      };
    }
    return {
      available: false,
      reason: 'YOUTUBE_API_KEY environment variable is not configured. YouTube discovery requires a valid API key in .env.local.',
    };
  }

  async search(query: string, options?: ProviderSearchOptions): Promise<EngineResource[]> {
    const limit = Math.min(options?.limit || DEFAULT_ENGINE_CONFIG.youTubeResultsLimit, 15);
    const targetChannelId = options?.channelId || options?.targetEducator?.YouTube_Channel_ID;

    // Check directory verified resources first
    const directoryResources = findVerifiedDirectoryResources(query, options);

    const apiKey = this.getApiKey();
    if (!apiKey) {
      if (directoryResources.length > 0) {
        return directoryResources.slice(0, limit);
      }
      console.warn('[YouTubeProvider] Skipped search: YOUTUBE_API_KEY is not configured.');
      return [];
    }

    if (isYouTubeQuotaExhausted()) {
      if (directoryResources.length > 0) {
        return directoryResources.slice(0, limit);
      }
      return [];
    }

    const cacheKey = `yt:${query.toLowerCase().trim()}:${targetChannelId || 'all'}:${limit}`;
    const cached = getCached(cacheKey);
    if (cached) {
      if (options?.excludeUrls || options?.excludeVideoIds) {
        const filtered = cached.filter((r) => {
          const vUrl = r.canonicalUrl || r.sourceUrl;
          const vid = r.externalId || (r.metadata?.videoId as string) || extractYouTubeVideoId(vUrl);
          if (options?.excludeUrls && (options.excludeUrls.has(vUrl) || options.excludeUrls.has(r.sourceUrl))) return false;
          if (options?.excludeVideoIds && vid && options.excludeVideoIds.has(vid)) return false;
          return true;
        });
        if (filtered.length > 0) {
          return filtered.slice(0, limit);
        }
      } else {
        return cached;
      }
    }

    const timeoutMs = options?.timeoutMs || DEFAULT_ENGINE_CONFIG.providerTimeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // 1. Query YouTube Search API
      const searchUrl = new URL(YOUTUBE_SEARCH_ENDPOINT);
      searchUrl.searchParams.set('part', 'snippet');
      searchUrl.searchParams.set('q', query);

      // Support channel-specific targeting (Requirement 5 Stage 3)
      if (targetChannelId && targetChannelId.trim().length > 0) {
        searchUrl.searchParams.set('channelId', targetChannelId.trim());
      }

      const isVideoOnly =
        options?.targetTypes &&
        options.targetTypes.length === 1 &&
        options.targetTypes[0] === 'video_lecture';
      searchUrl.searchParams.set('type', isVideoOnly ? 'video' : 'video,playlist');
      searchUrl.searchParams.set('maxResults', String(limit));
      searchUrl.searchParams.set('safeSearch', 'moderate');
      searchUrl.searchParams.set('relevanceLanguage', 'en');
      searchUrl.searchParams.set('videoEmbeddable', 'true');
      searchUrl.searchParams.set('order', 'relevance');
      searchUrl.searchParams.set('key', apiKey);

      const searchRes = await fetch(searchUrl.toString(), {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!searchRes.ok) {
        const errorText = await searchRes.text();
        console.warn(`[YouTubeProvider] Search HTTP ${searchRes.status}:`, sanitizeLog(errorText.slice(0, 200), apiKey));
        if (
          searchRes.status === 429 ||
          searchRes.status === 403 ||
          errorText.includes('quotaExceeded') ||
          errorText.includes('dailyLimitExceeded')
        ) {
          recordYouTubeQuotaExhaustion();
        }
        // Return verified directory matches on API failure (graceful fallback)
        if (directoryResources.length > 0) return directoryResources.slice(0, limit);
        return [];
      }

      const searchData = (await searchRes.json()) as YouTubeSearchResponse;
      if (searchData.error) {
        console.warn(`[YouTubeProvider] API error:`, sanitizeLog(searchData.error.message || 'Unknown YouTube API error', apiKey));
        if (
          searchData.error.code === 429 ||
          searchData.error.code === 403 ||
          searchData.error.message?.includes('quota')
        ) {
          recordYouTubeQuotaExhaustion();
        }
        if (directoryResources.length > 0) return directoryResources.slice(0, limit);
        return [];
      }

      const items = searchData.items || [];
      if (items.length === 0) {
        if (directoryResources.length > 0) return directoryResources.slice(0, limit);
        return [];
      }

      // 2. Extract video IDs to enrich duration via videos endpoint
      const videoIds = items
        .map((i) => i.id?.videoId)
        .filter((vid): vid is string => typeof vid === 'string' && vid.length > 0);

      interface VideoDetailsInfo {
        durationMinutes: number;
        definition: 'hd' | 'sd';
        hasCaptions: boolean;
        isEmbeddable: boolean;
        privacyStatus?: string;
        uploadStatus?: string;
        detailedTitle?: string;
        detailedDescription?: string;
        publishedAt?: string;
        channelTitle?: string;
        channelId?: string;
        tags?: string[];
        viewCount?: number;
        likeCount?: number;
      }
      const detailsMap = new Map<string, VideoDetailsInfo>();

      if (videoIds.length > 0) {
        try {
          const videosUrl = new URL(YOUTUBE_VIDEOS_ENDPOINT);
          videosUrl.searchParams.set('part', 'contentDetails,snippet,status,statistics');
          videosUrl.searchParams.set('id', videoIds.join(','));
          videosUrl.searchParams.set('key', apiKey);

          const videosRes = await fetch(videosUrl.toString(), {
            signal: controller.signal,
          });

          if (videosRes.ok) {
            const videosData = (await videosRes.json()) as YouTubeVideoDetailsResponse;
            for (const vItem of videosData.items || []) {
              if (vItem.id) {
                const durationMinutes = vItem.contentDetails?.duration
                  ? parseIsoDurationToMinutes(vItem.contentDetails.duration)
                  : 20;
                const definition = vItem.contentDetails?.definition === 'hd' ? 'hd' : 'sd';
                const hasCaptions = vItem.contentDetails?.caption === 'true';
                const isEmbeddable = vItem.status?.embeddable !== false;
                const privacyStatus = vItem.status?.privacyStatus || 'public';
                const uploadStatus = vItem.status?.uploadStatus || 'processed';
                const viewCount = vItem.statistics?.viewCount ? parseInt(vItem.statistics.viewCount, 10) : undefined;
                const likeCount = vItem.statistics?.likeCount ? parseInt(vItem.statistics.likeCount, 10) : undefined;

                detailsMap.set(vItem.id, {
                  durationMinutes,
                  definition,
                  hasCaptions,
                  isEmbeddable,
                  privacyStatus,
                  uploadStatus,
                  detailedTitle: vItem.snippet?.title,
                  detailedDescription: vItem.snippet?.description,
                  publishedAt: vItem.snippet?.publishedAt,
                  channelTitle: vItem.snippet?.channelTitle,
                  channelId: vItem.snippet?.channelId,
                  tags: vItem.snippet?.tags,
                  viewCount,
                  likeCount,
                });
              }
            }
          }
        } catch {
          // Duration enrichment failure is non-fatal
        }
      }

      // 3. Normalize into EngineResource with Channel Identity & Educator Verification
      const resources: EngineResource[] = [];

      for (const item of items) {
        const isPlaylist = item.id?.kind === 'youtube#playlist' || !!item.id?.playlistId;
        const externalId = (isPlaylist ? item.id?.playlistId : item.id?.videoId) || '';
        if (!externalId) continue;

        const videoDetails = !isPlaylist ? detailsMap.get(externalId) : undefined;
        // Reject video if owner disabled embedding or video is unavailable/private
        if (!isPlaylist && videoDetails) {
          if (videoDetails.isEmbeddable === false) continue;
          if (videoDetails.privacyStatus && videoDetails.privacyStatus !== 'public') continue;
          if (videoDetails.uploadStatus && videoDetails.uploadStatus === 'failed') continue;
        }

        const rawUrl = isPlaylist
          ? `https://www.youtube.com/playlist?list=${externalId}`
          : `https://www.youtube.com/watch?v=${externalId}`;

        const canonical = canonicalizeUrl(rawUrl);
        const channelName = videoDetails?.channelTitle || item.snippet?.channelTitle || 'YouTube';
        const channelId = videoDetails?.channelId || item.snippet?.channelId || '';
        const verifiedPublishedAt = videoDetails?.publishedAt || item.snippet?.publishedAt;
        const authorityScore = calculateSourceAuthorityScore(canonical, channelName);
        const freshnessScore = calculateFreshnessScore(verifiedPublishedAt);
        const durationMinutes = isPlaylist
          ? 120
          : videoDetails?.durationMinutes || 20;

        const fullDescription = videoDetails?.detailedDescription || (item.snippet?.description || '').trim();
        const definition = videoDetails?.definition || 'sd';
        const hasCaptions = videoDetails?.hasCaptions || false;
        const videoTags = videoDetails?.tags || [];
        const videoTitle = (videoDetails?.detailedTitle || item.snippet?.title || '').trim();

        const isOneShot =
          !isPlaylist &&
          (/\b(one[- ]?shot|oneshot|full chapter|complete chapter)\b/i.test(videoTitle) ||
           (/\b(one[- ]?shot|oneshot|full chapter)\b/i.test(fullDescription) && durationMinutes >= 45));

        const isFullCourse =
          !isPlaylist &&
          (isOneShot ||
           durationMinutes >= 60 ||
           /\b(full course|complete course|masterclass|bootcamp|complete tutorial|all-in-one)\b/i.test(videoTitle));

        const type: EngineResourceType = isPlaylist
          ? 'youtube_playlist'
          : isFullCourse
          ? 'full_course'
          : 'video_lecture';

        const thumbnail =
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          (externalId && !isPlaylist ? `https://i.ytimg.com/vi/${externalId}/hqdefault.jpg` : undefined);

        // -------------------------------------------------------------
        // Verify Educator & Creator Identity (Requirement 5 Stage 3 & 4)
        // -------------------------------------------------------------
        let educatorId = options?.educatorId || options?.targetEducator?.Educator_ID;
        let educatorName = options?.targetEducator?.Educator_Name;
        let discoverySource: 'curated_directory' | 'fallback_search' = options?.discoverySource || 'fallback_search';
        let verificationStatus = 'UNVERIFIED';
        let identityConfidence = 'unverified';

        if (options?.targetEducator) {
          const vResult = ChannelVerifier.verifyChannelIdentity(
            {
              channelId,
              channelTitle: channelName,
              videoTitle,
              videoUrl: rawUrl,
            },
            options.targetEducator
          );

          if (vResult.isVerifiedEducator) {
            educatorId = options.targetEducator.Educator_ID;
            educatorName = options.targetEducator.Educator_Name;
            discoverySource = 'curated_directory';
            verificationStatus = options.targetEducator.Verification_Status;
            identityConfidence = vResult.confidence;
          } else {
            // Channel does not belong to the targeted educator!
            // Reject false title-mentions per Requirement 5 Stage 3:
            educatorId = undefined;
            educatorName = undefined;
            discoverySource = 'fallback_search';
          }
        } else {
          // Automatic resolution against master educator directory
          let matchedEdu = channelId ? educatorRegistry.getByChannelId(channelId) : undefined;
          if (!matchedEdu) {
            matchedEdu = educatorRegistry.getByHandle(channelName) || educatorRegistry.getAll().find((e) => {
              const vRes = ChannelVerifier.verifyChannelIdentity(
                { channelId, channelTitle: channelName, videoTitle, videoUrl: rawUrl },
                e
              );
              return vRes.isVerifiedEducator;
            });
          }

          if (matchedEdu) {
            const vResult = ChannelVerifier.verifyChannelIdentity(
              { channelId, channelTitle: channelName, videoTitle, videoUrl: rawUrl },
              matchedEdu
            );
            if (vResult.isVerifiedEducator) {
              educatorId = matchedEdu.Educator_ID;
              educatorName = matchedEdu.Educator_Name;
              discoverySource = 'curated_directory';
              verificationStatus = matchedEdu.Verification_Status;
              identityConfidence = vResult.confidence;
            }
          }
        }

        const isCurated = discoverySource === 'curated_directory';
        const selectionExplanation = isCurated
          ? `Published by verified directory educator "${educatorName || channelName}" (${identityConfidence})`
          : `Verified educational video from ${channelName}`;

        const practicalSignals = extractPracticalLearningSignals(videoTitle, fullDescription, videoTags);
        const practicalDepthScore = practicalSignals.signalScore;

        const resource: EngineResource = {
          id: `yt_${externalId}`,
          title: videoTitle,
          description: fullDescription,
          type,
          canonicalUrl: canonical,
          sourceUrl: rawUrl,
          sourceName: isCurated ? `${channelName} (Curated Directory)` : `YouTube - ${channelName}`,
          provider: 'youtube',
          externalId,
          authorOrChannel: channelName,
          thumbnailUrl: thumbnail,
          durationMinutes,
          difficulty: (options?.difficulty as ResourceDifficulty) || 'intermediate',
          language: 'en',
          educatorId,
          educatorName,
          channelId,
          discoverySource,
          verificationStatus,
          isCompleteCourse: isFullCourse,
          isStructuredPlaylist: isPlaylist,
          selectionExplanation,
          practicalDepthScore,
          score: {
            overall: Math.min(98, Math.round(authorityScore * 0.45 + freshnessScore * 0.3 + (isCurated ? 26 : 22))),
            relevance: isCurated ? 85 : 80,
            educationalValue: Math.min(authorityScore + (isCurated ? 8 : 5), 96),
            structureCompleteness: isPlaylist ? 92 : 80,
            freshness: freshnessScore,
            practicalDepth: practicalDepthScore,
            explanation: `${selectionExplanation} (visual definition: ${definition.toUpperCase()}, captions: ${hasCaptions ? 'verified' : 'unverified'}${verifiedPublishedAt ? `, published: ${verifiedPublishedAt.slice(0, 10)}` : ''})`,
          },
          tags: Array.from(new Set([type, 'youtube', channelName.toLowerCase(), isCurated ? 'curated_directory' : 'fallback_search', ...videoTags.slice(0, 8)])),
          examCategory: options?.examContext,
          metadata: {
            videoId: isPlaylist ? undefined : externalId,
            playlistId: isPlaylist ? externalId : undefined,
            channelId,
            educatorId,
            educatorName,
            discoverySource,
            verificationStatus,
            identityConfidence,
            selectionExplanation,
            publishedAt: verifiedPublishedAt,
            isPlaylist,
            isFullCourse,
            isOneShot,
            isComprehensive: isPlaylist || isFullCourse || isOneShot,
            isEmbeddable: videoDetails?.isEmbeddable ?? true,
            definition,
            hasCaptions,
            tags: videoTags,
            viewCount: videoDetails?.viewCount,
            likeCount: videoDetails?.likeCount,
            practicalSignals,
            practicalDepthScore,
          },
          discoveredAt: new Date().toISOString(),
          // Compatibility aliases
          url: canonical,
          author: channelName,
          duration: `${durationMinutes} min`,
          publishedAt: verifiedPublishedAt,
        };

        resources.push(resource);
        if (resources.length >= limit) break;
      }

      // Merge directory resources if any
      const allResults = [...directoryResources, ...resources];
      // Deduplicate by externalId / canonicalUrl
      const seen = new Set<string>();
      const dedupedResults: EngineResource[] = [];
      for (const r of allResults) {
        const vid = r.externalId || (r.metadata?.videoId as string) || extractYouTubeVideoId(r.canonicalUrl) || extractYouTubeVideoId(r.sourceUrl) || r.id;
        if (!r.externalId && vid && /^[a-zA-Z0-9_-]{11}$/.test(vid)) {
          r.externalId = vid;
        }
        if (!r.metadata) r.metadata = {};
        if (vid && !r.metadata.videoId) {
          r.metadata.videoId = vid;
        }
        const key = r.canonicalUrl || vid;
        if (!seen.has(key)) {
          seen.add(key);
          dedupedResults.push(r);
        }
      }

      setCache(cacheKey, dedupedResults);

      const filteredResults = dedupedResults.filter((r) => {
        const vUrl = r.canonicalUrl || r.sourceUrl;
        const vid = r.externalId || (r.metadata?.videoId as string) || extractYouTubeVideoId(vUrl);
        if (options?.excludeUrls && (options.excludeUrls.has(vUrl) || options.excludeUrls.has(r.sourceUrl))) return false;
        if (options?.excludeVideoIds && vid && options.excludeVideoIds.has(vid)) return false;
        return true;
      });

      return filteredResults.slice(0, limit);
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'AbortError') {
        console.warn(`[YouTubeProvider] Search timed out after ${timeoutMs}ms for query: "${query}"`);
      } else {
        console.warn(`[YouTubeProvider] Search error:`, sanitizeLog(err instanceof Error ? err.message : String(err), apiKey));
      }
      return directoryResources.slice(0, limit);
    } finally {
      clearTimeout(timer);
    }
  }
}
