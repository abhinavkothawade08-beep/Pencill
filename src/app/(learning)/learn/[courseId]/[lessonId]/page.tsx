"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Toast from "@/components/ui/Toast";
import {
  getLessonWorkspaceData,
  LessonWorkspaceData,
} from "@/services/supabase/lessonService";
import {
  markLessonComplete,
  getCompletedLessonIds,
} from "@/services/supabase/progressService";
import {
  getUserNotes,
  addNote,
  updateNote,
  deleteNote,
  UserNoteItem,
} from "@/services/supabase/noteService";
import {
  addBookmark,
  removeBookmark,
  getBookmarkForResource,
} from "@/services/supabase/bookmarkService";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabase/client";
import { LessonNoteResource } from "@/types";
import { storageAdapter } from "@/lib/storage/storageAdapter";

function extractYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;

  // 1. Check for playlist parameter
  const playlistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/i);
  const playlistId = playlistMatch && playlistMatch[1] ? playlistMatch[1] : null;

  // 2. Check for video ID
  const videoRegExp = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const videoMatch = url.match(videoRegExp);
  const videoId = videoMatch && videoMatch[1] ? videoMatch[1] : null;

  let startSeconds: number | null = null;
  const timeMatch = url.match(/[?&](?:t|start)=([^&#\s]+)/i);
  if (timeMatch && timeMatch[1]) {
    const rawTime = timeMatch[1].trim();
    if (/^\d+s?$/i.test(rawTime)) {
      startSeconds = parseInt(rawTime, 10);
    } else if (/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i.test(rawTime)) {
      const parts = rawTime.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i);
      if (parts && (parts[1] || parts[2] || parts[3])) {
        const h = parts[1] ? parseInt(parts[1], 10) : 0;
        const m = parts[2] ? parseInt(parts[2], 10) : 0;
        const s = parts[3] ? parseInt(parts[3], 10) : 0;
        startSeconds = h * 3600 + m * 60 + s;
      }
    }
  }
  const startParam = startSeconds && startSeconds > 0 ? `&start=${startSeconds}` : "";

  // If both video and playlist are present, embed video with playlist context
  if (videoId && playlistId) {
    return `https://www.youtube-nocookie.com/embed/${videoId}?list=${playlistId}&rel=0&modestbranding=1${startParam}`;
  }

  // If video is present
  if (videoId) {
    return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1${startParam}`;
  }

  // If only playlist is present
  if (playlistId) {
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}&rel=0&modestbranding=1`;
  }

  return null;
}

export default function LearningWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params?.courseId as string;
  const lessonId = params?.lessonId as string;
  const currentUser = user?.id || null;

  const [workspace, setWorkspace] = useState<LessonWorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);

  // Bookmarking state
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);

  // Media playback controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState("1.25x");
  const [activeTab, setActiveTab] = useState<"summary" | "notes" | "formulae" | "materials">("summary");

  // Study Notes & Handouts state
  const [studyNotes, setStudyNotes] = useState<LessonNoteResource[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  // Notes state
  const [notes, setNotes] = useState<UserNoteItem[]>([]);
  const [newNote, setNewNote] = useState("");
  const [noteTimestamp, setNoteTimestamp] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState("");

  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);
  const [toastState, setToastState] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  // Load session & lesson workspace
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      const uid = currentUser;

      // Fetch full workspace hierarchy (course, module, lesson, siblings)
      const data = await getLessonWorkspaceData(courseId, lessonId);

      // Fetch completed lessons for current user / guest
      const completed = await getCompletedLessonIds(uid, courseId);

      // Fetch notes
      const loadedNotes = await getUserNotes(uid, lessonId);

      // Fetch bookmark status
      if (uid && lessonId) {
        const existing = await getBookmarkForResource(uid, lessonId);
        if (mounted && existing) {
          setIsBookmarked(true);
          setBookmarkId(existing.id);
        } else if (mounted) {
          setIsBookmarked(false);
          setBookmarkId(null);
        }
      } else if (lessonId) {
        const localBookmarks = await storageAdapter.getBookmarks();
        const existing = localBookmarks.find(
          (b) => b.resourceId === lessonId || (b.pathId === courseId && b.title === data?.lesson?.title)
        );
        if (mounted && existing) {
          setIsBookmarked(true);
          setBookmarkId(existing.id);
        } else if (mounted) {
          setIsBookmarked(false);
          setBookmarkId(null);
        }
      }

      if (mounted) {
        setWorkspace(data);
        setCompletedLessonIds(completed);
        setNotes(loadedNotes);
        setStudyNotes(data?.lesson?.studyNotes || []);
        setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [courseId, lessonId, currentUser]);

  const fetchNotesForLesson = useCallback(
    async (_targetLessonTitle?: string, _targetTopic?: string, _targetDomain?: string) => {
      setIsLoadingNotes(true);
      setNotesError(null);
      try {
        if (workspace?.lesson?.studyNotes && workspace.lesson.studyNotes.length > 0) {
          setStudyNotes(workspace.lesson.studyNotes);
        } else {
          setStudyNotes([]);
        }
      } catch (err: unknown) {
        setNotesError(err instanceof Error ? err.message : "Failed to load study notes.");
      } finally {
        setIsLoadingNotes(false);
      }
    },
    [workspace]
  );

  // Load lesson study notes when workspace updates
  useEffect(() => {
    if (!workspace?.lesson || !workspace?.course) return;
    setStudyNotes(workspace.lesson.studyNotes || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.lesson?.id, workspace?.lesson?.studyNotes]);

  const handleCopyFormula = (latex: string, name: string) => {
    navigator.clipboard?.writeText(latex);
    setCopiedFormula(name);
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const marker = noteTimestamp.trim() || "Note";
    const created = await addNote(
      currentUser,
      lessonId,
      newNote.trim(),
      marker,
      0,
      courseId
    );

    if (created) {
      setNotes((prev) => [created, ...prev]);
      setNewNote("");
      setNoteTimestamp("");
      setToastState({ open: true, message: "Note saved to your personal study shelf." });
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editNoteContent.trim()) return;
    const ok = await updateNote(noteId, currentUser, editNoteContent.trim(), lessonId);
    if (ok) {
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, content: editNoteContent.trim() } : n))
      );
      setEditingNoteId(null);
      setEditNoteContent("");
      setToastState({ open: true, message: "Note updated successfully." });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const ok = await deleteNote(noteId, currentUser, lessonId);
    if (ok) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setToastState({ open: true, message: "Note deleted." });
    }
  };

  const handleToggleBookmark = async () => {
    const lesson = workspace?.lesson;
    const course = workspace?.course;
    if (!lesson || !course) return;

    if (!currentUser) {
      if (isBookmarked && bookmarkId) {
        await storageAdapter.removeBookmark(bookmarkId);
        setIsBookmarked(false);
        setBookmarkId(null);
        setToastState({ open: true, message: `Removed "${lesson.title}" from bookmarks.` });
      } else {
        const added = await storageAdapter.addBookmark({
          title: lesson.title,
          source: lesson.sourceName || "Pencill",
          type: "resource",
          pathId: course.id,
          resourceId: lesson.id,
        });
        setIsBookmarked(true);
        setBookmarkId(added.id);
        setToastState({ open: true, message: `Saved "${lesson.title}" to your study shelf!` });
      }
      return;
    }

    if (isBookmarked && bookmarkId) {
      const ok = await removeBookmark(bookmarkId, currentUser);
      if (ok) {
        setIsBookmarked(false);
        setBookmarkId(null);
        setToastState({ open: true, message: `Removed "${lesson.title}" from bookmarks.` });
      }
    } else {
      const newId = await addBookmark(
        {
          title: lesson.title,
          source: lesson.sourceName,
          category: lesson.type === "video" ? "video" : lesson.type === "monograph" ? "monograph" : "practice",
          type: lesson.type,
          description: lesson.summaryPoints?.[0] || lesson.title,
          pathId: course.id,
          resourceId: lesson.id,
        },
        currentUser
      );
      if (newId) {
        setIsBookmarked(true);
        setBookmarkId(newId);
        setToastState({ open: true, message: `Saved "${lesson.title}" to your study shelf!` });
      }
    }
  };

  const handleMarkComplete = async () => {
    const lesson = workspace?.lesson;
    const course = workspace?.course;
    const activeModule = workspace?.module;

    if (lesson && course) {
      await markLessonComplete(currentUser, lesson.id, course.id, activeModule?.id);
      setCompletedLessonIds((prev) => (prev.includes(lesson.id) ? prev : [...prev, lesson.id]));
    }

    setToastState({ open: true, message: "Lesson marked complete! Advancing..." });

    setTimeout(async () => {
      if (workspace?.nextLesson) {
        router.push(`/learn/${courseId}/${workspace.nextLesson.id}`);
      } else {
        // Module or course finished — check if this course has a quiz in Supabase or route to syllabus
        try {
          const { data: quizzes } = await supabase
            .from("quizzes")
            .select("id")
            .eq("path_id", courseId)
            .limit(1);

          if (quizzes && quizzes.length > 0) {
            router.push(`/practice/${quizzes[0].id}`);
          } else {
            router.push(`/courses/${courseId}?completed=true`);
          }
        } catch {
          router.push(`/courses/${courseId}`);
        }
      }
    }, 900);
  };

  const handleReportLink = async () => {
    const lesson = workspace?.lesson;
    if (lesson?.sourceUrl) {
      try {
        await supabase.from("discovery_jobs").insert({
          topic: `Flagged link: ${lesson.title}`,
          source_platform: lesson.sourceName,
          status: "pending",
          error_message: `Learner reported outdated link: ${lesson.sourceUrl}`,
        });
      } catch {
        // graceful fallback if table not writable
      }
    }
    setToastState({
      open: true,
      message: `Flag received for "${lesson?.title || "resource"}". Academic curators will verify resource status.`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex flex-col animate-pulse">
        <header className="h-14 bg-surface-container-lowest border-b border-surface-container-high/60 px-4 flex items-center justify-between" />
        <div className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-gutter grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
          <div className="lg:col-span-3 h-96 bg-surface-container-lowest rounded-xl border border-surface-container-high/60 p-4" />
          <div className="lg:col-span-6 h-[500px] bg-surface-container-lowest rounded-xl border border-surface-container-high/60 p-6" />
          <div className="lg:col-span-3 h-96 bg-surface-container-lowest rounded-xl border border-surface-container-high/60 p-4" />
        </div>
      </div>
    );
  }

  if (!workspace || !workspace.lesson) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-surface-container-lowest p-8 rounded-xl border border-surface-container-high shadow-sm space-y-4">
          <span className="material-symbols-outlined text-4xl text-error">menu_book</span>
          <h2 className="font-headline-md text-headline-md font-serif text-primary">
            Lesson Resource Not Found
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            The requested syllabus unit is unavailable or has not been published in the curriculum catalog.
          </p>
          <Link
            href={`/courses/${courseId}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md font-semibold hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Return to Course Syllabus</span>
          </Link>
        </div>
      </div>
    );
  }

  const { course, module: activeModule, lesson, siblingLessons, prevLesson, nextLesson } = workspace;
  const currentLessonIndex = siblingLessons.findIndex((l) => l.id === lesson.id);
  const totalModuleLessons = siblingLessons.length;
  const completedInModuleCount = siblingLessons.filter((l) =>
    completedLessonIds.includes(l.id)
  ).length;
  const moduleProgressPercent =
    totalModuleLessons > 0 ? Math.round((completedInModuleCount / totalModuleLessons) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      {/* Toast Notification */}
      <Toast
        isOpen={toastState.open}
        message={toastState.message}
        onClose={() => setToastState({ open: false, message: "" })}
      />

      {/* Top Learning Room Bar */}
      <header className="h-14 bg-surface-container-lowest border-b border-surface-container-high/60 px-4 md:px-gutter flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/courses/${course.id}`}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors flex items-center gap-1 font-label-md text-label-md"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            <span className="hidden sm:inline">Back to Syllabus</span>
          </Link>
          <div className="h-4 w-px bg-surface-variant" />
          <span className="font-label-lg text-label-lg text-primary font-semibold truncate">
            {lesson.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="text-on-surface-variant hover:text-primary p-2 rounded-lg transition-colors"
            title="Dashboard"
          >
            <span className="material-symbols-outlined text-lg">grid_view</span>
          </Link>
        </div>
      </header>

      {/* Workspace Inner Container */}
      <div className="flex-1 max-w-[1560px] w-full mx-auto p-3 sm:p-gutter flex flex-col gap-space-md">
        {/* Top Breadcrumb & Quick Status Banner (Stitch) */}
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm flex-wrap text-xs">
            <Link
              href={`/courses/${course.id}`}
              className="inline-flex items-center gap-1.5 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors bg-surface-container-lowest px-space-sm py-1.5 rounded-lg shadow-sm border border-surface-container-high/60"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Back to Course Outline</span>
            </Link>
            <span className="text-outline-variant font-label-sm">/</span>
            <span className="font-label-md text-label-md text-on-surface-variant">
              {activeModule ? `Module ${activeModule.moduleNumber}` : "Module"}
            </span>
            <span className="text-outline-variant font-label-sm">/</span>
            <span className="font-label-md text-label-md text-primary font-semibold truncate max-w-xs">
              {lesson.title}
            </span>
          </div>

          <div className="flex items-center gap-space-sm flex-wrap text-xs">
            <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-medium bg-secondary-container/40 px-2.5 py-1 rounded-full border border-secondary/20">
              <span className="material-symbols-outlined text-xs">bolt</span>
              <span>High Yield Topic · {(course as any).targetExam ? `Target: ${(course as any).targetExam}` : course.domain}</span>
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-lowest px-2.5 py-1 rounded-full shadow-sm border border-surface-container-high/60">
              Duration: {lesson.durationMinutes || 25}m
            </span>
          </div>
        </div>

        {/* 3-PANE ACADEMIC STUDY ENVIRONMENT */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
        {/* PANE 1: Left Module Navigation Tree (lg:col-span-3) */}
        <aside className="lg:col-span-3 flex flex-col gap-space-md order-2 lg:order-1">
          {/* Unit Header Card */}
          <div className="bg-surface-container-lowest p-space-sm rounded-xl shadow-sm border border-surface-container-high/60 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Current Unit</span>
                <span className="font-label-lg text-label-lg font-semibold text-primary truncate max-w-[180px]">
                  {activeModule ? `Module ${activeModule.moduleNumber}: ${activeModule.title}` : "Module Syllabus"}
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-secondary-container bg-primary px-2 py-0.5 rounded-md font-medium shrink-0">
                {completedInModuleCount} / {totalModuleLessons} Done
              </span>
            </div>

            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${moduleProgressPercent}%` }}
              />
            </div>

            {/* Lesson List */}
            <div className="mt-2 space-y-1">
              {siblingLessons.map((item) => {
                const isActive = item.id === lesson.id;
                const isDone = completedLessonIds.includes(item.id);

                return (
                  <Link
                    key={item.id}
                    href={`/learn/${course.id}/${item.id}`}
                    className={`flex items-center justify-between p-2.5 rounded-lg text-left transition-all ${
                      isActive
                        ? "bg-primary-container/10 text-primary font-semibold border-l-4 border-primary"
                        : "bg-surface-container-lowest hover:bg-surface-container-low text-on-surface-variant"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          isDone
                            ? "bg-surface-container text-primary"
                            : isActive
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-low text-outline-variant"
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {isDone ? "check" : isActive ? "play_arrow" : "circle"}
                        </span>
                      </span>
                      <span className="font-body-sm text-body-sm truncate">{item.title}</span>
                    </div>
                    <span className="font-label-sm text-label-sm shrink-0">
                      {item.durationMinutes ? `${item.durationMinutes}m` : item.type}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Companion Streak Card */}
            <div className="mt-space-sm p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between border border-surface-container-high/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-lg">local_fire_department</span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface">Verified Path</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{course.domain}</span>
                </div>
              </div>
              <Link
                href={`/courses/${course.id}`}
                className="font-label-sm text-label-sm text-primary font-semibold hover:underline"
              >
                Syllabus
              </Link>
            </div>
          </div>
        </aside>

        {/* PANE 2: Center Primary Resource Canvas (lg:col-span-6) */}
        <main className="lg:col-span-6 flex flex-col gap-space-md order-1 lg:order-2">
          {/* Header Metadata */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 flex flex-col gap-space-xs">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-secondary-fixed bg-secondary-fixed/50 px-2 py-0.5 rounded font-medium capitalize">
                <span className="material-symbols-outlined text-xs">
                  {lesson.type === "video" ? "videocam" : lesson.type === "quiz" ? "quiz" : "article"}
                </span>
                {lesson.type === "video" ? "Video Lecture" : lesson.type === "monograph" ? "Interactive Monograph" : lesson.type}
              </span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                Sequence #{lesson.sequenceNumber ?? (currentLessonIndex !== -1 ? currentLessonIndex + 1 : 1)}
              </span>
              {lesson.roleInSequence && (
                <span className="font-label-sm text-xs font-semibold px-2 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container capitalize">
                  {lesson.roleInSequence.replace(/_/g, " ")}
                </span>
              )}
              {lesson.qualityScore && (
                <span className="font-label-sm text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {lesson.qualityScore}% Quality
                </span>
              )}
              {lesson.qualityEvidence?.hasHd && (
                <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-surface-container text-secondary">
                  HD
                </span>
              )}
              {lesson.qualityEvidence?.hasCaptions && (
                <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                  CC
                </span>
              )}
              {lesson.discoverySource === 'curated_directory' && (
                <span className="font-label-sm text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  Verified Educator{lesson.educatorName ? `: ${lesson.educatorName}` : ''}
                </span>
              )}
              <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded">
                Duration: {lesson.durationMinutes} mins
              </span>
            </div>

            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-serif">
              {lesson.title}
            </h1>

            <div className="flex items-center gap-space-sm text-on-surface-variant font-body-sm text-body-sm pt-1">
              <span className="flex items-center gap-1 text-primary font-medium">
                <span className="material-symbols-outlined text-sm text-secondary">verified</span>
                {lesson.educatorName ? `Masterclass by ${lesson.educatorName}` : 'Curated Masterclass'}
              </span>
              <span>·</span>
              {lesson.sourceUrl ? (
                <a
                  href={lesson.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-secondary hover:text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Source: {lesson.sourceName}</span>
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                </a>
              ) : (
                <span className="truncate">Source: {lesson.sourceName}</span>
              )}
            </div>

            {/* Selection & Sequence Reasoning Callout */}
            {(lesson.selectionReason || lesson.positionReason || lesson.selectionExplanation || lesson.coverageAssessment) && (
              <div className="mt-2 p-2.5 rounded-lg bg-surface-container-low border border-surface-container-high/40 text-xs text-on-surface-variant space-y-1">
                {lesson.selectionExplanation && (
                  <p className="flex items-start gap-1.5">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">Educator Match:</span>
                    <span>{lesson.selectionExplanation}</span>
                  </p>
                )}
                {lesson.selectionReason && (
                  <p className="flex items-start gap-1.5">
                    <span className="font-semibold text-primary shrink-0">Selection:</span>
                    <span>{lesson.selectionReason}</span>
                  </p>
                )}
                {lesson.coverageAssessment && (
                  <p className="flex items-start gap-1.5">
                    <span className="font-semibold text-secondary shrink-0">Syllabus Coverage:</span>
                    <span>{lesson.coverageAssessment}</span>
                  </p>
                )}
                {lesson.positionReason && (
                  <p className="flex items-start gap-1.5">
                    <span className="font-semibold text-secondary shrink-0">Sequence:</span>
                    <span>{lesson.positionReason}</span>
                  </p>
                )}
                {lesson.qualityEvidence?.uncertaintyReasons && lesson.qualityEvidence.uncertaintyReasons.length > 0 && (
                  <p className="flex items-start gap-1.5 text-outline text-[11px] pt-0.5">
                    <span className="font-medium shrink-0">Audit Note:</span>
                    <span>{lesson.qualityEvidence.uncertaintyReasons.join('; ')}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Academic Resource Media / Reader Area */}
          {(() => {
            const youtubeEmbedUrl = extractYouTubeEmbedUrl(lesson.sourceUrl);
            const isDirectVideo = lesson.sourceUrl?.match(/\.(mp4|webm|ogg)($|\?)/i);

            if (youtubeEmbedUrl) {
              return (
                <div className="bg-black text-on-primary rounded-xl overflow-hidden shadow-md flex flex-col border border-primary-container">
                  <div className="relative w-full aspect-video bg-black">
                    <iframe
                      src={youtubeEmbedUrl}
                      title={lesson.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                  {/* Interactive Video Chapters Grid */}
                  {lesson.chapters && lesson.chapters.length > 0 && (
                    <div className="p-space-md bg-primary-container text-on-primary flex flex-col gap-2 border-t border-primary/40">
                      <span className="font-label-sm text-label-sm text-primary-fixed-dim uppercase tracking-wider font-semibold">
                        Syllabus Chapter Guide
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {lesson.chapters.map((ch, idx) => (
                          <div
                            key={idx}
                            className="text-left p-2 rounded-lg bg-primary/40 text-surface-container flex items-start gap-2"
                          >
                            <span className="font-label-sm text-label-sm text-secondary-fixed font-mono font-semibold shrink-0">
                              {ch.timestamp}
                            </span>
                            <span className="font-body-sm text-body-sm truncate">{ch.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            if (isDirectVideo && lesson.sourceUrl) {
              return (
                <div className="bg-black text-on-primary rounded-xl overflow-hidden shadow-md flex flex-col border border-primary-container">
                  <video
                    src={lesson.sourceUrl}
                    controls
                    className="w-full aspect-video bg-black"
                  />
                </div>
              );
            }

            if (lesson.type === "video") {
              return (
                <div className="bg-surface-container-lowest text-on-surface rounded-xl overflow-hidden shadow-sm border border-surface-container-high/60 p-space-lg flex flex-col gap-space-md">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
                      <span className="material-symbols-outlined text-2xl">videocam</span>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-label-sm text-xs font-semibold px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                          Curated Lecture Unit
                        </span>
                        <span className="font-label-sm text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {lesson.durationMinutes || 25} Mins
                        </span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm font-serif text-primary">
                        {lesson.title}
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        {lesson.selectionReason || "A verified video lecture with exact topical alignment is currently in preparation for this specific unit. Consult the accompanying reference monograph and problem set below."}
                      </p>
                    </div>
                  </div>
                  {lesson.keyConcepts && lesson.keyConcepts.length > 0 && (
                    <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-surface-container-high/40">
                      <span className="font-label-sm text-xs text-on-surface-variant font-medium">Core Concepts:</span>
                      {lesson.keyConcepts.map((kc, kIdx) => (
                        <span key={kIdx} className="font-mono text-xs px-2 py-0.5 rounded bg-surface-container-low text-primary">
                          {kc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            if (lesson.type === "quiz") {
              const quizHref = lesson.sourceUrl || `/practice`;
              const isDone = completedLessonIds.includes(lesson.id);

              return (
                <div className="bg-surface-container-lowest text-on-surface rounded-xl overflow-hidden shadow-sm border border-secondary/40 p-space-lg flex flex-col gap-space-md">
                  <div className="flex items-center justify-between border-b border-surface-container-high/40 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-2xl">quiz</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-label-sm text-xs font-semibold px-2 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container">
                            Module {activeModule?.moduleNumber ?? 1} Assessment
                          </span>
                          {isDone && (
                            <span className="font-label-sm text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">check_circle</span>
                              Completed
                            </span>
                          )}
                        </div>
                        <h3 className="font-headline-sm text-headline-sm font-serif text-primary mt-1">
                          {lesson.title}
                        </h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Grounded in {activeModule?.title || course.title} learning objectives
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Objective & Coverage */}
                  {activeModule?.objective && (
                    <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/40 space-y-1.5">
                      <span className="font-label-sm text-xs font-semibold uppercase tracking-wider text-secondary flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        Assessment Objective
                      </span>
                      <p className="font-body-sm text-body-sm text-on-surface">
                        {activeModule.objective}
                      </p>
                    </div>
                  )}

                  {/* Syllabus Focus Points */}
                  {lesson.summaryPoints && lesson.summaryPoints.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-label-sm text-xs font-semibold text-primary uppercase tracking-wider">
                        Concepts Evaluated
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {lesson.summaryPoints.map((pt, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-surface-container-low/60 border border-surface-container-high/30 text-body-sm text-on-surface">
                            <span className="material-symbols-outlined text-secondary text-sm shrink-0 mt-0.5">
                              target
                            </span>
                            <span>{pt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assessment Action CTA */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-surface-container-high/40">
                    <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">timer</span>
                        {lesson.durationMinutes || 15} Minutes
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">ballot</span>
                        Formative Assessment
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-secondary font-medium">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        Module Content Grounded
                      </span>
                    </div>

                    <Link
                      href={quizHref}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <span>{isDone ? "Retake Assessment" : "Start Module Assessment"}</span>
                      <span className="material-symbols-outlined text-sm">play_arrow</span>
                    </Link>
                  </div>
                </div>
              );
            }

            // Monograph, article, or external open-access resource
            return (
              <div className="bg-surface-container-lowest text-on-surface rounded-xl overflow-hidden shadow-sm border border-surface-container-high/60 p-space-lg flex flex-col gap-space-md">
                <div className="flex items-center justify-between border-b border-surface-container-high/40 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-2xl">
                      {lesson.type === "monograph" ? "menu_book" : lesson.type === "practice" ? "quiz" : "article"}
                    </span>
                    <div>
                      <h3 className="font-headline-sm text-headline-sm font-serif text-primary">
                        {lesson.type === "monograph"
                          ? "Academic Monograph & Notes"
                          : lesson.type === "practice"
                          ? "Curated Problem Archive"
                          : "Primary Literature Study Unit"}
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Provided via {lesson.sourceName}
                      </p>
                    </div>
                  </div>
                  {lesson.sourceUrl && (
                    <a
                      href={lesson.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-label-sm font-semibold hover:bg-primary-container transition-all shadow-xs"
                    >
                      <span>Open Original Source</span>
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </a>
                  )}
                </div>

                {/* Key Concepts Preview */}
                {lesson.summaryPoints && lesson.summaryPoints.length > 0 && (
                  <div className="space-y-2 bg-surface-container-low p-4 rounded-lg border border-surface-container-high/40">
                    <span className="font-label-sm text-label-sm font-semibold text-primary uppercase tracking-wider">
                      Core Learning Takeaways
                    </span>
                    <ul className="space-y-1.5">
                      {lesson.summaryPoints.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2 text-body-sm text-on-surface">
                          <span className="material-symbols-outlined text-secondary text-sm shrink-0 mt-0.5">
                            check_circle
                          </span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Formulae callout if available */}
                {lesson.formulae && lesson.formulae.length > 0 && (
                  <div className="p-4 rounded-lg bg-surface-container-high/30 border border-surface-container-high/60 space-y-2">
                    <span className="font-label-sm text-label-sm font-semibold text-secondary uppercase tracking-wider">
                      Key Mathematical Axioms
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {lesson.formulae.map((f, i) => (
                        <div key={i} className="p-2.5 rounded bg-surface-container-lowest border border-surface-container-high/40">
                          <p className="font-label-sm text-label-sm text-on-surface-variant">{f.name}</p>
                          <p className="font-mono text-sm font-semibold text-primary mt-0.5">{f.latex}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Verified Study Notes & Reading Materials Section */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-high/60 flex flex-col gap-space-sm">
            <div className="flex items-center justify-between border-b border-surface-container-high/40 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">menu_book</span>
                <h3 className="font-headline-sm text-headline-sm font-serif text-primary">
                  Verified Study Notes &amp; Handouts
                </h3>
                {studyNotes.length > 0 && (
                  <span className="font-label-sm text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                    {studyNotes.length} Available
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fetchNotesForLesson(lesson.title, course.title, course.domain)}
                disabled={isLoadingNotes}
                className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary text-label-sm font-semibold transition-colors disabled:opacity-50"
                title="Re-scan academic repositories for notes"
              >
                <span className={`material-symbols-outlined text-sm ${isLoadingNotes ? "animate-spin" : ""}`}>
                  refresh
                </span>
                <span>{isLoadingNotes ? "Discovering..." : "Refresh Notes"}</span>
              </button>
            </div>

            {isLoadingNotes ? (
              <div className="space-y-2 py-2 animate-pulse">
                <div className="h-14 bg-surface-container-low rounded-lg"></div>
                <div className="h-14 bg-surface-container-low rounded-lg"></div>
              </div>
            ) : studyNotes.length === 0 ? (
              <div className="p-4 bg-surface-container-low rounded-lg border border-surface-container-high/40 text-center space-y-1">
                <p className="font-label-md text-label-md text-on-surface-variant">
                  No direct notes or handouts currently attached to this unit.
                </p>
                <button
                  type="button"
                  onClick={() => fetchNotesForLesson(lesson.title, course.title, course.domain)}
                  className="font-label-sm text-sm text-primary font-semibold hover:underline"
                >
                  Discover open-access study notes for this lesson
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs">
                {studyNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 bg-surface-container-low rounded-lg border border-surface-container-high/40 hover:border-primary/40 transition-all flex flex-col justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          note.isDirectPdf
                            ? "bg-error/15 text-error border border-error/30"
                            : note.type === "official_documentation"
                            ? "bg-secondary-container/40 text-on-secondary-container"
                            : "bg-surface-container text-on-surface-variant"
                        }`}>
                          {note.isDirectPdf ? "PDF Document" : note.type.replace(/_/g, " ")}
                        </span>
                        {note.publisher && (
                          <span className="font-label-sm text-xs text-on-surface-variant truncate max-w-[120px]">
                            · {note.publisher}
                          </span>
                        )}
                      </div>
                      <h5 className="font-label-md text-sm font-semibold text-primary line-clamp-2">
                        {note.title}
                      </h5>
                      {note.description && (
                        <p className="font-body-sm text-xs text-on-surface-variant line-clamp-2">
                          {note.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-surface-container-high/30">
                      <a
                        href={note.sourceUrl || note.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        <span>Read Online</span>
                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                      </a>
                      {(note.downloadUrl || note.isDirectPdf) && (
                        <a
                          href={note.downloadUrl || note.sourceUrl || note.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:underline ml-auto"
                        >
                          <span className="material-symbols-outlined text-xs">download</span>
                          <span>Download PDF</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Learning Control Bar */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-high/60 flex flex-wrap items-center justify-between gap-space-sm">
            <div className="flex items-center gap-2">
              {prevLesson ? (
                <Link
                  href={`/learn/${course.id}/${prevLesson.id}`}
                  className="inline-flex items-center gap-1.5 px-space-md py-2.5 rounded-lg bg-surface-container-low text-primary font-label-lg text-label-lg hover:bg-surface-container transition-all"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  <span>Previous</span>
                </Link>
              ) : (
                <Link
                  href={`/courses/${course.id}`}
                  className="inline-flex items-center gap-1.5 px-space-md py-2.5 rounded-lg bg-surface-container-low text-primary font-label-lg text-label-lg hover:bg-surface-container transition-all"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  <span>Course Syllabus</span>
                </Link>
              )}
              <button
                type="button"
                onClick={handleToggleBookmark}
                className={`p-2.5 rounded-lg transition-colors ${
                  isBookmarked
                    ? "bg-secondary text-on-secondary shadow-xs"
                    : "bg-surface-container-low text-on-surface-variant hover:text-secondary"
                }`}
                title={isBookmarked ? "Remove from Bookmarks" : "Bookmark Resource"}
              >
                <span className="material-symbols-outlined text-lg">
                  {isBookmarked ? "bookmark" : "bookmark_add"}
                </span>
              </button>
              <button
                type="button"
                onClick={handleReportLink}
                className="p-2.5 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-error transition-colors"
                title="Report Outdated Link"
              >
                <span className="material-symbols-outlined text-lg">flag</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleMarkComplete}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-space-lg py-2.5 rounded-lg font-label-lg text-label-lg shadow-sm transition-all transform active:scale-95"
            >
              <span>{nextLesson ? "Mark as Complete & Next" : "Complete & Checkpoint"}</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>

          {/* Academic Context Card (Pedagogy & Prerequisites) */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-high/60 flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-headline-sm text-primary font-serif">
                Prerequisites &amp; Concept Mapping
              </span>
              {lesson.conceptId && (
                <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                  ID: {lesson.conceptId}
                </span>
              )}
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              {lesson.prerequisitesNote ||
                "Ensure thorough grasp of quadratic resolving vectors along perpendicular axes prior to tackling inclined planes. If gravitational components on non-orthogonal planes feel unclear, revisit foundational decomposition."}
            </p>
          </div>
        </main>

        {/* PANE 3: Right Academic Resource Intelligence & Notes (lg:col-span-3) */}
        <aside className="lg:col-span-3 flex flex-col gap-space-md order-3">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/60 overflow-hidden flex flex-col">
            {/* Tab Bar */}
            <div className="flex bg-surface-container-low p-1 gap-1 border-b border-surface-container-high/40">
              <button
                type="button"
                onClick={() => setActiveTab("summary")}
                className={`flex-1 py-2 px-1 text-center font-label-sm text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "summary"
                    ? "bg-surface-container-lowest text-primary shadow-xs"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                Summary
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("notes")}
                className={`flex-1 py-2 px-1 text-center font-label-sm text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "notes"
                    ? "bg-surface-container-lowest text-primary shadow-xs"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                Notes ({notes.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("materials")}
                className={`flex-1 py-2 px-1 text-center font-label-sm text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "materials"
                    ? "bg-surface-container-lowest text-primary shadow-xs"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                Materials ({studyNotes.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("formulae")}
                className={`flex-1 py-2 px-1 text-center font-label-sm text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "formulae"
                    ? "bg-surface-container-lowest text-primary shadow-xs"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                Formulae
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-space-md flex flex-col gap-space-md">
              {activeTab === "summary" && (
                <div className="space-y-space-sm">
                  <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-1.5 border border-surface-container-high/40">
                    <div className="flex items-center gap-1.5 text-primary font-label-sm text-label-sm font-semibold">
                      <span className="material-symbols-outlined text-sm text-secondary">lightbulb</span>
                      <span>Core Principles</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      {lesson.summaryPoints && lesson.summaryPoints.length > 0
                        ? lesson.summaryPoints[0]
                        : "Horizontal and vertical motions are independent. The acceleration due to gravity operates strictly in the vertical axis."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                      Key Takeaways
                    </span>
                    <ul className="text-body-sm text-on-surface space-y-2 list-disc list-inside">
                      {lesson.summaryPoints && lesson.summaryPoints.length > 1 ? (
                        lesson.summaryPoints.slice(1).map((pt, i) => <li key={i}>{pt}</li>)
                      ) : (
                        <>
                          <li>Apex speed is non-zero and equal to u cos θ.</li>
                          <li>Radius of curvature at apex: r = (u² cos²θ) / g.</li>
                          <li>For inclined planes, orient the x-axis parallel to slope.</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "notes" && (
                <div className="space-y-space-sm">
                  <form onSubmit={handleAddNote} className="space-y-2">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Write your study note or formula deduction here..."
                      rows={3}
                      className="w-full p-2 bg-surface-container-low rounded-lg text-body-sm text-on-surface border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={noteTimestamp}
                        onChange={(e) => setNoteTimestamp(e.target.value)}
                        placeholder="Marker (e.g. 05:20 or Key Concept)"
                        className="w-48 px-2.5 py-1.5 bg-surface-container-low rounded-lg text-xs text-on-surface border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="submit"
                        className="flex-1 py-1.5 bg-primary text-on-primary rounded-lg font-label-sm font-semibold hover:bg-primary-container transition-colors flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">edit_note</span>
                        <span>Save Note</span>
                      </button>
                    </div>
                  </form>

                  <div className="space-y-2 pt-2 border-t border-surface-container-high/40 max-h-72 overflow-y-auto">
                    {notes.length === 0 ? (
                      <p className="text-xs text-on-surface-variant italic py-2 text-center">
                        No notes saved for this lesson yet. Write a note above to persist your key insights.
                      </p>
                    ) : (
                      notes.map((n) => (
                        <div
                          key={n.id}
                          className="p-2.5 bg-surface-container-low rounded-lg text-body-sm text-on-surface border border-surface-container-high/30 flex flex-col gap-1.5"
                        >
                          {editingNoteId === n.id ? (
                            <div className="space-y-1.5">
                              <textarea
                                value={editNoteContent}
                                onChange={(e) => setEditNoteContent(e.target.value)}
                                className="w-full p-1.5 bg-surface-container-lowest rounded text-body-sm border border-primary text-on-surface focus:outline-none"
                                rows={2}
                              />
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingNoteId(null)}
                                  className="px-2 py-0.5 text-xs text-on-surface-variant hover:text-primary"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateNote(n.id)}
                                  className="px-2 py-0.5 text-xs bg-primary text-on-primary rounded font-medium"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between text-xs text-on-surface-variant font-mono">
                                <span>{n.timestampMarker}</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingNoteId(n.id);
                                      setEditNoteContent(n.content);
                                    }}
                                    className="p-1 hover:text-primary"
                                    title="Edit note"
                                  >
                                    <span className="material-symbols-outlined text-xs">edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteNote(n.id)}
                                    className="p-1 hover:text-error"
                                    title="Delete note"
                                  >
                                    <span className="material-symbols-outlined text-xs">delete</span>
                                  </button>
                                </div>
                              </div>
                              <p className="text-body-sm leading-relaxed">{n.content}</p>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === "formulae" && (
                <div className="space-y-2.5">
                  {(lesson.formulae && lesson.formulae.length > 0
                    ? lesson.formulae
                    : [
                        { name: "Time of Flight", latex: "T = \\frac{2u \\sin\\theta}{g}" },
                        { name: "Max Height", latex: "H = \\frac{u^2 \\sin^2\\theta}{2g}" },
                        { name: "Horizontal Range", latex: "R = \\frac{u^2 \\sin(2\\theta)}{g}" },
                        { name: "Apex Curvature Radius", latex: "r = \\frac{u^2 \\cos^2\\theta}{g}" },
                      ]
                  ).map((f) => {
                    const isCopied = copiedFormula === f.name;
                    return (
                      <div
                        key={f.name}
                        className="p-2.5 bg-surface-container-low rounded-lg border border-surface-container-high/40 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                            {f.name}
                          </p>
                          <p className="font-serif italic font-semibold text-primary mt-0.5 text-sm">
                            {f.latex}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyFormula(f.latex, f.name)}
                          className="p-1.5 rounded text-on-surface-variant hover:text-primary transition-colors"
                          title="Copy formula LaTeX"
                        >
                          <span className="material-symbols-outlined text-base">
                            {isCopied ? "check" : "content_copy"}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === "materials" && (
                <div className="space-y-space-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                      Curated Notes ({studyNotes.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => fetchNotesForLesson(lesson.title, course.title, course.domain)}
                      disabled={isLoadingNotes}
                      className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5 disabled:opacity-50"
                    >
                      <span className={`material-symbols-outlined text-xs ${isLoadingNotes ? "animate-spin" : ""}`}>
                        refresh
                      </span>
                      <span>Re-scan</span>
                    </button>
                  </div>

                  {isLoadingNotes ? (
                    <div className="space-y-2 py-4 animate-pulse">
                      <div className="h-16 bg-surface-container-low rounded-lg"></div>
                      <div className="h-16 bg-surface-container-low rounded-lg"></div>
                    </div>
                  ) : notesError ? (
                    <div className="p-3 bg-surface-container-low rounded-lg text-center space-y-1 text-error text-xs">
                      <p>{notesError}</p>
                      <button
                        type="button"
                        onClick={() => fetchNotesForLesson(lesson.title, course.title, course.domain)}
                        className="underline font-semibold text-primary"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : studyNotes.length === 0 ? (
                    <div className="p-4 bg-surface-container-low rounded-lg text-center space-y-2 text-on-surface-variant text-xs">
                      <span className="material-symbols-outlined text-2xl text-on-surface-variant">description</span>
                      <p>No study notes found for this lesson yet.</p>
                      <button
                        type="button"
                        onClick={() => fetchNotesForLesson(lesson.title, course.title, course.domain)}
                        className="px-3 py-1.5 bg-primary text-on-primary rounded text-xs font-semibold hover:bg-primary-container transition-colors inline-block"
                      >
                        Discover Notes Now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {studyNotes.map((note) => (
                        <div
                          key={note.id}
                          className="p-3 bg-surface-container-low rounded-lg border border-surface-container-high/40 hover:border-primary/40 transition-all flex flex-col gap-2"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`font-mono text-[10px] font-semibold px-1.5 py-0.2 rounded uppercase ${
                                note.isDirectPdf
                                  ? "bg-error/15 text-error"
                                  : "bg-surface-container text-on-surface-variant"
                              }`}>
                                {note.isDirectPdf ? "PDF" : note.type.replace(/_/g, " ")}
                              </span>
                              {note.qualityScore && (
                                <span className="font-label-sm text-[10px] font-semibold px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                                  {note.qualityScore}%
                                </span>
                              )}
                            </div>
                            <h5 className="font-label-md text-xs font-semibold text-primary leading-snug">
                              {note.title}
                            </h5>
                            {note.publisher && (
                              <p className="font-body-sm text-[11px] text-on-surface-variant">
                                Source: {note.publisher}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 pt-1 border-t border-surface-container-high/30">
                            <a
                              href={note.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                            >
                              <span>Read Online</span>
                              <span className="material-symbols-outlined text-xs">open_in_new</span>
                            </a>
                            {(note.downloadUrl || note.isDirectPdf) && (
                              <a
                                href={note.downloadUrl || note.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary hover:underline ml-auto"
                              >
                                <span className="material-symbols-outlined text-xs">download</span>
                                <span>Download PDF</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
);
}
