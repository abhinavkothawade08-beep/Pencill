import { supabase, isSupabaseConfigured, getAuthenticatedSupabaseClient } from "./client";
import { EngineResource, toCoreResourceType } from "@/lib/resource-engine-v2";
import { ResourceType } from "@/types";

export interface DatabaseResource {
  id: string;
  title: string;
  type: ResourceType;
  durationMinutes: number;
  sourceName: string;
  sourceUrl: string;
  description: string | null;
  externalId: string | null;
  qualityScore: number;
  isVerified: boolean;
  lastVerifiedAt: string | null;
  educatorId?: string | null;
  discoverySource?: string | null;
  createdAt: string;
}

export interface SaveResourcesResult {
  success: boolean;
  jobId?: string;
  savedCount: number;
  error?: string;
}

/**
 * Persist discovered resources and associated discovery job into Supabase.
 * Uses authenticated client when user token is present, and handles RLS/guest mode safely.
 */
export async function saveDiscoveredResources(
  topic: string,
  resources: EngineResource[],
  accessToken?: string
): Promise<SaveResourcesResult> {
  if (!isSupabaseConfigured || resources.length === 0) {
    return { success: false, savedCount: 0, error: 'Database not configured or no resources provided' };
  }

  const client = getAuthenticatedSupabaseClient(accessToken);
  let createdJobId: string | undefined;

  // 1. Attempt to log discovery job (optional, fails gracefully under guest RLS)
  try {
    const { data: jobData, error: jobError } = await client
      .from('discovery_jobs')
      .insert({
        topic,
        source_platform: 'Pencill Native Resource Engine',
        status: 'completed',
        found_count: resources.length,
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle();

    if (!jobError && jobData) {
      createdJobId = jobData.id;
    }
  } catch (err) {
    // Non-fatal; discovery jobs are audit logs
    console.warn('[resourceService] Non-fatal discovery_jobs insert notice:', err);
  }

  // 2. Format resource records adhering to PostgreSQL schema:
  // - type IN ('video', 'monograph', 'practice', 'quiz', 'paper', 'formulae')
  // - quality_score NUMERIC(3, 2) -> clamped 0.00 to 1.00
  // - source_url NOT NULL
  const rows = resources.map((r) => {
    const rawScore = r.score?.overall ?? r.finalScore ?? 75;
    // Map 0-100 scale to 0.00-1.00 for numeric(3, 2)
    const normalizedScore = Math.min(1.0, Math.max(0.05, Number((rawScore / 100).toFixed(2))));
    const verified = rawScore >= 75 || Boolean(r.metadata?.isVerified) || r.discoverySource === 'curated_directory';

    return {
      id: r.id,
      title: r.title.slice(0, 500),
      type: toCoreResourceType(r.type),
      duration_minutes: Math.max(0, Math.round(r.durationMinutes || 0)),
      source_name: (r.sourceName || 'Curated Resource').slice(0, 255),
      source_url: r.canonicalUrl || r.sourceUrl,
      description: r.description ? r.description.slice(0, 2000) : null,
      external_id: r.externalId || null,
      quality_score: normalizedScore,
      is_verified: verified,
      last_verified_at: new Date().toISOString(),
      educator_id: r.educatorId || null,
      discovery_source: r.discoverySource || (r.educatorId ? 'curated_directory' : 'open_discovery'),
    };
  });

  try {
    const { data, error } = await client
      .from('resources')
      .upsert(rows, { onConflict: 'id' })
      .select('id');

    if (error) {
      console.warn('[resourceService] Upsert resources warning:', error.message);
      return {
        success: false,
        jobId: createdJobId,
        savedCount: 0,
        error: error.message,
      };
    }

    return {
      success: true,
      jobId: createdJobId,
      savedCount: data?.length || rows.length,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[resourceService] Unexpected error saving resources:', msg);
    return {
      success: false,
      jobId: createdJobId,
      savedCount: 0,
      error: msg,
    };
  }
}

/**
 * Fetch verified resources by type or all verified resources.
 */
export async function getVerifiedResources(options?: {
  type?: ResourceType;
  limit?: number;
  offset?: number;
}): Promise<DatabaseResource[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const limit = options?.limit ?? 30;
  const offset = options?.offset ?? 0;

  let query = supabase
    .from('resources')
    .select('*')
    .eq('is_verified', true)
    .order('quality_score', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.type) {
    query = query.eq('type', options.type);
  }

  const { data, error } = await query;

  if (error || !data) {
    if (error) console.error('[resourceService] Error fetching verified resources:', error);
    return [];
  }

  return data.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type as ResourceType,
    durationMinutes: r.duration_minutes,
    sourceName: r.source_name,
    sourceUrl: r.source_url,
    description: r.description,
    externalId: r.external_id,
    qualityScore: Number(r.quality_score),
    isVerified: r.is_verified,
    lastVerifiedAt: r.last_verified_at,
    createdAt: r.created_at,
  }));
}

/**
 * Search resources from the database by title or description keyword match.
 */
export async function searchResourcesInDatabase(
  keyword: string,
  options?: {
    type?: ResourceType;
    limit?: number;
  }
): Promise<DatabaseResource[]> {
  if (!isSupabaseConfigured || !keyword.trim()) {
    return [];
  }

  const limit = options?.limit ?? 20;
  const cleanTerm = keyword.trim().replace(/[%_]/g, '');

  let query = supabase
    .from('resources')
    .select('*')
    .or(`title.ilike.%${cleanTerm}%,description.ilike.%${cleanTerm}%`)
    .order('quality_score', { ascending: false })
    .limit(limit);

  if (options?.type) {
    query = query.eq('type', options.type);
  }

  const { data, error } = await query;

  if (error || !data) {
    if (error) console.error('[resourceService] Error searching resources:', error);
    return [];
  }

  return data.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type as ResourceType,
    durationMinutes: r.duration_minutes,
    sourceName: r.source_name,
    sourceUrl: r.source_url,
    description: r.description,
    externalId: r.external_id,
    qualityScore: Number(r.quality_score),
    isVerified: r.is_verified,
    lastVerifiedAt: r.last_verified_at,
    createdAt: r.created_at,
  }));
}

/**
 * Get verified resources linked to a specific lesson or module by source URL.
 */
export async function getResourcesByLesson(lessonId: string): Promise<DatabaseResource[]> {
  if (!isSupabaseConfigured || !lessonId) {
    return [];
  }

  // 1. Get lesson details to inspect source_url and study_notes
  const { data: lesson, error: lError } = await supabase
    .from('lessons')
    .select('source_url, study_notes')
    .eq('id', lessonId)
    .maybeSingle();

  if (lError || !lesson) {
    return [];
  }

  const urls: string[] = [];
  if (lesson.source_url) urls.push(lesson.source_url);

  if (Array.isArray(lesson.study_notes)) {
    for (const note of lesson.study_notes) {
      if (typeof note === 'object' && note !== null && (note as { sourceUrl?: string }).sourceUrl) {
        urls.push((note as { sourceUrl: string }).sourceUrl);
      }
    }
  }

  if (urls.length === 0) {
    return [];
  }

  const { data: matched, error: rError } = await supabase
    .from('resources')
    .select('*')
    .in('source_url', urls);

  if (rError || !matched) {
    return [];
  }

  return matched.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type as ResourceType,
    durationMinutes: r.duration_minutes,
    sourceName: r.source_name,
    sourceUrl: r.source_url,
    description: r.description,
    externalId: r.external_id,
    qualityScore: Number(r.quality_score),
    isVerified: r.is_verified,
    lastVerifiedAt: r.last_verified_at,
    createdAt: r.created_at,
  }));
}
