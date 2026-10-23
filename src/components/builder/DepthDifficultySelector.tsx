"use client";

import React, { useState } from "react";
import { TargetDepthLevel, LearnerDifficulty } from "@/lib/types/builder";

interface DepthDifficultySelectorProps {
  depthLevel: TargetDepthLevel;
  customDepthLevel?: string;
  difficulty: LearnerDifficulty;
  instructionLanguage: string;
  explanationLanguage?: string;
  resourceLanguage?: string;
  quizLanguage?: string;
  bilingualExplanations?: boolean;
  preserveTechnicalTerms: boolean;
  onDepthLevelChange: (level: TargetDepthLevel) => void;
  onCustomDepthLevelChange?: (val: string) => void;
  onDifficultyChange: (diff: LearnerDifficulty) => void;
  onLanguageChange: (lang: string) => void;
  onExplanationLanguageChange?: (lang: string) => void;
  onResourceLanguageChange?: (lang: string) => void;
  onQuizLanguageChange?: (lang: string) => void;
  onBilingualExplanationsChange?: (bilingual: boolean) => void;
  onPreserveTechnicalTermsChange: (preserve: boolean) => void;
}

export default function DepthDifficultySelector({
  depthLevel,
  customDepthLevel = "",
  difficulty,
  instructionLanguage,
  explanationLanguage,
  resourceLanguage,
  quizLanguage,
  bilingualExplanations = false,
  preserveTechnicalTerms,
  onDepthLevelChange,
  onCustomDepthLevelChange,
  onDifficultyChange,
  onLanguageChange,
  onExplanationLanguageChange,
  onResourceLanguageChange,
  onQuizLanguageChange,
  onBilingualExplanationsChange,
  onPreserveTechnicalTermsChange,
}: DepthDifficultySelectorProps) {
  const [showAllDepths, setShowAllDepths] = useState(false);
  const [showAdvancedLang, setShowAdvancedLang] = useState(false);

  const depthLevels: Array<{ id: TargetDepthLevel; title: string; desc: string }> = [
    { id: "foundation", title: "Foundation", desc: "Grade 9–10 fundamentals" },
    { id: "school", title: "School Level", desc: "Secondary school standard" },
    { id: "class-11", title: "Class 11", desc: "High School core curriculum" },
    { id: "class-12", title: "Class 12", desc: "Senior Board syllabus scope" },
    { id: "competitive", title: "Competitive Prep", desc: "JEE Adv / NEET / GATE Rigor" },
    { id: "undergraduate-intro", title: "Undergraduate Intro", desc: "1st-year college syllabus" },
    { id: "undergraduate-intermediate", title: "Undergraduate Core", desc: "Mid-level university standard" },
    { id: "undergraduate-advanced", title: "Undergraduate Adv", desc: "Upper-division academic depth" },
    { id: "postgraduate", title: "Postgraduate", desc: "Master's level theoretical rigor" },
    { id: "research", title: "Research Level", desc: "Doctoral & frontier literature" },
    { id: "professional", title: "Professional", desc: "Production & enterprise ready" },
    { id: "custom", title: "Custom Level", desc: "Specialized or custom academic scope" },
  ];

  const visibleDepths = showAllDepths ? depthLevels : depthLevels.slice(0, 6);

  const difficultyLevels: Array<{ id: LearnerDifficulty; label: string; sub: string }> = [
    { id: "beginner", label: "Beginner", sub: "Gentle introduction" },
    { id: "elementary", label: "Elementary", sub: "Basic concepts" },
    { id: "intermediate", label: "Intermediate", sub: "Standard rigor" },
    { id: "advanced", label: "Advanced", sub: "Complex problems" },
    { id: "expert", label: "Expert", sub: "Proof & edge cases" },
  ];

  const languages = [
    "English",
    "Hindi",
    "Hinglish (Bilingual)",
    "Marathi",
    "Bengali",
    "Tamil",
    "Telugu",
    "Kannada",
    "Malayalam",
    "Gujarati",
    "Punjabi",
    "Urdu",
    "Sanskrit",
    "French",
    "German",
    "Spanish",
    "Japanese",
    "Korean",
    "Mandarin Chinese",
  ];

  return (
    <div className="flex flex-col gap-space-lg">
      {/* 1. Target Academic Depth */}
      <div className="flex flex-col gap-space-xs">
        <div className="flex items-center justify-between">
          <label className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs font-sans">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
              2
            </span>
            Target Depth &amp; Academic Scope
          </label>
          <button
            type="button"
            onClick={() => setShowAllDepths(!showAllDepths)}
            className="text-xs text-primary font-semibold hover:underline"
          >
            {showAllDepths ? "Show Less" : "Show All 12 Levels"}
          </button>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant -mt-1">
          Calibrates module depth, prerequisite coverage, and syllabus scope.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
          {visibleDepths.map((level) => {
            const isSelected = depthLevel === level.id;
            return (
              <button
                key={level.id}
                type="button"
                onClick={() => onDepthLevelChange(level.id)}
                className={`flex flex-col items-start p-2.5 rounded-lg text-left transition-all border ${
                  isSelected
                    ? "bg-primary-container text-on-primary shadow-xs border-primary-container"
                    : "bg-surface-container-low hover:bg-surface-container text-on-surface border-surface-container-high/40"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-label-md text-label-md font-semibold truncate">
                    {level.title}
                  </span>
                  {isSelected && (
                    <span className="material-symbols-outlined text-sm text-secondary-fixed">
                      check_circle
                    </span>
                  )}
                </div>
                <span
                  className={`text-[11px] leading-tight mt-0.5 ${
                    isSelected ? "text-primary-fixed-dim" : "text-on-surface-variant"
                  }`}
                >
                  {level.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Depth Level input when custom is selected */}
        {depthLevel === "custom" && (
          <div className="p-3 bg-surface-container-low rounded-lg border border-surface-container-high/60 mt-2 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-primary">Specify Custom Academic Depth:</label>
            <input
              type="text"
              value={customDepthLevel}
              onChange={(e) => onCustomDepthLevelChange?.(e.target.value)}
              placeholder="e.g. Year 2 MBBS Pathology, Post-Doc Research Fellowship, Corporate L&D Tier 3"
              className="bg-surface-container-lowest px-3 py-1.5 rounded-md text-xs text-on-surface border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}
      </div>

      {/* 2. Independent Learner Difficulty */}
      <div className="flex flex-col gap-space-xs">
        <label className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs font-sans">
          <span className="material-symbols-outlined text-base text-secondary">tune</span>
          Difficulty Calibration
        </label>
        <p className="font-body-sm text-body-sm text-on-surface-variant -mt-1">
          Adjusts explanation complexity, practice problem difficulty, and diagnostic assessment standards.
        </p>

        <div className="grid grid-cols-5 gap-1.5 mt-1">
          {difficultyLevels.map((d) => {
            const isSelected = difficulty === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onDifficultyChange(d.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${
                  isSelected
                    ? "bg-primary text-on-primary border-primary shadow-xs font-semibold"
                    : "bg-surface-container-low hover:bg-surface-container text-on-surface border-surface-container-high/40"
                }`}
              >
                <span className="font-label-sm text-label-sm truncate w-full">{d.label}</span>
                <span className={`text-[10px] hidden sm:block truncate w-full ${isSelected ? "text-primary-fixed-dim" : "text-on-surface-variant"}`}>
                  {d.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Instruction Language & Terminology Preference */}
      <div className="flex flex-col gap-space-xs">
        <div className="flex items-center justify-between">
          <label className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs font-sans">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
              3
            </span>
            Instruction Language
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAdvancedLang(!showAdvancedLang)}
              className="text-xs text-primary font-semibold hover:underline"
            >
              {showAdvancedLang ? "Basic Language" : "Granular Preferences"}
            </button>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-on-surface-variant">
              <input
                type="checkbox"
                checked={preserveTechnicalTerms}
                onChange={(e) => onPreserveTechnicalTermsChange(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-primary accent-primary"
              />
              <span>Preserve Technical Terms</span>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-1">
          {languages.map((lang) => {
            const isSelected = instructionLanguage === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  onLanguageChange(lang);
                  if (!explanationLanguage) onExplanationLanguageChange?.(lang);
                  if (!resourceLanguage) onResourceLanguageChange?.(lang);
                }}
                className={`px-3 py-1 rounded-full font-label-sm text-label-sm font-medium transition-all border ${
                  isSelected
                    ? "bg-primary text-on-primary border-primary shadow-2xs font-semibold"
                    : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface border-surface-container-high/40"
                }`}
              >
                {lang}
              </button>
            );
          })}
        </div>

        {/* Granular Language Controls (Explanation, Resources, Quizzes, Bilingual) */}
        {showAdvancedLang && (
          <div className="p-3 bg-surface-container-low rounded-lg border border-surface-container-high/50 mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="font-semibold text-on-surface-variant block mb-1">
                Explanation Language:
              </label>
              <select
                value={explanationLanguage || instructionLanguage}
                onChange={(e) => onExplanationLanguageChange?.(e.target.value)}
                className="w-full bg-surface-container-lowest px-2 py-1 rounded border border-surface-container-high"
              >
                {languages.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-on-surface-variant block mb-1">
                Resource Language:
              </label>
              <select
                value={resourceLanguage || instructionLanguage}
                onChange={(e) => onResourceLanguageChange?.(e.target.value)}
                className="w-full bg-surface-container-lowest px-2 py-1 rounded border border-surface-container-high"
              >
                {languages.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-on-surface-variant block mb-1">
                Quiz / Assessment Language:
              </label>
              <select
                value={quizLanguage || instructionLanguage}
                onChange={(e) => onQuizLanguageChange?.(e.target.value)}
                className="w-full bg-surface-container-lowest px-2 py-1 rounded border border-surface-container-high"
              >
                {languages.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3 pt-1 border-t border-surface-container-high/30">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bilingualExplanations}
                  onChange={(e) => onBilingualExplanationsChange?.(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-primary accent-primary"
                />
                <span className="text-on-surface">Enable Bilingual English &amp; Regional Explanations side-by-side</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
