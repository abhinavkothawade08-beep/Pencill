"use client";

import React, { useState, useMemo } from "react";
import { useBuilderStore } from "@/lib/store/builderStore";
import { estimateBlueprint, CurriculumBlueprintEstimate } from "@/lib/curriculum/blueprintEstimator";
import { EngineExecutionResult, ModuleResourceAssignment } from "@/lib/resource-engine/types";

interface CurriculumBlueprintCardProps {
  generationResult?: EngineExecutionResult | null;
  isGenerating?: boolean;
}

export default function CurriculumBlueprintCard({
  generationResult = null,
  isGenerating = false,
}: CurriculumBlueprintCardProps) {
  const { config, updateCurriculumOverride, reorderCurriculumModules, resetCurriculumOverrides } = useBuilderStore();

  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingTitleText, setEditingTitleText] = useState("");

  // Compute live mathematical blueprint estimate
  const estimate: CurriculumBlueprintEstimate = useMemo(() => {
    return estimateBlueprint(config);
  }, [config]);

  const hasSynthesized = Boolean(generationResult?.assignments && generationResult.assignments.length > 0);

  // Pre-generation estimated modules with overrides applied
  const estimatedModules = useMemo(() => {
    const phases = estimate.progressionPhases || [];
    const overrides = config.curriculumBlueprintOverrides || [];

    const baseModules = phases
      .map((phase, idx) => {
        const override = overrides.find((o) => o.moduleIndex === idx);
        return {
          moduleIndex: idx,
          title: override?.title || phase.title,
          focus: phase.focus,
          estimatedHours: phase.estimatedHours,
          isCustomized: Boolean(override?.title && override.title !== phase.title),
          isRemoved: Boolean(override?.isRemoved),
        };
      })
      .filter((m) => !m.isRemoved);

    // Also include custom added modules beyond phases.length
    overrides
      .filter((o) => o.moduleIndex >= phases.length && !o.isRemoved)
      .forEach((o) => {
        baseModules.push({
          moduleIndex: o.moduleIndex,
          title: o.title,
          focus: "Specialized Custom Unit",
          estimatedHours: 4,
          isCustomized: true,
          isRemoved: false,
        });
      });

    return baseModules;
  }, [estimate.progressionPhases, config.curriculumBlueprintOverrides]);

  const handleStartEditing = (idx: number, currentTitle: string) => {
    setEditingIndex(idx);
    setEditingTitleText(currentTitle);
  };

  const handleSaveTitle = (idx: number) => {
    const clean = editingTitleText.trim();
    if (clean) {
      updateCurriculumOverride({ moduleIndex: idx, title: clean });
    }
    setEditingIndex(null);
  };

  const handleMoveUp = (idx: number) => {
    if (idx > 0) {
      reorderCurriculumModules(idx, idx - 1);
    }
  };

  const handleMoveDown = (idx: number) => {
    if (idx < estimatedModules.length - 1) {
      reorderCurriculumModules(idx, idx + 1);
    }
  };

  const handleRemoveBlueprintModule = (idx: number) => {
    if (estimatedModules.length <= 1) return;
    const target = estimatedModules.find((m) => m.moduleIndex === idx);
    updateCurriculumOverride({ moduleIndex: idx, title: target?.title || '', isRemoved: true });
  };

  const handleAddBlueprintModule = () => {
    const nextIdx = Math.max(
      estimate.progressionPhases?.length || 0,
      ...(config.curriculumBlueprintOverrides || []).map((o) => o.moduleIndex + 1),
      estimatedModules.length
    );
    updateCurriculumOverride({
      moduleIndex: nextIdx,
      title: `Specialized Unit ${estimatedModules.length + 1}`,
      isRemoved: false,
    });
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-high/60 flex flex-col gap-space-sm" id="curriculum-blueprint-preview">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-lg">architecture</span>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-serif">
              Curriculum Blueprint
            </h3>
            <span className="text-[11px] text-on-surface-variant">
              {hasSynthesized
                ? "Synthesized & Persisted Pathway"
                : `${estimate.moduleRange[0]}–${estimate.moduleRange[1]} Estimated Modules · ~${estimate.estimatedTotalHours}h Workload`}
            </span>
          </div>
        </div>
        <span
          className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full font-mono text-[11px] ${
            hasSynthesized
              ? "bg-secondary-fixed text-on-secondary-fixed font-semibold"
              : isGenerating
              ? "bg-primary-fixed text-primary animate-pulse"
              : "bg-surface-container text-on-surface-variant"
          }`}
        >
          {hasSynthesized ? "Live Verified Course" : isGenerating ? "Synthesizing..." : "Dynamic Blueprint"}
        </span>
      </div>

      {hasSynthesized ? (
        /* Real Synthesized Course Modules View */
        <div className="space-y-2 pt-1" id="modules-container">
          {generationResult!.assignments.map((assign: ModuleResourceAssignment, idx: number) => {
            const num = (idx + 1).toString().padStart(2, "0");
            const isExpanded = expandedIndex === idx;

            return (
              <div
                key={assign.moduleId}
                className="rounded-xl bg-surface-container-low border border-surface-container-high/60 overflow-hidden transition-all"
              >
                {/* Module Bar */}
                <div
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-surface-container transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="w-6 h-6 rounded-md bg-surface-container-highest text-primary flex items-center justify-center font-label-sm text-label-sm font-bold shrink-0">
                      {num}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-lg text-label-lg text-on-surface truncate font-semibold">
                        {assign.moduleTitle}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                        {assign.videos.length} videos · {assign.readings.length} readings ·{" "}
                        {assign.quiz ? "1 checkpoint quiz" : "study notes"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-on-secondary-container bg-secondary-fixed/50 px-2 py-0.5 rounded font-medium">
                      Ready
                    </span>
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">
                      {isExpanded ? "expand_less" : "expand_more"}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-3 bg-surface-container-lowest border-t border-surface-container-high/60 space-y-2 text-xs animate-fadeIn">
                    {/* Videos */}
                    {assign.videos.length > 0 && (
                      <div>
                        <span className="font-semibold text-primary block mb-1">Curated Lectures:</span>
                        <ul className="space-y-1">
                          {assign.videos.map((v, vIdx) => (
                            <li key={vIdx} className="flex items-center justify-between gap-2 text-on-surface-variant bg-surface-container-low p-1.5 rounded">
                              <span className="truncate flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs text-primary">play_circle</span>
                                <span>{v.title}</span>
                              </span>
                              <span className="text-[10px] font-mono shrink-0">{v.durationMinutes}m</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Readings */}
                    {assign.readings.length > 0 && (
                      <div>
                        <span className="font-semibold text-primary block mb-1">Official Reading Materials:</span>
                        <ul className="space-y-1">
                          {assign.readings.map((r, rIdx) => (
                            <li key={rIdx} className="flex items-center justify-between gap-2 text-on-surface-variant bg-surface-container-low p-1.5 rounded">
                              <span className="truncate flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs text-secondary">menu_book</span>
                                <span>{r.title}</span>
                              </span>
                              <span className="text-[10px] font-mono shrink-0">{r.providerId}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Checkpoint Quiz */}
                    {assign.quiz && (
                      <div className="p-2 bg-secondary-container/20 border border-secondary/20 rounded flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-secondary">
                          <span className="material-symbols-outlined text-sm">quiz</span>
                          <span>{assign.quiz.title} ({assign.quiz.questions.length} questions)</span>
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-mono">100% Aligned</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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

          {/* Interactive Estimated Modules List with Renaming and Reordering */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-label-sm text-on-surface font-semibold">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-secondary">linear_scale</span>
                Planned Sequential Modules (Click title to rename):
              </span>
              {(config.curriculumBlueprintOverrides || []).length > 0 && (
                <button
                  type="button"
                  onClick={resetCurriculumOverrides}
                  className="text-[11px] text-on-surface-variant hover:text-primary hover:underline"
                >
                  Reset Custom Titles
                </button>
              )}
            </div>

            {estimatedModules.map((mod, idx) => {
              const num = (idx + 1).toString().padStart(2, "0");
              const isEditing = editingIndex === idx;

              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-surface-container-low/70 border border-surface-container-high/40 flex items-center justify-between gap-2 group hover:border-primary/40 transition-all text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-5 h-5 rounded bg-surface-container text-primary flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
                      {num}
                    </span>

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editingTitleText}
                            onChange={(e) => setEditingTitleText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveTitle(idx);
                              if (e.key === "Escape") setEditingIndex(null);
                            }}
                            className="w-full bg-surface-container-lowest px-2 py-1 rounded text-xs text-on-surface border border-primary focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveTitle(idx)}
                            className="px-2 py-1 bg-primary text-on-primary text-[11px] rounded font-semibold shrink-0"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleStartEditing(idx, mod.title)}
                          className="cursor-pointer group-hover:text-primary transition-colors flex items-center gap-1"
                        >
                          <span className="font-semibold text-on-surface truncate">
                            {mod.title}
                          </span>
                          <span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-60 transition-opacity">
                            edit
                          </span>
                          {mod.isCustomized && (
                            <span className="text-[9px] bg-secondary-fixed/50 text-on-secondary-fixed px-1 rounded font-mono">
                              Edited
                            </span>
                          )}
                        </div>
                      )}
                      <span className="text-[11px] text-on-surface-variant block truncate">
                        {mod.focus} · ~{mod.estimatedHours}h
                      </span>
                    </div>
                  </div>

                  {/* Actions: Reordering & Removal */}
                  <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveUp(idx)}
                      className="p-1 hover:bg-surface-container rounded text-on-surface-variant disabled:opacity-30"
                      title="Move Module Up"
                      aria-label={`Move Module ${idx + 1} Up`}
                    >
                      <span className="material-symbols-outlined text-sm">arrow_upward</span>
                    </button>
                    <button
                      type="button"
                      disabled={idx === estimatedModules.length - 1}
                      onClick={() => handleMoveDown(idx)}
                      className="p-1 hover:bg-surface-container rounded text-on-surface-variant disabled:opacity-30"
                      title="Move Module Down"
                      aria-label={`Move Module ${idx + 1} Down`}
                    >
                      <span className="material-symbols-outlined text-sm">arrow_downward</span>
                    </button>
                    {estimatedModules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBlueprintModule(mod.moduleIndex)}
                        className="p-1 hover:bg-error-container/20 rounded text-on-surface-variant hover:text-error"
                        title="Remove Module from Blueprint"
                        aria-label={`Remove Module ${idx + 1}`}
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add Custom Blueprint Module Button */}
            <button
              type="button"
              onClick={handleAddBlueprintModule}
              className="w-full py-2 px-3 border border-dashed border-surface-container-high hover:border-primary/60 rounded-lg text-[11px] font-semibold text-primary hover:bg-surface-container-low transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              <span>+ Add Custom Topic Unit</span>
            </button>
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

          {/* Included Modality Breakdown */}
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
        </div>
      )}
    </div>
  );
}
