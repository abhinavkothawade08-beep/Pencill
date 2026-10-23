import { ResourceEngineV2, EngineDiscoveryInput } from '../orchestrator';
import { EngineResource, SearchOptions, DiscoveryResult, NormalizedPublicResource, toPublicResource } from '../types/legacy-contracts';
import { adaptV2ToDiscoverResponse } from './compatibility-adapter';
import { LearningObjectiveAnalyzer } from '../analysis/objective-analyzer';
import { ExplainableRelevanceScorer } from '../evaluation/relevance-scorer';
import { EducationalDepthEvaluator } from '../evaluation/depth-evaluator';
import { DurationIntelligenceEvaluator } from '../evaluation/duration-intelligence';

const defaultEngine = new ResourceEngineV2();

export const resourceEngine = defaultEngine;

/**
 * Backward-compatible helper for discoverResources using Resource Engine 2.0.
 */
export async function discoverResources(
  query: string,
  options?: SearchOptions
): Promise<DiscoveryResult> {
  const startTime = Date.now();
  const v2Result = await defaultEngine.discover({
    query,
    academicLevel: options?.difficulty || 'intermediate',
    targetExam: options?.examContext,
    limit: options?.limit || 12,
    timeoutMs: options?.timeoutMs,
  });

  const rankedResources = v2Result.rankedPool.rankedCandidates.map((c, idx) => {
    const res: EngineResource = {
      id: c.candidate.id,
      title: c.candidate.title,
      description: c.candidate.description || '',
      type: c.candidate.modality === 'video'
        ? 'video_lecture'
        : c.candidate.modality === 'paper'
        ? 'research_paper'
        : 'study_notes',
      canonicalUrl: c.candidate.canonicalUrl,
      sourceUrl: c.candidate.sourceUrl,
      sourceName: c.candidate.creator?.name || c.candidate.provider,
      provider: c.candidate.provider === 'youtube' ? 'youtube' : 'notes',
      externalId: c.candidate.externalId,
      authorOrChannel: c.candidate.creator?.name,
      durationMinutes: c.candidate.durationSeconds ? Math.round(c.candidate.durationSeconds / 60) : 20,
      difficulty: options?.difficulty || 'intermediate',
      language: 'en',
      discoveredAt: new Date().toISOString(),
      score: {
        overall: Math.round(c.overallScore),
        relevance: Math.round(c.relevance.score),
        educationalValue: Math.round(c.depth.score),
        structureCompleteness: Math.round(c.coverage.coverageRatio * 100),
        freshness: 85,
        explanation: c.rankingRationale,
      },
      tags: [],
      resourceCategory: c.detectedCategory,
      practicalEvidence: c.categoryEvaluation?.breakdown as any,
    };

    return {
      resource: res,
      finalScore: Math.round(c.overallScore),
      rank: idx + 1,
      reason: c.rankingRationale,
    };
  });

  return {
    rankedResources,
    totalFound: v2Result.rankedPool.totalEvaluated,
    executionMetrics: {
      durationMs: Date.now() - startTime,
      providerLatencies: v2Result.executionMetrics.providerLatencies,
      countsByProvider: {},
    },
    filterStats: {
      totalCandidates: v2Result.rankedPool.totalEvaluated,
      passedQualityFilter: v2Result.rankedPool.rankedCandidates.length,
      rejectedLowQuality: v2Result.rankedPool.rejectedCandidates.length,
      deduplicatedCount: 0,
    },
    deduplicationStats: {
      initialCount: v2Result.rankedPool.totalEvaluated,
      finalCount: v2Result.rankedPool.rankedCandidates.length,
      removedExactUrlDuplicates: 0,
      removedVideoIdDuplicates: 0,
      removedFuzzyTitleDuplicates: 0,
    },
    queryInterpretation: {
      originalQuery: query,
      cleanTopic: query,
      detectedDomain: v2Result.domain,
      targetLevel: v2Result.academicLevel as any,
      subtopics: v2Result.primaryConcepts,
    },
  };
}

/**
 * Backward-compatible helper for discovering module resources.
 */
export async function discoverModuleResources(
  moduleTitle: string,
  courseTopic: string,
  options?: SearchOptions
): Promise<DiscoveryResult> {
  return discoverResources(`${courseTopic} ${moduleTitle}`, options);
}

