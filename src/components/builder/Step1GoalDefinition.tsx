"use client";

import React, { useState } from "react";
import taxonomyData from "@/data/taxonomy.json";
import { useBuilderStore } from "@/lib/store/builderStore";
import { sanitizeInputObjectives, sanitizeInputSubtopics } from "@/lib/curriculum-intelligence/topic-consistency-validator";

interface Step1GoalDefinitionProps {
  onContinue: () => void;
}

export default function Step1GoalDefinition({ onContinue }: Step1GoalDefinitionProps) {
  const { config, updateConfig, setTitle, addTopic, removeTopic } = useBuilderStore();

  const [subtopicInput, setSubtopicInput] = useState("");
  const [topicError, setTopicError] = useState<string | null>(null);

  // Active domain lookup
  const currentDomain =
    taxonomyData.domains.find((d) => d.id === config.domainId) || taxonomyData.domains[0];

  const primaryTopic = config.selectedTopics[0]?.label || config.title || "";

  // Handle Domain Change
  const handleDomainSelect = (domainId: string) => {
    const domain = taxonomyData.domains.find((d) => d.id === domainId);
    if (!domain) return;

    updateConfig((prev) => ({
      ...prev,
      domainId,
      subjectId: domain.categories?.[0]?.subjects?.[0]?.id || prev.subjectId,
    }));
  };

  // Handle Topic Input Change
  const handleTopicChange = (newVal: string) => {
    setTopicError(null);
    setTitle(newVal);

    if (config.selectedTopics.length === 0) {
      if (newVal.trim()) {
        addTopic({ label: newVal.trim(), source: "custom", complexity: 3 });
      }
    } else {
      updateConfig((prev) => {
        const sanitizedObjectives = sanitizeInputObjectives(prev.learningObjectives || [], newVal);
        const sanitizedSubtopics = sanitizeInputSubtopics(prev.subtopics || [], newVal);
        return {
          ...prev,
          title: newVal,
          learningObjectives: sanitizedObjectives,
          subtopics: sanitizedSubtopics,
          selectedTopics: [
            {
              ...prev.selectedTopics[0],
              label: newVal,
            },
            ...prev.selectedTopics.slice(1),
          ],
        };
      });
    }
  };

  // Handle Suggestion Click
  const handleSelectSuggestion = (suggestion: string) => {
    setTopicError(null);
    setTitle(suggestion);

    updateConfig((prev) => {
      const sanitizedObjectives = sanitizeInputObjectives(prev.learningObjectives || [], suggestion);
      const sanitizedSubtopics = sanitizeInputSubtopics(prev.subtopics || [], suggestion);
      return {
        ...prev,
        title: suggestion,
        learningObjectives: sanitizedObjectives,
        subtopics: sanitizedSubtopics,
        selectedTopics: [
          {
            id: `topic-${Date.now()}`,
            label: suggestion,
            source: "popular",
            complexity: 3,
          },
        ],
      };
    });
  };

  // Handle Add Subtopic
  const handleAddSubtopic = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter" && e.key !== ",") return;
    if ("key" in e) e.preventDefault();

    const clean = subtopicInput.trim().replace(/^,+|,+$/g, "");
    if (!clean) return;

    const currentSubtopics = config.subtopics || [];
    if (!currentSubtopics.includes(clean)) {
      updateConfig((prev) => ({
        ...prev,
        subtopics: [...(prev.subtopics || []), clean],
      }));
    }
    setSubtopicInput("");
  };

  // Handle Remove Subtopic
  const handleRemoveSubtopic = (toRemove: string) => {
    updateConfig((prev) => ({
      ...prev,
      subtopics: (prev.subtopics || []).filter((s) => s !== toRemove),
    }));
  };

  // Handle Learning Goal Selection
  const handleGoalSelect = (goalType: "understand_concepts" | "build_projects" | "prepare_exam" | "master_subject") => {
    updateConfig((prev) => ({
      ...prev,
      examAlign: {
        ...prev.examAlign,
        enabled: goalType === "prepare_exam",
      },
      advanced: {
        ...prev.advanced,
        goal:
          goalType === "understand_concepts"
            ? "concept-mastery"
            : goalType === "build_projects"
            ? "skill-job-readiness"
            : goalType === "prepare_exam"
            ? "exam-preparation"
            : "concept-mastery",
        targetMastery:
          goalType === "master_subject"
            ? "true-mastery"
            : goalType === "understand_concepts"
            ? "deep-conceptual"
            : goalType === "prepare_exam"
            ? "exam-ready"
            : "working-competence",
      },
    }));
  };

  // Current active goal
  const currentGoalType = config.examAlign?.enabled
    ? "prepare_exam"
    : config.advanced?.goal === "skill-job-readiness"
    ? "build_projects"
    : config.advanced?.targetMastery === "true-mastery"
    ? "master_subject"
    : "understand_concepts";

  // Validate and Continue
  const handleValidateAndContinue = () => {
    if (!primaryTopic.trim()) {
      setTopicError("Please enter or select a topic for your curriculum.");
      return;
    }
    onContinue();
  };

  // Key academic domains to display cleanly
  const featuredDomains = [
    { id: "engineering-technology", label: "Computer Science & Engineering", icon: "terminal" },
    { id: "science-mathematics", label: "Science & Mathematics", icon: "functions" },
    { id: "school-education", label: "School & Foundations", icon: "school" },
    { id: "business-management", label: "Business & Economics", icon: "monitoring" },
    { id: "medical-health", label: "Medical & Health", icon: "stethoscope" },
    { id: "arts-humanities", label: "Arts & Humanities", icon: "palette" },
    { id: "languages-communication", label: "Languages", icon: "translate" },
    { id: "personal-practical", label: "Personal Mastery", icon: "psychology" },
  ];

  return (
    <div className="space-y-space-xl animate-fadeIn">
      {/* 1. Subject / Educational Domain */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <label className="block font-label-md text-xs uppercase tracking-wider text-primary font-bold">
            1. Select Educational Domain
          </label>
          <span className="text-xs text-on-surface-variant font-medium">
            Tailors curriculum depth and resource repositories
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {featuredDomains.map((dom) => {
            const isSelected = config.domainId === dom.id;
            return (
              <button
                key={dom.id}
                type="button"
                onClick={() => handleDomainSelect(dom.id)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                  isSelected
                    ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/20"
                    : "bg-surface-container-low hover:bg-surface-container border-surface-container-high/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`material-symbols-outlined text-lg ${
                      isSelected ? "text-primary" : "text-on-surface-variant"
                    }`}
                  >
                    {dom.icon}
                  </span>
                  <span
                    className={`font-label-sm text-xs font-semibold leading-tight line-clamp-1 ${
                      isSelected ? "text-primary" : "text-on-surface"
                    }`}
                  >
                    {dom.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Topic or Course Name */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="course-topic-input" className="block font-label-md text-xs uppercase tracking-wider text-primary font-bold">
            2. Topic or Course Name <span className="text-error">*</span>
          </label>
          <span className="text-xs text-on-surface-variant">
            What do you want to learn?
          </span>
        </div>

        <div className="relative">
          <input
            id="course-topic-input"
            type="text"
            required
            value={primaryTopic}
            onChange={(e) => handleTopicChange(e.target.value)}
            placeholder="e.g. Linear Algebra, React 18 & Next.js, Quantum Mechanics, Microeconomics..."
            className={`w-full px-4 py-3 rounded-xl bg-surface-container-lowest border text-sm text-on-surface font-medium placeholder:text-outline/60 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
              topicError ? "border-error focus:border-error" : "border-surface-container-high/70 focus:border-primary"
            }`}
          />
          {primaryTopic && (
            <button
              type="button"
              onClick={() => handleTopicChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 rounded"
              title="Clear topic"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>

        {topicError && (
          <p className="mt-1 text-xs text-error font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{topicError}</span>
          </p>
        )}

        {/* Intelligent Topic Suggestions */}
        {currentDomain?.popularTopics && currentDomain.popularTopics.length > 0 && (
          <div className="mt-3">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">
              Popular in {currentDomain.label}:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {currentDomain.popularTopics.slice(0, 5).map((pop) => (
                <button
                  key={pop}
                  type="button"
                  onClick={() => handleSelectSuggestion(pop)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-container hover:bg-surface-container-high text-primary border border-surface-container-high/60 transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <span className="material-symbols-outlined text-xs">add</span>
                  <span>{pop}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 3. Specific Topics or Subtopics (Optional) */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <label className="block font-label-md text-xs uppercase tracking-wider text-primary font-bold">
            3. Specific Concepts or Subtopics <span className="font-normal text-on-surface-variant lowercase">(optional)</span>
          </label>
          <span className="text-xs text-on-surface-variant">Press Enter or comma to add</span>
        </div>

        <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/70 flex flex-wrap items-center gap-2 min-h-[46px]">
          {(config.subtopics || []).map((subtopic) => (
            <span
              key={subtopic}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container text-xs font-semibold text-primary border border-surface-container-high/60"
            >
              <span>{subtopic}</span>
              <button
                type="button"
                onClick={() => handleRemoveSubtopic(subtopic)}
                className="hover:text-error transition-colors"
                title="Remove concept"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            </span>
          ))}

          <input
            type="text"
            value={subtopicInput}
            onChange={(e) => setSubtopicInput(e.target.value)}
            onKeyDown={handleAddSubtopic}
            placeholder={
              (config.subtopics?.length || 0) === 0
                ? "e.g. Eigenvalues, Gradient Descent, Memory Layout..."
                : "+ Add another concept"
            }
            className="flex-1 min-w-[200px] bg-transparent text-xs text-on-surface focus:outline-none placeholder:text-outline/60 px-1 py-0.5"
          />

          {subtopicInput.trim() && (
            <button
              type="button"
              onClick={handleAddSubtopic}
              className="px-2.5 py-1 rounded-md bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container"
            >
              Add
            </button>
          )}
        </div>
      </section>

      {/* 4. What do you want to achieve? */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <label className="block font-label-md text-xs uppercase tracking-wider text-primary font-bold">
            4. What do you want to achieve?
          </label>
          <span className="text-xs text-on-surface-variant">Sets pedagogical priority</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              id: "understand_concepts" as const,
              title: "Understand Core Concepts",
              desc: "Deep theoretical intuition, foundational derivations, and principles.",
              icon: "psychology",
            },
            {
              id: "build_projects" as const,
              title: "Build Real-World Projects",
              desc: "Hands-on tutorials, coding architectures, and practical exercises.",
              icon: "terminal",
            },
            {
              id: "prepare_exam" as const,
              title: "Prepare for an Exam",
              desc: "Syllabus completeness, problem sets, and diagnostic checkpoints.",
              icon: "quiz",
            },
            {
              id: "master_subject" as const,
              title: "Comprehensive Mastery",
              desc: "Exhaustive end-to-end fluency from fundamentals to advanced edge cases.",
              icon: "workspace_premium",
            },
          ].map((goal) => {
            const isSelected = currentGoalType === goal.id;
            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => handleGoalSelect(goal.id)}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  isSelected
                    ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/20"
                    : "bg-surface-container-low hover:bg-surface-container border-surface-container-high/60"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{goal.icon}</span>
                </div>
                <div className="min-w-0">
                  <h4 className={`text-xs font-bold ${isSelected ? "text-primary" : "text-on-surface"}`}>
                    {goal.title}
                  </h4>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">
                    {goal.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Continue Action */}
      <div className="pt-space-md border-t border-surface-container-high/50 flex justify-end">
        <button
          type="button"
          onClick={handleValidateAndContinue}
          className="px-6 py-3 rounded-xl bg-primary text-on-primary hover:bg-primary-container font-label-md text-sm font-semibold flex items-center gap-2 shadow-sm transition-all active:scale-95"
        >
          <span>Continue to Personalize</span>
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
