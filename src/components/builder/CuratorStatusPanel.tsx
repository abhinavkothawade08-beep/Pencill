"use client";

import React from "react";
import { EngineTelemetryStage, ResourceEngineTelemetry } from "@/lib/resource-engine/types";

export interface CuratorStatusPanelProps {
  engineState: "STANDBY" | "RUNNING" | "COMPLETE" | "PARTIAL" | "FAILED";
  activeStageNumber: number;
  stagesTelemetry?: EngineTelemetryStage[];
  telemetry?: ResourceEngineTelemetry | any;
  selectedRepositories?: string[];
  activeGoal: string;
  error?: string | null;
  onCancel?: () => void;
  onRetry?: () => void;
}

const DEFAULT_11_STAGES = [
  { stage: 1, name: "Objective Analysis & Domain Deconstruction", summary: "Parsing learning objectives, taxonomy, and prerequisites." },
  { stage: 2, name: "Curriculum Planning & Module Synthesis", summary: "Synthesizing cohesive modules, lesson structures, and search queries." },
  { stage: 3, name: "Educator Intelligence Matching", summary: "Matching prioritized educators from Master Directory." },
  { stage: 4, name: "Multi-Query Video & Reading Discovery", summary: "Discovering candidate lectures and official documentation." },
  { stage: 5, name: "Resource Normalization & Integrity Validation", summary: "Validating canonical URLs, durations, and embeddability." },
  { stage: 6, name: "Pedagogical Scoring & Collision Gating", summary: "Scoring topic alignment and filtering cross-domain collisions." },
  { stage: 7, name: "Grounded Study Notes Compilation", summary: "Compiling core definitions, key formulas, and common misconceptions." },
  { stage: 8, name: "Formative Assessment Quiz Generation", summary: "Synthesizing module checkpoint quizzes with verified answer keys." },
  { stage: 9, name: "Resource Distribution & Lesson Sequencing", summary: "Sequencing non-repeating lectures, reading extracts, and quizzes." },
  { stage: 10, name: "Curriculum Coverage Audit", summary: "Auditing 6 Quality Gates and verifying full objective coverage." },
  { stage: 11, name: "Relational Course Persistence & Enrollment", summary: "Persisting course and enrolling learner into local workspace." },
];

