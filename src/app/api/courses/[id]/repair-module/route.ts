import { NextRequest, NextResponse } from "next/server";
import { resourceEngine } from "@/lib/resource-engine/orchestrator";
import { getLearningPathById, inMemoryPathCache } from "@/services/supabase/pathService";
import { storageAdapter } from "@/lib/storage/storageAdapter";
import { z } from "zod";

const RepairModuleSchema = z.object({
  moduleId: z.string().min(1, "Module ID is required"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id;
    const body = await req.json();
    const { moduleId } = RepairModuleSchema.parse(body);

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

    const repairResult = await resourceEngine.repairModuleGaps(
      course.title,
      course.domain || "Academic",
      course.level || "intermediate",
      {
        id: targetMod.id,
        title: targetMod.title,
        objective: targetMod.objective,
        moduleNumber: targetMod.moduleNumber || modIndex + 1,
        lessons: targetMod.lessons || targetMod.resources || [],
        subtopics: targetMod.subtopics,
        syllabusMatrix: targetMod.syllabusMatrix,
      }
    );

    const updatedModule = {
      ...targetMod,
      lessons: repairResult.updatedLessons,
      resources: repairResult.updatedLessons,
      totalResources: repairResult.updatedLessons.length,
      syllabusMatrix: repairResult.updatedMatrix,
      coverageStatus: repairResult.updatedMatrix.overallCoveragePercent >= 75 ? "Fully Covered" : "Partially Covered",
      unmetObjectives: repairResult.updatedMatrix.subtopics
        .filter((s) => s.coverageStatus === "Missing Resources")
        .map((s) => s.learningObjective),
    };

    const updatedModules = [...modules];
    updatedModules[modIndex] = updatedModule;

    const updatedCourse = {
      ...course,
      modules: updatedModules,
    };

    inMemoryPathCache.set(courseId, updatedCourse);
    try {
      await storageAdapter.savePath(updatedCourse);
    } catch {}

    return NextResponse.json({
      success: true,
      course: updatedCourse,
      module: updatedModule,
      repairedCount: repairResult.repairedCount,
      addedLessons: repairResult.addedLessons,
      matrix: repairResult.updatedMatrix,
    });
  } catch (err: any) {
    console.error("[RepairModule API Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to repair module resources" },
      { status: 500 }
    );
  }
}
