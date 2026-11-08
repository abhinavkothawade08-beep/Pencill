import { NextRequest, NextResponse } from "next/server";
import { DeleteCourseParamsSchema, DeleteCourseQuerySchema, UpdateCourseSchema } from "@/lib/api-schemas";
import {
  deleteLearningPathFromDatabase,
  getLearningPathById,
  updateFullLearningPath,
} from "@/services/supabase/pathService";
import { supabase, isSupabaseConfigured } from "@/services/supabase/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paramResult = DeleteCourseParamsSchema.safeParse(params);
    if (!paramResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed on course identifier parameter",
          details: paramResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const courseId = paramResult.data.id;
    const course = await getLearningPathById(courseId);

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: `Curriculum "${courseId}" not found in catalog.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      course,
    });
  } catch (err: unknown) {
    console.error(`[GET /api/courses/:id] Unhandled exception:`, err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Internal server error during course retrieval",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Validate route parameter
    const paramResult = DeleteCourseParamsSchema.safeParse(params);
    if (!paramResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed on course identifier parameter",
          details: paramResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const courseId = paramResult.data.id;

    // 2. Parse query parameters (e.g. ?soft=true)
    const { searchParams } = new URL(req.url);
    const queryResult = DeleteCourseQuerySchema.safeParse({
      soft: searchParams.get("soft") ?? undefined,
    });
    const isSoftDelete = queryResult.success ? queryResult.data.soft ?? false : false;

    // 3. Authenticate Caller
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

    let authenticatedUserId: string | undefined;
    let isAdmin = false;
    let userRole: string | undefined;

    if (isSupabaseConfigured) {
      if (!token) {
        return NextResponse.json(
          {
            success: false,
            error: "Unauthorized: Missing authentication bearer token in request header.",
          },
          { status: 401 }
        );
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return NextResponse.json(
          {
            success: false,
            error: "Unauthorized: Invalid, expired, or revoked authentication credentials.",
          },
          { status: 401 }
        );
      }

      authenticatedUserId = user.id;

      const roleInAppMeta = (user.app_metadata as Record<string, unknown> | undefined)?.role;
      const roleInUserMeta = (user.user_metadata as Record<string, unknown> | undefined)?.role;
      userRole = typeof roleInAppMeta === "string" ? roleInAppMeta : typeof roleInUserMeta === "string" ? roleInUserMeta : undefined;


      if (
        roleInAppMeta === "admin" ||
        roleInUserMeta === "admin" ||
        roleInAppMeta === "instructor" ||
        roleInUserMeta === "instructor"
      ) {
        isAdmin = true;
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("tier")
          .eq("id", user.id)
          .maybeSingle();

        const tierLower = profile?.tier?.toLowerCase() || "";
        if (
          tierLower === "admin" ||
          tierLower.includes("instructor") ||
          tierLower.includes("faculty")
        ) {
          isAdmin = true;
        }
      }
    } else {
      // Local dev fallback when Supabase is completely unconfigured
      authenticatedUserId = "local-mock-user";
      isAdmin = false;
    }

    // 4. Execute Deletion with Cascade / Soft Delete
    const result = await deleteLearningPathFromDatabase(courseId, {
      softDelete: isSoftDelete,
      userId: authenticatedUserId,
      isAdmin,
      role: typeof userRole === "string" ? userRole : undefined,
      accessToken: token ?? undefined,
    });


    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to delete course",
        },
        { status: result.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: isSoftDelete
          ? `Curriculum '${courseId}' successfully archived (soft deleted).`
          : `Curriculum '${courseId}' and all cascading resources successfully deleted.`,
        courseId,
        strategy: isSoftDelete ? "soft_delete" : "hard_cascade",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error(`[DELETE /api/courses/:id] Unhandled exception:`, err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Internal server error during deletion",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Validate route parameter
    const paramResult = DeleteCourseParamsSchema.safeParse(params);
    if (!paramResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed on course identifier parameter",
          details: paramResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const courseId = paramResult.data.id;

    // 2. Validate payload body
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Malformed request payload: Body must be valid JSON.",
        },
        { status: 400 }
      );
    }

    const parseResult = UpdateCourseSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed on course update payload",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // 3. Authenticate caller
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

    let authenticatedUserId: string | undefined;
    let isAdmin = false;

    if (isSupabaseConfigured) {
      if (token) {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser(token);

        if (user && !authError) {
          authenticatedUserId = user.id;

          const roleInAppMeta = (user.app_metadata as Record<string, unknown> | undefined)?.role;
          const roleInUserMeta = (user.user_metadata as Record<string, unknown> | undefined)?.role;

          if (
            roleInAppMeta === "admin" ||
            roleInUserMeta === "admin" ||
            roleInAppMeta === "instructor" ||
            roleInUserMeta === "instructor"
          ) {
            isAdmin = true;
          } else {
            const { data: profile } = await supabase
              .from("profiles")
              .select("tier")
              .eq("id", user.id)
              .maybeSingle();

            const tierLower = profile?.tier?.toLowerCase() || "";
            if (
              tierLower === "admin" ||
              tierLower.includes("instructor") ||
              tierLower.includes("faculty")
            ) {
              isAdmin = true;
            }
          }
        }
      }
    } else {
      authenticatedUserId = "local-mock-user";
      isAdmin = false;
    }

    // 4. Execute atomic update
    const result = await updateFullLearningPath(courseId, parseResult.data, {
      userId: authenticatedUserId || null,
      accessToken: token ?? undefined,
      isAdmin,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to update course",
        },
        { status: result.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Curriculum '${courseId}' successfully updated.`,
        course: result.course,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error(`[PATCH /api/courses/:id] Unhandled exception:`, err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Internal server error during course update",
      },
      { status: 500 }
    );
  }
}

export const PUT = PATCH;

