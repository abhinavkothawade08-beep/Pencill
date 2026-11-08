"use client";

import React, { useState } from "react";
import { SyllabusCoverageMatrix, SyllabusSubtopic } from "@/lib/resource-engine/types";

interface SyllabusCoverageViewProps {
  courseId: string;
  moduleId: string;
  moduleTitle: string;
  matrix?: SyllabusCoverageMatrix;
  onRepairCompleted?: (updatedMatrix: SyllabusCoverageMatrix, newLessons: any[]) => void;
}

export default function SyllabusCoverageView({
  courseId,
  moduleId,
  moduleTitle,
  matrix,
  onRepairCompleted,
}: SyllabusCoverageViewProps) {
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairNotice, setRepairNotice] = useState<string | null>(null);

  if (!matrix || !matrix.subtopics || matrix.subtopics.length === 0) {
    return (
      <div className="p-3 bg-surface-container-low rounded-lg text-xs text-on-surface-variant italic">
        Syllabus coverage matrix will calibrate upon resource indexation.
      </div>
    );
  }

  const handleRepairGaps = async () => {
    if (isRepairing) return;
    setIsRepairing(true);
    setRepairNotice(null);

    try {
      const res = await fetch(`/api/courses/${courseId}/repair-module`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId }),
      });

      const data = await res.json();
      if (data.success) {
        setRepairNotice(`Successfully repaired ${data.repairedCount} subtopic gaps!`);
        if (onRepairCompleted) {
          onRepairCompleted(data.matrix, data.addedLessons);
        }
      } else {
        throw new Error(data.error || "Repair failed");
      }
    } catch (err: any) {
      setRepairNotice(err.message || "Could not complete targeted repair");
    } finally {
      setIsRepairing(false);
    }
  };

  const coveragePercent = matrix.overallCoveragePercent ?? 80;
  const missingCount = matrix.missingObjectiveCount ?? 0;

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high/60 p-4 shadow-xs mb-3">
      {/* Header & Overall Score */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3 pb-2 border-b border-surface-container-high/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
              Syllabus Coverage Matrix
            </span>
            <span className="font-mono text-xs font-semibold text-on-surface">
              {coveragePercent}% Verified
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {matrix.coverageSummary || `${matrix.subtopics.length} learning objectives evaluated.`}
          </p>
        </div>

        {missingCount > 0 && (
          <button
            type="button"
            onClick={handleRepairGaps}
            disabled={isRepairing}
            className="px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            title="Search targeted educational repositories for missing subtopics"
          >
            <span className={`material-symbols-outlined text-sm ${isRepairing ? "animate-spin" : ""}`}>
              {isRepairing ? "progress_activity" : "auto_fix_high"}
            </span>
            <span>{isRepairing ? "Repairing Gaps..." : "Repair Resource Gaps"}</span>
          </button>
        )}
      </div>

      {repairNotice && (
        <div className="mb-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>{repairNotice}</span>
        </div>
      )}

      {/* Subtopics Checklist */}
      <div className="space-y-2">
        {matrix.subtopics.map((sub: SyllabusSubtopic, idx: number) => {
          const status = sub.coverageStatus;
          const statusClasses =
            status === "Fully Covered"
              ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
              : status === "Partially Covered"
              ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30"
              : "bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30";

          return (
            <div
              key={sub.id || idx}
              className="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors border border-surface-container-high/30 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-on-surface text-xs font-sans">
                      {sub.title}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold border ${statusClasses}`}
                    >
                      {status}
                    </span>

                    {sub.pyqAvailable && sub.pyqAttribution && (
                      <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-semibold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[11px]">history_edu</span>
                        <span>PYQ: {sub.pyqAttribution}</span>
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-on-surface-variant line-clamp-2">
                    {sub.learningObjective}
                  </p>
                </div>

                {/* Resource Links Shortcuts */}
                <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                  {sub.matchedVideoUrl && (
                    <a
                      href={sub.matchedVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded text-primary hover:bg-primary/10 transition-colors"
                      title="Video Lecture Available"
                    >
                      <span className="material-symbols-outlined text-sm">play_circle</span>
                    </a>
                  )}
                  {sub.matchedReadingUrl && (
                    <a
                      href={sub.matchedReadingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded text-primary hover:bg-primary/10 transition-colors"
                      title="Reading / Study Material Available"
                    >
                      <span className="material-symbols-outlined text-sm">menu_book</span>
                    </a>
                  )}
                  {sub.matchedPracticeUrl && (
                    <a
                      href={sub.matchedPracticeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded text-secondary hover:bg-secondary/10 transition-colors"
                      title="Past Exam / Practice Problems Available"
                    >
                      <span className="material-symbols-outlined text-sm">assignment</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
