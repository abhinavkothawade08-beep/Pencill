import { z } from 'zod';
import { ResourceModalitySchema, QueryProviderTargetSchema } from './query';

/**
 * Verification status of a candidate resource.
 * Raw API retrieval is strictly 'unverified_candidate'.
 * Verified channels/educators or curated entries receive explicit higher trust levels.
 */
export const CandidateVerificationStatusSchema = z.enum([
  'unverified_candidate', // Directly fetched from open API response; unverified identity
  'verified_channel',     // Channel ID or author handle matches known verified registry
  'curated_authority',    // Manually verified foundational textbook, open-access spec, or monograph
]);
export type CandidateVerificationStatus = z.infer<typeof CandidateVerificationStatusSchema>;

/**
 * Creator metadata (Channel, Author, Institution, or Organization).
 */
export const ResourceCreatorSchema = z.object({
  name: z.string().min(1, 'Creator name must not be empty'),
  channelId: z.string().optional(),
  authorId: z.string().optional(),
  url: z.string().optional(),
});
export type ResourceCreator = z.infer<typeof ResourceCreatorSchema>;

/**
 * Retrieval Provenance records exact context of where, when, and why
 * this resource candidate was obtained.
 */
export const RetrievalProvenanceSchema = z.object({
  queryId: z.string().optional(),
  queryString: z.string(),
  intent: z.string().optional(),
  provider: QueryProviderTargetSchema,
  retrievedAt: z.string(), // ISO-8601 timestamp
  cacheHit: z.boolean().optional(),
});
export type RetrievalProvenance = z.infer<typeof RetrievalProvenanceSchema>;

/**
 * Playlist metadata when the candidate is a playlist or a constituent item.
 */
export const PlaylistMetadataSchema = z.object({
  isPlaylist: z.boolean().default(false),
  playlistId: z.string().optional(),
  playlistItemCount: z.number().int().nonnegative().optional(),
  playlistIndex: z.number().int().nonnegative().optional(),
  incompleteExpansion: z.boolean().optional(),
  inaccessibleCount: z.number().int().nonnegative().optional(),
});
export type PlaylistMetadata = z.infer<typeof PlaylistMetadataSchema>;

/**
 * Canonical Provider-Independent Resource Candidate Contract.
 * Validates normalized metadata across YouTube, OpenAlex, ArXiv, Wikimedia, etc.
 * 
 * Invariants:
 * - Unavailable duration is undefined (never fabricated to 20 or 120 minutes).
 * - Exact missing fields are listed in missingMetadata.
 * - Zero quality scores in this phase (relevance scoring belongs to Phase 4).
 */
export const NormalizedResourceCandidateSchema = z.object({
  id: z.string().min(1, 'Candidate ID required'),
  provider: QueryProviderTargetSchema,
  externalId: z.string().min(1, 'External provider ID required'),
  title: z.string().min(1, 'Resource title required'),
  description: z.string().optional(),
  canonicalUrl: z.string().url('Canonical URL must be a valid absolute URL'),
  sourceUrl: z.string().url('Source URL must be a valid URL'),
  modality: ResourceModalitySchema,
  creator: ResourceCreatorSchema.optional(),
  publishedAt: z.string().optional(), // ISO-8601 string when available
  durationSeconds: z.number().int().nonnegative().optional(), // undefined if unknown; 0 if valid 0
  thumbnailUrl: z.string().url().optional(),
  language: z.string().optional(),
  isEmbeddable: z.boolean().optional(),
  playlist: PlaylistMetadataSchema.optional(),
  verificationStatus: CandidateVerificationStatusSchema.default('unverified_candidate'),
  retrievalProvenance: RetrievalProvenanceSchema,
  missingMetadata: z.array(z.string()).default([]),
  rawMetadata: z.record(z.string(), z.unknown()).optional(),
});
export type NormalizedResourceCandidate = z.infer<typeof NormalizedResourceCandidateSchema>;

/**
 * Declared capabilities of a resource provider adapter.
 */
export interface ProviderCapabilities {
  readonly supportedModalities: readonly string[];
  readonly maxBatchSize: number;
  readonly supportsCancellation: boolean;
  readonly supportsPlaylistExpansion: boolean;
  readonly quotaLimited: boolean;
  readonly requiresApiKey: boolean;
}

/**
 * Runtime execution options for a provider search.
 */
export interface ProviderExecutionOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
  expandPlaylists?: boolean;
  maxPlaylistItems?: number;
  limit?: number;
  bypassCache?: boolean;
}

/**
 * Operational health and circuit breaker status of a provider.
 */
export interface ProviderHealthStatus {
  available: boolean;
  quotaExhausted: boolean;
  cooldownRemainingMs: number;
  circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  reason?: string;
}

/**
 * Return contract of a provider search execution.
 */
export interface ProviderSearchResult {
  provider: string;
  query: string;
  candidates: NormalizedResourceCandidate[];
  partialFailures?: string[];
  metadata: {
    latencyMs: number;
    quotaUsedEstimate?: number;
    cacheHit?: boolean;
    totalFetched?: number;
  };
}
