"use client";

import React, { useState, useMemo } from "react";
import { useBuilderStore } from "@/lib/store/builderStore";
import { estimateBlueprint, CurriculumBlueprintEstimate } from "@/lib/curriculum/blueprintEstimator";

interface Step3ReviewCurriculumProps {
  onBack: () => void;
  onCreateCourse: () => void;
  isGenerating: boolean;
}

export default function Step3ReviewCurriculum({
  onBack,
  onCreateCourse,
  isGenerating,
}: Step3ReviewCurriculumProps) {
  const {
    config,
    setTitle,
    updateConfig,
    updateCurriculumOverride,
    reorderCurriculumModules,
  } = useBuilderStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitleText, setEditedTitleText] = useState(config.title || "");
  const [editingModuleIdx, setEditingModuleIdx] = useState<number | null>(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState("");
  const [newObjectiveText, setNewObjectiveText] = useState("");

  // Live Blueprint Calculation
  const estimate: CurriculumBlueprintEstimate = useMemo(() => {
    return estimateBlueprint(config);
  }, [config]);

  // Computed Proposed Modules (combining phases + overrides)
  const proposedModules = useMemo(() => {
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
          isRemoved: Boolean(override?.isRemoved),
          isCustomized: Boolean(override?.title && override.title !== phase.title),
        };
      })
      .filter((m) => !m.isRemoved);

    // Also include added modules beyond base phases
    overrides
      .filter((o) => o.moduleIndex >= phases.length && !o.isRemoved)
      .forEach((o) => {
        baseModules.push({
          moduleIndex: o.moduleIndex,
          title: o.title,
          focus: "Specialized Custom Unit",
          estimatedHours: 4,
          isRemoved: false,
          isCustomized: true,
        });
      });

    return baseModules;
  }, [estimate.progressionPhases, config.curriculumBlueprintOverrides]);

  // Title Save
  const handleSaveTitle = () => {
    const clean = editedTitleText.trim();
    if (clean) {
      setTitle(clean);
    }
    setIsEditingTitle(false);
  };

  // Module Title Edit Handlers
  const handleStartEditModule = (idx: number, currentTitle: string) => {
    setEditingModuleIdx(idx);
    setEditingModuleTitle(currentTitle);
  };

  const handleSaveModuleTitle = (idx: number) => {
    const clean = editingModuleTitle.trim();
    if (clean) {
      updateCurriculumOverride({ moduleIndex: idx, title: clean });
    }
    setEditingModuleIdx(null);
  };

  // Reordering Handlers
  const handleMoveModuleUp = (currentPos: number) => {
    if (currentPos > 0) {
      reorderCurriculumModules(currentPos, currentPos - 1);
    }
  };

  const handleMoveModuleDown = (currentPos: number) => {
    if (currentPos < proposedModules.length - 1) {
      reorderCurriculumModules(currentPos, currentPos + 1);
    }
  };

  // Remove Module
  const handleRemoveModule = (moduleIdx: number, moduleTitle: string) => {
    if (proposedModules.length <= 1) return;
    updateCurriculumOverride({ moduleIndex: moduleIdx, title: moduleTitle, isRemoved: true });
  };

  // Add Module Pillar
  const handleAddModule = () => {
    const nextIdx = Math.max(
      estimate.progressionPhases?.length || 0,
      ...(config.curriculumBlueprintOverrides || []).map((o) => o.moduleIndex + 1),
      proposedModules.length
    );
    updateCurriculumOverride({
      moduleIndex: nextIdx,
      title: `Specialized Unit ${proposedModules.length + 1}: Practical Synthesis`,
      isRemoved: false,
    });
  };

  // Learning Objectives
  const defaultObjectives = useMemo(() => {
    const primaryTopic = config.selectedTopics[0]?.label || config.title || "Subject";
    return [
      `Master core mathematical and conceptual foundations of ${primaryTopic}.`,
      `Understand real-world applications, derivations, and common problem-solving patterns.`,
      `Verify retention through module-by-module formative diagnostic quizzes.`,
    ];
  }, [config.selectedTopics, config.title]);

  const activeObjectives = (config.learningObjectives && config.learningObjectives.length > 0)
    ? config.learningObjectives.map((lo) => lo.text)
    : defaultObjectives;

  const handleAddObjective = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newObjectiveText.trim();
    if (!clean) return;

    updateConfig((prev) => ({
      ...prev,
      learningObjectives: [
        ...(prev.learningObjectives || []),
        { id: `lo-${Date.now()}`, text: clean },
      ],
    }));
    setNewObjectiveText("");
  };

  const handleRemoveObjective = (idxToRemove: number) => {
    updateConfig((prev) => ({
      ...prev,
      learningObjectives: (prev.learningObjectives || []).filter((_, i) => i !== idxToRemove),
    }));
  };

  // All topics covered
  const topicsCovered = useMemo(() => {
    const userTopics = config.selectedTopics.map((t) => t.label);
    const subtopics = config.subtopics || [];
    const prereqs = estimate.prerequisiteChips || [];
    const combined = Array.from(new Set([...userTopics, ...subtopics, ...prereqs]));
    return combined.slice(0, 8);
  }, [config.selectedTopics, config.subtopics, estimate.prerequisiteChips]);

  const displayTitle = config.title || config.selectedTopics[0]?.label || "Custom Learning Path";

  return (
    <div className="space-y-space-lg animate-fadeIn">
      {/* 1. Suggested Course Title Header */}
      <div className="bg-surface-container-low rounded-2xl p-4 sm:p-5 border border-surface-container-high/60 shadow-2xs">
        <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1">
          Curriculum Preview · Verified Architecture
        </span>

        {isEditingTitle ? (
          <div className="flex items-center gap-2 mt-1">
            <input
              type="text"
              value={editedTitleText}
              onChange={(e) => setEditedTitleText(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-primary text-base font-bold text-primary font-serif focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={handleSaveTitle}
              className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditedTitleText(displayTitle);
                setIsEditingTitle(false);
              }}
              className="px-2.5 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container text-xs"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-headline-md text-headline-md font-serif text-primary tracking-tight">
              {displayTitle}
            </h2>
            <button
              type="button"
              onClick={() => {
                setEditedTitleText(displayTitle);
                setIsEditingTitle(true);
              }}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg text-primary bg-primary/10 hover:bg-primary/20 transition-colors flex items-center gap-1 shrink-0"
              title="Edit course title"
            >
              <span className="material-symbols-outlined text-xs">edit</span>
              <span>Edit Title</span>
            </button>
          </div>
        )}

        {/* Course Meta Badges */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
          <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium">
            {estimate.domainName}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium capitalize">
            {config.difficulty || "Intermediate"} Level
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium capitalize">
            {(config.teachingStyle || "balanced").replace("_", " ")} Style
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/30 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">verified</span>
            <span>Accredited Academic Sources</span>
          </span>
        </div>
      </div>

      {/* 2. Key Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/60">
          <span className="text-[11px] text-on-surface-variant block">Estimated Time</span>
          <span className="text-sm font-bold text-primary font-mono block mt-0.5">
            ~{estimate.estimatedTotalHours} Hours
          </span>
        </div>
        <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/60">
          <span className="text-[11px] text-on-surface-variant block">Study Timeline</span>
          <span className="text-sm font-bold text-primary font-mono block mt-0.5">
            ~{estimate.estimatedWeeks} Weeks ({config.weeklyHours || 5}h/wk)
          </span>
        </div>
        <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/60">
          <span className="text-[11px] text-on-surface-variant block">Curriculum Units</span>
          <span className="text-sm font-bold text-primary font-mono block mt-0.5">
            {proposedModules.length} Modules
          </span>
        </div>
        <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/60">
          <span className="text-[11px] text-on-surface-variant block">Assessment</span>
          <span className="text-sm font-bold text-secondary block mt-0.5">
            Formative Quizzes
          </span>
        </div>
      </div>

      {/* 3. Learning Objectives */}
      <section className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high/60">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-label-md text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">flag</span>
            <span>Target Learning Objectives</span>
          </h3>
          <span className="text-[11px] text-on-surface-variant">Core student outcomes</span>
        </div>

        <ul className="space-y-1.5 text-xs text-on-surface">
          {activeObjectives.map((obj, i) => (
            <li key={i} className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-surface-container-low transition-colors group">
              <span className="material-symbols-outlined text-sm text-primary shrink-0 mt-0.5">check_circle</span>
              <span className="flex-1 leading-relaxed">{obj}</span>
              {config.learningObjectives && config.learningObjectives.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemoveObjective(i)}
                  className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-error transition-opacity"
                  title="Remove objective"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              )}
            </li>
          ))}
        </ul>

        {/* Add Custom Objective Form */}
        <form onSubmit={handleAddObjective} className="flex items-center gap-2 mt-3 pt-2 border-t border-surface-container-high/40">
          <input
            type="text"
            value={newObjectiveText}
            onChange={(e) => setNewObjectiveText(e.target.value)}
            placeholder="+ Add specific goal or objective (optional)..."
            className="flex-1 px-3 py-1.5 rounded-lg bg-surface-container-low border border-surface-container-high/70 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {newObjectiveText.trim() && (
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container"
            >
              Add
            </button>
          )}
        </form>
      </section>

      {/* 4. Proposed Modules (Curriculum Tree) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-label-md text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">view_module</span>
              <span>Proposed Modules & Sequence ({proposedModules.length})</span>
            </h3>
            <p className="text-[11px] text-on-surface-variant">
              Reorder or rename modules before creating your path
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddModule}
            className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold flex items-center gap-1 border border-primary/20 transition-colors shadow-2xs"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            <span>Add Module</span>
          </button>
        </div>

        <div className="space-y-2">
          {proposedModules.map((mod, idx) => {
            const isEditingThis = editingModuleIdx === mod.moduleIndex;

            return (
              <div
                key={mod.moduleIndex}
                className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/70 hover:border-surface-container-high transition-all shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    {/* Module Order Number */}
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface-container text-primary shrink-0 mt-0.5">
                      {(idx + 1).toString().padStart(2, "0")}
                    </span>

                    <div className="flex-1 min-w-0">
                      {isEditingThis ? (
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="text"
                            value={editingModuleTitle}
                            onChange={(e) => setEditingModuleTitle(e.target.value)}
                            className="flex-1 px-2.5 py-1 rounded-md bg-surface-container-low border border-primary text-xs font-bold text-primary focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveModuleTitle(mod.moduleIndex)}
                            className="px-2 py-1 bg-primary text-on-primary text-xs font-semibold rounded"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingModuleIdx(null)}
                            className="px-1.5 py-1 text-on-surface-variant text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-on-surface font-serif truncate">
                            {mod.title}
                          </h4>
                          {mod.isCustomized && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400">
                              Customized
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStartEditModule(mod.moduleIndex, mod.title)}
                            className="text-on-surface-variant hover:text-primary p-0.5 rounded transition-colors"
                            title="Rename module"
                          >
                            <span className="material-symbols-outlined text-xs">edit</span>
                          </button>
                        </div>
                      )}

                      <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">
                        {mod.focus}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Reorder & Remove */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] font-mono text-on-surface-variant hidden sm:inline mr-2">
                      ~{mod.estimatedHours}h
                    </span>

                    <button
                      type="button"
                      onClick={() => handleMoveModuleUp(idx)}
                      disabled={idx === 0}
                      className="p-1 rounded text-on-surface-variant hover:text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      title="Move module up"
                    >
                      <span className="material-symbols-outlined text-sm">arrow_upward</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveModuleDown(idx)}
                      disabled={idx === proposedModules.length - 1}
                      className="p-1 rounded text-on-surface-variant hover:text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      title="Move module down"
                    >
                      <span className="material-symbols-outlined text-sm">arrow_downward</span>
                    </button>
                    {proposedModules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveModule(mod.moduleIndex, mod.title)}
                        className="p-1 rounded text-on-surface-variant hover:text-error transition-colors ml-1"
                        title="Remove module"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Important Topics Covered */}
      {topicsCovered.length > 0 && (
        <section className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high/60">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-2">
            Important Topics & Concepts Covered:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {topicsCovered.map((t) => (
              <span
                key={t}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-container text-primary border border-surface-container-high/60"
              >
                {t}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 6. Resource Availability & Assessment Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-surface-container-low/60 border border-surface-container-high/50 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-base text-primary shrink-0 mt-0.5">verified</span>
          <div>
            <span className="font-bold text-on-surface block">Accredited Repository Resources</span>
            <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">
              Verified lecture videos and reading monographs sourced from MIT OCW, Stanford Online, and academic publishers.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-container-low/60 border border-surface-container-high/50 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-base text-secondary shrink-0 mt-0.5">quiz</span>
          <div>
            <span className="font-bold text-on-surface block">Continuous Formative Diagnostics</span>
            <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">
              Formative checkpoint quizzes embedded at every module boundary to assess retention and mastery.
            </p>
          </div>
        </div>
      </div>

      {/* 7. Action Bar with Single Prominent CTA */}
      <div className="pt-space-md border-t border-surface-container-high/60 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isGenerating}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-surface-container-high/80 text-on-surface-variant hover:bg-surface-container font-label-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Back to Personalize</span>
        </button>

        <button
          type="button"
          onClick={onCreateCourse}
          disabled={isGenerating}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-lg text-sm font-bold flex items-center justify-center gap-2.5 shadow-md active:scale-95 transition-all disabled:opacity-50 group"
        >
          <span className={`material-symbols-outlined text-lg text-secondary-fixed ${isGenerating ? "animate-spin" : "group-hover:rotate-12 transition-transform"}`}>
            {isGenerating ? "progress_activity" : "auto_awesome"}
          </span>
          <span>{isGenerating ? "Synthesizing Learning Path..." : "Create My Learning Path"}</span>
          {!isGenerating && (
            <span className="material-symbols-outlined text-base ml-1 opacity-70 group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
