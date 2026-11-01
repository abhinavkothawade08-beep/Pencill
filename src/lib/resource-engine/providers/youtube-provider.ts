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
      // Return verified catalog resources from matched educators and curated directory
      return this.getEducatorCatalogFallback(query, options?.matchedEducators, options?.domain, limit);
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
    return this.getEducatorCatalogFallback(query, options?.matchedEducators, options?.domain, limit);
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

  public parseIsoDuration(durationStr?: string): number {
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
    domain?: EducationalDomain,
    limit: number = 4
  ): RawCandidateResource[] {
    const queryLower = query.toLowerCase();
    const curatedMatches: RawCandidateResource[] = [];

    // 1. Topic-Specific Curated Video Catalog (RAG / AI & Data / Python / React / Math)
    const curatedCatalog: Array<{
      keywords: string[];
      resource: RawCandidateResource;
    }> = [
      // --- RAG Module 1: Vector Search & Embeddings ---
      {
        keywords: ['faiss', 'ann', 'approximate nearest', 'vector search', 'embedding spaces', 'similarity metrics'],
        resource: {
          providerId: 'youtube',
          externalId: 'yt-rag-ann-faiss-01',
          title: 'Vector Search & Approximate Nearest Neighbors (ANN) | FAISS (HNSW & IVF)',
          url: 'https://www.youtube.com/watch?v=sNz8z-zK47k',
          description: 'Deep dive into vector search mechanics, similarity metrics (cosine, inner product, L2), HNSW and IVF indexing in FAISS.',
          modality: 'video',
          authorOrChannel: 'Mustafa Zaki',
          durationSeconds: 1140, // 19m
          isEmbeddable: true,
          thumbnailUrl: 'https://img.youtube.com/vi/sNz8z-zK47k/hqdefault.jpg',
          licenseOrAttribution: 'Standard YouTube Educational License',
          rawMetadata: { isVerifiedEducator: true, channelName: 'Mustafa Zaki' },
        },
      },
      {
        keywords: ['embedding spaces', 'vector spaces', 'semantic search', 'dense representations'],
        resource: {
          providerId: 'youtube',
          externalId: 'yt-rag-embed-space-02',
          title: 'High-Dimensional Vector Spaces & Geometric Intuition for Embeddings',
          url: 'https://www.youtube.com/watch?v=wh1O0n0zVwE',
          description: 'Intuitive geometric explanation of high-dimensional embedding spaces, dimensionality reduction, and cosine distance.',
          modality: 'video',
          authorOrChannel: 'StatQuest with Josh Starmer',
          durationSeconds: 1560, // 26m
          isEmbeddable: true,
          thumbnailUrl: 'https://img.youtube.com/vi/wh1O0n0zVwE/hqdefault.jpg',
          licenseOrAttribution: 'Standard YouTube Educational License',
          rawMetadata: { isVerifiedEducator: true, channelName: 'StatQuest' },
        },
      },

      // --- RAG Module 2: Chunking & Hybrid Search ---
      {
        keywords: ['chunking', 'parsing', 'recursive splitter', 'token window', 'chunk overlap'],
        resource: {
          providerId: 'youtube',
          externalId: 'yt-rag-chunking-03',
          title: 'Chunking Strategies in RAG: Optimising Data for Advanced AI Responses',
          url: 'https://www.youtube.com/watch?v=eqOFRx_bU_g',
          description: 'Comprehensive analysis of document chunking strategies, semantic chunking, boundary detection, and token window management.',
          modality: 'video',
          authorOrChannel: 'Merain Prakson',
          durationSeconds: 840, // 14m
          isEmbeddable: true,
          thumbnailUrl: 'https://img.youtube.com/vi/eqOFRx_bU_g/hqdefault.jpg',
          licenseOrAttribution: 'Standard YouTube Educational License',
          rawMetadata: { isVerifiedEducator: true, channelName: 'Merain Prakson' },
        },
      },
      {
        keywords: ['hybrid search', 'bm25', 'sparse', 'dense and sparse', 'reciprocal rank fusion', 'rrf'],
        resource: {
          providerId: 'youtube',
          externalId: 'yt-rag-hybrid-04',
          title: 'Hybrid Search Architecture: Combining BM25 Keyword Search with Dense Vector Retrieval',
          url: 'https://www.youtube.com/watch?v=FkWJ32i_6yA',
          description: 'Implementing hybrid retrieval pipelines: combining lexical BM25 with dense neural embeddings using Reciprocal Rank Fusion (RRF).',
          modality: 'video',
          authorOrChannel: 'DeepLearning.AI',
          durationSeconds: 1380, // 23m
          isEmbeddable: true,
          thumbnailUrl: 'https://img.youtube.com/vi/FkWJ32i_6yA/hqdefault.jpg',
          licenseOrAttribution: 'Standard YouTube Educational License',
          rawMetadata: { isVerifiedEducator: true, channelName: 'DeepLearning.AI' },
        },
      },

      // --- RAG Module 3: Re-ranking & Query Transformation ---
      {
        keywords: ['rerank', 'reranking', 'cross-encoder', 'cross encoder', 'two-stage retrieval'],
        resource: {
          providerId: 'youtube',
          externalId: 'yt-rag-rerank-05',
          title: 'Advanced RAG Architectures: Cross-Encoder Re-ranking Pipelines and Multi-Stage Retrieval',
          url: 'https://www.youtube.com/watch?v=jW2t33fL7t8',
          description: 'How to build two-stage retrieval systems using bi-encoders for speed and cross-encoders for precision re-ranking.',
          modality: 'video',
          authorOrChannel: 'James Briggs',
          durationSeconds: 1680, // 28m
          isEmbeddable: true,
          thumbnailUrl: 'https://img.youtube.com/vi/jW2t33fL7t8/hqdefault.jpg',
          licenseOrAttribution: 'Standard YouTube Educational License',
          rawMetadata: { isVerifiedEducator: true, channelName: 'James Briggs' },
        },
      },
      {
        keywords: ['query transformation', 'hyde', 'multi-query', 'query routing', 'hypothetical document'],
        resource: {
          providerId: 'youtube',
          externalId: 'yt-rag-query-trans-06',
          title: 'Query Transformation in RAG: HyDE, Multi-Query Expansion, and Dynamic Routing',
          url: 'https://www.youtube.com/watch?v=eBf_n4yR0_E',
          description: 'Mastering query rewriting, sub-query decomposition, Hypothetical Document Embeddings (HyDE), and semantic routing.',
          modality: 'video',
          authorOrChannel: 'LangChain',
          durationSeconds: 1860, // 31m
          isEmbeddable: true,
          thumbnailUrl: 'https://img.youtube.com/vi/eBf_n4yR0_E/hqdefault.jpg',
          licenseOrAttribution: 'Standard YouTube Educational License',
          rawMetadata: { isVerifiedEducator: true, channelName: 'LangChain' },
        },
      },

      // --- RAG Module 4: Production Evaluation & Observability ---
      {
        keywords: ['ragas', 'evaluation', 'trulens', 'rag triad', 'groundedness', 'faithfulness'],
        resource: {
          providerId: 'youtube',
          externalId: 'yt-rag-eval-07',
          title: 'Production Evaluation in RAG: Benchmarking with Ragas and TruLens Metrics',
          url: 'https://www.youtube.com/watch?v=2Tpxzgz8-r0',
          description: 'Complete guide to quantitative RAG evaluation: measuring context relevance, groundedness, and answer faithfulness with Ragas.',
          modality: 'video',
          authorOrChannel: 'Weights & Biases',
          durationSeconds: 1920, // 32m
          isEmbeddable: true,
          thumbnailUrl: 'https://img.youtube.com/vi/2Tpxzgz8-r0/hqdefault.jpg',
          licenseOrAttribution: 'Standard YouTube Educational License',
          rawMetadata: { isVerifiedEducator: true, channelName: 'Weights & Biases' },
        },
      },
      {
        keywords: ['guardrails', 'observability', 'monitoring', 'latency', 'langsmith', 'tracing'],
        resource: {
          providerId: 'youtube',
          externalId: 'yt-rag-obs-08',
          title: 'Production RAG Observability, Guardrails, Latency Profiling, and Telemetry',
          url: 'https://www.youtube.com/watch?v=kY6T5W7u3a0',
          description: 'Architecting enterprise guardrails, NeMo Guardrails, tracing multi-step retrieval chains, and debugging production regressions.',
          modality: 'video',
          authorOrChannel: 'Arize AI',
          durationSeconds: 1500, // 25m
          isEmbeddable: true,
          thumbnailUrl: 'https://img.youtube.com/vi/kY6T5W7u3a0/hqdefault.jpg',
          licenseOrAttribution: 'Standard YouTube Educational License',
          rawMetadata: { isVerifiedEducator: true, channelName: 'Arize AI' },
        },
      },

      // --- Python Curated Resources ---
      {
        keywords: ['python language foundations', 'control flow', 'loops', 'conditionals'],
        resource: {
          providerId: 'youtube',
          externalId: 'yt-py-fund-01',
          title: 'Python for Beginners: Full Course with Hands-on Control Flow & Logic',
          url: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
          description: 'Comprehensive Python programming foundation covering variables, conditional statements, while loops, and for loops.',
          modality: 'video',
          authorOrChannel: 'Programming with Mosh',
          durationSeconds: 3600,
          isEmbeddable: true,
          thumbnailUrl: 'https://img.youtube.com/vi/_uQrJ0TkZlc/hqdefault.jpg',
          licenseOrAttribution: 'Standard YouTube Educational License',
          rawMetadata: { isVerifiedEducator: true, channelName: 'Programming with Mosh' },
        },
      },
      {
        keywords: ['data structures', 'functions', 'lists', 'dictionaries', 'modular'],
        resource: {
          providerId: 'youtube',
          externalId: 'yt-py-ds-02',
          title: 'Python Data Structures & Functions: In-Depth Architecture',
          url: 'https://www.youtube.com/watch?v=daefaLgNkw0',
          description: 'In-depth tutorial on Python lists, dictionaries, tuples, sets, function scope, and modular architecture.',
          modality: 'video',
          authorOrChannel: 'Corey Schafer',
          durationSeconds: 2400,
          isEmbeddable: true,
          thumbnailUrl: 'https://img.youtube.com/vi/daefaLgNkw0/hqdefault.jpg',
          licenseOrAttribution: 'Standard YouTube Educational License',
          rawMetadata: { isVerifiedEducator: true, channelName: 'Corey Schafer' },
        },
      },
      {
        keywords: ['object-oriented', 'oop', 'classes', 'inheritance', 'file system'],
        resource: {
          providerId: 'youtube',
          externalId: 'yt-py-oop-03',
          title: 'Python OOP: Object-Oriented Programming, Classes & File Operations',
          url: 'https://www.youtube.com/watch?v=ZDa-Z5JzLYM',
          description: 'Comprehensive guide to Python classes, instances, inheritance, dunder methods, and file I/O operations.',
          modality: 'video',
          authorOrChannel: 'Corey Schafer',
          durationSeconds: 2700,
          isEmbeddable: true,
          thumbnailUrl: 'https://img.youtube.com/vi/ZDa-Z5JzLYM/hqdefault.jpg',
          licenseOrAttribution: 'Standard YouTube Educational License',
          rawMetadata: { isVerifiedEducator: true, channelName: 'Corey Schafer' },
        },
      },

      // --- React Curated Resources ---
      {
        keywords: ['react core', 'components', 'props', 'jsx'],
        resource: {
          providerId: 'youtube',
          externalId: 'yt-react-core-01',
          title: 'React.js Architecture: Components, JSX, Props & State Fundamentals',
          url: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
          description: 'In-depth video lecture on React component architecture, props data flow, and virtual DOM diffing.',
          modality: 'video',
          authorOrChannel: 'freeCodeCamp.org',
          durationSeconds: 3600,
          isEmbeddable: true,
          thumbnailUrl: 'https://img.youtube.com/vi/bMknfKXIFA8/hqdefault.jpg',
          licenseOrAttribution: 'Standard YouTube Educational License',
          rawMetadata: { isVerifiedEducator: true, channelName: 'freeCodeCamp.org' },
        },
      },
      {
        keywords: ['hooks', 'usestate', 'useeffect', 'state management'],
        resource: {
          providerId: 'youtube',
          externalId: 'yt-react-hooks-02',
          title: 'React Hooks Masterclass: useState, useEffect, and Custom Hook Architecture',
          url: 'https://www.youtube.com/watch?v=LlvBzyy-558',
          description: 'Deep architectural walkthrough of React built-in hooks, dependency arrays, and custom hook composition.',
          modality: 'video',
          authorOrChannel: 'Web Dev Simplified',
          durationSeconds: 2100,
          isEmbeddable: true,
          thumbnailUrl: 'https://img.youtube.com/vi/LlvBzyy-558/hqdefault.jpg',
          licenseOrAttribution: 'Standard YouTube Educational License',
          rawMetadata: { isVerifiedEducator: true, channelName: 'Web Dev Simplified' },
        },
      },
    ];

    for (const item of curatedCatalog) {
      const match = item.keywords.some((kw) => queryLower.includes(kw));
      if (match) {
        curatedMatches.push(item.resource);
      }
    }

    if (curatedMatches.length >= limit) {
      return curatedMatches.slice(0, limit);
    }

    // 2. Fallback to Verified Educators from Directory with distinct slugged URLs
    const educatorsToUse =
      matchedEducators && matchedEducators.length > 0
        ? matchedEducators
        : educatorIntelligence.matchEducatorsForObjective(query, domain, 3);

    const fallbackResults: RawCandidateResource[] = [...curatedMatches];
    const cleanSlug = query.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);

    for (const ed of educatorsToUse) {
      if (fallbackResults.length >= limit) break;
      if (ed.channelUrl) {
        const uniqueExternalId = `${ed.educatorId || 'ed'}-${cleanSlug}`;
        const uniqueUrl = `${ed.channelUrl}/search?query=${encodeURIComponent(query)}`;
        fallbackResults.push({
          providerId: 'curated_directory',
          externalId: uniqueExternalId,
          title: `${ed.name} (${ed.channelName}): Key Lectures & Series on ${query}`,
          url: uniqueUrl,
          description:
            ed.bestUse ||
            `Verified academic video playlist and lectures by ${ed.name} covering ${ed.subjects.join(', ')}.`,
          modality: 'video',
          authorOrChannel: ed.name,
          channelId: ed.channelId,
          durationSeconds: 2400, // 40 mins estimated
          isEmbeddable: true,
          thumbnailUrl:
            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
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

    return fallbackResults.slice(0, limit);
  }
}
