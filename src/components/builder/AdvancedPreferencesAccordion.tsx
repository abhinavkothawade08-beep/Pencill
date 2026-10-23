"use client";

import React, { useState } from "react";
import { AdvancedLearningPreferences } from "@/lib/types/builder";

interface AdvancedPreferencesAccordionProps {
  preferences: AdvancedLearningPreferences;
  onPreferencesChange: (preferences: AdvancedLearningPreferences) => void;
}

export default function AdvancedPreferencesAccordion({
  preferences,
  onPreferencesChange,
}: AdvancedPreferencesAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const update = <K extends keyof AdvancedLearningPreferences>(
    key: K,
    val: AdvancedLearningPreferences[K]
  ) => {
    onPreferencesChange({
      ...preferences,
      [key]: val,
    });
  };

  const updateAccessibility = (
    field: "closedCaptions" | "highContrastNotes" | "transcriptsRequired",
    val: boolean
  ) => {
    onPreferencesChange({
      ...preferences,
      accessibility: {
        ...preferences.accessibility,
        [field]: val,
      },
    });
  };

  const learningGoals = [
    { id: "concept_mastery", label: "Concept Mastery & Theoretical Intuition" },
    { id: "exam_preparation", label: "Standardized Exam Preparation & High-Yield Strategy" },
    { id: "career_transition", label: "Career Transition & Production Engineering" },
    { id: "research_foundation", label: "Academic Research & Literature Survey" },
    { id: "skill_upskilling", label: "Industry Upskilling & Applied Tools" },
    { id: "quick_overview", label: "Executive Summary & Fast Overview" },
    { id: "deep_academic", label: "Deep University Syllabus Coverage" },
    { id: "project_based", label: "Project-Based Implementation" },
    { id: "interview_preparation", label: "Interview & Technical Assessment Prep" },
    { id: "personal_enrichment", label: "Personal Enrichment & Lifelong Curiosity" },
    { id: "certification", label: "Professional Certification Readiness" },
  ];

  const knowledgeLevels = [
    { id: "complete_beginner" as const, label: "Complete Beginner", desc: "No prior background" },
    { id: "some_basics" as const, label: "Some Basics", desc: "Familiar with terminology" },
    { id: "intermediate" as const, label: "Intermediate", desc: "Solid conceptual foundation" },
    { id: "advanced" as const, label: "Advanced", desc: "Extensive prior coursework" },
  ];

  const masteryLevels = [
    { id: "familiarity" as const, label: "Familiarity", desc: "High-level understanding" },
    { id: "working_competence" as const, label: "Working Competence", desc: "Able to apply fundamentals" },
    { id: "deep_conceptual" as const, label: "Deep Conceptual", desc: "Rigorous proofs & intuition" },
    { id: "exam_ready" as const, label: "Exam Ready", desc: "Speed & accuracy under pressure" },
    { id: "mastery" as const, label: "True Mastery", desc: "Frontier synthesis & edge cases" },
  ];

  const explanationStyles = [
    { id: "simple_intuitive" as const, label: "Simple & Intuitive" },
    { id: "step_by_step" as const, label: "Step-by-Step Analytical" },
    { id: "mathematical_rigorous" as const, label: "Mathematical & Rigorous" },
    { id: "example_driven" as const, label: "Example-Driven" },
    { id: "visual_diagram" as const, label: "Visual & Diagram-Based" },
    { id: "socratic" as const, label: "Socratic & Inquiry-Based" },
    { id: "exam_oriented" as const, label: "Exam-Oriented" },
    { id: "project_based" as const, label: "Project & Applied" },
    { id: "research_oriented" as const, label: "Research & Formal Papers" },
  ];

  const availableSources = [
    "NCERT",
    "NPTEL",
    "Khan Academy",
    "MIT OCW",
    "Stanford Online",
    "Official Technical Docs",
    "SWAYAM",
    "Peer-Reviewed Papers",
    "OpenStax",
    "Harvard Online",
    "Coursera Open Materials",
  ];

  const toggleSource = (source: string) => {
    const list = preferences.preferredSources || [];
    if (list.includes(source)) {
      update("preferredSources", list.filter((s) => s !== source));
    } else {
      update("preferredSources", [...list, source]);
    }
  };

  return (
    <div className="rounded-xl border border-surface-container-high/60 bg-surface-container-low/40 overflow-hidden transition-all">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-container-low transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">tune</span>
          <div className="flex flex-col">
            <span className="font-label-lg text-label-lg text-on-surface font-semibold">
              Advanced Learning Customization
            </span>
            <span className="text-xs text-on-surface-variant">
              Fine-tune explanation style, verified source priorities, and module constraints (20 criteria).
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-secondary font-medium font-mono hidden sm:inline">
            {isOpen ? "COLLAPSE" : "EXPAND"}
          </span>
          <span
            className={`material-symbols-outlined text-lg text-on-surface-variant transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            expand_more
          </span>
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-4 pt-2 border-t border-surface-container-high/40 flex flex-col gap-space-lg">
          {/* 1. Specific Learning Goal & Objective */}
          <div>
            <label className="text-xs font-label-sm text-on-surface font-semibold block mb-1">
              Specific Learning Goal &amp; Objective
            </label>
            <select
              value={preferences.learningGoal || "concept_mastery"}
              onChange={(e) => update("learningGoal", e.target.value)}
              className="w-full bg-surface-container-lowest px-3 py-2 rounded-lg text-xs font-medium text-on-surface border border-surface-container-high/60 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {learningGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Knowledge Level & Mastery Standard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-label-sm text-on-surface font-semibold block mb-1">
                Current Knowledge Level
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {knowledgeLevels.map((lvl) => {
                  const isSelected = preferences.currentKnowledgeLevel === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => update("currentKnowledgeLevel", lvl.id)}
                      className={`p-2 rounded-md text-left text-xs border transition-all ${
                        isSelected
                          ? "bg-primary text-on-primary border-primary font-semibold"
                          : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant border-surface-container-high/40"
                      }`}
                    >
                      <span className="block truncate font-medium">{lvl.label}</span>
                      <span
                        className={`text-[10px] block truncate ${
                          isSelected ? "text-primary-fixed-dim" : "opacity-80"
                        }`}
                      >
                        {lvl.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-label-sm text-on-surface font-semibold block mb-1">
                Desired Target Mastery
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {masteryLevels.map((lvl) => {
                  const isSelected = preferences.desiredMastery === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => update("desiredMastery", lvl.id)}
                      className={`p-2 rounded-md text-left text-xs border transition-all ${
                        isSelected
                          ? "bg-primary text-on-primary border-primary font-semibold"
                          : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant border-surface-container-high/40"
                      }`}
                    >
                      <span className="block truncate font-medium">{lvl.label}</span>
                      <span
                        className={`text-[10px] block truncate ${
                          isSelected ? "text-primary-fixed-dim" : "opacity-80"
                        }`}
                      >
                        {lvl.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Preferred Pedagogical Explanation Style */}
          <div>
            <label className="text-xs font-label-sm text-on-surface font-semibold block mb-1.5">
              Preferred Pedagogical Explanation Style
            </label>
            <div className="flex flex-wrap gap-1.5">
              {explanationStyles.map((style) => {
                const isSelected = preferences.explanationStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => update("explanationStyle", style.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                      isSelected
                        ? "bg-primary text-on-primary border-primary font-semibold shadow-2xs"
                        : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant border-surface-container-high/40"
                    }`}
                  >
                    {style.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Preferred Academic Repositories */}
          <div>
            <label className="text-xs font-label-sm text-on-surface font-semibold block mb-1.5">
              Prioritize Verified Academic Repositories
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableSources.map((source) => {
                const isSelected = preferences.preferredSources?.includes(source);
                return (
                  <button
                    key={source}
                    type="button"
                    onClick={() => toggleSource(source)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1 ${
                      isSelected
                        ? "bg-secondary text-on-secondary border-secondary shadow-2xs"
                        : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant border-surface-container-high/40"
                    }`}
                  >
                    <span>{source}</span>
                    {isSelected && <span className="material-symbols-outlined text-xs">check</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Module Resource Densities & Checkpoint Cadences */}
          <div className="pt-2 border-t border-surface-container-high/40">
            <h4 className="text-xs font-semibold text-on-surface mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary">analytics</span>
              Module Resource Density &amp; Practice Checkpoints
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[11px] font-label-sm text-on-surface-variant block mb-1">
                  Max Videos / Module
                </label>
                <select
                  value={preferences.maxVideosPerModule ?? 2}
                  onChange={(e) => update("maxVideosPerModule", Number(e.target.value))}
                  className="w-full bg-surface-container px-2 py-1.5 rounded text-on-surface text-xs border border-surface-container-high/40"
                >
                  <option value={1}>1 Comprehensive Video</option>
                  <option value={2}>2 Curated Lectures</option>
                  <option value={3}>3 Lectures Max</option>
                  <option value={4}>4 In-Depth Lectures</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-label-sm text-on-surface-variant block mb-1">
                  Max Reading Notes / Module
                </label>
                <select
                  value={preferences.maxReadingPerModule ?? 3}
                  onChange={(e) => update("maxReadingPerModule", Number(e.target.value))}
                  className="w-full bg-surface-container px-2 py-1.5 rounded text-on-surface text-xs border border-surface-container-high/40"
                >
                  <option value={1}>1 Core Monograph</option>
                  <option value={2}>2 Academic Readings</option>
                  <option value={3}>3 Reading References</option>
                  <option value={5}>5 Deep Literature Notes</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-label-sm text-on-surface-variant block mb-1">
                  Practice Questions / Module
                </label>
                <select
                  value={preferences.desiredPracticeQuestions ?? 8}
                  onChange={(e) => update("desiredPracticeQuestions", Number(e.target.value))}
                  className="w-full bg-surface-container px-2 py-1.5 rounded text-on-surface text-xs border border-surface-container-high/40"
                >
                  <option value={4}>4 Focused Drills</option>
                  <option value={6}>6 Standard Drills</option>
                  <option value={8}>8 Comprehensive Problems</option>
                  <option value={12}>12 Rigorous Problems</option>
                  <option value={16}>16 Problem Set</option>
                  <option value={20}>20 Intensive Exercises</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-label-sm text-on-surface-variant block mb-1">
                  Quiz Checkpoint Cadence
                </label>
                <select
                  value={preferences.quizFrequency || "every_module"}
                  onChange={(e) => update("quizFrequency", e.target.value as any)}
                  className="w-full bg-surface-container px-2 py-1.5 rounded text-on-surface text-xs border border-surface-container-high/40"
                >
                  <option value="every_module">Every Module</option>
                  <option value="milestone_only">Major Milestones Only</option>
                  <option value="end_of_path">End of Path Only</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2.5">
              <div>
                <label className="text-[11px] font-label-sm text-on-surface-variant block mb-1">
                  Formula Deck Density
                </label>
                <select
                  value={preferences.flashcardFrequency || "standard"}
                  onChange={(e) => update("flashcardFrequency", e.target.value as any)}
                  className="w-full bg-surface-container px-2 py-1.5 rounded text-on-surface text-xs border border-surface-container-high/40"
                >
                  <option value="high">High (All Formulae)</option>
                  <option value="standard">Standard Core Formulae</option>
                  <option value="minimal">Minimal / Essential</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-label-sm text-on-surface-variant block mb-1">
                  Spaced Revision Cadence
                </label>
                <select
                  value={preferences.revisionFrequency || "every_module"}
                  onChange={(e) => update("revisionFrequency", e.target.value as any)}
                  className="w-full bg-surface-container px-2 py-1.5 rounded text-on-surface text-xs border border-surface-container-high/40"
                >
                  <option value="every_module">Every Module Review</option>
                  <option value="alternate_modules">Alternate Modules</option>
                  <option value="end_of_path">End of Curriculum</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-label-sm text-on-surface-variant block mb-1">
                  Mock Exam Simulation
                </label>
                <select
                  value={preferences.mockExamFrequency || "mid_and_final"}
                  onChange={(e) => update("mockExamFrequency", e.target.value as any)}
                  className="w-full bg-surface-container px-2 py-1.5 rounded text-on-surface text-xs border border-surface-container-high/40"
                >
                  <option value="none">No Timed Mocks</option>
                  <option value="mid_and_final">Mid &amp; Final Mock Exams</option>
                  <option value="weekly">Weekly Full Mock Tests</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-label-sm text-on-surface-variant block mb-1">
                  Practical Applied Projects
                </label>
                <select
                  value={preferences.practicalProjects || "capstone_only"}
                  onChange={(e) => update("practicalProjects", e.target.value as any)}
                  className="w-full bg-surface-container px-2 py-1.5 rounded text-on-surface text-xs border border-surface-container-high/40"
                >
                  <option value="none">None (Theory Only)</option>
                  <option value="capstone_only">Capstone Project</option>
                  <option value="hands_on_per_module">Mini-Project Per Module</option>
                </select>
              </div>
            </div>
          </div>

          {/* 6. Study Cadence, Session Length & Citations */}
          <div className="pt-2 border-t border-surface-container-high/40">
            <h4 className="text-xs font-semibold text-on-surface mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary">schedule</span>
              Study Cadence, Session Length &amp; Resource Vintage
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[11px] font-label-sm text-on-surface-variant block mb-1">
                  Daily Study Schedule Rhythm
                </label>
                <input
                  type="text"
                  value={preferences.dailyAvailability || "Flexible Daily"}
                  onChange={(e) => update("dailyAvailability", e.target.value)}
                  placeholder="e.g. Weekdays 1-2 hrs, Weekends Intensive"
                  className="w-full bg-surface-container px-2.5 py-1.5 rounded text-on-surface text-xs border border-surface-container-high/40 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-label-sm text-on-surface-variant block mb-1">
                  Preferred Session Length
                </label>
                <select
                  value={preferences.preferredSessionLengthMinutes ?? 45}
                  onChange={(e) => update("preferredSessionLengthMinutes", Number(e.target.value))}
                  className="w-full bg-surface-container px-2 py-1.5 rounded text-on-surface text-xs border border-surface-container-high/40"
                >
                  <option value={25}>25 min (Pomodoro)</option>
                  <option value={45}>45 min (Standard Academic)</option>
                  <option value={60}>60 min (In-Depth Block)</option>
                  <option value={90}>90 min (Deep Work Seminar)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-label-sm text-on-surface-variant block mb-1">
                  Resource Vintage / Freshness
                </label>
                <select
                  value={preferences.resourceFreshness || "any_verified"}
                  onChange={(e) => update("resourceFreshness", e.target.value as any)}
                  className="w-full bg-surface-container px-2 py-1.5 rounded text-on-surface text-xs border border-surface-container-high/40"
                >
                  <option value="any_verified">Any Authoritative Verified Source</option>
                  <option value="recent_years">Recent Publications (Last 2-3 Years)</option>
                  <option value="seminal_classic">Seminal &amp; Foundational Classics</option>
                </select>
              </div>
            </div>

            <div className="mt-2.5">
              <label className="text-[11px] font-label-sm text-on-surface-variant block mb-1">
                Citation &amp; Academic Reference Standard
              </label>
              <select
                value={preferences.citationRequirement || "standard_open_educational"}
                onChange={(e) => update("citationRequirement", e.target.value as any)}
                className="w-full bg-surface-container px-2 py-1.5 rounded text-on-surface text-xs border border-surface-container-high/40"
              >
                <option value="standard_open_educational">
                  Standard Open Educational Repositories (NCERT, Khan, OpenStax)
                </option>
                <option value="institutional_peer_reviewed">
                  Strict Institutional &amp; Peer-Reviewed Standards (NPTEL, MIT OCW, PubMed, IEEE)
                </option>
              </select>
            </div>
          </div>

          {/* 7. Accessibility Toggles */}
          <div className="pt-2 border-t border-surface-container-high/40">
            <h4 className="text-xs font-semibold text-on-surface mb-1.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary">accessibility_new</span>
              Accessibility &amp; Formats
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="flex items-center gap-2 p-2 rounded bg-surface-container border border-surface-container-high/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(preferences.accessibility?.closedCaptions)}
                  onChange={(e) => updateAccessibility("closedCaptions", e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-primary accent-primary"
                />
                <span className="text-xs text-on-surface">Closed Captions Required</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-surface-container border border-surface-container-high/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(preferences.accessibility?.highContrastNotes)}
                  onChange={(e) => updateAccessibility("highContrastNotes", e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-primary accent-primary"
                />
                <span className="text-xs text-on-surface">High-Contrast &amp; Printable Notes</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-surface-container border border-surface-container-high/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(preferences.accessibility?.transcriptsRequired)}
                  onChange={(e) => updateAccessibility("transcriptsRequired", e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-primary accent-primary"
                />
                <span className="text-xs text-on-surface">Full Video Transcripts</span>
              </label>
            </div>
          </div>

          {/* 8. Custom Instructions for Curator */}
          <div className="pt-2 border-t border-surface-container-high/40">
            <label className="text-xs font-label-sm text-on-surface font-semibold block mb-1">
              Custom Curator Guidance &amp; Syllabus Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={preferences.customInstructions || ""}
              onChange={(e) => update("customInstructions", e.target.value)}
              placeholder="e.g. Focus specifically on calculus-based derivations, emphasize NPTEL lecture series by Prof. Verma, or skip general introductory history..."
              className="w-full bg-surface-container-lowest px-3 py-2 rounded-lg text-on-surface font-body-sm text-xs border border-surface-container-high/60 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/60"
            />
          </div>
        </div>
      )}
    </div>
  );
}
