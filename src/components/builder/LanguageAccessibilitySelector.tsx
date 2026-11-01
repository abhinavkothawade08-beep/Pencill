"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builderStore";

const LANGUAGE_OPTIONS = [
  { label: "English", value: "English" },
  { label: "Hindi (हिंदी)", value: "Hindi" },
  { label: "Hinglish (Bilingual English/Hindi)", value: "Hinglish" },
  { label: "Tamil (தமிழ்)", value: "Tamil" },
  { label: "Marathi (मराठी)", value: "Marathi" },
  { label: "Telugu (తెలుగు)", value: "Telugu" },
  { label: "Bengali (বাংলা)", value: "Bengali" },
  { label: "Gujarati (ગુજરાતી)", value: "Gujarati" },
  { label: "French (Français)", value: "French" },
  { label: "German (Deutsch)", value: "German" },
  { label: "Spanish (Español)", value: "Spanish" },
];

export default function LanguageAccessibilitySelector() {
  const { config, updateConfig, updateLanguageSettings } = useBuilderStore();

  const lang = config.languageSettings || {
    explanationLanguage: config.language || "English",
    videoLanguage: "English",
    readingLanguage: "English",
    quizLanguage: "English",
  };

  const requireCaptions = config.videoPreferences?.requireCaptions || false;
  const access = config.advanced.accessibility || {
    captions: false,
    highContrast: false,
    transcripts: false,
  };

  const handleLangChange = (key: keyof typeof lang, val: string) => {
    updateLanguageSettings({ [key]: val });
  };

  const toggleCaptions = () => {
    const next = !requireCaptions;
    updateConfig((prev) => ({
      ...prev,
      videoPreferences: {
        ...prev.videoPreferences,
        requireCaptions: next,
      },
      advanced: {
        ...prev.advanced,
        accessibility: {
          ...prev.advanced.accessibility,
          captions: next,
        },
      },
    }));
  };

  const toggleHighContrast = () => {
    const next = !access.highContrast;
    updateConfig((prev) => ({
      ...prev,
      advanced: {
        ...prev.advanced,
        accessibility: {
          ...prev.advanced.accessibility,
          highContrast: next,
        },
      },
    }));
  };

  const toggleTranscripts = () => {
    const next = !access.transcripts;
    updateConfig((prev) => ({
      ...prev,
      advanced: {
        ...prev.advanced,
        accessibility: {
          ...prev.advanced.accessibility,
          transcripts: next,
        },
      },
    }));
  };

  return (
    <div className="flex flex-col gap-space-sm" id="section-language-accessibility">
      <div className="flex items-center justify-between">
        <label className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs font-semibold">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-bold">
            7
          </span>
          Granular Language &amp; Accessibility Directives
        </label>
        <span className="font-label-sm text-label-sm text-secondary font-medium">
          Multilingual Support
        </span>
      </div>

      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Configure distinct languages for theoretical explanations, video lectures, reading extracts, and assessment questions.
      </p>

      {/* 4 Granular Language Selectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mt-1">
        {/* Explanation Language */}
        <div className="p-2.5 bg-surface-container-low rounded-xl border border-surface-container-high/60 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-primary">record_voice_over</span>
            <span>Explanation Language</span>
          </label>
          <select
            value={lang.explanationLanguage}
            onChange={(e) => handleLangChange("explanationLanguage", e.target.value)}
            className="w-full bg-surface-container-lowest px-2.5 py-1.5 rounded-lg text-xs text-on-surface border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {LANGUAGE_OPTIONS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-on-surface-variant leading-tight">
            Synthesized AI lesson overviews &amp; study notes
          </span>
        </div>

        {/* Video Language */}
        <div className="p-2.5 bg-surface-container-low rounded-xl border border-surface-container-high/60 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-primary">smart_display</span>
            <span>Video Lecture Language</span>
          </label>
          <select
            value={lang.videoLanguage}
            onChange={(e) => handleLangChange("videoLanguage", e.target.value)}
            className="w-full bg-surface-container-lowest px-2.5 py-1.5 rounded-lg text-xs text-on-surface border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {LANGUAGE_OPTIONS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-on-surface-variant leading-tight">
            YouTube &amp; NPTEL video discovery filter
          </span>
        </div>

        {/* Reading Language */}
        <div className="p-2.5 bg-surface-container-low rounded-xl border border-surface-container-high/60 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-primary">menu_book</span>
            <span>Reading &amp; Notes</span>
          </label>
          <select
            value={lang.readingLanguage}
            onChange={(e) => handleLangChange("readingLanguage", e.target.value)}
            className="w-full bg-surface-container-lowest px-2.5 py-1.5 rounded-lg text-xs text-on-surface border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {LANGUAGE_OPTIONS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-on-surface-variant leading-tight">
            Textbooks, official docs &amp; arXiv monographs
          </span>
        </div>

        {/* Quiz Language */}
        <div className="p-2.5 bg-surface-container-low rounded-xl border border-surface-container-high/60 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-primary">quiz</span>
            <span>Assessment Language</span>
          </label>
          <select
            value={lang.quizLanguage}
            onChange={(e) => handleLangChange("quizLanguage", e.target.value)}
            className="w-full bg-surface-container-lowest px-2.5 py-1.5 rounded-lg text-xs text-on-surface border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {LANGUAGE_OPTIONS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-on-surface-variant leading-tight">
            Diagnostic quiz prompts &amp; answer keys
          </span>
        </div>
      </div>

      {/* Accessibility Checkboxes */}
      <div className="mt-2 pt-2 border-t border-surface-container-high/50 flex flex-wrap items-center gap-3 text-xs">
        <label className="flex items-center gap-1.5 cursor-pointer text-on-surface hover:text-primary transition-colors">
          <input
            type="checkbox"
            checked={requireCaptions}
            onChange={toggleCaptions}
            className="w-4 h-4 rounded text-primary accent-primary"
          />
          <span className="font-medium">Closed Captions Required (CC)</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer text-on-surface hover:text-primary transition-colors">
          <input
            type="checkbox"
            checked={access.highContrast}
            onChange={toggleHighContrast}
            className="w-4 h-4 rounded text-primary accent-primary"
          />
          <span className="font-medium">High Contrast Study Notes</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer text-on-surface hover:text-primary transition-colors">
          <input
            type="checkbox"
            checked={access.transcripts}
            onChange={toggleTranscripts}
            className="w-4 h-4 rounded text-primary accent-primary"
          />
          <span className="font-medium">Text Transcripts for Audio/Video</span>
        </label>
      </div>
    </div>
  );
}
