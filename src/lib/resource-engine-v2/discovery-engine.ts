import {
  DiscoveryResult,
  SearchOptions,
  EngineResource,
  toCoreResourceType,
  toPublicResource,
} from './types/legacy-contracts';
import { QueryAnalyzer } from './analysis/legacy-analyzer';
import { SearchPlanner } from './planning/legacy-planner';
import { NormalizationEngine } from './normalization/legacy-normalizer';
import { ValidationEngine } from './evaluation/validation-engine';
import { EvaluationEngine } from './bridge/legacy-helpers';
import { DeduplicationEngine } from './normalization/deduplication-engine';
import { RankingEngine } from './evaluation/legacy-ranking';
import { QualityScoringEngine } from './evaluation/quality-scoring';
import { SequenceGenerator } from './chapters/sequence-generator';
import { GoogleSearchProvider } from './providers/google-search-provider';
import { YouTubeProvider } from './providers/legacy-youtube-provider';
import { AcademicNotesProvider } from './providers/academic-notes-provider';
import { DEFAULT_ENGINE_CONFIG } from './config';
import { saveDiscoveredResources } from '@/services/supabase/resourceService';
import { EducatorMatcher } from './educators';
import { extractYouTubeVideoId } from './utils/url-utils';
import { ResourceProvider, ProviderSearchOptions } from './providers/base-provider';

export class LegacyProviderRegistry {
  private providers = new Map<string, ResourceProvider>();

  constructor() {
    this.register(new GoogleSearchProvider());
    this.register(new AcademicNotesProvider());
    this.register(new YouTubeProvider());
  }

  register(provider: ResourceProvider): void {
    this.providers.set(provider.id, provider);
    if (provider.providerType) {
      this.providers.set(provider.providerType, provider);
    }
  }

  get(idOrType: string): ResourceProvider | undefined {
    return this.providers.get(idOrType);
  }

  getAll(): ResourceProvider[] {
    const unique = new Set<ResourceProvider>();
    for (const p of this.providers.values()) {
      unique.add(p);
    }
    return Array.from(unique);
  }
}

export class DiscoveryEngine {
  private queryAnalyzer = new QueryAnalyzer();
  private searchPlanner = new SearchPlanner();
  private normalizer = new NormalizationEngine();
  private validator = new ValidationEngine();
  private evaluator = new EvaluationEngine();
  private deduplicator = new DeduplicationEngine();
  private ranker = new RankingEngine();
  private qualityEngine = new QualityScoringEngine();
  private sequenceGenerator = new SequenceGenerator();
  private registry: LegacyProviderRegistry;

  constructor(registry?: LegacyProviderRegistry) {
    this.registry = registry || new LegacyProviderRegistry();
  }

  getProviderRegistry(): LegacyProviderRegistry {
    return this.registry;
  }

