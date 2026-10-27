import { ResourceProvider, ProviderSearchOptions } from './base-provider';
import { EngineResource, EngineResourceType, ResourceDifficulty } from '../types/legacy-contracts';
import { canonicalizeUrl, extractDomain } from '../utils/url-utils';
import { calculateSourceAuthorityScore, calculateFreshnessScore, clampScore } from '../utils/scoring-utils';
import { stripHtml } from '../utils/text-utils';
import { DEFAULT_ENGINE_CONFIG } from '../config';

interface CacheEntry {
  expiresAt: number;
  data: EngineResource[];
}

const queryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes
const MAX_CACHE_SIZE = 200;

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

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function extractConceptFromQuery(raw: string): string {
  return raw
    .replace(/\b(complete course|full course|tutorial|in depth|guide|best|free|learn|how to|lecture notes|notes|handouts?|study notes|monographs?|readings?|pdf|previous year questions|pyq|practice|problems?|exercises?)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export class AcademicNotesProvider implements ResourceProvider {
  readonly id = 'academic-notes-provider';
  readonly name = 'Academic Notes & Educational Repository Connector';
  readonly providerType = 'academic_notes' as const;
  readonly supportedTypes: EngineResourceType[] = [
    'study_notes',
    'pdf_lecture_notes',
    'lecture_handout',
    'official_documentation',
    'reading_material',
    'textbook',
    'research_paper',
    'article',
    'practice_questions',
  ];

  isAvailable(): boolean {
    // Open academic repositories do not require private secrets and are always available server-side
    return typeof window === 'undefined';
  }

  getAvailabilityStatus(): { available: boolean; reason?: string } {
    return { available: true };
  }

  async search(query: string, options?: ProviderSearchOptions): Promise<EngineResource[]> {
    const limit = options?.limit || 6;
    const cacheKey = `academic_notes:${query.toLowerCase().trim()}:${limit}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const timeoutMs = options?.timeoutMs || 8000;
    const cleanQuery = query
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Parallel fetch from open academic repositories and curated curriculum resources
    const [wikiResults, arxivResults, openAlexResults] = await Promise.all([
      this.fetchWikimediaNotes(cleanQuery, Math.ceil(limit / 2), timeoutMs, options),
      this.fetchArxivPapers(cleanQuery, Math.ceil(limit / 2), timeoutMs, options),
      this.fetchOpenAlexNotes(cleanQuery, Math.ceil(limit / 2), timeoutMs, options),
    ]);

    const curriculumResults = this.fetchCurriculumAndOfficialResources(cleanQuery, limit, options);

    const combined: EngineResource[] = [];
    const seenUrls = new Set<string>();

    // Prioritize verified NCERT/curriculum/official documentation, then academic repositories
    for (const r of [...curriculumResults, ...wikiResults, ...arxivResults, ...openAlexResults]) {
      const canon = r.canonicalUrl || r.sourceUrl;
      if (!seenUrls.has(canon)) {
        seenUrls.add(canon);
        combined.push(r);
      }
      if (combined.length >= limit) break;
    }

    setCache(cacheKey, combined);
    return combined;
  }

  // --- 1. WIKIMEDIA / WIKIBOOKS / WIKIPEDIA ACADEMIC MONOGRAPHS ---
  private async fetchWikimediaNotes(
    query: string,
    maxResults: number,
    timeoutMs: number,
    options?: ProviderSearchOptions
  ): Promise<EngineResource[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const conceptQuery = extractConceptFromQuery(query) || query;
      const conceptTokens = conceptQuery
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2);

      // Search Wikipedia for comprehensive academic synthesis articles
      const url = new URL('https://en.wikipedia.org/w/api.php');
      url.searchParams.set('action', 'query');
      url.searchParams.set('list', 'search');
      url.searchParams.set('srsearch', conceptQuery);
      url.searchParams.set('format', 'json');
      url.searchParams.set('srlimit', String(maxResults + 4));
      url.searchParams.set('origin', '*');

      const res = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'PencillEducationalPlatform/1.0 (academic-curation)',
        },
      });

      if (!res.ok) return [];

      const data = (await res.json()) as {
        query?: {
          search?: Array<{
            pageid: number;
            title: string;
            snippet: string;
            timestamp: string;
            wordcount: number;
          }>;
        };
      };

      const items = data.query?.search || [];
      const resources: EngineResource[] = [];

      for (const item of items) {
        if (!item.title || item.title.toLowerCase().includes('disambiguation')) continue;

        const cleanSnippet = stripHtml(item.snippet || '');
        const titleLower = item.title.toLowerCase();
        const snippetLower = cleanSnippet.toLowerCase();

        // Strict topical relevance filtering:
        // Ensure the article title or snippet actually matches the concept tokens
        let titleMatches = 0;
        let snippetMatches = 0;
        for (const tok of conceptTokens) {
          if (titleLower.includes(tok)) titleMatches++;
          if (snippetLower.includes(tok)) snippetMatches++;
        }

        // Reject off-topic Wikipedia pages that lack title match and have minimal snippet overlap
        if (conceptTokens.length > 0 && titleMatches === 0 && snippetMatches < 2) {
          continue;
        }

        const calculatedRelevance = titleMatches > 0
          ? Math.min(96, 65 + titleMatches * 15)
          : Math.min(50, 25 + snippetMatches * 10);

        const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s+/g, '_'))}`;
        const canonical = canonicalizeUrl(pageUrl);
        const authorityScore = 82;
        const freshnessScore = calculateFreshnessScore(item.timestamp);

        // Detect if official documentation or academic monograph
        let resType: EngineResourceType = 'reading_material';
        if (titleLower.includes('notes') || titleLower.includes('handout')) {
          resType = 'study_notes';
        } else if (titleLower.includes('equation') || titleLower.includes('theorem') || titleLower.includes('law')) {
          resType = 'reference_guide';
        } else if (titleLower.includes('documentation') || titleLower.includes('standard')) {
          resType = 'official_documentation';
        }

        const resource: EngineResource = {
          id: `academic_wiki_${hashString(canonical)}`,
          title: item.title,
          description: cleanSnippet,
          type: resType,
          canonicalUrl: canonical,
          sourceUrl: pageUrl,
          sourceName: 'Wikipedia Academic Monograph',
          provider: 'wikimedia',
          authorOrChannel: 'Wikimedia Foundation',
          durationMinutes: Math.max(15, Math.min(60, Math.round((item.wordcount || 1000) / 150))),
          difficulty: options?.difficulty || 'intermediate',
          language: 'en',
          score: {
            overall: Math.min(94, Math.round(authorityScore * 0.45 + calculatedRelevance * 0.35 + freshnessScore * 0.2)),
            relevance: calculatedRelevance,
            educationalValue: 86,
            structureCompleteness: 90,
            freshness: freshnessScore,
            explanation: `Authoritative conceptual reference monograph from Wikipedia Educational Archive`,
          },
          tags: [resType, 'academic', 'monograph', 'open_access'],
          examCategory: options?.examContext,
          metadata: {
            domain: 'wikipedia.org',
            pageId: item.pageid,
            wordCount: item.wordcount,
            publishedDate: item.timestamp,
            isDirectPdf: false,
          },
          discoveredAt: new Date().toISOString(),
          url: canonical,
          author: 'Wikimedia Open Knowledge',
          publishedAt: item.timestamp,
        };

        resources.push(resource);
        if (resources.length >= maxResults) break;
      }

      return resources;
    } catch {
      return [];
    } finally {
      clearTimeout(timer);
    }
  }

  // --- 2. ARXIV OPEN ACCESS LECTURE PAPERS & PREPRINTS ---
  private async fetchArxivPapers(
    query: string,
    maxResults: number,
    timeoutMs: number,
    options?: ProviderSearchOptions
  ): Promise<EngineResource[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Format arXiv query
      const formattedTerms = query
        .split(/\s+/)
        .filter((w) => w.length > 2)
        .slice(0, 4)
        .map((w) => `all:${encodeURIComponent(w)}`)
        .join('+AND+');

      const url = `https://export.arxiv.org/api/query?search_query=${formattedTerms}&start=0&max_results=${maxResults + 2}&sortBy=relevance&sortOrder=descending`;

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/atom+xml, application/xml, text/xml',
          'User-Agent': 'PencillEducationalPlatform/1.0 (academic-curation)',
        },
      });

      if (!res.ok) return [];

      const xmlText = await res.text();
      return this.parseArxivXml(xmlText, maxResults, options);
    } catch {
      return [];
    } finally {
      clearTimeout(timer);
    }
  }

  private parseArxivXml(
    xml: string,
    limit: number,
    options?: ProviderSearchOptions,
    queryText?: string
  ): EngineResource[] {
    const entries = xml.split('<entry>').slice(1);
    const resources: EngineResource[] = [];
    const conceptTokens = (queryText ? extractConceptFromQuery(queryText) : '')
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    for (const rawEntry of entries) {
      const entry = rawEntry.split('</entry>')[0];
      const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
      const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
      const idMatch = entry.match(/<id>([\s\S]*?)<\/id>/);
      const publishedMatch = entry.match(/<published>([\s\S]*?)<\/published>/);
      const authorMatch = entry.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/);

      if (!titleMatch || !idMatch) continue;

      const title = titleMatch[1].replace(/\s+/g, ' ').trim();
      const summary = (summaryMatch ? summaryMatch[1] : '').replace(/\s+/g, ' ').trim();
      const rawIdUrl = idMatch[1].trim(); // e.g. http://arxiv.org/abs/2103.12345
      const arxivId = rawIdUrl.split('/abs/')[1] || rawIdUrl.split('/').pop() || '';

      const lowerTitle = title.toLowerCase();
      const lowerSummary = summary.toLowerCase();

      // Check keyword alignment
      let titleMatches = 0;
      let summaryMatches = 0;
      for (const tok of conceptTokens) {
        if (lowerTitle.includes(tok)) titleMatches++;
        if (lowerSummary.includes(tok)) summaryMatches++;
      }

      // Reject completely off-topic papers
      if (conceptTokens.length > 0 && titleMatches === 0 && summaryMatches < 2) {
        continue;
      }

      const calculatedRelevance = titleMatches > 0
        ? Math.min(95, 65 + titleMatches * 15)
        : Math.min(50, 25 + summaryMatches * 10);

      const pdfUrl = arxivId ? `https://arxiv.org/pdf/${arxivId}.pdf` : rawIdUrl;
      const canonical = canonicalizeUrl(pdfUrl);
      const publishedDate = publishedMatch ? publishedMatch[1].trim() : undefined;
      const author = authorMatch ? authorMatch[1].trim() : 'arXiv Research Repository';

      const authorityScore = 92;
      const freshnessScore = calculateFreshnessScore(publishedDate);

      // Determine classification: lecture notes vs research paper
      const isLectureNote =
        lowerTitle.includes('lecture notes') ||
        lowerTitle.includes('introduction to') ||
        lowerTitle.includes('primer') ||
        lowerTitle.includes('tutorial') ||
        lowerSummary.includes('lecture notes') ||
        lowerSummary.includes('pedagogical introduction');

      const resType: EngineResourceType = isLectureNote ? 'pdf_lecture_notes' : 'research_paper';

      const resource: EngineResource = {
        id: `academic_arxiv_${hashString(canonical)}`,
        title,
        description: summary.slice(0, 500),
        type: resType,
        canonicalUrl: canonical,
        sourceUrl: pdfUrl,
        sourceName: 'arXiv Academic Repository',
        provider: 'arxiv',
        authorOrChannel: author,
        durationMinutes: 45,
        difficulty: isLectureNote ? 'intermediate' : 'advanced',
        language: 'en',
        score: {
          overall: Math.min(96, Math.round(authorityScore * 0.45 + calculatedRelevance * 0.35 + freshnessScore * 0.2)),
          relevance: calculatedRelevance,
          educationalValue: 92,
          structureCompleteness: 94,
          freshness: freshnessScore,
          explanation: `Verified open-access PDF ${isLectureNote ? 'lecture notes' : 'paper'} from arXiv (${author})`,
        },
        tags: [resType, 'arxiv', 'pdf', 'open_access', 'physics_math'],
        examCategory: options?.examContext,
        metadata: {
          arxivId,
          domain: 'arxiv.org',
          publishedDate,
          isDirectPdf: true,
          downloadUrl: pdfUrl,
        },
        discoveredAt: new Date().toISOString(),
        url: canonical,
        author,
        publishedAt: publishedDate,
      };

      resources.push(resource);
      if (resources.length >= limit) break;
    }

    return resources;
  }

  // --- 3. OPENALEX OPEN REPOSITORIES & UNIVERSITY LECTURE MATERIALS ---
  private async fetchOpenAlexNotes(
    query: string,
    maxResults: number,
    timeoutMs: number,
    options?: ProviderSearchOptions
  ): Promise<EngineResource[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const conceptQuery = extractConceptFromQuery(query) || query;
      const conceptTokens = conceptQuery
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2);

      const url = new URL('https://api.openalex.org/works');
      url.searchParams.set('search', `${conceptQuery} lecture notes`);
      url.searchParams.set('per-page', String(maxResults + 4));
      url.searchParams.set('filter', 'is_oa:true'); // Open Access only

      const res = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'PencillEducationalPlatform/1.0 (academic-curation; mailto:support@pencill.org)',
        },
      });

      if (!res.ok) return [];

      const data = (await res.json()) as {
        results?: Array<{
          id: string;
          title?: string;
          publication_year?: number;
          doi?: string;
          open_access?: {
            is_oa?: boolean;
            oa_url?: string;
          };
          authorships?: Array<{
            author?: { display_name?: string };
          }>;
          primary_location?: {
            source?: { display_name?: string };
            landing_page_url?: string;
            pdf_url?: string;
          };
        }>;
      };

      const items = data.results || [];
      const resources: EngineResource[] = [];

      for (const item of items) {
        if (!item.title) continue;

        const titleLower = item.title.toLowerCase();
        let titleMatches = 0;
        for (const tok of conceptTokens) {
          if (titleLower.includes(tok)) titleMatches++;
        }

        // Require at least one concept token match in title
        if (conceptTokens.length > 0 && titleMatches === 0) {
          continue;
        }

        const calculatedRelevance = Math.min(95, 65 + titleMatches * 15);

        const sourceUrl =
          item.primary_location?.pdf_url ||
          item.open_access?.oa_url ||
          item.primary_location?.landing_page_url ||
          item.doi ||
          item.id;

        if (!sourceUrl || !sourceUrl.startsWith('http')) continue;

        const canonical = canonicalizeUrl(sourceUrl);
        const domain = extractDomain(canonical);
        const authorName = item.authorships?.[0]?.author?.display_name || 'Academic Scholar';
        const sourceName = item.primary_location?.source?.display_name || domain || 'Open Repository';
        const isPdf = Boolean(item.primary_location?.pdf_url || canonical.toLowerCase().endsWith('.pdf'));

        const resType: EngineResourceType = isPdf ? 'pdf_lecture_notes' : 'study_notes';
        const authorityScore = calculateSourceAuthorityScore(canonical, sourceName);
        const pubDate = item.publication_year ? `${item.publication_year}-01-01` : undefined;
        const freshnessScore = calculateFreshnessScore(pubDate);

        const resource: EngineResource = {
          id: `academic_openalex_${hashString(canonical)}`,
          title: item.title,
          description: `Educational study notes and reference text by ${authorName}. Sourced via open academic repository (${sourceName}).`,
          type: resType,
          canonicalUrl: canonical,
          sourceUrl,
          sourceName,
          provider: 'openalex',
          authorOrChannel: authorName,
          durationMinutes: 30,
          difficulty: options?.difficulty || 'intermediate',
          language: 'en',
          score: {
            overall: Math.min(95, Math.round(authorityScore * 0.45 + calculatedRelevance * 0.35 + freshnessScore * 0.2)),
            relevance: calculatedRelevance,
            educationalValue: 88,
            structureCompleteness: 85,
            freshness: freshnessScore,
            explanation: `Open access scholarly study material from ${sourceName}`,
          },
          tags: [resType, 'open_access', 'university_notes'],
          examCategory: options?.examContext,
          metadata: {
            domain,
            doi: item.doi,
            openAlexId: item.id,
            isDirectPdf: isPdf,
            downloadUrl: isPdf ? sourceUrl : undefined,
            publishedYear: item.publication_year,
          },
          discoveredAt: new Date().toISOString(),
          url: canonical,
          author: authorName,
          publishedAt: pubDate,
        };

        resources.push(resource);
        if (resources.length >= maxResults) break;
      }

      return resources;
    } catch {
      return [];
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Curated educational repositories: NCERT textbooks and official programming documentation
   */
  private fetchCurriculumAndOfficialResources(
    query: string,
    maxResults: number,
    options?: ProviderSearchOptions
  ): EngineResource[] {
    const qLower = query.toLowerCase();
    const results: EngineResource[] = [];

    // NCERT Topics mapping
    const ncertCurriculum: Array<{ matchTokens: string[]; title: string; url: string; subject: string; classLevel: string }> = [
      {
        matchTokens: ['haloalkane', 'haloarene', 'alkyl halide', 'aryl halide', 'sn1', 'sn2'],
        title: 'NCERT Chemistry Class 12: Unit 10 – Haloalkanes and Haloarenes',
        url: 'https://ncert.nic.in/textbook.php?lech1=1-10',
        subject: 'Chemistry',
        classLevel: 'Class 12',
      },
      {
        matchTokens: ['alcohol', 'phenol', 'ether'],
        title: 'NCERT Chemistry Class 12: Unit 11 – Alcohols, Phenols and Ethers',
        url: 'https://ncert.nic.in/textbook.php?lech1=2-10',
        subject: 'Chemistry',
        classLevel: 'Class 12',
      },
      {
        matchTokens: ['aldehyde', 'ketone', 'carboxylic'],
        title: 'NCERT Chemistry Class 12: Unit 12 – Aldehydes, Ketones and Carboxylic Acids',
        url: 'https://ncert.nic.in/textbook.php?lech1=3-10',
        subject: 'Chemistry',
        classLevel: 'Class 12',
      },
      {
        matchTokens: ['linear algebra', 'matrix', 'matrices', 'determinant'],
        title: 'NCERT Mathematics Class 12: Matrices & Determinants',
        url: 'https://ncert.nic.in/textbook.php?lemh1=3-6',
        subject: 'Mathematics',
        classLevel: 'Class 12',
      },
      {
        matchTokens: ['calculus', 'continuity', 'differentiab', 'derivative'],
        title: 'NCERT Mathematics Class 12: Continuity and Differentiability',
        url: 'https://ncert.nic.in/textbook.php?lemh1=5-6',
        subject: 'Mathematics',
        classLevel: 'Class 12',
      },
      {
        matchTokens: ['integrat', 'integral'],
        title: 'NCERT Mathematics Class 12: Integrals',
        url: 'https://ncert.nic.in/textbook.php?lemh2=1-7',
        subject: 'Mathematics',
        classLevel: 'Class 12',
      },
      {
        matchTokens: ['vector', 'three dimensional', '3d geometry'],
        title: 'NCERT Mathematics Class 12: Vector Algebra and Three Dimensional Geometry',
        url: 'https://ncert.nic.in/textbook.php?lemh2=4-7',
        subject: 'Mathematics',
        classLevel: 'Class 12',
      },
      {
        matchTokens: ['electrostat', 'electric charge', 'electric field'],
        title: 'NCERT Physics Class 12: Electric Charges and Fields',
        url: 'https://ncert.nic.in/textbook.php?leph1=1-8',
        subject: 'Physics',
        classLevel: 'Class 12',
      },
      {
        matchTokens: ['current electric', 'resistan', 'ohm', 'kirchhoff'],
        title: 'NCERT Physics Class 12: Current Electricity',
        url: 'https://ncert.nic.in/textbook.php?leph1=3-8',
        subject: 'Physics',
        classLevel: 'Class 12',
      },
      {
        matchTokens: ['thermodynam'],
        title: 'NCERT Physics Class 11: Thermodynamics',
        url: 'https://ncert.nic.in/textbook.php?keph2=4-8',
        subject: 'Physics',
        classLevel: 'Class 11',
      },
    ];

    for (const ncert of ncertCurriculum) {
      const isMatch = ncert.matchTokens.some((tok) => qLower.includes(tok));
      if (isMatch) {
        const canonical = canonicalizeUrl(ncert.url);
        results.push({
          id: `ncert_${hashString(canonical)}`,
          title: ncert.title,
          description: `Official National Council of Educational Research and Training (NCERT) syllabus textbook monograph for ${ncert.subject} (${ncert.classLevel}).`,
          type: 'textbook',
          canonicalUrl: canonical,
          sourceUrl: ncert.url,
          sourceName: 'NCERT Official Educational Resources',
          provider: 'academic_notes',
          authorOrChannel: 'National Council of Educational Research and Training (NCERT)',
          durationMinutes: 45,
          difficulty: 'intermediate',
          language: 'en',
          score: {
            overall: 95,
            relevance: 95,
            educationalValue: 98,
            structureCompleteness: 95,
            freshness: 90,
            explanation: 'Official NCERT national textbook standard curriculum chapter',
          },
          tags: ['ncert', 'official_textbook', ncert.subject.toLowerCase(), 'cbse', 'jee'],
          examCategory: options?.examContext || 'CBSE / NCERT / JEE / NEET',
          metadata: {
            domain: 'ncert.nic.in',
            isOfficialCurriculum: true,
            publisher: 'NCERT',
          },
          discoveredAt: new Date().toISOString(),
          url: canonical,
          author: 'NCERT',
        });
      }
    }

    // 2. Official Documentation for Programming and Developer Technologies
    const officialDocSources: Array<{ matchTokens: string[]; title: string; url: string; sourceName: string; publisher: string }> = [
      {
        matchTokens: ['python', 'dict', 'list comprehension', 'tuple', 'lambda'],
        title: 'Python 3 Standard Library Documentation & Official Tutorial',
        url: 'https://docs.python.org/3/tutorial/index.html',
        sourceName: 'Python Software Foundation',
        publisher: 'Python.org',
      },
      {
        matchTokens: ['loop', 'for loop', 'while loop', 'iterator', 'iteration', 'control flow'],
        title: 'Python 3 Standard Library Documentation: More Control Flow Tools',
        url: 'https://docs.python.org/3/tutorial/controlflow.html',
        sourceName: 'Python Software Foundation',
        publisher: 'Python.org',
      },
      {
        matchTokens: ['javascript', 'js', 'dom', 'async/await', 'closure', 'prototype'],
        title: 'MDN Web Docs: JavaScript Reference and Language Guide',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
        sourceName: 'MDN Web Docs (Mozilla)',
        publisher: 'Mozilla Developer Network',
      },
      {
        matchTokens: ['html', 'css', 'flexbox', 'grid', 'web development'],
        title: 'MDN Web Docs: HTML & CSS Core Curriculum',
        url: 'https://developer.mozilla.org/en-US/docs/Learn',
        sourceName: 'MDN Web Docs (Mozilla)',
        publisher: 'Mozilla Developer Network',
      },
      {
        matchTokens: ['git', 'github', 'version control', 'branch', 'merge', 'rebase'],
        title: 'Pro Git Book (Official Open Access Documentation)',
        url: 'https://git-scm.com/book/en/v2',
        sourceName: 'Git Official Community',
        publisher: 'Git-SCM',
      },
      {
        matchTokens: ['react', 'hook', 'useeffect', 'usestate', 'jsx'],
        title: 'React Official Documentation & Core Architecture',
        url: 'https://react.dev/learn',
        sourceName: 'React Documentation',
        publisher: 'Meta Open Source',
      },
      {
        matchTokens: ['sql', 'database', 'relational', 'postgres'],
        title: 'PostgreSQL Official Documentation: The SQL Language',
        url: 'https://www.postgresql.org/docs/current/tutorial-sql.html',
        sourceName: 'PostgreSQL Global Development Group',
        publisher: 'PostgreSQL.org',
      },
    ];

    for (const doc of officialDocSources) {
      const isMatch = doc.matchTokens.some((tok) => qLower.includes(tok));
      if (isMatch) {
        const canonical = canonicalizeUrl(doc.url);
        results.push({
          id: `official_doc_${hashString(canonical)}`,
          title: doc.title,
          description: `Authoritative official developer reference documentation and comprehensive guides from ${doc.publisher}.`,
          type: 'official_documentation',
          canonicalUrl: canonical,
          sourceUrl: doc.url,
          sourceName: doc.sourceName,
          provider: 'academic_notes',
          authorOrChannel: doc.publisher,
          durationMinutes: 40,
          difficulty: 'intermediate',
          language: 'en',
          score: {
            overall: 94,
            relevance: 92,
            educationalValue: 96,
            structureCompleteness: 94,
            freshness: 92,
            explanation: `Official canonical documentation published by ${doc.publisher}`,
          },
          tags: ['official_documentation', 'reference_guide', doc.publisher.toLowerCase()],
          metadata: {
            domain: extractDomain(canonical),
            isOfficialDocumentation: true,
            publisher: doc.publisher,
          },
          discoveredAt: new Date().toISOString(),
          url: canonical,
          author: doc.publisher,
        });
      }
    }

    return results.slice(0, maxResults);
  }
}