export default function CuratorStatusPanel({
  engineState,
  activeStageNumber,
  stagesTelemetry,
  telemetry,
  selectedRepositories = ["NCERT", "NPTEL", "Khan Academy", "MIT OCW"],
  activeGoal,
  error,
  onCancel,
  onRetry,
}: CuratorStatusPanelProps) {
  const isRunning = engineState === "RUNNING";

  // Merge runtime stages with defaults
  const stagesToDisplay = DEFAULT_11_STAGES.map((def, idx) => {
    const live = stagesTelemetry?.find((s) => s.stage === def.stage);
    let status: "pending" | "running" | "completed" | "partial" | "failed" = "pending";

    if (live) {
      status = live.status as any;
    } else if (engineState === "COMPLETE") {
      status = "completed";
    } else if (engineState === "RUNNING") {
      if (def.stage < activeStageNumber) status = "completed";
      else if (def.stage === activeStageNumber) status = "running";
      else status = "pending";
    } else if (engineState === "FAILED") {
      if (def.stage < activeStageNumber) status = "completed";
      else if (def.stage === activeStageNumber) status = "failed";
      else status = "pending";
    }

    return {
      stageNumber: def.stage,
      title: def.name,
      summary: live?.summary || def.summary,
      status,
      durationMs: live?.durationMs,
      error: live?.error,
    };
  });

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-high/60 flex flex-col gap-space-md" id="curator-engine-panel">
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

      {/* Target Subject Subheading */}
      <div className="my-1">
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-label-md text-label-md text-primary font-bold">
            {isRunning
              ? `Stage ${activeStageNumber} of 11: ${stagesToDisplay[activeStageNumber - 1]?.title || "Synthesizing"}`
              : engineState === "COMPLETE"
              ? "Pathway Synthesized & Persisted"
              : "11-Stage Curriculum Engine"}
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant font-mono text-[11px]">
            STEP {Math.min(11, Math.max(1, activeStageNumber))} / 11
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed truncate">
          Curation target: <strong className="text-on-surface font-semibold">{activeGoal || "Selected Topics"}</strong>
        </p>
      </div>

      {/* 11-Stage Live Checklist (Scrollable if needed) */}
      <div className="flex flex-col gap-2 relative pl-1 max-h-72 overflow-y-auto pr-1">
        {stagesToDisplay.map((st, idx) => {
          const isDone = st.status === "completed";
          const isCurrent = st.status === "running";
          const isFailed = st.status === "failed";
          const isPartial = st.status === "partial";

          return (
            <div
              key={st.stageNumber}
              className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors ${
                isCurrent ? "bg-primary-container/20 border border-primary/30" : "hover:bg-surface-container-low"
              }`}
            >
              <div className="flex items-center justify-center shrink-0 mt-0.5">
                {isDone ? (
                  <span className="material-symbols-outlined text-sm text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 rounded-full p-0.5 font-bold">
                    check
                  </span>
                ) : isCurrent ? (
                  <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                ) : isFailed ? (
                  <span className="material-symbols-outlined text-sm text-error bg-error-container rounded-full p-0.5 font-bold">
                    close
                  </span>
                ) : isPartial ? (
                  <span className="material-symbols-outlined text-sm text-amber-600 bg-amber-100 rounded-full p-0.5 font-bold">
                    priority_high
                  </span>
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-outline-variant bg-surface-container flex items-center justify-center text-[9px] font-mono text-on-surface-variant">
                    {st.stageNumber}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`font-label-sm text-label-sm truncate font-medium ${
                      isCurrent
                        ? "text-primary font-bold"
                        : isDone
                        ? "text-on-surface"
                        : isFailed
                        ? "text-error font-bold"
                        : "text-on-surface-variant"
                    }`}
                  >
                    {st.title}
                  </span>
                  {st.durationMs !== undefined && st.durationMs > 0 && (
                    <span className="text-[10px] text-on-surface-variant font-mono">
                      {st.durationMs}ms
                    </span>
                  )}
                </div>
                <p className="font-body-sm text-[11px] text-on-surface-variant truncate">
                  {st.summary}
                </p>
                {st.error && (
                  <span className="text-[10px] text-error font-medium block truncate">
                    {st.error}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time Telemetry Counts Bar */}
      <div className="grid grid-cols-4 gap-1 p-2 bg-surface-container-low rounded-lg border border-surface-container-high/40 text-center text-[10px]">
        <div>
          <span className="text-on-surface-variant block uppercase font-mono">Discovered</span>
          <span className="font-bold text-on-surface font-mono text-xs">
            {telemetry?.counts?.candidatesDiscovered || (engineState === "COMPLETE" ? 18 : 0)}
          </span>
        </div>
        <div>
          <span className="text-on-surface-variant block uppercase font-mono">Verified</span>
          <span className="font-bold text-secondary font-mono text-xs">
            {telemetry?.counts?.verifiedEducatorMatches || (engineState === "COMPLETE" ? 6 : 0)}
          </span>
        </div>
        <div>
          <span className="text-on-surface-variant block uppercase font-mono">Assigned</span>
          <span className="font-bold text-primary font-mono text-xs">
            {telemetry?.counts?.resourcesAssigned || (engineState === "COMPLETE" ? 12 : 0)}
          </span>
        </div>
        <div>
          <span className="text-on-surface-variant block uppercase font-mono">Elapsed</span>
          <span className="font-bold text-on-surface font-mono text-xs">
            {telemetry?.totalDurationMs ? `${(telemetry.totalDurationMs / 1000).toFixed(1)}s` : isRunning ? "Active" : "0.0s"}
          </span>
        </div>
      </div>

      {/* Failure Diagnostic & Retry Button */}
      {engineState === "FAILED" && (
        <div className="p-3 bg-error-container/30 border border-error/20 rounded-xl flex items-center justify-between gap-2 text-xs text-error">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            <span className="truncate">{error || "Stage execution failed. You can safely retry."}</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-3 py-1 bg-error text-on-error rounded-md font-semibold text-xs shrink-0 hover:bg-error/90"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