/**
 * Backward-compatible helper for discovering lesson notes using V2 academic providers.
 */
export async function discoverLessonNotes(
  lessonTitle: string,
  topic: string,
  options?: {
    domain?: string;
    examContext?: string;
    limit?: number;
    minQualityScore?: number;
  }
): Promise<EngineResource[]> {
  const result = await discoverResources(`${topic} ${lessonTitle} notes`, {
    difficulty: 'intermediate',
    examContext: options?.examContext,
    limit: options?.limit || 6,
  });

  return result.rankedResources
    .filter((r) => r.resource.type !== 'video_lecture')
    .map((r) => r.resource);
}

/**
 * Backward-compatible helper for discovering practice problems using V2.
 */
export async function discoverPractice(
  topic: string,
  options?: {
    examContext?: string;
    difficulty?: string;
    limit?: number;
  }
): Promise<EngineResource[]> {
  const result = await discoverResources(`${topic} practice questions`, {
    difficulty: (options?.difficulty as any) || 'intermediate',
    examContext: options?.examContext,
    limit: options?.limit || 6,
  });

  return result.rankedResources.map((r) => ({
    ...r.resource,
    type: 'practice_questions' as const,
  }));
}

/**
 * Quota and availability status helpers
 */
export function isYouTubeQuotaExhausted(): boolean {
  const status = defaultEngine['providerRegistry'].get('youtube')?.getHealthStatus();
  return status?.quotaExhausted ?? false;
}

export function isGoogleSearchAvailable(): boolean {
  return true;
}

/**
 * Backward-compatible EvaluationEngine implementation powered by Resource Engine 2.0.
 */
export class EvaluationEngine {
  private readonly analyzer = new LearningObjectiveAnalyzer();
  private readonly scorer = new ExplainableRelevanceScorer();
  private readonly depthEvaluator = new EducationalDepthEvaluator();
  private readonly durationEvaluator = new DurationIntelligenceEvaluator();

  public async evaluateBatch(
    resources: EngineResource[],
    context: {
      topic: string;
      targetLevel?: string;
      examContext?: string;
      contentType?: string;
    }
  ): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    if (!resources || resources.length === 0) return results;

    const analysis = this.analyzer.analyze({
      moduleTitle: context.topic,
      academicLevel: context.targetLevel || 'intermediate',
      targetExam: context.examContext,
    });

    for (const res of resources) {
      const candidate = {
        id: res.id,
        provider: (res.provider === 'youtube' ? 'youtube' : 'openalex') as any,
        externalId: res.externalId || res.id,
        title: res.title,
        description: res.description,
        canonicalUrl: res.canonicalUrl || res.sourceUrl,
        sourceUrl: res.sourceUrl,
        modality: (res.type === 'video_lecture' || res.type === 'youtube_playlist' ? 'video' : 'paper') as any,
        durationSeconds: res.durationMinutes ? res.durationMinutes * 60 : undefined,
        creator: { name: res.authorOrChannel || res.sourceName },
        verificationStatus: 'verified_channel' as const,
        retrievalProvenance: { provider: 'youtube' as const, retrievedAt: new Date().toISOString(), queryString: context.topic },
        missingMetadata: [],
      };

      const rel = this.scorer.score(analysis.objective, candidate);
      const depth = this.depthEvaluator.evaluate(analysis.objective, candidate);
      const duration = this.durationEvaluator.evaluate(candidate, 'balanced', analysis.objective.cognitiveIntent);
      const overall = Math.round(rel.score * 0.4 + depth.score * 0.3 + duration.score * 0.2 + 10);

      results.set(res.id, {
        resourceId: res.id,
        score: {
          overall,
          relevance: rel.score,
          educationalValue: depth.score,
          structureCompleteness: 80,
          freshness: 85,
          explanation: rel.positiveEvidence.join('; ') || 'Verified educational resource',
        },
        strengths: rel.positiveEvidence,
        weaknesses: rel.negativeEvidence,
        recommendedUse: rel.positiveEvidence[0] || 'Core study resource',
        evaluator: 'v2-explainable',
        evaluatedAt: new Date().toISOString(),
      });
    }

    return results;
  }
}

