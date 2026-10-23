"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MetricCard from "@/components/cards/MetricCard";
import AuthGuard from "@/components/auth/AuthGuard";
import EmptyState from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { getUserProgress } from "@/services/supabase/progressService";
import { ProgressMetrics } from "@/types";

export default function ProgressAnalyticsPage() {
  const { user, profile } = useAuth();
  const [metrics, setMetrics] = useState<ProgressMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProgress() {
      setLoading(true);
      try {
        const data = await getUserProgress(user?.id || null);
        if (mounted) {
          setMetrics(data);
        }
      } catch (err) {
        console.error("Failed to load user progress:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProgress();

    return () => {
      mounted = false;
    };
  }, [user]);

  const handleExportReport = () => {
    if (!metrics) return;

    const reportData = {
      scholar: profile?.name || "Pencill Scholar",
      tier: profile?.tier || "Pro Path",
      exportedAt: new Date().toISOString(),
      summary: {
        overallPercent: metrics.overallPercent,
        totalHoursInvested: metrics.totalHoursInvested,
        clearedModules: metrics.clearedModules,
        quizAccuracy: metrics.quizAccuracy,
        quizAccuracyTier: metrics.quizAccuracyTier,
        quizzesTaken: metrics.quizzesTaken,
        streakDays: profile?.streakDays || metrics.streakDays || 0,
      },
      topicMastery: metrics.topicMastery,
      recentActivity: metrics.recentActivity,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pencill-analytics-report-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex flex-col gap-space-xl pb-space-xl max-w-6xl mx-auto animate-pulse">
          <div className="h-20 bg-surface-container-lowest rounded-xl border border-surface-container-high/60" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-surface-container-lowest rounded-xl border border-surface-container-high/60" />
            ))}
          </div>
          <div className="h-64 bg-surface-container-lowest rounded-xl border border-surface-container-high/60" />
          <div className="h-48 bg-surface-container-lowest rounded-xl border border-surface-container-high/60" />
        </div>
      </AuthGuard>
    );
  }

  const hasActivity = metrics && (metrics.totalHoursInvested > 0 || metrics.recentActivity.length > 0 || metrics.quizzesTaken > 0);

  return (
    <AuthGuard>
      <div className="flex flex-col gap-space-xl pb-space-xl max-w-6xl mx-auto">
        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-space-md border-b border-surface-container-high/60 pb-space-md">
          <div>
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-secondary font-semibold">Analytics &amp; Mastery</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary font-serif">
              Learning Progress &amp; Diagnostics
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Factual, completion-driven diagnostics tracking cognitive retention and time invested.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportReport}
              disabled={!hasActivity}
              className="px-space-md py-2 rounded-lg bg-surface-container-lowest border border-surface-container-high/60 text-primary hover:bg-surface-container font-label-md text-label-md transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">download</span>
              <span>Export Analytics Report</span>
            </button>
          </div>
        </header>

        {metrics && (
          <>
            {/* 4 Core Metric Tiles */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
              <MetricCard
                category="Curriculum Mastery"
                title="Overall Progress"
                value={`${metrics.overallPercent}%`}
                subtext={`${metrics.clearedModules} modules cleared`}
                icon="pie_chart"
                progressPercent={metrics.overallPercent}
              />
              <MetricCard
                category="Time Invested"
                title="Total Study Time"
                value={metrics.totalHoursInvested}
                unit="Hours"
                subtext="Logged across verified literature"
                icon="schedule"
              />
              <MetricCard
                category="Formative Evaluation"
                title="Quiz Accuracy"
                value={metrics.quizzesTaken > 0 ? `${metrics.quizAccuracy}%` : "N/A"}
                subtext={metrics.quizAccuracyTier}
                icon="check_circle"
                progressPercent={metrics.quizzesTaken > 0 ? metrics.quizAccuracy : undefined}
                iconBgClass="bg-primary text-on-primary"
              />
              <MetricCard
                category="Consistent Rigor"
                title="Current Streak"
                value={profile?.streakDays || metrics.streakDays || 0}
                unit="Days"
                subtext={`Active streak: ${profile?.streakDays || metrics.streakDays || 0}d`}
                icon="local_fire_department"
                iconBgClass="bg-secondary text-on-secondary"
              />
            </section>

            {/* Cognitive Retention / Topic Mastery Section */}
            <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 space-y-space-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="font-headline-md text-headline-md text-primary font-serif">
                    Pillar Mastery Index
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Synthesized concept evaluations derived from checkpoint quizzes and completed derivations.
                  </p>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full font-mono text-xs">
                  Evaluated via Pencill Diagnostics
                </span>
              </div>

              {metrics.topicMastery.length > 0 ? (
                <div className="space-y-space-sm pt-2">
                  {metrics.topicMastery.map((t) => (
                    <div
                      key={t.name}
                      className="p-3 rounded-lg bg-surface-container-low border border-surface-container-high/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-label-lg text-label-lg text-primary font-semibold truncate">
                            {t.name}
                          </span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                            {t.percentage}% · {t.level}
                          </span>
                        </div>
                        <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              t.percentage >= 80
                                ? "bg-primary"
                                : t.percentage >= 50
                                ? "bg-secondary"
                                : "bg-warning"
                            }`}
                            style={{ width: `${t.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center bg-surface-container-low/50 rounded-lg border border-dashed border-surface-container-high">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-1">query_stats</span>
                  <p className="font-label-md text-label-md text-primary font-semibold">No Topic Mastery Recorded Yet</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mx-auto mt-1">
                    Complete learning units and diagnostic quizzes to populate your domain mastery breakdown.
                  </p>
                  <Link
                    href="/explore"
                    className="inline-block mt-3 px-3 py-1.5 bg-primary text-on-primary rounded-md font-label-sm text-xs font-semibold hover:bg-primary-container transition-colors"
                  >
                    Start a Course
                  </Link>
                </div>
              )}
            </section>

            {/* Recent Activity Feed */}
            <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 space-y-space-md">
              <h2 className="font-headline-md text-headline-md text-primary font-serif">
                Learning Session History
              </h2>

              {metrics.recentActivity.length > 0 ? (
                <div className="space-y-2">
                  {metrics.recentActivity.map((act) => (
                    <div
                      key={act.id}
                      className="p-3 rounded-lg bg-surface-container-low border border-surface-container-high/30 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                          <span className="material-symbols-outlined text-base">
                            {act.type === "video" ? "videocam" : act.type === "quiz" ? "quiz" : "edit_note"}
                          </span>
                        </span>
                        <div className="min-w-0">
                          <p className="font-label-lg text-label-lg text-primary font-semibold truncate">
                            {act.title}
                          </p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">
                            {act.courseTitle} · {act.timestamp}
                          </p>
                        </div>
                      </div>

                      <span className="font-label-sm text-label-sm text-on-surface font-mono font-medium shrink-0">
                        {act.timeSpent}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center bg-surface-container-low/50 rounded-lg border border-dashed border-surface-container-high">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-1">history_edu</span>
                  <p className="font-label-md text-label-md text-primary font-semibold">No Recent Study Sessions</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mx-auto mt-1">
                    Your completed lessons and notes will be chronicled here with timestamp markers.
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AuthGuard>
  );
}
