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
import { CURATED_REPOSITORY_INDEX } from '@/curator/curatedRepositoryIndex';
import { CuratorResource } from '@/curator/types';
import { AcademicNotesProvider } from './academic-notes-provider';
import { normalizeCandidate } from '../normalization/normalizer';
import { tokenize, stemWord } from '../utils/text-utils';
import { canonicalizeUrl } from '../utils/url-utils';

export interface AcademicRepositoryAdapterOptions {
  allowedRepositories?: string[];
  enableWikimedia?: boolean;
}

/**
 * Academic & Open Educational Repository Adapter (Resource Engine 2.0)
 * 
 * Unifies verified educational repositories:
 * - NCERT official textbooks & exemplars
 * - NPTEL open courseware
 * - MIT OpenCourseWare
 * - Khan Academy
 * - OpenStax University textbooks
 * - SWAYAM national curriculum handouts
 * - Official developer documentation (Python, React, MDN JavaScript, Pro Git, PostgreSQL)
 * - Academic monographs (Wikimedia / Wikipedia academic synthesis)
 * 
 * Enforces topic relevance matching so that Physics textbooks are never returned
 * for Computer Science, and vice versa.
 */
export class AcademicRepositoryAdapter implements ResourceProviderAdapter {
  readonly id: QueryProviderTarget = 'academic_notes';
  readonly name = 'Academic & Educational Repository Adapter';

  readonly capabilities: ProviderCapabilities = {
    supportedModalities: ['monograph', 'documentation', 'practice', 'video', 'paper'],
    maxBatchSize: 20,
    supportsCancellation: false,
    supportsPlaylistExpansion: false,
    quotaLimited: false,
    requiresApiKey: false,
  };

  private readonly academicNotesProvider: AcademicNotesProvider;
  private readonly defaultAllowedRepos?: Set<string>;

  constructor(options?: AcademicRepositoryAdapterOptions) {
    this.academicNotesProvider = new AcademicNotesProvider();
    if (options?.allowedRepositories && options.allowedRepositories.length > 0) {
      this.defaultAllowedRepos = new Set(options.allowedRepositories.map((r) => r.toLowerCase().trim()));
    }
  }

  public supportsQuery(query: SearchQueryItem): boolean {
    return (
      query.providerCompatibility.includes('academic_notes') ||
      query.providerCompatibility.includes('curated_directory') ||
      query.preferredModality === 'monograph' ||
      query.preferredModality === 'documentation' ||
      query.preferredModality === 'practice'
    );
  }

  public getHealthStatus(): ProviderHealthStatus {
    return {
      available: true,
      quotaExhausted: false,
      cooldownRemainingMs: 0,
      circuitBreakerState: 'CLOSED',
    };
  }

