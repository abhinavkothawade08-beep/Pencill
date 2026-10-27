import {
  QueryProviderTarget,
  SearchQueryItem,
  NormalizedResourceCandidate,
  ProviderCapabilities,
  ProviderExecutionOptions,
  ProviderHealthStatus,
  ProviderSearchResult,
} from '../types';
import { ResourceProviderAdapter } from './base-adapter';
import { educatorRegistry, EducatorRegistry } from '../educators/educator-registry';
import { EducatorMatcher } from '../educators/educator-matcher';
import { ChannelVerifier } from '../educators/channel-verifier';
import { tokenize, stemWord } from '../utils/text-utils';
import { normalizeCandidate } from '../normalization/normalizer';
import { extractYouTubeVideoId, extractYouTubePlaylistId } from '../utils/url-utils';
import { buildYouTubeVideoUrl } from '../normalization/url-normalizer';

/**
 * Curated Directory Provider Adapter (Resource Engine 2.0)
 * 
 * Serves verified flagship learning resources and curated playlists from
 * the Master YouTube Educator Directory. Operates deterministically with
 * zero external network dependency, providing an instantaneous high-trust
 * candidate pool and resilient offline fallback.
 */
export class CuratedDirectoryAdapter implements ResourceProviderAdapter {
  readonly id: QueryProviderTarget = 'curated_directory';
  readonly name = 'Master Educator Directory Adapter';

  readonly capabilities: ProviderCapabilities = {
    supportedModalities: ['video', 'monograph', 'practice'],
    maxBatchSize: 20,
    supportsCancellation: false,
    supportsPlaylistExpansion: true,
    quotaLimited: false,
    requiresApiKey: false,
  };

  private readonly registry: EducatorRegistry;

  constructor(registry?: EducatorRegistry) {
    this.registry = registry || educatorRegistry;
  }

  public supportsQuery(query: SearchQueryItem): boolean {
    return query.providerCompatibility.includes('curated_directory');
  }

  public getHealthStatus(): ProviderHealthStatus {
    const totalEducators = this.registry.getAll().length;
    return {
      available: totalEducators > 0,
      quotaExhausted: false,
      cooldownRemainingMs: 0,
      circuitBreakerState: 'CLOSED',
      reason: totalEducators === 0 ? 'Master Educator Directory is empty' : undefined,
    };
  }

