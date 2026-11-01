"use client";

import React, { useMemo } from "react";
import { useBuilderStore } from "@/lib/store/builderStore";
import { EngineExecutionResult, ModuleResourceAssignment } from "@/lib/resource-engine/types";

interface ResourceCoverageMatrixProps {
  generationResult?: EngineExecutionResult | null;
  estimatedModules?: Array<{ title: string; focus?: string }>;
  isGenerating?: boolean;
}

export type ModalityStatus = "available" | "partial" | "missing" | "excluded";

export interface ModuleCoverageRow {
  moduleNumber: number;
  title: string;
  theory: ModalityStatus;
  video: ModalityStatus;
  reading: ModalityStatus;
  practice: ModalityStatus;
  quiz: ModalityStatus;
  overallScore: number;
  gapNotice?: string;
}

export default function ResourceCoverageMatrix({
  generationResult,
  estimatedModules = [],
  isGenerating = false,
}: ResourceCoverageMatrixProps) {
  const { config } = useBuilderStore();

  const modalities = config.modalities;

  // Build matrix rows from actual generationResult assignments if available, or estimated modules
  const rows: ModuleCoverageRow[] = useMemo(() => {
    if (generationResult && generationResult.assignments && generationResult.assignments.length > 0) {
      return generationResult.assignments.map((assign: ModuleResourceAssignment, idx: number) => {
        const hasTheory = assign.studyNotes && assign.studyNotes.length > 0;
        const hasVideo = assign.videos && assign.videos.length > 0;
        const hasReading = assign.readings && assign.readings.length > 0;
        const hasPractice = assign.quiz || (assign.readings && assign.readings.some((r: any) => r.modality === "practice"));
        const hasQuiz = Boolean(assign.quiz && assign.quiz.questions && assign.quiz.questions.length >= 3);

        const theoryStatus: ModalityStatus = !modalities.reading ? "excluded" : hasTheory ? "available" : "missing";
        const videoStatus: ModalityStatus = !modalities.video ? "excluded" : hasVideo ? "available" : "missing";
        const readingStatus: ModalityStatus = !modalities.reading ? "excluded" : hasReading ? "available" : "missing";
        const practiceStatus: ModalityStatus = !modalities.practice ? "excluded" : hasPractice ? "available" : "partial";
        const quizStatus: ModalityStatus = !modalities.diagnostic ? "excluded" : hasQuiz ? "available" : "missing";

        let score = 100;
        const gaps: string[] = [];
        if (modalities.video && !hasVideo) {
          score -= 25;
          gaps.push("No video lecture indexed");
        }
        if (modalities.reading && !hasReading && !hasTheory) {
          score -= 25;
          gaps.push("Reading material missing");
        }
        if (modalities.diagnostic && !hasQuiz) {
          score -= 25;
          gaps.push("Checkpoint quiz not synthesized");
        }

        return {
          moduleNumber: idx + 1,
          title: assign.moduleTitle,
          theory: theoryStatus,
          video: videoStatus,
          reading: readingStatus,
          practice: practiceStatus,
          quiz: quizStatus,
          overallScore: Math.max(0, score),
          gapNotice: gaps.length > 0 ? gaps.join(" · ") : undefined,
        };
      });
    }

    // Pre-generation estimated blueprint rows
    const list = estimatedModules.length > 0
      ? estimatedModules
      : [
          { title: "Foundations & Analytical Principles" },
          { title: "Core Mechanisms & Applied Methodology" },
          { title: "Advanced Problem Solving & Case Scenarios" },
          { title: "Systems Integration & Comprehensive Review" },
        ];

    return list.map((m, idx) => ({
      moduleNumber: idx + 1,
      title: m.title,
      theory: !modalities.reading ? "excluded" : isGenerating ? "partial" : "available",
      video: !modalities.video ? "excluded" : isGenerating ? "partial" : "available",
      reading: !modalities.reading ? "excluded" : isGenerating ? "partial" : "available",
      practice: !modalities.practice ? "excluded" : isGenerating ? "partial" : "available",
      quiz: !modalities.diagnostic ? "excluded" : isGenerating ? "partial" : "available",
      overallScore: 100,
      gapNotice: undefined,
    }));
  }, [generationResult, estimatedModules, modalities, isGenerating]);

  const renderBadge = (status: ModalityStatus) => {
    switch (status) {
      case "available":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Ready</span>
          </span>
        );
      case "partial":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Indexed</span>
          </span>
        );
      case "excluded":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-on-surface-variant/60 bg-surface-container px-2 py-0.5 rounded italic">
            <span>Excluded</span>
          </span>
        );
      case "missing":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-error bg-error-container/40 px-2 py-0.5 rounded">
            <span>Unavailable</span>
          </span>
        );
    }
  };

  const isRealExecution = Boolean(generationResult?.assignments?.length);

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-high/60 flex flex-col gap-space-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-lg">grid_on</span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-serif">
            Pedagogical Resource Coverage Matrix
          </h3>
        </div>
        <span
          className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full font-mono text-[11px] ${
            isRealExecution
              ? "bg-secondary-fixed text-on-secondary-fixed font-semibold"
              : "bg-surface-container text-on-surface-variant"
          }`}
        >
          {isRealExecution ? "Verified Discovery Audit" : "Expected Coverage Model"}
        </span>
      </div>

      <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
        Every module is audited across all required modalities. Excluded modalities are deliberately omitted; gaps in required modalities are flagged with transparent alternatives.
      </p>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-surface-container-high/60 mt-1">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-surface-container-high text-on-surface-variant uppercase font-semibold text-[10px] tracking-wider">
              <th className="py-2.5 px-3">Module</th>
              <th className="py-2.5 px-2 text-center">Theory Notes</th>
              <th className="py-2.5 px-2 text-center">Video Lecture</th>
              <th className="py-2.5 px-2 text-center">Reading Extract</th>
              <th className="py-2.5 px-2 text-center">Practice Sheets</th>
              <th className="py-2.5 px-2 text-center">Checkpoint Quiz</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high/40">
            {rows.map((r) => (
              <tr key={r.moduleNumber} className="hover:bg-surface-container-low/50 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-surface-container text-primary flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
                      {r.moduleNumber < 10 ? `0${r.moduleNumber}` : r.moduleNumber}
                    </span>
                    <span className="font-medium text-on-surface truncate max-w-[180px] sm:max-w-xs block" title={r.title}>
                      {r.title}
                    </span>
                  </div>
                  {r.gapNotice && (
                    <span className="text-[10px] text-error flex items-center gap-0.5 mt-0.5">
                      <span className="material-symbols-outlined text-[12px]">warning</span>
                      <span>{r.gapNotice}</span>
                    </span>
                  )}
                </td>
                <td className="py-2 px-2 text-center">{renderBadge(r.theory)}</td>
                <td className="py-2 px-2 text-center">{renderBadge(r.video)}</td>
                <td className="py-2 px-2 text-center">{renderBadge(r.reading)}</td>
                <td className="py-2 px-2 text-center">{renderBadge(r.practice)}</td>
                <td className="py-2 px-2 text-center">{renderBadge(r.quiz)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quality Gate Badges */}
      {generationResult?.coverage?.qualityGates && (
        <div className="mt-2 pt-2 border-t border-surface-container-high/40 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-on-surface text-[11px]">Audit Gates:</span>
          {Object.entries(generationResult.coverage.qualityGates).map(([gateName, gate]: [string, any]) => {
            if (gateName === "allPassed") return null;
            const isPassed = gate.status === "PASSED";
            return (
              <span
                key={gateName}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono ${
                  isPassed
                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                    : "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                }`}
              >
                <span>{gate.gate}:</span>
                <span className="font-bold">{gate.status}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
