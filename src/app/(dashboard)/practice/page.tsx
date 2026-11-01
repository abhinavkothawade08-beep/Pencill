"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/ui/EmptyState";
import AuthGuard from "@/components/auth/AuthGuard";
import CreateQuizModal from "@/components/quiz/CreateQuizModal";
import DeleteQuizModal from "@/components/ui/DeleteQuizModal";
import DeleteAllModal from "@/components/ui/DeleteAllModal";
import Toast from "@/components/ui/Toast";
import { getAllQuizzes, deleteQuiz, batchDeleteQuizzes } from "@/services/supabase/quizService";
import { addBookmark } from "@/services/supabase/bookmarkService";
import { getVerifiedResources, searchResourcesInDatabase } from "@/services/supabase/resourceService";
import { storageAdapter } from "@/lib/storage/storageAdapter";
import { useAuth } from "@/context/AuthContext";
import InteractiveCodeRunner from "@/components/practice/InteractiveCodeRunner";

interface QuizItem {
  id: string;
  title: string;
  topic?: string;
  subject?: string;
  difficulty?: string;
  courseTitle: string;
  timeLimitMinutes: number;
  totalQuestions: number;
  createdAt?: string;
  userId?: string | null;
}

interface PracticeResourceItem {
  id: string;
  title: string;
  type: string;
  sourceName: string;
  sourceUrl: string;
  durationMinutes: number;
  description?: string;
  externalId?: string;
  difficulty?: string;
  qualityScore: number;
  tags?: string[];
}

