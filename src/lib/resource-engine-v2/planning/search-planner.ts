import {
  AnalyzedObjective,
  AnalyzedObjectiveSchema,
  AnalysisResult,
  ModuleContextInput,
  PlannerConfig,
  SearchQueryItem,
  SearchQueryItemSchema,
} from '../types';
import { LearningObjectiveAnalyzer } from '../analysis/objective-analyzer';
import { QueryGenerator } from './query-generator';
import { QueryDeduplicator } from './query-deduplicator';
import { EducatorMatcher } from '../educators/educator-matcher';

/**
 * Intent-Aware Search Planner (Stage 2 of Resource Engine 2.0)
 * 
 * Generates targeted, balanced, and deduplicated search queries
 * based on analyzed module objectives and cognitive intent.
 */
export class IntentAwareSearchPlanner {
  private analyzer: LearningObjectiveAnalyzer;

  constructor() {
    this.analyzer = new LearningObjectiveAnalyzer();
  }

  /**
   * Plans search queries from an existing AnalyzedObjective.
   */
  public plan(
    objective: AnalyzedObjective,
    config: PlannerConfig = {}
  ): SearchQueryItem[] {
    // 1. Validate objective schema
    const validatedObjective = AnalyzedObjectiveSchema.parse(objective);

    // Auto-discover matching educators if not explicitly provided
    const effectiveConfig = { ...config };
    if (!effectiveConfig.matchingEducators) {
      try {
        const eduContext = EducatorMatcher.deriveContext({
          query: validatedObjective.rawTitle,
          courseTitle: validatedObjective.rawTitle,
          moduleTitle: validatedObjective.rawTitle,
          moduleObjective: validatedObjective.rawTitle,
          moduleObjectives: validatedObjective.primaryConcepts,
          level: validatedObjective.academicLevel,
          academicLevel: validatedObjective.academicLevel,
          targetExam: validatedObjective.targetExam,
          domain: validatedObjective.domain,
          subject: validatedObjective.subject,
          preferredLanguage: validatedObjective.preferredLanguage,
        });
        const matched = EducatorMatcher.matchEducators(eduContext, { limit: 2, minScore: 45 });
        effectiveConfig.matchingEducators = matched.map((m) => m.educator);
      } catch {
        // Fall back gracefully
      }
    }

    // 2. Generate raw candidate queries
    const candidates = QueryGenerator.generateCandidates(validatedObjective, effectiveConfig);

    // 3. Deduplicate and enforce diversity limits
    const deduplicated = QueryDeduplicator.deduplicate(candidates, effectiveConfig);

    // 4. Validate output schema for every query item
    return deduplicated.map((q) => SearchQueryItemSchema.parse(q));
  }

  /**
   * End-to-end convenience method: Analyzes raw module context and generates search plan.
   */
  public planFromContext(
    input: ModuleContextInput,
    config: PlannerConfig = {}
  ): {
    analysis: AnalysisResult;
    queries: SearchQueryItem[];
  } {
    const analysis = this.analyzer.analyze(input);
    const queries = this.plan(analysis.objective, config);

    return {
      analysis,
      queries,
    };
  }
}
