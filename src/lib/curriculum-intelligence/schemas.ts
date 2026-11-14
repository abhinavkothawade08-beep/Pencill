import { z } from 'zod';

export const BloomLevelSchema = z.enum([
  'remember',
  'understand',
  'apply',
  'analyze',
  'evaluate',
  'create',
]);

export const CurriculumObjectiveSchema = z.object({
  id: z.string().min(1),
  statement: z.string().min(3),
  keyTerms: z.array(z.string()).default([]),
  bloomLevel: BloomLevelSchema.optional().default('understand'),
});

export const SearchQueriesSchema = z.object({
  videoQueries: z.array(z.string().min(2)).min(1),
  readingQueries: z.array(z.string().min(2)).min(1),
});

export const CurriculumModulePlanSchema = z.object({
  id: z.string().min(1),
  orderIndex: z.number().int().nonnegative(),
  title: z.string().min(2),
  description: z.string().min(5),
  concepts: z.array(z.string().min(1)).min(1),
  learningObjectives: z.array(CurriculumObjectiveSchema).min(1),
  prerequisites: z.array(z.string()).default([]),
  estimatedHours: z.number().positive(),
  searchQueries: SearchQueriesSchema,
  expectedOutcomes: z.array(z.string()).min(1),
  practicalExercises: z.array(z.string()).optional().default([]),
});

export const AcademicLevelSchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
  'undergraduate',
  'competitive_exam',
]);

export const CurriculumProposalSchema = z.object({
  courseTitle: z.string().min(2),
  domain: z.string().min(2),
  academicLevel: AcademicLevelSchema,
  totalEstimatedHours: z.number().positive(),
  pedagogicalRationale: z.string().min(5),
  modules: z.array(CurriculumModulePlanSchema).min(1),
});

export const CurriculumValidationIssueSchema = z.object({
  code: z.enum([
    'OVER_FRAGMENTED_MODULES',
    'UNDER_FRAGMENTED_MODULES',
    'REDUNDANT_OBJECTIVES',
    'DUPLICATE_CONCEPTS',
    'CIRCULAR_PREREQUISITE',
    'OUT_OF_ORDER_PREREQUISITE',
    'MISSING_CORE_CONCEPTS',
    'EMPTY_MODULE_CONCEPTS',
    'UNREALISTIC_PACING',
    'INSUFFICIENT_SEARCH_QUERIES',
    'TOPIC_CONSISTENCY_COLLISION',
  ]),
  severity: z.enum(['error', 'warning', 'info']),
  message: z.string().min(3),
  moduleIndex: z.number().int().nonnegative().optional(),
  remediation: z.string().optional(),
});

export const CurriculumValidationResultSchema = z.object({
  isValid: z.boolean(),
  score: z.number().min(0).max(100),
  moduleCount: z.number().int().nonnegative(),
  issues: z.array(CurriculumValidationIssueSchema),
  suggestedCorrections: z.array(z.string()),
});

export const SemanticClusterSchema = z.object({
  clusterId: z.string().min(1),
  clusterName: z.string().min(2),
  concepts: z.array(z.string().min(1)).min(1),
  rationale: z.string().min(5),
  suggestedTitle: z.string().min(2),
  priority: z.number().int().default(1),
  searchQueries: SearchQueriesSchema.optional(),
});