export default function PracticeQuizzesPage() {
  const router = useRouter();
  const { user, session } = useAuth();

  // Mode View: Quizzes, Discovered Problem Sets, or Code Sandbox
  const [sectionView, setSectionView] = useState<"quizzes" | "problemSets" | "codeSandbox">("quizzes");

  // Quizzes State
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetQuizToDelete, setTargetQuizToDelete] = useState<QuizItem | null>(null);
  const [isDeletingQuiz, setIsDeletingQuiz] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeletingAllQuizzes, setIsDeletingAllQuizzes] = useState(false);
  const [toastState, setToastState] = useState<{ open: boolean; message: string; icon?: string }>({
    open: false,
    message: "",
    icon: "check_circle",
  });
  const [activeTab, setActiveTab] = useState<"all" | "custom" | "standard">("all");
  const [quizSearchQuery, setQuizSearchQuery] = useState("");


  // Problem Sets & PYQ Discovery State
  const [practiceResources, setPracticeResources] = useState<PracticeResourceItem[]>([]);
  const [loadingPractice, setLoadingPractice] = useState(false);
  const [practiceSearchTopic, setPracticeSearchTopic] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedExam, setSelectedExam] = useState<string>("all");
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const loadQuizzes = useCallback(async () => {
    setLoadingQuizzes(true);
    setQuizError(null);
    try {
      let data: any[] = [];
      try {
        data = await getAllQuizzes(user?.id || null);
      } catch (e) {
        console.warn("[Practice] Supabase quizzes failed, extracting from savedPaths:", e);
      }

      // Harvest checkpoint quizzes strictly from user's enrolled courses
      let enrolledCoursesList: any[] = [];
      if (user?.id) {
        try {
          const { getUserEnrollments } = await import("@/services/supabase/enrollmentService");
          const enrollments = await getUserEnrollments(user.id);
          enrolledCoursesList = enrollments.map((e) => e.course).filter(Boolean);
        } catch {}
      } else {
        enrolledCoursesList = await storageAdapter.getSavedPaths();
      }

      const harvested: QuizItem[] = [];
      for (const p of enrolledCoursesList) {
        if (p.modules) {
          for (const m of p.modules) {
            if (m.checkpointQuestions && m.checkpointQuestions.length > 0) {
              harvested.push({
                id: `checkpoint-${p.id}-${m.id}`,
                title: `${m.title} Diagnostic Checkpoint`,
                topic: p.subject || p.domain || "Academic Milestone",
                subject: p.subject || "Curriculum Unit",
                difficulty: p.difficulty || "intermediate",
                courseTitle: p.title,
                timeLimitMinutes: Math.round(m.checkpointQuestions.length * 2.5),
                totalQuestions: m.checkpointQuestions.length,
                createdAt: p.createdAt || new Date().toISOString(),
                userId: user?.id || null,
              });
            }
          }
        }
      }

      const qMap = new Map<string, QuizItem>();
      data.forEach((q) => qMap.set(q.id, q));
      harvested.forEach((q) => {
        if (!qMap.has(q.id)) qMap.set(q.id, q);
      });
      data = Array.from(qMap.values());
      setQuizzes(data);
    } catch (err) {
      console.error("Failed to load quizzes:", err);
      setQuizError("Unable to load diagnostic checkpoints from database.");
    } finally {
      setLoadingQuizzes(false);
    }
  }, [user]);

  const loadPracticeResources = useCallback(
    async (topicOverride?: string) => {
      setLoadingPractice(true);
      try {
        const queryTopic = (topicOverride ?? practiceSearchTopic).trim();
        let results: import("@/services/supabase/resourceService").DatabaseResource[] = [];
        if (queryTopic) {
          results = await searchResourcesInDatabase(queryTopic, { type: "practice", limit: 12 });
        }
        if (results.length === 0) {
          results = await getVerifiedResources({ type: "practice", limit: 12 });
        }
        setPracticeResources(
          results.map((r) => ({
            ...r,
            description: r.description ?? undefined,
            externalId: r.externalId ?? undefined,
          }))
        );
      } catch (err) {
        console.error("Failed to load practice resources:", err);
      } finally {
        setLoadingPractice(false);
      }
    },
    [practiceSearchTopic]
  );

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  useEffect(() => {
    const handleAuthReset = () => {
      setQuizzes([]);
      setTargetQuizToDelete(null);
    };
    window.addEventListener("pencill:auth-state-reset", handleAuthReset);
    return () => window.removeEventListener("pencill:auth-state-reset", handleAuthReset);
  }, []);

  // Load default practice resources when switching to problemSets tab
  useEffect(() => {
    if (sectionView === "problemSets" && practiceResources.length === 0) {
      loadPracticeResources("Physics Mechanics Problem Sets");
    }
  }, [sectionView, practiceResources.length, loadPracticeResources]);

  const handleBookmarkPractice = async (item: PracticeResourceItem) => {
    if (!user) return;
    try {
      await addBookmark(
        {
          resourceId: item.id,
          title: item.title,
          type: "practice",
          source: item.sourceName,
          description: item.description || "Curated Practice Problem Set",
          category: "practice",
        },
        user.id
      );
      setBookmarkedIds((prev) => new Set([...prev, item.id]));
    } catch (err) {
      console.error("Failed to bookmark practice item:", err);
    }
  };

  const handleDeleteQuizTrigger = (quiz: QuizItem) => {

    setTargetQuizToDelete(quiz);
  };

  const handleConfirmDeleteQuiz = async () => {
    if (!targetQuizToDelete) return;
    setIsDeletingQuiz(true);

    try {
      const res = await deleteQuiz(targetQuizToDelete.id, {
        accessToken: session?.access_token,
      });

      if (res.success) {
        // Immediately remove deleted quiz from state
        setQuizzes((prev) => prev.filter((q) => q.id !== targetQuizToDelete.id));
        setToastState({
          open: true,
          message: `Quiz "${targetQuizToDelete.title}" permanently deleted.`,
          icon: "check_circle",
        });
        setTargetQuizToDelete(null);
      } else {
        setToastState({
          open: true,
          message: res.error || "Failed to delete quiz assessment.",
          icon: "error",
        });
      }
    } catch (err: unknown) {
      setToastState({
        open: true,
        message: err instanceof Error ? err.message : "Failed to delete quiz assessment.",
        icon: "error",
      });
    } finally {
      setIsDeletingQuiz(false);
    }
  };

  const isQuizOwnedByUser = useCallback(
    (q: QuizItem) => {
      if (!q.userId) return false;
      if (user?.id) return q.userId === user.id;
      return true;
    },
    [user?.id]
  );

  const handleConfirmDeleteAllQuizzes = async () => {
    if (userQuizzesInScope.length === 0) return;
    setIsDeletingAllQuizzes(true);
    const targetIds = userQuizzesInScope.map((q) => q.id);

    try {
      const res = await batchDeleteQuizzes(targetIds, {
        accessToken: session?.access_token,
      });

      if (res.success && res.deletedCount > 0) {
        const deletedSet = new Set(res.deletedIds);
        setQuizzes((prev) => prev.filter((q) => !deletedSet.has(q.id)));
        setToastState({
          open: true,
          message: `Successfully deleted ${res.deletedCount} quiz ${res.deletedCount === 1 ? "assessment" : "assessments"}.`,
          icon: "check_circle",
        });
        setIsDeleteAllModalOpen(false);
      } else {
        setToastState({
          open: true,
          message: res.errors?.[0] || "Failed to delete quizzes.",
          icon: "error",
        });
      }
    } catch (err: unknown) {
      setToastState({
        open: true,
        message: err instanceof Error ? err.message : "Failed to delete quizzes.",
        icon: "error",
      });
    } finally {
      setIsDeletingAllQuizzes(false);
    }
  };

  const filteredQuizzes = quizzes.filter((q) => {

    if (activeTab === "custom" && !q.userId && !q.topic) return false;
    if (
      activeTab === "standard" &&
      (q.userId || (q.topic && !q.courseTitle.includes("Academic") && !q.courseTitle.includes("Diagnostic")))
    )
      return false;

    if (quizSearchQuery.trim()) {
      const match = (
        q.title +
        " " +
        (q.topic || "") +
        " " +
        (q.subject || "") +
        " " +
        q.courseTitle
      ).toLowerCase();
      if (!match.includes(quizSearchQuery.trim().toLowerCase())) return false;
    }
    return true;
  });

  const userQuizzesInScope = filteredQuizzes.filter(isQuizOwnedByUser);
  const totalUserQuizzes = quizzes.filter(isQuizOwnedByUser);
  const isFilterActive = activeTab !== "all" || quizSearchQuery.trim().length > 0;
  const scopeDescription = isFilterActive
    ? `Filtered View (${activeTab === "custom" ? "Custom/AI" : activeTab === "standard" ? "Standards" : "All"}${
        quizSearchQuery.trim() ? `, query "${quizSearchQuery.trim()}"` : ""
      })`
    : "All Personal Quizzes";

  return (
    <AuthGuard>
      <div className="flex flex-col gap-space-xl pb-space-xl max-w-6xl mx-auto">
        {/* Create Quiz Modal */}
        <CreateQuizModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onQuizCreated={(quizId) => {
            setIsModalOpen(false);
            router.push(`/practice/${quizId}`);
          }}
        />

        {/* Toast Notification */}
        <Toast
          isOpen={toastState.open}
          message={toastState.message}
          icon={toastState.icon}
          onClose={() => setToastState({ open: false, message: "", icon: "check_circle" })}
        />

        {/* Delete Quiz Confirmation Modal */}
        {targetQuizToDelete && (
          <DeleteQuizModal
            isOpen={Boolean(targetQuizToDelete)}
            onClose={() => {
              if (!isDeletingQuiz) {
                setTargetQuizToDelete(null);
              }
            }}
            onConfirm={handleConfirmDeleteQuiz}
            quizTitle={targetQuizToDelete.title}
            quizId={targetQuizToDelete.id}
            isDeleting={isDeletingQuiz}
          />
        )}

        {/* Delete All Quizzes Confirmation Modal */}
        <DeleteAllModal
          isOpen={isDeleteAllModalOpen}
          onClose={() => {
            if (!isDeletingAllQuizzes) {
              setIsDeleteAllModalOpen(false);
            }
          }}
          onConfirm={handleConfirmDeleteAllQuizzes}
          itemType="quiz"
          itemTypePlural="quizzes"
          items={userQuizzesInScope.map((q) => ({ id: q.id, title: q.title }))}
          scopeDescription={scopeDescription}
          isDeleting={isDeletingAllQuizzes}
        />


        {/* Top Page Header */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-md border-b border-surface-container-high/60 pb-space-md">
          <div>
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-secondary font-semibold">Assessment &amp; Practice</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary font-serif">
              Practice Hub &amp; Assessments
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Timed diagnostic checkpoints, official previous year questions (PYQs), and verified open problem sets.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl font-label-md font-semibold hover:bg-primary-container transition-all text-xs shadow-sm"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>Create Your Own Quiz</span>
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-surface-container text-primary rounded-xl font-label-md font-semibold hover:bg-surface-container-high transition-colors shrink-0 text-xs"
            >
              <span className="material-symbols-outlined text-base">dashboard</span>
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </div>
        </header>

        {/* Section Mode Toggle (Quizzes vs Problem Sets & PYQs) */}
        <div className="flex items-center gap-2 border-b border-surface-container-high pb-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSectionView("quizzes")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              sectionView === "quizzes"
                ? "bg-primary text-on-primary shadow-xs"
                : "bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-base">quiz</span>
            <span>Diagnostic Quizzes ({quizzes.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSectionView("problemSets")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              sectionView === "problemSets"
                ? "bg-primary text-on-primary shadow-xs"
                : "bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-base">history_edu</span>
            <span>Discovered Problem Sets &amp; PYQs</span>
          </button>
          <button
            type="button"
            onClick={() => setSectionView("codeSandbox")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              sectionView === "codeSandbox"
                ? "bg-primary text-on-primary shadow-xs"
                : "bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-base">terminal</span>
            <span>Interactive Code Sandbox</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* VIEW A: DIAGNOSTIC QUIZZES                                               */}
        {/* ========================================================================= */}
        {sectionView === "quizzes" && (
          <div className="space-y-6">
            {/* Sub-Tabs & Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-surface-container-high/60">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "all"
                      ? "bg-surface-container-lowest text-primary shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  All Quizzes ({quizzes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("custom")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "custom"
                      ? "bg-surface-container-lowest text-primary shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Custom &amp; AI Checkpoints
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("standard")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "standard"
                      ? "bg-surface-container-lowest text-primary shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Curriculum Standards
                </button>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-sm">
                    search
                  </span>
                  <input
                    type="text"
                    value={quizSearchQuery}
                    onChange={(e) => setQuizSearchQuery(e.target.value)}
                    placeholder="Filter by topic or subject..."
                    className="w-full pl-9 pr-3 py-1.5 bg-surface-container-low border border-surface-container-high rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsDeleteAllModalOpen(true)}
                  disabled={userQuizzesInScope.length === 0}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 border ${
                    userQuizzesInScope.length > 0
                      ? "bg-error/10 hover:bg-error/20 text-error border-error/30 hover:border-error/50 active:scale-95"
                      : "bg-surface-container-low text-on-surface-variant/40 border-surface-container-high cursor-not-allowed"
                  }`}
                  title={
                    userQuizzesInScope.length > 0
                      ? `Delete all ${userQuizzesInScope.length} user-owned quizzes in this view`
                      : activeTab === "standard"
                      ? "Standard curriculum quizzes are system-protected"
                      : "No user-owned quizzes to delete"
                  }
                >
                  <span className="material-symbols-outlined text-sm">delete_sweep</span>
                  <span>
                    {isFilterActive
                      ? `Delete Filtered (${userQuizzesInScope.length})`
                      : `Delete All (${userQuizzesInScope.length})`}
                  </span>
                </button>
              </div>
            </div>

            {/* Quizzes Content */}
            {loadingQuizzes ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-52 bg-surface-container-lowest rounded-2xl border border-surface-container-high/60"
                  />
                ))}
              </div>
            ) : quizError ? (
              <EmptyState
                icon="error"
                title="Unable to Load Diagnostic Quizzes"
                description={quizError}
                actionText="Return to Dashboard"
                actionHref="/dashboard"
              />
            ) : filteredQuizzes.length === 0 ? (
              <div className="bg-surface-container-lowest border border-surface-container-high rounded-2xl p-10 text-center space-y-4 max-w-xl mx-auto my-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">psychology</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-serif text-primary">
                    {quizSearchQuery ? "No Matching Assessments" : "No Custom Quizzes Created Yet"}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    {quizSearchQuery
                      ? "Try searching with a broader topic name or clear your search query."
                      : "Generate your first personalized, AI-powered diagnostic assessment on any educational topic."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-label-md font-semibold hover:bg-primary-container transition-all text-xs shadow-xs"
                >
                  <span className="material-symbols-outlined text-base">bolt</span>
                  <span>Create Your Own Quiz</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
                {filteredQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-surface-container-lowest p-space-md rounded-2xl shadow-xs border border-surface-container-high/60 flex flex-col justify-between group hover:border-primary/40 hover:shadow-sm transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary bg-secondary-fixed/50 px-2 py-0.5 rounded font-medium">
                          <span className="material-symbols-outlined text-xs">timer</span>
                          {quiz.timeLimitMinutes} min
                        </span>
                        <div className="flex items-center gap-1.5">
                          {quiz.difficulty && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                              {quiz.difficulty}
                            </span>
                          )}
                          <span className="text-xs text-on-surface-variant font-mono">
                            {quiz.totalQuestions} questions
                          </span>
                        </div>
                      </div>

                      <h3 className="font-headline-sm text-headline-sm text-primary font-sans font-semibold mb-1 line-clamp-2">
                        {quiz.title}
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 leading-relaxed">
                        {quiz.subject || quiz.courseTitle}
                      </p>
                    </div>

                    <div className="pt-space-sm mt-space-sm border-t border-surface-container-high/40 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-on-surface-variant font-medium">
                        {quiz.topic ? `Topical Checkpoint` : `Curriculum Standard`}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`Delete ${quiz.title}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteQuizTrigger(quiz);
                          }}
                          className="p-1.5 rounded-lg bg-surface-container-low hover:bg-error-container/20 text-on-surface-variant hover:text-error transition-colors focus:outline-none focus:ring-2 focus:ring-error/30 active:scale-95"
                          title="Delete Quiz"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                        <Link
                          href={`/practice/${quiz.id}`}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary-container transition-colors text-xs shadow-xs"
                        >
                          <span>Start Quiz</span>
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </Link>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW B: DISCOVERED PROBLEM SETS & PYQs                                    */}
        {/* ========================================================================= */}
        {sectionView === "problemSets" && (
          <div className="space-y-6">
            {/* Search & Topic Query Bar */}
            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-high/60 shadow-xs flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-sm">
                  manage_search
                </span>
                <input
                  type="text"
                  value={practiceSearchTopic}
                  onChange={(e) => setPracticeSearchTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      loadPracticeResources();
                    }
                  }}
                  placeholder="Enter a subject or topic (e.g., Rotational Dynamics, Calculus, Thermodynamics)..."
                  className="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-surface-container-high rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => {
                    setSelectedDifficulty(e.target.value);
                  }}
                  className="px-3 py-2 bg-surface-container-low border border-surface-container-high rounded-xl text-xs text-on-surface font-medium focus:outline-none"
                >
                  <option value="all">All Difficulties</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="competitive">Competitive / Olympiad</option>
                </select>

                <select
                  value={selectedExam}
                  onChange={(e) => {
                    setSelectedExam(e.target.value);
                  }}
                  className="px-3 py-2 bg-surface-container-low border border-surface-container-high rounded-xl text-xs text-on-surface font-medium focus:outline-none"
                >
                  <option value="all">All Exams / Targets</option>
                  <option value="JEE">JEE Main &amp; Advanced</option>
                  <option value="NEET">NEET Examination</option>
                  <option value="AP">AP / University Standard</option>
                </select>

                <button
                  type="button"
                  onClick={() => loadPracticeResources()}
                  disabled={loadingPractice}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary font-semibold rounded-xl hover:bg-primary-container transition-all text-xs shrink-0 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">travel_explore</span>
                  <span>{loadingPractice ? "Discovering..." : "Discover"}</span>
                </button>
              </div>
            </div>

            {/* Practice Items Grid */}
            {loadingPractice ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-56 bg-surface-container-lowest rounded-2xl border border-surface-container-high/60"
                  />
                ))}
              </div>
            ) : practiceResources.length === 0 ? (
              <div className="bg-surface-container-lowest border border-surface-container-high rounded-2xl p-10 text-center space-y-4 max-w-xl mx-auto my-6">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">menu_book</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-serif text-primary">
                    Discover Problem Sets &amp; PYQs
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    Search above for topic-specific problem sets from MIT OpenCourseWare, Khan Academy, JEE Archives, and open repositories.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => loadPracticeResources("Classical Mechanics Kinematics")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-label-md font-semibold hover:bg-primary-container transition-all text-xs shadow-xs"
                >
                  <span className="material-symbols-outlined text-base">explore</span>
                  <span>Explore Mechanics Problem Sets</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
                {practiceResources.map((item) => {
                  const isBookmarked = bookmarkedIds.has(item.id);
                  const isPyq = item.type === "pyq" || item.title.toLowerCase().includes("pyq");

                  return (
                    <div
                      key={item.id}
                      className="bg-surface-container-lowest p-space-md rounded-2xl shadow-xs border border-surface-container-high/60 flex flex-col justify-between group hover:border-primary/40 hover:shadow-sm transition-all"
                    >
                      <div>
                        {/* Tags & Badges */}
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-0.5 rounded font-medium ${
                              isPyq
                                ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300"
                                : "text-secondary bg-secondary-fixed/50"
                            }`}
                          >
                            <span className="material-symbols-outlined text-xs">
                              {isPyq ? "history_edu" : "task_alt"}
                            </span>
                            {isPyq ? "Previous Year Question (PYQ)" : "Practice Set"}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {item.difficulty && (
                              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                                {item.difficulty}
                              </span>
                            )}
                            <span className="text-xs text-primary font-semibold font-mono">
                              {Math.round(item.qualityScore)}% Quality
                            </span>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h3 className="font-headline-sm text-headline-sm text-primary font-sans font-semibold mb-1 line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 leading-relaxed">
                          {item.description || `Verified academic practice material from ${item.sourceName}`}
                        </p>

                        {/* Source institution */}
                        <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-on-surface-variant/80 font-medium">
                          <span className="material-symbols-outlined text-xs">school</span>
                          <span>{item.sourceName}</span>
                        </div>
                      </div>

                      {/* Action Links */}
                      <div className="pt-space-sm mt-space-sm border-t border-surface-container-high/40 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleBookmarkPractice(item)}
                          title={isBookmarked ? "Saved to Bookmarks" : "Save to Bookmarks"}
                          className={`p-1.5 rounded-lg border text-xs transition-colors ${
                            isBookmarked
                              ? "bg-primary/10 border-primary text-primary"
                              : "border-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">
                            {isBookmarked ? "bookmark_added" : "bookmark_add"}
                          </span>
                        </button>

                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary-container transition-colors text-xs shadow-xs"
                        >
                          <span>Solve Problems</span>
                          <span className="material-symbols-outlined text-xs">open_in_new</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW C: SAFE IN-BROWSER CODE RUNNER SANDBOX                               */}
        {/* ========================================================================= */}
        {sectionView === "codeSandbox" && (
          <InteractiveCodeRunner />
        )}
      </div>
    </AuthGuard>
  );
}