  public async search(
    query: SearchQueryItem,
    options: ProviderExecutionOptions = {}
  ): Promise<ProviderSearchResult> {
    const startTime = Date.now();
    const candidates: NormalizedResourceCandidate[] = [];
    const seenUrls = new Set<string>();

    const rawQuery = query.queryString.toLowerCase().trim();
    const targetConcept = (query.targetConcept || '').toLowerCase().trim();
    const queryTokens = tokenize(`${rawQuery} ${targetConcept}`);

    // Filter out generic search format filler
    const formatStopWords = new Set([
      'tutorial', 'course', 'lecture', 'video', 'playlist', 'learn', 'full',
      'introduction', 'intro', 'basics', 'basic', 'explained', 'explanat',
      'walkthrough', 'demonstration', 'demonstr', 'complete', 'comprehensive',
      'notes', 'readings', 'handout', 'monograph', 'pdf', 'reference', 'study',
      'material', 'textbook', 'chapter', 'guide', 'official'
    ]);

    const contentTokens = new Set<string>();
    for (const t of queryTokens) {
      const stem = stemWord(t);
      if (!formatStopWords.has(t) && !formatStopWords.has(stem) && t.length > 2) {
        contentTokens.add(t);
        contentTokens.add(stem);
      }
    }

    // Determine allowed repositories from options or default
    const allowedRepos = (options as any).allowedRepositories
      ? new Set<string>(((options as any).allowedRepositories as string[]).map((r) => r.toLowerCase().trim()))
      : this.defaultAllowedRepos;

    // Helper: Checks repository allowance
    const isRepoAllowed = (repoName: string): boolean => {
      if (!allowedRepos || allowedRepos.size === 0) return true;
      const lower = repoName.toLowerCase();
      return Array.from(allowedRepos).some((r) => lower.includes(r) || r.includes(lower));
    };

    // ------------------------------------------------------------------------
    // 1. Search Curated Static Repositories (NCERT, NPTEL, Khan, MIT OCW, OpenStax, SWAYAM)
    // ------------------------------------------------------------------------
    for (const item of CURATED_REPOSITORY_INDEX) {
      if (!isRepoAllowed(item.source)) continue;

      // TOPIC RELEVANCE GUARD: Item MUST match at least one focal content token
      const itemText = `${item.title} ${item.auditNotes || ''}`.toLowerCase();
      const itemTokens = tokenize(itemText);
      const itemStems = new Set(Array.from(itemTokens).map(stemWord));

      let hasMatch = false;
      if (contentTokens.size > 0) {
        for (const ct of contentTokens) {
          if (itemTokens.has(ct) || itemStems.has(ct)) {
            hasMatch = true;
            break;
          }
        }
      }

      if (!hasMatch) continue;

      const canonUrl = canonicalizeUrl(item.url);
      if (seenUrls.has(canonUrl.toLowerCase())) continue;
      seenUrls.add(canonUrl.toLowerCase());

      const candidateModality = item.modality === 'video' ? 'video' : item.modality === 'practice' ? 'practice' : 'monograph';
      const norm = normalizeCandidate({
        provider: 'academic_notes',
        externalId: item.id,
        title: item.title,
        description: item.auditNotes || `Curated resource from ${item.source}`,
        rawUrl: item.url,
        modality: candidateModality,
        creator: {
          name: item.source,
        },
        durationSeconds: item.modality === 'video' ? 2400 : 1800,
        publishedAt: item.publishedYear ? `${item.publishedYear}-01-01T00:00:00Z` : undefined,
        language: item.language || 'en',
        isEmbeddable: true,
        verificationStatus: 'verified_channel',
        provenance: {
          queryId: query.id,
          queryString: query.queryString,
          intent: query.intent,
        },
        rawMetadata: {
          repository: item.source,
          hasCaptions: item.hasCaptions,
          hasTranscript: item.hasTranscript,
          publishedYear: item.publishedYear,
          qualityScore: item.qualityScore,
          verifiedAt: item.verifiedAt,
          discoverySource: 'curated_repository_index',
        },
      });

      if (norm.candidate) {
        candidates.push(norm.candidate);
      }
    }

    // ------------------------------------------------------------------------
    // 2. Search AcademicNotesProvider Curated NCERT & Official Documentation
    // ------------------------------------------------------------------------
    try {
      const curriculumItems = (this.academicNotesProvider as any).fetchCurriculumAndOfficialResources(
        `${rawQuery} ${targetConcept}`,
        options.limit || 8,
        { examContext: query.targetExam }
      );

      if (Array.isArray(curriculumItems)) {
        for (const item of curriculumItems) {
          const canonUrl = canonicalizeUrl(item.canonicalUrl || item.sourceUrl);
          if (seenUrls.has(canonUrl.toLowerCase())) continue;
          if (!isRepoAllowed(item.sourceName || item.metadata?.publisher || '')) continue;

          seenUrls.add(canonUrl.toLowerCase());

          const isDoc = item.type === 'official_documentation';
          const isTextbook = item.type === 'textbook';
          const candModality = isDoc ? 'documentation' : isTextbook ? 'monograph' : 'monograph';

          const norm = normalizeCandidate({
            provider: 'academic_notes',
            externalId: item.id,
            title: item.title,
            description: item.description,
            rawUrl: item.canonicalUrl || item.sourceUrl,
            modality: candModality,
            creator: {
              name: item.sourceName || item.authorOrChannel || 'Official Educational Publisher',
            },
            durationSeconds: (item.durationMinutes || 30) * 60,
            language: item.language || 'en',
            isEmbeddable: true,
            verificationStatus: 'verified_channel',
            provenance: {
              queryId: query.id,
              queryString: query.queryString,
              intent: query.intent,
            },
            rawMetadata: {
              repository: item.sourceName,
              hasCaptions: false,
              hasTranscript: true,
              publishedYear: 2024,
              qualityScore: item.score?.overall || 95,
              discoverySource: 'official_documentation_catalog',
            },
          });

          if (norm.candidate) {
            candidates.push(norm.candidate);
          }
        }
      }
    } catch {
      // Graceful fallback if internal helper throws
    }

    // ------------------------------------------------------------------------
    // 3. Fallback: Search Wikimedia/Wikipedia Academic Synthesis when appropriate
    // ------------------------------------------------------------------------
    if (candidates.length < 2 && typeof window === 'undefined') {
      try {
        const wikiItems = await (this.academicNotesProvider as any).fetchWikimediaNotes(
          targetConcept || rawQuery,
          2,
          options.timeoutMs || 4000,
          { examContext: query.targetExam }
        );

        if (Array.isArray(wikiItems)) {
          for (const item of wikiItems) {
            const canonUrl = canonicalizeUrl(item.canonicalUrl || item.sourceUrl);
            if (seenUrls.has(canonUrl.toLowerCase())) continue;
            seenUrls.add(canonUrl.toLowerCase());

            const norm = normalizeCandidate({
              provider: 'academic_notes',
              externalId: item.id,
              title: item.title,
              description: item.description,
              rawUrl: item.canonicalUrl || item.sourceUrl,
              modality: 'monograph',
              creator: {
                name: 'Wikimedia Academic Monograph',
              },
              durationSeconds: (item.durationMinutes || 25) * 60,
              language: 'en',
              isEmbeddable: true,
              verificationStatus: 'verified_channel',
              provenance: {
                queryId: query.id,
                queryString: query.queryString,
                intent: query.intent,
              },
              rawMetadata: {
                repository: 'Wikimedia Open Knowledge',
                hasCaptions: false,
                hasTranscript: true,
                qualityScore: item.score?.overall || 82,
                discoverySource: 'wikimedia_academic_notes',
              },
            });

            if (norm.candidate) {
              candidates.push(norm.candidate);
            }
          }
        }
      } catch {
        // Safe offline bypass
      }
    }

    const limit = options.limit || 8;
    const finalCandidates = candidates.slice(0, limit);

    return {
      provider: 'academic_notes',
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