  async discover(query: string, options?: SearchOptions): Promise<DiscoveryResult> {
    const startTime = Date.now();
    const limit = options?.limit || DEFAULT_ENGINE_CONFIG.defaultLimit;

    // Stage 1: Query Understanding & Analysis
    const parsedQuery = await this.queryAnalyzer.analyze(query);

    // Stage 2: Multi-Source Search Planning (Google Search + YouTube Data API + Academic Notes)
    const searchPlan = this.searchPlanner.createPlan(parsedQuery, options);

    // Stage 3: Source Connector Execution in Parallel
    const providerLatencies: Record<string, number> = {};
    const countsByProvider: Record<string, number> = {};
    const rawDiscovered: EngineResource[] = [];

    const googleProvider = this.registry.get('google-search-provider') as GoogleSearchProvider | undefined;
    const youtubeProvider = this.registry.get('youtube-provider') as YouTubeProvider | undefined;
    const academicNotesProvider = this.registry.get('academic-notes-provider') as AcademicNotesProvider | undefined;

    const planTasks = searchPlan.queries.map(async (planItem) => {
      const pStart = Date.now();
      try {
        if (
          planItem.provider === 'notes' ||
          planItem.provider === 'academic_notes' ||
          planItem.provider === 'arxiv' ||
          planItem.provider === 'openalex' ||
          planItem.provider === 'wikimedia'
        ) {
          if (!academicNotesProvider || !academicNotesProvider.isAvailable()) {
            console.warn('[DiscoveryEngine] AcademicNotesProvider is not available.');
            return [];
          }

          const results = await academicNotesProvider.search(planItem.query, {
            limit: planItem.maxResults,
            targetTypes: planItem.targetTypes,
            difficulty: parsedQuery.targetLevel,
            examContext: parsedQuery.examContext,
            timeoutMs: options?.timeoutMs || DEFAULT_ENGINE_CONFIG.providerTimeoutMs,
          });

          const pDuration = Date.now() - pStart;
          providerLatencies['notes'] = (providerLatencies['notes'] || 0) + pDuration;
          countsByProvider['notes'] = (countsByProvider['notes'] || 0) + results.length;
          return results;
        }

        if (
          planItem.provider === 'google' ||
          planItem.provider === 'web' ||
          planItem.provider === 'practice'
        ) {
          if (!googleProvider || !googleProvider.isAvailable()) {
            // Graceful fallback to AcademicNotesProvider for web/notes queries
            if (academicNotesProvider && academicNotesProvider.isAvailable() && (planItem.query.includes('notes') || planItem.query.includes('documentation') || planItem.query.includes('guide'))) {
              const fallbackResults = await academicNotesProvider.search(planItem.query, {
                limit: planItem.maxResults,
                targetTypes: planItem.targetTypes,
                difficulty: parsedQuery.targetLevel,
                examContext: parsedQuery.examContext,
                timeoutMs: options?.timeoutMs || DEFAULT_ENGINE_CONFIG.providerTimeoutMs,
              });
              const pDuration = Date.now() - pStart;
              providerLatencies['notes-fallback'] = (providerLatencies['notes-fallback'] || 0) + pDuration;
              countsByProvider['notes'] = (countsByProvider['notes'] || 0) + fallbackResults.length;
              return fallbackResults;
            }
            return [];
          }

          const results = await googleProvider.search(planItem.query, {
            limit: planItem.maxResults,
            targetTypes: planItem.targetTypes,
            difficulty: parsedQuery.targetLevel,
            examContext: parsedQuery.examContext,
            timeoutMs: options?.timeoutMs || DEFAULT_ENGINE_CONFIG.providerTimeoutMs,
          });

          const pDuration = Date.now() - pStart;
          providerLatencies['google'] = (providerLatencies['google'] || 0) + pDuration;
          countsByProvider['google'] = (countsByProvider['google'] || 0) + results.length;
          return results;
        }

        if (planItem.provider === 'youtube') {
          if (!youtubeProvider || !youtubeProvider.isAvailable()) {
            console.warn('[DiscoveryEngine] YouTubeProvider is not available (YOUTUBE_API_KEY missing).');
            return [];
          }

          const results = await youtubeProvider.search(planItem.query, {
            limit: planItem.maxResults,
            targetTypes: planItem.targetTypes,
            difficulty: parsedQuery.targetLevel,
            examContext: parsedQuery.examContext,
            timeoutMs: options?.timeoutMs || DEFAULT_ENGINE_CONFIG.providerTimeoutMs,
          });

          const pDuration = Date.now() - pStart;
          providerLatencies['youtube'] = (providerLatencies['youtube'] || 0) + pDuration;
          countsByProvider['youtube'] = (countsByProvider['youtube'] || 0) + results.length;
          return results;
        }

        if (planItem.provider === 'quiz') {
          const quizProvider = this.registry.get('ai-quiz-engine');
          if (quizProvider && quizProvider.isAvailable()) {
            const results = await quizProvider.search(planItem.query, {
              limit: planItem.maxResults,
              targetTypes: planItem.targetTypes,
              difficulty: parsedQuery.targetLevel,
              examContext: parsedQuery.examContext,
              timeoutMs: options?.timeoutMs || DEFAULT_ENGINE_CONFIG.providerTimeoutMs,
            });
            const pDuration = Date.now() - pStart;
            providerLatencies['quiz'] = (providerLatencies['quiz'] || 0) + pDuration;
            countsByProvider['quiz'] = (countsByProvider['quiz'] || 0) + results.length;
            return results;
          }
        }

        return [];
      } catch (pErr) {
        console.warn(`[DiscoveryEngine] Query execution failed for "${planItem.query}":`, pErr);
        return [];
      }
    });

    const executionResults = await Promise.all(planTasks);
    for (const resList of executionResults) {
      rawDiscovered.push(...resList);
    }

    // Stage 4: Normalization
    const normalized = rawDiscovered.map((r) => this.normalizer.normalize(r));

    // Stage 5: Deduplication (Canonical URL, Canonical Video ID, and Semantic redundancy)
    const deduplicated = this.deduplicator.deduplicate(normalized);

    // Stage 6: Validation & Filtering
    const minThreshold = options?.minQualityScore ?? 45;
    const valid = this.validator.filterValid(deduplicated, minThreshold);

    // Stage 7: Evidence-Based Quality Scoring & Relevance Evaluation
    const contentType = (options?.contentType as any) || this.qualityEngine.detectContentType(parsedQuery.topic);
    let scoredCandidates: Array<{ resource: EngineResource; score: import('./types/legacy-contracts').DetailedQualityScore }> = [];

    if (options?.enableAiEvaluation !== false && valid.length > 0) {
      scoredCandidates = await this.qualityEngine.evaluateBatchWithAi(
        valid,
        parsedQuery.topic,
        contentType
      );
    } else {
      scoredCandidates = this.qualityEngine.filterAndScoreBatch(
        valid,
        parsedQuery.topic,
        contentType,
        options?.minQualityScore
      );
    }

    // Stage 8: Sequence Generation & Logical Pedagogical Ordering
    const rawPlaylist = await this.sequenceGenerator.generateSequence(
      parsedQuery.topic,
      scoredCandidates,
      {
        sequenceType: options?.sequenceType as any,
        contentType: contentType as any,
        maxItems: limit,
      }
    );

    // Stage 9: Final Quality & Sequence Validation
    const sequencedPlaylist = this.validator.validateSequencedPlaylist(
      rawPlaylist,
      options?.minQualityScore ?? 50
    );

    // Stage 10: Weighted Ranking for backward compatibility
    const rankedResources = this.ranker.rank(
      scoredCandidates.map((s) => s.resource),
      limit
    );

    // Populate compatibility and helper fields on ranked items
    for (const item of rankedResources) {
      item.resource.finalScore = item.finalScore;
      item.resource.url = item.resource.canonicalUrl || item.resource.sourceUrl;
      item.resource.author = item.resource.authorOrChannel;
      item.resource.relevanceScore = item.resource.score?.relevance;
      item.resource.educationalValueScore = item.resource.score?.educationalValue;
      item.resource.structureScore = item.resource.score?.structureCompleteness;
      item.resource.freshnessScore = item.resource.score?.freshness;
    }

    // Group ranked resources by category
    const groupedByType: Record<string, EngineResource[]> = {};
    const countsByType: Record<string, number> = {};

    for (const item of rankedResources) {
      const type = item.resource.type;
      if (!groupedByType[type]) groupedByType[type] = [];
      groupedByType[type].push(item.resource);
      countsByType[type] = (countsByType[type] || 0) + 1;
    }

    const durationMs = Date.now() - startTime;

    // Optional: Persist discovered resources to Supabase
    let createdJobId: string | undefined;
    if (options?.saveToDatabase && rankedResources.length > 0) {
      createdJobId = await this.persistToSupabase(parsedQuery.topic, rankedResources.map((r) => r.resource));
    }

    return {
      jobId: createdJobId,
      topic: parsedQuery.topic,
      parsedQuery,
      searchPlan,
      totalFound: rawDiscovered.length,
      totalValid: valid.length,
      rankedResources,
      sequencedPlaylist,
      groupedByType,
      executionMetrics: {
        durationMs,
        providerLatencies,
        countsByProvider,
        countsByType,
        evaluatedCount: valid.length,
      },
    };
  }

