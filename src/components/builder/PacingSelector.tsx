"use client";

import React from "react";
import { PacingStrategy } from "@/lib/types/builder";

interface PacingSelectorProps {
  weeklyHours: number;
  pacingStrategy: PacingStrategy;
  targetCompletionDate?: string;
  feasibilityWarning?: string;
  suggestedWeeklyHours?: number;
  onWeeklyHoursChange: (hours: number) => void;
  onPacingStrategyChange: (strategy: PacingStrategy) => void;
  onTargetCompletionDateChange: (date: string) => void;
}

export default function PacingSelector({
  weeklyHours,
  pacingStrategy,
  targetCompletionDate,
  feasibilityWarning,
  suggestedWeeklyHours,
  onWeeklyHoursChange,
  onPacingStrategyChange,
  onTargetCompletionDateChange,
}: PacingSelectorProps) {
  const pacingStrategies: Array<{ id: PacingStrategy; label: string; desc: string }> = [
    { id: "casual", label: "Casual", desc: "2–4 hrs/wk · Relaxed exploration" },
    { id: "balanced", label: "Balanced", desc: "6–8 hrs/wk · Standard academic cadence" },
    { id: "intensive", label: "Intensive", desc: "10–16 hrs/wk · Dedicated mastery" },
    { id: "sprint", label: "Sprint", desc: "20+ hrs/wk · Rapid deadline cram" },
  ];

  const handleStrategyClick = (strat: PacingStrategy) => {
    onPacingStrategyChange(strat);
    if (strat === "casual") onWeeklyHoursChange(3);
    else if (strat === "balanced") onWeeklyHoursChange(6);
    else if (strat === "intensive") onWeeklyHoursChange(12);
    else if (strat === "sprint") onWeeklyHoursChange(20);
  };

  return (
    <div className="flex flex-col gap-space-xs">
      <div className="flex items-center justify-between">
        <label htmlFor="time-range-slider" className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs font-sans">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
            5
          </span>
          Weekly Commitment &amp; Timeline
        </label>
        <div className="flex items-center gap-1 bg-secondary-fixed/30 px-2.5 py-0.5 rounded-full border border-secondary/20">
          <input
            id="weekly-hours-input"
            type="number"
            min="1"
            max="60"
            value={weeklyHours}
            onChange={(e) => {
              const val = Math.max(1, Math.min(60, Number(e.target.value) || 1));
              onWeeklyHoursChange(val);
              if (val <= 4) onPacingStrategyChange("casual");
              else if (val <= 9) onPacingStrategyChange("balanced");
              else if (val <= 18) onPacingStrategyChange("intensive");
              else onPacingStrategyChange("sprint");
            }}
            className="w-8 bg-transparent text-center font-label-md text-label-md font-bold text-secondary focus:outline-none"
          />
          <span className="font-label-sm text-label-sm text-secondary font-medium">
            hours / week
          </span>
        </div>
      </div>

      {/* Pacing Strategy Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-1">
        {pacingStrategies.map((strat) => {
          const isSelected = pacingStrategy === strat.id;
          return (
            <button
              key={strat.id}
              type="button"
              onClick={() => handleStrategyClick(strat.id)}
              className={`p-2 rounded-lg border text-left transition-all ${
                isSelected
                  ? "bg-primary text-on-primary border-primary shadow-xs font-semibold"
                  : "bg-surface-container-low hover:bg-surface-container text-on-surface border-surface-container-high/40"
              }`}
            >
              <span className="font-label-sm text-label-sm block">{strat.label}</span>
              <span className={`text-[10px] block leading-tight ${isSelected ? "text-primary-fixed-dim" : "text-on-surface-variant"}`}>
                {strat.desc.split("·")[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Slider */}
      <div className="pt-space-sm pb-1">
        <input
          id="time-range-slider"
          type="range"
          min="2"
          max="30"
          step="1"
          value={weeklyHours}
          onChange={(e) => {
            const h = Number(e.target.value);
            onWeeklyHoursChange(h);
            if (h <= 4) onPacingStrategyChange("casual");
            else if (h <= 9) onPacingStrategyChange("balanced");
            else if (h <= 18) onPacingStrategyChange("intensive");
            else onPacingStrategyChange("sprint");
          }}
          className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-on-surface-variant font-label-sm text-label-sm mt-1">
          <span>Casual (2h)</span>
          <span className="font-semibold text-primary">Balanced (6h)</span>
          <span>Intensive (15h)</span>
          <span>Sprint (30h)</span>
        </div>
      </div>

      {/* Optional Target Completion Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-surface-container-high/40">
        <div>
          <span className="font-label-sm text-label-sm text-on-surface font-semibold block">
            Target Completion Deadline (Optional)
          </span>
          <span className="text-[11px] text-on-surface-variant">
            Pencill evaluates curriculum feasibility and warns if schedule is too compressed.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={targetCompletionDate || ""}
            onChange={(e) => onTargetCompletionDateChange(e.target.value)}
            className="bg-surface-container-low px-2.5 py-1.5 rounded-lg text-on-surface font-body-sm text-body-sm border border-surface-container-high/40 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {targetCompletionDate && (
            <button
              type="button"
              onClick={() => onTargetCompletionDateChange("")}
              className="text-xs text-on-surface-variant hover:text-error"
              title="Clear date"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Schedule Feasibility Warning */}
      {feasibilityWarning && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-on-surface flex items-start gap-2.5 text-xs mt-1">
          <span className="material-symbols-outlined text-amber-600 text-lg shrink-0 mt-0.5">
            warning
          </span>
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-amber-900 dark:text-amber-300">
              Schedule Compression Notice
            </span>
            <p className="text-amber-800 dark:text-amber-200 leading-relaxed">
              {feasibilityWarning}
            </p>
            {suggestedWeeklyHours && (
              <button
                type="button"
                onClick={() => onWeeklyHoursChange(suggestedWeeklyHours)}
                className="self-start underline font-semibold text-amber-900 dark:text-amber-100 hover:text-primary mt-0.5"
              >
                Apply recommended {suggestedWeeklyHours} hours/week
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
