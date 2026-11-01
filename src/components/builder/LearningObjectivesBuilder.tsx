"use client";

import React, { useState, useMemo } from "react";
import { useBuilderStore } from "@/lib/store/builderStore";

export default function LearningObjectivesBuilder() {
  const {
    config,
    addLearningObjective,
    updateLearningObjective,
    removeLearningObjective,
    addPrerequisite,
    removePrerequisite,
    addKnownConcept,
    removeKnownConcept,
    addDifficultConcept,
    removeDifficultConcept,
    addExcludedTopic,
    removeExcludedTopic,
  } = useBuilderStore();

  const [newObjectiveText, setNewObjectiveText] = useState("");
  const [newSuccessCriteria, setNewSuccessCriteria] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // Input states for chips
  const [newPrereq, setNewPrereq] = useState("");
  const [newKnown, setNewKnown] = useState("");
  const [newDifficult, setNewDifficult] = useState("");
  const [newExcluded, setNewExcluded] = useState("");

  const [showConceptTuning, setShowConceptTuning] = useState(false);

  const primaryTopic = config.selectedTopics[0]?.label || config.subjectId;

  // Domain-specific suggested learning outcomes
  const suggestedOutcomes = useMemo(() => {
    const topicLower = primaryTopic.toLowerCase();
    if (topicLower.includes("physic") || topicLower.includes("mechanic") || topicLower.includes("motion")) {
      return [
        "Explain Newton's Laws and construct free-body diagrams for complex connected masses.",
        "Derive rotational equations of motion and moment of inertia for standard geometrical shapes.",
        "Solve examination-level numerical problems involving rolling without slipping.",
        "Apply work-energy theorem and momentum conservation to inelastic collisions.",
      ];
    }
    if (topicLower.includes("python") || topicLower.includes("code") || topicLower.includes("program")) {
      return [
        "Implement idiomatic Python control flow, list comprehensions, and generator functions.",
        "Design modular object-oriented classes with encapsulation, inheritance, and error handling.",
        "Build a production-ready command line or API application utilizing standard libraries.",
        "Write comprehensive unit tests with coverage assertions for core business logic.",
      ];
    }
    if (topicLower.includes("calculus") || topicLower.includes("math") || topicLower.includes("differential")) {
      return [
        "Derive analytical solutions for first and second-order ordinary differential equations.",
        "Apply Laplace transforms to initial-value problems and boundary conditions.",
        "Interpret geometric trajectories and phase portraits in vector fields.",
        "Solve applied physical problems modeling damped harmonic oscillations.",
      ];
    }
    if (topicLower.includes("rag") || topicLower.includes("llm") || topicLower.includes("ai")) {
      return [
        "Analyze high-dimensional embedding spaces, cosine similarity, and ANN indexing.",
        "Implement hybrid search combining BM25 keyword retrieval with dense vector embeddings.",
        "Deploy cross-encoder re-ranking pipelines and measure precision@k and latency.",
        "Evaluate end-to-end RAG pipelines using Ragas faithfulness and answer relevance metrics.",
      ];
    }
    return [
      `Master core theoretical definitions and axiomatic principles of ${primaryTopic}.`,
      `Solve rigorous analytical and practical problem scenarios in ${primaryTopic}.`,
      `Apply fundamental methodologies to synthesize novel case studies and projects.`,
      `Achieve examination readiness through timed problem-solving drills.`,
    ];
  }, [primaryTopic]);

  const handleAddObjective = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newObjectiveText.trim();
    if (!clean) return;
    addLearningObjective(clean, newSuccessCriteria);
    setNewObjectiveText("");
    setNewSuccessCriteria("");
  };

  const handleSaveEdit = (id: string) => {
    const clean = editingText.trim();
    if (clean) {
      updateLearningObjective(id, clean);
    }
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-space-sm" id="section-learning-objectives">
      <div className="flex items-center justify-between">
        <label className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs font-semibold">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-bold">
            2
          </span>
          Learning Objectives &amp; Expected Outcomes
        </label>
        <span className="font-label-sm text-label-sm text-secondary font-medium">
          Measurable Criteria
        </span>
      </div>

      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Specify what you expect to achieve upon completing this learning path. The curriculum synthesizer will align modules, video lectures, and quiz questions directly to these targets.
      </p>

      {/* Active Objectives List */}
      <div className="space-y-2 mt-1">
        {(config.learningObjectives || []).map((obj, idx) => (
          <div
            key={obj.id}
            className="p-3 bg-surface-container-low rounded-xl border border-surface-container-high/60 flex items-start justify-between gap-3 group hover:border-primary/40 transition-all"
          >
            <div className="flex items-start gap-2.5 flex-1 min-w-0">
              <span className="w-5 h-5 rounded-full bg-surface-container text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                {editingId === obj.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full bg-surface-container-lowest px-2 py-1 rounded text-sm text-on-surface border border-primary focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(obj.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(obj.id)}
                      className="px-2 py-1 bg-primary text-on-primary text-xs rounded font-semibold"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-body-sm text-on-surface font-medium leading-relaxed">
                      {obj.text}
                    </p>
                    {obj.successCriteria && (
                      <p className="text-xs text-secondary mt-0.5 flex items-center gap-1 font-mono">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        <span>Criteria: {obj.successCriteria}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
              {editingId !== obj.id && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(obj.id);
                    setEditingText(obj.text);
                  }}
                  className="p-1 text-on-surface-variant hover:text-primary rounded hover:bg-surface-container"
                  title="Edit objective"
                  aria-label="Edit objective"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => removeLearningObjective(obj.id)}
                className="p-1 text-on-surface-variant hover:text-error rounded hover:bg-surface-container"
                title="Remove objective"
                aria-label="Remove objective"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Objective Form */}
      <form onSubmit={handleAddObjective} className="flex flex-col gap-2 mt-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="e.g. Derive and explain rotational dynamics, torque, and moment of inertia..."
            value={newObjectiveText}
            onChange={(e) => setNewObjectiveText(e.target.value)}
            className="flex-1 bg-surface-container-low px-3 py-2.5 rounded-lg text-body-sm text-on-surface border border-surface-container-high/60 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-primary text-on-primary hover:bg-primary/90 text-label-md font-semibold rounded-lg flex items-center gap-1 shrink-0 shadow-xs"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Add Outcome</span>
          </button>
        </div>

        {/* Suggested Outcomes */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-on-surface-variant font-medium">Suggestions:</span>
          {suggestedOutcomes
            .filter((s) => !(config.learningObjectives || []).some((o) => o.text === s))
            .slice(0, 3)
            .map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => addLearningObjective(sug)}
                className="text-xs bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary px-2.5 py-1 rounded-md transition-colors text-left truncate max-w-xs"
                title={sug}
              >
                + {sug}
              </button>
            ))}
        </div>
      </form>

      {/* Prerequisites, Known Concepts, Difficult Concepts & Exclusions Drawer */}
      <div className="mt-2 border-t border-surface-container-high/50 pt-2">
        <button
          type="button"
          onClick={() => setShowConceptTuning((prev) => !prev)}
          className="flex items-center justify-between w-full text-xs font-semibold text-primary hover:underline py-1"
        >
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">tune</span>
            <span>
              Fine-Tune Prior Knowledge, Prerequisites &amp; Exclusions ({config.prerequisites?.length || 0} prereqs,{" "}
              {config.excludedTopics?.length || 0} exclusions)
            </span>
          </div>
          <span className="material-symbols-outlined text-sm transition-transform">
            {showConceptTuning ? "expand_less" : "expand_more"}
          </span>
        </button>

        {showConceptTuning && (
          <div className="p-3 bg-surface-container-low/70 rounded-xl border border-surface-container-high/60 mt-2 space-y-4 animate-fadeIn">
            {/* 1. Prerequisites */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-on-surface">
                  Required Prerequisite Concepts (What to learn first)
                </span>
                <span className="text-[11px] text-on-surface-variant">Synthesizer places these ahead</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(config.prerequisites || []).map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface text-xs font-medium"
                  >
                    <span>{p}</span>
                    <button
                      type="button"
                      onClick={() => removePrerequisite(p)}
                      className="hover:text-error text-on-surface-variant"
                      aria-label={`Remove prerequisite ${p}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="+ Add prerequisite concept (e.g. Basic Calculus)..."
                  value={newPrereq}
                  onChange={(e) => setNewPrereq(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newPrereq.trim()) {
                        addPrerequisite(newPrereq);
                        setNewPrereq("");
                      }
                    }
                  }}
                  className="w-full bg-surface-container-lowest px-2.5 py-1.5 rounded text-xs text-on-surface border border-surface-container-high"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newPrereq.trim()) {
                      addPrerequisite(newPrereq);
                      setNewPrereq("");
                    }
                  }}
                  className="px-2.5 py-1.5 bg-surface-container hover:bg-surface-container-high text-xs rounded font-medium"
                >
                  Add
                </button>
              </div>
            </div>

            {/* 2. Concepts Already Understood */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-on-surface">
                  Concepts Already Understood (Skip introductory fluff)
                </span>
                <span className="text-[11px] text-on-surface-variant">Prevents redundant basics</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(config.knownConcepts || []).map((k) => (
                  <span
                    key={k}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container text-xs font-medium"
                  >
                    <span>{k}</span>
                    <button
                      type="button"
                      onClick={() => removeKnownConcept(k)}
                      className="hover:text-error text-on-surface-variant"
                      aria-label={`Remove known concept ${k}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="+ Add concept you already know well..."
                  value={newKnown}
                  onChange={(e) => setNewKnown(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newKnown.trim()) {
                        addKnownConcept(newKnown);
                        setNewKnown("");
                      }
                    }
                  }}
                  className="w-full bg-surface-container-lowest px-2.5 py-1.5 rounded text-xs text-on-surface border border-surface-container-high"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newKnown.trim()) {
                      addKnownConcept(newKnown);
                      setNewKnown("");
                    }
                  }}
                  className="px-2.5 py-1.5 bg-surface-container hover:bg-surface-container-high text-xs rounded font-medium"
                >
                  Add
                </button>
              </div>
            </div>

            {/* 3. Concepts Learner Finds Difficult */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-on-surface">
                  Difficult Concepts (Allocate extra practice &amp; alternative explanations)
                </span>
                <span className="text-[11px] text-on-surface-variant">Higher density of worked examples</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(config.difficultConcepts || []).map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-medium"
                  >
                    <span>{d}</span>
                    <button
                      type="button"
                      onClick={() => removeDifficultConcept(d)}
                      className="hover:text-error text-on-surface-variant"
                      aria-label={`Remove difficult concept ${d}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="+ Add concept you find challenging..."
                  value={newDifficult}
                  onChange={(e) => setNewDifficult(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newDifficult.trim()) {
                        addDifficultConcept(newDifficult);
                        setNewDifficult("");
                      }
                    }
                  }}
                  className="w-full bg-surface-container-lowest px-2.5 py-1.5 rounded text-xs text-on-surface border border-surface-container-high"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newDifficult.trim()) {
                      addDifficultConcept(newDifficult);
                      setNewDifficult("");
                    }
                  }}
                  className="px-2.5 py-1.5 bg-surface-container hover:bg-surface-container-high text-xs rounded font-medium"
                >
                  Add
                </button>
              </div>
            </div>

            {/* 4. Topics to Exclude */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-on-surface">
                  Topics to Exclude (Omit completely from curriculum)
                </span>
                <span className="text-[11px] text-on-surface-variant">Strict negative filter</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(config.excludedTopics || []).map((ex) => (
                  <span
                    key={ex}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error-container/40 text-error text-xs font-medium"
                  >
                    <span>{ex}</span>
                    <button
                      type="button"
                      onClick={() => removeExcludedTopic(ex)}
                      className="hover:text-error text-on-surface-variant"
                      aria-label={`Remove excluded topic ${ex}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="+ Add topic to exclude from course..."
                  value={newExcluded}
                  onChange={(e) => setNewExcluded(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newExcluded.trim()) {
                        addExcludedTopic(newExcluded);
                        setNewExcluded("");
                      }
                    }
                  }}
                  className="w-full bg-surface-container-lowest px-2.5 py-1.5 rounded text-xs text-on-surface border border-surface-container-high"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newExcluded.trim()) {
                      addExcludedTopic(newExcluded);
                      setNewExcluded("");
                    }
                  }}
                  className="px-2.5 py-1.5 bg-surface-container hover:bg-surface-container-high text-xs rounded font-medium"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
