import { NextRequest, NextResponse } from "next/server";
import { BatchDeleteQuizzesSchema } from "@/lib/api-schemas";
import { deleteQuizFromDatabase, invalidateQuizCache } from "@/services/supabase/quizService";
import { supabase, isSupabaseConfigured } from "@/services/supabase/client";

async function handleBatchDelete(req: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await req.json().catch(() => null);
    const parsed = BatchDeleteQuizzesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed on batch delete quiz parameters",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const { quizIds } = parsed.data;

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
      authenticatedUserId = "local-mock-user";
      isAdmin = false;
    }

    // 3. Process Deletion for Each Quiz with Safety & Ownership Verification
    const deletedIds: string[] = [];
    const failedItems: Array<{ id: string; error: string }> = [];

    for (const id of quizIds) {
      try {
        const result = await deleteQuizFromDatabase(id, {
          userId: authenticatedUserId,
          isAdmin,
          role: userRole,
          accessToken: token ?? undefined,
        });

        if (result.success) {
          deletedIds.push(id);
          invalidateQuizCache(id);
        } else {
          failedItems.push({ id, error: result.error || "Failed to delete quiz" });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error deleting quiz";
        failedItems.push({ id, error: message });
      }
    }

    return NextResponse.json(
      {
        success: deletedIds.length > 0 || failedItems.length === 0,
        deletedCount: deletedIds.length,
        failedCount: failedItems.length,
        deletedIds,
        failed: failedItems,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[POST /api/quizzes/batch-delete] Unhandled error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Internal server error during batch quiz deletion",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handleBatchDelete(req);
}

export async function DELETE(req: NextRequest) {
  return handleBatchDelete(req);
}
