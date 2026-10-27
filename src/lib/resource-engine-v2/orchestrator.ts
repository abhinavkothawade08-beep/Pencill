import {
  AnalyzedObjective,
  NormalizedResourceCandidate,
  RankingOptions,
  RankedResult,
  ResourceModality,
  DurationPreference,
  SearchQueryItem,
  EducationalDomain,
  QueryProviderTarget,
} from './types';
import { LearningObjectiveAnalyzer } from './analysis/objective-analyzer';
import { EducatorMatcher } from './educators/educator-matcher';
import { IntentAwareSearchPlanner } from './planning/search-planner';
import { ProviderRegistry } from './providers';
import { ExplainableRankingEngine } from './evaluation/ranking-engine';
import {
  ResourceModuleDistributor,
  ModuleInputContext,
} from './distribution/module-distributor';
import {
  DistributedModuleOutput,
  DistributionPlanOutput,
  DistributionOptions,
  PersistenceMappingResult,
} from './types/distribution';
import { extractChaptersFromDescription } from './chapters/chapter-resolver';
import { PersistenceMapper } from './persistence/persistence-mapper';
import {
  PersistenceSafeguardEngine,
  ValidationReport,
} from './persistence/persistence-safeguards';
import { getEngineConfig, EngineConfig } from './config';

export interface ModuleDiscoveryInput {
  moduleId: string;
  moduleNumber: number;
  moduleTitle: string;
  objective?: string;
  description?: string;
  subtopics?: string[];
  lessons?: Array<{
    title: string;
    type?: string;
    keyConcepts?: string[];
  }>;
}

export interface EngineDiscoveryInput {
  query?: string;
  goal?: string;
  subject?: string;
  topic?: string;
  academicLevel?: string;
  level?: string;
  domain?: string;
  targetExam?: string;
  preferredLanguage?: string;
  language?: string;
  modalities?: ResourceModality[];
  durationPreference?: DurationPreference;
  minQualityScore?: number;
  minRelevanceThreshold?: number;
  limit?: number;
  modules?: ModuleDiscoveryInput[];
  saveToDatabase?: boolean;
  pathId?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface EngineDiscoveryOutput {
  engineVersion: 'v2';
  query: string;
  domain: EducationalDomain;
  academicLevel: string;
  primaryConcepts: string[];
  distributedModules: DistributedModuleOutput[];
  rankedPool: RankedResult;
  persistenceMapping: PersistenceMappingResult;
  validationReport: ValidationReport;
  executionMetrics: {
    totalDurationMs: number;
    providerLatencies: Record<string, number>;
    queriesExecuted: number;
    totalCandidatesRetrieved: number;
    totalCandidatesEvaluated: number;
    totalCandidatesDistributed: number;
    partialFailures: string[];
    circuitBreakerTripped: boolean;
  };
}

/**
 * Sanitizes sensitive credential tokens and API keys from error messages and logs.
 */
function sanitizeMessage(text: string): string {
  return text
    .replace(/(key|token|auth|secret|api_key|apikey)=([a-zA-Z0-9_\-]{6,})/gi, '$1=[REDACTED]')
    .replace(/Bearer\s+[a-zA-Z0-9_\-\.]{8,}/gi, 'Bearer [REDACTED]');
}

/**
 * Executes an array of async functions with bounded concurrency.
 */
async function runWithConcurrencyLimit<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let currentIndex = 0;

  async function worker(): Promise<void> {
    while (currentIndex < tasks.length) {
      const idx = currentIndex++;
      try {
        const val = await tasks[idx]();
        results[idx] = { status: 'fulfilled', value: val };
      } catch (err) {
        results[idx] = { status: 'rejected', reason: err };
      }
    }
  }

