import {
  QueryProviderTarget,
  SearchQueryItem,
  NormalizedResourceCandidate,
  ProviderCapabilities,
  ProviderExecutionOptions,
  ProviderHealthStatus,
  ProviderSearchResult,
  ProviderError,
  ProviderTimeoutError,
  ProviderNetworkError,
  ProviderResponseError,
  ProviderMalformedResponseError,
} from '../types';
import { ResourceProviderAdapter } from './base-adapter';
import { CircuitBreaker, CircuitBreakerConfig } from '../resilience/circuit-breaker';
import { InMemoryCache, CacheConfig } from '../resilience/cache';
import { executeWithRetry } from '../resilience/retry-policy';
import { normalizeCandidate, deduplicateCandidates } from '../normalization/normalizer';
import { validateAndCanonicalizeUrl } from '../normalization/url-normalizer';

const OPENALEX_WORKS_ENDPOINT = 'https://api.openalex.org/works';

export interface OpenAlexAdapterConfig {
  fetchFn?: typeof fetch;
  circuitBreakerConfig?: CircuitBreakerConfig;
  cacheConfig?: CacheConfig;
  defaultTimeoutMs?: number;
  contactEmail?: string;
}

interface RawOpenAlexWork {
  id: string; // e.g. "https://openalex.org/W2741809807"
  doi?: string;
  title?: string;
  display_name?: string;
  publication_year?: number;
  publication_date?: string;
  type?: string;
  open_access?: {
    is_oa?: boolean;
    oa_url?: string;
    oa_status?: string;
  };
  primary_location?: {
    source?: {
      display_name?: string;
      type?: string;
    };
    landing_page_url?: string;
    pdf_url?: string;
    is_oa?: boolean;
  };
  authorships?: Array<{
    author?: {
      id?: string;
      display_name?: string;
    };
    institutions?: Array<{
      display_name?: string;
    }>;
  }>;
  abstract_inverted_index?: Record<string, number[]>;
}

/**
 * OpenAlex Academic Repository Adapter (Resource Engine 2.0)
 * 
 * Retrieves verified open-access scholarly publications, university course notes,
 * and academic monographs from the open scholarly corpus.
 */
export class OpenAlexAdapterV2 implements ResourceProviderAdapter {
  readonly id: QueryProviderTarget = 'openalex';
  readonly name = 'OpenAlex Scholarly Works Adapter';

  readonly capabilities: ProviderCapabilities = {
    supportedModalities: ['monograph', 'paper', 'documentation'],
    maxBatchSize: 25,
    supportsCancellation: true,
    supportsPlaylistExpansion: false,
    quotaLimited: false, // OpenAlex polite pool has generous rate limits without rigid daily quota
    requiresApiKey: false,
  };

  private readonly fetchFn: typeof fetch;
  private readonly defaultTimeoutMs: number;
  private readonly contactEmail: string;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly cache: InMemoryCache<NormalizedResourceCandidate[]>;

  constructor(config: OpenAlexAdapterConfig = {}) {
    this.fetchFn = config.fetchFn || globalThis.fetch;
    this.defaultTimeoutMs = config.defaultTimeoutMs ?? 8000;
    this.contactEmail = config.contactEmail || 'support@pencill.org';

    this.circuitBreaker = new CircuitBreaker('OpenAlex', config.circuitBreakerConfig ?? {
      failureThreshold: 3,
      cooldownMs: 30_000,
    });

    this.cache = new InMemoryCache<NormalizedResourceCandidate[]>(config.cacheConfig ?? {
      defaultTtlMs: 30 * 60 * 1000, // 30 min cache for scholarly records
      maxEntries: 200,
    });
  }

  public supportsQuery(query: SearchQueryItem): boolean {
    // OpenAlex supports scholarly papers, monographs, and reading materials
    return (
      query.providerCompatibility.includes('openalex') ||
      query.providerCompatibility.includes('academic_notes')
    );
  }