  public async search(
    query: SearchQueryItem,
    options: ProviderExecutionOptions = {}
  ): Promise<ProviderSearchResult> {
    const startTime = Date.now();
    const candidates: NormalizedResourceCandidate[] = [];
    const seenUrls = new Set<string>();

    const normQ = query.queryString.toLowerCase().trim();
    const queryTokens = tokenize(normQ);

    const formatStopWords = new Set([
      'tutorial', 'course', 'lecture', 'video', 'playlist', 'learn', 'full',
      'introduction', 'intro', 'basics', 'basic', 'explained', 'explanat',
      'explanation', 'walkthrough', 'demonstration', 'demonstr', 'complete',
      'comprehensive', 'foundations', 'concepts', 'concept', 'guide', 'mastery',
      'step', 'in-depth', 'primer', 'series', 'study', 'notes', 'best', 'overview',
      'topic', 'topics', 'module', 'modules'
    ]);

    const contentTokens = new Set<string>(
      Array.from(queryTokens).filter((t) => {
        const s = stemWord(t);
        return !formatStopWords.has(t) && !formatStopWords.has(s) && t.length > 2;
      })
    );

    // 1. If target channel hint is provided, locate educator
    let targetedEducator = query.channelOrSourceHint
      ? this.registry.getByChannelId(query.channelOrSourceHint) ||
        this.registry.getByHandle(query.channelOrSourceHint) ||
        this.registry.getById(query.channelOrSourceHint)
      : undefined;

    // 2. Query verified learning resources from the registry
    const verifiedResources = this.registry.getVerifiedLearningResources();

    for (const r of verifiedResources) {
      if (seenUrls.has(r.Resource_URL.toLowerCase())) continue;

      const titleTokens = tokenize(r.Resource_Title);
      const topicTokens = tokenize(r.Covered_Topics);
      const subTokens = tokenize(r.Subject);
      const combinedResourceTokens = new Set([...titleTokens, ...topicTokens, ...subTokens]);
      const combinedResourceStems = new Set(Array.from(combinedResourceTokens).map(stemWord));

      // Check token overlap
      let matches = false;
      if (contentTokens.size > 0) {
        let overlapCount = 0;
        for (const ct of contentTokens) {
          const cStem = stemWord(ct);
          if (
            combinedResourceTokens.has(ct) ||
            combinedResourceStems.has(ct) ||
            combinedResourceStems.has(cStem) ||
            Array.from(combinedResourceTokens).some((rt) => rt.includes(ct) || ct.includes(rt))
          ) {
            overlapCount++;
          }
        }
        const requiredOverlap = contentTokens.size <= 2 ? 1 : Math.min(2, Math.ceil(contentTokens.size * 0.4));
        if (overlapCount >= requiredOverlap) {
          matches = true;
        }
      } else {
        // Fallback for short query
        matches = Array.from(queryTokens).some((qt: string) => combinedResourceTokens.has(qt));
      }

      // If targeted educator is specified, ensure match (by ID or YouTube Channel ID)
      if (
        targetedEducator &&
        r.Educator_ID !== targetedEducator.Educator_ID &&
        (!r.YouTube_Channel_ID || r.YouTube_Channel_ID !== targetedEducator.YouTube_Channel_ID)
      ) {
        matches = false;
      }

      if (matches) {
        seenUrls.add(r.Resource_URL.toLowerCase());

        const edu =
          (targetedEducator &&
            (targetedEducator.Educator_ID === r.Educator_ID ||
              targetedEducator.YouTube_Channel_ID === r.YouTube_Channel_ID))
            ? targetedEducator
            : (r.YouTube_Channel_ID ? this.registry.getByChannelId(r.YouTube_Channel_ID) : undefined) ||
              this.registry.getById(r.Educator_ID);
        const videoId = r.YouTube_Video_ID_or_Playlist_ID || extractYouTubeVideoId(r.Resource_URL) || r.Resource_ID;
        const isPlaylist = r.Resource_Type.toLowerCase().includes('playlist') || r.Resource_URL.includes('list=');

        const norm = normalizeCandidate({
          provider: 'curated_directory',
          externalId: videoId,
          title: r.Resource_Title,
          description: `Verified directory resource covering ${r.Covered_Topics}. ${r.Research_Notes || ''}`.trim(),
          rawUrl: r.Resource_URL,
          modality: 'video',
          creator: edu
            ? {
                name: edu.Educator_Name,
                channelId: edu.YouTube_Channel_ID || undefined,
                authorId: edu.Educator_ID,
                url: edu.Official_Channel_URL || undefined,
              }
            : undefined,
          durationSeconds: r.Complete_Course_Status === 'Yes' ? 3600 * 3 : 1800,
          isEmbeddable: true,
          verificationStatus: 'verified_channel',
          playlist: isPlaylist
            ? {
                isPlaylist: true,
                playlistId: videoId,
                playlistItemCount: 15,
              }
            : undefined,
          provenance: {
            queryId: query.id,
            queryString: query.queryString,
            intent: query.intent,
          },
          rawMetadata: {
            isVerifiedEducator: true,
            educatorId: edu?.Educator_ID,
            educatorName: edu?.Educator_Name,
            channelName: edu?.YouTube_Channel_Name,
            channelId: edu?.YouTube_Channel_ID,
            syllabusCoverage: r.Syllabus_Coverage,
            discoverySource: 'curated_directory',
            selectionExplanation: `Sourced from Master Educator Directory: ${edu?.Educator_Name || r.Educator_ID} for ${r.Subject}`,
          },
        });

        if (norm.candidate) {
          candidates.push(norm.candidate);
        }
      }
    }

    // 3. Query representative videos/playlists from educator when targeted
    if (targetedEducator && candidates.length < (options.limit || 5)) {
      const allEducators = [targetedEducator];

      for (const edu of allEducators) {
        const urlsToInspect = [
          ...(edu.Representative_Video_URLs || []),
          ...(edu.Relevant_Playlist_URLs || []),
        ];
        if (urlsToInspect.length === 0) {
          continue;
        }

        // Check if educator matches query domain/subject
        const eduSubjects = EducatorRegistry.parseTokens(edu.Subjects);
        const eduSubjTokens = new Set(eduSubjects.flatMap((s) => Array.from(tokenize(s))));
        const eduSubjStems = new Set(Array.from(eduSubjTokens).map(stemWord));

        let isEducatorRelevant = false;
        if (contentTokens.size > 0) {
          for (const ct of contentTokens) {
            const cStem = stemWord(ct);
            if (eduSubjTokens.has(ct) || eduSubjStems.has(ct) || eduSubjStems.has(cStem)) {
              isEducatorRelevant = true;
              break;
            }
          }
        }

        if (targetedEducator || isEducatorRelevant) {
          for (const repUrl of urlsToInspect) {
            if (!repUrl || seenUrls.has(repUrl.toLowerCase())) continue;
            seenUrls.add(repUrl.toLowerCase());

            const playlistId = extractYouTubePlaylistId(repUrl);
            const videoId = extractYouTubeVideoId(repUrl) || (playlistId ? playlistId : `rep_${edu.Educator_ID}_1`);
            const isPlaylist = Boolean(playlistId || repUrl.includes('list='));

            const norm = normalizeCandidate({
              provider: 'curated_directory',
              externalId: videoId,
              title: `${edu.YouTube_Channel_Name}: Flagship Tutorial on ${query.targetConcept || edu.Subjects.split(';')[0].trim()}`,
              description: edu.Teaching_Specialization || edu.Subject_Expertise_Evidence || '',
              rawUrl: repUrl,
              modality: 'video',
              creator: {
                name: edu.Educator_Name,
                channelId: edu.YouTube_Channel_ID || undefined,
                authorId: edu.Educator_ID,
                url: edu.Official_Channel_URL || undefined,
              },
              durationSeconds: isPlaylist ? 7200 : 2400,
              isEmbeddable: true,
              verificationStatus: 'verified_channel',
              playlist: isPlaylist
                ? {
                    isPlaylist: true,
                    playlistId: playlistId || videoId,
                    playlistItemCount: 12,
                  }
                : undefined,
              provenance: {
                queryId: query.id,
                queryString: query.queryString,
                intent: query.intent,
              },
              rawMetadata: {
                isVerifiedEducator: true,
                educatorId: edu.Educator_ID,
                educatorName: edu.Educator_Name,
                channelName: edu.YouTube_Channel_Name,
                channelId: edu.YouTube_Channel_ID,
                discoverySource: 'curated_directory',
                selectionExplanation: `Sourced from verified directory educator: ${edu.Educator_Name} (${edu.YouTube_Channel_Name})`,
              },
            });

            if (norm.candidate) {
              candidates.push(norm.candidate);
            }
          }
        }
      }
    }

    const limit = options.limit || 8;
    const finalCandidates = candidates.slice(0, limit);

    return {
      provider: 'curated_directory',
      query: query.queryString,
      candidates: finalCandidates,
      metadata: {
        latencyMs: Date.now() - startTime,
        cacheHit: false,
        totalFetched: finalCandidates.length,
      },
    };
  }
}
