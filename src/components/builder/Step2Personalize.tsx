"use client";

import React, { useState } from "react";
import { useBuilderStore } from "@/lib/store/builderStore";
import rawEducatorsDirectory from "@/../data/master-youtube-educator-directory.json";

interface Step2PersonalizeProps {
  onBack: () => void;
  onPreview: () => void;
}

export default function Step2Personalize({ onBack, onPreview }: Step2PersonalizeProps) {
  const { config, updateConfig, toggleEducatorPreference, toggleRepositoryPreference } = useBuilderStore();

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isCustomHours, setIsCustomHours] = useState(
    ![2, 5, 10].includes(config.weeklyHours || 5)
  );

  // Educator Directory
  const allEducators: any[] = (rawEducatorsDirectory as any).educators || [];
  const popularEducators = allEducators.slice(0, 10);

  const preferredEducators = config.educatorPreferences?.preferredEducatorIds || [];
  const preferredRepos = config.repositoryPreferences?.preferredRepositories || ["NCERT", "NPTEL", "Khan Academy", "MIT OCW"];

  // 1. Knowledge Level Handlers
  const currentLevel = config.difficulty || "intermediate";
  const handleLevelSelect = (lvl: "beginner" | "intermediate" | "advanced") => {
    updateConfig((prev) => ({
      ...prev,
      difficulty: lvl,
      depthLevelId: lvl === "beginner" ? "foundation" : lvl === "advanced" ? "competitive" : "class-11",
      advanced: {
        ...prev.advanced,
        currentLevel: lvl === "beginner" ? "complete-beginner" : lvl === "advanced" ? "advanced" : "intermediate",
      },
    }));
  };

  // 2. Learning Depth Handlers
  const currentDepth = config.depthLevelId.includes("foundation")
    ? "quick"
    : config.depthLevelId.includes("competitive")
    ? "mastery"
    : "detailed";

  const handleDepthSelect = (depth: "quick" | "detailed" | "mastery") => {
    updateConfig((prev) => ({
      ...prev,
      depthLevelId: depth === "quick" ? "foundation" : depth === "mastery" ? "competitive" : "class-11",
      readingPreferences: {
        ...prev.readingPreferences,
        readingDepth: depth === "quick" ? "concise" : depth === "mastery" ? "rigorous" : "detailed",
      },
    }));
  };

  // 3. Learning Approach Handlers
  const currentApproach = config.teachingStyle || "balanced";
  const handleApproachSelect = (style: "balanced" | "theory_first" | "practice_first") => {
    updateConfig((prev) => ({
      ...prev,
      teachingStyle: style,
    }));
  };

  // 4. Weekly Hours Handlers
  const handleHoursSelect = (hours: number) => {
    setIsCustomHours(false);
    updateConfig((prev) => ({
      ...prev,
      weeklyHours: hours,
      scheduleSettings: {
        ...prev.scheduleSettings,
        pace: hours <= 2 ? "casual" : hours >= 10 ? "intensive" : "balanced",
      },
    }));
  };

  const handleCustomHoursChange = (hours: number) => {
    const valid = Math.max(1, Math.min(60, hours));
    updateConfig((prev) => ({
      ...prev,
      weeklyHours: valid,
    }));
  };

  // Modality toggle helper
  const handleModalityToggle = (key: keyof typeof config.modalities) => {
    updateConfig((prev) => ({
      ...prev,
      modalities: {
        ...prev.modalities,
        [key]: !prev.modalities[key],
      },
    }));
  };

  return (
    <div className="space-y-space-xl animate-fadeIn">
      {/* A. Knowledge Level */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <label className="block font-label-md text-xs uppercase tracking-wider text-primary font-bold">
            A. Your Knowledge Level
          </label>
          <span className="text-xs text-on-surface-variant">Calibrates prerequisite depth</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: "beginner" as const,
              title: "Beginner",
              sub: "No prior background assumed. Starts from foundational concepts and principles.",
              icon: "eco",
            },
            {
              id: "intermediate" as const,
              title: "Intermediate",
              badge: "Recommended",
              sub: "Familiar with basics. Ready for core methods, problem-solving, and applications.",
              icon: "stairs",
            },
            {
              id: "advanced" as const,
              title: "Advanced",
              sub: "Strong foundation. Focuses on advanced derivations, edge cases, and rigor.",
              icon: "military_tech",
            },
          ].map((lvl) => {
            const isSelected = currentLevel === lvl.id;
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => handleLevelSelect(lvl.id)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/20"
                    : "bg-surface-container-low hover:bg-surface-container border-surface-container-high/60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`material-symbols-outlined text-xl ${isSelected ? "text-primary" : "text-on-surface-variant"}`}>
                      {lvl.icon}
                    </span>
                    {lvl.badge && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary/20 text-secondary uppercase tracking-wider">
                        {lvl.badge}
                      </span>
                    )}
                  </div>
                  <h4 className={`text-xs font-bold ${isSelected ? "text-primary" : "text-on-surface"}`}>
                    {lvl.title}
                  </h4>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed mt-1">
                    {lvl.sub}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* B. Learning Depth */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <label className="block font-label-md text-xs uppercase tracking-wider text-primary font-bold">
            B. Learning Depth
          </label>
          <span className="text-xs text-on-surface-variant">Determines module count and detail</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: "quick" as const,
              title: "Quick Overview",
              sub: "High-yield roadmap covering core concepts for rapid orientation.",
              icon: "speed",
            },
            {
              id: "detailed" as const,
              title: "Detailed Learning",
              badge: "Standard",
              sub: "Structured modules with comprehensive lectures, monographs, and quizzes.",
              icon: "menu_book",
            },
            {
              id: "mastery" as const,
              title: "Comprehensive Mastery",
              sub: "Exhaustive treatment with mathematical proofs, derivations, and problem sets.",
              icon: "psychology_alt",
            },
          ].map((depth) => {
            const isSelected = currentDepth === depth.id;
            return (
              <button
                key={depth.id}
                type="button"
                onClick={() => handleDepthSelect(depth.id)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/20"
                    : "bg-surface-container-low hover:bg-surface-container border-surface-container-high/60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`material-symbols-outlined text-xl ${isSelected ? "text-primary" : "text-on-surface-variant"}`}>
                      {depth.icon}
                    </span>
                    {depth.badge && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary/20 text-secondary uppercase tracking-wider">
                        {depth.badge}
                      </span>
                    )}
                  </div>
                  <h4 className={`text-xs font-bold ${isSelected ? "text-primary" : "text-on-surface"}`}>
                    {depth.title}
                  </h4>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed mt-1">
                    {depth.sub}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* C. Learning Approach */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <label className="block font-label-md text-xs uppercase tracking-wider text-primary font-bold">
            C. Learning Approach
          </label>
          <span className="text-xs text-on-surface-variant">Balances pedagogical delivery</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: "balanced" as const,
              title: "Balanced Learning",
              badge: "Default",
              sub: "Harmonious mixture of video lectures, reading extracts, and practice exercises.",
              icon: "balance",
            },
            {
              id: "theory_first" as const,
              title: "Theory-Focused",
              sub: "Emphasizes formal derivations, conceptual monographs, and mathematical proofs.",
              icon: "architecture",
            },
            {
              id: "practice_first" as const,
              title: "Practical-Focused",
              sub: "Emphasizes code tutorials, real-world case studies, and hands-on exercises.",
              icon: "code",
            },
          ].map((appr) => {
            const isSelected = currentApproach === appr.id;
            return (
              <button
                key={appr.id}
                type="button"
                onClick={() => handleApproachSelect(appr.id)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/20"
                    : "bg-surface-container-low hover:bg-surface-container border-surface-container-high/60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`material-symbols-outlined text-xl ${isSelected ? "text-primary" : "text-on-surface-variant"}`}>
                      {appr.icon}
                    </span>
                    {appr.badge && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary/20 text-secondary uppercase tracking-wider">
                        {appr.badge}
                      </span>
                    )}
                  </div>
                  <h4 className={`text-xs font-bold ${isSelected ? "text-primary" : "text-on-surface"}`}>
                    {appr.title}
                  </h4>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed mt-1">
                    {appr.sub}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* D. Weekly Study Time */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <label className="block font-label-md text-xs uppercase tracking-wider text-primary font-bold">
            D. Weekly Study Time
          </label>
          <span className="text-xs text-on-surface-variant">Paces module milestones and completion target</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { hours: 2, label: "2 Hours / wk", sub: "Casual pace" },
            { hours: 5, label: "5 Hours / wk", sub: "Steady pace", badge: "Balanced" },
            { hours: 10, label: "10 Hours / wk", sub: "Intensive pace" },
          ].map((opt) => {
            const isSelected = !isCustomHours && config.weeklyHours === opt.hours;
            return (
              <button
                key={opt.hours}
                type="button"
                onClick={() => handleHoursSelect(opt.hours)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/20"
                    : "bg-surface-container-low hover:bg-surface-container border-surface-container-high/60"
                }`}
              >
                {opt.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-secondary/20 text-secondary uppercase tracking-wider block mb-1">
                    {opt.badge}
                  </span>
                )}
                <span className={`text-xs font-bold block ${isSelected ? "text-primary" : "text-on-surface"}`}>
                  {opt.label}
                </span>
                <span className="text-[10px] text-on-surface-variant block mt-0.5">
                  {opt.sub}
                </span>
              </button>
            );
          })}

          {/* Custom Hours Option */}
          <button
            type="button"
            onClick={() => setIsCustomHours(true)}
            className={`p-3 rounded-xl border text-center transition-all ${
              isCustomHours
                ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/20"
                : "bg-surface-container-low hover:bg-surface-container border-surface-container-high/60"
            }`}
          >
            <span className={`text-xs font-bold block ${isCustomHours ? "text-primary" : "text-on-surface"}`}>
              Custom Time
            </span>
            <span className="text-[10px] text-on-surface-variant block mt-0.5">
              Specify hours
            </span>
          </button>
        </div>

        {/* Custom Hours Input when toggled */}
        {isCustomHours && (
          <div className="mt-3 p-3 rounded-xl bg-surface-container-lowest border border-surface-container-high/70 flex items-center justify-between gap-4 animate-fadeIn">
            <span className="text-xs font-medium text-on-surface">
              Target Study Hours per Week:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="60"
                value={config.weeklyHours || 5}
                onChange={(e) => handleCustomHoursChange(Number(e.target.value))}
                className="w-20 px-3 py-1.5 rounded-lg bg-surface-container-low border border-surface-container-high/70 text-xs font-bold text-center text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-xs text-on-surface-variant font-medium">hours / week</span>
            </div>
          </div>
        )}
      </section>

      {/* 3. Single Collapsible Advanced Settings Section */}
      <section className="border border-surface-container-high/60 rounded-2xl overflow-hidden bg-surface-container-lowest shadow-2xs">
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-container-low transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-lg">tune</span>
            </div>
            <div>
              <span className="font-label-md text-xs font-bold text-primary block">
                Advanced Settings (Optional)
              </span>
              <p className="text-[11px] text-on-surface-variant leading-tight">
                Academic difficulty, preferred repositories, educators, and language constraints
              </p>
            </div>
          </div>
          <span
            className={`material-symbols-outlined text-on-surface-variant transition-transform duration-200 ${
              isAdvancedOpen ? "rotate-180" : ""
            }`}
          >
            expand_more
          </span>
        </button>

        {isAdvancedOpen && (
          <div className="p-4 pt-1 border-t border-surface-container-high/40 space-y-4 animate-fadeIn text-xs">
            {/* 1. Resource Format & Modality Toggles */}
            <div>
              <span className="font-bold text-on-surface block mb-2">Resource Modalities</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: "video" as const, label: "Video Lectures", icon: "play_circle" },
                  { key: "reading" as const, label: "Reading Monographs", icon: "menu_book" },
                  { key: "practice" as const, label: "Practice Problems", icon: "fitness_center" },
                  { key: "diagnostic" as const, label: "Checkpoint Quizzes", icon: "quiz" },
                ].map((mod) => {
                  const isChecked = config.modalities[mod.key];
                  return (
                    <label
                      key={mod.key}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-primary/5 border-primary/40 text-primary font-semibold"
                          : "bg-surface-container-low border-surface-container-high/60 text-on-surface-variant"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleModalityToggle(mod.key)}
                        className="rounded text-primary focus:ring-primary w-3.5 h-3.5"
                      />
                      <span className="material-symbols-outlined text-sm">{mod.icon}</span>
                      <span className="text-[11px]">{mod.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 2. Preferred Educators */}
            <div>
              <span className="font-bold text-on-surface block mb-1.5">
                Preferred Educators & Channels (Verified Directory)
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {popularEducators.map((ed) => {
                  const isPreferred = preferredEducators.includes(ed.id);
                  return (
                    <button
                      key={ed.id}
                      type="button"
                      onClick={() => toggleEducatorPreference(ed.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors flex items-center gap-1 ${
                        isPreferred
                          ? "bg-primary text-on-primary border-primary"
                          : "bg-surface-container hover:bg-surface-container-high text-on-surface border-surface-container-high/60"
                      }`}
                    >
                      <span>{ed.name}</span>
                      {isPreferred && <span className="material-symbols-outlined text-xs">check</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Preferred Academic Repositories */}
            <div>
              <span className="font-bold text-on-surface block mb-1.5">
                Preferred Academic Repositories
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {["MIT OpenCourseWare", "Stanford Online", "Khan Academy", "NPTEL", "OpenStax", "arXiv", "NCERT"].map((repo) => {
                  const isPref = preferredRepos.includes(repo);
                  return (
                    <button
                      key={repo}
                      type="button"
                      onClick={() => toggleRepositoryPreference(repo)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors flex items-center gap-1 ${
                        isPref
                          ? "bg-secondary text-on-secondary border-secondary"
                          : "bg-surface-container hover:bg-surface-container-high text-on-surface border-surface-container-high/60"
                      }`}
                    >
                      <span>{repo}</span>
                      {isPref && <span className="material-symbols-outlined text-xs">check</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Language & Accessibility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                  Explanation Language
                </label>
                <select
                  value={config.language || "English"}
                  onChange={(e) =>
                    updateConfig((prev) => ({
                      ...prev,
                      language: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-surface-container-low border border-surface-container-high/70 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi / Hinglish</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                  Assessment Checkpoints
                </label>
                <select
                  value={config.assessmentPreferences?.questionsPerQuiz || 5}
                  onChange={(e) =>
                    updateConfig((prev) => ({
                      ...prev,
                      assessmentPreferences: {
                        ...prev.assessmentPreferences,
                        questionsPerQuiz: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-surface-container-low border border-surface-container-high/70 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value={3}>3 Questions per module</option>
                  <option value={5}>5 Questions per module (Standard)</option>
                  <option value={10}>10 Questions per module (In-depth)</option>
                </select>
              </div>
            </div>

            {/* 5. Additional Learning Instructions */}
            <div className="pt-1">
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                Additional Curator Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={config.advanced?.curatorNotes || ""}
                onChange={(e) =>
                  updateConfig((prev) => ({
                    ...prev,
                    advanced: {
                      ...prev.advanced,
                      curatorNotes: e.target.value,
                    },
                  }))
                }
                placeholder="e.g. Focus specifically on calculus-based derivations, or skip introductory arithmetic..."
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high/70 text-xs text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
          </div>
        )}
      </section>

      {/* Navigation Actions */}
      <div className="pt-space-md border-t border-surface-container-high/50 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border border-surface-container-high/80 text-on-surface-variant hover:bg-surface-container font-label-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Back to Goal</span>
        </button>

        <button
          type="button"
          onClick={onPreview}
          className="px-6 py-3 rounded-xl bg-primary text-on-primary hover:bg-primary-container font-label-md text-sm font-semibold flex items-center gap-2 shadow-sm transition-all active:scale-95"
        >
          <span>Preview Learning Path</span>
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
