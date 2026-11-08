import { NextRequest, NextResponse } from "next/server";
import { resourceEngine } from "@/lib/resource-engine/orchestrator";
import { getLearningPathById, inMemoryPathCache } from "@/services/supabase/pathService";
import { z } from "zod";

const RegenerateModuleSchema = z.object({
  moduleId: z.string().min(1, "Module ID is required"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id;
    const body = await req.json();
    const { moduleId } = RegenerateModuleSchema.parse(body);

    // Retrieve course
    let course = inMemoryPathCache.get(courseId);
    if (!course) {
      course = (await getLearningPathById(courseId)) || undefined;
    }

    if (!course || !course.modules || course.modules.length === 0) {
      return NextResponse.json(
        { success: false, error: `Course not found or has no modules: ${courseId}` },
        { status: 404 }
      );
    }

    const modules = course.modules;
    const modIndex = modules.findIndex((m: any) => m.id === moduleId);
    if (modIndex === -1) {
      return NextResponse.json(
        { success: false, error: `Module not found: ${moduleId} in course ${courseId}` },
        { status: 404 }
      );
    }

    const targetMod = modules[modIndex];

    // Collect all video URLs from other modules and their playlists to enforce zero cross-module duplicate videos
    const otherVideoUrls: string[] = [];
    modules.forEach((m: any, idx: number) => {
      if (idx !== modIndex) {
        (m.lessons || m.resources || []).forEach((l: any) => {
          if (l.type === "video" && l.sourceUrl) {
            otherVideoUrls.push(l.sourceUrl);
          }
        });
        if (m.primaryPlaylist?.items) {
          m.primaryPlaylist.items.forEach((item: any) => {
            if (item.videoUrl) otherVideoUrls.push(item.videoUrl);
            if (item.videoId) otherVideoUrls.push(item.videoId);
          });
        }
      }
    });

    const regenerated = await resourceEngine.regenerateModule(
      course.title,
      course.domain || "Academic",
      course.level || "intermediate",
      {
        id: targetMod.id,
        title: targetMod.title,
        objective: targetMod.objective,
        moduleNumber: targetMod.moduleNumber || modIndex + 1,
        primaryPlaylist: targetMod.primaryPlaylist,
        subtopics: targetMod.subtopics,
        existingLessons: targetMod.lessons || targetMod.resources || [],
      },
      otherVideoUrls
    );

    const updatedModule = {
      ...targetMod,
      lessons: regenerated.lessons,
      resources: regenerated.lessons,
      totalResources: regenerated.lessons.length,
      checkpointQuestions: regenerated.checkpointQuestions,
      flashcards: regenerated.flashcards,
      primaryPlaylist: targetMod.primaryPlaylist,
      subtopics: targetMod.subtopics,
      syllabusMatrix: targetMod.syllabusMatrix,
    };

    const updatedModules = [...modules];
    updatedModules[modIndex] = updatedModule;

    const updatedCourse = {
      ...course,
      modules: updatedModules,
    };

    inMemoryPathCache.set(courseId, updatedCourse);

    return NextResponse.json({
      success: true,
      course: updatedCourse,
      module: updatedModule,
    });
  } catch (err: any) {
    console.error("[RegenerateModule API Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to regenerate module" },
      { status: 500 }
    );
  }
}
