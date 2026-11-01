"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builderStore";
import { TeachingStyleType, CustomTeachingMix } from "@/lib/types/builderConfig";

export default function TeachingStyleSelector() {
  const { config, setTeachingStyle, setCustomTeachingMix } = useBuilderStore();

  const currentStyle = config.teachingStyle || "balanced";
  const customMix = config.customTeachingMix || {
    theory: 40,
    workedExamples: 25,
    practicalExercises: 25,
    projects: 10,
  };

  const styles: Array<{
    id: TeachingStyleType;
    title: string;
    badge: string;
    icon: string;
    desc: string;
    highlights: string[];
  }> = [
    {
      id: "theory_first",
      title: "Theory-First",
      badge: "Rigorous Foundations",
      icon: "menu_book",
      desc: "Emphasizes conceptual definitions, mathematical derivations, foundational principles, and textbook reading before computational drills.",
      highlights: [
        "Axiomatic explanations & formal definitions",
        "Mathematical derivations & conceptual proofs",
        "Curated textbook extracts & monographs",
        "Formative conceptual checkpoint questions",
      ],
    },
    {
      id: "practice_first",
      title: "Practice-First",
      badge: "Application & Drill",
      icon: "code_blocks",
      desc: "Emphasizes worked examples, step-by-step solved problems, coding demonstrations, and active hands-on drills from the first unit.",
      highlights: [
        "Step-by-step worked problem walkthroughs",
        "Immediate guided exercises & active coding",
        "Real-world application patterns & case studies",
        "Practice-oriented assessments with hints",
      ],
    },
    {
      id: "balanced",
      title: "Balanced Learning",
      badge: "Recommended",
      icon: "balance",
      desc: "Equalized synthesis of core theoretical intuition followed immediately by guided application, exercises, and diagnostic reviews.",
      highlights: [
        "Concise conceptual foundations",
        "Paired worked examples with solutions",
        "Graded independent exercises",
        "Regular diagnostic feedback checkpoints",
      ],
    },
    {
      id: "custom_mix",
      title: "Custom Learning Mix",
      badge: "Personalized",
      icon: "tune",
      desc: "Explicitly adjust the pedagogical ratio of theory, worked demonstrations, hands-on practice, and projects.",
      highlights: [
        "Fully adjustable weighting sliders",
        "Normalized 100% pedagogical distribution",
        "Directly influences resource discovery & syllabus",
      ],
    },
  ];

  // Helper to adjust a slider in custom mix while keeping total at 100
  const handleMixChange = (key: keyof CustomTeachingMix, rawVal: number) => {
    const val = Math.max(5, Math.min(80, rawVal));
    const otherKeys = (["theory", "workedExamples", "practicalExercises", "projects"] as Array<keyof CustomTeachingMix>).filter(
      (k) => k !== key
    );

    const currentOtherSum = otherKeys.reduce((sum, k) => sum + customMix[k], 0);
    const targetOtherSum = 100 - val;

    const newMix: CustomTeachingMix = { ...customMix, [key]: val };

    if (currentOtherSum > 0) {
      let allocated = 0;
      otherKeys.forEach((k, idx) => {
        if (idx === otherKeys.length - 1) {
          newMix[k] = Math.max(0, targetOtherSum - allocated);
        } else {
          const share = Math.round((customMix[k] / currentOtherSum) * targetOtherSum);
          newMix[k] = share;
          allocated += share;
        }
      });
    }

    setCustomTeachingMix(newMix);
  };

  return (
    <div className="flex flex-col gap-space-sm" id="section-teaching-style">
      <div className="flex items-center justify-between">
        <label className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs font-semibold">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-bold">
            4
          </span>
          Instructional Style &amp; Pedagogical Balance
        </label>
        <span className="font-label-sm text-label-sm text-secondary font-medium">
          Influences Resource Discovery &amp; Structure
        </span>
      </div>

      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Select how Pencill should structure your learning journey. This directly affects whether the engine selects theoretical lectures, textbook monographs, or hands-on practice sheets.
      </p>

      {/* 4 Teaching Style Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm mt-space-xs">
        {styles.map((style) => {
          const isSelected = currentStyle === style.id;
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => setTeachingStyle(style.id)}
              className={`p-space-md rounded-xl text-left border transition-all flex flex-col justify-between ${
                isSelected
                  ? "bg-primary-container text-on-primary-container border-primary shadow-sm ring-1 ring-primary"
                  : "bg-surface-container-low hover:bg-surface-container text-on-surface border-surface-container-high/60"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`material-symbols-outlined text-xl ${
                        isSelected ? "text-primary" : "text-on-surface-variant"
                      }`}
                    >
                      {style.icon}
                    </span>
                    <span className="font-label-lg text-label-lg font-bold">{style.title}</span>
                  </div>
                  <span
                    className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full font-medium ${
                      isSelected
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {style.badge}
                  </span>
                </div>

                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-3">
                  {style.desc}
                </p>
              </div>

              {/* Highlights List */}
              <ul className="space-y-1 text-xs border-t border-surface-container-high/40 pt-2 text-on-surface-variant">
                {style.highlights.map((h, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs text-secondary shrink-0">
                      check_small
                    </span>
                    <span className="truncate">{h}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Custom Learning Mix Sliders (Rendered when custom_mix is selected) */}
      {currentStyle === "custom_mix" && (
        <div className="mt-space-xs p-space-md bg-surface-container-low rounded-xl border border-surface-container-high/70 animate-fadeIn">
          <div className="flex items-center justify-between mb-space-sm pb-2 border-b border-surface-container-high">
            <span className="font-label-md text-label-md text-primary font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">tune</span>
              Custom Pedagogical Allocation (Total: 100%)
            </span>
            <span className="text-xs text-on-surface-variant font-mono">
              Auto-normalized
            </span>
          </div>

          <div className="space-y-3">
            {/* Theory Slider */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-on-surface">Conceptual &amp; Mathematical Theory</span>
                <span className="font-bold text-primary">{customMix.theory}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="70"
                step="5"
                value={customMix.theory}
                onChange={(e) => handleMixChange("theory", parseInt(e.target.value, 10))}
                className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
              />
            </div>

            {/* Worked Examples Slider */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-on-surface">Worked Examples &amp; Step-by-Step Demonstrations</span>
                <span className="font-bold text-primary">{customMix.workedExamples}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={customMix.workedExamples}
                onChange={(e) => handleMixChange("workedExamples", parseInt(e.target.value, 10))}
                className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
              />
            </div>

            {/* Practical Exercises Slider */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-on-surface">Independent Exercises &amp; Problem Sets</span>
                <span className="font-bold text-primary">{customMix.practicalExercises}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={customMix.practicalExercises}
                onChange={(e) => handleMixChange("practicalExercises", parseInt(e.target.value, 10))}
                className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
              />
            </div>

            {/* Projects Slider */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-on-surface">Hands-On Projects &amp; Synthesis Applications</span>
                <span className="font-bold text-primary">{customMix.projects}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="5"
                value={customMix.projects}
                onChange={(e) => handleMixChange("projects", parseInt(e.target.value, 10))}
                className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
