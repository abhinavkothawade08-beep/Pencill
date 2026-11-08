"use client";

import React, { useMemo } from "react";
import { useBuilderStore } from "@/lib/store/builderStore";
import { estimateBlueprint } from "@/lib/curriculum/blueprintEstimator";
import { EngineExecutionResult } from "@/lib/resource-engine/types";

export interface CompactCuratorSidebarProps {
  currentStep: 1 | 2 | 3;
  engineState: "STANDBY" | "RUNNING" | "COMPLETE" | "PARTIAL" | "FAILED";
  activeStageNumber?: number;
  generationResult?: EngineExecutionResult | null;
  isGenerating?: boolean;
  onCancel?: () => void;
  onStartCourse?: () => void;
}

export default function CompactCuratorSidebar({
  currentStep,
  engineState,
  activeStageNumber = 1,
  generationResult = null,
  isGenerating = false,
  onCancel,
  onStartCourse,
}: CompactCuratorSidebarProps) {
  const { config } = useBuilderStore();

  const estimate = useMemo(() => {
    return estimateBlueprint(config);
  }, [config]);

  const primaryTopic =
    config.selectedTopics[0]?.label || config.title || "Subject Not Specified";

  // Dynamic Discovery Status
  const discoveryStatusText = useMemo(() => {
    if (isGenerating) {
      if (activeStageNumber <= 2) return "Analyzing learning goal & structuring curriculum...";
      if (activeStageNumber <= 4) return "Searching verified video lectures & reading monographs...";
      if (activeStageNumber <= 6) return "Validating academic integrity & deduplicating content...";
      if (activeStageNumber <= 8) return "Generating study monographs & checkpoint quizzes...";
      return "Finalizing curriculum sequence & persistence...";
    }
    if (engineState === "COMPLETE" || engineState === "PARTIAL") {
      return "Curriculum verified & ready for learning!";
    }
    if (currentStep === 1) {
      return "Ready to analyze goal & search 4,200+ academic channels.";
    }
    if (currentStep === 2) {
      return "Aligning pedagogical level, pacing, and learning depth.";
    }
    return "Curriculum preview generated and ready for creation.";
  }, [isGenerating, activeStageNumber, engineState, currentStep]);

  // Estimated Resources Discovered
  const estimatedResourcesCount = useMemo(() => {
    if (generationResult?.course?.modules) {
      const total = generationResult.course.modules.reduce(
        (sum, m) => sum + (m.lessons?.length || m.resources?.length || 0),
        0
      );
      return `${total} items`;
    }
    if (generationResult?.assignments) {
      const total = generationResult.assignments.reduce(
        (sum, a) =>
          sum +
          (a.videos?.length || 0) +
          (a.readings?.length || 0) +
          (a.studyNotes?.length || 0),
        0
      );
      return `${total} items`;
    }
    const [minMods, maxMods] = estimate.moduleRange;
    const avg = Math.round((minMods + maxMods) / 2);
    return `${avg * 4}–${avg * 7} items`;
  }, [generationResult, estimate.moduleRange]);

  const modulesCount = useMemo(() => {
    const baseCount = estimate.progressionPhases?.length || 4;
    const overrides = config.curriculumBlueprintOverrides || [];
    const removedCount = overrides.filter((o) => o.isRemoved).length;
    const addedCount = overrides.filter((o) => o.moduleIndex >= baseCount && !o.isRemoved).length;
    return Math.max(1, baseCount - removedCount + addedCount);
  }, [estimate.progressionPhases, config.curriculumBlueprintOverrides]);

  return (
    <div className="flex flex-col gap-space-md lg:sticky lg:top-4">
      {/* 1. AI Learning Assistant Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-space-md border border-surface-container-high/60 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-base">auto_awesome</span>
            </div>
            <span className="font-label-md text-xs font-bold text-primary uppercase tracking-wider">
              AI Learning Assistant
            </span>
          </div>

          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
              isGenerating
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse"
                : engineState === "COMPLETE"
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                : "bg-surface-container text-on-surface-variant"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isGenerating
                  ? "bg-amber-500 animate-ping"
                  : engineState === "COMPLETE"
                  ? "bg-emerald-500"
                  : "bg-on-surface-variant/50"
              }`}
            />
            <span>{isGenerating ? "Synthesizing" : engineState === "COMPLETE" ? "Ready" : "Standby"}</span>
          </span>
        </div>

        {/* Current Topic Indicator */}
        <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/50">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold block">
            Current Target Topic:
          </span>
          <p className="text-xs font-bold text-primary truncate mt-0.5 font-serif">
            {primaryTopic}
          </p>
        </div>

        {/* AI Discovery Status */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-medium text-[11px]">AI Discovery Status:</span>
            {isGenerating && (
              <span className="text-[10px] font-mono font-bold text-primary">
                Stage {activeStageNumber}/11
              </span>
            )}
          </div>
          <p className="text-xs text-on-surface leading-relaxed font-medium">
            {discoveryStatusText}
          </p>
        </div>

        {/* Resources Discovered */}
        <div className="flex items-center justify-between pt-2 border-t border-surface-container-high/40 text-xs">
          <span className="text-on-surface-variant font-medium">Relevant Resources:</span>
          <span className="font-mono font-bold text-primary">
            {estimatedResourcesCount}
          </span>
        </div>

        {/* Active Generation Progress Indicator */}
        {isGenerating && (
          <div className="pt-1">
            <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round((activeStageNumber / 11) * 100))}%` }}
              />
            </div>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full mt-2 py-1 text-xs font-semibold text-error hover:bg-error-container/30 rounded-lg transition-colors"
              >
                Cancel Generation
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Compact Learning Path Preview */}
      <div className="bg-surface-container-lowest rounded-2xl p-space-md border border-surface-container-high/60 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-base">overview</span>
          <span className="font-label-md text-xs font-bold text-secondary uppercase tracking-wider">
            Learning Path Preview
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/50">
            <span className="text-[10px] text-on-surface-variant block">Modules:</span>
            <span className="font-bold text-primary text-sm font-mono mt-0.5 block">
              {modulesCount} Units
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/50">
            <span className="text-[10px] text-on-surface-variant block">Est. Duration:</span>
            <span className="font-bold text-primary text-sm font-mono mt-0.5 block">
              ~{estimate.estimatedTotalHours}h Total
            </span>
          </div>
        </div>

        {/* Coverage Status */}
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-emerald-600 shrink-0">check_circle</span>
          <span className="font-medium text-[11px] leading-tight">
            Curated from accredited university &amp; academic channels
          </span>
        </div>

        {/* Complete Ready Banner */}
        {generationResult?.courseId && onStartCourse && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onStartCourse}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700 py-2.5 px-3 rounded-xl font-label-md text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <span>Open Synthesized Course</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Academic Guarantee Strip */}
      <div className="p-3 rounded-xl bg-surface-container-low/60 border border-surface-container-high/40 text-[11px] text-on-surface-variant space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-xs text-primary">verified</span>
          <span className="font-semibold text-on-surface">Zero Clickbait Guarantee</span>
        </div>
        <p className="leading-relaxed">
          Every video is verified against syllabus objectives. All clickbait, sponsor filler, and generic overviews are filtered out.
        </p>
      </div>
    </div>
  );
}
