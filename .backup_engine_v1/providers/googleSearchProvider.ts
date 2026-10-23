import { ResourceProvider, ProviderSearchOptions } from './base-provider';
import { EngineResource, EngineResourceType, ResourceDifficulty } from '../types';
import { canonicalizeUrl, extractDomain } from '../utils/url-utils';
import { calculateSourceAuthorityScore, calculateFreshnessScore } from '../utils/scoring-utils';
import { DEFAULT_ENGINE_CONFIG } from '../config/engine-config';

const GOOGLE_CUSTOM_SEARCH_ENDPOINT = 'https://www.googleapis.com/customsearch/v1';

interface GoogleSearchItem {
  title?: string;
  link?: string;
  snippet?: string;
  displayLink?: string;
  formattedUrl?: string;
  pagemap?: {
    cse_thumbnail?: Array<{ src?: string; width?: string; height?: string }>;
    cse_image?: Array<{ src?: string }>;
    metatags?: Array<Record<string, string>>;
  };
}

interface GoogleSearchResponse {
  searchInformation?: {
    totalResults?: string;
    searchTime?: number;
  };
  error?: {
    code?: number;
    message?: string;
    errors?: Array<{ message?: string; reason?: string }>;
  };
  items?: GoogleSearchItem[];
}

interface CacheEntry {
  expiresAt: number;
  data: EngineResource[];
}

// In-memory query cache to preserve quota and eliminate redundant round-trips
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

let googleCircuitBreakerUntil = 0;
let googleProjectDisabled = false;
const GOOGLE_QUOTA_COOLDOWN_MS = 5 * 60 * 1000;

export function isGoogleSearchAvailable(): boolean {
  if (googleProjectDisabled) return false;
  return Date.now() >= googleCircuitBreakerUntil;
}

export function recordGoogleSearchQuotaExhaustion(cooldownMs: number = GOOGLE_QUOTA_COOLDOWN_MS): void {
  googleCircuitBreakerUntil = Date.now() + cooldownMs;
  console.warn(`[GoogleSearchProvider] Circuit breaker tripped: Google Search API quota exhausted. Cooling down for ${Math.round(cooldownMs / 1000)}s.`);
}

export function recordGoogleProjectDisabled(reason?: string): void {
  googleProjectDisabled = true;
  console.warn(`[GoogleSearchProvider] Project does not have access to Custom Search JSON API (${reason || 'HTTP 403 Forbidden'}). Disabling provider for current process.`);
}

export function resetGoogleSearchCircuitBreakerForTesting(): void {
  googleCircuitBreakerUntil = 0;
  googleProjectDisabled = false;
}

function sanitizeLog(msg: string, key?: string): string {
  if (!key) return msg;
  return msg.split(key).join('[REDACTED_GOOGLE_KEY]');
}

export class GoogleSearchProvider implements ResourceProvider {
  readonly id = 'google-search-provider';
  readonly name = 'Google Programmable Search Engine';
  readonly providerType = 'google' as const;
  readonly supportedTypes: EngineResourceType[] = [
    'reading_material',
    'article',
    'educational_web_page',
    'pdf_lecture_notes',
    'study_notes',
    'lecture_handout',
    'official_documentation',
    'reference_guide',
    'textbook',
    'research_paper',
    'full_course',
    'practice_questions',
    'pyq',
    'question_bank',
  ];

  private getApiKey(): string | undefined {
    if (typeof window !== 'undefined') {
      console.error('[GoogleSearchProvider] Security Violation: Google Search API cannot be accessed in browser contexts.');
      return undefined;
    }
    return process.env.GOOGLE_SEARCH_API_KEY?.trim();
  }

  private getEngineId(): string | undefined {
    if (typeof window !== 'undefined') {
      return undefined;
    }
    return process.env.GOOGLE_SEARCH_ENGINE_ID?.trim();
  }

