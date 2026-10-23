import { NextRequest, NextResponse } from "next/server";
import { DeleteQuizParamsSchema } from "@/lib/api-schemas";
import { deleteQuizFromDatabase, getQuizById } from "@/services/supabase/quizService";
import { supabase, isSupabaseConfigured } from "@/services/supabase/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paramResult = DeleteQuizParamsSchema.safeParse(params);
    if (!paramResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed on quiz identifier parameter",
          details: paramResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const quizId = paramResult.data.id;

    // Optional user token
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    const client = isSupabaseConfigured && token ? supabase : undefined;

    // Load quiz with answers hidden for client assessment safety
    const quiz = await getQuizById(quizId, { hideAnswers: true }, client);

    if (!quiz) {
      return NextResponse.json(
        {
          success: false,
          error: `Diagnostic assessment "${quizId}" not found.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      quiz,
    });
  } catch (err: unknown) {
    console.error("[API /api/quizzes/[id]] GET error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to load assessment",
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
    const paramResult = DeleteQuizParamsSchema.safeParse(params);
    if (!paramResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed on quiz identifier parameter",
          details: paramResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const quizId = paramResult.data.id;

    // 2. Authenticate Caller
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

    // 3. Execute Deletion with Cascade
    const result = await deleteQuizFromDatabase(quizId, {
      userId: authenticatedUserId,
      isAdmin,
      role: typeof userRole === "string" ? userRole : undefined,
      accessToken: token ?? undefined,
    });


    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to delete quiz assessment",
        },
        { status: result.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Quiz assessment '${quizId}' and all cascading questions, responses, and attempts successfully deleted.`,
        quizId,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error(`[DELETE /api/quizzes/:id] Unhandled exception:`, err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Internal server error during quiz deletion",
      },
      { status: 500 }
    );
  }
}
