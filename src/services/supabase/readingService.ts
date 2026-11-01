import { supabase, isSupabaseConfigured, getAuthenticatedSupabaseClient } from './client';
import { GeneratedReadingDocument, GeneratedReadingDocumentContent } from '@/lib/reading-engine/types';
import { storageAdapter } from '@/lib/storage/storageAdapter';
import { inMemoryPathCache } from './pathService';
import { Json } from './database.types';

function isValidUuid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function mapRowToDocument(row: any): GeneratedReadingDocument {
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    moduleId: row.module_id,
    lessonId: row.lesson_id,
    title: row.title,
    content: (typeof row.content === 'string' ? JSON.parse(row.content) : row.content) as GeneratedReadingDocumentContent,
    contentFormat: row.content_format || 'structured_json',
    language: row.language || 'en',
    academicLevel: row.academic_level || 'undergraduate',
    learningObjectives: Array.isArray(row.learning_objectives) ? row.learning_objectives : [],
    generationModel: row.generation_model,
    generationStatus: row.generation_status,
    contentHash: row.content_hash || undefined,
    sourceMetadata: (typeof row.source_metadata === 'object' && row.source_metadata !== null
      ? row.source_metadata
      : {}) as GeneratedReadingDocument['sourceMetadata'],
    tokenUsage: row.token_usage || undefined,
    readingDurationMinutes: row.reading_duration_minutes || 15,
    generatedAt: row.generated_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Persists a validated reading document to Supabase and storageAdapter.
 */
export async function saveGeneratedReadingDocument(
  doc: GeneratedReadingDocument,
  accessToken?: string
): Promise<GeneratedReadingDocument> {
  if (!doc || !doc.lessonId || !doc.courseId) {
    throw new Error('Validation Error: lessonId and courseId are required to persist study notes.');
  }

  // Always update memory/IDB cache first for resilience
  await storageAdapter.saveReadingMaterial(doc);

  if (!isSupabaseConfigured) {
    return doc;
  }

  const client = accessToken ? getAuthenticatedSupabaseClient(accessToken) : supabase;

  // Enforce valid UUID for foreign key safety against auth.users
  const safeUserId = isValidUuid(doc.userId) ? doc.userId : null;

  const rowPayload = {
    id: doc.id,
    user_id: safeUserId,
    course_id: doc.courseId,
    module_id: doc.moduleId,
    lesson_id: doc.lessonId,
    title: doc.title,
    content: doc.content as unknown as Json,
    content_format: doc.contentFormat,
    language: doc.language,
    academic_level: doc.academicLevel,
    learning_objectives: doc.learningObjectives as unknown as Json,
    generation_model: doc.generationModel,
    generation_status: doc.generationStatus,
    content_hash: doc.contentHash || null,
    source_metadata: doc.sourceMetadata as unknown as Json,
    token_usage: (doc.tokenUsage || {}) as unknown as Json,
    reading_duration_minutes: doc.readingDurationMinutes,
    generated_at: doc.generatedAt,
    updated_at: doc.updatedAt,
  };

  const { data, error } = await client
    .from('generated_reading_materials')
    .upsert(rowPayload, { onConflict: 'course_id,lesson_id' })
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('[ReadingService] Supabase upsert error:', error.message, error.code);
    throw new Error(`Database persistence failed: ${error.message}`);
  }

  let persistedDoc = doc;
  if (data) {
    persistedDoc = mapRowToDocument(data);
    await storageAdapter.saveReadingMaterial(persistedDoc);
  }

  // Dual-persist study note to public.lessons table (study_notes JSONB column)
  if (doc.lessonId) {
    try {
      const noteResource = {
        id: persistedDoc.id,
        title: persistedDoc.title,
        type: 'study_notes' as const,
        url: `/learn/${persistedDoc.courseId}/${persistedDoc.lessonId}/reading/${persistedDoc.id}`,
        sourceUrl: `/learn/${persistedDoc.courseId}/${persistedDoc.lessonId}/reading/${persistedDoc.id}`,
        sourceName: 'Pencill Academic Engine',
        description: persistedDoc.content?.introduction?.slice(0, 300) || persistedDoc.title,
        publisher: 'Pencill Academic Engine',
        qualityScore: 98,
      };

      const { data: existingLesson } = await client
        .from('lessons')
        .select('id, study_notes')
        .eq('id', doc.lessonId)
        .maybeSingle();

      if (existingLesson) {
        const currentNotes = Array.isArray((existingLesson as any).study_notes)
          ? (existingLesson as any).study_notes
          : [];
        const filtered = currentNotes.filter(
          (n: any) => n.id !== persistedDoc.id && n.url !== noteResource.url
        );
        const updatedNotes = [noteResource, ...filtered];

        await client
          .from('lessons')
          .update({ study_notes: updatedNotes as unknown as Json })
          .eq('id', doc.lessonId);
      }
    } catch (lesErr: any) {
      // Column might not exist yet if migration pending, non-fatal since generated_reading_materials succeeded
      console.warn('[ReadingService] Notice: could not dual-persist to lessons.study_notes:', lesErr?.message || lesErr);
    }
  }

  // Synchronize in-memory course cache and client browser storage
  if (inMemoryPathCache.has(doc.courseId)) {
    const cached = inMemoryPathCache.get(doc.courseId);
    if (cached?.modules) {
      for (const mod of cached.modules) {
        const targetLesson = mod.lessons?.find((l) => l.id === doc.lessonId);
        if (targetLesson) {
          const current = targetLesson.studyNotes || [];
          const filtered = current.filter((n) => n.id !== persistedDoc.id);
          targetLesson.studyNotes = [
            {
              id: persistedDoc.id,
              title: persistedDoc.title,
              type: 'study_notes',
              url: `/learn/${persistedDoc.courseId}/${persistedDoc.lessonId}/reading/${persistedDoc.id}`,
              sourceUrl: `/learn/${persistedDoc.courseId}/${persistedDoc.lessonId}/reading/${persistedDoc.id}`,
              sourceName: 'Pencill Academic Engine',
              description: persistedDoc.content?.introduction?.slice(0, 300) || persistedDoc.title,
              publisher: 'Pencill Academic Engine',
              qualityScore: 98,
            },
            ...filtered,
          ];
        }
      }
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`pencill_path_${doc.courseId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.modules) {
          for (const mod of parsed.modules) {
            const targetLesson = mod.lessons?.find((l: any) => l.id === doc.lessonId);
            if (targetLesson) {
              const current = targetLesson.studyNotes || [];
              const filtered = current.filter((n: any) => n.id !== persistedDoc.id);
              targetLesson.studyNotes = [
                {
                  id: persistedDoc.id,
                  title: persistedDoc.title,
                  type: 'study_notes',
                  url: `/learn/${persistedDoc.courseId}/${persistedDoc.lessonId}/reading/${persistedDoc.id}`,
                  sourceUrl: `/learn/${persistedDoc.courseId}/${persistedDoc.lessonId}/reading/${persistedDoc.id}`,
                  sourceName: 'Pencill Academic Engine',
                  description: persistedDoc.content?.introduction?.slice(0, 300) || persistedDoc.title,
                  publisher: 'Pencill Academic Engine',
                  qualityScore: 98,
                },
                ...filtered,
              ];
            }
          }
          localStorage.setItem(`pencill_path_${doc.courseId}`, JSON.stringify(parsed));
        }
      }
    } catch {}
  }

  return persistedDoc;
}

/**
 * Retrieves a reading document by lesson ID.
 */
export async function getGeneratedReadingByLesson(
  lessonId: string,
  courseId?: string,
  accessToken?: string
): Promise<GeneratedReadingDocument | null> {
  if (!lessonId) return null;

  // 1. Check local storage / in-memory cache first for fast response
  const local = await storageAdapter.getReadingMaterialByLesson(lessonId);
  if (local) {
    return local as GeneratedReadingDocument;
  }

  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const client = accessToken ? getAuthenticatedSupabaseClient(accessToken) : supabase;
    let query = client
      .from('generated_reading_materials')
      .select('*')
      .eq('lesson_id', lessonId);

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    let { data, error } = await query
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // If query by courseId yielded nothing, fallback to query by lesson_id alone
    if (!data && courseId) {
      const fallbackQuery = await client
        .from('generated_reading_materials')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (fallbackQuery.data) {
        data = fallbackQuery.data;
        error = null;
      }
    }

    if (error) {
      console.warn(`[ReadingService] Error fetching reading for lesson ${lessonId}:`, error.message);
      return null;
    }

    if (data) {
      const doc = mapRowToDocument(data);
      await storageAdapter.saveReadingMaterial(doc);
      return doc;
    }

    // Fallback: check if lesson table contains study_notes with embedded document
    try {
      const { data: lessonRow } = await client
        .from('lessons')
        .select('id, study_notes')
        .eq('id', lessonId)
        .maybeSingle();

      if (
        lessonRow &&
        Array.isArray((lessonRow as any).study_notes) &&
        (lessonRow as any).study_notes.length > 0
      ) {
        const firstNote = (lessonRow as any).study_notes[0];
        if (firstNote?.readingDocument) {
          const doc = firstNote.readingDocument as GeneratedReadingDocument;
          await storageAdapter.saveReadingMaterial(doc);
          return doc;
        }
      }
    } catch {}
  } catch (err: any) {
    console.warn(`[ReadingService] Exception fetching reading for lesson ${lessonId}:`, err.message);
  }

  return null;
}

/**
 * Retrieves a reading document by unique document ID.
 */
export async function getGeneratedReadingById(
  documentId: string,
  accessToken?: string
): Promise<GeneratedReadingDocument | null> {
  if (!documentId) return null;

  // 1. Check local cache
  const local = await storageAdapter.getReadingMaterialById(documentId);
  if (local) {
    return local as GeneratedReadingDocument;
  }

  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const client = accessToken ? getAuthenticatedSupabaseClient(accessToken) : supabase;
    const { data, error } = await client
      .from('generated_reading_materials')
      .select('*')
      .eq('id', documentId)
      .maybeSingle();

    if (error) {
      console.warn(`[ReadingService] Error fetching reading by id ${documentId}:`, error.message);
      return null;
    }

    if (data) {
      const doc = mapRowToDocument(data);
      await storageAdapter.saveReadingMaterial(doc);
      return doc;
    }
  } catch (err: any) {
    console.warn(`[ReadingService] Exception fetching reading by id ${documentId}:`, err.message);
  }

  return null;
}
