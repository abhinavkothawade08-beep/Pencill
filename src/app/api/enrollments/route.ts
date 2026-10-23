import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase, isSupabaseConfigured, getAuthenticatedSupabaseClient } from "@/services/supabase/client";
import {
  getServerUserEnrollments,
  addServerEnrollment,
  removeServerEnrollment,
  isServerUserEnrolled,
} from "@/services/supabase/serverEnrollmentStore";
import { getLearningPathById } from "@/services/supabase/pathService";

const EnrollmentPostSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  courseId: z.string().min(1, "courseId is required"),
  completionStatus: z.enum(["enrolled", "in_progress", "completed", "archived"]).optional(),
});

const EnrollmentDeleteSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  courseId: z.string().min(1, "courseId is required"),
});

async function authenticateRequest(req: NextRequest, targetUserId: string): Promise<{ authorized: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { authorized: true };
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!token) {
    // If no token provided, permit if offline or if checking matching userId in dev/guest
    return { authorized: true };
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { authorized: false, error: "Unauthorized: Invalid or expired session." };
  }

  if (user.id !== targetUserId) {
    return { authorized: false, error: "Forbidden: Cannot access or modify enrollments of another user." };
  }

  return { authorized: true };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId parameter is required" }, { status: 400 });
    }

    const authCheck = await authenticateRequest(req, userId);
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: 403 });
    }

    const serverRecords = getServerUserEnrollments(userId);
    return NextResponse.json({ success: true, enrollments: serverRecords });
  } catch (err: unknown) {
    console.error("[api/enrollments] GET error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = EnrollmentPostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { userId, courseId, completionStatus } = parsed.data;

    const authCheck = await authenticateRequest(req, userId);
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: 403 });
    }

    // Verify course existence
    const course = await getLearningPathById(courseId);
    if (!course) {
      return NextResponse.json(
        { success: false, error: `Course "${courseId}" does not exist in the curriculum catalog.` },
        { status: 404 }
      );
    }

    // 1. Add to persistent server-side store
    const record = addServerEnrollment(userId, courseId, { completionStatus });

    // 2. Persist to Supabase PostgreSQL database
    if (isSupabaseConfigured) {
      const authHeader = req.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : undefined;
      const dbClient = getAuthenticatedSupabaseClient(token);

      // Attempt 2a: Native enrollments table
      try {
        const { error: nativeErr } = await dbClient.from("enrollments").upsert(
          {
            user_id: userId,
            course_id: courseId,
            enrolled_at: record.enrolledAt,
            completion_status: record.completionStatus,
            last_accessed_at: record.lastAccessedAt,
          },
          { onConflict: "user_id,course_id" }
        );

        if (nativeErr) {
          // If table doesn't exist or is not in schema cache, write DB fallback marker
          const isMissingTable =
            nativeErr.code === "PGRST205" ||
            nativeErr.code === "42P01" ||
            nativeErr.message.includes("schema cache") ||
            nativeErr.message.includes("does not exist");

          if (isMissingTable) {
            const markerId = `__enrollment__${userId}__${courseId}`;
            await dbClient.from("quizzes").upsert(
              {
                id: markerId,
                title: `[ENROLLMENT] ${courseId}`,
                status: "enrolled",
                path_id: courseId,
                user_id: userId,
                time_limit_minutes: 0,
                metadata: {
                  userId,
                  courseId,
                  enrolledAt: record.enrolledAt,
                  completionStatus: record.completionStatus,
                  progressPercent: 0,
                  lastAccessedAt: record.lastAccessedAt,
                } as unknown as import("@/services/supabase/database.types").Json,
              },
              { onConflict: "id" }
            );
          }
        }
      } catch (dbErr) {
        console.warn("[api/enrollments] Supabase write notice:", dbErr);
      }

      // Increment enrolled_count on learning_paths
      try {
        const currentCount = course.enrolledCount || 0;
        await dbClient
          .from("learning_paths")
          .update({ enrolled_count: currentCount + 1 })
          .eq("id", courseId);
      } catch {
        // Ignore stats update failure
      }
    }

    return NextResponse.json({ success: true, enrollment: record });
  } catch (err: unknown) {
    console.error("[api/enrollments] POST error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Enrollment failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    let userId: string | null = null;
    let courseId: string | null = null;

    if (req.method === "DELETE") {
      try {
        const body = await req.json();
        userId = body.userId;
        courseId = body.courseId;
      } catch {
        const { searchParams } = new URL(req.url);
        userId = searchParams.get("userId");
        courseId = searchParams.get("courseId");
      }
    }

    const parsed = EnrollmentDeleteSchema.safeParse({ userId, courseId });
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const authCheck = await authenticateRequest(req, parsed.data.userId);
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: 403 });
    }

    // 1. Remove from server store
    removeServerEnrollment(parsed.data.userId, parsed.data.courseId);

    // 2. Remove from Supabase
    if (isSupabaseConfigured) {
      const authHeader = req.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : undefined;
      const dbClient = getAuthenticatedSupabaseClient(token);

      try {
        await dbClient
          .from("enrollments")
          .delete()
          .eq("user_id", parsed.data.userId)
          .eq("course_id", parsed.data.courseId);
      } catch {}

      try {
        const markerId = `__enrollment__${parsed.data.userId}__${parsed.data.courseId}`;
        await dbClient.from("quizzes").delete().eq("id", markerId);
      } catch {}
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[api/enrollments] DELETE error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to unenroll" },
      { status: 500 }
    );
  }
}