  public getHealthStatus(): ProviderHealthStatus {
    const breakerStatus = this.circuitBreaker.canExecute();
    return {
      available: breakerStatus.allowed,
      quotaExhausted: false,
      cooldownRemainingMs: breakerStatus.cooldownRemainingMs,
      circuitBreakerState: breakerStatus.state,
      reason: breakerStatus.reason,
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
      throw new ProviderResponseError(
        'OpenAlex',
        503,
        `OpenAlex circuit breaker active: ${breaker.reason || 'cooldown in effect'}`,
        OPENALEX_WORKS_ENDPOINT
      );
    }

    // 2. Check Cache
    const limit = options.limit ?? 10;
    const cacheKey = InMemoryCache.createKey('openalex', {
      q: query.queryString,
      limit,
    });

    if (!options.bypassCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return {
          provider: 'openalex',
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

    // 3. Build API Request
    const cleanSearch = query.targetConcept || query.queryString;
    const url = new URL(OPENALEX_WORKS_ENDPOINT);
    url.searchParams.set('search', cleanSearch);
    url.searchParams.set('filter', 'is_oa:true'); // Strict Open Access filter
    url.searchParams.set('per-page', String(Math.min(limit, 25)));
    url.searchParams.set('sort', 'relevance_score:desc');

    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    try {
      const works = await executeWithRetry(
        async () => {
          let response: Response;
          try {
            response = await this.fetchFn(url.toString(), {
              signal: controller.signal,
              headers: {
                Accept: 'application/json',
                'User-Agent': `PencillEducationalPlatform/2.0 (academic-curation; mailto:${this.contactEmail})`,
              },
            });
          } catch (fetchErr: unknown) {
            if (controller.signal.aborted) {
              throw new ProviderTimeoutError('OpenAlex', `OpenAlex request timed out after ${timeoutMs}ms`, OPENALEX_WORKS_ENDPOINT);
            }
            throw new ProviderNetworkError('OpenAlex', 'Network failure during OpenAlex works request', fetchErr, OPENALEX_WORKS_ENDPOINT);
          }

          if (!response.ok) {
            throw new ProviderResponseError('OpenAlex', response.status, `OpenAlex HTTP ${response.status}`, OPENALEX_WORKS_ENDPOINT);
          }

          let json: unknown;
          try {
            json = await response.json();
          } catch (jsonErr: unknown) {
            throw new ProviderMalformedResponseError('OpenAlex', 'Failed to parse JSON response from OpenAlex', jsonErr, OPENALEX_WORKS_ENDPOINT);
          }

          const parsed = json as { results?: RawOpenAlexWork[] };
          return parsed.results || [];
        },
        { maxRetries: 1, signal: options.signal }
      );

      // 4. Normalize Results
      const candidates: NormalizedResourceCandidate[] = [];

      for (const work of works) {
        const title = work.title || work.display_name;
        if (!title) continue;

        // Determine destination URL
        const rawUrl =
          work.primary_location?.pdf_url ||
          work.open_access?.oa_url ||
          work.doi ||
          work.primary_location?.landing_page_url ||
          work.id;

        const canonical = validateAndCanonicalizeUrl(rawUrl);
        if (!canonical) continue;

        // Author extraction
        const firstAuthor = work.authorships?.[0]?.author?.display_name ||
          work.primary_location?.source?.display_name ||
          'OpenAlex Scholarly Repository';

        const openAlexId = work.id.split('/').pop() || work.id;

        const modality = query.preferredModality === 'monograph' ? 'monograph' : 'paper';

        const norm = normalizeCandidate({
          provider: 'openalex',
          externalId: openAlexId,
          title,
          rawUrl: canonical,
          sourceUrl: work.primary_location?.pdf_url || canonical,
          modality,
          creator: {
            name: firstAuthor,
            url: work.authorships?.[0]?.author?.id,
          },
          publishedAt: work.publication_date || (work.publication_year ? `${work.publication_year}-01-01` : undefined),
          // Academic papers do not have video duration; leave undefined
          verificationStatus: 'unverified_candidate',
          provenance: {
            queryId: query.id,
            queryString: query.queryString,
            intent: query.intent,
          },
          rawMetadata: {
            doi: work.doi,
            openAlexType: work.type,
            isDirectPdf: Boolean(work.primary_location?.pdf_url),
          },
        });

        if (norm.candidate) {
          candidates.push(norm.candidate);
        } else if (norm.error) {
          partialFailures.push(`Work ${openAlexId}: ${norm.error}`);
        }
      }

      const deduplicated = deduplicateCandidates(candidates);

      // Record success
      this.circuitBreaker.recordSuccess();

      // Cache result
      this.cache.set(cacheKey, deduplicated);

      return {
        provider: 'openalex',
        query: query.queryString,
        candidates: deduplicated,
        partialFailures: partialFailures.length > 0 ? partialFailures : undefined,
        metadata: {
          latencyMs: Date.now() - startTime,
          cacheHit: false,
          totalFetched: deduplicated.length,
        },
      };
    } catch (err: unknown) {
      if (err instanceof ProviderError) {
        this.circuitBreaker.recordFailure(false, err.message);
      }
      throw err;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }
}
