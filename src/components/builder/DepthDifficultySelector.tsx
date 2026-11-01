"use client";

import React, { useState, useMemo } from "react";
import { getLevelsForDomain, LEVEL_LADDER_12 } from "@/lib/catalogs/levelCatalog";
import { useBuilderStore } from "@/lib/store/builderStore";
import { LearnerDifficultyTier, DifficultyPreferenceType } from "@/lib/types/builderConfig";

export default function DepthDifficultySelector() {
  const { config, updateConfig, setDifficultyPreference } = useBuilderStore();
  const [showAllDepths, setShowAllDepths] = useState(false);

  // Filter levels for active domain
  const availableLevels = useMemo(() => {
    return getLevelsForDomain(config.domainId);
  }, [config.domainId]);

  const visibleLevels = showAllDepths ? availableLevels : availableLevels.slice(0, 6);

  const difficultyLevels: Array<{ id: LearnerDifficultyTier; label: string; sub: string }> = [
    { id: "beginner", label: "Beginner", sub: "Gentle introduction & core primers" },
    { id: "elementary", label: "Elementary", sub: "Basic concepts & syntax drill" },
    { id: "intermediate", label: "Intermediate", sub: "Standard rigor & derivations" },
    { id: "advanced", label: "Advanced", sub: "Complex problems & edge cases" },
    { id: "expert", label: "Expert", sub: "Mathematical proofs & edge rigor" },
  ];

  const difficultyPreferences: Array<{ id: DifficultyPreferenceType; label: string; desc: string; icon: string }> = [
    { id: "easy", label: "Easy / Gentle", desc: "Intuitive explanations, minimal algebraic friction, guided examples", icon: "filter_vintage" },
    { id: "moderate", label: "Moderate / Standard", desc: "Standard classroom rigor, analytical definitions, mixed problems", icon: "equalizer" },
    { id: "challenging", label: "Challenging", desc: "Rigorous proofs, non-trivial edge cases, complex multi-step numericals", icon: "fitness_center" },
    { id: "progressive", label: "Progressive Ladder", desc: "Starts foundational, escalates to advanced Olympiad/exam standard", icon: "trending_up" },
  ];

  return (
    <div className="flex flex-col gap-space-md" id="section-depth-difficulty">
      {/* 2. Target Academic Depth */}
      <div className="flex flex-col gap-space-xs">
        <div className="flex items-center justify-between">
          <label className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs font-sans">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
              3
            </span>
            Target Depth &amp; Difficulty Preference
          </label>
          <span className="font-label-sm text-label-sm text-secondary font-medium">Domain-Calibrated</span>
        </div>

        {/* Pedagogical Distinction Callout */}
        <div className="p-2.5 bg-surface-container-low rounded-xl border border-surface-container-high/40 text-xs text-on-surface-variant flex items-start gap-2 leading-relaxed">
          <span className="material-symbols-outlined text-sm text-primary shrink-0 mt-0.5">info</span>
          <div>
            <strong className="text-on-surface font-semibold">Depth vs. Difficulty:</strong>{" "}
            <strong>Depth</strong> controls syllabus scope (how extensively a subject is mapped);{" "}
            <strong>Difficulty</strong> governs problem complexity, mathematical rigor, and quiz scoring thresholds.
          </div>
        </div>

        {/* Level Cards Grid */}
        <div
          role="radiogroup"
          aria-label="Target Academic Depth Level"
          className="grid grid-cols-2 sm:grid-cols-3 gap-space-xs mt-space-xs"
        >
          {visibleLevels.map((lvl) => {
            const isSelected = config.depthLevelId === lvl.id;
            return (
              <button
                key={lvl.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => updateConfig({ depthLevelId: lvl.id })}
                className={`level-pill flex flex-col items-start p-space-sm rounded-lg text-left transition-all ${
                  isSelected
                    ? "bg-primary-container text-on-primary shadow-sm active-pill"
                    : "bg-surface-container-low hover:bg-surface-container text-on-surface group"
                }`}
              >
                <span className="font-label-lg text-label-lg font-semibold flex items-center justify-between w-full">
                  <span className={isSelected ? "" : "group-hover:text-primary transition-colors"}>
                    {lvl.title}
                  </span>
                  {isSelected && (
                    <span className="material-symbols-outlined text-sm text-secondary-fixed">
                      check_circle
                    </span>
                  )}
                </span>
                <span
                  className={`font-label-sm text-label-sm ${
                    isSelected ? "text-primary-fixed-dim" : "text-on-surface-variant"
                  }`}
                >
                  {lvl.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Show all depth tiers toggle */}
        {availableLevels.length > 6 && (
          <div className="flex justify-end pt-0.5">
            <button
              type="button"
              onClick={() => setShowAllDepths((prev) => !prev)}
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-0.5"
            >
              <span>{showAllDepths ? "Show fewer levels" : `Show all ${availableLevels.length} depth levels`}</span>
              <span className="material-symbols-outlined text-sm">
                {showAllDepths ? "expand_less" : "expand_more"}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Difficulty Preference Selector */}
      <div className="pt-2 border-t border-surface-container-high/40">
        <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5 mb-1.5">
          <span className="material-symbols-outlined text-sm text-primary">speed</span>
          Problem Complexity &amp; Assessment Difficulty Preference
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {difficultyPreferences.map((pref) => {
            const isSelected = (config.difficultyPreference || "moderate") === pref.id;
            return (
              <button
                key={pref.id}
                type="button"
                onClick={() => setDifficultyPreference(pref.id)}
                className={`p-2 rounded-lg text-left border text-xs transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-secondary-container/40 text-on-secondary-container border-secondary font-semibold shadow-xs"
                    : "bg-surface-container-low hover:bg-surface-container text-on-surface border-surface-container-high/40"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1 font-bold mb-1">
                    <span className="material-symbols-outlined text-sm text-primary">{pref.icon}</span>
                    <span>{pref.label}</span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant leading-tight">
                    {pref.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
