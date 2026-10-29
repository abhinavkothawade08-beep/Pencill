"use client";

import React from "react";
import { CuratorEngineState, CuratorTelemetry, StageProgressUpdate } from "@/curator/types";

interface CuratorStatusPanelProps {
  engineState: CuratorEngineState;
  activeStageNumber: number;
  stagesProgress: Record<number, StageProgressUpdate>;
  telemetry: CuratorTelemetry;
  selectedRepositories: string[];
  activeGoal: string;
  error?: string | null;
  onCancel?: () => void;
  onRetry?: () => void;
}

export default function CuratorStatusPanel({
  engineState,
  activeStageNumber,
  stagesProgress,
  telemetry,
  selectedRepositories,
  activeGoal,
  error,
  onCancel,
  onRetry,
}: CuratorStatusPanelProps) {
  const isRunning = engineState === "RUNNING";

  const defaultStages = [
    { step: 1, title: "Domain & Syllabus Deconstruction", defaultDesc: "Classifying core concepts and scope from standard curricula." },
    { step: 2, title: "Prerequisite Hierarchy Mapping", defaultDesc: "Sequencing foundational axioms ahead of advanced applications." },
    { step: 3, title: "Topic-Adaptive Curriculum Synthesis", defaultDesc: "Determining optimal cohesive module count without arbitrary bloat." },
    { step: 4, title: "Diagnostic Checkpoints & Flashcards", defaultDesc: "Synthesizing formative unit quizzes and formula memory decks." },
    { step: 5, title: "Curriculum Assembly & Registry Persistence", defaultDesc: "Validating learning path and enrolling learner in active course." },
  ];

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-high/60 flex flex-col gap-space-md">
      {/* Header & Status Badge */}
      <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-high">
        <div className="flex items-center gap-space-xs">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-surface-container-low">
            <span className="material-symbols-outlined text-primary text-base">neurology</span>
            {isRunning && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-secondary animate-ping" />
            )}
          </div>
          <span className="font-headline-sm text-headline-sm text-on-surface font-sans">
            Curator Engine
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isRunning && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-[11px] text-error font-semibold hover:underline px-2 py-0.5 rounded bg-error-container/30 border border-error/30"
            >
              Cancel
            </button>
          )}

          <span
            className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
              engineState === "COMPLETE"
                ? "text-emerald-800 bg-emerald-500/20"
                : engineState === "PARTIAL"
                ? "text-amber-800 bg-amber-500/20"
                : engineState === "FAILED"
                ? "text-error bg-error-container/40"
                : isRunning
                ? "text-secondary bg-secondary-container/40"
                : "text-primary bg-surface-container"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                engineState === "COMPLETE"
                  ? "bg-emerald-600"
                  : engineState === "PARTIAL"
                  ? "bg-amber-600"
                  : engineState === "FAILED"
                  ? "bg-error"
                  : isRunning
                  ? "bg-secondary animate-pulse"
                  : "bg-primary/60"
              }`}
            />
            {engineState === "COMPLETE"
              ? "Synthesis Complete"
              : engineState === "PARTIAL"
              ? "Partial Results"
              : engineState === "FAILED"
              ? "Synthesis Error"
              : isRunning
              ? "Live Indexing"
              : "Engine Ready"}
          </span>
        </div>
      </div>

      {/* Dynamic Status Callout */}
      <div className="my-1">
        <div className="flex items-center justify-between mb-1">
          <span className="font-label-lg text-label-lg text-primary font-semibold">
            {isRunning
              ? "Synthesis in Progress"
              : engineState === "COMPLETE"
              ? "Curriculum Ready"
              : engineState === "PARTIAL"
              ? "Curriculum Ready (with Coverage Gaps)"
              : engineState === "FAILED"
              ? "Synthesis Notice"
              : "Awaiting Generation Trigger"}
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
            {isRunning ? `STEP ${activeStageNumber} OF 7` : engineState}
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
          {isRunning
            ? `Sequencing highest-yield resources tailored to ${activeGoal}.`
            : engineState === "COMPLETE"
            ? `All 7 curation milestones completed. Learning path persisted to local catalog.`
            : `Curator Engine configures, sequences, and verifies high-yield materials upon submission.`}
        </p>
      </div>

      {/* Error Callout with Retry */}
      {error && (
        <div className="p-3 rounded-lg bg-error-container/40 border border-error/40 text-error flex flex-col gap-2 text-xs">
          <div className="flex items-start gap-1.5">
            <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
            <span className="font-semibold">{error}</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="self-start underline font-semibold text-error hover:text-on-error"
            >
              Retry Synthesis
            </button>
          )}
        </div>
      )}

      {/* 7-Stage Genuine Progress Checklist */}
      <div className="flex flex-col gap-3 relative pl-1" aria-live="polite">
        {defaultStages.map((stage) => {
          const progress = stagesProgress[stage.step];
          const isDone = progress?.status === "done";
          const isCurrent = progress?.status === "running" || (isRunning && activeStageNumber === stage.step);
          const isError = progress?.status === "error";
          const isPending = !isDone && !isCurrent && !isError;

          return (
            <div
              key={stage.step}
              className={`flex items-start gap-space-sm transition-opacity ${
                isPending && !isRunning ? "opacity-45" : isPending ? "opacity-35" : ""
              }`}
            >
              <div className="flex flex-col items-center">
                {isDone ? (
                  <span className="material-symbols-outlined text-base text-on-secondary-container bg-secondary-fixed/40 rounded-full p-0.5">
                    check
                  </span>
                ) : isCurrent ? (
                  <div className="w-5 h-5 rounded-full bg-primary-fixed flex items-center justify-center animate-spin">
                    <span className="material-symbols-outlined text-xs text-on-primary-fixed">sync</span>
                  </div>
                ) : isError ? (
                  <span className="material-symbols-outlined text-base text-error bg-error-container rounded-full p-0.5">
                    close
                  </span>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-surface-container flex items-center justify-center mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
                  </div>
                )}
                {stage.step < 7 && <div className="w-0.5 h-5 bg-surface-container-high mt-1" />}
              </div>

              <div className="flex flex-col min-w-0 pt-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`font-label-md text-label-md ${
                      isCurrent
                        ? "text-primary font-bold flex items-center gap-1.5"
                        : isDone
                        ? "text-on-surface font-semibold"
                        : "text-on-surface-variant font-medium"
                    }`}
                  >
                    {stage.title}
                    {isCurrent && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                    )}
                  </span>
                  {progress?.durationMs ? (
                    <span className="text-[10px] font-mono text-on-surface-variant/70">
                      {progress.durationMs}ms
                    </span>
                  ) : null}
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px] leading-tight mt-0.5">
                  {progress?.resultSummary || stage.defaultDesc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Resource Telemetry Widget */}
      <div className="mt-1 p-2.5 bg-surface-container-low rounded-lg flex items-center justify-between border border-surface-container-high/40 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-secondary text-sm">database</span>
          <span className="font-label-sm text-on-surface-variant font-medium">
            Live Telemetry
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono">
          <span className="bg-surface-container px-2 py-0.5 rounded text-on-surface">
            {telemetry.resourcesIndexed} Candidates Found
          </span>
          {telemetry.modulesSynthesized > 0 && (
            <span className="bg-surface-container px-2 py-0.5 rounded text-primary font-semibold">
              {telemetry.modulesSynthesized} Modules
            </span>
          )}
        </div>
      </div>

      {/* Verified Academic Repositories with real counts */}
      <div className="p-2.5 bg-surface-container-low rounded-lg flex flex-col gap-1.5 border border-surface-container-high/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-base">verified</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
              Verified Repositories
            </span>
          </div>
          <span className="text-[10px] text-on-surface-variant font-mono">
            {selectedRepositories.length} active
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {selectedRepositories.map((repo) => {
            const count = telemetry.repoBreakdown[repo] || telemetry.repoBreakdown[repo.split(" ")[0]] || 0;
            return (
              <span
                key={repo}
                className="font-label-sm text-[10px] text-on-surface bg-surface-container px-2 py-0.5 rounded font-mono flex items-center gap-1"
              >
                <span>{repo}</span>
                {count > 0 && <span className="text-secondary font-bold">({count})</span>}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