  private async persistToSupabase(topic: string, resources: EngineResource[]): Promise<string | undefined> {
    const result = await saveDiscoveredResources(topic, resources);
    return result.jobId;
  }


  /**
   * Dedicated lesson-level study notes and handout discovery.
   * Generates targeted queries per lesson, executes searches across academic APIs
   * and web search, normalizes, deduplicates, and scores relevance to the specific lesson.
   */
  async discoverNotesForLesson(
    lessonTitle: string,
    topic: string,
    options?: {
      domain?: string;
      examContext?: string;
      limit?: number;
      minQualityScore?: number;
      timeoutMs?: number;
    }
  ): Promise<EngineResource[]> {
    const planItems = this.searchPlanner.createLessonNotesPlan(
      lessonTitle,
      topic,
      options?.domain,
      options?.examContext
    );

    const rawDiscovered: EngineResource[] = [];
    const googleProvider = this.registry.get('google-search-provider') as GoogleSearchProvider | undefined;
    const academicNotesProvider = this.registry.get('academic-notes-provider') as AcademicNotesProvider | undefined;

    const limit = options?.limit || 4;

    const tasks = planItems.map(async (planItem) => {
      try {
        if (
          planItem.provider === 'notes' ||
          planItem.provider === 'academic_notes' ||
          planItem.provider === 'arxiv' ||
          planItem.provider === 'openalex' ||
          planItem.provider === 'wikimedia'
        ) {
          if (academicNotesProvider && academicNotesProvider.isAvailable()) {
            return await academicNotesProvider.search(planItem.query, {
              limit: planItem.maxResults,
              targetTypes: planItem.targetTypes,
              examContext: options?.examContext,
              timeoutMs: options?.timeoutMs || 8000,
            });
          }
        }

        if (planItem.provider === 'google' || planItem.provider === 'web') {
          if (googleProvider && googleProvider.isAvailable()) {
            const gResults = await googleProvider.search(planItem.query, {
              limit: planItem.maxResults,
              targetTypes: planItem.targetTypes,
              examContext: options?.examContext,
              timeoutMs: options?.timeoutMs || 8000,
            });
            if (gResults.length > 0) return gResults;
          }

          // Fallback to academicNotesProvider for documentation / guide queries if Google is unavailable
          if (academicNotesProvider && academicNotesProvider.isAvailable()) {
            return await academicNotesProvider.search(planItem.query, {
              limit: planItem.maxResults,
              targetTypes: planItem.targetTypes,
              examContext: options?.examContext,
              timeoutMs: options?.timeoutMs || 8000,
            });
          }
        }

        return [];
      } catch (err) {
        console.warn(`[DiscoveryEngine] Lesson notes search failed for "${planItem.query}":`, err);
        return [];
      }
    });

    const executionResults = await Promise.all(tasks);
    for (const rList of executionResults) {
      rawDiscovered.push(...rList);
    }

    if (rawDiscovered.length === 0) {
      return [];
    }

    // 1. Normalize
    const normalized = rawDiscovered.map((r) => this.normalizer.normalize(r));

    // 2. Deduplicate
    const deduplicated = this.deduplicator.deduplicate(normalized);

    // 3. Validate
    const valid = this.validator.filterValid(deduplicated, 40);

    // 4. Quality score & rank specifically for notes/educational text
    const scoredCandidates = this.qualityEngine.filterAndScoreBatch(
      valid,
      `${lessonTitle} ${topic}`,
      'academic',
      options?.minQualityScore ?? 45
    );

    // 5. Sort by relevance and quality
    const sorted = scoredCandidates
      .sort((a, b) => b.score.overall - a.score.overall)
      .slice(0, limit)
      .map((sc) => {
        const item = sc.resource;
        item.finalScore = sc.score.overall;
        item.url = item.canonicalUrl || item.sourceUrl;
        item.author = item.authorOrChannel;
        item.relevanceScore = sc.score.topicRelevance;
        item.educationalValueScore = sc.score.educationalValue;
        item.structureScore = sc.score.contentDepth;
        return item;
      });

    return sorted;
  }

