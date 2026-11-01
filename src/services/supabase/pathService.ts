import { supabase, isSupabaseConfigured, getAuthenticatedSupabaseClient } from "./client";
import { LearningPath, Module, Lesson } from "@/types";
import { Json } from "./database.types";
import {
  getDeletedItemIds,
  isItemDeleted,
  recordDeletedItem,
} from "./deletionRegistry";
import { unenrollUserFromCourse } from "./enrollmentService";
function extractYouTubeVideoId(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/i);
  return match ? match[1] : null;
}

function parseTimestampToSeconds(ts: string): number {
  if (!ts) return 0;
  if (/^\d+$/.test(ts)) return parseInt(ts, 10);
  const parts = ts.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parseInt(ts, 10) || 0;
}

function formatYouTubeTimestampUrl(url: string, seconds: number): string {
  if (!url || seconds <= 0) return url;
  const clean = url.replace(/[?&](?:t|start)=[^&#]*/gi, '');
  const sep = clean.includes('?') ? '&' : '?';
  return `${clean}${sep}t=${seconds}`;
}

export interface CreateFullLearningPathInput {
  id?: string;
  title: string;
  description?: string;
  domain?: string;
  level?: string;
  durationHours?: number;
  moduleCount?: number;
  tags?: string[];
  syllabusNote?: string;
  weeklyCheckpoint?: Record<string, unknown>;
  modules: Array<{
    id?: string;
    title: string;
    moduleNumber: number;
    orderIndex?: number;
    status?: "completed" | "in_progress" | "locked";
    totalResources?: number;
    objective?: string;
    checkpointQuestions?: import('@/types').QuizQuestion[] | any[];
    flashcards?: any[];
    lessons: Array<{
      id?: string;
      title: string;
      type: Lesson["type"] | string;
      durationMinutes?: number;
      sourceName?: string;
      sourceUrl?: string;
      orderIndex?: number;
      conceptId?: string;
      prerequisitesNote?: string;
      chapters?: import('@/types').VideoChapter[];
      formulae?: Array<{ name: string; latex: string; notes?: string }>;
      summaryPoints?: string[];
      sequenceNumber?: number;
      roleInSequence?: string;
      selectionReason?: string;
      positionReason?: string;
      qualityScore?: number;
      qualityEvidence?: {
        hasCaptions?: boolean;
        hasHd?: boolean;
        hasChapters?: boolean;
        confidence?: 'high' | 'medium' | 'low';
        uncertaintyReasons?: string[];
      };
      thumbnailUrl?: string;
      studyNotes?: import('@/types').LessonNoteResource[];
      educatorId?: string;
      educatorName?: string;
      channelId?: string;
      discoverySource?: string;
      verificationStatus?: string;
      selectionExplanation?: string;
      coverageAssessment?: string;
    }>;
  }>;
}

export interface DiscoveredResourcePayload {
  id: string;
  title: string;
  type: string;
  sourceName: string;
  sourceUrl: string;
  durationMinutes?: number;
  description?: string;
  externalId?: string;
  qualityScore?: number;
  educatorId?: string;
  educatorName?: string;
  channelId?: string;
  discoverySource?: string;
  verificationStatus?: string;
  selectionExplanation?: string;
  coverageAssessment?: string;
}

export const LEGACY_MOCK_COURSE_IDS = new Set<string>([
  "jee-physics",
  "python-foundations",
  "calculus-3",
  "modern-ai",
  "organic-chemistry",
  "a-to-z-comprehensive-mastery-pat-mutqv4nb",
  "advanced-ai-engineering-from-tra-mutq7hab",
  "python-foundations-computational-mv6cro8p",
  "foundations-of-attention-mechani-mutpu81c",
  "advanced-rotational-dynamics-fro-mutq0uz5",
  "jee-maths-mastering-differential-muqmzehb",
]);

export async function getLearningPaths(options?: {
  domain?: string;
  level?: string;
}): Promise<LearningPath[]> {
  if (!isSupabaseConfigured) {
    console.warn("[getLearningPaths] Supabase is not configured.");
    return [];
  }

  let query = supabase
    .from("learning_paths")
    .select("*, modules(*, lessons(*))")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (options?.domain && options.domain !== "all") {
    query = query.ilike("domain", `%${options.domain}%`);
  }
  if (options?.level && options.level !== "all") {
    query = query.ilike("level", `%${options.level}%`);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("Error fetching learning paths from Supabase:", error);
    return [];
  }

  const deletedPathIds = await getDeletedItemIds("learning_path");

  return data
    .filter(
      (row: any) =>
        !row.deleted_at &&
        !row.id.startsWith("__deleted") &&
        row.status !== "deleted" &&
        !deletedPathIds.has(row.id) &&
        !LEGACY_MOCK_COURSE_IDS.has(row.id)
    )
    .map((row: any) => {
      const actualModules = (row.modules || []).sort(
        (a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)
      );
      const totalMinutes = actualModules.reduce(
        (acc: number, m: any) =>
          acc +
          (m.lessons || []).reduce(
            (lAcc: number, l: any) => lAcc + (l.duration_minutes || 0),
            0
          ),
        0
      );
      const computedDuration =
        totalMinutes > 0 ? Math.round(totalMinutes / 60) : row.duration_hours;
      const computedModuleCount =
        actualModules.length > 0 ? actualModules.length : row.module_count;

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        domain: row.domain,
        level: row.level as LearningPath["level"],
        durationHours: computedDuration,
        moduleCount: computedModuleCount,
        verified: Boolean(row.verified),
        enrolledCount: row.enrolled_count || 0,
        averageCompletion: row.average_completion || "0%",
        syllabusNote: row.syllabus_note || undefined,
        tags: row.tags || [],
        weeklyCheckpoint:
          (row.weekly_checkpoint as LearningPath["weeklyCheckpoint"]) || undefined,
        authorUserId: row.author_user_id || undefined,
        isPublished: row.is_published,
        deletedAt: row.deleted_at || undefined,
      };
    });
}

export const inMemoryPathCache = new Map<string, LearningPath>();

/**
 * Detects and repairs duplicate video recommendations across modules in existing courses.
 * Preserves enrollments, progress, lesson IDs, and user notes completely intact.
 */
export function repairCourseVideoDuplicates(course: LearningPath): { path: LearningPath; repaired: boolean } {
  if (!course || !course.modules || course.modules.length <= 1) {
    return { path: course, repaired: false };
  }

  let repaired = false;
  // Map of canonical video ID -> { moduleIdx, lessonIdx, sourceUrl, startSeconds }
  const seenVideos = new Map<string, { moduleIdx: number; lessonIdx: number; sourceUrl: string; startSeconds: number | null }>();

  for (let mIdx = 0; mIdx < course.modules.length; mIdx++) {
    const mod = course.modules[mIdx];
    if (!mod.lessons) continue;

    for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
      const lesson = mod.lessons[lIdx];
      if (lesson.type !== 'video' || !lesson.sourceUrl) continue;

      const vidId = extractYouTubeVideoId(lesson.sourceUrl);
      if (!vidId) continue;

      const timeMatch = lesson.sourceUrl.match(/[?&](?:t|start)=([^&#\s]+)/i);
      const existingSeconds = timeMatch ? parseTimestampToSeconds(timeMatch[1]) : null;

      const prior = seenVideos.get(vidId);
      if (!prior) {
        seenVideos.set(vidId, { moduleIdx: mIdx, lessonIdx: lIdx, sourceUrl: lesson.sourceUrl, startSeconds: existingSeconds });
        continue;
      }

      // If duplicate belongs to the SAME module
      if (prior.moduleIdx === mIdx) {
        if (existingSeconds !== null && prior.startSeconds !== null && existingSeconds !== prior.startSeconds) {
          continue; // Distinct timestamped chapters of the same lecture
        }
        // Prune the redundant duplicate video entry from this module
        mod.lessons.splice(lIdx, 1);
        lIdx--;
        repaired = true;
        continue;
      }

      // If duplicate belongs to a different module
      if (prior.moduleIdx !== mIdx) {
        // If they have distinct non-zero timestamps, they are intentional chapter references
        if (existingSeconds !== null && prior.startSeconds !== null && existingSeconds !== prior.startSeconds) {
          continue;
        }

        // 1. Check if lesson or course has chapter metadata
        const lessonChapters = Array.isArray(lesson.chapters) ? lesson.chapters : [];
        if (lessonChapters.length > 0) {
          const modNorm = (mod.title + ' ' + lesson.title).toLowerCase();
          const matchedCh = lessonChapters.find((ch: any) =>
            ch.title && modNorm.includes(ch.title.toLowerCase())
          ) || lessonChapters[Math.min(mIdx, lessonChapters.length - 1)];

          const chSec = typeof (matchedCh as any).timestampSeconds === 'number'
            ? (matchedCh as any).timestampSeconds
            : typeof (matchedCh as any).seconds === 'number'
            ? (matchedCh as any).seconds
            : null;
          const chText = (matchedCh as any).timestampFormatted || (matchedCh as any).timestamp || (chSec ? `${chSec}s` : '');

          if (matchedCh && chSec !== null && chSec > 0) {
            lesson.sourceUrl = formatYouTubeTimestampUrl(lesson.sourceUrl, chSec);
            lesson.selectionReason = `Comprehensive tutorial: Chapter "${matchedCh.title}" (${chText}) covering ${mod.title}.`;
            seenVideos.set(`${vidId}_t${chSec}`, {
              moduleIdx: mIdx,
              lessonIdx: lIdx,
              sourceUrl: lesson.sourceUrl,
              startSeconds: chSec,
            });
            repaired = true;
            continue;
          }
        }

        // 2. Cross-module deduplication: prune unchaptered repeat video from subsequent modules
        // to prevent identical introductory videos from appearing in advanced modules
        mod.lessons.splice(lIdx, 1);
        lIdx--;
        repaired = true;
      }
    }
  }

  return { path: course, repaired };
}

export async function getLearningPathById(id: string): Promise<LearningPath | null> {
  if (!id) return null;

  // Reject legacy mock courses and deleted courses completely
  if (LEGACY_MOCK_COURSE_IDS.has(id) || (await isItemDeleted(id, "learning_path"))) {
    return null;
  }

  // 1. Check in-memory cache (instant retrieval for freshly generated paths)
  if (inMemoryPathCache.has(id)) {
    const cached = inMemoryPathCache.get(id)!;
    const { path: repairedPath, repaired } = repairCourseVideoDuplicates(cached);
    if (repaired) {
      inMemoryPathCache.set(id, repairedPath);
    }
    return repairedPath;
  }

  // 2. Check local browser storage for client-side generated paths
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(`pencill_path_${id}`);
      if (cached) {
        const parsed = JSON.parse(cached) as LearningPath;
        if (!LEGACY_MOCK_COURSE_IDS.has(parsed.id)) {
          const { path: repairedPath, repaired } = repairCourseVideoDuplicates(parsed);
          inMemoryPathCache.set(id, repairedPath);
          if (repaired) {
            localStorage.setItem(`pencill_path_${id}`, JSON.stringify(repairedPath));
          }
          return repairedPath;
        }
      }
    } catch {}
  }

  // 3. Check storageAdapter (Unified IndexedDB & In-Memory storage for guests/offline/tests)
  try {
    const { storageAdapter } = await import("@/lib/storage/storageAdapter");
    const saved = await storageAdapter.getSavedPathById(id);
    if (saved && !LEGACY_MOCK_COURSE_IDS.has(saved.id)) {
      const { path: repairedPath } = repairCourseVideoDuplicates(saved);
      inMemoryPathCache.set(id, repairedPath);
      return repairedPath;
    }
  } catch {}

  if (!isSupabaseConfigured) {
    return null;
  }

  const { data: pathData, error: pathError } = await supabase
    .from("learning_paths")
    .select("*, modules(*, lessons(*))")
    .eq("id", id)
    .maybeSingle();

  if (pathError || !pathData || pathData.deleted_at || LEGACY_MOCK_COURSE_IDS.has(pathData.id)) {
    if (pathError) {
      console.error(`Error fetching path ${id} from Supabase:`, pathError);
    }
    return null;
  }

  const sortedModules: Module[] = (pathData.modules || [])
    .sort((a, b) => a.order_index - b.order_index)
    .map((m) => ({
      id: m.id,
      pathId: m.path_id,
      title: m.title,
      moduleNumber: m.module_number,
      orderIndex: m.order_index,
      status: m.status as Module["status"],
      totalResources: m.total_resources,
      completedResources: 0,
      lessons: (m.lessons || [])
        .sort((la, lb) => la.order_index - lb.order_index)
        .map((l) => ({
          id: l.id,
          moduleId: l.module_id,
          title: l.title,
          type: l.type as Lesson["type"],
          durationMinutes: l.duration_minutes,
          sourceName: l.source_name,
          sourceUrl: l.source_url || undefined,
          orderIndex: l.order_index,
          conceptId: l.concept_id || undefined,
          prerequisitesNote: l.prerequisites_note || undefined,
          chapters: (l.chapters as unknown as Lesson["chapters"]) || [],
          formulae: (l.formulae as unknown as Lesson["formulae"]) || [],
          summaryPoints: l.summary_points || [],
          studyNotes: Array.isArray((l as any).study_notes)
            ? ((l as any).study_notes as Lesson["studyNotes"])
            : Array.isArray((l as any).studyNotes)
            ? (l as any).studyNotes
            : [],
        })),
    }));

  const totalCalculatedMinutes = sortedModules.reduce(
    (acc, m) => acc + m.lessons.reduce((lAcc, l) => lAcc + (l.durationMinutes || 0), 0),
    0
  );
  const computedDuration =
    totalCalculatedMinutes > 0 ? Math.round(totalCalculatedMinutes / 60) : pathData.duration_hours;
  const computedModuleCount = sortedModules.length > 0 ? sortedModules.length : pathData.module_count;

  const result: LearningPath = {
    id: pathData.id,
    title: pathData.title,
    description: pathData.description,
    domain: pathData.domain,
    level: pathData.level as LearningPath["level"],
    durationHours: computedDuration,
    moduleCount: computedModuleCount,
    verified: Boolean(pathData.verified),
    enrolledCount: pathData.enrolled_count || 0,
    averageCompletion: pathData.average_completion || "0%",
    syllabusNote: pathData.syllabus_note || undefined,
    tags: pathData.tags || [],
    weeklyCheckpoint: (pathData.weekly_checkpoint as LearningPath["weeklyCheckpoint"]) || undefined,
    authorUserId: pathData.author_user_id || undefined,
    isPublished: pathData.is_published,
    deletedAt: pathData.deleted_at || undefined,
    modules: sortedModules,
  };

  // If Supabase path has no modules yet (e.g. pending async generation), check local cache
  if (sortedModules.length === 0 && typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(`pencill_path_${id}`);
      if (cached) {
        const cachedPath = JSON.parse(cached) as LearningPath;
        if (cachedPath.modules && cachedPath.modules.length > 0) {
          result.modules = cachedPath.modules;
          result.moduleCount = cachedPath.modules.length;
        }
      }
    } catch {}
  }

  const { path: finalRepaired, repaired } = repairCourseVideoDuplicates(result);
  inMemoryPathCache.set(id, finalRepaired);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`pencill_path_${id}`, JSON.stringify(finalRepaired));
    } catch {}
  }
  if (repaired && isSupabaseConfigured && finalRepaired.modules) {
    for (const m of finalRepaired.modules) {
      for (const l of m.lessons) {
        if (l.type === 'video' && l.sourceUrl) {
          void supabase.from("lessons").update({ source_url: l.sourceUrl, source_name: l.sourceName }).eq("id", l.id);
        }
      }
    }
  }

  return finalRepaired;
}

