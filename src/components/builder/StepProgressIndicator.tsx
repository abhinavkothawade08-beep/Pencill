"use client";

import React from "react";

export interface StepProgressIndicatorProps {
  currentStep: 1 | 2 | 3;
  onSelectStep: (step: 1 | 2 | 3) => void;
  canNavigateToStep?: (step: 1 | 2 | 3) => boolean;
}

export default function StepProgressIndicator({
  currentStep,
  onSelectStep,
  canNavigateToStep = () => true,
}: StepProgressIndicatorProps) {
  const steps = [
    {
      num: 1 as const,
      label: "Define Goal",
      sublabel: "Topic & Scope",
      icon: "track_changes",
    },
    {
      num: 2 as const,
      label: "Personalize",
      sublabel: "Level & Depth",
      icon: "tune",
    },
    {
      num: 3 as const,
      label: "Review & Create",
      sublabel: "Preview Curriculum",
      icon: "auto_awesome",
    },
  ];

  return (
    <nav
      aria-label="Learning Path Builder Progress"
      className="bg-surface-container-lowest rounded-2xl p-3 sm:p-4 border border-surface-container-high/60 shadow-xs mb-space-lg"
    >
      <div className="grid grid-cols-3 gap-2 sm:gap-4 relative">
        {steps.map((step, idx) => {
          const isActive = currentStep === step.num;
          const isCompleted = currentStep > step.num;
          const isClickable = canNavigateToStep(step.num) && (isCompleted || isActive);

          return (
            <button
              key={step.num}
              type="button"
              onClick={() => isClickable && onSelectStep(step.num)}
              disabled={!isClickable}
              className={`flex items-center gap-3 p-2 sm:p-2.5 rounded-xl transition-all text-left relative group ${
                isActive
                  ? "bg-primary/10 border border-primary/20"
                  : isCompleted
                  ? "hover:bg-surface-container cursor-pointer"
                  : "opacity-60 cursor-not-allowed"
              }`}
            >
              {/* Step Number / Icon Badge */}
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 text-xs sm:text-sm font-bold transition-all shadow-2xs ${
                  isCompleted
                    ? "bg-emerald-600 text-white"
                    : isActive
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-on-surface-variant border border-surface-container-high/70"
                }`}
              >
                {isCompleted ? (
                  <span className="material-symbols-outlined text-base">check</span>
                ) : (
                  <span>{step.num}</span>
                )}
              </div>

              {/* Step Labels */}
              <div className="min-w-0 flex-1 hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-label-sm text-xs font-bold tracking-wide truncate ${
                      isActive
                        ? "text-primary"
                        : isCompleted
                        ? "text-on-surface"
                        : "text-on-surface-variant"
                    }`}
                  >
                    {step.label}
                  </span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 animate-pulse" />
                  )}
                </div>
                <p className="text-[11px] text-on-surface-variant truncate">
                  {step.sublabel}
                </p>
              </div>

              {/* Progress Line Connector (between steps) */}
              {idx < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className={`hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-0.5 z-10 ${
                    currentStep > step.num ? "bg-emerald-500" : "bg-surface-container-high"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
