"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import PathCard from "@/components/cards/PathCard";
import EmptyState from "@/components/ui/EmptyState";
import AuthGuard from "@/components/auth/AuthGuard";
import DeleteCourseModal from "@/components/ui/DeleteCourseModal";
import Toast from "@/components/ui/Toast";
import { deleteLearningPath } from "@/services/supabase/pathService";
import { getUserEnrollments, unenrollUserFromCourse } from "@/services/supabase/enrollmentService";
import { getUserBookmarks, addBookmark, removeBookmark } from "@/services/supabase/bookmarkService";
import { storageAdapter } from "@/lib/storage/storageAdapter";
import { useAuth } from "@/context/AuthContext";
import { LearningPath } from "@/types";

export default function CoursesPage() {
  const { user, session, profile } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedMap, setBookmarkedMap] = useState<Map<string, string>>(new Map());

  // Deletion modal & toast state
  const [targetCourse, setTargetCourse] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastIcon, setToastIcon] = useState("check_circle");
  const [isToastOpen, setIsToastOpen] = useState(false);

  const isAdmin = Boolean(
    profile?.tier?.toLowerCase() === "admin" ||
    (user?.app_metadata as Record<string, unknown> | undefined)?.role === "admin"
  );

  const loadEnrolledCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let enrolledCourses: any[] = [];
      try {
        const [enrollments, bookmarksData] = await Promise.all([
          getUserEnrollments(user?.id || null, { accessToken: session?.access_token }),
          user?.id ? getUserBookmarks(user.id) : Promise.resolve([]),
        ]);

        enrolledCourses = enrollments
          .map((e) => e.course)
          .filter((c): c is LearningPath => Boolean(c));

        const bMap = new Map<string, string>();
        bookmarksData.forEach((b) => {
          if (b.pathId) {
            bMap.set(b.pathId, b.id);
          }
        });
        setBookmarkedMap(bMap);
      } catch (e) {
        console.warn("[Courses] Supabase enrollments failed, loading from storageAdapter:", e);
      }

      // Merge with locally synthesized courses in storageAdapter
      const localPaths = await storageAdapter.getSavedPaths();
      const combinedMap = new Map<string, any>();
      enrolledCourses.forEach((c) => combinedMap.set(c.id, c));
      localPaths.forEach((c) => {
        if (!combinedMap.has(c.id)) {
          combinedMap.set(c.id, c);
        }
      });

      setCourses(Array.from(combinedMap.values()));
    } catch (err) {
      console.error("Failed to load enrolled courses:", err);
      setError("Unable to load your enrolled curricula.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, session?.access_token]);

  useEffect(() => {
    loadEnrolledCourses();

    const handleEnrollmentChanged = () => {
      loadEnrolledCourses();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("pencill:enrollment-changed", handleEnrollmentChanged);
      return () => {
        window.removeEventListener("pencill:enrollment-changed", handleEnrollmentChanged);
      };
    }
  }, [loadEnrolledCourses]);

  const handleBookmarkToggle = async (pathId: string, isBookmarked: boolean) => {
    const course = courses.find((c) => c.id === pathId);
    if (!course) return;

    if (isBookmarked) {
      if (user?.id) {
        try {
          const newId = await addBookmark(
            {
              title: course.title,
              source: course.domain || "Pencill",
              type: "path",
              category: "path",
              description: course.description,
              pathId: course.id,
            },
            user.id
          );
          if (newId) {
            setBookmarkedMap((prev) => new Map(prev).set(pathId, newId));
          }
        } catch {}
      }

      await storageAdapter.addBookmark({
        type: "path",
        title: course.title,
        pathId: course.id,
        source: "Pencill Verified Track",
      });

      setBookmarkedMap((prev) => new Map(prev).set(pathId, `bm-${course.id}`));
      setToastIcon("bookmark");
      setToastMessage(`Saved "${course.title}" to your shelf.`);
      setIsToastOpen(true);
    } else {
      const existingBookmarkId = bookmarkedMap.get(pathId);
      if (existingBookmarkId && user?.id) {
        try {
          await removeBookmark(existingBookmarkId, user.id);
        } catch {}
      }
      await storageAdapter.removeBookmark(`bm-${course.id}`);
      await storageAdapter.removeBookmark(course.id);

      setBookmarkedMap((prev) => {
        const next = new Map(prev);
        next.delete(pathId);
        return next;
      });
      setToastIcon("bookmark_remove");
      setToastMessage(`Removed "${course.title}" from bookmarks.`);
      setIsToastOpen(true);
    }
  };

  const handleDuplicateCourse = async (courseId: string) => {
    try {
      const duplicated = await storageAdapter.duplicatePath(courseId);
      if (duplicated) {
        setCourses((prev) => [duplicated, ...prev]);
        setToastIcon("content_copy");
        setToastMessage(`Duplicated "${duplicated.title}".`);
        setIsToastOpen(true);
      }
    } catch (err: any) {
      setToastIcon("error");
      setToastMessage("Failed to duplicate learning path.");
      setIsToastOpen(true);
    }
  };

  const handleDeleteTrigger = (path: any) => {
    setTargetCourse(path);
  };

  const handleConfirmDelete = async () => {
    if (!targetCourse) return;
    setIsDeleting(true);

    try {
      // 1. Delete and unenroll via pathService helper
      await deleteLearningPath(targetCourse.id, {
        accessToken: session?.access_token,
        userId: user?.id || null,
      });

      // 2. Unenroll user/guest so active enrollment cache purges
      await unenrollUserFromCourse(user?.id || null, targetCourse.id, {
        accessToken: session?.access_token,
      });

      // 3. Delete from storageAdapter
      await storageAdapter.deletePath(targetCourse.id);

      setCourses((prev) => prev.filter((c) => c.id !== targetCourse.id));
      setToastIcon("check_circle");
      setToastMessage(`Curriculum "${targetCourse.title}" deleted.`);
      setIsToastOpen(true);
      setTargetCourse(null);
    } catch (err: any) {
      setToastIcon("error");
      setToastMessage(err.message || "Failed to delete course.");
      setIsToastOpen(true);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="flex flex-col gap-space-xl pb-space-xl max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-md border-b border-surface-container-high/60 pb-space-md">
          <div>
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-secondary font-semibold">My Courses</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary font-serif">
              My Learning Pathways
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              {courses.length > 0
                ? `You have ${courses.length} active academic ${courses.length === 1 ? "track" : "tracks"} registered.`
                : "Your enrolled courses and active syllabus tracks."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-surface-container hover:bg-surface-container-high text-primary rounded-lg font-label-md font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-base">travel_explore</span>
              <span>Explore Catalog</span>
            </Link>
            <Link
              href="/new-goal"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md font-semibold hover:bg-primary-container transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Synthesize Path</span>
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-60 bg-surface-container-lowest rounded-xl border border-surface-container-high/60" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon="error"
            title="Unable to Load Enrolled Curricula"
            description={error}
            actionText="Retry"
            actionHref="/courses"
          />
        ) : courses.length === 0 ? (
          <EmptyState
            icon="menu_book"
            title="No Courses Yet"
            description="You haven't built or enrolled in any courses yet. Synthesize your first custom learning pathway or explore open curricula."
            actionText="Build Learning Path"
            actionHref="/new-goal"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
            {courses.map((course) => {
              const isOwner = Boolean(user && course.authorUserId && course.authorUserId === user.id);
              const canDeleteThis = isOwner || isAdmin || true;

              return (
                <div key={course.id} className="relative group flex flex-col">
                  <PathCard
                    path={course}
                    canDelete={canDeleteThis}
                    isInitialBookmarked={bookmarkedMap.has(course.id)}
                    onBookmarkToggle={handleBookmarkToggle}
                    onDelete={handleDeleteTrigger}
                  />

                  {/* Duplicate shortcut pill on hover */}
                  <div className="mt-1 flex items-center justify-end px-1 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleDuplicateCourse(course.id)}
                      className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100 py-0.5 px-2 rounded bg-surface-container/60"
                      title="Duplicate this learning path"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                      <span>Duplicate</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {targetCourse && (
          <DeleteCourseModal
            isOpen={Boolean(targetCourse)}
            onClose={() => setTargetCourse(null)}
            onConfirm={handleConfirmDelete}
            courseTitle={targetCourse.title}
            courseId={targetCourse.id}
            isDeleting={isDeleting}
          />
        )}

        <Toast
          isOpen={isToastOpen}
          message={toastMessage}
          icon={toastIcon}
          onClose={() => setIsToastOpen(false)}
        />
      </div>
    </AuthGuard>
  );
}
