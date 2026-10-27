"use client";

import React, { useState } from "react";
import { EXAM_CATALOG, ExamDefinition, searchExaminations } from "@/lib/catalogs/examCatalog";
import { useBuilderStore } from "@/lib/store/builderStore";

export default function ExamSelector() {
  const { config, updateConfig } = useBuilderStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const hasExamsForDomain = config.domainId !== "personal-practical";

  // Filter exams according to active domain
  const availableExams = EXAM_CATALOG.filter((exam) => {
    if (config.domainId === "school-education") {
      return (
        exam.category === "school_boards" ||
        exam.category === "engineering_medical_entrance" ||
        exam.category === "olympiads_competitions"
      );
    }
    if (config.domainId === "engineering-technology") {
      return (
        exam.category === "engineering_medical_entrance" ||
        exam.category === "it_industry_certifications" ||
        exam.category === "olympiads_competitions"
      );
    }
    if (config.domainId === "medical-health") {
      return exam.category === "engineering_medical_entrance" || exam.category === "medical_licensing";
    }
    if (config.domainId === "business-management") {
      return exam.category === "university_higher_ed" || exam.category === "accounting_finance_professional";
    }
    if (config.domainId === "law-government") {
      return exam.category === "law_entrance" || exam.category === "government_civil_services";
    }
    if (config.domainId === "finance-qualifications") {
      return exam.category === "accounting_finance_professional";
    }
    if (config.domainId === "languages-communication") {
      return exam.category === "international_university_language";
    }
    return true;
  });

  const filteredExams = availableExams.filter((exam) => {
    if (categoryFilter !== "all" && exam.category !== categoryFilter) return false;
    if (!searchQuery.trim()) return true;
    const clean = searchQuery.toLowerCase();
    return (
      exam.name.toLowerCase().includes(clean) ||
      exam.acronym.toLowerCase().includes(clean) ||
      exam.typicalSubjects.some((s) => s.toLowerCase().includes(clean))
    );
  });

  const handleToggleAlign = (checked: boolean) => {
    if (!checked) {
      updateConfig((prev) => ({
        ...prev,
        examAlign: { enabled: false },
      }));
    } else {
      const defaultExam = availableExams[0] || EXAM_CATALOG[0];
      updateConfig((prev) => ({
        ...prev,
        examAlign: {
          enabled: true,
          examId: defaultExam.id,
          examName: defaultExam.name,
          syllabusUnits: defaultExam.typicalSubjects,
        },
        modalities: {
          ...prev.modalities,
          pyq: true,
        },
      }));
    }
  };

  const handleSelectExam = (exam: ExamDefinition) => {
    updateConfig((prev) => ({
      ...prev,
      examAlign: {
        enabled: true,
        examId: exam.id,
        examName: exam.name,
        syllabusUnits: exam.typicalSubjects,
      },
      modalities: {
        ...prev.modalities,
        pyq: true,
      },
    }));
  };

  return (
    <div className="p-space-md rounded-xl bg-surface-container-low/50 border border-surface-container-high/60 flex flex-col gap-3">
      {/* Alignment Toggle Header */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={config.examAlign.enabled}
            disabled={!hasExamsForDomain}
            onChange={(e) => handleToggleAlign(e.target.checked)}
            className="w-4 h-4 rounded text-primary accent-primary cursor-pointer disabled:opacity-40"
          />
          <span className={`text-sm font-semibold ${hasExamsForDomain ? "text-on-surface" : "text-on-surface-variant opacity-60"}`}>
            Align to Examination or Certification Syllabus
          </span>
        </label>

        {!hasExamsForDomain ? (
          <span
            className="text-[11px] text-on-surface-variant italic cursor-help"
            title="Standardized examinations are not applicable to the Personal & Practical Learning domain."
          >
            Not applicable for this domain
          </span>
        ) : (
          <span className="text-[11px] text-secondary font-medium font-mono">
            {config.examAlign.enabled ? "Active Alignment" : "Optional"}
          </span>
        )}
      </div>

      {/* Expanded Exam Directory Picker */}
      {config.examAlign.enabled && hasExamsForDomain && (
        <div className="flex flex-col gap-3 pt-2 border-t border-surface-container-high/40 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-base">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search examination (e.g. JEE Main, NEET, CBSE 12, GATE, UPSC)..."
                className="w-full pl-9 pr-3 py-2 bg-surface-container-lowest rounded-lg border border-surface-container-high text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-surface-container-lowest text-xs text-on-surface px-2.5 py-2 rounded-lg border border-surface-container-high focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="school_boards">School Boards</option>
              <option value="engineering_medical_entrance">Entrance Exams</option>
              <option value="government_civil_services">Civil Services</option>
              <option value="it_industry_certifications">Certifications</option>
            </select>
          </div>

          {/* Active Selection Pill */}
          {config.examAlign.examName && (
            <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-secondary/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-secondary text-base shrink-0">
                  verified
                </span>
                <span className="font-semibold text-primary truncate">
                  {config.examAlign.examName}
                </span>
              </div>
              <span className="text-[10px] text-secondary bg-secondary-fixed/50 px-2 py-0.5 rounded font-mono shrink-0">
                PYQ Syllabus Grounded
              </span>
            </div>
          )}

          {/* Exams Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-0.5">
            {filteredExams.map((exam) => {
              const isSelected = config.examAlign.examId === exam.id;
              return (
                <button
                  key={exam.id}
                  type="button"
                  onClick={() => handleSelectExam(exam)}
                  className={`p-2 rounded-lg border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? "bg-primary text-on-primary border-primary shadow-xs"
                      : "bg-surface-container-lowest hover:bg-surface-container text-on-surface border-surface-container-high/40"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-xs truncate">{exam.acronym}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isSelected
                          ? "bg-primary-container text-primary-fixed"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      {exam.countryOrRegion}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] truncate mt-0.5 ${
                      isSelected ? "text-primary-fixed-dim" : "text-on-surface-variant"
                    }`}
                  >
                    {exam.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
