import { supabase, isSupabaseConfigured } from "./client";
import { Lesson, LearningPath, Module } from "@/types";
import { getLearningPathById } from "./pathService";

export interface LessonWorkspaceData {
  course: LearningPath;
  module: Module | null;
  lesson: Lesson;
  siblingLessons: Lesson[];
  prevLesson: Lesson | null;
  nextLesson: Lesson | null;
}

export async function getLessonById(lessonId: string): Promise<Lesson | null> {
  if (!isSupabaseConfigured || !lessonId) {
    return null;
  }

  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error(`Error fetching lesson ${lessonId} from Supabase:`, error);
    return null;
  }

  return {
    id: data.id,
    moduleId: data.module_id,
    title: data.title,
    type: data.type as Lesson["type"],
    durationMinutes: data.duration_minutes,
    sourceName: data.source_name,
    sourceUrl: data.source_url || undefined,
    orderIndex: data.order_index,
    conceptId: data.concept_id || undefined,
    prerequisitesNote: data.prerequisites_note || undefined,
    chapters: (data.chapters as unknown as Lesson["chapters"]) || [],
    formulae: (data.formulae as unknown as Lesson["formulae"]) || [],
    summaryPoints: data.summary_points || [],
    studyNotes: Array.isArray((data as any).study_notes)
      ? ((data as any).study_notes as Lesson["studyNotes"])
      : [],
  };
}

export async function getLessonWorkspaceData(
  courseId: string,
  lessonId: string
): Promise<LessonWorkspaceData | null> {
  if (!courseId || !lessonId) {
    return null;
  }

  // 1. Fetch full learning path with modules and lessons
  const course = await getLearningPathById(courseId);
  if (!course) {
    return null;
  }

  // 2. Locate active module and lesson
  let activeModule: Module | null = null;
  let activeLesson: Lesson | null = null;
  let prevLesson: Lesson | null = null;
  let nextLesson: Lesson | null = null;
  let siblingLessons: Lesson[] = [];

  const allModules = course.modules || [];
  for (let mIdx = 0; mIdx < allModules.length; mIdx++) {
    const mod = allModules[mIdx];
    const lIndex = mod.lessons.findIndex((l) => l.id === lessonId);
    if (lIndex !== -1) {
      activeModule = mod;
      activeLesson = mod.lessons[lIndex];
      siblingLessons = mod.lessons;

      // Previous lesson: within module, or last lesson of previous module
      if (lIndex > 0) {
        prevLesson = mod.lessons[lIndex - 1];
      } else if (mIdx > 0 && allModules[mIdx - 1].lessons.length > 0) {
        prevLesson = allModules[mIdx - 1].lessons[allModules[mIdx - 1].lessons.length - 1];
      }

      // Next lesson: within module, or first lesson of next module
      if (lIndex < mod.lessons.length - 1) {
        nextLesson = mod.lessons[lIndex + 1];
      } else if (mIdx < allModules.length - 1 && allModules[mIdx + 1].lessons.length > 0) {
        nextLesson = allModules[mIdx + 1].lessons[0];
      }
      break;
    }
  }

  // If lesson wasn't in module tree, try fetching directly
  if (!activeLesson) {
    activeLesson = await getLessonById(lessonId);
    if (!activeLesson) {
      return null;
    }
    if (activeLesson.moduleId) {
      activeModule = course.modules?.find((m) => m.id === activeLesson?.moduleId) || null;
      if (activeModule) {
        siblingLessons = activeModule.lessons;
        const lIndex = siblingLessons.findIndex((l) => l.id === lessonId);
        prevLesson = lIndex > 0 ? siblingLessons[lIndex - 1] : null;
        nextLesson = lIndex !== -1 && lIndex < siblingLessons.length - 1 ? siblingLessons[lIndex + 1] : null;
      }
    }
  }

  return {
    course,
    module: activeModule,
    lesson: activeLesson,
    siblingLessons,
    prevLesson,
    nextLesson,
  };
}
