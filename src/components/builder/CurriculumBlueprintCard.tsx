"use client";

import React from "react";
import { CurriculumBlueprintEstimate } from "@/lib/curriculum/blueprintEstimator";

interface SynthesizedModulePreview {
  title: string;
  unitCount: number;
}

interface CurriculumBlueprintCardProps {
  estimate: CurriculumBlueprintEstimate;
  synthesizedModules: SynthesizedModulePreview[];
  isGenerating: boolean;
}

export default function CurriculumBlueprintCard({
  estimate,
  synthesizedModules,
  isGenerating,
}: CurriculumBlueprintCardProps) {
  const hasSynthesized = synthesizedModules.length > 0;

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-high/60 flex flex-col gap-space-sm">
      {/* Blueprint Header */}
      <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-lg">architecture</span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-serif">
            Curriculum Blueprint
          </h3>
        </div>
        <span className="font-label-sm text-label-sm text-secondary font-medium">
          {hasSynthesized ? "Synthesized Architecture" : "Dynamic Estimate"}
        </span>
      </div>

      {hasSynthesized ? (
        /* Actual Synthesized Modules */
        <div className="space-y-2 pt-1">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-300 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-emerald-600 shrink-0">
              task_alt
            </span>
            <span>
              Curriculum successfully structured into {synthesizedModules.length} cohesive modules.
            </span>
          </div>

          {synthesizedModules.map((m, idx) => (
            <div
              key={idx}
              className="p-3 bg-surface-container-low rounded-lg border border-surface-container-high/40 flex items-center justify-between transition-all hover:bg-surface-container"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-primary text-base shrink-0">
                  folder
                </span>
                <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                  Module {(idx + 1).toString().padStart(2, "0")}: {m.title}
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0 bg-surface-container-lowest px-2 py-0.5 rounded font-mono">
                {m.unitCount} Units
              </span>
            </div>
          ))}
        </div>
      ) : (
        /* Pre-Generation Dynamic Blueprint Estimate */
        <div className="flex flex-col gap-3 pt-1">
          {/* Top Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 p-2.5 bg-surface-container-low rounded-lg border border-surface-container-high/40 text-center">
            <div>
              <span className="text-[10px] font-label-sm text-on-surface-variant block uppercase tracking-wider">
                Module Scope
              </span>
              <span className="font-label-lg text-label-lg font-bold text-primary">
                {estimate.moduleRange[0]}–{estimate.moduleRange[1]} Modules
              </span>
            </div>
            <div>
              <span className="text-[10px] font-label-sm text-on-surface-variant block uppercase tracking-wider">
                Duration
              </span>
              <span className="font-label-lg text-label-lg font-bold text-primary">
                ~{estimate.estimatedTotalHours}h Total
              </span>
            </div>
            <div>
              <span className="text-[10px] font-label-sm text-on-surface-variant block uppercase tracking-wider">
                Cadence
              </span>
              <span className="font-label-lg text-label-lg font-bold text-secondary">
                {estimate.estimatedWeeks} Weeks
              </span>
            </div>
          </div>

          {/* Major Learning Stages */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-label-sm text-on-surface font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-secondary">linear_scale</span>
              Planned Pedagogical Progression:
            </span>
            <div className="space-y-1.5">
              {estimate.learningStages.map((stage) => (
                <div
                  key={stage.stageNumber}
                  className="p-2 rounded-lg bg-surface-container-low/70 border border-surface-container-high/40 flex items-start gap-2 text-xs"
                >
                  <span className="w-4 h-4 rounded-full bg-surface-container text-primary flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {stage.stageNumber}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-on-surface truncate">
                      {stage.title}
                    </span>
                    <span className="text-[11px] text-on-surface-variant leading-tight">
                      {stage.focus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Prerequisites */}
          {estimate.recommendedPrerequisites.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-label-sm text-on-surface font-semibold">
                Expected Prerequisite Foundations:
              </span>
              <div className="flex flex-wrap gap-1">
                {estimate.recommendedPrerequisites.map((req, i) => (
                  <span
                    key={i}
                    className="text-[11px] bg-surface-container px-2 py-0.5 rounded-md text-on-surface-variant border border-surface-container-high/30"
                  >
                    • {req}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Modalities Summary */}
          <div className="flex flex-col gap-1 pt-1 border-t border-surface-container-high/30">
            <span className="text-xs font-label-sm text-on-surface font-semibold">
              Included Modality Breakdown:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {estimate.modalityCounts
                .filter((m) => m.enabled)
                .map((m) => (
                  <div
                    key={m.name}
                    className="flex items-center gap-1.5 text-[11px] text-on-surface-variant bg-surface-container-low p-1.5 rounded border border-surface-container-high/30 truncate"
                  >
                    <span className="material-symbols-outlined text-sm text-primary shrink-0">
                      {m.icon}
                    </span>
                    <span className="truncate">{m.countEstimate}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Important Assumptions Label */}
          <div className="p-2 bg-surface-container-low rounded-lg text-[10px] text-on-surface-variant border border-surface-container-high/30 flex items-start gap-1.5 leading-relaxed">
            <span className="material-symbols-outlined text-xs text-secondary shrink-0 mt-0.5">
              info
            </span>
            <span>
              Pre-generation estimates automatically adapt to syllabus breadth, learner difficulty, and weekly hours. Module titles and resources are finalized during live synthesis.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
