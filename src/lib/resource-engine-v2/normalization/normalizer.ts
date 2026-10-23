import {
  NormalizedResourceCandidate,
  NormalizedResourceCandidateSchema,
  ResourceCreator,
  PlaylistMetadata,
  CandidateVerificationStatus,
  RetrievalProvenance,
} from '../types/candidate';
import { QueryProviderTarget, ResourceModality } from '../types/query';
import { validateAndCanonicalizeUrl } from './url-normalizer';

export interface RawCandidateInput {
  provider: QueryProviderTarget;
  externalId: string;
  title: string;
  description?: string | null;
  rawUrl: string;
  sourceUrl?: string | null;
  modality: ResourceModality;
  creator?: ResourceCreator | null;
  publishedAt?: string | null;
  durationSeconds?: number | null;
  thumbnailUrl?: string | null;
  language?: string | null;
  isEmbeddable?: boolean | null;
  playlist?: PlaylistMetadata | null;
  verificationStatus?: CandidateVerificationStatus;
  provenance: {
    queryId?: string;
    queryString: string;
    intent?: string;
  };
  rawMetadata?: Record<string, unknown>;
}

export interface NormalizationResult {
  candidate: NormalizedResourceCandidate | null;
  error?: string;
}

/**
 * Normalizes raw provider payloads into canonical NormalizedResourceCandidate objects.
 * Tracks missing fields explicitly and discards malformed candidates safely.
 */
export function normalizeCandidate(raw: RawCandidateInput): NormalizationResult {
  const missingMetadata: string[] = [];

  // 1. Title validation
  const cleanTitle = (raw.title || '').replace(/\s+/g, ' ').trim();
  if (!cleanTitle) {
    return { candidate: null, error: 'Candidate missing valid title' };
  }

  // 2. External ID validation
  const cleanId = (raw.externalId || '').trim();
  if (!cleanId) {
    return { candidate: null, error: 'Candidate missing external provider identifier' };
  }

  // 3. URL canonicalization and validation
  const canonicalUrl = validateAndCanonicalizeUrl(raw.rawUrl);
  if (!canonicalUrl) {
    return { candidate: null, error: `Invalid or unparseable URL: "${raw.rawUrl}"` };
  }

  const sourceUrl = validateAndCanonicalizeUrl(raw.sourceUrl || raw.rawUrl);
  if (!sourceUrl) {
    return { candidate: null, error: `Invalid source URL: "${raw.sourceUrl}"` };
  }

  // 4. Missing metadata tracking
  if (!raw.description || !raw.description.trim()) {
    missingMetadata.push('description');
  }

  let finalDurationSeconds: number | undefined = undefined;
  if (raw.durationSeconds !== undefined && raw.durationSeconds !== null && !isNaN(raw.durationSeconds)) {
    finalDurationSeconds = Math.max(0, Math.round(raw.durationSeconds));
  } else {
    missingMetadata.push('durationSeconds');
  }

  let finalThumbnail: string | undefined = undefined;
  if (raw.thumbnailUrl) {
    const validThumb = validateAndCanonicalizeUrl(raw.thumbnailUrl);
    if (validThumb) {
      finalThumbnail = validThumb;
    } else {
      missingMetadata.push('thumbnailUrl');
    }
  } else {
    missingMetadata.push('thumbnailUrl');
  }

  if (!raw.publishedAt || !raw.publishedAt.trim()) {
    missingMetadata.push('publishedAt');
  }

  if (!raw.creator || !raw.creator.name.trim()) {
    missingMetadata.push('creator');
  }

  // 5. Construct canonical stable ID
  const stableId = `${raw.provider}_${cleanId}`;

  const provenance: RetrievalProvenance = {
    queryId: raw.provenance.queryId,
    queryString: raw.provenance.queryString,
    intent: raw.provenance.intent,
    provider: raw.provider,
    retrievedAt: new Date().toISOString(),
  };

  const candidatePayload: NormalizedResourceCandidate = {
    id: stableId,
    provider: raw.provider,
    externalId: cleanId,
    title: cleanTitle,
    description: raw.description?.trim() || undefined,
    canonicalUrl,
    sourceUrl,
    modality: raw.modality,
    creator: raw.creator ? { ...raw.creator, name: raw.creator.name.trim() } : undefined,
    publishedAt: raw.publishedAt?.trim() || undefined,
    durationSeconds: finalDurationSeconds,
    thumbnailUrl: finalThumbnail,
    language: raw.language?.trim() || undefined,
    isEmbeddable: raw.isEmbeddable ?? undefined,
    playlist: raw.playlist ? { ...raw.playlist } : undefined,
    verificationStatus: raw.verificationStatus || 'unverified_candidate',
    retrievalProvenance: provenance,
    missingMetadata,
    rawMetadata: raw.rawMetadata,
  };

  try {
    const validated = NormalizedResourceCandidateSchema.parse(candidatePayload);
    return { candidate: validated };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { candidate: null, error: `Schema validation failed: ${msg}` };
  }
}

/**
 * Deduplicates an array of NormalizedResourceCandidates by their canonical resource identity.
 * Merges richer metadata if a subsequent occurrence provides information missing in the first.
 */
export function deduplicateCandidates(candidates: NormalizedResourceCandidate[]): NormalizedResourceCandidate[] {
  const seenKeys = new Map<string, NormalizedResourceCandidate>();

  for (const item of candidates) {
    const dedupeKey = getCanonicalCandidateKey(item);
    const existing = seenKeys.get(dedupeKey);

    if (!existing) {
      seenKeys.set(dedupeKey, item);
    } else {
      // Merge richer metadata if existing was missing duration or thumbnail
      if (existing.durationSeconds === undefined && item.durationSeconds !== undefined) {
        existing.durationSeconds = item.durationSeconds;
        existing.missingMetadata = existing.missingMetadata.filter((m) => m !== 'durationSeconds');
      }
      if (!existing.thumbnailUrl && item.thumbnailUrl) {
        existing.thumbnailUrl = item.thumbnailUrl;
        existing.missingMetadata = existing.missingMetadata.filter((m) => m !== 'thumbnailUrl');
      }
    }
  }

  return Array.from(seenKeys.values());
}

/**
 * Computes canonical identity key for cross-provider deduplication.
 */
export function getCanonicalCandidateKey(candidate: NormalizedResourceCandidate): string {
  if (candidate.provider === 'youtube') {
    return `yt:${candidate.externalId}`;
  }
  if (candidate.provider === 'arxiv') {
    return `arxiv:${candidate.externalId.toLowerCase().replace(/^arxiv:/, '')}`;
  }
  if (candidate.provider === 'openalex') {
    return `openalex:${candidate.externalId.toLowerCase()}`;
  }
  return `${candidate.provider}:${candidate.canonicalUrl.toLowerCase()}`;
}
