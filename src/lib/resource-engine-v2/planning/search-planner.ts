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

    // 2. Generate raw candidate queries
    const candidates = QueryGenerator.generateCandidates(validatedObjective, config);

    // 3. Deduplicate and enforce diversity limits
    const deduplicated = QueryDeduplicator.deduplicate(candidates, config);

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