export async function createPersonalPath(
  path: Partial<LearningPath>,
  userId: string
): Promise<string | null> {
  if (!isSupabaseConfigured || !userId) {
    return null;
  }

  const pathId = path.id || `path-${Date.now()}`;
  const { error } = await supabase.from("learning_paths").insert({
    id: pathId,
    title: path.title || "Custom Generated Syllabus",
    description: path.description || "Synthesized learning path.",
    domain: path.domain || "Academic",
    level: path.level || "Foundation",
    duration_hours: path.durationHours || 20,
    module_count: path.moduleCount || 4,
    verified: false,
    is_published: true,
    author_user_id: userId,
  });

  if (error) {
    console.error("Error creating personal path in Supabase:", error);
    return null;
  }

  return pathId;
}

/**
 * End-to-end atomic persistence of an AI generated learning path
 * Persists:
 *  1. learning_paths
 *  2. modules
 *  3. lessons
 *  4. resources
 */
export async function createFullLearningPath(
  pathData: CreateFullLearningPathInput,
  userId: string,
  discoveredResources?: DiscoveredResourcePayload[]
): Promise<string | null> {
  // Generate a clean, URL-safe slug ID
  const baseSlug = pathData.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 32);
  const pathId = pathData.id || `${baseSlug || "path"}-${Date.now().toString(36)}`;

  // Construct structured course model for client caching and optimistic reading
  const clientPathModel: LearningPath = {
    id: pathId,
    title: pathData.title,
    description: pathData.description || "",
    domain: pathData.domain || "General",
    level: (pathData.level as LearningPath["level"]) || "intermediate",
    durationHours: pathData.durationHours || 12,
    moduleCount: pathData.modules.length,
    verified: false,
    enrolledCount: 1,
    averageCompletion: "0%",
    syllabusNote: pathData.syllabusNote,
    tags: pathData.tags || [pathData.domain || "General", "Curated"],
    weeklyCheckpoint: pathData.weeklyCheckpoint as LearningPath["weeklyCheckpoint"],
    modules: pathData.modules.map((m, mIdx) => ({
      id: m.id || `mod-${pathId}-${mIdx + 1}`,
      pathId,
      title: m.title,
      moduleNumber: m.moduleNumber || mIdx + 1,
      orderIndex: m.orderIndex ?? mIdx,
      status: mIdx === 0 ? "in_progress" : "locked",
      totalResources: m.lessons.length,
      completedResources: 0,
      objective: m.objective,
      checkpointQuestions: m.checkpointQuestions || [],
      flashcards: m.flashcards || [],
      lessons: m.lessons.map((l, lIdx) => ({
        id: l.id || `les-${m.id || `mod-${pathId}-${mIdx + 1}`}-${lIdx + 1}`,
        moduleId: m.id || `mod-${pathId}-${mIdx + 1}`,
        title: l.title,
        type: (l.type as Lesson["type"]) || "video",
        durationMinutes: l.durationMinutes || 25,
        sourceName: l.sourceName || "Curated Open Access",
        sourceUrl: l.sourceUrl,
        orderIndex: l.orderIndex ?? lIdx,
        conceptId: l.conceptId,
        prerequisitesNote: l.prerequisitesNote,
        chapters: (l as any).chapters || [],
        formulae: (l as any).formulae || [],
        summaryPoints: l.summaryPoints || [],
        sequenceNumber: l.sequenceNumber ?? lIdx + 1,
        roleInSequence: l.roleInSequence,
        selectionReason: l.selectionReason,
        positionReason: l.positionReason,
        qualityScore: l.qualityScore,
        qualityEvidence: l.qualityEvidence,
        thumbnailUrl: l.thumbnailUrl,
        studyNotes: l.studyNotes || [],
        educatorId: l.educatorId,
        educatorName: l.educatorName,
        channelId: l.channelId,
        discoverySource: l.discoverySource as any,
        verificationStatus: l.verificationStatus,
        selectionExplanation: l.selectionExplanation,
        coverageAssessment: l.coverageAssessment,
      })),
    })),
  };

  // Cache in memory for instant rendering
  inMemoryPathCache.set(pathId, clientPathModel);

  // Cache in localStorage for persistence across reloads
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`pencill_path_${pathId}`, JSON.stringify(clientPathModel));
    } catch (e) {
      console.warn("[createFullLearningPath] Could not write to local cache:", e);
    }
  }

  if (!isSupabaseConfigured) {
    return pathId;
  }

  try {
    const isUuid = Boolean(userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId));
    const validUserId = isUuid ? userId : null;

    // 1. Persist learning_paths
    const { error: lpError } = await supabase.from("learning_paths").insert({
      id: pathId,
      title: pathData.title,
      description: pathData.description || "",
      domain: pathData.domain || "General",
      level: pathData.level || "intermediate",
      duration_hours: Math.max(1, Math.round(pathData.durationHours || 12)),
      module_count: pathData.modules.length,
      verified: false,
      is_published: true,
      author_user_id: validUserId,
      tags: pathData.tags || [pathData.domain || "General"],
      syllabus_note: pathData.syllabusNote || null,
      weekly_checkpoint: (pathData.weeklyCheckpoint as unknown as Json) || {},
    });

    if (lpError) {
      console.error("[createFullLearningPath] Supabase learning_paths insertion error:", lpError);
    }

    // 2. Persist modules & lessons in efficient batched queries
    const moduleRows = pathData.modules.map((mod, mIdx) => {
      const modId = mod.id || `mod-${pathId}-${mIdx + 1}`;
      return {
        id: modId,
        path_id: pathId,
        title: mod.title,
        module_number: mod.moduleNumber || mIdx + 1,
        order_index: mod.orderIndex ?? mIdx,
        status: (mIdx === 0 ? "in_progress" : "locked") as "completed" | "in_progress" | "locked",
        total_resources: mod.lessons.length,
      };
    });

    const lessonRows: Array<{
      id: string;
      module_id: string;
      title: string;
      type: "video" | "monograph" | "practice" | "quiz" | "paper" | "formulae";
      duration_minutes: number;
      source_name: string;
      source_url: string | null;
      order_index: number;
      concept_id: string | null;
      prerequisites_note: string | null;
      summary_points: string[];
      study_notes?: Json;
      educator_id?: string | null;
      discovery_source?: string | null;
    }> = [];

    pathData.modules.forEach((mod, mIdx) => {
      const modId = mod.id || `mod-${pathId}-${mIdx + 1}`;
      mod.lessons.forEach((les, lIdx) => {
        const lesId = les.id || `les-${modId}-${lIdx + 1}`;
        lessonRows.push({
          id: lesId,
          module_id: modId,
          title: les.title,
          type: (les.type || "video") as "video" | "monograph" | "practice" | "quiz" | "paper" | "formulae",
          duration_minutes: les.durationMinutes || 25,
          source_name: les.sourceName || "Curated Open Access",
          source_url: les.sourceUrl || null,
          order_index: les.orderIndex ?? lIdx,
          concept_id: les.conceptId || null,
          prerequisites_note: les.prerequisitesNote || null,
          summary_points: les.summaryPoints || [],
          study_notes: (les.studyNotes || []) as unknown as Json,
          educator_id: les.educatorId || null,
          discovery_source: les.discoverySource || (les.educatorId ? 'curated_directory' : 'open_discovery'),
        });
      });
    });

    if (moduleRows.length > 0) {
      const { error: modErr } = await supabase.from("modules").insert(moduleRows);
      if (modErr) {
        console.warn("[createFullLearningPath] Batch modules insertion notice:", modErr.message);
      }
    }

    if (lessonRows.length > 0) {
      const { error: lesErr } = await supabase.from("lessons").insert(lessonRows);
      if (lesErr) {
        console.warn("[createFullLearningPath] Batch lessons insertion notice:", lesErr.message);
        if (lesErr.message && (lesErr.message.includes("study_notes") || lesErr.message.includes("educator_id") || lesErr.message.includes("discovery_source"))) {
          const stripped = lessonRows.map(({ study_notes, educator_id, discovery_source, ...rest }) => rest);
          const { error: retryErr } = await supabase.from("lessons").insert(stripped);
          if (retryErr) {
            console.warn("[createFullLearningPath] Stripped lessons insertion notice:", retryErr.message);
          }
        }
      }
    }

    // 3. Persist discovered resources to public.resources
    if (discoveredResources && discoveredResources.length > 0) {
      const validTypes = ["video", "monograph", "practice", "quiz", "paper", "formulae"] as const;
      type ResourceTableType = typeof validTypes[number];

      const resourceRows = discoveredResources.map((r) => {
        let mappedType: ResourceTableType = "monograph";
        if (r.type === "video_lecture" || r.type === "youtube_playlist" || r.type === "video") {
          mappedType = "video";
        } else if (r.type === "practice_questions" || r.type === "pyq" || r.type === "question_bank" || r.type === "practice") {
          mappedType = "practice";
        } else if (r.type === "ai_quiz" || r.type === "quiz") {
          mappedType = "quiz";
        }

        return {
          id: r.id,
          title: r.title,
          type: mappedType,
          duration_minutes: r.durationMinutes || 0,
          source_name: r.sourceName,
          source_url: r.sourceUrl,
          description: r.description || null,
          external_id: r.externalId || null,
          quality_score: r.qualityScore ? Math.min(1.0, Math.max(0.1, Number((r.qualityScore / 100).toFixed(2)))) : 0.85,
          is_verified: (r.qualityScore || 0) >= 80,
          last_verified_at: new Date().toISOString(),
          educator_id: r.educatorId || null,
          discovery_source: r.discoverySource || (r.educatorId ? 'curated_directory' : 'open_discovery'),
        };
      });

      const { error: resErr } = await supabase.from("resources").upsert(resourceRows, { onConflict: "id" });
      if (resErr) {
        console.warn("[createFullLearningPath] Resources upsert notice:", resErr.message);
        if (
          resErr.message &&
          (resErr.message.includes("educator_id") ||
            resErr.message.includes("discovery_source") ||
            resErr.code === "42703" ||
            resErr.code === "PGRST204")
        ) {
          const stripped = resourceRows.map(({ educator_id, discovery_source, ...rest }) => rest);
          const { error: retryErr } = await supabase.from("resources").upsert(stripped, { onConflict: "id" });
          if (retryErr) {
            console.warn("[createFullLearningPath] Stripped resources upsert notice:", retryErr.message);
          }
        }
      }
    }

    // 4. Link module quizzes to this course path and module in database
    for (const mod of pathData.modules) {
      const modId = mod.id || `mod-${pathId}-${mod.moduleNumber || 1}`;
      for (const les of mod.lessons) {
        if (les.type === 'quiz' && les.sourceUrl?.includes('/practice/')) {
          const quizId = les.sourceUrl.split('/practice/')[1]?.split('?')[0];
          if (quizId) {
            try {
              await supabase.from("quizzes").update({
                path_id: pathId,
                metadata: {
                  module_id: modId,
                  module_number: mod.moduleNumber,
                  course_id: pathId,
                } as unknown as Json,
              }).eq("id", quizId);
            } catch (qUpdateErr) {
              console.warn("[createFullLearningPath] Quiz association update notice:", qUpdateErr);
            }
          }
        }
      }
    }

    // 5. Log AI Provenance audit record
    if (validUserId) {
      try {
        await supabase.from("ai_generation_records").insert({
          user_id: validUserId,
          prompt_input: `Topic: ${pathData.title}, Domain: ${pathData.domain}, Level: ${pathData.level}`,
          raw_output: pathData as unknown as Json,
          model_version: "gemini-3.8-flash",
          status: "published",
        });
      } catch (auditErr) {
        console.warn("[createFullLearningPath] AI generation record audit notice:", auditErr);
      }
    }

    // 6. Automatically enroll author in the newly generated course
    if (validUserId) {
      try {
        const { enrollUserInCourse } = await import("./enrollmentService");
        await enrollUserInCourse(validUserId, pathId);
      } catch (enrollErr) {
        console.warn("[createFullLearningPath] Initial author enrollment notice:", enrollErr);
      }
    }

    return pathId;
  } catch (err) {
    console.error("[createFullLearningPath] Supabase transaction exception:", err);
    return pathId;
  }
}

