"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/ui/EmptyState";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { getUserProgress, getCompletedLessonIds } from "@/services/supabase/progressService";
import { getLearningPathById, getLearningPaths } from "@/services/supabase/pathService";
import { getUserEnrollments } from "@/services/supabase/enrollmentService";
import { storageAdapter } from "@/lib/storage/storageAdapter";
import { LearningPath, ProgressMetrics, Lesson } from "@/types";
import LearningAutopilotWidget from "@/components/autopilot/LearningAutopilotWidget";

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user, profile, session } = useAuth();
  const [goalQuery, setGoalQuery] = useState("");
  const [paths, setPaths] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<ProgressMetrics | null>(null);
  const [activeCourseDetails, setActiveCourseDetails] = useState<any | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeDraft, setActiveDraft] = useState<any | null>(null);
  const [recommendedCourses, setRecommendedCourses] = useState<LearningPath[]>([]);

  useEffect(() => {
    let isMounted = true;
    storageAdapter.getDraft().then((draft) => {
      if (isMounted) {
        if (draft && (draft as any).domainId) {
          setActiveDraft(draft);
        } else {
          setActiveDraft(null);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    const handleAuthReset = () => {
      setPaths([]);
      setMetrics(null);
      setActiveCourseDetails(null);
      setCompletedLessonIds([]);
      setActiveDraft(null);
      setRecommendedCourses([]);
    };
    window.addEventListener("pencill:auth-state-reset", handleAuthReset);
    return () => window.removeEventListener("pencill:auth-state-reset", handleAuthReset);
  }, []);

  const userDomain = (profile as any)?.domain;

  useEffect(() => {
    let mounted = true;

    async function loadDashboardData() {
      try {
        let enrolledCourses: any[] = [];
        let userProgress: any = null;

        try {
          const [enrollments, prog] = await Promise.all([
            getUserEnrollments(user?.id || null, { accessToken: session?.access_token }),
            getUserProgress(user?.id || null),
          ]);
          enrolledCourses = enrollments
            .map((e) => e.course)
            .filter((c): c is LearningPath => Boolean(c));
          userProgress = prog;
        } catch (e) {
          console.warn("[Dashboard] Supabase progress unavailable, loading from storageAdapter:", e);
        }

        // Strict multi-user data isolation:
        // Authenticated users only see their own verified enrolled courses.
        let finalCourses: LearningPath[] = [];
        if (user?.id) {
          finalCourses = enrolledCourses;
        } else {
          // Guest-only fallback to guest-scoped storage
          const localSaved = await storageAdapter.getSavedPaths();
          const combinedMap = new Map<string, any>();
          enrolledCourses.forEach((c) => combinedMap.set(c.id, c));
          localSaved.forEach((c) => {
            if (!combinedMap.has(c.id)) {
              combinedMap.set(c.id, c);
            }
          });
          finalCourses = Array.from(combinedMap.values());
        }

        if (mounted) {
          setPaths(finalCourses);
          setMetrics(userProgress);
        }

        const primaryCourse = finalCourses[0];
        if (primaryCourse) {
          let details: any = null;
          let completed: string[] = [];

          try {
            details = await getLearningPathById(primaryCourse.id);
            completed = await getCompletedLessonIds(user?.id || null, primaryCourse.id);
          } catch {}

          if (!details) {
            details = primaryCourse;
            const prog = await storageAdapter.getProgress(primaryCourse.id);
            if (prog) completed = prog.completedLessonIds || [];
          }

          if (mounted) {
            setActiveCourseDetails(details);
            setCompletedLessonIds(completed);
          }
        } else {
          if (mounted) {
            setActiveCourseDetails(null);
            setCompletedLessonIds([]);
          }
        }

        try {
          const catalog = await getLearningPaths({
            domain: userDomain || undefined,
          });
          const enrolledIds = new Set(finalCourses.map((c: any) => c.id));
          const unEnrolled = catalog.filter((c) => !enrolledIds.has(c.id));
          if (mounted) {
            setRecommendedCourses(unEnrolled.slice(0, 2));
          }
        } catch {
          // Non-blocking recommended paths retrieval
        }
      } catch (e) {
        console.error("Error loading dashboard data:", e);
      } finally {
        if (mounted) {
          setLoadingData(false);
        }
      }
    }

    loadDashboardData();

    const handleEnrollmentChanged = () => {
      loadDashboardData();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("pencill:enrollment-changed", handleEnrollmentChanged);
    }

    return () => {
      mounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("pencill:enrollment-changed", handleEnrollmentChanged);
      }
    };
  }, [user?.id, session?.access_token, userDomain]);

  const activeCourse = activeCourseDetails || paths[0] || null;

  const allLessons: Lesson[] =
    activeCourse?.modules?.flatMap((m: any) => m.lessons || m.resources || []) || [];
  const nextLesson = allLessons.find((l) => !completedLessonIds.includes(l.id)) || allLessons[0];
  const isAllCompleted =
    allLessons.length > 0 && allLessons.every((l) => completedLessonIds.includes(l.id));

  const totalResourcesCount = allLessons.length;
  const completedResourcesCount = completedLessonIds.length;
  const courseCompletionPercent =
    totalResourcesCount > 0
      ? Math.round((completedResourcesCount / totalResourcesCount) * 100)
      : metrics?.overallPercent ?? 0;

  const displayName = profile?.name || user?.user_metadata?.full_name || (user?.email ? user.email.split("@")[0] : "Scholar");
  const userGrade = profile?.grade || "Self-Paced Learner";
  const streakDays = profile?.streakDays ?? metrics?.streakDays ?? 0;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (goalQuery.trim()) {
      router.push(`/new-goal?goal=${encodeURIComponent(goalQuery.trim())}`);
    } else {
      router.push("/new-goal");
    }
  };

  const handleDownloadSummary = () => {
    const summaryData = {
      scholar: displayName,
      grade: userGrade,
      streakDays,
      activeCourse: activeCourse?.title || "N/A",
      progress: `${courseCompletionPercent}%`,
      completedLessons: completedResourcesCount,
      weeklyStudyHours: (metrics as any)?.weeklyLoggedHours ?? metrics?.totalHoursInvested ?? 0,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(summaryData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pencill_study_summary_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loadingData) {
    return (
      <AuthGuard>
        <div className="flex flex-col gap-space-xl pb-space-xl animate-pulse">
          <div className="h-64 bg-surface-container-lowest rounded-xl border border-surface-container-high/60" />
          <div className="h-24 bg-surface-container-lowest rounded-xl border border-surface-container-high/60" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-surface-container-lowest rounded-xl border border-surface-container-high/60" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-surface-container-lowest rounded-xl border border-surface-container-high/60" />
            ))}
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="flex flex-col w-full gap-y-space-xl pb-space-xl">
        {/* Unfinished Draft Alert Banner */}
        {activeDraft && (
          <div className="p-4 bg-secondary-container/40 border border-secondary/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-2xl">edit_note</span>
              <div>
                <h4 className="font-semibold text-primary text-sm font-serif">In-progress curriculum draft</h4>
                <p className="text-xs text-on-surface-variant">
                  {activeDraft.selectedTopics?.[0]?.label || activeDraft.topic || "Custom Learning Goal"} ({activeDraft.weeklyHours || 6}h/week)
                </p>
              </div>
            </div>
            <Link
              href="/new-goal"
              className="px-4 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shrink-0 transition-colors flex items-center gap-1 shadow-sm"
            >
              <span>Resume Builder</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        )}

        {/* AI Learning Autopilot */}
        <LearningAutopilotWidget />

        {/* 1. Top Greeting & Key Callout Area */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-y-space-md">
          <div className="space-y-1">
            <div className="flex items-center gap-space-sm">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container/30 text-secondary font-label-sm text-label-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                Academic Term 2024–25
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                {userGrade}
              </span>
            </div>
            <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight font-serif">
              Good morning, {displayName.split(" ")[0]}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              You are <span className="font-semibold text-primary">{courseCompletionPercent}% through</span> your weekly study target for{" "}
              {activeCourse?.title || "your active syllabus"}. Keep this steady cadence.
            </p>
          </div>

          <div className="flex items-center gap-space-sm">
            <Link
              href="/new-goal"
              className="inline-flex items-center gap-2 bg-primary-container text-on-primary px-space-md py-2.5 rounded-lg shadow-sm hover:bg-primary transition-all active:scale-[0.98] font-label-lg text-label-lg"
            >
              <span className="material-symbols-outlined text-lg">auto_awesome</span>
              <span>Create New Learning Path</span>
            </Link>
            <button
              onClick={handleDownloadSummary}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-surface-container-lowest text-on-surface-variant shadow-sm hover:bg-surface-container transition-colors border border-surface-container-high/60"
              title="Download Weekly Summary"
              type="button"
            >
              <span className="material-symbols-outlined text-xl">download</span>
            </button>
          </div>
        </header>

        {/* 2. Primary Course Focus Hero Card */}
        {activeCourse ? (
          <section className="relative overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high/60">
            {/* Ambient Lighting Gradients */}
            <div className="absolute -right-20 -top-24 w-96 h-96 bg-primary-fixed/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute right-32 bottom-0 w-64 h-64 bg-secondary-fixed/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative p-space-xl grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
              <div className="lg:col-span-8 flex flex-col gap-y-space-md">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/40 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">
                    <span className="material-symbols-outlined text-xs">adjust</span> Active Pathway
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                    {activeCourse.language || "English Medium"}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                    {activeCourse.targetExam || activeCourse.domain || "Academic Curricula"}
                  </span>
                </div>

                <div>
                  <span className="font-label-md text-label-md uppercase text-on-surface-variant tracking-wider font-semibold">
                    Curriculum Module 01
                  </span>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface mt-1 font-serif">
                    {activeCourse.title}
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1 leading-relaxed max-w-2xl">
                    {activeCourse.description || "Rigorous curriculum track curated from verified academic and open courseware repositories."}
                  </p>
                </div>

                {/* Progress Overview Bar */}
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center justify-between font-label-sm text-label-sm">
                    <span className="text-on-surface font-semibold">Overall Course Progress</span>
                    <span className="text-on-surface-variant">
                      <strong className="text-on-surface font-semibold">{courseCompletionPercent}% completed</strong> ·{" "}
                      {completedResourcesCount} of {totalResourcesCount || 32} resources
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                    <div
                      className="h-full bg-primary-container rounded-full transition-all duration-500"
                      style={{ width: `${courseCompletionPercent}%` }}
                    />
                  </div>
                </div>

                {/* Next Item Prompt */}
                {nextLesson && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low max-w-xl border border-surface-container-high/40">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-surface-container-lowest text-primary shadow-xs shrink-0">
                      <span className="material-symbols-outlined text-lg">
                        {isAllCompleted ? "verified" : "play_lesson"}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        {isAllCompleted ? "Track Status" : "Up next on syllabus"}
                      </span>
                      <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                        {isAllCompleted ? "All lessons cleared! Review or take diagnostic checkpoint." : nextLesson.title}
                        {nextLesson.durationMinutes ? ` (${nextLesson.durationMinutes} min)` : ""}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action CTA Buttons */}
                <div className="flex flex-wrap items-center gap-space-sm pt-2">
                  {nextLesson && (
                    <Link
                      href={`/learn/${activeCourse.id}/${nextLesson.id}`}
                      className="inline-flex items-center gap-2 bg-primary-container hover:bg-primary text-on-primary px-space-lg py-2.5 rounded-lg font-label-lg text-label-lg transition-all shadow-sm active:scale-[0.98]"
                    >
                      <span>Continue Learning</span>
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </Link>
                  )}
                  <Link
                    href={`/courses/${activeCourse.id}`}
                    className="inline-flex items-center gap-2 bg-surface-container hover:bg-surface-container-high text-on-surface px-space-md py-2.5 rounded-lg font-label-lg text-label-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">list_alt</span>
                    <span>View Full Syllabus</span>
                  </Link>
                </div>
              </div>

              {/* Hero Visual / Graphic Anchor */}
              <div className="lg:col-span-4 flex justify-center lg:justify-end">
                <div className="relative w-full max-w-xs rounded-xl bg-surface-container-low p-space-md shadow-sm border border-surface-container-high/60">
                  <div className="relative h-44 w-full rounded-lg overflow-hidden bg-primary mb-3 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-container to-primary flex flex-col items-center justify-center p-4 text-center">
                      <span className="material-symbols-outlined text-4xl text-secondary-fixed mb-1">functions</span>
                      <span className="font-serif text-base font-bold text-white line-clamp-2">{activeCourse.title}</span>
                      <span className="text-xs text-primary-fixed-dim mt-1">
                        {activeCourse.modules?.length || 4} Modules · {totalResourcesCount || 32} Resources
                      </span>
                    </div>
                    <div className="absolute top-2 right-2 bg-surface-container-lowest/90 px-2 py-0.5 rounded text-[10px] font-label-sm text-on-surface font-semibold tracking-wider uppercase">
                      Core Syllabus
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">Weekly Milestone Target</span>
                    <p className="font-label-md text-label-md text-on-surface font-semibold truncate">
                      {nextLesson?.title || "Complete module checkpoint drill"}
                    </p>
                    <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm pt-1">
                      <span className="material-symbols-outlined text-sm text-secondary">timer</span>
                      <span>2.5 hours remaining this week</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-high/60">
            <EmptyState
              icon="school"
              title="No Active Learning Paths"
              description="You have not enrolled in any learning paths yet. Discover curricula in our open catalog or synthesize an AI-guided syllabus tailored to your exact academic goal."
              actionText="Synthesize Your First Path"
              actionHref="/new-goal"
            />
          </section>
        )}

        {/* 3. AI / Topic Pathway Generator Bar */}
        <section className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm border border-surface-container-high/60">
          <form onSubmit={handleGenerate} className="flex flex-col gap-space-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">psychology</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-serif">What do you want to learn today?</h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Instant syllabus &amp; lecture sequence generator</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 p-1.5 rounded-xl bg-surface-container-low border border-surface-container-high/40">
              <div className="relative flex-1 w-full flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-xl">school</span>
                <input
                  className="w-full pl-10 pr-3 py-2.5 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-container"
                  id="pathway-input"
                  type="text"
                  value={goalQuery}
                  onChange={(e) => setGoalQuery(e.target.value)}
                  placeholder="Organic Chemistry Class 12, Fast Fourier Transform, Linear Algebra..."
                />
              </div>
              <button
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-space-lg py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-on-background transition-all"
                type="submit"
              >
                <span className="material-symbols-outlined text-base">neurology</span>
                <span>Generate Pathway</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant mr-1">Suggested Focus Areas:</span>
              <button
                type="button"
                onClick={() => setGoalQuery("Class 11 Physics")}
                className="px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors"
              >
                Class 11
              </button>
              <button
                type="button"
                onClick={() => setGoalQuery("Class 12 Chemistry")}
                className="px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors"
              >
                Class 12
              </button>
              <button
                type="button"
                onClick={() => setGoalQuery("Undergraduate Linear Algebra")}
                className="px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors"
              >
                College Undergrad
              </button>
              <button
                type="button"
                onClick={() => setGoalQuery("JEE Advanced Rotational Dynamics")}
                className="px-3 py-1 rounded-full bg-secondary-container/40 text-on-secondary-fixed-variant font-label-sm text-label-sm transition-colors font-medium"
              >
                GATE / JEE Target
              </button>
            </div>
          </form>
        </section>

        {/* 4. Learning Overview & Weekly Activity Stats (4 Stat Tiles + Streak Pill) */}
        <section className="space-y-space-md">
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <div className="space-y-0.5">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Weekly Diagnostic</span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-serif">Study Metrics &amp; Discipline</h2>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary-container/50 text-on-secondary-fixed font-label-lg text-label-lg shadow-sm font-semibold">
              <span className="text-base leading-none">🔥</span>
              <span>{streakDays}-Day Study Streak</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            {/* Stat 1: Enrolled Paths */}
            <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm border border-surface-container-high/60 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant font-medium">Enrolled Paths</span>
                <span className="material-symbols-outlined text-primary-container text-xl">route</span>
              </div>
              <div className="mt-space-md">
                <div className="flex items-baseline gap-2">
                  <span className="font-display-lg text-display-lg text-on-surface font-serif">
                    {paths.length < 10 ? `0${paths.length}` : paths.length}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Active modules</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  {activeCourse ? `${activeCourse.domain || "Academic"} pathway` : (userGrade || "Active Study Track")}
                </p>
              </div>
            </div>

            {/* Stat 2: Resources Completed */}
            <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm border border-surface-container-high/60 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant font-medium">Resources Completed</span>
                <span className="material-symbols-outlined text-secondary text-xl">fact_check</span>
              </div>
              <div className="mt-space-md">
                <div className="flex items-baseline gap-2">
                  <span className="font-display-lg text-display-lg text-on-surface font-serif">
                    {completedResourcesCount}
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold">
                    {completedResourcesCount > 0 ? `${completedResourcesCount} finished` : "Ready to start"}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Articles, videos, problem sets</p>
              </div>
            </div>

            {/* Stat 3: Weekly Study Hours */}
            <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm border border-surface-container-high/60 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant font-medium">Weekly Study Hours</span>
                <span className="material-symbols-outlined text-tertiary-container text-xl">schedule</span>
              </div>
              <div className="mt-space-md">
                <div className="flex items-baseline gap-2">
                  <span className="font-display-lg text-display-lg text-on-surface font-serif">
                    {(metrics as any)?.weeklyLoggedHours ?? metrics?.totalHoursInvested ?? 0}
                    <span className="font-label-lg text-label-lg text-on-surface-variant font-normal">h</span>
                  </span>
                  <span className="font-label-sm text-label-sm text-primary font-semibold">
                    Target: {(metrics as any)?.weeklyTargetHours || 10}h
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-container mt-2 overflow-hidden">
                  <div
                    className="h-full bg-primary-container rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((((metrics as any)?.weeklyLoggedHours ?? metrics?.totalHoursInvested ?? 0) /
                            ((metrics as any)?.weeklyTargetHours || 10)) *
                            100)
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Stat 4: Avg Quiz Score */}
            <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm border border-surface-container-high/60 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant font-medium">Avg Quiz Score</span>
                <span className="material-symbols-outlined text-primary text-xl">military_tech</span>
              </div>
              <div className="mt-space-md">
                <div className="flex items-baseline gap-2">
                  <span className="font-display-lg text-display-lg text-on-surface font-serif">
                    {metrics?.quizzesTaken && metrics.quizzesTaken > 0 ? `${metrics.quizAccuracy}%` : "—"}
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold">
                    {metrics?.quizzesTaken && metrics.quizzesTaken > 0
                      ? metrics?.quizAccuracyTier || "Evaluated"
                      : "Not yet assessed"}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  {metrics?.quizzesTaken && metrics.quizzesTaken > 0
                    ? `Across ${metrics.quizzesTaken} checkpoint ${
                        metrics.quizzesTaken === 1 ? "drill" : "drills"
                      }`
                    : "Complete checkpoint drills to measure accuracy"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. My Active Learning Paths (Course Cards Grid) */}
        {paths.length > 0 && (
          <section className="space-y-space-md">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Active Syllabus</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-serif">My Active Learning Paths</h2>
              </div>
              <Link
                href="/courses"
                className="font-label-lg text-label-lg text-primary hover:text-primary-container font-semibold inline-flex items-center gap-1 transition-colors"
              >
                <span>View all pathways</span>
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
              {paths.slice(0, 3).map((course, idx) => {
                const cLessons = course.modules?.flatMap((m: any) => m.lessons || m.resources || []) || [];
                const cCompleted = cLessons.filter((l: any) => completedLessonIds.includes(l.id)).length;
                const cPct =
                  cLessons.length > 0
                    ? Math.round((cCompleted / cLessons.length) * 100)
                    : idx === 0
                    ? courseCompletionPercent
                    : 0;
                const cHoursLeft = Math.max(1, Math.round((cLessons.length - cCompleted) * 0.75));
                const nextMilestone =
                  cLessons.find((l: any) => !completedLessonIds.includes(l.id))?.title ||
                  course.modules?.[0]?.lessons?.[0]?.title ||
                  "Fundamental Principles Review";

                return (
                  <article
                    key={course.id}
                    className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm border border-surface-container-high/60 flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-space-sm">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold">
                          {course.domain || "Academic"}
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          {course.level || "Self-Paced"} · {course.language || "English"}
                        </span>
                      </div>
                      <div className="pt-1">
                        <Link href={`/courses/${course.id}`}>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface line-clamp-1 font-serif hover:text-primary transition-colors">
                            {course.title}
                          </h3>
                        </Link>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2 leading-relaxed">
                          {course.description || "In-depth academic concepts, theoretical foundations, and problem sets."}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-surface-container-low text-on-surface space-y-1 border border-surface-container-high/40">
                        <span className="font-label-sm text-label-sm text-secondary font-semibold block">Next Milestone</span>
                        <p className="font-label-md text-label-md font-medium text-on-surface truncate">
                          {nextMilestone}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-space-sm mt-space-lg pt-space-sm">
                      <div className="flex items-center justify-between font-label-sm text-label-sm">
                        <span className="font-semibold text-on-surface">
                          {cPct}% completed
                        </span>
                        <span className="text-on-surface-variant">{course.durationHours || cHoursLeft} hrs left</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                        <div
                          className="h-full bg-primary-container rounded-full"
                          style={{ width: `${cPct}%` }}
                        />
                      </div>
                      <div className="pt-2 flex items-center justify-between">
                        <Link
                          href={`/courses/${course.id}`}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg hover:bg-primary transition-colors shadow-sm"
                        >
                          <span>Continue Path</span>
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* 6. Recommended Next Pathways (Dynamic Database & Catalog Recommendations) */}
        <section className="space-y-space-md mb-space-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">Personalized Recommendations</span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-serif">
                Recommended for Your {profile?.targetExam || profile?.grade || "Academic Journey"}
              </h2>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Calibrated from curriculum catalog and learning goals</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            {recommendedCourses.length > 0 ? (
              recommendedCourses.map((course) => {
                const totalLessons = course.modules?.reduce(
                  (acc: number, m: any) => acc + (m.lessons?.length || m.resources?.length || 0),
                  0
                ) || 0;
                return (
                  <div
                    key={course.id}
                    className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm border border-surface-container-high/60 flex flex-col sm:flex-row gap-space-md items-start"
                  >
                    <div className="w-full sm:w-32 h-28 rounded-lg overflow-hidden shrink-0 bg-primary-container flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-4xl text-secondary-fixed">
                        {course.domain?.toLowerCase().includes("math")
                          ? "calculate"
                          : course.domain?.toLowerCase().includes("code") || course.domain?.toLowerCase().includes("computer")
                          ? "terminal"
                          : course.domain?.toLowerCase().includes("medic") || course.domain?.toLowerCase().includes("bio")
                          ? "stethoscope"
                          : "auto_stories"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-label-sm bg-secondary-container/40 text-on-secondary-fixed-variant font-semibold">
                          {course.domain || "Academic"}
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          {course.modules?.length || 0} Modules · {totalLessons} Units
                        </span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface truncate font-serif">
                        {course.title}
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 leading-relaxed">
                        {course.description || "In-depth academic concepts, theoretical foundations, and problem sets."}
                      </p>
                      <div className="pt-2 flex items-center gap-space-sm">
                        <Link
                          href={`/courses/${course.id}`}
                          className="inline-flex items-center gap-1 text-primary hover:text-primary-container font-label-md text-label-md font-semibold"
                        >
                          <span>Explore Pathway</span>
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                        <span className="text-outline-variant">·</span>
                        <Link
                          href={`/new-goal?topic=${encodeURIComponent(course.title)}`}
                          className="font-label-md text-label-md text-on-surface-variant hover:text-primary"
                        >
                          Synthesize Custom Track
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <>
                {/* Fallback Synthesis Prompts if catalog has no unenrolled items */}
                <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm border border-surface-container-high/60 flex flex-col sm:flex-row gap-space-md items-start">
                  <div className="w-full sm:w-32 h-28 rounded-lg overflow-hidden shrink-0 bg-primary-container flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-4xl text-secondary-fixed">auto_awesome</span>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-label-sm bg-secondary-container/40 text-on-secondary-fixed-variant font-semibold">
                        Custom AI Synthesizer
                      </span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface truncate font-serif">
                      Design a New Rigorous Curriculum
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 leading-relaxed">
                      Generate structured pathways with verified master educators, problem sets, and interactive quizzes for any target domain.
                    </p>
                    <div className="pt-2 flex items-center gap-space-sm">
                      <Link
                        href="/new-goal"
                        className="inline-flex items-center gap-1 text-primary hover:text-primary-container font-label-md text-label-md font-semibold"
                      >
                        <span>Build Goal</span>
                        <span className="material-symbols-outlined text-sm">add</span>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm border border-surface-container-high/60 flex flex-col sm:flex-row gap-space-md items-start">
                  <div className="w-full sm:w-32 h-28 rounded-lg overflow-hidden shrink-0 bg-primary-container flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-4xl text-primary-fixed-dim">explore</span>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-label-sm bg-secondary-container/40 text-on-secondary-fixed-variant font-semibold">
                        Master Catalog
                      </span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface truncate font-serif">
                      Explore Published Curricula
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 leading-relaxed">
                      Browse peer-reviewed courses across mathematics, physics, engineering, computer science, and medical sciences.
                    </p>
                    <div className="pt-2 flex items-center gap-space-sm">
                      <Link
                        href="/explore"
                        className="inline-flex items-center gap-1 text-primary hover:text-primary-container font-label-md text-label-md font-semibold"
                      >
                        <span>Browse Catalog</span>
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </AuthGuard>
  );
}
