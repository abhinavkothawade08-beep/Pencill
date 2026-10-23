"use client";

import React from "react";

export interface CuratorStage {
  step: number;
  title: string;
  description: string;
}

interface CuratorStatusPanelProps {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  statusMessage?: string;
  error?: string | null;
  discoveredCount: number;
  modulesCount: number;
  onRetry?: () => void;
  activeGoal: string;
}

export default function CuratorStatusPanel({
  isActive,
  currentStep,
  totalSteps = 7,
  statusMessage,
  error,
  discoveredCount,
  modulesCount,
  onRetry,
  activeGoal,
}: CuratorStatusPanelProps) {
  const stages: CuratorStage[] = [
    {
      step: 1,
      title: "Domain & Syllabus Deconstruction",
      description: "Classifying core concepts and scope from standard curricula.",
    },
    {
      step: 2,
      title: "Prerequisite Hierarchy Mapping",
      description: "Sequencing foundational axioms ahead of advanced applications.",
    },
    {
      step: 3,
      title: "Topic-Adaptive Curriculum Synthesis",
      description: "Determining optimal cohesive module count without arbitrary bloat.",
    },
    {
      step: 4,
      title: "Verified Resource Discovery",
      description: "Searching open academic repositories, NPTEL, NCERT & top channels.",
    },
    {
      step: 5,
      title: "Quality, Audio & Syllabus Audit",
      description: "Evaluating video clarity, chapters, and conceptual relevance.",
    },
    {
      step: 6,
      title: "Diagnostic Checkpoints & Flashcards",
      description: "Synthesizing formative unit quizzes and formula memory decks.",
    },
    {
      step: 7,
      title: "Curriculum Assembly & Registry Persistence",
      description: "Validating learning path and enrolling learner in active course.",
    },
  ];

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-high/60 flex flex-col gap-space-md">
      {/* Panel Top Header */}
      <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-high">
        <div className="flex items-center gap-space-xs">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-surface-container-low">
            <span className="material-symbols-outlined text-primary text-base">neurology</span>
            {isActive && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-secondary animate-ping" />
            )}
          </div>
          <span className="font-headline-sm text-headline-sm text-on-surface font-sans">
            Curator Engine
          </span>
        </div>
        <span className="font-label-sm text-label-sm text-secondary bg-secondary-container/40 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full bg-secondary ${isActive ? "animate-pulse" : ""}`} />
          {isActive ? "Live Synthesis" : "Engine Ready"}
        </span>
      </div>

      {/* Dynamic Status Banner */}
      <div className="my-1">
        <div className="flex items-center justify-between mb-1">
          <span className="font-label-lg text-label-lg text-primary font-semibold">
            {isActive
              ? "Synthesis in Progress"
              : error
              ? "Synthesis Encountered Notice"
              : "Awaiting Generation Trigger"}
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
            {isActive ? `STAGE ${currentStep} OF ${totalSteps}` : "STANDBY"}
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
          {statusMessage ||
            (isActive
              ? `Synthesizing topic-adaptive curriculum tailored to ${activeGoal}.`
              : "Curator Engine configures, sequences, and verifies high-yield materials upon submission.")}
        </p>
      </div>

      {/* Error Callout if any */}
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
      <div className="flex flex-col gap-3 relative pl-1">
        {stages.map((stage) => {
          const isDone = currentStep > stage.step;
          const isCurrent = isActive && currentStep === stage.step;
          const isPending = currentStep < stage.step;

          return (
            <div
              key={stage.step}
              className={`flex items-start gap-space-sm transition-opacity ${
                isPending && !isActive ? "opacity-45" : isPending ? "opacity-35" : ""
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
                ) : (
                  <div className="w-4 h-4 rounded-full bg-surface-container flex items-center justify-center mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
                  </div>
                )}
                {stage.step < totalSteps && (
                  <div className="w-0.5 h-5 bg-surface-container-high mt-1" />
                )}
              </div>
              <div className="flex flex-col min-w-0 pt-0.5">
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
                <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px] leading-tight">
                  {stage.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Resource Telemetry Counters */}
      <div className="mt-1 p-2.5 bg-surface-container-low rounded-lg flex items-center justify-between border border-surface-container-high/40 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-secondary text-sm">database</span>
          <span className="font-label-sm text-on-surface-variant font-medium">
            Live Telemetry
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono">
          <span className="bg-surface-container px-2 py-0.5 rounded text-on-surface">
            {discoveredCount} Resources Found
          </span>
          {modulesCount > 0 && (
            <span className="bg-surface-container px-2 py-0.5 rounded text-primary font-semibold">
              {modulesCount} Modules
            </span>
          )}
        </div>
      </div>

      {/* Verified Academic Repositories */}
      <div className="p-2.5 bg-surface-container-low rounded-lg flex items-center justify-between border border-surface-container-high/40">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-secondary text-base">verified</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
            Verified Repositories
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {["NPTEL", "NCERT", "MIT OCW", "Khan Academy"].map((src) => (
            <span
              key={src}
              className="font-label-sm text-[10px] text-on-surface bg-surface-container px-1.5 py-0.5 rounded font-mono"
            >
              {src}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
