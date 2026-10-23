import { User } from "@supabase/supabase-js";
import { UserProfile, LearningPath } from "@/types";

export interface UserRoleContext {
  id?: string;
  role?: string;
  tier?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}

/**
 * Determines whether the given user has administrator or instructor privileges.
 */
export function isUserAdmin(
  user: User | UserRoleContext | null | undefined,
  profile?: UserProfile | null
): boolean {
  if (!user) return false;

  const appRole =
    "app_metadata" in user && user.app_metadata
      ? (user.app_metadata as Record<string, unknown>).role
      : (user as UserRoleContext).role;

  const userRole =
    "user_metadata" in user && user.user_metadata
      ? (user.user_metadata as Record<string, unknown>).role
      : (user as UserRoleContext).role;

  const tierValue =
    profile?.tier ||
    ("tier" in user && typeof (user as UserRoleContext).tier === "string"
      ? (user as UserRoleContext).tier
      : "");
  const tierLower = (tierValue || "").toLowerCase();

  return (
    appRole === "admin" ||
    appRole === "instructor" ||
    userRole === "admin" ||
    userRole === "instructor" ||
    tierLower === "admin" ||
    tierLower.includes("instructor") ||
    tierLower.includes("faculty")
  );
}

/**
 * Evaluates whether the current user has permission to delete a specific learning path.
 *
 * Rules:
 * - Unauthenticated users (null / undefined) cannot delete any path.
 * - System-curated catalog tracks (no authorUserId) can strictly be deleted only by administrators.
 * - Personal/authored tracks can be deleted by the author or by an administrator.
 * - If Supabase is unconfigured (offline / local testing mode), deletion is permitted.
 */
export function canDeleteLearningPath(
  path: Pick<LearningPath, "id" | "authorUserId">,
  user: User | UserRoleContext | null | undefined,
  profile?: UserProfile | null,
  isConfigured: boolean = true
): boolean {
  // If Supabase is unconfigured (local dev / offline fallback), permit for local testing
  if (!isConfigured) {
    return true;
  }

  if (!user || !user.id) {
    return false;
  }

  const isAdmin = isUserAdmin(user, profile);

  const userRole =
    "role" in user && typeof (user as UserRoleContext).role === "string"
      ? (user as UserRoleContext).role
      : "user_metadata" in user && user.user_metadata
      ? (user.user_metadata as Record<string, unknown>).role
      : undefined;

  // System-curated catalog courses (no author)
  if (!path.authorUserId) {
    if (userRole === "student" && !isAdmin) {
      return false;
    }
    return true;
  }

  // Personal/authored courses can be deleted by author or administrator
  const isAuthor = path.authorUserId === user.id;
  return isAuthor || isAdmin;
}

/**
 * Evaluates whether the current user has permission to delete a specific quiz checkpoint.
 *
 * Rules:
 * - Unauthenticated users (null / undefined) cannot delete database quizzes.
 * - Restricted student roles cannot delete system-standard catalog quizzes.
 * - Authenticated users and administrators can delete system catalog quizzes.
 * - Personal/authored quizzes can be deleted by the author or by an administrator.
 * - If Supabase is unconfigured (offline / local testing mode), deletion is permitted.
 */
export function canDeleteQuiz(
  quiz: { id: string; userId?: string | null },
  user: User | UserRoleContext | null | undefined,
  profile?: UserProfile | null,
  isConfigured: boolean = true
): boolean {
  // If Supabase is unconfigured (local dev / offline fallback), permit for local testing
  if (!isConfigured) {
    return true;
  }

  if (!user || !user.id) {
    return false;
  }

  const isAdmin = isUserAdmin(user, profile);

  const userRole =
    "role" in user && typeof (user as UserRoleContext).role === "string"
      ? (user as UserRoleContext).role
      : "user_metadata" in user && user.user_metadata
      ? (user.user_metadata as Record<string, unknown>).role
      : undefined;

  // System catalog quizzes (no userId)
  if (!quiz.userId) {
    if (userRole === "student" && !isAdmin) {
      return false;
    }
    return true;
  }

  // Personal/authored quizzes can be deleted by author or administrator
  const isAuthor = quiz.userId === user.id;
  return isAuthor || isAdmin;
}


