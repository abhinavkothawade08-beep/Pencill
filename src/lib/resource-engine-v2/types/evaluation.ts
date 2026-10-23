import { z } from 'zod';
import { NormalizedResourceCandidateSchema } from './candidate';
import { ResourceCategorySchema } from './objective';

export const DurationPreferenceSchema = z.enum([
  'concise',       // Favors focused explanations (5-15 min)
  'balanced',      // Standard lectures and worked problem sets (15-40 min)
  'detailed',      // Deep dives and substantial implementations (30-75 min)
  'comprehensive', // Complete chapter courses and extended series (60-180+ min)
]);
export type DurationPreference = z.infer<typeof DurationPreferenceSchema>;

export const EducationalDepthTierSchema = z.enum([
  'superficial_overview', // Brief teaser or abstract without substantive pedagogical mechanics
  'focused_concept',      // Targeted explanation of a single syntax or primitive rule
  'in_depth_lecture',     // Deep derivation, worked problem sets, or hands-on code walkthrough
  'comprehensive_course', // Complete chapter coverage or full project implementation
]);
export type EducationalDepthTier = z.infer<typeof EducationalDepthTierSchema>;

export const RelevanceScoreBreakdownSchema = z.object({
  primaryConceptScore: z.number().min(0).max(35),
  domainAlignmentScore: z.number().min(0).max(20),
  outcomeCoverageScore: z.number().min(0).max(15),
  intentModalityScore: z.number().min(0).max(15),
  curricularContextScore: z.number().min(0).max(15),
  negativeCollisionPenalty: z.number().min(0).max(100),
  rawScore: z.number(),
  normalizedScore: z.number().min(0).max(100),
});
export type RelevanceScoreBreakdown = z.infer<typeof RelevanceScoreBreakdownSchema>;

export const RelevanceEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  isEligible: z.boolean(),
  breakdown: RelevanceScoreBreakdownSchema,
  positiveEvidence: z.array(z.string()),
  negativeEvidence: z.array(z.string()),
  missingEvidence: z.array(z.string()),
  rejectionReasons: z.array(z.string()),
});
export type RelevanceEvaluation = z.infer<typeof RelevanceEvaluationSchema>;

export const DepthEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  tier: EducationalDepthTierSchema,
  confidence: z.number().min(0).max(1),
  signalsObserved: z.array(z.string()),
  evidence: z.array(z.string()),
});
export type DepthEvaluation = z.infer<typeof DepthEvaluationSchema>;

export const DurationEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  durationSeconds: z.number().int().nonnegative().optional(),
  preference: DurationPreferenceSchema,
  suitabilityRationale: z.string(),
  isUnknownDuration: z.boolean(),
});
export type DurationEvaluation = z.infer<typeof DurationEvaluationSchema>;

export const ObjectiveCoverageResultSchema = z.object({
  coveredPrimaryConcepts: z.array(z.string()),
  coveredSupportingConcepts: z.array(z.string()),
  coveredOutcomes: z.array(z.string()),
  coveredSkills: z.array(z.string()),
  uncoveredConcepts: z.array(z.string()),
  coverageRatio: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string()),
  limitations: z.array(z.string()),
});
export type ObjectiveCoverageResult = z.infer<typeof ObjectiveCoverageResultSchema>;

export const EvaluatedResourceCandidateSchema = z.object({
  candidate: NormalizedResourceCandidateSchema,
  relevance: RelevanceEvaluationSchema,
  depth: DepthEvaluationSchema,
  durationSuitability: DurationEvaluationSchema,
  coverage: ObjectiveCoverageResultSchema,
  detectedCategory: ResourceCategorySchema.optional(),
  practicalQualityScore: z.number().min(0).max(100).optional(),
  categoryEvaluation: z.record(z.string(), z.unknown()).optional(),
  overallScore: z.number().min(0).max(100),
  rankingRationale: z.string(),
});
export type EvaluatedResourceCandidate = z.infer<typeof EvaluatedResourceCandidateSchema>;

export interface RankingWeights {
  relevanceWeight?: number; // Default: 0.50
  depthWeight?: number;     // Default: 0.25
  durationWeight?: number;  // Default: 0.15
  coverageWeight?: number;  // Default: 0.10
}

export interface RankingOptions {
  minRelevanceThreshold?: number;     // Default: 50
  durationPreference?: DurationPreference; // Default: 'balanced'
  maxResults?: number;                // Default: 6
  requireModalityDiversity?: boolean; // Default: true
  allowUnknownDuration?: boolean;     // Default: true
  weights?: RankingWeights;           // Configurable scoring weights
}

export interface RankedResult {
  rankedCandidates: EvaluatedResourceCandidate[];
  rejectedCandidates: Array<{
    candidate: import('./candidate').NormalizedResourceCandidate;
    rejectionReasons: string[];
    relevanceScore: number;
  }>;
  totalEvaluated: number;
  eligibleCount: number;
  summary: {
    averageRelevance: number;
    highestScore: number;
    modalitiesRepresented: string[];
    explanation: string;
  };
}