  isAvailable(): boolean {
    if (googleProjectDisabled || Date.now() < googleCircuitBreakerUntil) {
      return false;
    }
    const key = this.getApiKey();
    const cx = this.getEngineId();
    return !!key && key.length > 0 && !!cx && cx.length > 0;
  }

  getAvailabilityStatus(): { available: boolean; reason?: string; isQuotaExhausted?: boolean } {
    if (googleProjectDisabled) {
      return {
        available: false,
        reason: 'Google Programmable Search API is disabled or project lacks access to Custom Search JSON API (HTTP 403).',
      };
    }
    if (Date.now() < googleCircuitBreakerUntil) {
      return {
        available: false,
        isQuotaExhausted: true,
        reason: 'Google Programmable Search API daily quota exhausted. Provider cooling down.',
      };
    }
    const key = this.getApiKey();
    const cx = this.getEngineId();

    if (!key || key.length === 0) {
      return {
        available: false,
        reason: 'GOOGLE_SEARCH_API_KEY environment variable is not configured. Google Web discovery requires a valid API key in .env.local.',
      };
    }

    if (!cx || cx.length === 0) {
      return {
        available: false,
        reason: 'GOOGLE_SEARCH_ENGINE_ID environment variable is not configured. Google Web discovery requires a Programmable Search Engine ID (cx) in .env.local.',
      };
    }

    return { available: true };
  }

  isDirectPdfUrl(url: string): boolean {
    return isDirectPdfUrl(url);
  }

  inferWebResourceType(url: string, title?: string, snippet?: string): EngineResourceType {
    return inferWebResourceType(url, title || '', snippet);
  }

