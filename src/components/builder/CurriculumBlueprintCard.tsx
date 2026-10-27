"use client";

import React, { useMemo } from "react";
import { useBuilderStore } from "@/lib/store/builderStore";
import { estimateBlueprint, CurriculumBlueprintEstimate } from "@/lib/curriculum/blueprintEstimator";

interface SynthesizedModulePreview {
  title: string;
  unitCount: number;
  status?: "Ready" | "Synthesizing" | "Queued";
  details?: string;
}

interface CurriculumBlueprintCardProps {
  synthesizedModules?: SynthesizedModulePreview[];
  isGenerating?: boolean;
}

export default function CurriculumBlueprintCard({
  synthesizedModules = [],
  isGenerating = false,
}: CurriculumBlueprintCardProps) {
  const { config } = useBuilderStore();

  // Compute estimate with pure function
  const estimate: CurriculumBlueprintEstimate = useMemo(() => {
    return estimateBlueprint(config);
  }, [config]);

  const hasSynthesized = synthesizedModules.length > 0;

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-high/60 flex flex-col gap-space-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-lg">architecture</span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-serif">
            Curriculum Blueprint
          </h3>
        </div>
        <span className="font-label-sm text-label-sm text-secondary font-medium font-mono">
          {hasSynthesized ? "Live Preview" : "Dynamic Estimate"}
        </span>
      </div>

      {hasSynthesized ? (
        /* Real-Time Module Preview / Synthesized Modules (Matches Screenshot) */
        <div className="space-y-2 pt-1" id="modules-container">
          {synthesizedModules.map((m, idx) => {
            const num = (idx + 1).toString().padStart(2, "0");
            const status = m.status || (idx === 0 ? "Ready" : idx === 1 && isGenerating ? "Synthesizing" : "Queued");

            return (
              <div
                key={idx}
                className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between group hover:bg-surface-container transition-all"
              >
                <div className="flex items-center gap-space-sm min-w-0 pr-2">
                  <span className="w-6 h-6 rounded-md bg-surface-container-highest text-primary flex items-center justify-center font-label-sm text-label-sm font-bold shrink-0">
                    {num}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-lg text-label-lg text-on-surface truncate font-semibold">
                      {m.title}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                      {m.details || `${m.unitCount} lectures · 1 practice sheet · 45 mins`}
                    </span>
                  </div>
                </div>

                <span
                  className={`font-label-sm text-label-sm px-2 py-0.5 rounded font-medium shrink-0 ${
                    status === "Ready"
                      ? "text-on-secondary-container bg-secondary-fixed/50"
                      : status === "Synthesizing"
                      ? "text-primary bg-primary-fixed"
                      : "text-on-surface-variant bg-surface-container"
                  }`}
                >
                  {status}
                </span>
              </div>
            );
          })}

          <div className="mt-space-md pt-space-sm border-t border-surface-container-high flex items-center gap-space-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-base text-secondary">menu_book</span>
            <span className="font-label-sm text-label-sm italic">
              Organized according to {config.examAlign.examName || "NCERT & University"} syllabus directives.
            </span>
          </div>
        </div>
      ) : (
        /* Pre-Generation Dynamic Blueprint Estimate */
        <div className="flex flex-col gap-3 pt-1">
          {/* Quick Metrics Grid */}
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

          {/* Planned Pedagogical Progression (3 Phases) */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-label-sm text-on-surface font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-secondary">linear_scale</span>
              Planned Pedagogical Progression:
            </span>
            <div className="space-y-1.5">
              {estimate.progressionPhases.map((phase) => (
                <div
                  key={phase.stageNumber}
                  className="p-2 rounded-lg bg-surface-container-low/70 border border-surface-container-high/40 flex items-start gap-2 text-xs"
                >
                  <span className="w-4 h-4 rounded-full bg-surface-container text-primary flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {phase.stageNumber}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-on-surface truncate">
                      {phase.title}
                    </span>
                    <span className="text-[11px] text-on-surface-variant leading-tight">
                      {phase.focus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prerequisite Foundations */}
          {estimate.prerequisiteChips.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-label-sm text-on-surface font-semibold">
                Expected Prerequisite Foundations:
              </span>
              <div className="flex flex-wrap gap-1">
                {estimate.prerequisiteChips.map((req, i) => (
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

          {/* Included Modality Breakdown (Unchecked are hidden) */}
          <div className="flex flex-col gap-1 pt-1 border-t border-surface-container-high/30">
            <span className="text-xs font-label-sm text-on-surface font-semibold">
              Included Modality Breakdown:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {estimate.modalityCounts.map((m) => (
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

          {/* Footnote */}
          <div className="p-2 bg-surface-container-low rounded-lg text-[10px] text-on-surface-variant border border-surface-container-high/30 flex items-start gap-1.5 leading-relaxed">
            <span className="material-symbols-outlined text-xs text-secondary shrink-0 mt-0.5">
              info
            </span>
            <span>{estimate.assumptionsFootnote}</span>
          </div>
        </div>
      )}
    </div>
  );
}
