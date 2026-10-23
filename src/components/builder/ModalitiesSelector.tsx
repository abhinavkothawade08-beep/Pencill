"use client";

import React from "react";
import { BuilderModalities } from "@/lib/types/builder";

interface ModalitiesSelectorProps {
  modalities: BuilderModalities;
  domainId?: string;
  hasExamTarget?: boolean;
  onModalitiesChange: (modalities: BuilderModalities) => void;
}

export default function ModalitiesSelector({
  modalities,
  domainId,
  hasExamTarget,
  onModalitiesChange,
}: ModalitiesSelectorProps) {
  const isTechDomain = domainId === "engineering-technology";

  const toggleModality = (key: keyof BuilderModalities) => {
    onModalitiesChange({
      ...modalities,
      [key]: !modalities[key],
    });
  };

  const primaryModalities = [
    {
      key: "videos" as const,
      label: "Curated Video Lectures",
      desc: "NPTEL, MIT OCW, IIT faculty & top verified educators",
      icon: "smart_display",
    },
    {
      key: "reading" as const,
      label: "Deep Reading / Theory Notes",
      desc: "NCERT extracts, university handouts & classic textbook chapters",
      icon: "menu_book",
    },
    {
      key: "practice" as const,
      label: "Graded Practice Problems",
      desc: "Step-by-step problem sets & numerical drills",
      icon: "assignment",
    },
    {
      key: "quizzes" as const,
      label: "Diagnostic Checkpoints",
      desc: "Module-grounded instant checkpoint tests & explanations",
      icon: "quiz",
    },
    {
      key: "flashcards" as const,
      label: "Spaced Formula Flashcards",
      desc: "Core equations, dimensional constants & key memory anchors",
      icon: "style",
    },
  ];

  const supplementaryModalities = [
    {
      key: "codingExercises" as const,
      label: "Interactive Coding Exercises",
      desc: "Hands-on coding challenges and syntax implementations",
      icon: "terminal",
      highlight: isTechDomain,
    },
    {
      key: "pastPapers" as const,
      label: "Past Examination Papers (PYQs)",
      desc: "Actual previous years exam questions and marking schemes",
      icon: "history_edu",
      highlight: hasExamTarget,
    },
    {
      key: "workedExamples" as const,
      label: "Worked Examples & Derivations",
      desc: "Annotated line-by-line solutions to challenging problems",
      icon: "draw",
    },
    {
      key: "projects" as const,
      label: "Real-World Projects & Case Studies",
      desc: "Practical synthesis tasks and applied problem scenarios",
      icon: "inventory_2",
    },
  ];

  return (
    <div className="flex flex-col gap-space-xs">
      <div className="flex items-center justify-between">
        <label className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs font-sans">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
            4
          </span>
          Primary Pedagogical Modalities
        </label>
        <span className="font-label-sm text-label-sm text-secondary font-medium">Cognitive Formats</span>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant -mt-1">
        Pencill will source, evaluate, and sequence verified materials matching your preferred learning modalities.
      </p>

      {/* Primary 5 Modalities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
        {primaryModalities.map((item) => {
          const isChecked = Boolean(modalities[item.key]);
          return (
            <label
              key={item.key}
              className={`flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all border ${
                isChecked
                  ? "bg-surface-container-lowest border-primary/50 shadow-xs"
                  : "bg-surface-container-low hover:bg-surface-container border-surface-container-high/40 opacity-70"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleModality(item.key)}
                className="w-4 h-4 rounded text-primary accent-primary mt-0.5 shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1.5 truncate">
                  <span className="material-symbols-outlined text-base text-primary/80 shrink-0">
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="text-[11px] text-on-surface-variant leading-tight mt-0.5">
                  {item.desc}
                </span>
              </div>
            </label>
          );
        })}
      </div>

      {/* Supplementary & Domain-Specific Modalities */}
      <div className="pt-2">
        <span className="text-xs font-label-sm text-on-surface-variant font-semibold block mb-1.5">
          Specialized &amp; Applied Formats:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {supplementaryModalities.map((item) => {
            const isChecked = Boolean(modalities[item.key]);
            return (
              <label
                key={item.key}
                className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-all border ${
                  isChecked
                    ? "bg-surface-container-lowest border-primary/50 shadow-xs"
                    : "bg-surface-container-low hover:bg-surface-container border-surface-container-high/40 opacity-70"
                } ${item.highlight && !isChecked ? "ring-1 ring-secondary/40" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleModality(item.key)}
                  className="w-4 h-4 rounded text-primary accent-primary mt-0.5 shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <span className="font-label-sm text-label-sm text-on-surface font-semibold flex items-center gap-1.5 truncate">
                    <span className="material-symbols-outlined text-sm text-primary/80 shrink-0">
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                    {item.highlight && (
                      <span className="text-[9px] bg-secondary-fixed/50 text-secondary px-1.5 rounded-full font-bold">
                        Recommended
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-on-surface-variant leading-tight">
                    {item.desc}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
