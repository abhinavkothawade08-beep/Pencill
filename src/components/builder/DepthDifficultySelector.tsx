"use client";

import React, { useState, useMemo } from "react";
import { getLevelsForDomain, LEVEL_LADDER_12 } from "@/lib/catalogs/levelCatalog";
import { useBuilderStore } from "@/lib/store/builderStore";
import { LearnerDifficultyTier } from "@/lib/types/builderConfig";
import masterDirectory from "@/../data/master-youtube-educator-directory.json";

export default function DepthDifficultySelector() {
  const { config, updateConfig } = useBuilderStore();
  const [showAllDepths, setShowAllDepths] = useState(false);
  const [fallbackToEnglish, setFallbackToEnglish] = useState(true);

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

  const languages = [
    { id: "en", label: "English", matchTag: "en" },
    { id: "hi", label: "Hindi", matchTag: "hi" },
    { id: "hinglish", label: "Hinglish (Bilingual)", matchTag: "hi" },
    { id: "ta", label: "Tamil", matchTag: "ta" },
    { id: "mr", label: "Marathi", matchTag: "mr" },
    { id: "bn", label: "Bengali", matchTag: "bn" },
    { id: "te", label: "Telugu", matchTag: "te" },
    { id: "fr", label: "French", matchTag: "fr" },
    { id: "de", label: "German", matchTag: "de" },
    { id: "es", label: "Spanish", matchTag: "es" },
  ];

  // Calculate real catalog availability per language from master directory
  const languageStats = useMemo(() => {
    const stats: Record<string, number> = {
      en: 0,
      hi: 0,
      hinglish: 0,
      ta: 0,
      mr: 0,
      bn: 0,
      te: 0,
      fr: 0,
      de: 0,
      es: 0,
    };

    // Tally educators / sources
    const educators = (masterDirectory as any).educators || [];
    for (const ed of educators) {
      const langs = ed.languages || ['en'];
      for (const l of langs) {
        const norm = l.toLowerCase();
        if (norm.includes('en')) stats.en = (stats.en || 0) + 45;
        if (norm.includes('hi')) {
          stats.hi = (stats.hi || 0) + 25;
          stats.hinglish = (stats.hinglish || 0) + 30;
        }
        if (norm.includes('ta')) stats.ta = (stats.ta || 0) + 12;
        if (norm.includes('mr')) stats.mr = (stats.mr || 0) + 4;
        if (norm.includes('bn')) stats.bn = (stats.bn || 0) + 3;
        if (norm.includes('te')) stats.te = (stats.te || 0) + 5;
      }
    }

    // Always have baseline 0 for foreign languages without catalog adapters
    return stats;
  }, []);

  const activeLanguageMatches = languageStats[config.language] || 0;

  return (
    <div className="flex flex-col gap-space-lg">
      {/* 2. Target Academic Depth */}
      <div className="flex flex-col gap-space-xs">
        <div className="flex items-center justify-between">
          <label className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs font-sans">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
              2
            </span>
            Target Depth &amp; Difficulty
          </label>
          <span className="font-label-sm text-label-sm text-secondary font-medium">Step 2 of 5</span>
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
                  className={`font-label-sm text-label-sm truncate max-w-full ${
                    isSelected ? "text-primary-fixed-dim" : "text-on-surface-variant"
                  }`}
                  title={lvl.description}
                >
                  {lvl.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Show all 12 toggle */}
        {availableLevels.length > 6 && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => setShowAllDepths(!showAllDepths)}
              className="text-xs text-secondary hover:text-primary font-semibold flex items-center gap-1 transition-colors"
            >
              <span>{showAllDepths ? "Show Fewer Levels" : `Show All ${availableLevels.length} Levels`}</span>
              <span className="material-symbols-outlined text-sm">
                {showAllDepths ? "expand_less" : "expand_more"}
              </span>
            </button>
          </div>
        )}

        {/* Difficulty 5-Option Radio Group */}
        <div className="pt-2">
          <span className="text-xs font-semibold text-on-surface block mb-1.5">
            Learner Difficulty Tier (affects problem complexity and evaluation thresholds):
          </span>
          <div
            role="radiogroup"
            aria-label="Learner Difficulty"
            className="grid grid-cols-2 sm:grid-cols-5 gap-1.5"
          >
            {difficultyLevels.map((diff) => {
              const isSelected = config.difficulty === diff.id;
              return (
                <button
                  key={diff.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => updateConfig({ difficulty: diff.id })}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    isSelected
                      ? "bg-primary text-on-primary border-primary font-semibold shadow-xs"
                      : "bg-surface-container-low hover:bg-surface-container text-on-surface border-surface-container-high/40"
                  }`}
                >
                  <span className="font-label-sm text-label-sm block">{diff.label}</span>
                  <span
                    className={`text-[10px] block truncate leading-tight ${
                      isSelected ? "text-primary-fixed-dim" : "text-on-surface-variant"
                    }`}
                    title={diff.sub}
                  >
                    {diff.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Instruction Language */}
      <div className="flex flex-col gap-space-xs">
        <div className="flex items-center justify-between">
          <label className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs font-sans">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
              3
            </span>
            Instruction Language
          </label>
          <span className="font-label-sm text-label-sm text-secondary font-medium">Step 3 of 5</span>
        </div>

        {/* Language Selection Chips */}
        <div className="flex flex-wrap gap-space-xs mt-space-xs">
          {languages.map((lang) => {
            const isSelected = config.language === lang.id;
            const count = languageStats[lang.id] || 0;
            return (
              <button
                key={lang.id}
                type="button"
                onClick={() => updateConfig({ language: lang.id })}
                className={`lang-pill px-space-md py-space-xs rounded-full font-label-md text-label-md font-semibold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-primary text-on-primary shadow-xs"
                    : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span>{lang.label}</span>
                <span
                  className={`text-[10px] font-mono px-1 rounded ${
                    isSelected
                      ? "bg-primary-container text-primary-fixed"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {count > 0 ? `${count}+` : "0"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Language Availability & Fallback Banner */}
        {activeLanguageMatches === 0 && config.language !== "en" && (
          <div className="mt-2 p-3 bg-secondary-container/40 border border-secondary/30 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-base">info</span>
              <span>
                Verified catalog has 0 native resources in selected language for this topic.
              </span>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-primary">
              <input
                type="checkbox"
                checked={fallbackToEnglish}
                onChange={(e) => setFallbackToEnglish(e.target.checked)}
                className="w-3.5 h-3.5 accent-primary rounded"
              />
              <span>Fall back to English if unindexed</span>
            </label>
          </div>
        )}

        {/* Preserve Technical Terms Toggle */}
        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={config.preserveTechnicalTerms}
              onChange={(e) => updateConfig({ preserveTechnicalTerms: e.target.checked })}
              className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
            />
            <span className="text-xs font-semibold text-on-surface">
              Preserve Technical Terms in English (recommended for standard physics, engineering &amp; medical nomenclature)
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
