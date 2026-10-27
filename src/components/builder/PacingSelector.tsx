"use client";

import React, { useMemo } from "react";
import { useBuilderStore } from "@/lib/store/builderStore";

interface PacingSelectorProps {
  estimatedTotalHours?: number;
}

export default function PacingSelector({ estimatedTotalHours = 23 }: PacingSelectorProps) {
  const { config, updateConfig } = useBuilderStore();

  const weeklyHours = config.weeklyHours;

  // Preset definitions
  const presets = [
    { id: "casual", label: "Casual", min: 2, max: 4, desc: "2–4 hrs/wk · Relaxed exploration", setVal: 3 },
    { id: "balanced", label: "Balanced", min: 5, max: 9, desc: "6–8 hrs/wk · Steady Cadence", setVal: 6 },
    { id: "intensive", label: "Intensive", min: 10, max: 18, desc: "10–16 hrs/wk · Dedicated Exam Prep", setVal: 12 },
    { id: "sprint", label: "Sprint", min: 19, max: 30, desc: "20+ hrs/wk · Rapid Immersion Cram", setVal: 20 },
  ];

  // Active preset highlight
  const activePreset = presets.find((p) => weeklyHours >= p.min && weeklyHours <= p.max) || presets[1];

  // Tomorrow date for min attribute
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  // Feasibility math
  const feasibility = useMemo(() => {
    if (!config.deadline) {
      // Projected completion date
      const weeksNeeded = Math.max(1, Math.ceil(estimatedTotalHours / Math.max(1, weeklyHours)));
      const projected = new Date();
      projected.setDate(projected.getDate() + weeksNeeded * 7);
      const projFormatted = projected.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      return {
        status: "no_deadline" as const,
        weeksNeeded,
        projectedDate: projFormatted,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(config.deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    const diffMs = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return {
        status: "impossible" as const,
        error: "Deadline cannot be in the past or today. Please select a future date.",
      };
    }

    const availableWeeks = Math.max(0.2, diffDays / 7);
    const requiredHoursPerWeek = Math.ceil(estimatedTotalHours / availableWeeks);

    if (requiredHoursPerWeek > 30) {
      return {
        status: "impossible" as const,
        error: `Impossible timeline: requires ${requiredHoursPerWeek} hrs/week (exceeds 30h limit for ${diffDays} days). Please extend the target deadline.`,
      };
    }

    if (requiredHoursPerWeek > weeklyHours) {
      return {
        status: "tight" as const,
        requiredHoursPerWeek,
        diffDays,
        message: `Tight schedule: requires ≥ ${requiredHoursPerWeek} hrs/week to complete ${estimatedTotalHours}h curriculum by deadline.`,
      };
    }

    return {
      status: "ok" as const,
      diffDays,
      message: `Feasible schedule: ${weeklyHours} hrs/week comfortably completes the ${estimatedTotalHours}h curriculum within ${diffDays} days.`,
    };
  }, [config.deadline, estimatedTotalHours, weeklyHours]);

  const handleSliderChange = (val: number) => {
    updateConfig({ weeklyHours: val });
  };

  const handleHoursPillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.max(2, Math.min(30, parsed));
      updateConfig({ weeklyHours: clamped });
    }
  };

  const applyRecommendedHours = (hrs: number) => {
    updateConfig({ weeklyHours: Math.min(30, Math.max(2, hrs)) });
  };

  return (
    <div className="flex flex-col gap-space-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label htmlFor="pacing-slider" className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs font-sans">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
            5
          </span>
          Weekly Commitment
        </label>
        {/* Editable Pill */}
        <div className="flex items-center gap-1 bg-secondary-fixed/30 px-space-sm py-0.5 rounded border border-secondary/20">
          <input
            id="weekly-hours-input"
            type="number"
            min={2}
            max={30}
            value={weeklyHours}
            onChange={handleHoursPillChange}
            className="w-7 bg-transparent text-center font-label-lg text-label-lg text-secondary font-semibold focus:outline-none"
            aria-label="Weekly study hours"
          />
          <span className="font-label-lg text-label-lg text-secondary font-semibold">
            hours / week
          </span>
        </div>
      </div>

      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Pacing strategy:{" "}
        <span className="text-on-surface font-medium">
          {activePreset.label} Pace · ~{Math.max(2, Math.round(estimatedTotalHours / weeklyHours))} Weeks Total Duration
        </span>
      </p>

      {/* Slider (2 to 30) */}
      <div className="pt-space-sm pb-space-xs">
        <input
          id="pacing-slider"
          type="range"
          min={2}
          max={30}
          step={1}
          value={weeklyHours}
          onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
          className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
        />

        {/* Preset Range Indicators */}
        <div className="flex justify-between text-on-surface-variant font-label-sm text-label-sm mt-1">
          {presets.map((p) => {
            const isHighlighted = activePreset.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => updateConfig({ weeklyHours: p.setVal })}
                className={`transition-colors ${
                  isHighlighted ? "font-semibold text-primary underline underline-offset-4" : "hover:text-primary"
                }`}
              >
                {p.label} ({p.min === 2 ? "2 hrs" : p.min === 5 ? "6 hrs" : p.min === 10 ? "12 hrs" : "20 hrs"})
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Deadline Date Picker */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface-container-low/60 rounded-xl border border-surface-container-high/60">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-on-surface">Target Completion Deadline:</span>
          <span className="text-[11px] text-on-surface-variant">
            {config.deadline
              ? `Due: ${new Date(config.deadline).toLocaleDateString("en-GB")}`
              : `Projected completion: ~${feasibility.projectedDate || "4 weeks"}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            min={tomorrowStr}
            value={config.deadline || ""}
            onChange={(e) => updateConfig({ deadline: e.target.value || null })}
            className="bg-surface-container-lowest text-xs text-on-surface px-2.5 py-1.5 rounded-lg border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {config.deadline && (
            <button
              type="button"
              onClick={() => updateConfig({ deadline: null })}
              className="text-[11px] text-on-surface-variant hover:text-error"
              title="Clear deadline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Feasibility Alert Status */}
      {feasibility.status === "ok" && config.deadline && (
        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
          <span>{feasibility.message}</span>
        </div>
      )}

      {feasibility.status === "tight" && (
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600 text-base shrink-0">warning</span>
            <span>{feasibility.message}</span>
          </div>
          <button
            type="button"
            onClick={() => applyRecommendedHours(feasibility.requiredHoursPerWeek)}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-xs shrink-0"
          >
            Apply ({feasibility.requiredHoursPerWeek} h/wk)
          </button>
        </div>
      )}

      {feasibility.status === "impossible" && (
        <div className="p-2.5 rounded-lg bg-error-container/60 border border-error/50 text-error text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-base shrink-0">cancel</span>
          <span className="font-semibold">{feasibility.error}</span>
        </div>
      )}
    </div>
  );
}
