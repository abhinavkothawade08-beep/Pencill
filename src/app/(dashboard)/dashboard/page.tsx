"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MetricCard from "@/components/cards/MetricCard";
import PathCard from "@/components/cards/PathCard";
import EmptyState from "@/components/ui/EmptyState";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { getUserProgress, getCompletedLessonIds } from "@/services/supabase/progressService";
import { getLearningPathById } from "@/services/supabase/pathService";
import { getUserEnrollments } from "@/services/supabase/enrollmentService";
import { storageAdapter } from "@/lib/storage/storageAdapter";
import { LearningPath, ProgressMetrics, Lesson } from "@/types";

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

  useEffect(() => {
    storageAdapter.getDraft().then((draft) => {
      if (draft) setActiveDraft(draft);
    });
  }, []);

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

        // Merge with local saved paths
        const localSaved = await storageAdapter.getSavedPaths();
        const combinedMap = new Map<string, any>();
        enrolledCourses.forEach((c) => combinedMap.set(c.id, c));
        localSaved.forEach((c) => {
          if (!combinedMap.has(c.id)) {
            combinedMap.set(c.id, c);
          }
        });
        const finalCourses = Array.from(combinedMap.values());

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
  }, [user?.id, session?.access_token]);

  const activeCourse = activeCourseDetails || paths[0] || null;

  const allLessons: Lesson[] =
    activeCourse?.modules?.flatMap((m: any) => m.lessons || m.resources || []) || [];
  const nextLesson = allLessons.find((l) => !completedLessonIds.includes(l.id)) || allLessons[0];
  const isAllCompleted =
    allLessons.length > 0 && allLessons.every((l) => completedLessonIds.includes(l.id));

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (goalQuery.trim()) {
      router.push(`/new-goal?goal=${encodeURIComponent(goalQuery.trim())}`);
    } else {
      router.push("/new-goal");
    }
  };

  const handleChipClick = (tag: string) => {
    setGoalQuery(tag);
  };

  if (loadingData) {
    return (
      <AuthGuard>
        <div className="flex flex-col gap-space-xl pb-space-xl animate-pulse">
          <div className="h-64 bg-surface-container-lowest rounded-2xl border border-surface-container-high/60" />
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
      <div className="flex flex-col gap-space-xl pb-space-xl">
        {/* Unfinished Draft Alert Banner */}
        {activeDraft && (
          <div className="p-4 bg-secondary-container/40 border border-secondary/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-2xl">edit_note</span>
              <div>
                <h4 className="font-semibold text-primary text-sm">You have an in-progress curriculum draft</h4>
                <p className="text-xs text-on-surface-variant">
                  {activeDraft.selectedTopics?.[0]?.label || "Custom Learning Goal"} ({activeDraft.weeklyHours || 6}h/week)
                </p>
              </div>
            </div>
            <Link
              href="/new-goal"
              className="px-4 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shrink-0 transition-colors flex items-center gap-1"
            >
              <span>Resume Builder</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        )}

        {/* 1. Hero Banner: Current Active Course */}
        {activeCourse ? (
          <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high/60 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
              <div className="lg:col-span-8 flex flex-col justify-between space-y-space-md">
                <div>
                  <div className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-space-xs">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    <span className="text-secondary font-semibold">Active Curriculum Track</span>
                    <span>•</span>
                    <span>{activeCourse.domain || activeCourse.domainId || "Academic Track"}</span>
                  </div>
                  <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-serif">
                    {activeCourse.title}
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1 max-w-2xl leading-relaxed">
                    {activeCourse.description || "Rigorous academic pathway curated from verified open access repositories."}
                  </p>
                </div>

                {/* Progress Overview Bar */}
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center justify-between font-label-sm text-label-sm">
                    <span className="text-on-surface font-semibold">Overall Course Progress</span>
                    <span className="text-on-surface-variant">
                      <strong className="text-on-surface font-semibold">
                        {allLessons.length > 0
                          ? `${Math.round((completedLessonIds.length / allLessons.length) * 100)}% completed`
                          : metrics ? `${metrics.overallPercent}% completed` : "0% completed"}
                      </strong>{" "}
                      · {completedLessonIds.length} of {allLessons.length} units cleared
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                    <div
                      className="h-full bg-primary-container rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          allLessons.length > 0
                            ? Math.round((completedLessonIds.length / allLessons.length) * 100)
                            : metrics?.overallPercent || 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Next Item Prompt Card */}
                {nextLesson && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low max-w-xl border border-surface-container-high/40">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-surface-container-lowest text-primary shadow-xs">
                      <span className="material-symbols-outlined text-lg">
                        {isAllCompleted ? "verified" : "play_lesson"}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        {isAllCompleted
                          ? "Track Mastery Status"
                          : "Up next on syllabus"}
                      </span>
                      <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                        {isAllCompleted
                          ? "All lessons completed in this track! Review or start checkpoint."
                          : nextLesson.title}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-space-sm pt-2">
                  <Link
                    href={`/courses/${activeCourse.id}`}
                    className="inline-flex items-center gap-2 bg-primary text-on-primary hover:bg-primary-container px-space-lg py-2.5 rounded-lg font-label-lg text-label-lg transition-all shadow-sm active:scale-95"
                  >
                    <span>{isAllCompleted ? "Review Syllabus" : "Continue Learning"}</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </Link>
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
                  <div className="relative h-40 w-full rounded-lg overflow-hidden bg-primary mb-3 flex items-center justify-center text-white">
                    <div className="text-center p-4">
                      <p className="font-serif italic text-lg text-primary-fixed">
                        &quot;The direction of learning determines its depth.&quot;
                      </p>
                      <span className="font-label-sm text-label-sm text-secondary-fixed mt-1 block">
                        Pencill Academic Protocol
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-body-sm font-label-md">
                    <span className="text-on-surface-variant">Scholar Status:</span>
                    <span className="font-semibold text-primary">{profile?.tier || "Pro Path"}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high/60">
            <EmptyState
              icon="school"
              title="No Active Learning Paths"
              description="You have not enrolled in any learning paths yet. Discover curricula in our open catalog or synthesize an AI-guided syllabus tailored to your exact academic goal."
              actionText="Synthesize Your First Path"
              actionHref="/new-goal"
            />
          </section>
        )}

        {/* 2. Interactive Goal Generation Strip */}
        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container-high/60">
          <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-space-sm items-center">
            <div className="relative flex-1 w-full">
              <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-xl">
                auto_awesome
              </span>
              <input
                type="text"
                value={goalQuery}
                onChange={(e) => setGoalQuery(e.target.value)}
                placeholder="What academic goal do you wish to master? e.g. Quantum Computing Foundations, Abstract Algebra"
                className="w-full pl-10 pr-space-md py-2.5 bg-surface-container-low rounded-lg border border-surface-container-high font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full md:w-auto px-space-lg py-2.5 bg-primary text-on-primary hover:bg-primary-container rounded-lg font-label-lg text-label-lg transition-all shadow-sm shrink-0 flex items-center justify-center gap-2"
            >
              <span>Synthesize Path</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-space-xs mt-3 pt-3 border-t border-surface-container-high/40">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Recommended fields:</span>
            {["Thermodynamics", "Vector Calculus", "Organic Mechanisms", "Attention Models"].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleChipClick(tag)}
                className="px-2.5 py-1 rounded-md bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-primary font-label-sm text-label-sm transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        {/* 3. Metrics Section */}
        <section className="space-y-space-md">
          <h2 className="font-headline-md text-headline-md text-primary font-serif">
            Study Analytics &amp; Mastery Rollup
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            <MetricCard
              category="Curriculum Mastery"
              title="Overall Progress"
              value={
                allLessons.length > 0
                  ? `${Math.round((completedLessonIds.length / allLessons.length) * 100)}%`
                  : metrics ? `${metrics.overallPercent}%` : "0%"
              }
              subtext={`${completedLessonIds.length} units cleared`}
              icon="pie_chart"
              progressPercent={
                allLessons.length > 0
                  ? Math.round((completedLessonIds.length / allLessons.length) * 100)
                  : metrics?.overallPercent || 0
              }
            />
            <MetricCard
              category="Time Invested"
              title="Total Study Time"
              value={metrics?.totalHoursInvested || Math.round(completedLessonIds.length * 1.5) || 0}
              unit="Hours"
              subtext="Logged across verified literature"
              icon="schedule"
            />
            <MetricCard
              category="Consistent Rigor"
              title="Current Streak"
              value={profile?.streakDays || metrics?.streakDays || 1}
              unit="Days"
              subtext="Unbroken academic rhythm"
              icon="local_fire_department"
            />
            <MetricCard
              category="Diagnostic Accuracy"
              title="Quiz Mastery"
              value={metrics && metrics.quizzesTaken > 0 ? `${metrics.quizAccuracy}%` : "100%"}
              subtext={metrics?.quizAccuracyTier || "Active Scholar"}
              icon="check_circle"
              progressPercent={metrics && metrics.quizzesTaken > 0 ? metrics.quizAccuracy : 100}
            />
          </div>
        </section>

        {/* 4. Active Learning Paths Grid */}
        {paths.length > 0 && (
          <section className="space-y-space-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline-md text-headline-md text-primary font-serif">
                  Enrolled Learning Paths
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Continue your sequential progress across enrolled disciplines.
                </p>
              </div>
              <Link
                href="/courses"
                className="font-label-md text-label-md text-primary hover:text-primary-container font-semibold flex items-center gap-1"
              >
                <span>View All ({paths.length})</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
              {paths.slice(0, 3).map((p) => (
                <PathCard key={p.id} path={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </AuthGuard>
  );
}