  /**
   * Dedicated practice questions, problem sets, and PYQ discovery.
   * Plans targeted practice queries across academic APIs, open archives, and formative engines.
   */
  async discoverPractice(
    topic: string,
    options?: {
      examContext?: string;
      difficulty?: string;
      limit?: number;
      minQualityScore?: number;
      timeoutMs?: number;
    }
  ): Promise<EngineResource[]> {
    const limit = options?.limit || 10;
    const planItems = this.searchPlanner.createPracticePlan(topic, {
      examContext: options?.examContext,
      difficulty: options?.difficulty,
    });

    const googleProvider = this.registry.get('google-search-provider') as GoogleSearchProvider | undefined;
    const academicNotesProvider = this.registry.get('academic-notes-provider') as AcademicNotesProvider | undefined;
    const quizProvider = this.registry.get('ai-quiz-engine');

    const rawDiscovered: EngineResource[] = [];

    const tasks = planItems.map(async (planItem) => {
      try {
        if (planItem.provider === 'google' && googleProvider && googleProvider.isAvailable()) {
          const results = await googleProvider.search(planItem.query, {
            limit: planItem.maxResults,
            targetTypes: planItem.targetTypes,
            difficulty: options?.difficulty as any,
            examContext: options?.examContext,
            timeoutMs: options?.timeoutMs || 8000,
          });
          if (results.length > 0) return results;
        }

        if (
          (planItem.provider === 'notes' || planItem.provider === 'google') &&
          academicNotesProvider &&
          academicNotesProvider.isAvailable()
        ) {
          return await academicNotesProvider.search(planItem.query, {
            limit: planItem.maxResults,
            targetTypes: planItem.targetTypes,
            difficulty: options?.difficulty as any,
            examContext: options?.examContext,
            timeoutMs: options?.timeoutMs || 8000,
          });
        }

        if (planItem.provider === 'quiz' && quizProvider && quizProvider.isAvailable()) {
          return await quizProvider.search(planItem.query, {
            limit: planItem.maxResults,
            targetTypes: planItem.targetTypes,
            examContext: options?.examContext,
            timeoutMs: options?.timeoutMs || 8000,
          });
        }

        return [];
      } catch (err) {
        console.warn(`[DiscoveryEngine] Practice search failed for "${planItem.query}":`, err);
        return [];
      }
    });

    const executionResults = await Promise.all(tasks);
    for (const rList of executionResults) {
      rawDiscovered.push(...rList);
    }

    if (rawDiscovered.length === 0) {
      return [];
    }

    const normalized = rawDiscovered.map((r) => this.normalizer.normalize(r));
    const deduplicated = this.deduplicator.deduplicate(normalized);
    const valid = this.validator.filterValid(deduplicated, 40);

    const scored = this.qualityEngine.filterAndScoreBatch(
      valid,
      topic,
      'academic',
      options?.minQualityScore ?? 45
    );

    const sorted = scored
      .sort((a, b) => b.score.overall - a.score.overall)
      .slice(0, limit)
      .map((sc) => {
        const item = sc.resource;
        item.finalScore = sc.score.overall;
        item.url = item.canonicalUrl || item.sourceUrl;
        item.author = item.authorOrChannel;
        item.relevanceScore = sc.score.topicRelevance;
        item.educationalValueScore = sc.score.educationalValue;
        item.structureScore = sc.score.contentDepth;
        return item;
      });

    // Optionally cache verified practice resources to Supabase
    if (sorted.length > 0) {
      this.persistToSupabase(`${topic} Practice`, sorted).catch(() => {});
    }

    return sorted;
  }