  const workerCount = Math.min(concurrency, tasks.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * Central Orchestrator Facade for Pencill Resource Engine 2.0.
 * Coordinates analysis, planning, provider retrieval, ranking,
 * module distribution, chapter resolution, and persistence safeguards.
 */
export class ResourceEngineV2 {
  private readonly analyzer: LearningObjectiveAnalyzer;
  private readonly planner: IntentAwareSearchPlanner;
  private readonly providerRegistry: ProviderRegistry;
  private readonly rankingEngine: ExplainableRankingEngine;
  private readonly distributor: ResourceModuleDistributor;
  private readonly persistenceMapper: PersistenceMapper;
  private readonly persistenceSafeguards: PersistenceSafeguardEngine;

  constructor(options?: {
    providerRegistry?: ProviderRegistry;
    rankingEngine?: ExplainableRankingEngine;
    distributor?: ResourceModuleDistributor;
  }) {
    this.analyzer = new LearningObjectiveAnalyzer();
    this.planner = new IntentAwareSearchPlanner();
    this.providerRegistry = options?.providerRegistry || new ProviderRegistry();
    this.rankingEngine = options?.rankingEngine || new ExplainableRankingEngine();
    this.distributor = options?.distributor || new ResourceModuleDistributor(this.rankingEngine);
    this.persistenceMapper = new PersistenceMapper();
    this.persistenceSafeguards = new PersistenceSafeguardEngine();
  }

  /**
   * Main entry point for Resource Engine 2.0 discovery and distribution.
   */
  public async discover(
    input: EngineDiscoveryInput,
    options?: { config?: EngineConfig }
  ): Promise<EngineDiscoveryOutput> {
    const startTime = Date.now();
    const config = options?.config || getEngineConfig();
    const effectiveTimeoutMs = input.timeoutMs || config.v2TimeoutMs;
    const partialFailures: string[] = [];
    const providerLatencies: Record<string, number> = {};

    const rawTopic = (input.query || input.goal || input.topic || input.subject || 'General Study').trim();
    const academicLevel = input.academicLevel || input.level || 'intermediate';
    const minRelevance = input.minRelevanceThreshold ?? input.minQualityScore ?? config.defaultMinRelevanceThreshold;

    // 1. Analyze learning objectives
    const analyzedModules: ModuleInputContext[] = [];

    if (input.modules && input.modules.length > 0) {
      for (const mod of input.modules) {
        const analysisResult = this.analyzer.analyze({
          moduleTitle: mod.moduleTitle,
          courseTitle: rawTopic,
          moduleDescription: mod.objective || mod.description,
          lessonTitles: mod.subtopics || mod.lessons?.flatMap((l) => l.keyConcepts || [l.title]) || [],
          academicLevel,
          targetExam: input.targetExam,
          preferredLanguage: input.preferredLanguage || input.language,
          domainHint: input.domain,
          subject: input.subject,
        });

        analyzedModules.push({
          moduleId: mod.moduleId,
          moduleNumber: mod.moduleNumber,
          moduleTitle: mod.moduleTitle,
          objective: analysisResult.objective,
        });
      }
    } else {
      // Single query topic treated as primary module
      const analysisResult = this.analyzer.analyze({
        moduleTitle: rawTopic,
        courseTitle: rawTopic,
        academicLevel,
        targetExam: input.targetExam,
        domainHint: input.domain,
        subject: input.subject,
        preferredLanguage: input.preferredLanguage || input.language,
      });

      analyzedModules.push({
        moduleId: 'mod-1',
        moduleNumber: 1,
        moduleTitle: rawTopic,
        objective: analysisResult.objective,
      });
    }

    const primaryObjective = analyzedModules[0].objective;

    // 2. Generate search plans for all modules with Master Educator matching
    const allQueryTasks: Array<{ query: SearchQueryItem; provider: QueryProviderTarget }> = [];
    for (const mod of analyzedModules) {
      // Find matching Master Educators for this specific module context
      let candidateEducators: import('./educators/types').MasterEducatorRecord[] | undefined;
      try {
        const eduContext = EducatorMatcher.deriveContext({
          query: rawTopic,
          courseTitle: rawTopic,
          moduleTitle: mod.moduleTitle,
          moduleObjective: mod.objective.rawTitle,
          moduleObjectives: mod.objective.primaryConcepts,
          level: academicLevel,
          academicLevel,
          targetExam: input.targetExam,
          domain: mod.objective.domain,
          subject: mod.objective.subject,
          preferredLanguage: input.preferredLanguage || input.language,
        });
        const matched = EducatorMatcher.matchEducators(eduContext, { limit: 3, minScore: 40 });
        candidateEducators = matched.map((m) => m.educator);
      } catch {
        // Fall back gracefully if matcher encounters issues
      }

      const queries = this.planner.plan(mod.objective, {
        maxTotalQueries: 8,
        maxQueriesPerIntent: 2,
        maxQueriesPerModality: 4,
        matchingEducators: candidateEducators,
      });

      for (const q of queries) {
        for (const targetProvider of q.providerCompatibility) {
          allQueryTasks.push({ query: q, provider: targetProvider });
        }
      }
    }

    // Deduplicate queries per provider to prevent redundant network calls
    const uniqueQueryMap = new Map<string, { query: SearchQueryItem; provider: QueryProviderTarget }>();
    for (const item of allQueryTasks) {
      const key = `${item.provider}:${item.query.queryString.toLowerCase().trim()}`;
      if (!uniqueQueryMap.has(key)) {
        uniqueQueryMap.set(key, item);
      }
    }
    const executionTasks = Array.from(uniqueQueryMap.values());

    // 3. Execute queries with bounded concurrency and timeouts
    const candidatePool: NormalizedResourceCandidate[] = [];
    const seenCandidateKeys = new Set<string>();

    const searchWorkerTasks = executionTasks.map(({ query, provider: targetProvider }) => async () => {
      const provider = this.providerRegistry.get(targetProvider);
      if (!provider) {
        return;
      }

      const health = provider.getHealthStatus();
      if (!health.available) {
        partialFailures.push(`Provider [${provider.id}] unavailable: ${health.reason || 'Circuit breaker open'}`);
        return;
      }

      if (input.signal?.aborted) {
        return;
      }

      const workerController = new AbortController();
      if (input.signal) {
        input.signal.addEventListener('abort', () => workerController.abort(), { once: true });
      }

      const queryStart = Date.now();
      let timeoutId: NodeJS.Timeout | undefined;
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            workerController.abort();
            reject(new Error(`Timeout after ${effectiveTimeoutMs}ms`));
          }, effectiveTimeoutMs);
        });

        const searchPromise = provider.search(query, {
          timeoutMs: effectiveTimeoutMs,
          signal: workerController.signal,
          limit: input.limit || 8,
        });

        const result = await Promise.race([searchPromise, timeoutPromise]);
        const duration = Date.now() - queryStart;
        providerLatencies[provider.id] = (providerLatencies[provider.id] || 0) + duration;

        if (result && Array.isArray(result.candidates)) {
          for (const cand of result.candidates) {
            const key = `${cand.provider}:${cand.externalId}`;
            const urlKey = cand.canonicalUrl.toLowerCase();
            if (!seenCandidateKeys.has(key) && !seenCandidateKeys.has(urlKey)) {
              seenCandidateKeys.add(key);
              seenCandidateKeys.add(urlKey);
              candidatePool.push(cand);
            }
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        partialFailures.push(`Query failed on [${targetProvider}] "${query.queryString}": ${sanitizeMessage(msg)}`);
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    });

    await runWithConcurrencyLimit(searchWorkerTasks, config.concurrencyLimit);

    // 4. Candidate Ranking (Course-level overview)
    const rankingOptions: Partial<RankingOptions> = {
      minRelevanceThreshold: minRelevance,
      durationPreference: input.durationPreference || 'balanced',
      requireModalityDiversity: true,
      maxResults: Math.max(15, (input.limit || 12)),
    };

    const rankedPool = this.rankingEngine.rank(primaryObjective, candidatePool, rankingOptions);

    // 5. Module Distribution & Role Assignment
    const distributionOptions: Partial<DistributionOptions> = {
      minResourcesPerModule: 1,
      maxResourcesPerModule: 4,
      maxTotalResources: Math.max(15, (input.limit || 12)),
      allowCrossModuleSharing: false,
      minRelevanceThreshold: minRelevance,
      durationPreference: input.durationPreference || 'balanced',
    };

    const distributionPlan: DistributionPlanOutput = this.distributor.distribute(
      analyzedModules,
      candidatePool,
      distributionOptions
    );

    // 6. Chapter Timestamp Resolution for long lectures
    for (const mod of distributionPlan.modules) {
      for (const res of mod.resources) {
        if (res.modality === 'video' && res.durationMinutes >= 15) {
          const matchingCand = candidatePool.find((c) => c.canonicalUrl === res.canonicalUrl);
          if (matchingCand && matchingCand.description) {
            const extracted = extractChaptersFromDescription(
              matchingCand.description,
              matchingCand.durationSeconds,
              matchingCand.canonicalUrl
            );
            if (extracted.length > 0) {
              res.chapters = extracted;
              if (!res.chapterReference) {
                res.chapterReference = extracted[0];
              }
            }
          }
        }
      }
    }

    // 7. Supabase Persistence Mapping & Safeguard Validation (Pre-write dry-run)
    const persistenceMapping = this.persistenceMapper.mapDistributionToPersistence(
      distributionPlan.modules,
      input.pathId
    );
    const validationReport = this.persistenceSafeguards.validatePayload(persistenceMapping);

    const totalDurationMs = Date.now() - startTime;
    const totalDistributed = distributionPlan.modules.reduce((sum, m) => sum + m.resources.length, 0);

    const circuitBreakerTripped = this.providerRegistry.getAll().some(
      (p) => !p.getHealthStatus().available
    );

    return {
      engineVersion: 'v2',
      query: rawTopic,
      domain: primaryObjective.domain,
      academicLevel: primaryObjective.academicLevel || 'intermediate',
      primaryConcepts: primaryObjective.primaryConcepts,
      distributedModules: distributionPlan.modules,
      rankedPool,
      persistenceMapping,
      validationReport,
      executionMetrics: {
        totalDurationMs,
        providerLatencies,
        queriesExecuted: executionTasks.length,
        totalCandidatesRetrieved: candidatePool.length,
        totalCandidatesEvaluated: rankedPool.rankedCandidates.length + rankedPool.rejectedCandidates.length,
        totalCandidatesDistributed: totalDistributed,
        partialFailures,
        circuitBreakerTripped,
      },
    };
  }
}
