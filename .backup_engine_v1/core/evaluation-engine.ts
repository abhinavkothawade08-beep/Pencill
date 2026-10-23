import { EngineResource, EvaluationResult, ResourceQualityBreakdown } from '../types';
import { QualityScoringEngine } from './quality-scoring';

export interface EvaluationContext {
  topic: string;
  targetLevel?: string;
  examContext?: string;
  intent?: string;
  contentType?: 'educational' | 'current_news' | 'documentary' | 'entertainment';
}

export class EvaluationEngine {
  private qualityScorer = new QualityScoringEngine();

  async evaluateBatch(
    resources: EngineResource[],
    context: EvaluationContext
  ): Promise<Map<string, EvaluationResult>> {
    const results = new Map<string, EvaluationResult>();
    if (resources.length === 0) return results;

    const contentType = context.contentType || this.qualityScorer.detectContentType(context.topic);

    // Run evidence-based quality scoring with AI batch enrichment if configured
    const scoredList = await this.qualityScorer.evaluateBatchWithAi(
      resources,
      context.topic,
      contentType
    );

    for (const item of scoredList) {
      const qScore = item.score;
      const breakdown: ResourceQualityBreakdown = {
        overall: qScore.overall,
        relevance: qScore.topicRelevance,
        educationalValue: qScore.educationalValue,
        structureCompleteness: qScore.contentDepth,
        freshness: qScore.recency,
        explanation: qScore.explanation,
      };

      const strengths: string[] = [];
      if (qScore.publisherCredibility >= 80) strengths.push('High publisher credibility & domain authority');
      if (qScore.evidence.hasHighDefinition) strengths.push('Verifiable high definition production');
      if (qScore.evidence.hasCaptionsOrTranscript) strengths.push('Verified closed captions / transcript available');
      if (qScore.evidence.hasTimestampsOrChapters) strengths.push('Detailed timestamp chapters provided');
      if (qScore.topicRelevance >= 80) strengths.push('Strong alignment with core topic keywords');

      results.set(item.resource.id, {
        resourceId: item.resource.id,
        score: breakdown,
        strengths,
        weaknesses: qScore.evidence.uncertaintyReasons,
        recommendedUse: qScore.explanation,
        evaluator: process.env.GEMINI_API_KEY ? 'gemini' : 'heuristic',
        evaluatedAt: new Date().toISOString(),
      });
    }

    // Ensure all input resources are accounted for
    for (const res of resources) {
      if (!results.has(res.id)) {
        results.set(res.id, this.evaluateHeuristic(res, context));
      }
    }

    return results;
  }

  evaluateHeuristic(resource: EngineResource, context: EvaluationContext): EvaluationResult {
    const contentType = context.contentType || this.qualityScorer.detectContentType(context.topic);
    const qScore = this.qualityScorer.evaluateResource(resource, context.topic, contentType);

    const breakdown: ResourceQualityBreakdown = {
      overall: qScore.overall,
      relevance: qScore.topicRelevance,
      educationalValue: qScore.educationalValue,
      structureCompleteness: qScore.contentDepth,
      freshness: qScore.recency,
      explanation: qScore.explanation,
    };

    const strengths: string[] = [];
    if (qScore.publisherCredibility >= 80) strengths.push('Accredited academic / educational channel');
    if (qScore.evidence.hasHighDefinition) strengths.push('HD video stream');
    if (qScore.evidence.hasCaptionsOrTranscript) strengths.push('Verified captions');

    return {
      resourceId: resource.id,
      score: breakdown,
      strengths,
      weaknesses: qScore.evidence.uncertaintyReasons,
      recommendedUse: qScore.explanation,
      evaluator: 'heuristic',
      evaluatedAt: new Date().toISOString(),
    };
  }
}
