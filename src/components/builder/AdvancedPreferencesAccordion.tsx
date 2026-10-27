"use client";

import React, { useState, useEffect } from "react";
import { useBuilderStore } from "@/lib/store/builderStore";
import { storageAdapter } from "@/lib/storage/storageAdapter";

const ACCORDION_OPEN_KEY = "pencill_builder_accordion_open";

export default function AdvancedPreferencesAccordion() {
  const { config, updateConfig, updateAdvanced } = useBuilderStore();
  const [isOpen, setIsOpen] = useState(false);

  // Load persisted open state
  useEffect(() => {
    storageAdapter.getDraft<boolean>(ACCORDION_OPEN_KEY).then((state) => {
      if (typeof state === "boolean") {
        setIsOpen(state);
      }
    });
  }, []);

  const toggleAccordion = () => {
    const next = !isOpen;
    setIsOpen(next);
    storageAdapter.saveDraft(ACCORDION_OPEN_KEY, next);
  };

  const adv = config.advanced;

  // Options
  const learningGoals = [
    { id: "concept-mastery", label: "Concept Mastery & Theoretical Intuition" },
    { id: "exam-preparation", label: "Standardized Exam Preparation & High-Yield Strategy" },
    { id: "assignment-support", label: "Assignment Support & Problem-Solving Drills" },
    { id: "revision-recap", label: "Revision & Rapid Concept Recap" },
    { id: "skill-job-readiness", label: "Skill & Production Job Readiness" },
    { id: "research-foundations", label: "Academic Research Foundations & Literature Survey" },
    { id: "curiosity", label: "Curiosity & Lifelong Enrichment" },
  ];

  const knowledgeLevels = [
    { id: "complete-beginner" as const, label: "Complete Beginner", desc: "No prior background" },
    { id: "some-basics" as const, label: "Some Basics", desc: "Familiar with basic definitions" },
    { id: "intermediate" as const, label: "Intermediate", desc: "Solid conceptual foundation" },
    { id: "advanced" as const, label: "Advanced", desc: "Extensive prior coursework" },
  ];

  const masteryLevels = [
    { id: "familiarity" as const, label: "Familiarity", desc: "Broad intuition" },
    { id: "working-competence" as const, label: "Working Competence", desc: "Apply formulas & solve problems" },
    { id: "deep-conceptual" as const, label: "Deep Conceptual", desc: "Rigorous proofs & edge cases" },
    { id: "exam-ready" as const, label: "Exam Ready", desc: "Speed & accuracy under pressure" },
    { id: "true-mastery" as const, label: "True Mastery", desc: "Synthesize novel edge scenarios" },
  ];

  const explanationStyles = [
    { id: "step-by-step-analytical" as const, label: "Step-by-Step Analytical" },
    { id: "simple-intuitive" as const, label: "Simple & Intuitive" },
    { id: "mathematical-rigorous" as const, label: "Mathematical & Rigorous" },
    { id: "example-driven" as const, label: "Example-Driven" },
    { id: "visual-diagram" as const, label: "Visual & Diagram-Based" },
    { id: "socratic" as const, label: "Socratic & Inquiry-Based" },
    { id: "exam-oriented" as const, label: "Exam-Oriented" },
    { id: "project-based" as const, label: "Project & Applied" },
    { id: "research-oriented" as const, label: "Research & Literature-Grounded" },
  ];

  const availableRepositories = [
    { name: "NCERT", hasAdapter: true },
    { name: "NPTEL", hasAdapter: true },
    { name: "Khan Academy", hasAdapter: true },
    { name: "MIT OCW", hasAdapter: true },
    { name: "SWAYAM", hasAdapter: true },
    { name: "OpenStax", hasAdapter: true },
    { name: "Stanford Online", hasAdapter: true },
    { name: "Coursera Open Materials", hasAdapter: true },
  ];

  const toggleRepository = (name: string) => {
    const list = adv.repositories || [];
    if (list.includes(name)) {
      if (list.length <= 1) return; // At least 1 required
      updateAdvanced(
        "repositories",
        list.filter((r) => r !== name)
      );
    } else {
      updateAdvanced("repositories", [...list, name]);
    }
  };

  // Warning calculations
  const knowledgeHierarchy = {
    "complete-beginner": 1,
    "some-basics": 2,
    intermediate: 3,
    advanced: 4,
  };
  const masteryHierarchy = {
    familiarity: 1,
    "working-competence": 2,
    "deep-conceptual": 3,
    "exam-ready": 4,
    "true-mastery": 5,
  };

  const isTargetBelowCurrent =
    masteryHierarchy[adv.targetMastery] < knowledgeHierarchy[adv.currentLevel];

  const isExamReadyWithoutExam =
    adv.targetMastery === "exam-ready" && !config.examAlign.enabled;

  // Session length calculation
  const sessionMinutes = adv.cadence.sessionMinutes || 45;
  const sessionsPerWeek = Math.round((config.weeklyHours * 60) / sessionMinutes);

  // Curator notes keyword parsing
  const parsedKeywords = React.useMemo(() => {
    const notes = adv.curatorNotes.toLowerCase();
    const tags: string[] = [];
    if (notes.includes("mit")) tags.push("Prioritize MIT OCW");
    if (notes.includes("nptel")) tags.push("Prioritize NPTEL");
    if (notes.includes("ncert")) tags.push("Prioritize NCERT");
    if (notes.includes("skip proof") || notes.includes("no proof")) tags.push("Exclude Formal Proofs");
    if (notes.includes("calculus")) tags.push("Require Calculus Pre-requisites");
    if (notes.includes("pyq")) tags.push("Boost Previous Exam Questions");
    return tags;
  }, [adv.curatorNotes]);

  return (
    <div className="rounded-xl border border-surface-container-high/60 overflow-hidden bg-surface-container-low/30">
      {/* Accordion Trigger */}
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={toggleAccordion}
        className="w-full p-space-md flex items-center justify-between text-left hover:bg-surface-container-low transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">tune</span>
          <span className="font-headline-sm text-headline-sm text-on-surface font-sans text-sm font-semibold">
            Advanced Learning Customization
          </span>
          <span className="font-label-sm text-secondary bg-secondary-container/40 px-2 py-0.5 rounded-full text-xs font-medium">
            (20 criteria)
          </span>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant transition-transform duration-200">
          {isOpen ? "expand_less" : "expand_more"}
        </span>
      </button>

      {/* Accordion Body */}
      {isOpen && (
        <div className="p-space-lg pt-0 flex flex-col gap-space-lg border-t border-surface-container-high/40 animate-in fade-in duration-150">
          {/* 1. Primary Academic Goal */}
          <div className="flex flex-col gap-1.5 pt-space-md">
            <label className="text-xs font-semibold text-on-surface">1. Primary Academic Goal:</label>
            <select
              value={adv.goal}
              onChange={(e) => updateAdvanced("goal", e.target.value as any)}
              className="bg-surface-container-lowest text-xs text-on-surface p-2 rounded-lg border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {learningGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {/* 2 & 3. Knowledge & Desired Mastery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            {/* Current Knowledge */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">2. Current Knowledge Level:</label>
              <div className="grid grid-cols-2 gap-1.5">
                {knowledgeLevels.map((lvl) => {
                  const isSelected = adv.currentLevel === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => updateAdvanced("currentLevel", lvl.id)}
                      className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                        isSelected
                          ? "bg-primary text-on-primary border-primary font-semibold shadow-xs"
                          : "bg-surface-container-lowest hover:bg-surface-container text-on-surface border-surface-container-high/50"
                      }`}
                    >
                      <span className="block font-semibold">{lvl.label}</span>
                      <span className={`text-[10px] block leading-tight ${isSelected ? "text-primary-fixed-dim" : "text-on-surface-variant"}`}>
                        {lvl.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Mastery */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">3. Target Desired Mastery:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {masteryLevels.map((lvl) => {
                  const isSelected = adv.targetMastery === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => updateAdvanced("targetMastery", lvl.id)}
                      className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                        isSelected
                          ? "bg-primary text-on-primary border-primary font-semibold shadow-xs"
                          : "bg-surface-container-lowest hover:bg-surface-container text-on-surface border-surface-container-high/50"
                      }`}
                    >
                      <span className="block font-semibold truncate">{lvl.label}</span>
                      <span className={`text-[10px] block truncate leading-tight ${isSelected ? "text-primary-fixed-dim" : "text-on-surface-variant"}`}>
                        {lvl.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Warnings */}
          {isTargetBelowCurrent && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-base">warning</span>
              <span>
                Target mastery ({adv.targetMastery}) is lower than current knowledge level ({adv.currentLevel}). Consider selecting a higher mastery tier.
              </span>
            </div>
          )}

          {isExamReadyWithoutExam && (
            <div className="p-2.5 rounded-lg bg-secondary-container/50 border border-secondary/30 text-secondary text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">school</span>
                <span>Target is &quot;Exam Ready&quot; but no standardized exam is selected.</span>
              </div>
              <button
                type="button"
                onClick={() => updateConfig((prev) => ({ ...prev, examAlign: { enabled: true } }))}
                className="font-bold underline shrink-0 hover:text-primary"
              >
                Align exam now
              </button>
            </div>
          )}

          {/* 4. Explanation Style */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface">4. Primary Explanation Style (9 Styles):</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {explanationStyles.map((style) => {
                const isSelected = adv.explanationStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => updateAdvanced("explanationStyle", style.id)}
                    className={`p-2 rounded-lg border text-left text-xs transition-colors truncate ${
                      isSelected
                        ? "bg-primary text-on-primary border-primary font-semibold shadow-xs"
                        : "bg-surface-container-lowest hover:bg-surface-container text-on-surface border-surface-container-high/50"
                    }`}
                  >
                    {style.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Repositories Selection */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface">5. Verified Public Repositories (At least 1 required):</label>
              <span className="text-[11px] font-mono text-secondary">
                {adv.repositories.length} Active
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableRepositories.map((repo) => {
                const isSelected = adv.repositories.includes(repo.name);
                return (
                  <button
                    key={repo.name}
                    type="button"
                    onClick={() => toggleRepository(repo.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                      isSelected
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-surface-container-lowest hover:bg-surface-container text-on-surface border-surface-container-high/50"
                    }`}
                  >
                    {isSelected ? `✓ ${repo.name}` : `+ ${repo.name}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6-13. 8 Density Dropdowns */}
          <div className="flex flex-col gap-2 pt-1 border-t border-surface-container-high/40">
            <span className="text-xs font-semibold text-on-surface">
              Curriculum Density &amp; Evaluation Cadence (8 Criteria):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Max Videos */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-on-surface-variant">Max Lectures/Module</span>
                <select
                  value={adv.density.maxVideos}
                  onChange={(e) =>
                    updateAdvanced("density", {
                      ...adv.density,
                      maxVideos: parseInt(e.target.value, 10),
                    })
                  }
                  className="bg-surface-container-lowest text-xs text-on-surface p-1.5 rounded border border-surface-container-high"
                >
                  <option value={1}>1 Core Lecture</option>
                  <option value={2}>2 Lectures (Default)</option>
                  <option value={3}>3 Lectures</option>
                  <option value={4}>4 Lectures (Intensive)</option>
                </select>
              </div>

              {/* Max Readings */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-on-surface-variant">Max Readings/Module</span>
                <select
                  value={adv.density.maxReadings}
                  onChange={(e) =>
                    updateAdvanced("density", {
                      ...adv.density,
                      maxReadings: parseInt(e.target.value, 10),
                    })
                  }
                  className="bg-surface-container-lowest text-xs text-on-surface p-1.5 rounded border border-surface-container-high"
                >
                  <option value={1}>1 Monograph Extract</option>
                  <option value={2}>2 Extracts</option>
                  <option value={3}>3 Extracts (Default)</option>
                  <option value={5}>5 Rigorous Chapters</option>
                </select>
              </div>

              {/* Practice Questions */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-on-surface-variant">Practice Qs/Module</span>
                <select
                  value={adv.density.practiceQs}
                  onChange={(e) =>
                    updateAdvanced("density", {
                      ...adv.density,
                      practiceQs: parseInt(e.target.value, 10),
                    })
                  }
                  className="bg-surface-container-lowest text-xs text-on-surface p-1.5 rounded border border-surface-container-high"
                >
                  <option value={4}>4 Graded Drills</option>
                  <option value={8}>8 Standard (Default)</option>
                  <option value={12}>12 Problems</option>
                  <option value={20}>20 Intense Sheet</option>
                </select>
              </div>

              {/* Quiz Cadence */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-on-surface-variant">Quiz Cadence</span>
                <select
                  value={adv.density.quizCadence}
                  onChange={(e) =>
                    updateAdvanced("density", {
                      ...adv.density,
                      quizCadence: e.target.value as any,
                    })
                  }
                  className="bg-surface-container-lowest text-xs text-on-surface p-1.5 rounded border border-surface-container-high"
                >
                  <option value="every-module">Every Module (Default)</option>
                  <option value="milestone-only">Major Milestones Only</option>
                  <option value="end-of-path">End of Path Only</option>
                </select>
              </div>

              {/* Formula Deck */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-on-surface-variant">Formula Flashcards</span>
                <select
                  value={adv.density.formulaDeck}
                  onChange={(e) =>
                    updateAdvanced("density", {
                      ...adv.density,
                      formulaDeck: e.target.value as any,
                    })
                  }
                  className="bg-surface-container-lowest text-xs text-on-surface p-1.5 rounded border border-surface-container-high"
                >
                  <option value="standard">Standard (Default)</option>
                  <option value="high">High Density</option>
                  <option value="minimal">Minimal Anchors</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>

              {/* Revision Cadence */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-on-surface-variant">Spaced Revision</span>
                <select
                  value={adv.density.revisionCadence}
                  onChange={(e) =>
                    updateAdvanced("density", {
                      ...adv.density,
                      revisionCadence: e.target.value as any,
                    })
                  }
                  className="bg-surface-container-lowest text-xs text-on-surface p-1.5 rounded border border-surface-container-high"
                >
                  <option value="every-module">Every Module (Default)</option>
                  <option value="alternate-modules">Alternate Modules</option>
                  <option value="end-of-path">End of Path</option>
                </select>
              </div>

              {/* Mock Exams */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-on-surface-variant">Mock Exams</span>
                <select
                  value={adv.density.mockExams}
                  onChange={(e) =>
                    updateAdvanced("density", {
                      ...adv.density,
                      mockExams: e.target.value as any,
                    })
                  }
                  className="bg-surface-container-lowest text-xs text-on-surface p-1.5 rounded border border-surface-container-high"
                >
                  <option value="none">None</option>
                  <option value="mid-and-final">Mid &amp; Final (Default)</option>
                  <option value="weekly">Weekly Full Mock</option>
                </select>
              </div>

              {/* Practical Projects */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-on-surface-variant">Practical Projects</span>
                <select
                  value={adv.density.projects}
                  onChange={(e) =>
                    updateAdvanced("density", {
                      ...adv.density,
                      projects: e.target.value as any,
                    })
                  }
                  className="bg-surface-container-lowest text-xs text-on-surface p-1.5 rounded border border-surface-container-high"
                >
                  <option value="capstone">Capstone Only (Default)</option>
                  <option value="per-module">Hands-on Per Module</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
          </div>

          {/* 14-17. 4 Cadence & Citation Dropdowns */}
          <div className="flex flex-col gap-2 pt-1 border-t border-surface-container-high/40">
            <span className="text-xs font-semibold text-on-surface">
              Cadence &amp; Citation Standards (4 Criteria):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Rhythm */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-on-surface-variant">Study Rhythm</span>
                <select
                  value={adv.cadence.rhythm}
                  onChange={(e) =>
                    updateAdvanced("cadence", {
                      ...adv.cadence,
                      rhythm: e.target.value as any,
                    })
                  }
                  className="bg-surface-container-lowest text-xs text-on-surface p-1.5 rounded border border-surface-container-high"
                >
                  <option value="flexible-daily">Flexible Daily (Default)</option>
                  <option value="weekday-intensive">Weekday Intensive</option>
                  <option value="weekend-immersion">Weekend Immersion</option>
                  <option value="self-paced">Pure Self-Paced</option>
                </select>
              </div>

              {/* Session Length */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-on-surface-variant">Session Length</span>
                <select
                  value={adv.cadence.sessionMinutes}
                  onChange={(e) =>
                    updateAdvanced("cadence", {
                      ...adv.cadence,
                      sessionMinutes: parseInt(e.target.value, 10),
                    })
                  }
                  className="bg-surface-container-lowest text-xs text-on-surface p-1.5 rounded border border-surface-container-high"
                >
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins (Default)</option>
                  <option value={60}>60 mins</option>
                  <option value={90}>90 mins (Intense)</option>
                </select>
              </div>

              {/* Vintage */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-on-surface-variant">Resource Freshness</span>
                <select
                  value={adv.cadence.vintage}
                  onChange={(e) =>
                    updateAdvanced("cadence", {
                      ...adv.cadence,
                      vintage: e.target.value as any,
                    })
                  }
                  className="bg-surface-container-lowest text-xs text-on-surface p-1.5 rounded border border-surface-container-high"
                >
                  <option value="any-verified">Any Verified (Default)</option>
                  <option value="recent-5-years">Recent 5 Years</option>
                  <option value="seminal-classic">Seminal Classic</option>
                </select>
              </div>

              {/* Citation Std */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-on-surface-variant">Citation Standard</span>
                <select
                  value={adv.cadence.citationStd}
                  onChange={(e) =>
                    updateAdvanced("cadence", {
                      ...adv.cadence,
                      citationStd: e.target.value as any,
                    })
                  }
                  className="bg-surface-container-lowest text-xs text-on-surface p-1.5 rounded border border-surface-container-high"
                >
                  <option value="open-edu-repos">Open Edu Repos (Default)</option>
                  <option value="institutional-peer-reviewed">Institutional Peer-Reviewed</option>
                </select>
              </div>
            </div>
            <span className="text-[11px] text-secondary font-medium">
              Calculated schedule: ~{sessionsPerWeek} sessions/week ({sessionMinutes} mins each)
            </span>
          </div>

          {/* 18-20. Accessibility Preferences */}
          <div className="flex flex-col gap-2 pt-1 border-t border-surface-container-high/40">
            <span className="text-xs font-semibold text-on-surface">
              Accessibility Preferences (3 Criteria):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="flex items-center gap-2 cursor-pointer bg-surface-container-lowest p-2 rounded-lg border border-surface-container-high/50">
                <input
                  type="checkbox"
                  checked={adv.accessibility.captions}
                  onChange={(e) =>
                    updateAdvanced("accessibility", {
                      ...adv.accessibility,
                      captions: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded text-primary accent-primary"
                />
                <span className="text-xs text-on-surface">Closed Captions Required</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-surface-container-lowest p-2 rounded-lg border border-surface-container-high/50">
                <input
                  type="checkbox"
                  checked={adv.accessibility.highContrast}
                  onChange={(e) =>
                    updateAdvanced("accessibility", {
                      ...adv.accessibility,
                      highContrast: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded text-primary accent-primary"
                />
                <span className="text-xs text-on-surface">High-Contrast Notes</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-surface-container-lowest p-2 rounded-lg border border-surface-container-high/50">
                <input
                  type="checkbox"
                  checked={adv.accessibility.transcripts}
                  onChange={(e) =>
                    updateAdvanced("accessibility", {
                      ...adv.accessibility,
                      transcripts: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded text-primary accent-primary"
                />
                <span className="text-xs text-on-surface">Transcripts Required</span>
              </label>
            </div>
          </div>

          {/* 21. Curator Notes & Keyword Parser */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface">
                Curator Instructions &amp; Custom Exclusions:
              </label>
              <span className="text-[11px] font-mono text-on-surface-variant">
                {adv.curatorNotes.length}/1000 characters
              </span>
            </div>
            <textarea
              maxLength={1000}
              rows={3}
              value={adv.curatorNotes}
              onChange={(e) => updateAdvanced("curatorNotes", e.target.value)}
              placeholder="e.g. Prioritize MIT OCW, skip formal proofs, require calculus prerequisites..."
              className="bg-surface-container-lowest text-xs text-on-surface p-2.5 rounded-lg border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
            />
            {parsedKeywords.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] font-semibold text-secondary">
                  Detected directives:
                </span>
                {parsedKeywords.map((k, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-secondary-fixed/50 text-secondary px-2 py-0.5 rounded font-mono"
                  >
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
