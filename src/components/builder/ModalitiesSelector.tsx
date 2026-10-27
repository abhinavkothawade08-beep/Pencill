"use client";

import React, { useState } from "react";
import { useBuilderStore } from "@/lib/store/builderStore";
import { BuilderModalitiesConfig } from "@/lib/types/builderConfig";

export default function ModalitiesSelector() {
  const { config, updateConfig } = useBuilderStore();
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  const isTechDomain = config.domainId === "engineering-technology";
  const hasExam = config.examAlign.enabled;

  const activeCount = Object.values(config.modalities).filter(Boolean).length;

  const toggleModality = (key: keyof BuilderModalitiesConfig) => {
    const isCurrentlyOn = config.modalities[key];

    // Block unchecking if it's the last one
    if (isCurrentlyOn && activeCount <= 1) {
      setWarningMsg("At least one pedagogical modality must remain enabled.");
      setTimeout(() => setWarningMsg(null), 3000);
      return;
    }

    setWarningMsg(null);
    updateConfig((prev) => ({
      ...prev,
      modalities: {
        ...prev.modalities,
        [key]: !isCurrentlyOn,
      },
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, key: keyof BuilderModalitiesConfig, disabled = false) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggleModality(key);
    }
  };

  const coreModalities = [
    {
      key: "video" as const,
      label: "Curated Video Lectures",
      desc: "NPTEL, IIT Faculty, & YouTube stars",
      icon: "smart_display",
    },
    {
      key: "reading" as const,
      label: "Deep Reading / Theory Notes",
      desc: "NCERT extracts & classic textbook notes",
      icon: "menu_book",
    },
    {
      key: "practice" as const,
      label: "Graded Practice Problems",
      desc: "Past 10 years JEE Main/Adv questions",
      icon: "assignment",
    },
    {
      key: "diagnostic" as const,
      label: "Diagnostic Quizzes",
      desc: "Instant feedback checkpoint tests",
      icon: "quiz",
    },
    {
      key: "flashcards" as const,
      label: "Spaced Formula Flashcards",
      desc: "Equations, dimensional formulas & memory hooks",
      icon: "style",
      fullWidth: true,
    },
  ];

  const specializedModalities = [
    {
      key: "worked" as const,
      label: "Worked Examples & Derivations",
      desc: "Annotated line-by-line solutions to challenging problems",
      icon: "draw",
      disabled: false,
    },
    {
      key: "pyq" as const,
      label: "Past Examination Papers (PYQs)",
      desc: "Actual previous years exam questions and marking schemes",
      icon: "history_edu",
      disabled: !hasExam,
      tooltip: !hasExam ? "Requires exam alignment. Check 'Align to Examination' above." : undefined,
    },
    {
      key: "coding" as const,
      label: "Interactive Coding Exercises",
      desc: "Hands-on coding challenges and syntax implementations",
      icon: "terminal",
      disabled: !isTechDomain,
      tooltip: !isTechDomain ? "Available only for Engineering & Technology domain." : undefined,
    },
    {
      key: "projects" as const,
      label: "Real-World Projects & Case Studies",
      desc: "Capstone implementation tasks and applied problem scenarios",
      icon: "inventory_2",
      disabled: false,
    },
  ];

  return (
    <div className="flex flex-col gap-space-xs">
      {/* Step Header */}
      <div className="flex items-center justify-between">
        <label className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs font-sans">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
            4
          </span>
          Primary Pedagogical Modalities
        </label>
        <span className="font-label-sm text-label-sm text-secondary font-medium">Step 4 of 5</span>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant -mt-1">
        Pencill selects verified materials matching your cognitive study routine.
      </p>

      {/* Warning message if trying to uncheck last */}
      {warningMsg && (
        <div className="p-2.5 rounded-lg bg-error-container/40 border border-error/40 text-error text-xs flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-base">warning</span>
          <span>{warningMsg}</span>
        </div>
      )}

      {/* Core 5 Modalities Grid (Matches Visual Screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs mt-space-xs">
        {coreModalities.map((item) => {
          const checked = config.modalities[item.key];
          return (
            <div
              key={item.key}
              tabIndex={0}
              role="checkbox"
              aria-checked={checked}
              onKeyDown={(e) => handleKeyDown(e, item.key)}
              onClick={() => toggleModality(item.key)}
              className={`flex items-center gap-space-sm p-space-sm rounded-lg cursor-pointer transition-colors ${
                item.fullWidth ? "sm:col-span-2" : ""
              } ${
                checked
                  ? "bg-surface-container-low hover:bg-surface-container border border-surface-container-high/60"
                  : "bg-surface-container-lowest hover:bg-surface-container-low border border-dashed border-surface-container-high opacity-70"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {}} // Handled by parent container for full-card clickability
                tabIndex={-1}
                className="w-4 h-4 rounded text-primary accent-primary pointer-events-none"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-label-lg text-label-lg text-on-surface font-semibold truncate">
                  {item.label}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                  {item.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Specialized Modalities Section */}
      <div className="pt-2">
        <span className="text-xs font-semibold text-on-surface-variant block mb-1.5">
          Specialized Academic &amp; Applied Formats:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs">
          {specializedModalities.map((item) => {
            const checked = config.modalities[item.key];
            return (
              <div
                key={item.key}
                tabIndex={item.disabled ? -1 : 0}
                role="checkbox"
                aria-checked={checked}
                aria-disabled={item.disabled}
                onKeyDown={(e) => handleKeyDown(e, item.key, item.disabled)}
                onClick={() => {
                  if (!item.disabled) toggleModality(item.key);
                }}
                title={item.tooltip}
                className={`flex items-center gap-space-sm p-space-sm rounded-lg transition-colors ${
                  item.disabled
                    ? "bg-surface-container-low/40 border border-surface-container-high/30 opacity-40 cursor-not-allowed"
                    : checked
                    ? "bg-surface-container-low hover:bg-surface-container border border-surface-container-high/60 cursor-pointer"
                    : "bg-surface-container-lowest hover:bg-surface-container-low border border-dashed border-surface-container-high cursor-pointer opacity-70"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={item.disabled}
                  onChange={() => {}}
                  tabIndex={-1}
                  className="w-4 h-4 rounded text-primary accent-primary pointer-events-none"
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-label-lg text-label-lg text-on-surface font-semibold truncate">
                      {item.label}
                    </span>
                    {item.key === "pyq" && !hasExam && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateConfig((prev) => ({
                            ...prev,
                            examAlign: { enabled: true },
                            modalities: { ...prev.modalities, pyq: true },
                          }));
                        }}
                        className="text-[10px] text-primary hover:underline font-bold shrink-0 ml-1"
                      >
                        Align now
                      </button>
                    )}
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                    {item.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
