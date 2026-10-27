import { z } from 'zod';
import type { MasterEducatorRecord } from '../educators/types';

/**
 * Educational Resource Modality represents the form factor of the resource.
 */
export const ResourceModalitySchema = z.enum([
  'video',
  'monograph',
  'practice',
  'quiz',
  'documentation',
  'paper',
  'formulae',
  'project',
]);
export type ResourceModality = z.infer<typeof ResourceModalitySchema>;

/**
 * Compatible search and content providers supported by the engine.
 */
export const QueryProviderTargetSchema = z.enum([
  'youtube',
  'google',
  'academic_notes',
  'openalex',
  'arxiv',
  'wikimedia',
  'curated_directory',
]);
export type QueryProviderTarget = z.infer<typeof QueryProviderTargetSchema>;

/**
 * Search Intent targets specific educational requirements during candidate retrieval.
 */
export const SearchIntentSchema = z.enum([
  'foundational_explanation',
  'in_depth_conceptual',
  'worked_examples',
  'practical_demonstration',
  'coding_walkthrough',
  'project_implementation',
  'exam_practice',
  'authoritative_documentation',
  // Canonical Practical Learning Search Intents
  'practical_tutorial',
  'guided_exercise',
  'project_based',
  'real_world_application',
  'advanced_optimization',
]);
export type SearchIntent = z.infer<typeof SearchIntentSchema>;

/**
 * SearchQueryItem is the canonical search plan item produced by the Search Planner.
 * Contains explicit search string, targeted intent, provenance, and provider compatibility.
 */
export const SearchQueryItemSchema = z.object({
  id: z.string(),
  targetConcept: z.string(),
  queryString: z.string().min(1, 'Query string must not be empty'),
  intent: SearchIntentSchema,
  preferredModality: ResourceModalitySchema,
  providerCompatibility: z.array(QueryProviderTargetSchema).min(1, 'At least one provider target required'),
  priority: z.number().int().min(1).max(5), // 1 = Highest priority, 5 = Lowest priority
  provenance: z.string(),                    // Explicit rationale explaining why this query exists
  negativeTerms: z.array(z.string()).optional(),
  targetExam: z.string().optional(),
  language: z.string().optional(),
  channelOrSourceHint: z.string().optional(),
});
export type SearchQueryItem = z.infer<typeof SearchQueryItemSchema>;

/**
 * Configuration options for the Intent-Aware Search Planner.
 */
export interface PlannerConfig {
  maxTotalQueries?: number;             // Default: 6
  maxQueriesPerIntent?: number;          // Default: 2
  maxQueriesPerModality?: number;        // Default: 3
  includeExclusionTerms?: boolean;       // Default: true
  enableExamAnchoring?: boolean;         // Default: true
  preferredProviders?: QueryProviderTarget[];
  allowedModalities?: ResourceModality[];
  matchingEducators?: MasterEducatorRecord[];
}

export const DEFAULT_PLANNER_CONFIG: Required<Omit<PlannerConfig, 'preferredProviders' | 'allowedModalities' | 'matchingEducators'>> & {
  preferredProviders: QueryProviderTarget[];
  allowedModalities: ResourceModality[];
} = {
  maxTotalQueries: 6,
  maxQueriesPerIntent: 2,
  maxQueriesPerModality: 3,
  includeExclusionTerms: true,
  enableExamAnchoring: true,
  preferredProviders: ['youtube', 'google', 'academic_notes', 'curated_directory'],
  allowedModalities: ['video', 'monograph', 'practice', 'documentation'],
};
