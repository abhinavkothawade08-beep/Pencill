"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Toast from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { Quiz, QuizAttempt, QuizSubmissionResult } from "@/types";
import { getQuizById, inMemoryQuizStore } from "@/services/supabase/quizService";
import { storageAdapter } from "@/lib/storage/storageAdapter";

export default function DiagnosticQuizPage() {
  const params = useParams();
  const router = useRouter();
  const { user, session } = useAuth();
  const quizId = params?.quizId as string;
  const currentUser = user?.id || null;

  // Quiz state
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Interaction state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [showFormulaDrawer, setShowFormulaDrawer] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Timer state
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Submission Results state
  const [submissionResult, setSubmissionResult] = useState<QuizSubmissionResult | null>(null);

  // Toast state
  const [toastState, setToastState] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  // 1. Load Quiz & Initialize Attempt
  const initializeQuizSession = useCallback(async (forceFresh: boolean = false) => {
    setLoading(true);
    setFetchError(null);

    try {
      // Load quiz with answers hidden: first check local/client store, then server API endpoint
      let quizData = await getQuizById(quizId, { hideAnswers: true });

      if (!quizData || !quizData.questions || quizData.questions.length === 0) {
        try {
          const res = await fetch(`/api/quizzes/${encodeURIComponent(quizId)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.quiz) {
              quizData = data.quiz;
            }
          }
        } catch (fetchErr) {
          console.warn("[practice] Notice fetching quiz from server endpoint:", fetchErr);
        }
      }

      // Check storageAdapter saved paths for module with matching checkpointQuestions
      if (!quizData || !quizData.questions || quizData.questions.length === 0) {
        try {
          const savedPaths = await storageAdapter.getSavedPaths();
          for (const sp of savedPaths) {
            for (const mod of sp.modules || []) {
              const matchesModule =
                quizId === `quiz-${mod.id}` ||
                quizId === `checkpoint-${sp.id}-${mod.id}` ||
                quizId.includes(mod.id) ||
                mod.id === quizId;
              if (matchesModule && mod.checkpointQuestions && mod.checkpointQuestions.length > 0) {
                quizData = {
                  id: quizId,
                  title: `${mod.title}: Module Checkpoint Quiz`,
                  topic: sp.title || "Curriculum Unit",
                  subject: sp.domain || "Academic Milestone",
                  difficulty: (sp.level as any) || "intermediate",
                  courseId: sp.id,
                  courseTitle: sp.title,
                  moduleId: mod.id,
                  totalQuestions: mod.checkpointQuestions.length,
                  questions: mod.checkpointQuestions,
                  timeLimitMinutes: 15,
                  createdAt: new Date().toISOString(),
                  userId: null,
                };
                inMemoryQuizStore.set(quizId, {
                  quiz: quizData,
                  authoritativeQuestions: mod.checkpointQuestions,
                });
                break;
              }
            }
            if (quizData) break;
          }
        } catch (storageErr) {
          console.warn("[practice] Notice searching storageAdapter for quiz:", storageErr);
        }
      }

      if (!quizData || !quizData.questions || quizData.questions.length === 0) {
        setFetchError("The requested diagnostic assessment could not be loaded. Please verify your connection or try generating a new assessment.");
        setLoading(false);
        return;
      }

      setQuiz(quizData);

      // Check for active attempt in sessionStorage
      const savedAttemptId = !forceFresh && typeof window !== "undefined"
        ? sessionStorage.getItem(`pencill_active_attempt_${quizId}`)
        : null;

      // Start or resume attempt via API
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/quizzes/attempt", {
        method: "POST",
        headers,
        body: JSON.stringify({
          quizId,
          timeLimitMinutes: quizData.timeLimitMinutes,
          resumeAttemptId: savedAttemptId || undefined,
        }),
      });

      const attemptData = await res.json();
      if (attemptData.success && attemptData.attempt) {
        const loadedAttempt: QuizAttempt = attemptData.attempt;
        setAttempt(loadedAttempt);

        if (typeof window !== "undefined") {
          sessionStorage.setItem(`pencill_active_attempt_${quizId}`, loadedAttempt.id);
        }

        // If attempt was already finalized/submitted, show results directly
        if (loadedAttempt.status === "submitted" && loadedAttempt.scoringMetadata) {
          setSubmissionResult(loadedAttempt.scoringMetadata);
          setSecondsRemaining(0);
        } else {
          // In progress: calculate remaining time from authoritative deadline
          const deadlineMs = new Date(loadedAttempt.deadline).getTime();
          const initialRemaining = Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));
          setSecondsRemaining(initialRemaining);

          if (loadedAttempt.answers) {
            setSelectedAnswers(loadedAttempt.answers);
          }

          if (loadedAttempt.flaggedQuestions && Array.isArray(loadedAttempt.flaggedQuestions)) {
            const flagMap: Record<number, boolean> = {};
            loadedAttempt.flaggedQuestions.forEach((qIdx) => {
              flagMap[qIdx - 1] = true;
            });
            setFlaggedQuestions(flagMap);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load quiz session:", err);
      setFetchError("Unable to establish quiz session. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  }, [quizId, session?.access_token]);

  useEffect(() => {
    if (quizId) {
      initializeQuizSession();
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [quizId, initializeQuizSession]);

  const handleRetakeQuiz = async () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(`pencill_active_attempt_${quizId}`);
    }
    setSubmissionResult(null);
    setSelectedAnswers({});
    setFlaggedQuestions({});
    setCurrentQIndex(0);
    setSecondsRemaining(null);
    await initializeQuizSession(true);
  };

  const executeSubmission = useCallback(
    async (isAutoExpired = false) => {
      if (!quiz || !attempt || isSubmitting) return;
      setIsSubmitting(true);
      setShowSubmitConfirm(false);

      try {
        const durationSeconds = (quiz.timeLimitMinutes || 20) * 60;
        const spent = secondsRemaining !== null ? Math.max(0, durationSeconds - secondsRemaining) : 0;

        const flaggedIndices = Object.keys(flaggedQuestions)
          .filter((k) => flaggedQuestions[Number(k)])
          .map((k) => Number(k) + 1);

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        const res = await fetch("/api/quizzes/submit", {
          method: "POST",
          headers,
          body: JSON.stringify({
            attemptId: attempt.id,
            quizId: quiz.id,
            answers: selectedAnswers,
            flaggedQuestions: flaggedIndices,
            timeSpentSeconds: spent,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Grading submission failed.");
        }

        setSubmissionResult(data.result);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

        // Update progress in course if quiz is associated with a course
        if (quiz.courseId) {
          try {
            const courseProg = (await storageAdapter.getProgress(quiz.courseId)) || {
              completedLessonIds: [],
              hoursLogged: 0,
              quizScores: {},
              flashcardState: {},
              pathId: quiz.courseId,
              lastAccessed: new Date().toISOString(),
            };
            const nextQuizScores = {
              ...(courseProg.quizScores || {}),
              [quiz.id]: { score: data.result.earnedScore, total: 100, date: new Date().toISOString() },
              ...(quiz.moduleId ? { [quiz.moduleId]: { score: data.result.earnedScore, total: 100, date: new Date().toISOString() } } : {}),
            };

            const pathData = await storageAdapter.getSavedPathById(quiz.courseId);
            const nextCompletedIds = new Set(courseProg.completedLessonIds || []);
            if (pathData?.modules) {
              for (const mod of pathData.modules) {
                if (!quiz.moduleId || mod.id === quiz.moduleId) {
                  for (const l of mod.lessons || []) {
                    if (l.type === 'quiz' || (l.sourceUrl && l.sourceUrl.includes(quiz.id))) {
                      nextCompletedIds.add(l.id);
                    }
                  }
                }
              }
            }

            await storageAdapter.updateProgress(quiz.courseId, {
              quizScores: nextQuizScores as any,
              completedLessonIds: Array.from(nextCompletedIds),
              lastAccessed: new Date().toISOString(),
            });
          } catch (progErr) {
            console.warn("[practice] Notice updating course progress after quiz:", progErr);
          }
        }

        setToastState({
          open: true,
          message: isAutoExpired
            ? `Quiz auto-submitted. Score: ${data.result.accuracyPercent}%`
            : `Checkpoint graded! Accuracy: ${data.result.accuracyPercent}% (${data.result.correctCount}/${data.result.totalQuestions} correct)`,
        });
      } catch (err: unknown) {
        console.error("Submission failed:", err);
        setToastState({
          open: true,
          message: err instanceof Error ? err.message : "Error grading assessment.",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [quiz, attempt, isSubmitting, secondsRemaining, flaggedQuestions, session?.access_token, selectedAnswers]
  );

  // 2. Countdown Timer Sync
  const handleAutoSubmit = useCallback(async () => {
    if (isSubmitting || submissionResult) return;
    setToastState({
      open: true,
      message: "Time allocated for this checkpoint has expired. Submitting responses...",
    });
    await executeSubmission(true);
  }, [isSubmitting, submissionResult, executeSubmission]);

  useEffect(() => {
    if (submissionResult || secondsRemaining === null) return;

    if (secondsRemaining <= 0) {
      handleAutoSubmit();
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      if (attempt?.deadline) {
        const deadlineMs = new Date(attempt.deadline).getTime();
        const remaining = Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));
        setSecondsRemaining(remaining);
        if (remaining <= 0) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          handleAutoSubmit();
        }
      } else {
        setSecondsRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [secondsRemaining, attempt?.deadline, submissionResult, handleAutoSubmit]);

  // Sync answer selection to backend
  const syncAnswerUpdate = useCallback(
    async (qId: string, optionId: string | null, isFlg: boolean) => {
      if (!attempt?.id) return;
      try {
        await fetch("/api/quizzes/attempt", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId: attempt.id,
            questionId: qId,
            selectedOption: optionId,
            isFlagged: isFlg,
          }),
        });
      } catch {
        // Non-blocking sync
      }
    },
    [attempt?.id]
  );

  const currentQuestion = quiz?.questions[currentQIndex] || null;

  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) return;
    const nextAnswers = { ...selectedAnswers, [currentQuestion.id]: optionId };
    setSelectedAnswers(nextAnswers);
    syncAnswerUpdate(currentQuestion.id, optionId, !!flaggedQuestions[currentQIndex]);
  };

  const handleToggleFlag = () => {
    if (!currentQuestion) return;
    const nextFlag = !flaggedQuestions[currentQIndex];
    setFlaggedQuestions((prev) => ({ ...prev, [currentQIndex]: nextFlag }));
    syncAnswerUpdate(currentQuestion.id, selectedAnswers[currentQuestion.id] || null, nextFlag);
    setToastState({
      open: true,
      message: nextFlag
        ? `Question ${currentQIndex + 1} flagged for review.`
        : `Flag removed from Question ${currentQIndex + 1}.`,
    });
  };

  const handleClear = () => {
    if (!currentQuestion) return;
    const nextAnswers = { ...selectedAnswers };
    delete nextAnswers[currentQuestion.id];
    setSelectedAnswers(nextAnswers);
    syncAnswerUpdate(currentQuestion.id, null, !!flaggedQuestions[currentQIndex]);
  };

  const handleNext = () => {
    if (!quiz) return;
    if (currentQIndex < quiz.questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      setShowSubmitConfirm(true);
    }
  };

  const handlePrev = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(currentQIndex - 1);
    }
  };

  const formatTimer = (totalSecs: number | null) => {
    if (totalSecs === null) return "00:00";
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto w-full pb-space-xl animate-pulse">
        <div className="h-16 bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          <div className="lg:col-span-8 h-96 bg-surface-container-lowest rounded-2xl border border-surface-container-high/60" />
          <div className="lg:col-span-4 h-80 bg-surface-container-lowest rounded-2xl border border-surface-container-high/60" />
        </div>
      </div>
    );
  }

  if (fetchError || !quiz || quiz.questions.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 bg-surface-container-lowest p-8 rounded-2xl border border-surface-container-high shadow-sm text-center space-y-4">
        <span className="material-symbols-outlined text-4xl text-error">assignment_late</span>
        <h2 className="font-headline-md text-headline-md font-serif text-primary">
          Assessment Not Found
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {fetchError || "The requested diagnostic checkpoint could not be retrieved from the database."}
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            href="/practice"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-xl font-label-md font-semibold hover:bg-primary-container transition-colors text-xs"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Return to Quizzes</span>
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: Results & Analytics Screen (Phase 9)
  // =========================================================================
  if (submissionResult) {
    const isPassing = submissionResult.accuracyPercent >= 70;

    return (
      <div className="max-w-5xl mx-auto w-full pb-space-xl space-y-6">
        <Toast
          isOpen={toastState.open}
          message={toastState.message}
          onClose={() => setToastState({ open: false, message: "" })}
        />

        {/* Results Header */}
        <header className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-secondary">
              <span className="material-symbols-outlined text-base">verified</span>
              <span>Assessment Completed &amp; Graded</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg font-serif text-primary">
              {quiz.title}
            </h1>
            <p className="text-body-sm text-on-surface-variant">
              {quiz.subject || quiz.courseTitle} • Evaluated by Pencill Pedagogical Engine
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {quiz.courseId && (
              <Link
                href={`/courses/${quiz.courseId}`}
                className="px-4 py-2.5 bg-primary/10 text-primary font-semibold rounded-xl hover:bg-primary/20 transition-colors text-xs inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">school</span>
                <span>Return to Course</span>
              </Link>
            )}
            <Link
              href="/practice"
              className="px-4 py-2.5 bg-surface-container text-on-surface font-semibold rounded-xl hover:bg-surface-container-high transition-colors text-xs inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>All Quizzes</span>
            </Link>
            <Link
              href="/progress"
              className="px-4 py-2.5 bg-primary text-on-primary font-semibold rounded-xl hover:bg-primary-container transition-colors text-xs inline-flex items-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">analytics</span>
              <span>View Progress</span>
            </Link>
          </div>
        </header>

        {/* Score KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high/60 shadow-xs text-center space-y-1">
            <span className="text-xs text-on-surface-variant font-medium">Overall Accuracy</span>
            <div className={`text-3xl font-bold font-serif ${isPassing ? "text-primary" : "text-error"}`}>
              {submissionResult.accuracyPercent}%
            </div>
            <span className="text-[11px] text-on-surface-variant block">
              {submissionResult.accuracyPercent >= 85
                ? "Mastery"
                : submissionResult.accuracyPercent >= 60
                ? "Proficient"
                : "Foundational Practice"}
            </span>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high/60 shadow-xs text-center space-y-1">
            <span className="text-xs text-on-surface-variant font-medium">Correct Answers</span>
            <div className="text-3xl font-bold font-serif text-emerald-600">
              {submissionResult.correctCount} / {submissionResult.totalQuestions}
            </div>
            <span className="text-[11px] text-on-surface-variant block">Authoritative Matches</span>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high/60 shadow-xs text-center space-y-1">
            <span className="text-xs text-on-surface-variant font-medium">Errors &amp; Unanswered</span>
            <div className="text-3xl font-bold font-serif text-amber-600">
              {submissionResult.incorrectCount + submissionResult.unansweredCount}
            </div>
            <span className="text-[11px] text-on-surface-variant block">
              {submissionResult.incorrectCount} incorrect, {submissionResult.unansweredCount} skipped
            </span>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high/60 shadow-xs text-center space-y-1">
            <span className="text-xs text-on-surface-variant font-medium">Time Taken</span>
            <div className="text-3xl font-bold font-serif text-secondary">
              {Math.max(1, Math.round(submissionResult.timeSpentSeconds / 60))}m
            </div>
            <span className="text-[11px] text-on-surface-variant block">
              of {submissionResult.allocatedMinutes} min allocated
            </span>
          </div>
        </div>

        {/* Adaptive Pedagogical Recommendations (Phase 10) */}
        {submissionResult.recommendations.length > 0 && (
          <div className="bg-surface-container-low p-6 rounded-2xl border border-secondary/30 space-y-3">
            <div className="flex items-center gap-2 text-secondary font-semibold text-sm">
              <span className="material-symbols-outlined text-lg">auto_awesome</span>
              <span>Personalized Study Guidance</span>
            </div>
            <div className="space-y-2">
              {submissionResult.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-on-surface leading-relaxed">
                  <span className="material-symbols-outlined text-sm text-secondary mt-0.5 shrink-0">
                    arrow_right
                  </span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>

            {submissionResult.topicBreakdown.length > 1 && (
              <div className="pt-3 border-t border-surface-container-high/60 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {submissionResult.topicBreakdown.map((tb, idx) => (
                  <div key={idx} className="bg-surface-container-lowest p-3 rounded-xl border border-surface-container-high/40 text-xs">
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="truncate">{tb.topic}</span>
                      <span className="text-primary font-mono">{tb.percentage}%</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          tb.percentage >= 70 ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${tb.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Question-by-Question Deep Dive Review (Phase 9) */}
        <section className="space-y-4">
          <h2 className="font-headline-sm text-headline-sm font-sans font-semibold text-primary">
            Question-by-Question Diagnostic Review
          </h2>

          <div className="space-y-4">
            {submissionResult.questionReview.map((rev) => {
              const isCorrect = rev.isCorrect;
              const hasResponse = rev.selectedOptionId !== null;

              return (
                <article
                  key={rev.questionId}
                  className={`p-6 rounded-2xl border bg-surface-container-lowest shadow-xs space-y-4 ${
                    isCorrect
                      ? "border-emerald-500/40"
                      : hasResponse
                      ? "border-error/40"
                      : "border-surface-container-high/80"
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                          isCorrect
                            ? "bg-emerald-100 text-emerald-800"
                            : hasResponse
                            ? "bg-rose-100 text-rose-800"
                            : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        Question {rev.questionNumber.toString().padStart(2, "0")}
                      </span>
                      <span className="text-xs text-on-surface-variant font-medium">
                        {rev.subtopic || "Concept Review"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      {isCorrect ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <span className="material-symbols-outlined text-base">check_circle</span>
                          <span>Correct</span>
                        </span>
                      ) : hasResponse ? (
                        <span className="text-error flex items-center gap-1">
                          <span className="material-symbols-outlined text-base">cancel</span>
                          <span>Incorrect</span>
                        </span>
                      ) : (
                        <span className="text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-base">help</span>
                          <span>Unanswered</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <p className="font-body-md text-on-surface leading-relaxed font-serif text-base">
                    {rev.prompt}
                  </p>

                  {/* Options List with Visual Review */}
                  <div className="space-y-2 pt-1">
                    {rev.options.map((opt) => {
                      const isStudentPick = rev.selectedOptionId === opt.id;
                      const isCorrectPick = rev.correctOptionId === opt.id;

                      let rowStyle = "bg-surface-container-low/50 border-surface-container-high/40 text-on-surface";
                      if (isCorrectPick) {
                        rowStyle = "bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500 font-medium";
                      } else if (isStudentPick && !isCorrectPick) {
                        rowStyle = "bg-rose-50 border-error text-rose-950 ring-1 ring-error";
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${rowStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-bold font-mono text-sm">{opt.id}.</span>
                            <span className="text-sm font-serif">{opt.text}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isStudentPick && !isCorrectPick && (
                              <span className="px-2 py-0.5 rounded bg-error text-white text-[10px] font-bold uppercase">
                                Your Choice
                              </span>
                            )}
                            {isCorrectPick && (
                              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold uppercase">
                                Correct Answer
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Authoritative Explanation (Phase 9) */}
                  {rev.explanation && (
                    <div className="p-4 bg-surface-container-low rounded-xl border border-surface-container-high/60 space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-primary font-semibold">
                        <span className="material-symbols-outlined text-base">lightbulb</span>
                        <span>Authoritative Pedagogical Explanation</span>
                      </div>
                      <p className="text-on-surface-variant leading-relaxed font-sans">
                        {rev.explanation}
                      </p>
                      {rev.formulaReference && (
                        <p className="font-mono text-xs text-secondary pt-1">
                          Reference: {rev.formulaReference}
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* Footer Actions */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-surface-container-high/60">
          <Link
            href="/practice"
            className="w-full sm:w-auto px-6 py-2.5 bg-surface-container text-primary rounded-xl font-label-md font-semibold hover:bg-surface-container-high text-xs text-center"
          >
            Return to Quizzes
          </Link>
          <button
            type="button"
            onClick={handleRetakeQuiz}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary text-on-primary rounded-xl font-label-md font-semibold hover:bg-primary-container text-xs shadow-xs text-center"
          >
            Retake Assessment
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: Interactive Quiz-Taking Interface (Phase 6 & 7)
  // =========================================================================
  const question = quiz.questions[currentQIndex];
  const isFlagged = Boolean(flaggedQuestions[currentQIndex]);
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent = quiz.totalQuestions > 0 ? Math.round((answeredCount / quiz.totalQuestions) * 100) : 0;
  const isTimeCritical = secondsRemaining !== null && secondsRemaining < 120;

  return (
    <div className="max-w-6xl mx-auto w-full pb-space-xl">
      <Toast
        isOpen={toastState.open}
        message={toastState.message}
        onClose={() => setToastState({ open: false, message: "" })}
      />

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface-container-lowest border border-surface-container-high rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-secondary">
              <span className="material-symbols-outlined text-3xl">fact_check</span>
              <h3 className="font-headline-sm text-headline-sm font-serif text-primary">
                Submit Diagnostic Quiz?
              </h3>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              You have answered <strong className="text-primary">{answeredCount}</strong> of{" "}
              <strong className="text-primary">{quiz.totalQuestions}</strong> questions.
              {answeredCount < quiz.totalQuestions && (
                <span className="text-error block mt-1">
                  Notice: {quiz.totalQuestions - answeredCount} unanswered questions will be marked incorrect.
                </span>
              )}
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-container-high/40">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
              >
                Review Answers
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => executeSubmission(false)}
                className="px-5 py-2.5 bg-secondary text-on-secondary rounded-xl text-xs font-semibold hover:bg-secondary-container hover:text-on-secondary-container transition-all shadow-xs"
              >
                {isSubmitting ? "Grading..." : "Confirm & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Workspace Header */}
      <header className="mb-space-lg flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border-b border-surface-container-high/60 pb-space-md">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-1">
            <Link href="/practice" className="hover:text-primary transition-colors">
              Practice
            </Link>
            {quiz.courseId && (
              <>
                <span>/</span>
                <Link href={`/courses/${quiz.courseId}`} className="hover:text-primary transition-colors truncate max-w-[200px]">
                  {quiz.courseTitle}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-secondary font-semibold">Formative Checkpoint</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary font-serif">
            {quiz.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Real Countdown Timer (Phase 7) */}
          <div
            className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-label-md transition-colors ${
              isTimeCritical
                ? "bg-error/10 border-error text-error animate-pulse"
                : "bg-surface-container-low border-surface-container-high/60 text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-base">timer</span>
            <span className="font-mono font-bold text-sm">{formatTimer(secondsRemaining)}</span>
            <span className="text-on-surface-variant text-[11px]">remaining</span>
          </div>

          <button
            type="button"
            onClick={() => setShowSubmitConfirm(true)}
            disabled={isSubmitting}
            className="px-4 py-2 bg-secondary text-on-secondary rounded-xl font-label-md font-semibold hover:bg-secondary-container hover:text-on-secondary-container transition-colors shadow-xs text-xs disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </button>
        </div>
      </header>

      {/* Main Examination Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left 8-Cols: Question Canvas */}
        <article className="lg:col-span-8 bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-container-high/60 space-y-space-md">
          {/* Question Meta Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="bg-primary text-on-primary font-label-md text-label-md px-2.5 py-0.5 rounded font-semibold text-xs">
                Question {question.questionNumber.toString().padStart(2, "0")}
              </span>
              <span className="text-on-surface-variant font-label-sm text-xs">
                of {quiz.totalQuestions} • {question.difficulty || quiz.difficulty || "Standard"}
              </span>
            </div>

            <button
              type="button"
              onClick={handleToggleFlag}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-label-md text-xs transition-colors ${
                isFlagged
                  ? "bg-secondary-container/40 text-on-secondary-container font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {isFlagged ? "flag_circle" : "flag"}
              </span>
              <span>{isFlagged ? "Flagged" : "Flag for Review"}</span>
            </button>
          </div>

          {/* Stepper Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-on-surface-variant text-xs">
              <span>Overall Progress</span>
              <span className="font-semibold text-primary">
                {progressPercent}% Answered ({answeredCount}/{quiz.totalQuestions})
              </span>
            </div>
            <div
              className="grid gap-1.5"
              style={{
                gridTemplateColumns: `repeat(${Math.max(quiz.totalQuestions, 2)}, minmax(0, 1fr))`,
              }}
            >
              {quiz.questions.map((q, idx) => {
                const isAnswered = selectedAnswers[q.id] !== undefined;
                const isCurrent = currentQIndex === idx;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentQIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      isCurrent
                        ? "bg-primary-container ring-2 ring-primary/40"
                        : isAnswered
                        ? "bg-secondary"
                        : "bg-surface-container hover:bg-surface-container-high"
                    }`}
                    title={`Question ${idx + 1}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Question Stem */}
          <div className="space-y-space-sm pt-2">
            <p className="font-headline-md text-headline-md text-on-surface leading-relaxed font-serif text-lg sm:text-xl">
              {question.prompt}
            </p>

            {question.stemNote && (
              <div className="bg-surface-container-low p-space-sm rounded-xl flex items-center gap-2 text-on-surface-variant text-xs border border-surface-container-high/40">
                <span className="material-symbols-outlined text-base text-secondary">info</span>
                <span>{question.stemNote}</span>
              </div>
            )}
          </div>

          {/* Multiple Choice Options */}
          <fieldset className="space-y-3 pt-2">
            <legend className="sr-only">Select answer for Question {question.questionNumber}</legend>
            {question.options.map((opt) => {
              const isSelected = selectedAnswers[question.id] === opt.id;

              return (
                <label
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  className={`group flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? "bg-surface-container shadow-sm border-primary ring-1 ring-primary text-on-surface"
                      : "bg-surface-container-lowest hover:bg-surface-container-low text-on-surface border-surface-container-high/60 shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="radio"
                      name={`question_${question.id}`}
                      value={opt.id}
                      checked={isSelected}
                      onChange={() => handleSelectOption(opt.id)}
                      className="w-4 h-4 text-primary accent-primary cursor-pointer"
                    />
                    <span className="font-label-lg text-sm font-bold text-primary font-mono">
                      {opt.id}.
                    </span>
                    <span className="font-body-lg text-sm sm:text-base font-serif">
                      {opt.text}
                    </span>
                  </div>

                  {isSelected && (
                    <span className="font-label-sm text-xs text-secondary font-semibold bg-surface-container-lowest px-2.5 py-0.5 rounded-full shadow-xs">
                      Selected
                    </span>
                  )}
                </label>
              );
            })}
          </fieldset>

          {/* Action Footer */}
          <footer className="pt-space-md border-t border-surface-container-high/40 flex flex-wrap items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentQIndex === 0}
                className="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-semibold text-xs flex items-center gap-1.5 disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>Previous Question</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-3.5 py-2.5 rounded-xl text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors text-xs"
              >
                Clear Response
              </button>
            </div>

            <div className="flex items-center gap-space-sm">
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary hover:bg-primary font-semibold text-xs transition-all shadow-sm flex items-center gap-2"
              >
                <span>
                  {currentQIndex === quiz.questions.length - 1 ? "Review & Finish" : "Save & Next"}
                </span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </footer>
        </article>

        {/* Right 4-Cols: Question Palette & Reference */}
        <aside className="lg:col-span-4 space-y-space-md">
          {/* Question Palette Navigator (Phase 6) */}
          <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm border border-surface-container-high/60 space-y-space-sm">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high/40">
              <h2 className="font-headline-sm text-sm font-bold text-on-surface font-sans">
                Question Palette
              </h2>
              <span className="text-xs text-on-surface-variant font-mono">
                {quiz.totalQuestions} Questions
              </span>
            </div>

            {/* Dynamic Grid */}
            <div
              className="grid gap-2 pt-1"
              style={{
                gridTemplateColumns: `repeat(${Math.min(quiz.totalQuestions, 5)}, minmax(0, 1fr))`,
              }}
            >
              {quiz.questions.map((q, idx) => {
                const isAnswered = selectedAnswers[q.id] !== undefined;
                const isCurrent = currentQIndex === idx;
                const flagged = flaggedQuestions[idx];

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentQIndex(idx)}
                    className={`h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center relative ${
                      isCurrent
                        ? "bg-primary text-on-primary ring-2 ring-primary/40 shadow-xs"
                        : flagged
                        ? "bg-secondary-container text-on-secondary-fixed ring-1 ring-secondary"
                        : isAnswered
                        ? "bg-secondary text-on-secondary"
                        : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                    }`}
                  >
                    {(idx + 1).toString().padStart(2, "0")}
                    {flagged && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-error" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Palette Legend */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-surface-container-high/40 text-[11px] text-on-surface-variant">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span>Current Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-surface-container border" />
                <span>Unvisited</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-error" />
                <span>Flagged</span>
              </div>
            </div>
          </div>

          {/* Reference & Formulas Drawer */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowFormulaDrawer(!showFormulaDrawer)}
              className="w-full p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-base">functions</span>
                <span className="text-xs font-bold text-on-surface">
                  {quiz.subject || "Academic"} Reference Sheet
                </span>
              </div>
              <span className="material-symbols-outlined text-sm text-on-surface-variant">
                {showFormulaDrawer ? "expand_less" : "expand_more"}
              </span>
            </button>

            {showFormulaDrawer && (
              <div className="p-4 pt-0 text-xs space-y-2 border-t border-surface-container-high/40 bg-surface-container-low/30">
                <div className="p-3 bg-surface-container-lowest rounded-xl border border-surface-container-high/40 text-xs space-y-1.5 font-sans">
                  {question.formulaReference ? (
                    <p className="font-semibold text-primary font-serif">{question.formulaReference}</p>
                  ) : null}
                  {question.hint ? (
                    <div className="text-on-surface-variant flex items-start gap-1">
                      <span className="material-symbols-outlined text-sm text-secondary shrink-0">help</span>
                      <span>{question.hint}</span>
                    </div>
                  ) : (
                    <p className="text-on-surface-variant italic">
                      Apply verified conservation laws and axiomatic definitions to resolve this item.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
