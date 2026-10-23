"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getLearningPathById } from "@/services/supabase";
import { deleteLearningPath } from "@/services/supabase/pathService";
import {
  isUserEnrolled,
  enrollUserInCourse,
  unenrollUserFromCourse,
} from "@/services/supabase/enrollmentService";
import {
  getUserBookmarks,
  addBookmark,
  removeBookmark,
} from "@/services/supabase/bookmarkService";
import { LearningPath } from "@/types";
import EmptyState from "@/components/ui/EmptyState";
import DeleteCourseModal from "@/components/ui/DeleteCourseModal";
import Toast from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, session, profile } = useAuth();
  const courseId = params?.courseId as string;

  const [course, setCourse] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);

  // Deletion state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastIcon, setToastIcon] = useState("check_circle");
  const [isToastOpen, setIsToastOpen] = useState(false);

  // Accordion state for modules
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!courseId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    getLearningPathById(courseId)
      .then((data) => {
        if (!isMounted) return;
        setCourse(data);
        if (data?.modules && data.modules.length > 0) {
          const initial: Record<string, boolean> = {};
          data.modules.slice(0, 2).forEach((m) => {
            initial[m.id] = true;
          });
          setOpenModules(initial);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load course details:", err);
        setError("Unable to load course syllabus from Supabase.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  useEffect(() => {
    let isMounted = true;
    if (!courseId) return;

    isUserEnrolled(user?.id || null, courseId, { accessToken: session?.access_token })
      .then((enrolled) => {
        if (isMounted) setIsEnrolled(enrolled);
      })
      .catch((err) => console.error("Error checking enrollment:", err));

    if (user?.id) {
      getUserBookmarks(user.id)
        .then((bmarks) => {
          if (!isMounted) return;
          const match = bmarks.find((b) => b.pathId === courseId);
          if (match) {
            setIsBookmarked(true);
            setBookmarkId(match.id);
          } else {
            setIsBookmarked(false);
            setBookmarkId(null);
          }
        })
        .catch((err) => console.error("Error checking bookmarks:", err));
    }

    return () => {
      isMounted = false;
    };
  }, [courseId, user?.id, session?.access_token]);

  const handleToggleEnroll = async () => {
    if (!course || isEnrolling) return;
    setIsEnrolling(true);

    try {
      if (isEnrolled) {
        const res = await unenrollUserFromCourse(user?.id || null, course.id, {
          accessToken: session?.access_token,
        });
        if (!res.success) {
          throw new Error(res.error || "Failed to unenroll from course.");
        }
        setIsEnrolled(false);
        setCourse((prev) =>
          prev
            ? { ...prev, enrolledCount: Math.max(0, (prev.enrolledCount || 1) - 1) }
            : null
        );
        setToastIcon("info");
        setToastMessage(`Unenrolled from "${course.title}".`);
        setIsToastOpen(true);
      } else {
        const res = await enrollUserInCourse(user?.id || null, course.id, {
          accessToken: session?.access_token,
        });
        if (!res.success) {
          throw new Error(res.error || "Failed to enroll in course.");
        }
        setIsEnrolled(true);
        setCourse((prev) =>
          prev
            ? { ...prev, enrolledCount: (prev.enrolledCount || 0) + 1 }
            : null
        );
        setToastIcon("check_circle");
        setToastMessage(`Enrolled in "${course.title}".`);
        setIsToastOpen(true);
      }
    } catch (err: unknown) {
      setToastIcon("error");
      setToastMessage(err instanceof Error ? err.message : "Failed to update enrollment.");
      setIsToastOpen(true);
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!course || !user?.id) {
      setToastIcon("info");
      setToastMessage("Please sign in to save bookmarks.");
      setIsToastOpen(true);
      return;
    }

    try {
      if (isBookmarked && bookmarkId) {
        await removeBookmark(bookmarkId, user.id);
        setIsBookmarked(false);
        setBookmarkId(null);
        setToastIcon("bookmark_remove");
        setToastMessage("Curriculum removed from saved bookmarks.");
        setIsToastOpen(true);
      } else {
        const addedId = await addBookmark(
          {
            pathId: course.id,
            title: course.title,
            type: "path",
            source: course.authorUserId ? "Community" : "Verified Academic",
            category: "path",
            description: course.description,
          },
          user.id
        );
        if (addedId) {
          setIsBookmarked(true);
          setBookmarkId(addedId);
          setToastIcon("bookmark_added");
          setToastMessage("Curriculum saved to bookmarks.");
          setIsToastOpen(true);
        }
      }
    } catch (err: unknown) {
      setToastIcon("error");
      setToastMessage(err instanceof Error ? err.message : "Failed to update bookmark.");
      setIsToastOpen(true);
    }
  };

  const toggleModule = (id: string) => {
    setOpenModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = () => {
    if (!course?.modules) return;
    const areAllOpen = course.modules.every((m) => openModules[m.id]);
    const nextState: Record<string, boolean> = {};
    course.modules.forEach((m) => {
      nextState[m.id] = !areAllOpen;
    });
    setOpenModules(nextState);
  };

  const isOwner = Boolean(user && course?.authorUserId && course.authorUserId === user.id);
  const isAdmin = Boolean(
    profile?.tier?.toLowerCase() === "admin" ||
    (user?.app_metadata as Record<string, unknown> | undefined)?.role === "admin"
  );
  // Only the author or a system administrator can delete a course
  const canDelete = isOwner || isAdmin;

  const handleDeleteConfirm = async () => {
    if (!course) return;
    setIsDeleting(true);

    try {
      const res = await deleteLearningPath(course.id, {
        accessToken: session?.access_token,
      });

      if (res.success) {
        setToastIcon("check_circle");
        setToastMessage(`Curriculum "${course.title}" was permanently deleted.`);
        setIsToastOpen(true);
        setIsDeleteModalOpen(false);
        setTimeout(() => {
          router.push("/courses");
        }, 1200);
      } else {
        setToastIcon("error");
        setToastMessage(res.error || "Failed to delete course.");
        setIsToastOpen(true);
        setIsDeleting(false);
      }
    } catch (err: unknown) {
      setToastIcon("error");
      setToastMessage(err instanceof Error ? err.message : "Error deleting course.");
      setIsToastOpen(true);
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-space-xl pb-space-xl max-w-5xl mx-auto animate-pulse">
        <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-surface-container-high/60 space-y-4">
          <div className="h-4 bg-surface-container rounded w-48"></div>
          <div className="h-9 bg-surface-container rounded w-3/4"></div>
          <div className="h-4 bg-surface-container-low rounded w-full"></div>
          <div className="h-4 bg-surface-container-low rounded w-2/3"></div>
          <div className="h-10 bg-surface-container-low rounded w-64 mt-6"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-surface-container-lowest rounded-xl border border-surface-container-high/60"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-4xl mx-auto py-space-xl">
        <EmptyState
          title="Curriculum Not Found"
          description={
            error ||
            `The requested curriculum (${courseId}) is not yet available in the catalog.`
          }
          actionText="Browse Available Paths"
          actionHref="/explore"
        />
      </div>
    );
  }

  const progressPercent = course.progressPercent ?? 0;
  const firstModule = course.modules?.[0];
  const firstLesson = firstModule?.lessons?.[0];
  const resumeHref = firstLesson
    ? `/learn/${course.id}/${firstLesson.id}`
    : `/learn/${course.id}/lesson-1-1`;

  return (
    <div className="flex flex-col gap-space-xl pb-space-xl max-w-5xl mx-auto">
      {/* 1. Course Header Section */}
      <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high/60">
        <div className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-space-xs">
          <Link href="/explore" className="hover:text-primary transition-colors">
            Courses
          </Link>
          <span>/</span>
          <span className="text-secondary font-semibold">{course.domain}</span>
          <span>/</span>
          <span>{course.level}</span>
        </div>

        <h1 className="font-display-lg text-display-lg text-primary tracking-tight font-serif mt-1">
          {course.title}
        </h1>

        <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
          {course.description}
        </p>

        {/* Progress summary */}
        <div className="mt-space-lg pt-space-md border-t border-surface-container-high/40">
          <div className="flex items-center justify-between font-label-sm text-label-sm mb-2">
            <span className="font-semibold text-primary">Mastery Progress</span>
            <span className="text-on-surface-variant">
              {progressPercent}% Completed · {course.moduleCount} Modules Indexed
            </span>
          </div>
          <div className="w-full h-2.5 bg-surface-variant rounded-full overflow-hidden flex">
            <div
              className="bg-primary h-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action Launch Bar */}
        <div className="flex flex-wrap items-center justify-between gap-space-md mt-space-lg pt-space-sm">
          <div className="flex items-center gap-3">
            <Link
              href={resumeHref}
              className="bg-primary text-on-primary hover:bg-primary-container px-space-md py-2.5 rounded-lg font-label-lg text-label-lg transition-all shadow-sm flex items-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">play_circle</span>
              <span>
                {firstLesson ? `Start Learning: ${firstLesson.title}` : "Begin Curriculum"}
              </span>
            </Link>

            <button
              type="button"
              onClick={handleToggleEnroll}
              disabled={isEnrolling}
              className={`px-space-md py-2.5 rounded-lg font-label-lg text-label-lg transition-colors flex items-center gap-1.5 border ${
                isEnrolled
                  ? "bg-secondary/10 border-secondary text-secondary hover:bg-secondary/20 font-semibold"
                  : "bg-surface-container-lowest border-surface-container-high text-primary hover:bg-surface-container"
              } ${isEnrolling ? "opacity-60 cursor-not-allowed" : "active:scale-95"}`}
            >
              <span className={`material-symbols-outlined text-lg ${isEnrolling ? "animate-spin" : ""}`}>
                {isEnrolling
                  ? "progress_activity"
                  : isEnrolled
                  ? "check_circle"
                  : "add_circle_outline"}
              </span>
              <span>
                {isEnrolling
                  ? isEnrolled
                    ? "Unenrolling..."
                    : "Enrolling..."
                  : isEnrolled
                  ? "Enrolled"
                  : "Enroll in Course"}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`p-2 rounded-lg transition-colors border ${
                isBookmarked
                  ? "bg-secondary/10 border-secondary text-secondary"
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-container border-surface-container-high/60"
              }`}
              title={isBookmarked ? "Remove Bookmark" : "Bookmark Course"}
            >
              <span className="material-symbols-outlined text-xl">
                {isBookmarked ? "bookmark" : "bookmark_border"}
              </span>
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-3 py-2 text-error hover:bg-error-container/20 border border-error/30 rounded-lg transition-colors flex items-center gap-1.5 font-label-md text-label-md font-semibold active:scale-95"
                title="Delete Course Track"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
                <span className="hidden sm:inline">Delete Course</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Pedagogical Statement & Visual Spark */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-space-md items-stretch">
        <div className="md:col-span-2 bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container-high/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm tracking-wider uppercase mb-1 font-semibold">
              <span className="material-symbols-outlined text-sm text-secondary">verified_user</span>
              <span>Curator&apos;s Syllabus Note</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface leading-relaxed mt-2">
              {course.syllabusNote ||
                course.description ||
                "Comprehensive university-level academic syllabus with verified course structure and modular milestones."}
            </p>
          </div>
          <div className="flex items-center gap-space-md pt-space-sm mt-space-sm border-t border-surface-container-low text-on-surface-variant font-label-sm text-label-sm">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {course.durationHours ? `~${course.durationHours} Hours Dedicated Rigor` : `${course.moduleCount} Modules`}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              {course.enrolledCount ? `${course.enrolledCount.toLocaleString()} Scholars Enrolled` : "Active Academic Syllabus"}
            </span>
          </div>
        </div>

        {/* Weekly Target Sprint Card */}
        <div className="bg-primary text-on-primary rounded-xl p-space-md flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div className="absolute -right-6 -bottom-6 opacity-10 text-on-primary pointer-events-none">
            <span className="material-symbols-outlined text-9xl">functions</span>
          </div>
          <div className="relative z-10">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-fixed font-semibold">
              Weekly Target
            </span>
            <h3 className="font-headline-md text-headline-md mt-1 font-serif">
              {course.weeklyCheckpoint?.title || (firstModule ? `${firstModule.title} Checkpoint` : "Curriculum Milestone")}
            </h3>
            <p className="font-body-sm text-body-sm text-primary-fixed-dim mt-1">
              {course.weeklyCheckpoint?.description || "Structured academic milestone and verified conceptual review."}
            </p>
          </div>
          <div className="relative z-10 pt-space-md">
            <div className="flex justify-between items-end mb-1 text-on-primary font-label-sm text-label-sm">
              <span>Sprint Target</span>
              <span className="font-bold">
                {progressPercent > 0 ? `${progressPercent}%` : "In Progress"}
              </span>
            </div>
            <div className="w-full h-1.5 bg-primary-container rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary-fixed"
                style={{ width: `${progressPercent > 0 ? progressPercent : 15}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Structured Curriculum Tree / Modules */}
      <section className="space-y-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <h3 className="font-headline-md text-headline-md text-primary font-serif">
              Syllabus Breakdown
            </h3>
            <span className="text-on-surface-variant font-label-md text-label-md">
              {course.modules?.length || 0} Modules
            </span>
          </div>
          {course.modules && course.modules.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className="text-primary hover:text-primary-container font-label-md text-label-md font-semibold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-base">unfold_more</span>
              <span>Toggle All Modules</span>
            </button>
          )}
        </div>

        {/* Modules Accordion */}
        {(!course.modules || course.modules.length === 0) && (
          <div className="bg-surface-container-lowest rounded-xl p-space-lg text-center border border-surface-container-high/60 text-on-surface-variant">
            No modules currently published for this curriculum track.
          </div>
        )}

        <div className="space-y-space-sm">
          {course.modules?.map((module) => {
            const isOpen = !!openModules[module.id];
            const isCompleted = module.status === "completed";
            const isInProgress = module.status === "in_progress";

            return (
              <div
                key={module.id}
                className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-surface-container-high/60 transition-all"
              >
                {/* Module Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleModule(module.id)}
                  className="w-full p-space-md flex items-center justify-between text-left hover:bg-surface-container-low transition-colors"
                >
                  <div className="flex items-center gap-space-md min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? "bg-surface-container text-primary"
                          : isInProgress
                          ? "bg-primary-container text-on-primary"
                          : "bg-surface-container-low text-outline-variant"
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {isCompleted ? "check_circle" : isInProgress ? "play_arrow" : "lock"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                          Module {module.moduleNumber.toString().padStart(2, "0")}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-label-sm text-label-sm font-medium ${
                            isCompleted
                              ? "bg-surface-container text-primary"
                              : isInProgress
                              ? "bg-secondary-container/40 text-on-secondary-container font-semibold"
                              : "bg-surface-container text-on-surface-variant"
                          }`}
                        >
                          {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Locked"}
                        </span>
                      </div>
                      <h4 className="font-headline-sm text-headline-sm text-primary truncate mt-0.5 font-sans">
                        {module.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-space-md shrink-0">
                    <span className="hidden sm:inline font-label-md text-label-md text-on-surface-variant">
                      {module.lessons?.length || module.totalResources} Resources
                    </span>
                    <span
                      className={`material-symbols-outlined text-on-surface-variant transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  </div>
                </button>

                {/* Collapsible Content */}
                {isOpen && (
                  <div className="px-space-md pb-space-md pt-space-xs space-y-2 border-t border-surface-container-high/40">
                    {module.lessons?.map((lesson, idx) => {
                      const isLessonActive = idx === 0 && isInProgress;
                      return (
                        <div
                          key={lesson.id}
                          className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                            isLessonActive
                              ? "bg-primary-container/10 border border-primary/30"
                              : "bg-surface-container-low hover:bg-surface-container border border-surface-container-high/30"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {lesson.thumbnailUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={lesson.thumbnailUrl}
                                alt={lesson.title}
                                className="w-14 h-9 object-cover rounded shrink-0 border border-surface-container-high/60"
                              />
                            ) : (
                              <span
                                className={`material-symbols-outlined text-base ${
                                  lesson.isCompleted ? "text-primary" : isLessonActive ? "text-secondary font-bold" : "text-on-surface-variant"
                                }`}
                              >
                                {lesson.type === "video"
                                  ? "play_lesson"
                                  : lesson.type === "quiz"
                                  ? "quiz"
                                  : lesson.type === "practice"
                                  ? "edit_note"
                                  : "menu_book"}
                              </span>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-semibold px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant">
                                  #{lesson.sequenceNumber ?? idx + 1}
                                </span>
                                {lesson.roleInSequence && (
                                  <span className="font-label-sm text-xs font-medium px-2 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container capitalize">
                                    {lesson.roleInSequence.replace(/_/g, " ")}
                                  </span>
                                )}
                                {lesson.qualityScore && (
                                  <span className="font-label-sm text-xs font-semibold px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                                    {lesson.qualityScore}% Quality
                                  </span>
                                )}
                                {lesson.discoverySource === 'curated_directory' && (
                                  <span className="font-label-sm text-xs font-semibold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5">
                                    <span className="material-symbols-outlined text-[10px]">verified</span>
                                    Verified Educator
                                  </span>
                                )}
                                {lesson.studyNotes && lesson.studyNotes.length > 0 && (
                                  <span className="font-label-sm text-xs font-semibold px-1.5 py-0.2 rounded bg-secondary-container/30 text-on-secondary-container flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">description</span>
                                    {lesson.studyNotes.length} Note{lesson.studyNotes.length > 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>
                              <p
                                className={`font-label-lg text-label-lg truncate mt-0.5 ${
                                  isLessonActive ? "text-primary font-bold" : "text-primary"
                                }`}
                              >
                                {lesson.title}
                              </p>
                              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                                {lesson.sourceName} · {lesson.durationMinutes} mins
                                {lesson.positionReason ? ` · ${lesson.positionReason}` : ""}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <Link
                              href={`/learn/${course.id}/${lesson.id}`}
                              className={`px-3 py-1 rounded text-xs font-label-sm font-semibold transition-colors ${
                                lesson.type === "quiz"
                                  ? "bg-secondary text-on-secondary hover:bg-secondary-container"
                                  : "bg-primary text-on-primary hover:bg-primary-container"
                              }`}
                            >
                              {isCompleted ? "Review" : lesson.type === "quiz" ? "Assess" : "Study"}
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {course && (
        <DeleteCourseModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          courseTitle={course.title}
          courseId={course.id}
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
  );
}