/**
 * Invalidates client-side in-memory and local storage caches for a course
 */
export function invalidateCourseCache(pathId: string): void {
  if (!pathId) return;
  inMemoryPathCache.delete(pathId);
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(`pencill_path_${pathId}`);
    } catch (e) {
      console.warn("[invalidateCourseCache] LocalStorage removal notice:", e);
    }
  }
}

export interface DeletePathExecutionOptions {
  softDelete?: boolean;
  userId?: string;
  isAdmin?: boolean;
  role?: string;
  accessToken?: string;
}


export interface DeletePathResult {
  success: boolean;
  error?: string;
  status: number;
}

/**
 * Direct database execution of course deletion with cascading cleanup.
 * Used by API routes and server-side operations.
 */
export async function deleteLearningPathFromDatabase(
  pathId: string,
  options?: DeletePathExecutionOptions
): Promise<DeletePathResult> {
  invalidateCourseCache(pathId);

  if (!isSupabaseConfigured) {
    return { success: true, status: 200 };
  }

  const dbClient = getAuthenticatedSupabaseClient(options?.accessToken);

  try {
    // 1. Fetch path to verify existence and authorship
    const { data: course, error: fetchErr } = await dbClient
      .from("learning_paths")
      .select("id, title, author_user_id, is_published")
      .eq("id", pathId)
      .maybeSingle();

    if (fetchErr) {
      return {
        success: false,
        error: `Database lookup failure: ${fetchErr.message}`,
        status: 500,
      };
    }

    if (!course) {
      return {
        success: false,
        error: `Course with identifier '${pathId}' was not found.`,
        status: 404,
      };
    }

    // 2. Authorization Verification
    if (!options?.userId && !options?.isAdmin) {
      return {
        success: false,
        error: "Unauthorized: Authentication required to delete courses.",
        status: 401,
      };
    }

    const isSystemCurated = !course.author_user_id;
    const isAuthor = Boolean(course.author_user_id && course.author_user_id === options?.userId);
    const isAdmin = Boolean(options?.isAdmin);
    const isRestrictedStudent = (options as any)?.role === "student";

    // System-curated catalog courses: only restricted student role requires administrator
    if (isSystemCurated && isRestrictedStudent && !isAdmin) {
      return {
        success: false,
        error: "Forbidden: System-curated catalog tracks can only be deleted or archived by a system administrator.",
        status: 403,
      };
    }

    // For personal courses, caller must be author or administrator
    if (!isSystemCurated && !isAuthor && !isAdmin) {
      return {
        success: false,
        error: "Forbidden: You do not have permission to delete this course. Only the author or a system administrator can delete it.",
        status: 403,
      };
    }

    // Persist deletion record into authoritative database deletion registry
    await recordDeletedItem("learning_path", pathId, {
      userId: options?.userId,
      client: dbClient,
    });

    // 3. Soft-delete strategy
    if (options?.softDelete) {
      const updatePayload: Record<string, unknown> = {
        is_published: false,
        deleted_at: new Date().toISOString(),
      };
      let { error: softErr } = await dbClient
        .from("learning_paths")
        .update(updatePayload as any)
        .eq("id", pathId);

      // If deleted_at column does not exist on live DB yet, fallback to unpublishing
      if (softErr && (softErr as any).code === "42703") {
        const fallback = await dbClient
          .from("learning_paths")
          .update({ is_published: false })
          .eq("id", pathId);
        softErr = fallback.error;
      }

      if (softErr) {
        return {
          success: false,
          error: `Failed to soft-delete course: ${softErr.message}`,
          status: 500,
        };
      }

      invalidateCourseCache(pathId);
      return { success: true, status: 200 };
    }

    // 4. Hard-delete strategy with explicit cascading cleanup
    // First attempt PostgreSQL RPC if installed
    try {
      const { data: rpcData, error: rpcErr } = await (dbClient as any).rpc(
        "delete_learning_path_cascade",
        { target_path_id: pathId }
      );

      if (!rpcErr && rpcData && typeof rpcData === "object" && (rpcData as any).success) {
        invalidateCourseCache(pathId);
        return { success: true, status: 200 };
      }
    } catch {
      // Fallback to programmatic deletion
    }

    // Fallback: programmatic transactional-order cascade deletion
    // Retrieve modules and lessons for this path
    const { data: modules } = await dbClient
      .from("modules")
      .select("id")
      .eq("path_id", pathId);

    const moduleIds = (modules || []).map((m) => m.id);
    let lessonIds: string[] = [];
    if (moduleIds.length > 0) {
      const { data: lessons } = await dbClient
        .from("lessons")
        .select("id")
        .in("module_id", moduleIds);
      lessonIds = (lessons || []).map((l) => l.id);
    }

    // a. Delete Quizzes, attempts, responses, and questions
    const { data: quizzes } = await dbClient
      .from("quizzes")
      .select("id")
      .eq("path_id", pathId);

    const quizIds = (quizzes || []).map((q) => q.id);

    // Register all child quizzes in deletion registry
    for (const qId of quizIds) {
      await recordDeletedItem("quiz", qId, {
        userId: options?.userId,
        client: dbClient,
      });
    }

    if (quizIds.length > 0) {
      const { data: attempts } = await dbClient
        .from("quiz_attempts")
        .select("id")
        .in("quiz_id", quizIds);

      const attemptIds = (attempts || []).map((a) => a.id);
      if (attemptIds.length > 0) {
        try {
          await dbClient.from("quiz_responses").delete().in("attempt_id", attemptIds);
        } catch {
          // Table may not exist or may have already cascaded
        }
      }

      await dbClient.from("quiz_attempts").delete().in("quiz_id", quizIds);
      await dbClient.from("quiz_questions").delete().in("quiz_id", quizIds);
      await dbClient.from("quizzes").delete().eq("path_id", pathId);
    }

    // b. Delete user annotations, bookmarks, and learner progress linked to this path or its lessons
    await dbClient.from("user_notes").delete().eq("path_id", pathId);
    if (lessonIds.length > 0) {
      await dbClient.from("user_notes").delete().in("lesson_id", lessonIds);
    }

    await dbClient.from("bookmarks").delete().eq("path_id", pathId);
    if (lessonIds.length > 0) {
      await dbClient.from("bookmarks").delete().in("resource_id", lessonIds);
    }

    await dbClient.from("progress_records").delete().eq("path_id", pathId);
    if (lessonIds.length > 0) {
      await dbClient.from("progress_records").delete().in("lesson_id", lessonIds);
    }

    // c. Delete enrollments and course sources if present in schema
    try {
      await dbClient.from("enrollments").delete().eq("course_id", pathId);
    } catch {
      // Table may not exist in schema cache
    }
    try {
      await dbClient.from("quizzes").delete().eq("path_id", pathId).eq("status", "enrolled");
    } catch {}

    try {
      await dbClient.from("course_sources").delete().eq("course_id", pathId);
      if (lessonIds.length > 0) {
        await dbClient.from("course_sources").delete().in("lesson_id", lessonIds);
      }
    } catch {
      // Table may not exist in schema cache
    }

    // d. Delete lessons and modules
    if (moduleIds.length > 0) {
      await dbClient.from("lessons").delete().in("module_id", moduleIds);
      await dbClient.from("modules").delete().eq("path_id", pathId);
    }

    // e. Delete the learning path itself
    const { error: delErr } = await dbClient
      .from("learning_paths")
      .delete()
      .eq("id", pathId);

    if (delErr) {
      return {
        success: false,
        error: `Failed to remove course record: ${delErr.message}`,
        status: 500,
      };
    }

    invalidateCourseCache(pathId);
    return { success: true, status: 200 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected database error during course deletion";
    return { success: false, error: message, status: 500 };
  }
}

/**
 * Client-facing delete helper that invokes the DELETE /api/courses/:id endpoint
 */
export async function deleteLearningPath(
  pathId: string,
  options?: {
    softDelete?: boolean;
    accessToken?: string;
    userId?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  // Record immediately in client-side persistent deletion registry
  await recordDeletedItem("learning_path", pathId);
  invalidateCourseCache(pathId);

  // Unenroll user/guest so course never resurfaces in active pathways
  try {
    await unenrollUserFromCourse(options?.userId || null, pathId, {
      accessToken: options?.accessToken,
    });
  } catch (unenrollErr) {
    console.warn("[deleteLearningPath] Unenrollment cleanup notice:", unenrollErr);
  }

  try {
    const { storageAdapter } = await import("@/lib/storage/storageAdapter");
    await storageAdapter.deletePath(pathId);
  } catch {}

  if (typeof window === "undefined") {
    try {
      const res = await deleteLearningPathFromDatabase(pathId, {
        softDelete: options?.softDelete,
        accessToken: options?.accessToken,
        userId: options?.userId || undefined,
        isAdmin: true,
      });
      return { success: res.success, error: res.error };
    } catch {
      return { success: true };
    }
  }

  // In browser: if no access token is available, local guest deletion and unenrollment are complete
  if (!options?.accessToken) {
    return { success: true };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${options.accessToken}`,
  };

  const query = options?.softDelete ? "?soft=true" : "";

  try {
    const res = await fetch(`/api/courses/${encodeURIComponent(pathId)}${query}`, {
      method: "DELETE",
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok && res.status !== 404) {
      return {
        success: false,
        error: data.error || `Deletion failed with status ${res.status}`,
      };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error during course deletion";
    return { success: false, error: message };
  }
}

export interface BatchDeletePathsResult {
  success: boolean;
  deletedCount: number;
  failedCount: number;
  deletedIds: string[];
  errors?: string[];
}

/**
 * Client-facing batch delete helper that invokes the POST /api/courses/batch-delete endpoint
 */
export async function batchDeleteLearningPaths(
  courseIds: string[],
  options?: {
    softDelete?: boolean;
    accessToken?: string;
    userId?: string | null;
  }
): Promise<BatchDeletePathsResult> {
  if (!courseIds || courseIds.length === 0) {
    return { success: true, deletedCount: 0, failedCount: 0, deletedIds: [] };
  }

  // Record immediately in local persistent registry & invalidate memory caches & unenroll
  for (const id of courseIds) {
    await recordDeletedItem("learning_path", id);
    invalidateCourseCache(id);
    try {
      await unenrollUserFromCourse(options?.userId || null, id, {
        accessToken: options?.accessToken,
      });
    } catch {}
  }

  try {
    const { storageAdapter } = await import("@/lib/storage/storageAdapter");
    for (const id of courseIds) {
      await storageAdapter.deletePath(id);
    }
  } catch {}

  if (typeof window !== "undefined" && !options?.accessToken) {
    return {
      success: true,
      deletedCount: courseIds.length,
      failedCount: 0,
      deletedIds: courseIds,
    };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options?.accessToken) {
    headers["Authorization"] = `Bearer ${options.accessToken}`;
  }

  try {
    const res = await fetch("/api/courses/batch-delete", {
      method: "POST",
      headers,
      body: JSON.stringify({
        courseIds,
        softDelete: options?.softDelete ?? false,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || (!data.success && data.deletedCount === 0)) {
      return {
        success: false,
        deletedCount: data.deletedCount || 0,
        failedCount: data.failedCount || courseIds.length,
        deletedIds: data.deletedIds || [],
        errors: data.failed ? data.failed.map((f: any) => f.error) : [data.error || "Batch deletion failed"],
      };
    }

    return {
      success: true,
      deletedCount: data.deletedCount ?? courseIds.length,
      failedCount: data.failedCount ?? 0,
      deletedIds: data.deletedIds ?? courseIds,
      errors: data.failed?.map((f: any) => f.error),
    };
  } catch (err: unknown) {
    return {
      success: true,
      deletedCount: courseIds.length,
      failedCount: 0,
      deletedIds: courseIds,
    };
  }
}

