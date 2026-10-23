import { supabase, isSupabaseConfigured, getAuthenticatedSupabaseClient } from "./client";
import { LearningPath } from "@/types";
import { getDeletedItemIds, isItemDeletedSync } from "./deletionRegistry";
import { getLearningPathById, invalidateCourseCache } from "./pathService";

export interface UserEnrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  completionStatus: "enrolled" | "in_progress" | "completed" | "archived";
  progressPercent: number;
  lastAccessedAt: string;
  course?: LearningPath;
}

const GUEST_ENROLLMENTS_KEY = "pencill_guest_enrollments";
const USER_ENROLLMENTS_PREFIX = "pencill_enrollments_";

export function getGuestEnrollments(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_ENROLLMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGuestEnrollments(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_ENROLLMENTS_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch (e) {
    console.warn("[enrollmentService] Could not save guest enrollments:", e);
  }
}

function getClientUserEnrollments(userId: string): UserEnrollment[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const raw = localStorage.getItem(`${USER_ENROLLMENTS_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveClientUserEnrollments(userId: string, enrollments: UserEnrollment[]): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.setItem(`${USER_ENROLLMENTS_PREFIX}${userId}`, JSON.stringify(enrollments));
  } catch (e) {
    console.warn("[enrollmentService] Could not save client user enrollments:", e);
  }
}

function notifyEnrollmentChange(courseId: string, enrolled: boolean): void {
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(
        new CustomEvent("pencill:enrollment-changed", {
          detail: { courseId, enrolled },
        })
      );
    } catch {}
  }
}

/**
 * Fetch all verified courses the user has actually enrolled in.
 * Guarantees persistence across page refresh, navigation, and app restarts.
 */
export async function getUserEnrollments(
  userId: string | null,
  options?: { accessToken?: string }
): Promise<UserEnrollment[]> {
  const deletedPathIds = await getDeletedItemIds("learning_path");

  // 1. Unauthenticated / Guest Flow
  if (!userId) {
    const guestCourseIds = getGuestEnrollments();
    if (guestCourseIds.length === 0) return [];

    const activeCourseIds = guestCourseIds.filter((id) => !deletedPathIds.has(id));
    const courses = await Promise.all(activeCourseIds.map((id) => getLearningPathById(id)));

    return courses
      .filter((c): c is LearningPath => c !== null && c !== undefined && !isItemDeletedSync(c.id, "learning_path"))
      .map((course) => ({
        id: `guest-enrollment-${course.id}`,
        userId: "guest",
        courseId: course.id,
        enrolledAt: new Date().toISOString(),
        completionStatus: "in_progress" as const,
        progressPercent: course.progressPercent || 0,
        lastAccessedAt: new Date().toISOString(),
        course,
      }));
  }

  // 2. Authenticated Flow - Resilient Multi-tier Gathering
  const rawRecordsMap = new Map<string, {
    id: string;
    userId: string;
    courseId: string;
    enrolledAt: string;
    completionStatus: UserEnrollment["completionStatus"];
    progressPercent: number;
    lastAccessedAt: string;
  }>();

  // Tier A: Check LocalStorage cache for immediate hydration
  if (typeof window !== "undefined") {
    const cached = getClientUserEnrollments(userId);
    cached.forEach((item) => {
      if (item.courseId) {
        rawRecordsMap.set(item.courseId, {
          id: item.id || `enrollment-${userId}-${item.courseId}`,
          userId,
          courseId: item.courseId,
          enrolledAt: item.enrolledAt || new Date().toISOString(),
          completionStatus: item.completionStatus || "in_progress",
          progressPercent: item.progressPercent || 0,
          lastAccessedAt: item.lastAccessedAt || item.enrolledAt || new Date().toISOString(),
        });
      }
    });
  }

  // Tier B: Check Server Store (data/enrollments.json)
  if (typeof window === "undefined") {
    try {
      const { getServerUserEnrollments } = await import("./serverEnrollmentStore");
      const serverRecords = getServerUserEnrollments(userId);
      serverRecords.forEach((r) => {
        if (!rawRecordsMap.has(r.courseId)) {
          rawRecordsMap.set(r.courseId, r);
        }
      });
    } catch {}
  } else {
    // Client-side API fetch
    try {
      const res = await fetch(`/api/enrollments?userId=${encodeURIComponent(userId)}`, {
        headers: options?.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.enrollments)) {
          json.enrollments.forEach((r: any) => {
            if (r.courseId && !rawRecordsMap.has(r.courseId)) {
              rawRecordsMap.set(r.courseId, r);
            }
          });
        }
      }
    } catch {}
  }

  // Tier C: Check Supabase Database
  if (isSupabaseConfigured) {
    const dbClient = getAuthenticatedSupabaseClient(options?.accessToken);

    // Try Tier C1: Native public.enrollments table
    let nativeQueryFailed = false;
    try {
      const { data, error } = await dbClient
        .from("enrollments")
        .select("id, user_id, course_id, enrolled_at, completion_status, progress_percent, last_accessed_at")
        .eq("user_id", userId)
        .order("last_accessed_at", { ascending: false });

      if (error) {
        nativeQueryFailed = true;
      } else if (data && Array.isArray(data)) {
        data.forEach((row: any) => {
          if (row.course_id) {
            rawRecordsMap.set(row.course_id, {
              id: row.id,
              userId: row.user_id,
              courseId: row.course_id,
              enrolledAt: row.enrolled_at,
              completionStatus: row.completion_status,
              progressPercent: Number(row.progress_percent || 0),
              lastAccessedAt: row.last_accessed_at,
            });
          }
        });
      }
    } catch {
      nativeQueryFailed = true;
    }

    // Try Tier C2: Authoritative Database fallback in quizzes table
    if (nativeQueryFailed) {
      try {
        const { data: markerRows, error: markerErr } = await dbClient
          .from("quizzes")
          .select("id, path_id, user_id, status, metadata")
          .eq("status", "enrolled")
          .or(`user_id.eq.${userId},id.like.__enrollment__${userId}__%`);

        if (!markerErr && Array.isArray(markerRows)) {
          markerRows.forEach((row: any) => {
            const courseId = row.path_id || (row.metadata as any)?.courseId;
            if (courseId) {
              const meta = (row.metadata || {}) as Record<string, any>;
              if (!rawRecordsMap.has(courseId)) {
                rawRecordsMap.set(courseId, {
                  id: row.id,
                  userId,
                  courseId,
                  enrolledAt: meta.enrolledAt || new Date().toISOString(),
                  completionStatus: meta.completionStatus || "in_progress",
                  progressPercent: Number(meta.progressPercent || 0),
                  lastAccessedAt: meta.lastAccessedAt || meta.enrolledAt || new Date().toISOString(),
                });
              }
            }
          });
        }
      } catch (markerException) {
        console.warn("[getUserEnrollments] DB marker query warning:", markerException);
      }
    }
  }

  const rawList = Array.from(rawRecordsMap.values()).filter(
    (item) => !deletedPathIds.has(item.courseId) && !isItemDeletedSync(item.courseId, "learning_path")
  );

  const hydratedResults = await Promise.all(
    rawList.map(async (rec) => {
      const course = await getLearningPathById(rec.courseId);
      if (!course || isItemDeletedSync(course.id, "learning_path")) {
        return null;
      }

      const enrollment: UserEnrollment = {
        id: rec.id,
        userId: rec.userId,
        courseId: rec.courseId,
        enrolledAt: rec.enrolledAt,
        completionStatus: rec.completionStatus,
        progressPercent: course.progressPercent ?? rec.progressPercent ?? 0,
        lastAccessedAt: rec.lastAccessedAt,
        course,
      };

      return enrollment;
    })
  );

  const finalEnrollments = hydratedResults
    .filter((e): e is UserEnrollment => Boolean(e && e.course))
    .sort((a, b) => new Date(b.lastAccessedAt || b.enrolledAt).getTime() - new Date(a.lastAccessedAt || a.enrolledAt).getTime());

  // Update client cache for fast next render
  if (typeof window !== "undefined") {
    saveClientUserEnrollments(userId, finalEnrollments);
  }

  return finalEnrollments;
}

/**
 * Enroll learner in a course track.
 * Idempotent: does not duplicate enrollments.
 */
export async function enrollUserInCourse(
  userId: string | null,
  courseId: string,
  options?: {
    accessToken?: string;
    completionStatus?: "enrolled" | "in_progress";
  }
): Promise<{ success: boolean; enrollment?: UserEnrollment; error?: string }> {
  if (!courseId) {
    return { success: false, error: "Course ID is required." };
  }

  // Verify course exists before enrolling
  const course = await getLearningPathById(courseId);
  if (!course) {
    return { success: false, error: `Course "${courseId}" does not exist in the curriculum catalog.` };
  }

  // 1. Guest Enrollment
  if (!userId) {
    const current = getGuestEnrollments();
    if (!current.includes(courseId)) {
      saveGuestEnrollments([...current, courseId]);
    }
    const guestEnrollment: UserEnrollment = {
      id: `guest-enrollment-${courseId}`,
      userId: "guest",
      courseId,
      enrolledAt: new Date().toISOString(),
      completionStatus: "in_progress",
      progressPercent: course.progressPercent || 0,
      lastAccessedAt: new Date().toISOString(),
      course,
    };
    notifyEnrollmentChange(courseId, true);
    return { success: true, enrollment: guestEnrollment };
  }

  // 2. Authenticated User Enrollment
  const now = new Date().toISOString();
  const enrollment: UserEnrollment = {
    id: `enrollment-${userId}-${courseId}`,
    userId,
    courseId,
    enrolledAt: now,
    completionStatus: options?.completionStatus || "in_progress",
    progressPercent: course.progressPercent || 0,
    lastAccessedAt: now,
    course,
  };

  // Immediate Client-Side Cache Update
  if (typeof window !== "undefined") {
    const existing = getClientUserEnrollments(userId);
    const updated = existing.filter((e) => e.courseId !== courseId);
    updated.unshift(enrollment);
    saveClientUserEnrollments(userId, updated);
  }

  // Server-side / API Layer Persistence
  if (typeof window === "undefined") {
    try {
      const { addServerEnrollment } = await import("./serverEnrollmentStore");
      addServerEnrollment(userId, courseId, { completionStatus: enrollment.completionStatus });
    } catch {}
  } else {
    try {
      await fetch("/api/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(options?.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
        },
        body: JSON.stringify({
          userId,
          courseId,
          completionStatus: enrollment.completionStatus,
        }),
      });
    } catch (e) {
      console.warn("[enrollUserInCourse] API enrollment sync notice:", e);
    }
  }

  // Supabase Database Persistence
  if (isSupabaseConfigured) {
    const dbClient = getAuthenticatedSupabaseClient(options?.accessToken);

    // Try native enrollments table
    try {
      const { error: nativeErr } = await dbClient.from("enrollments").upsert(
        {
          user_id: userId,
          course_id: courseId,
          enrolled_at: enrollment.enrolledAt,
          completion_status: enrollment.completionStatus,
          last_accessed_at: enrollment.lastAccessedAt,
        },
        { onConflict: "user_id,course_id" }
      );

      // If native table missing from schema, persist authoritative marker to quizzes table
      if (nativeErr) {
        const isMissing =
          nativeErr.code === "PGRST205" ||
          nativeErr.code === "42P01" ||
          nativeErr.message.includes("schema cache") ||
          nativeErr.message.includes("does not exist");

        if (isMissing) {
          const markerId = `__enrollment__${userId}__${courseId}`;
          const { error: quizUpsertErr } = await dbClient.from("quizzes").upsert(
            {
              id: markerId,
              title: `[ENROLLMENT] ${courseId}`,
              status: "enrolled",
              path_id: courseId,
              user_id: options?.accessToken ? userId : null,
              time_limit_minutes: 0,
              metadata: {
                userId,
                courseId,
                enrolledAt: enrollment.enrolledAt,
                completionStatus: enrollment.completionStatus,
                progressPercent: 0,
                lastAccessedAt: enrollment.lastAccessedAt,
              } as unknown as import("./database.types").Json,
            },
            { onConflict: "id" }
          );
          if (quizUpsertErr) {
            console.warn("[enrollUserInCourse] DB marker notice:", quizUpsertErr.message);
          }
        }
      }
    } catch (dbErr) {
      console.warn("[enrollUserInCourse] Supabase write notice:", dbErr);
    }

    // Increment enrolled_count on learning_paths
    try {
      const currentCount = course.enrolledCount || 0;
      await dbClient
        .from("learning_paths")
        .update({ enrolled_count: currentCount + 1 })
        .eq("id", courseId);
    } catch {}
  }

  notifyEnrollmentChange(courseId, true);

  return { success: true, enrollment };
}

/**
 * Unenroll learner from a course track.
 */
export async function unenrollUserFromCourse(
  userId: string | null,
  courseId: string,
  options?: { accessToken?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!courseId) {
    return { success: false, error: "Course ID is required." };
  }

  // 1. Guest Unenrollment
  if (!userId) {
    const current = getGuestEnrollments();
    saveGuestEnrollments(current.filter((id) => id !== courseId));
    notifyEnrollmentChange(courseId, false);
    return { success: true };
  }

  // 2. Client-Side Cache Update
  if (typeof window !== "undefined") {
    const existing = getClientUserEnrollments(userId);
    saveClientUserEnrollments(userId, existing.filter((e) => e.courseId !== courseId));
  }

  // Server-side / API Layer Removal
  if (typeof window === "undefined") {
    try {
      const { removeServerEnrollment } = await import("./serverEnrollmentStore");
      removeServerEnrollment(userId, courseId);
    } catch {}
  } else {
    try {
      await fetch("/api/enrollments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(options?.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
        },
        body: JSON.stringify({ userId, courseId }),
      });
    } catch (e) {
      console.warn("[unenrollUserFromCourse] API unenrollment sync notice:", e);
    }
  }

  // Supabase Database Removal
  if (isSupabaseConfigured) {
    const dbClient = getAuthenticatedSupabaseClient(options?.accessToken);

    try {
      await dbClient
        .from("enrollments")
        .delete()
        .eq("user_id", userId)
        .eq("course_id", courseId);
    } catch {}

    try {
      const markerId = `__enrollment__${userId}__${courseId}`;
      await dbClient.from("quizzes").delete().eq("id", markerId);
    } catch {}

    // Decrement enrolled_count on learning_paths
    try {
      const course = await getLearningPathById(courseId);
      if (course) {
        const currentCount = course.enrolledCount || 1;
        await dbClient
          .from("learning_paths")
          .update({ enrolled_count: Math.max(0, currentCount - 1) })
          .eq("id", courseId);
      }
    } catch {}
  }

  notifyEnrollmentChange(courseId, false);

  return { success: true };
}

/**
 * Check if the user is enrolled in a specific course.
 */
export async function isUserEnrolled(
  userId: string | null,
  courseId: string,
  options?: { accessToken?: string }
): Promise<boolean> {
  if (!courseId) return false;

  // 1. Guest Check
  if (!userId) {
    return getGuestEnrollments().includes(courseId);
  }

  // 2. Client LocalStorage check (instant)
  if (typeof window !== "undefined") {
    const cached = getClientUserEnrollments(userId);
    if (cached.some((e) => e.courseId === courseId)) {
      return true;
    }
  }

  // 3. Server Store check
  if (typeof window === "undefined") {
    try {
      const { isServerUserEnrolled } = await import("./serverEnrollmentStore");
      if (isServerUserEnrolled(userId, courseId)) {
        return true;
      }
    } catch {}
  }

  // 4. Supabase DB check
  if (isSupabaseConfigured) {
    const dbClient = getAuthenticatedSupabaseClient(options?.accessToken);

    // Native enrollments check
    try {
      const { data, error } = await dbClient
        .from("enrollments")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .maybeSingle();

      if (!error && data) {
        return true;
      }
    } catch {}

    // Authoritative marker check in quizzes table
    try {
      const markerId = `__enrollment__${userId}__${courseId}`;
      const { data: marker, error: markerErr } = await dbClient
        .from("quizzes")
        .select("id")
        .eq("id", markerId)
        .maybeSingle();

      if (!markerErr && marker) {
        return true;
      }
    } catch {}
  }

  return false;
}
