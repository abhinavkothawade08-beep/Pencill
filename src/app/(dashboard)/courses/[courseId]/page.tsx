"use client";

import { useState, useEffect, useCallback } from "react";
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
import { storageAdapter } from "@/lib/storage/storageAdapter";
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

  const [course, setCourse] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);

  // Completed lesson IDs
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);

  // Interactive Quiz Modal State
  const [activeQuizModule, setActiveQuizModule] = useState<any | null>(null);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Interactive Flashcard Modal State
  const [activeFlashcardModule, setActiveFlashcardModule] = useState<any | null>(null);
  const [activeFlashcardIdx, setActiveFlashcardIdx] = useState(0);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false);
  const [flashcardMastered, setFlashcardMastered] = useState<Record<string, boolean>>({});

  // Deletion state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastIcon, setToastIcon] = useState("check_circle");
  const [isToastOpen, setIsToastOpen] = useState(false);

  // Accordion state for modules
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  // 1. Load course from Supabase or storageAdapter fallback
  const loadCourseData = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);

    try {
      let data: any = null;
      try {
        data = await getLearningPathById(courseId);
      } catch (err) {
        console.warn("[CourseDetails] Supabase load failed, falling back to storageAdapter:", err);
      }

      if (!data) {
        data = await storageAdapter.getSavedPathById(courseId);
      }

      if (!data) {
        setError(`The requested curriculum (${courseId}) was not found in local or remote store.`);
        return;
      }

      setCourse(data);

      // Initialize accordion
      if (data?.modules && data.modules.length > 0) {
        const initial: Record<string, boolean> = {};
        data.modules.forEach((m: any, idx: number) => {
          initial[m.id] = idx === 0;
        });
        setOpenModules(initial);
      }

      // Check progress in storageAdapter
      const prog = await storageAdapter.getProgress(courseId);
      if (prog && prog.completedLessonIds) {
        setCompletedLessonIds(prog.completedLessonIds);
      }
    } catch (err: any) {
      console.error("[CourseDetails] Error loading course:", err);
      setError("Unable to load course syllabus.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  // 2. Check enrollment and bookmarks
  useEffect(() => {
    if (!courseId) return;

    // Enrollment check
    isUserEnrolled(user?.id || null, courseId, { accessToken: session?.access_token })
      .then((enrolled) => {
        setIsEnrolled(enrolled);
      })
      .catch(async () => {
        // Fallback: check storageAdapter progress
        const prog = await storageAdapter.getProgress(courseId);
        if (prog) setIsEnrolled(true);
      });

    // Bookmark check
    if (user?.id) {
      getUserBookmarks(user.id)
        .then((bmarks) => {
          const match = bmarks.find((b) => b.pathId === courseId);
          if (match) {
            setIsBookmarked(true);
            setBookmarkId(match.id);
          } else {
            setIsBookmarked(false);
            setBookmarkId(null);
          }
        })
        .catch(async () => {
          const localBmarks = await storageAdapter.getBookmarks();
          const match = localBmarks.find((b) => b.pathId === courseId || b.id === `bm-${courseId}`);
          setIsBookmarked(!!match);
        });
    } else {
      storageAdapter.getBookmarks().then((localBmarks) => {
        const match = localBmarks.find((b) => b.pathId === courseId || b.id === `bm-${courseId}`);
        setIsBookmarked(!!match);
      });
    }
  }, [courseId, user?.id, session?.access_token]);

  // Toggle lesson complete
  const handleToggleLessonComplete = async (lessonId: string) => {
    if (!course) return;

    const nextCompleted = completedLessonIds.includes(lessonId)
      ? completedLessonIds.filter((id) => id !== lessonId)
      : [...completedLessonIds, lessonId];

    setCompletedLessonIds(nextCompleted);

    // Update storageAdapter progress
    const totalLessons = course.modules?.reduce(
      (sum: number, m: any) => sum + (m.lessons?.length || m.resources?.length || 0),
      0
    ) || 1;
    const progressPercent = Math.min(100, Math.round((nextCompleted.length / totalLessons) * 100));

    await storageAdapter.updateProgress(course.id, {
      completedLessonIds: nextCompleted,
      hoursLogged: Math.round((nextCompleted.length * (course.durationHours || 20)) / totalLessons),
    });

    setToastIcon("check_circle");
    setToastMessage(
      nextCompleted.includes(lessonId)
        ? `Lesson marked complete (${progressPercent}% track progress)`
        : "Lesson marked incomplete"
    );
    setIsToastOpen(true);
  };

  const handleToggleEnroll = async () => {
    if (!course || isEnrolling) return;
    setIsEnrolling(true);

    try {
      if (isEnrolled) {
        if (user?.id) {
          try {
            await unenrollUserFromCourse(user.id, course.id, {
              accessToken: session?.access_token,
            });
          } catch {}
        }
        setIsEnrolled(false);
        setCourse((prev: any) =>
          prev
            ? { ...prev, enrolledCount: Math.max(0, (prev.enrolledCount || 1) - 1) }
            : null
        );
        setToastIcon("info");
        setToastMessage(`Unenrolled from "${course.title}".`);
        setIsToastOpen(true);
      } else {
        if (user?.id) {
          try {
            await enrollUserInCourse(user.id, course.id, {
              accessToken: session?.access_token,
            });
          } catch {}
        }
        await storageAdapter.updateProgress(course.id, {
          completedLessonIds: [],
          hoursLogged: 0,
          quizScores: {},
          flashcardState: {},
        });
        setIsEnrolled(true);
        setCourse((prev: any) =>
          prev ? { ...prev, enrolledCount: (prev.enrolledCount || 0) + 1 } : null
        );
        setToastIcon("check_circle");
        setToastMessage(`Enrolled in "${course.title}".`);
        setIsToastOpen(true);
      }
    } catch (err: any) {
      setToastIcon("error");
      setToastMessage(err.message || "Failed to update enrollment.");
      setIsToastOpen(true);
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!course) return;

    try {
      if (isBookmarked) {
        if (bookmarkId && user?.id) {
          try {
            await removeBookmark(bookmarkId, user.id);
          } catch {}
        }
        await storageAdapter.removeBookmark(`bm-${course.id}`);
        await storageAdapter.removeBookmark(course.id);
        setIsBookmarked(false);
        setBookmarkId(null);
        setToastIcon("bookmark_remove");
        setToastMessage("Curriculum removed from saved bookmarks.");
        setIsToastOpen(true);
      } else {
        let addedId: string | undefined;
        if (user?.id) {
          try {
            const res = await addBookmark(
              {
                pathId: course.id,
                title: course.title,
                type: "path",
                category: "path",
                source: "Pencill",
                description: course.description || "Learning pathway",
              },
              user.id
            );
            addedId = res ?? undefined;
          } catch {}
        }
        await storageAdapter.addBookmark({
          type: "path",
          title: course.title,
          pathId: course.id,
          source: "Pencill Verified Track",
        });
        setIsBookmarked(true);
        setBookmarkId(addedId || `bm-${course.id}`);
        setToastIcon("bookmark");
        setToastMessage("Curriculum added to your bookmarks.");
        setIsToastOpen(true);
      }
    } catch (err: any) {
      setToastIcon("error");
      setToastMessage(err.message || "Failed to update bookmarks.");
      setIsToastOpen(true);
    }
  };

  // Export JSON handler
  const handleExportJson = () => {
    if (!course) return;
    const cleanFilename = `${(course.title || "curriculum").replace(/[^a-zA-Z0-9]/g, "_")}.json`;
    const blob = new Blob([JSON.stringify(course, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = cleanFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastIcon("download");
    setToastMessage(`Exported "${cleanFilename}" to your downloads.`);
    setIsToastOpen(true);
  };

  // Print syllabus handler
  const handlePrintSyllabus = () => {
    window.print();
  };

  const toggleModule = (id: string) => {
    setOpenModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = () => {
    if (!course?.modules) return;
    const areAllOpen = course.modules.every((m: any) => openModules[m.id]);
    const nextState: Record<string, boolean> = {};
    course.modules.forEach((m: any) => {
      nextState[m.id] = !areAllOpen;
    });
    setOpenModules(nextState);
  };

  const isOwner = Boolean(user && course?.authorUserId && course.authorUserId === user.id);
  const isAdmin = Boolean(
    profile?.tier?.toLowerCase() === "admin" ||
      (user?.app_metadata as Record<string, unknown> | undefined)?.role === "admin"
  );
  const canDelete = isOwner || isAdmin || !course?.authorUserId;

  const handleDeleteConfirm = async () => {
    if (!course) return;
    setIsDeleting(true);

    try {
      // 1. Delete and unenroll via pathService helper
      await deleteLearningPath(course.id, {
        accessToken: session?.access_token,
        userId: user?.id || null,
      });

      // 2. Explicitly ensure unenrollment
      await unenrollUserFromCourse(user?.id || null, course.id, {
        accessToken: session?.access_token,
      });

      // 3. Remove from storageAdapter
      await storageAdapter.deletePath(course.id);

      setToastIcon("check_circle");
      setToastMessage(`Curriculum "${course.title}" was permanently deleted.`);
      setIsToastOpen(true);
      setIsDeleteModalOpen(false);
      setTimeout(() => {
        router.push("/courses");
      }, 1200);
    } catch (err: any) {
      setToastIcon("error");
      setToastMessage(err.message || "Error deleting course.");
      setIsToastOpen(true);
      setIsDeleting(false);
    }
  };

  // Checkpoint Quiz submission
  const handleQuizOptionSelect = (qIdx: number, optionIdx: number) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [qIdx]: optionIdx }));
  };

  const handleQuizSubmit = async () => {
    if (!activeQuizModule) return;
    const questions = activeQuizModule.checkpointQuestions || [];
    let correct = 0;
    questions.forEach((q: any, idx: number) => {
      const targetIndex = typeof q.correctOptionIndex === 'number'
        ? q.correctOptionIndex
        : (q.correctOptionId ? (q.correctOptionId.charCodeAt(0) - 65) : 0);
      if (quizAnswers[idx] === targetIndex) {
        correct++;
      }
    });
    const scorePct = Math.round((correct / Math.max(1, questions.length)) * 100);
    setQuizScore(scorePct);
    setQuizSubmitted(true);

    // Save quiz score in storageAdapter
    const existingProg = (await storageAdapter.getProgress(course.id)) || {
      completedLessonIds: [],
      hoursLogged: 0,
      quizScores: {},
      flashcardState: {},
    };
    await storageAdapter.updateProgress(course.id, {
      quizScores: {
        ...(existingProg.quizScores || {}),
        [activeQuizModule.id]: scorePct,
      },
    });
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

  const allLessons =
    course.modules?.flatMap((m: any) => m.lessons || m.resources || []) || [];
  const totalLessonsCount = allLessons.length;
  const completedCount = completedLessonIds.length;
  const progressPercent =
    totalLessonsCount > 0
      ? Math.min(100, Math.round((completedCount / totalLessonsCount) * 100))
      : course.progressPercent ?? 0;

  const firstModule = course.modules?.[0];
  const firstLesson = firstModule?.lessons?.[0] || firstModule?.resources?.[0];

  return (
    <div className="flex flex-col gap-space-xl pb-space-xl max-w-5xl mx-auto print:max-w-none print:p-0">
      {/* 1. Course Header Section */}
      <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-high/60 print:border-none print:shadow-none print:p-0 relative overflow-hidden">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-space-xs text-on-surface-variant font-label-md text-label-md mb-space-sm print:hidden">
          <Link href="/courses" className="hover:text-primary transition-colors">
            My Courses
          </Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary font-semibold">{course.title}</span>
          <span className="mx-space-xs text-outline-variant">•</span>
          <span className="bg-secondary-container/50 text-on-secondary-fixed-variant px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold">
            Curated Pathway
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-space-sm">
          <div>
            <h1 className="font-display-lg text-display-lg text-primary tracking-tight font-serif">
              {course.title}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1 leading-relaxed max-w-3xl">
              {course.level || "Class 11"} · {course.language || "English Medium"} · {course.description || "Rigorous academic pathway curated from verified open access repositories."}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container text-primary font-label-sm text-label-sm font-semibold self-start md:self-auto shrink-0 print:hidden">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            Advanced Syllabus
          </span>
        </div>

        {/* Academic Metadata Array */}
        <div className="flex flex-wrap items-center gap-space-sm mt-space-md pt-space-md border-t border-surface-container-low print:hidden">
          <div className="flex items-center gap-1.5 text-on-surface font-label-md text-label-md bg-surface-container-low px-2.5 py-1 rounded">
            <span className="material-symbols-outlined text-base text-on-surface-variant">auto_stories</span>
            <span>{totalLessonsCount} Resources</span>
          </div>
          <div className="flex items-center gap-1.5 text-on-surface font-label-md text-label-md bg-surface-container-low px-2.5 py-1 rounded">
            <span className="material-symbols-outlined text-base text-on-surface-variant">category</span>
            <span>{course.modules?.length || 4} Core Modules</span>
          </div>
          <div className="flex items-center gap-1.5 text-on-surface font-label-md text-label-md bg-surface-container-low px-2.5 py-1 rounded">
            <span className="material-symbols-outlined text-base text-on-surface-variant">schedule</span>
            <span>{course.durationHours || 18} Hours Total</span>
          </div>
          <div className="flex items-center gap-1.5 text-on-secondary-fixed-variant font-label-md text-label-md bg-secondary-fixed/40 px-2.5 py-1 rounded">
            <span className="material-symbols-outlined text-base">psychology</span>
            <span>Prerequisites: {course.domain || "Standard Syllabus"}</span>
          </div>
        </div>

        {/* Course Progress Ribbon */}
        <div className="mt-space-lg bg-surface-container-low p-space-md rounded-lg border border-surface-container-high/40 print:hidden">
          <div className="flex items-center justify-between font-label-md text-label-md mb-2">
            <span className="text-on-surface font-semibold">Curriculum Progression</span>
            <span className="text-primary font-bold">
              {progressPercent}% Complete <span className="font-normal text-on-surface-variant">({completedCount} of {totalLessonsCount} items)</span>
            </span>
          </div>
          <div className="w-full h-2.5 bg-surface-variant rounded-full overflow-hidden flex">
            <div
              className="bg-primary h-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Quick Launch Bar */}
        <div className="flex flex-wrap items-center justify-between gap-space-md mt-space-lg pt-space-sm print:hidden">
          <div className="flex flex-wrap items-center gap-3">
            {firstLesson && (
              <Link
                href={`/learn/${course.id}/${firstLesson.id}`}
                className="bg-primary text-on-primary hover:bg-primary-container px-space-md py-2.5 rounded-lg font-label-lg text-label-lg transition-all shadow-sm flex items-center gap-2 active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">play_circle</span>
                <span>Resume Next: {firstLesson.title}</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleToggleEnroll}
              disabled={isEnrolling}
              className={`px-space-md py-2.5 rounded-lg font-label-md text-label-md font-semibold transition-all border flex items-center gap-1.5 ${
                isEnrolled
                  ? "bg-surface-container text-on-surface hover:bg-error-container hover:text-on-error-container border-surface-container-high"
                  : "bg-surface-container-low text-primary hover:bg-surface-container border-surface-container-high/60"
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {isEnrolled ? "check" : "add"}
              </span>
              <span>{isEnrolled ? "Enrolled" : "Enroll Free"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintSyllabus}
              className="bg-surface-container-lowest text-primary hover:bg-surface-container px-space-md py-2.5 rounded-lg font-label-lg text-label-lg transition-colors flex items-center gap-1.5 border border-surface-container-high/60"
            >
              <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
              <span>Syllabus (Print/PDF)</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="bg-surface-container-lowest text-primary hover:bg-surface-container px-space-md py-2.5 rounded-lg font-label-lg text-label-lg transition-colors flex items-center gap-1.5 border border-surface-container-high/60"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              <span>JSON</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`p-2.5 rounded-lg border transition-colors flex items-center justify-center ${
                isBookmarked
                  ? "bg-secondary-container/40 text-secondary border-secondary/30"
                  : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant border-surface-container-high/60"
              }`}
              title={isBookmarked ? "Remove Bookmark" : "Save Bookmark"}
            >
              <span className="material-symbols-outlined text-xl">
                {isBookmarked ? "bookmark_added" : "bookmark_border"}
              </span>
            </button>

            {canDelete && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-error hover:bg-error/10 px-3 py-2 rounded-lg font-label-md text-label-md transition-colors flex items-center gap-1.5 border border-transparent hover:border-error/20"
                title="Delete Course Track"
              >
                <span className="material-symbols-outlined text-base">delete</span>
                <span className="hidden sm:inline">Delete Track</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Pedagogical Statement & Visual Spark Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-space-md items-stretch print:hidden">
        <div className="md:col-span-2 bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container-high/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm tracking-wider uppercase mb-1 font-semibold">
              <span className="material-symbols-outlined text-sm text-secondary">verified_user</span>
              <span>Curator&apos;s Syllabus Note</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface leading-relaxed">
              A structured mastery pathway spanning analytical theory, rigorous concept mapping, and graded practice problem sets. Designed for deep conceptual intuition, moving deliberately from intuitive physical models to calculus-based derivations.
            </p>
          </div>
          <div className="flex items-center gap-space-md pt-space-sm mt-space-sm border-t border-surface-container-low text-on-surface-variant font-label-sm text-label-sm">
            <span className="flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> {totalLessonsCount} Verified Resources
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Continuous Diagnostic Checkpoints
            </span>
          </div>
        </div>

        <div className="bg-primary text-on-primary rounded-xl p-space-md flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div className="absolute -right-6 -bottom-6 opacity-10 text-on-primary pointer-events-none">
            <span className="material-symbols-outlined text-9xl">functions</span>
          </div>
          <div className="relative z-10">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-fixed font-semibold">Weekly Target</span>
            <h3 className="font-headline-md text-headline-md mt-1 font-serif">Curriculum Sprint</h3>
            <p className="font-body-sm text-body-sm text-primary-fixed-dim mt-1">Projected mastery checkpoint this week.</p>
          </div>
          <div className="relative z-10 pt-space-md">
            <div className="flex justify-between items-end mb-1 text-on-primary font-label-sm text-label-sm">
              <span>Target Completion</span>
              <span className="font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-primary-container rounded-full overflow-hidden">
              <div className="h-full bg-secondary-fixed transition-all" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Structured Curriculum Tree / Modules */}
      <section className="space-y-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <h3 className="font-headline-md text-headline-md text-primary font-serif">
              Syllabus Breakdown
            </h3>
            <span className="text-on-surface-variant font-label-md text-label-md">
              {course.modules?.length || 0} Modules · {course.durationHours ? `~${course.durationHours}h Total` : ""}
            </span>
          </div>
          {course.modules && course.modules.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className="text-primary hover:text-primary-container font-label-md text-label-md font-semibold flex items-center gap-1 print:hidden"
            >
              <span className="material-symbols-outlined text-base">unfold_more</span>
              <span>Toggle All Modules</span>
            </button>
          )}
        </div>

        {/* Modules Accordion */}
        <div className="space-y-space-sm">
          {course.modules?.map((module: any, mIdx: number) => {
            const isOpen = !!openModules[module.id];
            const resources = module.lessons || module.resources || [];
            const moduleCompleted =
              resources.length > 0 &&
              resources.every((r: any) => completedLessonIds.includes(r.id));

            return (
              <div
                key={module.id || mIdx}
                className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-surface-container-high/60 transition-all print:border-b print:shadow-none"
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
                        moduleCompleted
                          ? "bg-surface-container text-primary"
                          : "bg-primary-container text-on-primary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {moduleCompleted ? "check_circle" : "menu_book"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                          Module {(mIdx + 1).toString().padStart(2, "0")}
                        </span>
                        {module.checkpointQuestions?.length > 0 && (
                          <span className="px-2 py-0.5 rounded font-label-sm text-xs font-semibold bg-secondary-container/40 text-on-secondary-container">
                            Quiz Ready
                          </span>
                        )}
                        {module.flashcards?.length > 0 && (
                          <span className="px-2 py-0.5 rounded font-label-sm text-xs font-semibold bg-primary/10 text-primary">
                            Formula Deck
                          </span>
                        )}
                      </div>
                      <h4 className="font-headline-sm text-headline-sm text-primary truncate mt-0.5 font-sans">
                        {module.title}
                      </h4>
                      {module.objective && (
                        <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">
                          {module.objective}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-space-md shrink-0">
                    <span className="hidden sm:inline font-label-md text-label-md text-on-surface-variant">
                      {resources.length} Resources
                    </span>
                    <span
                      className={`material-symbols-outlined text-on-surface-variant transition-transform duration-200 print:hidden ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  </div>
                </button>

                {/* Collapsible Content */}
                {(isOpen || typeof window === "undefined") && (
                  <div className="px-space-md pb-space-md pt-space-xs space-y-2 border-t border-surface-container-high/40">
                    {/* Module Interactive Runners Strip */}
                    <div className="flex flex-wrap items-center gap-2 py-1 mb-2 print:hidden">
                      {module.checkpointQuestions?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveQuizModule(module);
                            setActiveQuestionIdx(0);
                            setQuizAnswers({});
                            setQuizSubmitted(false);
                            setQuizScore(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary hover:bg-secondary-container text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                        >
                          <span className="material-symbols-outlined text-sm">quiz</span>
                          <span>Take Checkpoint Quiz ({module.checkpointQuestions.length} Qs)</span>
                        </button>
                      )}

                      {module.flashcards?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveFlashcardModule(module);
                            setActiveFlashcardIdx(0);
                            setIsFlashcardFlipped(false);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-surface-container text-primary hover:bg-surface-container-high text-xs font-semibold border border-surface-container-high/60 flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-sm">style</span>
                          <span>Review Flashcards ({module.flashcards.length} Cards)</span>
                        </button>
                      )}
                    </div>

                    {/* Resources list */}
                    {resources.map((item: any, idx: number) => {
                      const isDone = completedLessonIds.includes(item.id);
                      const status = item.verificationStatus || item.status || "verified";

                      return (
                        <div
                          key={item.id || idx}
                          className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                            isDone
                              ? "bg-surface-container-low/60 border border-surface-container-high/30 opacity-75"
                              : "bg-surface-container-low hover:bg-surface-container border border-surface-container-high/40"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Complete Checkbox */}
                            <button
                              type="button"
                              onClick={() => handleToggleLessonComplete(item.id)}
                              className="text-on-surface-variant hover:text-primary shrink-0 transition-colors"
                              title={isDone ? "Mark incomplete" : "Mark complete"}
                            >
                              <span
                                className={`material-symbols-outlined text-xl ${
                                  isDone ? "text-primary font-bold" : "text-outline-variant"
                                }`}
                              >
                                {isDone ? "check_circle" : "radio_button_unchecked"}
                              </span>
                            </button>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap text-xs">
                                <span className="font-mono font-semibold px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant">
                                  #{idx + 1}
                                </span>

                                {/* Status Badge */}
                                <span
                                  className={`px-1.5 py-0.2 rounded font-semibold text-[11px] uppercase ${
                                    status === "verified"
                                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                                      : status === "provisional"
                                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                                      : "bg-surface-container text-on-surface-variant border border-surface-container-high"
                                  }`}
                                >
                                  {status}
                                </span>

                                {/* Source Repository Tag */}
                                <span className="font-semibold text-primary/80 bg-primary/10 px-1.5 py-0.2 rounded">
                                  {item.sourceName || "Academic Repo"}
                                </span>

                                {/* Language tag */}
                                {item.language && (
                                  <span className="font-mono text-xs px-1 rounded bg-surface-container text-on-surface-variant uppercase">
                                    {item.language}
                                  </span>
                                )}

                                {item.durationMinutes && (
                                  <span className="text-on-surface-variant">
                                    {item.durationMinutes}m
                                  </span>
                                )}
                              </div>

                              <Link
                                href={`/learn/${course.id}/${item.id}`}
                                className={`font-label-lg text-label-lg truncate mt-0.5 block hover:underline ${
                                  isDone ? "line-through text-on-surface-variant" : "text-primary font-medium"
                                }`}
                              >
                                {item.title}
                              </Link>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 print:hidden">
                            <Link
                              href={`/learn/${course.id}/${item.id}`}
                              className="px-3 py-1 rounded text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container transition-colors flex items-center gap-1 shadow-xs"
                            >
                              <span>Study</span>
                              <span className="material-symbols-outlined text-xs">arrow_forward</span>
                            </Link>
                            {(item.url || item.sourceUrl) && (
                              <a
                                href={item.url || item.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors"
                                title="Open Original Source Repository"
                              >
                                <span className="material-symbols-outlined text-base">open_in_new</span>
                              </a>
                            )}
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

      {/* 3. Checkpoint Quiz Runner Modal */}
      {activeQuizModule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-surface-container-high/60 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
              <div>
                <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
                  Diagnostic Checkpoint
                </span>
                <h3 className="font-headline-md text-headline-md text-primary font-serif">
                  {activeQuizModule.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveQuizModule(null)}
                aria-label="Close Quiz"
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Questions View */}
            {activeQuizModule.checkpointQuestions && (
              <div className="py-4 space-y-6">
                {activeQuizModule.checkpointQuestions.map((q: any, qIdx: number) => {
                  const selected = quizAnswers[qIdx];
                  const correctIdx = typeof q.correctOptionIndex === 'number'
                    ? q.correctOptionIndex
                    : (q.correctOptionId ? (q.correctOptionId.charCodeAt(0) - 65) : 0);
                  const isCorrect = selected === correctIdx;
                  const questionPrompt = q.questionText || q.prompt || `Question ${qIdx + 1}`;
                  const optionsList = Array.isArray(q.options)
                    ? q.options.map((opt: any) => typeof opt === 'string' ? opt : (opt?.text || opt?.label || String(opt)))
                    : (q.optionsList || []);

                  return (
                    <div
                      key={q.id || qIdx}
                      className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/40"
                    >
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-semibold text-on-surface-variant">Question {qIdx + 1}</span>
                        <span className="px-2 py-0.5 rounded font-medium bg-surface-container text-on-surface-variant capitalize">
                          {q.difficulty || "medium"}
                        </span>
                      </div>
                      <p className="font-semibold text-primary mb-3 text-sm">{questionPrompt}</p>

                      <div className="space-y-2">
                        {optionsList.map((opt: string, optIdx: number) => {
                          const isOptionSelected = selected === optIdx;
                          let optionClass = "bg-surface-container-lowest border-surface-container-high/60 text-on-surface";
                          if (quizSubmitted) {
                            if (optIdx === correctIdx) {
                              optionClass = "bg-emerald-500/15 border-emerald-500/50 text-emerald-800 dark:text-emerald-300 font-bold";
                            } else if (isOptionSelected) {
                              optionClass = "bg-rose-500/15 border-rose-500/50 text-rose-800 dark:text-rose-300 line-through";
                            }
                          } else if (isOptionSelected) {
                            optionClass = "bg-primary-container text-on-primary border-primary";
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleQuizOptionSelect(qIdx, optIdx)}
                              className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${optionClass}`}
                            >
                              <span>{opt}</span>
                              {quizSubmitted && optIdx === correctIdx && (
                                <span className="material-symbols-outlined text-sm text-emerald-600">check</span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div className="mt-3 p-2.5 rounded-lg bg-surface-container text-xs text-on-surface-variant border-l-2 border-primary">
                          <span className="font-semibold text-primary">Explanation: </span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Score & Controls */}
                <div className="pt-2 flex items-center justify-between">
                  {quizSubmitted ? (
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-primary">
                        Score: {quizScore}%
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setQuizSubmitted(false);
                          setQuizAnswers({});
                          setQuizScore(null);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-surface-container-high/60 text-xs font-semibold text-primary hover:bg-surface-container"
                      >
                        Retake Quiz
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(quizAnswers).length === 0}
                      className="px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-sm ml-auto disabled:opacity-50"
                    >
                      Submit Assessment
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Spaced Flashcard Modal */}
      {activeFlashcardModule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-surface-container-high/60">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Formula Flashcards ({activeFlashcardIdx + 1} of {activeFlashcardModule.flashcards?.length})
              </span>
              <button
                type="button"
                onClick={() => setActiveFlashcardModule(null)}
                aria-label="Close Flashcards"
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Flashcard Card Flip */}
            {activeFlashcardModule.flashcards?.[activeFlashcardIdx] && (
              <div className="py-6">
                {(() => {
                  const card = activeFlashcardModule.flashcards[activeFlashcardIdx];
                  return (
                    <div
                      onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
                      className="min-h-[200px] p-6 rounded-2xl bg-surface-container-low border border-surface-container-high/60 flex flex-col items-center justify-center text-center cursor-pointer shadow-inner transition-transform hover:scale-[1.01]"
                    >
                      {!isFlashcardFlipped ? (
                        <>
                          <span className="text-xs font-semibold text-secondary uppercase mb-2">Concept / Term</span>
                          <h4 className="text-lg font-bold text-primary font-serif mb-3">{card.concept}</h4>
                          <span className="text-xs text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">flip</span>
                            Click card to reveal formula
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase mb-2">Formula &amp; Law</span>
                          <div className="font-mono text-base font-bold text-primary bg-surface-container px-3 py-1.5 rounded-lg mb-3">
                            {card.formulaLatex}
                          </div>
                          <p className="text-xs text-on-surface-variant max-w-xs">{card.memoryHook}</p>
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* Navigation & Knowledge Toggle */}
                <div className="flex items-center justify-between mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFlashcardFlipped(false);
                      setActiveFlashcardIdx((prev) => Math.max(0, prev - 1));
                    }}
                    disabled={activeFlashcardIdx === 0}
                    className="px-3 py-1.5 rounded-lg border border-surface-container-high/60 text-xs font-semibold text-on-surface-variant disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsFlashcardFlipped(false);
                      setActiveFlashcardIdx((prev) =>
                        Math.min((activeFlashcardModule.flashcards?.length || 1) - 1, prev + 1)
                      );
                    }}
                    disabled={activeFlashcardIdx >= (activeFlashcardModule.flashcards?.length || 1) - 1}
                    className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold disabled:opacity-40"
                  >
                    Next Card
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
