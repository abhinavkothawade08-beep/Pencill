"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { storageAdapter } from "@/lib/storage/storageAdapter";
import { calculateRetrievability } from "@/lib/memory-engine";

interface AutopilotRecommendation {
  type: "review" | "remediation" | "next_lesson" | "credential" | "diagnostic";
  title: string;
  rationale: string;
  actionLabel: string;
  actionHref: string;
  icon: string;
  priority: "high" | "medium" | "low";
}

export default function LearningAutopilotWidget() {
  const [recommendation, setRecommendation] = useState<AutopilotRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    async function evaluateNextBestAction() {
      setLoading(true);
      try {
        const [savedPaths, spacedCards] = await Promise.all([
          storageAdapter.getSavedPaths(),
          storageAdapter.getSpacedCards(),
        ]);

        const now = new Date();

        // 1. Check for overdue/due spaced repetition cards
        const dueCards = spacedCards.filter((c) => new Date(c.dueDate) <= now);
        if (dueCards.length > 0) {
          setRecommendation({
            type: "review",
            title: `Memory Science: ${dueCards.length} Concepts Due for Review`,
            rationale:
              "According to your personalized FSRS memory decay curve, reviewing these anchors today will maintain your 90% target retention rate.",
            actionLabel: "Start Daily Review",
            actionHref: "/review",
            icon: "psychology",
            priority: "high",
          });
          setLoading(false);
          return;
        }

        // 2. Check for weak quiz scores needing remediation
        for (const path of savedPaths) {
          const prog = await storageAdapter.getProgress(path.id);
          if (prog?.quizScores) {
            for (const [modId, scoreData] of Object.entries(prog.quizScores)) {
              const pct = (scoreData.score / scoreData.total) * 100;
              if (pct < 70) {
                const weakMod = path.modules?.find((m: any) => m.id === modId);
                const modTitle = weakMod?.title || "recent unit";
                setRecommendation({
                  type: "remediation",
                  title: `Knowledge Reinforcement: ${modTitle}`,
                  rationale: `You scored ${Math.round(pct)}% on the diagnostic checkpoint. We recommend reviewing the foundational study monograph before advancing to complex topics.`,
                  actionLabel: "Review Module",
                  actionHref: `/courses/${path.id}`,
                  icon: "build",
                  priority: "high",
                });
                setLoading(false);
                return;
              }
            }
          }
        }

        // 3. Find next uncompleted lesson in the most active course
        const activeCourse = savedPaths[0];
        if (activeCourse) {
          const prog = await storageAdapter.getProgress(activeCourse.id);
          const completedIds = prog?.completedLessonIds || [];
          const allLessons = activeCourse.modules?.flatMap((m: any) => m.lessons || m.resources || []) || [];
          const nextLesson = allLessons.find((l: any) => !completedIds.includes(l.id));

          if (nextLesson) {
            setRecommendation({
              type: "next_lesson",
              title: `Next Learning Milestone: ${nextLesson.title}`,
              rationale: `You are making steady progress in ${activeCourse.title}. Continue with this scheduled lesson to maintain your momentum.`,
              actionLabel: "Resume Lesson",
              actionHref: `/learn/${activeCourse.id}/${nextLesson.id}`,
              icon: "play_arrow",
              priority: "medium",
            });
            setLoading(false);
            return;
          }

          if (allLessons.length > 0 && allLessons.every((l: any) => completedIds.includes(l.id))) {
            setRecommendation({
              type: "credential",
              title: `Curriculum Cleared: ${activeCourse.title}`,
              rationale:
                "You have completed all curriculum lessons! Check your assessment record and claim your verified digital certificate.",
              actionLabel: "View Credentials",
              actionHref: "/achievements",
              icon: "workspace_premium",
              priority: "low",
            });
            setLoading(false);
            return;
          }
        }

        // Default empty state recommendation
        setRecommendation({
          type: "diagnostic",
          title: "Synthesize Your Next Personalized Curriculum",
          rationale:
            "Ready to master a new topic? Enter an academic or professional goal to generate an objective-aligned learning path.",
          actionLabel: "Start with AI",
          actionHref: "/new-goal",
          icon: "auto_awesome",
          priority: "low",
        });
      } catch (err) {
        console.error("Autopilot evaluation error:", err);
      } finally {
        setLoading(false);
      }
    }

    evaluateNextBestAction();
  }, []);

  if (loading || !recommendation || isDismissed) return null;

  return (
    <div className="bg-gradient-to-r from-primary/5 via-secondary/5 to-surface-container-low rounded-3xl p-5 border border-primary/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-xs">
          <span className="material-symbols-outlined text-xl">{recommendation.icon}</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
              AI Learning Autopilot
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                recommendation.priority === "high"
                  ? "bg-error/10 text-error"
                  : recommendation.priority === "medium"
                  ? "bg-amber-500/10 text-amber-700"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {recommendation.priority} priority
            </span>
          </div>
          <h4 className="font-bold text-xs text-primary truncate">{recommendation.title}</h4>
          <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5 max-w-2xl leading-relaxed">
            {recommendation.rationale}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <Link
          href={recommendation.actionHref}
          className="px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-transform hover:scale-[1.02]"
        >
          <span>{recommendation.actionLabel}</span>
          <span className="material-symbols-outlined text-xs">arrow_forward</span>
        </Link>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container"
          title="Dismiss suggestion"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
    </div>
  );
}