  /**
   * Dedicated module-level multi-source discovery.
   * Gathers highly relevant videos, reading materials, and practice sets specifically
   * targeted to the module's learning objective and individual lessons.
   */
  async discoverModuleResources(
    moduleContext: {
      title: string;
      objective: string;
      description?: string;
      subtopics?: string[];
      keySubtopics?: string[];
      moduleNumber: number;
      totalModules?: number;
      courseTopic: string;
      domain?: string;
      level?: string;
      lessons?: Array<{ title: string; type: string; keyConcepts?: string[] }>;
    },
    options?: {
      excludeUrls?: Set<string>;
      excludeVideoIds?: Set<string>;
      minQualityScore?: number;
      timeoutMs?: number;
    }
  ): Promise<{
    videos: EngineResource[];
    readingNotes: EngineResource[];
    practiceSets: EngineResource[];
  }> {
    const youtubeProvider = this.registry.get('youtube-provider') as YouTubeProvider | undefined;
    const academicNotesProvider = this.registry.get('academic-notes-provider') as AcademicNotesProvider | undefined;
    const googleProvider = this.registry.get('google-search-provider') as GoogleSearchProvider | undefined;

    const exclude = options?.excludeUrls || new Set<string>();
    const excludeVideoIds = options?.excludeVideoIds || new Set<string>();
    const timeoutMs = options?.timeoutMs || 10000;
    const cleanTopic = moduleContext.courseTopic.trim();
    const cleanMod = moduleContext.title
      .replace(/^(module\s*\d+[:.-]?\s*)/i, '')
      .replace(/^\d+(\.\d+)?\s*[-:]?\s*/, '')
      .replace(/[()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const isIntroductory = moduleContext.moduleNumber === 1;
    const isAdvanced = moduleContext.totalModules ? moduleContext.moduleNumber >= moduleContext.totalModules : false;

    // 1. Module-Specific Video Discovery
    const rawVideos: EngineResource[] = [];
    if (youtubeProvider && youtubeProvider.isAvailable()) {
      const videoTasks: Promise<EngineResource[]>[] = [];

      // Step 1a: Match curated directory educators for this specific module context
      const educatorCtx = EducatorMatcher.deriveContext({
        courseTitle: moduleContext.courseTopic,
        moduleTitle: moduleContext.title,
        moduleObjective: moduleContext.objective,
        academicLevel: moduleContext.level,
        domain: moduleContext.domain,
      });

      const matchedEducators = EducatorMatcher.matchEducators(educatorCtx, {
        limit: 3,
        minScore: 40,
      });

      // Target matched educators directly with channel verification
      const modWords = cleanMod.split(' ').filter((w) => w.length > 2);
      const focalConcept = modWords.slice(0, 4).join(' ');

      for (const match of matchedEducators) {
        const edu = match.educator;
        const educatorQuery = `${focalConcept} ${edu.Educator_Name}`.trim();

        videoTasks.push(
          youtubeProvider.search(educatorQuery, {
            limit: 3,
            targetTypes: ['video_lecture'],
            channelId: edu.YouTube_Channel_ID,
            channelHandle: edu.YouTube_Channel_ID ? undefined : edu.YouTube_Channel_Name,
            educatorId: edu.Educator_ID,
            targetEducator: edu,
            discoverySource: 'curated_directory',
            difficulty: isIntroductory ? 'beginner' : isAdvanced ? 'advanced' : 'intermediate',
            excludeUrls: exclude,
            excludeVideoIds,
            timeoutMs,
          }).then((results) => {
            return results.map((r) => {
              r.educatorId = edu.Educator_ID;
              r.educatorName = edu.Educator_Name;
              r.discoverySource = 'curated_directory';
              r.verificationStatus = edu.Verification_Status;
              r.selectionExplanation = `Curated by verified educator ${edu.Educator_Name} (${edu.Teaching_Specialization.slice(0, 80)}). Alignment: ${match.matchingReasons.join(', ')}.`;
              return r;
            });
          }).catch(() => [])
        );
      }

      // Step 1b: Complementary / fallback search across high-yield module queries
      const smartVideoQueries = this.searchPlanner.createModuleVideoPlan({
        moduleTitle: moduleContext.title,
        moduleObjective: moduleContext.objective,
        moduleDescription: moduleContext.description,
        courseTopic: moduleContext.courseTopic,
        difficulty: moduleContext.level,
        subtopics: moduleContext.subtopics || moduleContext.keySubtopics,
        lessons: moduleContext.lessons,
      });

      for (const q of smartVideoQueries) {
        videoTasks.push(
          youtubeProvider.search(q, {
            limit: 4,
            targetTypes: ['video_lecture'],
            difficulty: isIntroductory ? 'beginner' : isAdvanced ? 'advanced' : 'intermediate',
            excludeUrls: exclude,
            excludeVideoIds,
            timeoutMs,
          }).catch(() => [])
        );
      }

      const videoResLists = await Promise.all(videoTasks);
      for (const list of videoResLists) {
        for (const item of list) {
          const canon = item.canonicalUrl || item.sourceUrl;
          const vid = item.externalId || (item.metadata?.videoId as string) || (typeof extractYouTubeVideoId === 'function' ? extractYouTubeVideoId(canon) : null);
          if (exclude.has(canon) || (vid && excludeVideoIds.has(vid))) {
            continue;
          }
          if (item.metadata?.isEmbeddable !== false) {
            rawVideos.push(item);
          }
        }
      }

      // Step 1c: Search Fallbacks if suitable unique videos are sparse
      if (rawVideos.length < 2) {
        const fallbackQueries: string[] = [];
        const videoLessons = (moduleContext.lessons || []).filter((l) => l.type === 'video');
        for (const les of videoLessons) {
          for (const concept of (les.keyConcepts || []).slice(0, 2)) {
            if (concept.length > 2) {
              fallbackQueries.push(`${concept} ${focalConcept} explanation tutorial`.trim());
            }
          }
        }
        if (fallbackQueries.length > 0) {
          const fallbackTasks = fallbackQueries.slice(0, 2).map((fq) =>
            youtubeProvider.search(fq, {
              limit: 4,
              targetTypes: ['video_lecture'],
              difficulty: isIntroductory ? 'beginner' : isAdvanced ? 'advanced' : 'intermediate',
              excludeUrls: exclude,
              excludeVideoIds,
              timeoutMs,
            }).catch(() => [])
          );
          const fallbackLists = await Promise.all(fallbackTasks);
          for (const list of fallbackLists) {
            for (const item of list) {
              const canon = item.canonicalUrl || item.sourceUrl;
              const vid = item.externalId || (item.metadata?.videoId as string) || (typeof extractYouTubeVideoId === 'function' ? extractYouTubeVideoId(canon) : null);
              if (!exclude.has(canon) && (!vid || !excludeVideoIds.has(vid)) && item.metadata?.isEmbeddable !== false) {
                rawVideos.push(item);
              }
            }
          }
        }
      }
    }

    // 2. Module-Specific Reading Materials & Notes Discovery
    const rawDocs: EngineResource[] = [];
    if (academicNotesProvider && academicNotesProvider.isAvailable()) {
      const docQueries: string[] = [];
      const modWords = cleanMod.split(' ').filter((w) => w.length > 2);
      const focalConcept = modWords.slice(0, 4).join(' ');
      docQueries.push(`${focalConcept} notes`);

      if (isIntroductory) {
        docQueries.push(`${focalConcept} concepts fundamentals`);
      } else if (isAdvanced) {
        docQueries.push(`${focalConcept} paper arXiv`);
      } else {
        docQueries.push(`${focalConcept} guide documentation`);
      }

      const docLessons = (moduleContext.lessons || []).filter((l) => l.type === 'monograph' || l.type === 'paper');
      for (const dLes of docLessons.slice(0, 2)) {
        const cleanLesson = dLes.title.replace(/^\d+(\.\d+)?\s*[-:]?\s*/, '').trim();
        if (cleanLesson) docQueries.push(`${cleanLesson}`);
      }

      const uniqueDocQueries = Array.from(new Set(docQueries.map((q) => q.trim()).filter(Boolean))).slice(0, 3);
      const docTasks = uniqueDocQueries.map((q) =>
        academicNotesProvider.search(q, {
          limit: 4,
          timeoutMs,
        }).catch(() => [])
      );

      const docResLists = await Promise.all(docTasks);
      for (const list of docResLists) {
        for (const item of list) {
          const canon = item.canonicalUrl || item.sourceUrl;
          if (!exclude.has(canon)) {
            rawDocs.push(item);
          }
        }
      }
    }

    // Optional Google search if available for documentation/notes
    if (googleProvider && googleProvider.isAvailable()) {
      try {
        const modWords = cleanMod.split(' ').filter((w) => w.length > 2);
        const focalConcept = modWords.slice(0, 4).join(' ');
        const gResults = await googleProvider.search(`${focalConcept} lecture notes pdf`, {
          limit: 3,
          timeoutMs: 6000,
        });
        for (const item of gResults) {
          const canon = item.canonicalUrl || item.sourceUrl;
          if (!exclude.has(canon)) {
            rawDocs.push(item);
          }
        }
      } catch {
        // Fallback already handled by academicNotesProvider
      }
    }

    // 3. Module-Specific Practice Problems Discovery
    const rawPractice: EngineResource[] = [];
    if (academicNotesProvider && academicNotesProvider.isAvailable()) {
      try {
        const modWords = cleanMod.split(' ').filter((w) => w.length > 2);
        const focalConcept = modWords.slice(0, 4).join(' ');
        const pResults = await academicNotesProvider.search(`${focalConcept} practice problems questions`, {
          limit: 3,
          timeoutMs: 6000,
        });
        for (const item of pResults) {
          const canon = item.canonicalUrl || item.sourceUrl;
          if (!exclude.has(canon)) {
            rawPractice.push(item);
          }
        }
      } catch {}
    }

    // 4. Normalize & Deduplicate
    const normalizedVideos = rawVideos.map((r) => this.normalizer.normalize(r));
    const dedupedVideos = this.deduplicator.deduplicate(normalizedVideos);
    const validVideos = this.validator.filterValid(dedupedVideos, options?.minQualityScore ?? 45);

    const normalizedDocs = rawDocs.map((r) => this.normalizer.normalize(r));
    const dedupedDocs = this.deduplicator.deduplicate(normalizedDocs);
    const validDocs = this.validator.filterValid(dedupedDocs, options?.minQualityScore ?? 40);

    const normalizedPractice = rawPractice.map((r) => this.normalizer.normalize(r));
    const dedupedPractice = this.deduplicator.deduplicate(normalizedPractice);

    // 5. Contextual Quality Scoring for this specific module
    const scoringContext = cleanMod;
    const minVideoScore = Math.max(options?.minQualityScore ?? 50, 48);

    const scoredVideos = this.qualityEngine
      .filterAndScoreBatch(validVideos, scoringContext, 'educational', minVideoScore, {
        objective: moduleContext.objective,
        moduleTitle: moduleContext.title,
        difficulty: moduleContext.level,
      })
      .filter((sc) => sc.score.topicRelevance >= 45)
      .sort((a, b) => {
        const scoreA = a.score.overall;
        const scoreB = b.score.overall;
        const relA = a.score.topicRelevance;
        const relB = b.score.topicRelevance;
        const freshA = a.score.recency;
        const freshB = b.score.recency;
        const practA = a.score.practicalDepth ?? a.resource.practicalDepthScore ?? 50;
        const practB = b.score.practicalDepth ?? b.resource.practicalDepthScore ?? 50;

        // If relevance difference is significant, accuracy always wins over recency
        if (Math.abs(relA - relB) > 10) {
          return relB - relA;
        }

        // If both videos have strong relevance (>= 65):
        // Prioritize practical depth when difference is marked, else blend score and recency
        if (relA >= 65 && relB >= 65) {
          if (Math.abs(practA - practB) >= 18) {
            return practB - practA;
          }
          const rankWeightA = scoreA * 0.7 + freshA * 0.3;
          const rankWeightB = scoreB * 0.7 + freshB * 0.3;
          return rankWeightB - rankWeightA;
        }

        // Fallback to composite overall score
        return scoreB - scoreA;
      })
      .map((sc) => {
        const item = sc.resource;
        item.finalScore = sc.score.overall;
        item.url = item.canonicalUrl || item.sourceUrl;
        item.author = item.authorOrChannel;
        item.relevanceScore = sc.score.topicRelevance;
        item.educationalValueScore = sc.score.educationalValue;
        item.structureScore = sc.score.contentDepth;
        const vid = item.externalId || extractYouTubeVideoId(item.canonicalUrl) || extractYouTubeVideoId(item.sourceUrl);
        if (vid) {
          item.externalId = vid;
        }
        if (!item.metadata) item.metadata = {};
        if (vid) {
          item.metadata.videoId = vid;
        }
        item.metadata.moduleId = `mod-${moduleContext.moduleNumber}`;
        item.metadata.moduleNumber = moduleContext.moduleNumber;
        return item;
      });

    const scoredDocs = this.qualityEngine
      .filterAndScoreBatch(validDocs, scoringContext, 'academic', options?.minQualityScore ?? 40)
      .filter((sc) => sc.score.topicRelevance >= 40)
      .sort((a, b) => b.score.overall - a.score.overall)
      .map((sc) => {
        const item = sc.resource;
        item.finalScore = sc.score.overall;
        item.url = item.canonicalUrl || item.sourceUrl;
        item.author = item.authorOrChannel;
        item.relevanceScore = sc.score.topicRelevance;
        item.educationalValueScore = sc.score.educationalValue;
        item.structureScore = sc.score.contentDepth;
        if (!item.metadata) item.metadata = {};
        item.metadata.moduleId = `mod-${moduleContext.moduleNumber}`;
        item.metadata.moduleNumber = moduleContext.moduleNumber;
        return item;
      });

    return {
      videos: scoredVideos,
      readingNotes: scoredDocs,
      practiceSets: dedupedPractice,
    };
  }
}

