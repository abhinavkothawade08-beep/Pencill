import { z } from 'zod';
import {
  CurriculumObjectiveSchema,
  CurriculumModulePlanSchema,
  CurriculumProposalSchema,
  CurriculumValidationIssueSchema,
  CurriculumValidationResultSchema,
  SemanticClusterSchema,
  BloomLevelSchema,
} from './schemas';
import { EducationalDomain, AcademicLevel, LearnerGoalInput } from '../resource-engine/types';

export type BloomLevel = z.infer<typeof BloomLevelSchema>;
export type CurriculumObjective = z.infer<typeof CurriculumObjectiveSchema>;
export type CurriculumModulePlan = z.infer<typeof CurriculumModulePlanSchema>;
export type CurriculumProposal = z.infer<typeof CurriculumProposalSchema>;
export type CurriculumValidationIssue = z.infer<typeof CurriculumValidationIssueSchema>;
export type CurriculumValidationResult = z.infer<typeof CurriculumValidationResultSchema>;
export type SemanticCluster = z.infer<typeof SemanticClusterSchema>;

export type TopicComplexity = 'narrow_focused' | 'moderate' | 'comprehensive';

export interface ObjectiveAnalysis {
  readonly topic: string;
  readonly detectedDomain: EducationalDomain;
  readonly normalizedLevel: AcademicLevel;
  readonly complexity: TopicComplexity;
  readonly recommendedModuleCount: number;
  readonly recommendedTotalHours: number;
  readonly coreConcepts: readonly string[];
  readonly prerequisites: readonly string[];
  readonly targetAudienceSummary: string;
}

export interface CurriculumGenerationOptions {
  readonly forceFallback?: boolean;
  readonly timeoutMs?: number;
  readonly modelOverride?: string;
  readonly strictValidation?: boolean;
}
