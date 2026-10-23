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
import { buildArxivUrls } from '../normalization/url-normalizer';

const ARXIV_QUERY_ENDPOINT = 'https://export.arxiv.org/api/query';

export interface ArXivAdapterConfig {
  fetchFn?: typeof fetch;
  circuitBreakerConfig?: CircuitBreakerConfig;
  cacheConfig?: CacheConfig;
  defaultTimeoutMs?: number;
}

interface RawArXivEntry {
  id: string; // e.g. "http://arxiv.org/abs/2103.12345v1"
  title: string;
  summary?: string;
  publishedAt?: string;
  author?: string;
  pdfUrl?: string;
}

/**
 * arXiv Scientific Preprints & Monographs Adapter (Resource Engine 2.0)
 * 
 * Retrieves authoritative preprints and lecture notes across Physics,
 * Mathematics, Computer Science, and Quantitative Biology.
 */
export class ArXivAdapterV2 implements ResourceProviderAdapter {
  readonly id: QueryProviderTarget = 'arxiv';
  readonly name = 'arXiv Academic Preprint Adapter';

  readonly capabilities: ProviderCapabilities = {
    supportedModalities: ['paper', 'monograph'],
    maxBatchSize: 20,
    supportsCancellation: true,
    supportsPlaylistExpansion: false,
    quotaLimited: false,
    requiresApiKey: false,
  };

  private readonly fetchFn: typeof fetch;
  private readonly defaultTimeoutMs: number;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly cache: InMemoryCache<NormalizedResourceCandidate[]>;

  constructor(config: ArXivAdapterConfig = {}) {
    this.fetchFn = config.fetchFn || globalThis.fetch;
    this.defaultTimeoutMs = config.defaultTimeoutMs ?? 8000;

    this.circuitBreaker = new CircuitBreaker('arXiv', config.circuitBreakerConfig ?? {
      failureThreshold: 3,
      cooldownMs: 30_000,
    });

    this.cache = new InMemoryCache<NormalizedResourceCandidate[]>(config.cacheConfig ?? {
      defaultTtlMs: 30 * 60 * 1000, // 30 min cache
      maxEntries: 200,
    });
  }

  public supportsQuery(query: SearchQueryItem): boolean {
    return (
      query.providerCompatibility.includes('arxiv') ||
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
        'arXiv',
        503,
        `arXiv circuit breaker active: ${breaker.reason || 'cooldown in effect'}`,
        ARXIV_QUERY_ENDPOINT
      );
    }

    // 2. Check Cache
    const limit = options.limit ?? 10;
    const cacheKey = InMemoryCache.createKey('arxiv', {
      q: query.queryString,
      limit,
    });

    if (!options.bypassCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return {
          provider: 'arxiv',
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
    const cleanTerms = (query.targetConcept || query.queryString)
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2)
      .slice(0, 4)
      .map((t) => `all:${encodeURIComponent(t)}`)
      .join('+AND+');

    const url = `${ARXIV_QUERY_ENDPOINT}?search_query=${cleanTerms}&start=0&max_results=${Math.min(limit, 20)}&sortBy=relevance&sortOrder=descending`;

    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    try {
      const entries = await executeWithRetry(
        async () => {
          let response: Response;
          try {
            response = await this.fetchFn(url, {
              signal: controller.signal,
              headers: {
                Accept: 'application/atom+xml, application/xml, text/xml',
                'User-Agent': 'PencillEducationalPlatform/2.0 (academic-curation; mailto:support@pencill.org)',
              },
            });
          } catch (fetchErr: unknown) {
            if (controller.signal.aborted) {
              throw new ProviderTimeoutError('arXiv', `arXiv request timed out after ${timeoutMs}ms`, ARXIV_QUERY_ENDPOINT);
            }
            throw new ProviderNetworkError('arXiv', 'Network failure during arXiv query', fetchErr, ARXIV_QUERY_ENDPOINT);
          }

          if (!response.ok) {
            throw new ProviderResponseError('arXiv', response.status, `arXiv HTTP ${response.status}`, ARXIV_QUERY_ENDPOINT);
          }

          let xmlText: string;
          try {
            xmlText = await response.text();
          } catch (textErr: unknown) {
            throw new ProviderMalformedResponseError('arXiv', 'Failed to read XML text from arXiv response', textErr, ARXIV_QUERY_ENDPOINT);
          }

          return this.parseAtomXml(xmlText);
        },
        { maxRetries: 1, signal: options.signal }
      );

      // 4. Normalize Results
      const candidates: NormalizedResourceCandidate[] = [];

      for (const entry of entries) {
        const arxivId = extractArxivId(entry.id);
        if (!arxivId) continue;

        const { canonicalUrl, pdfUrl } = buildArxivUrls(arxivId);
        const modality = query.preferredModality === 'monograph' ? 'monograph' : 'paper';

        const norm = normalizeCandidate({
          provider: 'arxiv',
          externalId: arxivId,
          title: entry.title,
          description: entry.summary,
          rawUrl: canonicalUrl,
          sourceUrl: pdfUrl,
          modality,
          creator: entry.author ? { name: entry.author } : undefined,
          publishedAt: entry.publishedAt,
          verificationStatus: 'unverified_candidate',
          provenance: {
            queryId: query.id,
            queryString: query.queryString,
            intent: query.intent,
          },
          rawMetadata: {
            arxivId,
            isDirectPdf: true,
          },
        });

        if (norm.candidate) {
          candidates.push(norm.candidate);
        } else if (norm.error) {
          partialFailures.push(`arXiv ${arxivId}: ${norm.error}`);
        }
      }

      const deduplicated = deduplicateCandidates(candidates);

      // Record success
      this.circuitBreaker.recordSuccess();

      // Cache result
      this.cache.set(cacheKey, deduplicated);

      return {
        provider: 'arxiv',
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

  private parseAtomXml(xml: string): RawArXivEntry[] {
    const rawEntries = xml.split('<entry>').slice(1);
    const results: RawArXivEntry[] = [];

    for (const rawEntry of rawEntries) {
      const entryText = rawEntry.split('</entry>')[0];

      const titleMatch = entryText.match(/<title>([\s\S]*?)<\/title>/);
      const summaryMatch = entryText.match(/<summary>([\s\S]*?)<\/summary>/);
      const idMatch = entryText.match(/<id>([\s\S]*?)<\/id>/);
      const publishedMatch = entryText.match(/<published>([\s\S]*?)<\/published>/);
      const authorMatch = entryText.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/);

      if (!titleMatch || !idMatch) continue;

      const title = titleMatch[1].replace(/\s+/g, ' ').trim();
      const id = idMatch[1].trim();
      const summary = summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim() : undefined;
      const publishedAt = publishedMatch ? publishedMatch[1].trim() : undefined;
      const author = authorMatch ? authorMatch[1].trim() : undefined;

      results.push({
        id,
        title,
        summary,
        publishedAt,
        author,
      });
    }

    return results;
  }
}

function extractArxivId(rawId: string): string | null {
  // e.g. "http://arxiv.org/abs/2103.12345v1" -> "2103.12345"
  const clean = rawId.split('/abs/')[1] || rawId.split('/').pop() || '';
  if (!clean) return null;
  // Remove version suffix (v1, v2)
  return clean.replace(/v\d+$/i, '').trim();
}