  async search(query: string, options?: ProviderSearchOptions): Promise<EngineResource[]> {
    const apiKey = this.getApiKey();
    const cx = this.getEngineId();

    if (!apiKey || !cx) {
      console.warn('[GoogleSearchProvider] Skipped search: GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_ENGINE_ID is not configured.');
      return [];
    }

    if (googleProjectDisabled || Date.now() < googleCircuitBreakerUntil) {
      return [];
    }

    const limit = Math.min(options?.limit || DEFAULT_ENGINE_CONFIG.googleWebResultsLimit, 10);
    const cacheKey = `google:${query.toLowerCase().trim()}:${limit}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const timeoutMs = options?.timeoutMs || DEFAULT_ENGINE_CONFIG.providerTimeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = new URL(GOOGLE_CUSTOM_SEARCH_ENDPOINT);
      url.searchParams.set('key', apiKey);
      url.searchParams.set('cx', cx);
      url.searchParams.set('q', query);
      url.searchParams.set('num', String(limit));
      url.searchParams.set('safe', 'active');

      const res = await fetch(url.toString(), {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`[GoogleSearchProvider] HTTP ${res.status}:`, sanitizeLog(errorText.slice(0, 200), apiKey));
        if (res.status === 403) {
          if (errorText.toLowerCase().includes('not have access') || errorText.toLowerCase().includes('disabled')) {
            recordGoogleProjectDisabled(errorText.slice(0, 100));
          } else {
            recordGoogleSearchQuotaExhaustion();
          }
        } else if (res.status === 429) {
          recordGoogleSearchQuotaExhaustion();
        }
        return [];
      }

      const data = (await res.json()) as GoogleSearchResponse;
      if (data.error) {
        console.warn(`[GoogleSearchProvider] API error:`, sanitizeLog(data.error.message || 'Unknown Google API error', apiKey));
        if (data.error.code === 403) {
          recordGoogleProjectDisabled(data.error.message);
        } else if (data.error.code === 429) {
          recordGoogleSearchQuotaExhaustion();
        }
        return [];
      }

      const items = data.items || [];
      const resources: EngineResource[] = [];

      for (const item of items) {
        if (!item.link || !item.title) continue;

        const canonical = canonicalizeUrl(item.link);
        if (!canonical.startsWith('http://') && !canonical.startsWith('https://')) continue;

        const domain = extractDomain(canonical);
        if (!domain || isExcludedDomain(domain)) continue;

        const inferredType = inferWebResourceType(item.link, item.title, item.snippet);
        const sourceName = item.displayLink || domain;
        const authorityScore = calculateSourceAuthorityScore(canonical, sourceName);

        // Extract metadata from pagemap if present
        const metatags = item.pagemap?.metatags?.[0] || {};
        const author = metatags.author || metatags['article:author'];
        const publishedDate = metatags['article:published_time'] || metatags['date'] || metatags['pubdate'];
        const freshnessScore = calculateFreshnessScore(publishedDate);

        const thumbnail =
          item.pagemap?.cse_thumbnail?.[0]?.src ||
          item.pagemap?.cse_image?.[0]?.src;

        const isDirectPdf = isDirectPdfUrl(item.link || canonical);

        const resource: EngineResource = {
          id: `google_web_${Math.abs(hashString(canonical))}`,
          title: item.title.trim(),
          description: (item.snippet || '').trim(),
          type: inferredType,
          canonicalUrl: canonical,
          sourceUrl: item.link,
          sourceName,
          provider: 'google',
          authorOrChannel: author || sourceName,
          thumbnailUrl: thumbnail,
          durationMinutes: inferredType === 'full_course' ? 90 : inferredType === 'practice_questions' ? 45 : 30,
          difficulty: inferDifficulty(options?.difficulty, item.title, item.snippet),
          language: 'en',
          score: {
            overall: Math.min(96, Math.round(authorityScore * 0.45 + freshnessScore * 0.25 + 28)),
            relevance: 85,
            educationalValue: Math.min(authorityScore + 4, 94),
            structureCompleteness: inferredType === 'full_course' ? 92 : 82,
            freshness: freshnessScore,
            explanation: `Discovered via Google Programmable Search from ${sourceName}`,
          },
          tags: [inferredType, 'google', domain],
          examCategory: options?.examContext,
          metadata: {
            domain,
            displayLink: item.displayLink,
            publishedDate,
            isDirectPdf,
            downloadUrl: isDirectPdf ? (item.link || canonical) : undefined,
          },
          discoveredAt: new Date().toISOString(),
          // Compatibility aliases
          url: canonical,
          author: author || sourceName,
          publishedAt: publishedDate,
        };

        resources.push(resource);
        if (resources.length >= limit) break;
      }

      setCache(cacheKey, resources);
      return resources;
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'AbortError') {
        console.warn(`[GoogleSearchProvider] Search timed out after ${timeoutMs}ms for query: "${query}"`);
      } else {
        console.warn(`[GoogleSearchProvider] Search error:`, sanitizeLog(err instanceof Error ? err.message : String(err), apiKey));
      }
      return [];
    } finally {
      clearTimeout(timer);
    }
  }
}

function isDirectPdfUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();
    return pathname.endsWith('.pdf') || pathname.includes('.pdf/');
  } catch {
    const clean = url.split('?')[0].split('#')[0].toLowerCase();
    return clean.endsWith('.pdf');
  }
}

function inferWebResourceType(url: string, title: string, snippet?: string): EngineResourceType {
  const lowerUrl = url.toLowerCase();
  const lowerText = `${title} ${snippet || ''}`.toLowerCase();
  const isPdf = isDirectPdfUrl(url);

  // 1. Direct PDFs are classified as pdf_lecture_notes or research_paper
  if (isPdf) {
    if (lowerUrl.includes('arxiv.org') || lowerText.includes('research paper') || lowerText.includes('journal')) {
      return 'research_paper';
    }
    return 'pdf_lecture_notes';
  }

  // 2. Official Documentation
  if (
    lowerText.includes('official documentation') ||
    lowerText.includes('api reference') ||
    lowerUrl.includes('docs.') ||
    lowerUrl.includes('/docs/') ||
    lowerUrl.includes('/documentation/') ||
    lowerUrl.includes('developer.mozilla.org') ||
    lowerUrl.includes('docs.python.org')
  ) {
    return 'official_documentation';
  }

  // 3. Lecture Handouts & Study Notes
  if (lowerText.includes('lecture handout') || lowerText.includes('handout')) {
    return 'lecture_handout';
  }
  if (
    lowerText.includes('lecture notes') ||
    lowerText.includes('study notes') ||
    lowerText.includes('course notes') ||
    lowerText.includes('class notes')
  ) {
    return 'study_notes';
  }

  // 4. Reference Guides / Cheat Sheets / Formula Sheets
  if (
    lowerText.includes('formula sheet') ||
    lowerText.includes('reference guide') ||
    lowerText.includes('cheat sheet') ||
    lowerText.includes('quick reference')
  ) {
    return 'reference_guide';
  }

  // 5. Research Papers & Preprints
  if (lowerUrl.includes('arxiv.org') || lowerText.includes('arxiv:') || lowerText.includes('preprint')) {
    return 'research_paper';
  }

  // 6. Complete courses
  if (
    lowerUrl.includes('ocw.mit.edu') ||
    lowerUrl.includes('coursera.org') ||
    lowerUrl.includes('edx.org') ||
    lowerUrl.includes('nptel.ac.in') ||
    lowerText.includes('complete course syllabus')
  ) {
    return 'full_course';
  }

  // 7. Practice Questions & PYQs
  if (
    lowerText.includes('previous year questions') ||
    lowerText.includes('pyq') ||
    lowerText.includes('past papers') ||
    lowerUrl.includes('pyq')
  ) {
    return 'pyq';
  }

  if (
    lowerText.includes('practice questions') ||
    lowerText.includes('problem set') ||
    lowerText.includes('exercise solutions') ||
    lowerText.includes('question bank') ||
    lowerUrl.includes('practice')
  ) {
    return 'practice_questions';
  }

  // 8. Textbooks & Reading Material
  if (
    lowerUrl.includes('ncert.nic.in') ||
    lowerUrl.includes('openstax.org') ||
    lowerUrl.includes('libretexts.org') ||
    lowerText.includes('open textbook') ||
    lowerText.includes('textbook') ||
    lowerText.includes('chapter reading')
  ) {
    return 'textbook';
  }

  if (lowerText.includes('article') || lowerText.includes('tutorial') || lowerUrl.includes('geeksforgeeks.org')) {
    return 'article';
  }

  return 'educational_web_page';
}

function inferDifficulty(
  explicitDifficulty?: string,
  title?: string,
  desc?: string
): ResourceDifficulty {
  if (
    explicitDifficulty === 'beginner' ||
    explicitDifficulty === 'intermediate' ||
    explicitDifficulty === 'advanced' ||
    explicitDifficulty === 'competitive'
  ) {
    return explicitDifficulty;
  }

  const text = `${title || ''} ${desc || ''}`.toLowerCase();
  if (text.includes('jee') || text.includes('neet') || text.includes('olympiad') || text.includes('gate') || text.includes('advanced')) {
    return 'competitive';
  }
  if (text.includes('intro') || text.includes('beginner') || text.includes('basics') || text.includes('class 9') || text.includes('class 10')) {
    return 'beginner';
  }
  if (text.includes('university') || text.includes('college') || text.includes('undergraduate') || text.includes('derivation')) {
    return 'advanced';
  }

  return 'intermediate';
}

function isExcludedDomain(domain: string): boolean {
  const excluded = [
    'pinterest.com',
    'facebook.com',
    'instagram.com',
    'tiktok.com',
    'twitter.com',
    'x.com',
    'reddit.com',
    'quora.com',
  ];
  return excluded.some((ex) => domain === ex || domain.endsWith('.' + ex));
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
