import { supabase, isSupabaseConfigured } from "./client";
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
