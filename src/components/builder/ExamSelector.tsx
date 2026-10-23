"use client";

import React, { useState, useEffect } from "react";
import {
  EXAM_CATALOG,
  ExamDefinition,
  searchExaminations,
} from "@/lib/catalogs/examCatalog";
import { TargetExamConfig } from "@/lib/types/builder";

interface ExamSelectorProps {
  targetExam: TargetExamConfig | null;
  onTargetExamChange: (exam: TargetExamConfig | null) => void;
}

export default function ExamSelector({
  targetExam,
  onTargetExamChange,
}: ExamSelectorProps) {
  const [isEnabled, setIsEnabled] = useState(Boolean(targetExam));
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [customExamName, setCustomExamName] = useState("");
  const [customRegion, setCustomRegion] = useState("India");
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Sync state if external prop changes
  useEffect(() => {
    setIsEnabled(Boolean(targetExam));
  }, [targetExam]);

  const handleToggle = (checked: boolean) => {
    setIsEnabled(checked);
    if (!checked) {
      onTargetExamChange(null);
    } else if (!targetExam) {
      // Default to JEE Main or first catalog item
      const defaultExam = EXAM_CATALOG[0];
      onTargetExamChange({
        id: defaultExam.id,
        name: defaultExam.name,
        acronym: defaultExam.acronym,
        category: defaultExam.category,
        countryOrRegion: defaultExam.countryOrRegion,
      });
    }
  };

  const handleSelectExam = (exam: ExamDefinition) => {
    onTargetExamChange({
      id: exam.id,
      name: exam.name,
      acronym: exam.acronym,
      category: exam.category,
      countryOrRegion: exam.countryOrRegion,
      examDate: targetExam?.examDate,
      targetScore: targetExam?.targetScore,
      attemptNumber: targetExam?.attemptNumber,
    });
    setIsCustomMode(false);
  };

  const handleSaveCustomExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customExamName.trim()) return;

    onTargetExamChange({
      id: `custom-exam-${Date.now()}`,
      name: customExamName.trim(),
      acronym: customExamName.trim().slice(0, 10).toUpperCase(),
      category: 'custom',
      countryOrRegion: customRegion,
      examDate: targetExam?.examDate,
      targetScore: targetExam?.targetScore,
    });
    setCustomExamName("");
    setIsCustomMode(false);
  };

  const [regionFilter, setRegionFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  const filteredExams = searchExaminations(searchQuery, categoryFilter, 20).filter((e) => {
    if (regionFilter !== "all") {
      if (regionFilter === "India" && !e.countryOrRegion.includes("India")) return false;
      if (regionFilter === "Global" && !e.countryOrRegion.includes("Global")) return false;
      if (regionFilter === "USA" && !e.countryOrRegion.includes("USA")) return false;
    }
    if (levelFilter !== "all") {
      const l = e.level.toLowerCase();
      if (levelFilter === "school" && !l.includes("class") && !l.includes("secondary")) return false;
      if (levelFilter === "undergrad" && !l.includes("undergraduate") && !l.includes("entrance")) return false;
      if (levelFilter === "postgrad" && !l.includes("postgraduate") && !l.includes("fellowship") && !l.includes("research")) return false;
      if (levelFilter === "professional" && !l.includes("professional") && !l.includes("licensure") && !l.includes("charter")) return false;
    }
    return true;
  });

  const popularExams = [
    { acronym: "JEE Main", id: "jee-main" },
    { acronym: "JEE Adv", id: "jee-advanced" },
    { acronym: "NEET UG", id: "neet-ug" },
    { acronym: "GATE", id: "gate" },
    { acronym: "UPSC CSE", id: "upsc-cse" },
    { acronym: "CAT", id: "cat" },
    { acronym: "AWS SAA", id: "aws-cert" },
    { acronym: "CA Exam", id: "ca-exam" },
    { acronym: "SAT", id: "sat" },
  ];

  return (
    <div className="flex flex-col gap-space-sm p-4 rounded-xl bg-surface-container-low/50 border border-surface-container-high/60 transition-all">
      {/* Enable Toggle Header */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="w-4 h-4 rounded text-primary accent-primary"
          />
          <div className="flex flex-col">
            <span className="font-label-lg text-label-lg text-on-surface font-semibold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-secondary">verified_user</span>
              Align to Examination or Certification
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Filters curriculum strictly according to official test syllabus and question styles.
            </span>
          </div>
        </label>
        {isEnabled && targetExam && (
          <span className="bg-secondary/15 text-secondary text-xs px-2.5 py-0.5 rounded-full font-semibold border border-secondary/30">
            {targetExam.acronym || targetExam.name}
          </span>
        )}
      </div>

      {/* Expandable Exam Picker */}
      {isEnabled && (
        <div className="flex flex-col gap-space-md pt-space-xs mt-1 border-t border-surface-container-high/40">
          {/* Quick Popular Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Popular targets:</span>
            {popularExams.map((p) => {
              const isSelected = targetExam?.id === p.id || targetExam?.acronym === p.acronym;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    const match = EXAM_CATALOG.find((e) => e.id === p.id);
                    if (match) handleSelectExam(match);
                  }}
                  className={`px-2 py-0.5 rounded-md font-label-sm text-label-sm transition-all border ${
                    isSelected
                      ? "bg-primary text-on-primary border-primary font-semibold shadow-2xs"
                      : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant border-surface-container-high/40"
                  }`}
                >
                  {p.acronym}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setIsCustomMode(!isCustomMode)}
              className="text-xs text-primary font-semibold hover:underline ml-auto"
            >
              {isCustomMode ? "Cancel Custom" : "+ Custom Exam"}
            </button>
          </div>

          {/* Custom Exam Creator */}
          {isCustomMode ? (
            <form onSubmit={handleSaveCustomExam} className="p-3 bg-surface-container-lowest rounded-lg border border-primary/30 flex flex-col gap-2">
              <span className="font-label-sm text-label-sm font-semibold text-primary">Add Unlisted Exam or Certification</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customExamName}
                  onChange={(e) => setCustomExamName(e.target.value)}
                  placeholder="Exam Name (e.g. Karnataka PGCET, PLAB 1, Azure AI-900)"
                  className="bg-surface-container-low px-3 py-1.5 rounded-md text-on-surface font-body-sm text-body-sm border border-surface-container-high"
                />
                <input
                  type="text"
                  value={customRegion}
                  onChange={(e) => setCustomRegion(e.target.value)}
                  placeholder="Country or State (e.g. India, USA, Global)"
                  className="bg-surface-container-low px-3 py-1.5 rounded-md text-on-surface font-body-sm text-body-sm border border-surface-container-high"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="px-3 py-1 text-xs text-on-surface-variant hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!customExamName.trim()}
                  className="px-3 py-1 text-xs font-semibold bg-primary text-on-primary rounded-md disabled:opacity-40"
                >
                  Save Exam Target
                </button>
              </div>
            </form>
          ) : (
            /* Search Catalog Bar */
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-base">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search 35+ exams by name or acronym (e.g. JEE, UPSC, GATE, AWS, CFA)..."
                    className="w-full bg-surface-container pl-9 pr-3 py-2 rounded-lg text-on-surface font-body-sm text-body-sm border border-surface-container-high/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-surface-container px-2 py-2 rounded-lg text-on-surface font-label-sm text-label-sm border border-surface-container-high/40"
                >
                  <option value="all">All Categories</option>
                  <option value="school_boards">School Boards</option>
                  <option value="engineering_medical_entrance">Eng &amp; Med Entrance</option>
                  <option value="university_higher_ed">Higher Ed (GATE/CAT/NET)</option>
                  <option value="government_civil_services">Govt &amp; Civil Services</option>
                  <option value="it_industry_certifications">IT Certifications</option>
                  <option value="accounting_finance_professional">Accounting / CA / CFA</option>
                </select>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="bg-surface-container px-2 py-2 rounded-lg text-on-surface font-label-sm text-label-sm border border-surface-container-high/40"
                >
                  <option value="all">All Regions</option>
                  <option value="India">India</option>
                  <option value="Global">Global</option>
                  <option value="USA">USA</option>
                </select>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="bg-surface-container px-2 py-2 rounded-lg text-on-surface font-label-sm text-label-sm border border-surface-container-high/40"
                >
                  <option value="all">All Levels</option>
                  <option value="school">School / Board</option>
                  <option value="undergrad">Undergrad Entrance</option>
                  <option value="postgrad">Postgraduate / Masters</option>
                  <option value="professional">Professional Charter</option>
                </select>
              </div>

              {/* Filtered Exam Results */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pt-1">
                {filteredExams.map((exam) => {
                  const isSelected = targetExam?.id === exam.id;
                  return (
                    <button
                      key={exam.id}
                      type="button"
                      onClick={() => handleSelectExam(exam)}
                      className={`flex flex-col items-start p-2 rounded-lg border text-left transition-all ${
                        isSelected
                          ? "bg-primary-container text-on-primary border-primary-container shadow-2xs"
                          : "bg-surface-container-lowest hover:bg-surface-container text-on-surface border-surface-container-high/40"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-label-md text-label-md font-semibold truncate">
                          {exam.acronym}
                        </span>
                        {isSelected && (
                          <span className="material-symbols-outlined text-xs text-secondary-fixed">
                            check_circle
                          </span>
                        )}
                      </div>
                      <span className={`text-[11px] truncate w-full ${isSelected ? "text-primary-fixed-dim" : "text-on-surface-variant"}`}>
                        {exam.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected Exam Information & Optional Fields */}
          {targetExam && (
            <div className="p-3 bg-surface-container-lowest rounded-lg border border-surface-container-high/60 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-primary font-semibold">
                  Active Target: {targetExam.name}
                </span>
                {targetExam.category && (
                  <span className="text-[10px] font-mono text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
                    {targetExam.countryOrRegion || "National"}
                  </span>
                )}
              </div>

              {/* Optional Target Date and Score */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 border-t border-surface-container-high/30">
                <div>
                  <label className="text-[11px] font-label-sm text-on-surface-variant block mb-1">
                    Exam Subject (Optional)
                  </label>
                  <input
                    type="text"
                    value={targetExam.examSubject || ""}
                    onChange={(e) =>
                      onTargetExamChange({ ...targetExam, examSubject: e.target.value })
                    }
                    placeholder="e.g. Physics, CS, Bio"
                    className="w-full bg-surface-container px-2 py-1 rounded text-on-surface text-xs border border-surface-container-high/40"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-label-sm text-on-surface-variant block mb-1">
                    Exam Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={targetExam.examDate || ""}
                    onChange={(e) =>
                      onTargetExamChange({ ...targetExam, examDate: e.target.value })
                    }
                    className="w-full bg-surface-container px-2 py-1 rounded text-on-surface text-xs border border-surface-container-high/40"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-label-sm text-on-surface-variant block mb-1">
                    Target Score / Rank
                  </label>
                  <input
                    type="text"
                    value={targetExam.targetScore || ""}
                    onChange={(e) =>
                      onTargetExamChange({ ...targetExam, targetScore: e.target.value })
                    }
                    placeholder="e.g. 99%ile, Rank < 500, Pass"
                    className="w-full bg-surface-container px-2 py-1 rounded text-on-surface text-xs border border-surface-container-high/40"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-label-sm text-on-surface-variant block mb-1">
                    Attempt Number
                  </label>
                  <select
                    value={targetExam.attemptNumber || 1}
                    onChange={(e) =>
                      onTargetExamChange({ ...targetExam, attemptNumber: Number(e.target.value) })
                    }
                    className="w-full bg-surface-container px-2 py-1 rounded text-on-surface text-xs border border-surface-container-high/40"
                  >
                    <option value={1}>1st Attempt</option>
                    <option value={2}>2nd Attempt</option>
                    <option value={3}>3rd+ Attempt / Repeater</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
