import { z } from 'zod';
import { ResourceModalitySchema, QueryProviderTargetSchema } from './query';
import { ResourceCreatorSchema } from './candidate';
import { DurationPreferenceSchema } from './evaluation';
import { ResourceCategorySchema } from './objective';

export const ChapterTimestampProvenanceSchema = z.enum([
  'verified_provider_chapter',   // Explicitly returned in structured provider metadata
  'parsed_description_timestamp', // Parsed from verified timestamp regex in description text
]);
export type ChapterTimestampProvenance = z.infer<typeof ChapterTimestampProvenanceSchema>;

export const ChapterTimestampReferenceSchema = z.object({
  timestampFormatted: z.string().regex(/^\d{1,2}:\d{2}(:\d{2})?$/, 'Must be mm:ss or hh:mm:ss format'),
  seconds: z.number().int().nonnegative('Seconds must be non-negative integer'),
  title: z.string().min(1, 'Chapter title is required'),
  deepLinkUrl: z.string().url('Deep link URL must be a valid URL'),
  provenance: ChapterTimestampProvenanceSchema,
  confidence: z.number().min(0).max(1),
});
export type ChapterTimestampReference = z.infer<typeof ChapterTimestampReferenceSchema>;

export const AssignedResourceRoleSchema = z.enum([
  'primary_conceptual',      // Core theoretical exposition and definition
  'worked_demonstration',   // Step-by-step problem walkthrough or experiment
  'practical_application',  // Hands-on code tutorial, project build, or lab
  'supplementary_reading',  // Authoritative documentation, monograph, or paper
  'practice_exercise',      // Problem sets, self-tests, or exam practice
]);
export type AssignedResourceRole = z.infer<typeof AssignedResourceRoleSchema>;

export const DistributedResourceItemSchema = z.object({
  resourceId: z.string().min(1),
  candidateId: z.string().min(1),
  provider: QueryProviderTargetSchema,
  externalId: z.string().min(1),
  title: z.string().min(1),
  canonicalUrl: z.string().url(),
  sourceUrl: z.string().url(),
  modality: ResourceModalitySchema,
  durationSeconds: z.number().int().nonnegative().optional(),
  durationMinutes: z.number().int().nonnegative(),
  relevanceScore: z.number().min(0).max(100),
  overallScore: z.number().min(0).max(100),
  selectionReason: z.string(),
  coverageAssessment: z.string(),
  assignedRole: AssignedResourceRoleSchema,
  resourceCategory: ResourceCategorySchema.optional(),
  practicalEvidence: z.record(z.string(), z.unknown()).optional(),
  chapterReference: ChapterTimestampReferenceSchema.optional(),
  chapters: z.array(ChapterTimestampReferenceSchema).default([]),
  creator: ResourceCreatorSchema.optional(),
  sourceName: z.string(),
  isVerified: z.boolean().default(false),
  discoverySource: z.string().default('open_discovery'),
});
export type DistributedResourceItem = z.infer<typeof DistributedResourceItemSchema>;

export const DistributedModuleOutputSchema = z.object({
  moduleId: z.string().min(1),
  moduleNumber: z.number().int().positive(),
  moduleTitle: z.string().min(1),
  resources: z.array(DistributedResourceItemSchema),
  coverageSummary: z.object({
    satisfiedRatio: z.number().min(0).max(1),
    coveredConcepts: z.array(z.string()),
    uncoveredConcepts: z.array(z.string()),
  }),
  isEmptyState: z.boolean(),
  emptyStateReason: z.string().optional(),
  totalDurationMinutes: z.number().int().nonnegative(),
});
export type DistributedModuleOutput = z.infer<typeof DistributedModuleOutputSchema>;

export const DistributionPlanOutputSchema = z.object({
  modules: z.array(DistributedModuleOutputSchema),
  totalResourcesAssigned: z.number().int().nonnegative(),
  sharedResourcesCount: z.number().int().nonnegative(),
  summary: z.string(),
});
export type DistributionPlanOutput = z.infer<typeof DistributionPlanOutputSchema>;

export const DistributionOptionsSchema = z.object({
  minResourcesPerModule: z.number().int().nonnegative().default(1),
  maxResourcesPerModule: z.number().int().positive().default(4),
  maxTotalResources: z.number().int().positive().default(15),
  allowCrossModuleSharing: z.boolean().default(false),
  minCrossModuleCoverageThreshold: z.number().min(0).max(1).default(0.5),
  requireComplementaryRoles: z.boolean().default(true),
  minRelevanceThreshold: z.number().min(0).max(100).default(50),
  durationPreference: DurationPreferenceSchema.default('balanced'),
});
export type DistributionOptions = z.infer<typeof DistributionOptionsSchema>;

/**
 * Persistence mapping result for compatibility with Supabase contracts.
 */
export interface UnmappedFieldReport {
  field: string;
  sourceContext: string;
  reason: string;
}

export interface PersistenceMappingResult {
  success: boolean;
  databaseResources: Array<{
    id: string;
    title: string;
    type: string;
    duration_minutes: number;
    source_name: string;
    source_url: string;
    description: string | null;
    external_id: string | null;
    quality_score: number;
    is_verified: boolean;
    last_verified_at: string | null;
    educator_id: string | null;
    discovery_source: string | null;
  }>;
  databaseLessons: Array<{
    id: string;
    module_id: string;
    title: string;
    type: string;
    duration_minutes: number;
    source_name: string;
    source_url: string | null;
    order_index: number;
    concept_id: string | null;
    prerequisites_note: string | null;
    chapters: unknown; // Json
    formulae: unknown; // Json
    summary_points: string[];
    study_notes: unknown; // Json
    educator_id: string | null;
    discovery_source: string | null;
  }>;
  learningPathModules: Array<{
    id: string;
    title: string;
    moduleNumber: number;
    orderIndex: number;
    status: 'completed' | 'in_progress' | 'locked';
    totalResources: number;
    lessons: Array<{
      id: string;
      title: string;
      type: string;
      durationMinutes: number;
      sourceName: string;
      sourceUrl: string;
      orderIndex: number;
      conceptId?: string;
      chapters?: Array<{ timestamp: string; seconds: number; title: string }>;
      qualityScore: number;
      studyNotes?: unknown;
      educatorId?: string;
      discoverySource?: string;
      selectionExplanation?: string;
      coverageAssessment?: string;
    }>;
  }>;
  unmappedFields: UnmappedFieldReport[];
  warnings: string[];
}
