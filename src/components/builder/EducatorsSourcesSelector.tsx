"use client";

import React, { useState, useMemo } from "react";
import { useBuilderStore } from "@/lib/store/builderStore";
import rawDirectory from "@/../data/master-youtube-educator-directory.json";

interface RawEducator {
  id: string;
  name: string;
  ch: string;
  cid?: string;
  handle?: string;
  topics?: string;
  aff?: string;
  best?: string;
  ver_status?: string;
}

const ALL_EDUCATORS: RawEducator[] = (rawDirectory as any).educators || [];

export default function EducatorsSourcesSelector() {
  const { config, updateConfig, toggleEducatorPreference, toggleRepositoryPreference } = useBuilderStore();

  const [educatorSearch, setEducatorSearch] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("all");

  const preferredEducatorIds = useMemo(
    () => config.educatorPreferences?.preferredEducatorIds || [],
    [config.educatorPreferences?.preferredEducatorIds]
  );
  const repoPrefs = config.repositoryPreferences || {
    preferredRepositories: ["NCERT", "NPTEL", "Khan Academy", "MIT OCW"],
    excludedRepositories: [],
    officialOnly: false,
    openAccessOnly: true,
    sourceStrategy: "balanced",
  };

  const primaryTopic = config.selectedTopics[0]?.label || config.subjectId;
  const primaryTopicLower = primaryTopic.toLowerCase();

  // Filter educators
  const filteredEducators = useMemo(() => {
    const q = educatorSearch.trim().toLowerCase();
    return ALL_EDUCATORS.filter((ed) => {
      if (selectedSubjectFilter !== "all") {
        const topicsStr = (ed.topics || "").toLowerCase();
        if (!topicsStr.includes(selectedSubjectFilter)) return false;
      }
      if (!q) return true;
      const nameMatch = ed.name.toLowerCase().includes(q);
      const chMatch = ed.ch.toLowerCase().includes(q);
      const handleMatch = (ed.handle || "").toLowerCase().includes(q);
      const topicsMatch = (ed.topics || "").toLowerCase().includes(q);
      const affMatch = (ed.aff || "").toLowerCase().includes(q);
      return nameMatch || chMatch || handleMatch || topicsMatch || affMatch;
    }).slice(0, 15);
  }, [educatorSearch, selectedSubjectFilter]);

  // Selected educator objects
  const selectedEducatorObjects = useMemo(() => {
    return ALL_EDUCATORS.filter((ed) => preferredEducatorIds.includes(ed.id));
  }, [preferredEducatorIds]);

  // Available repositories
  const availableRepositories = [
    { name: "NCERT", label: "NCERT", category: "K-12 & Foundation", icon: "school" },
    { name: "NPTEL", label: "NPTEL / IIT Faculty", category: "Higher STEM", icon: "account_balance" },
    { name: "Khan Academy", label: "Khan Academy", category: "Core Concept Intuition", icon: "lightbulb" },
    { name: "MIT OCW", label: "MIT OpenCourseWare", category: "Undergraduate & Advanced", icon: "domain" },
    { name: "OpenStax", label: "OpenStax Peer-Reviewed", category: "College Textbooks", icon: "menu_book" },
    { name: "SWAYAM", label: "SWAYAM (Govt of India)", category: "National Curricula", icon: "public" },
    { name: "Stanford Online", label: "Stanford Online", category: "Computer Science & AI", icon: "terminal" },
    { name: "arXiv", label: "arXiv Scholarly Papers", category: "Frontier Research", icon: "description" },
    { name: "Official Docs", label: "Official Framework Docs", category: "Technical APIs", icon: "verified" },
  ];

  const sourceStrategies: Array<{ id: "balanced" | "official_first" | "educator_first" | "open_first"; label: string; desc: string }> = [
    { id: "balanced", label: "Balanced Discovery", desc: "Combines academic textbooks, verified faculty channels, and open repositories." },
    { id: "official_first", label: "Institution-First", desc: "Strictly prioritizes NPTEL, MIT OCW, and official textbook syllabus." },
    { id: "educator_first", label: "Educator-First", desc: "Ranks top individual verified teachers and content creators ahead." },
    { id: "open_first", label: "Open-Access Only", desc: "Restricts purely to Creative Commons, public domain, and openly redistributable content." },
  ];

  return (
    <div className="flex flex-col gap-space-sm" id="section-educators-sources">
      <div className="flex items-center justify-between">
        <label className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs font-semibold">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-bold">
            6
          </span>
          Preferred Educators &amp; Institutional Sources
        </label>
        <span className="font-label-sm text-label-sm text-secondary font-medium">
          Master Directory (96+ Verified)
        </span>
      </div>

      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Select preferred educators from Pencill&apos;s verified academic directory. Candidate videos from these educators receive a credibility boost during relevance scoring.
      </p>

      {/* Selected Preferred Educators Chips */}
      {selectedEducatorObjects.length > 0 && (
        <div className="p-3 bg-primary-container/20 border border-primary/20 rounded-xl space-y-1.5 animate-fadeIn">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">stars</span>
              Prioritized Educators ({selectedEducatorObjects.length} active)
            </span>
            <button
              type="button"
              onClick={() => {
                updateConfig((prev) => ({
                  ...prev,
                  educatorPreferences: {
                    ...prev.educatorPreferences,
                    preferredEducatorIds: [],
                  },
                }));
              }}
              className="text-on-surface-variant hover:text-error hover:underline text-[11px]"
            >
              Clear All
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {selectedEducatorObjects.map((ed) => (
              <span
                key={ed.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-on-primary text-xs font-medium shadow-xs"
              >
                <span className="font-semibold">{ed.name}</span>
                <span className="opacity-80 text-[10px]">({ed.ch})</span>
                <button
                  type="button"
                  onClick={() => toggleEducatorPreference(ed.id)}
                  className="hover:opacity-100 opacity-70 ml-1"
                  aria-label={`Remove educator ${ed.name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search & Subject Filter for Educators */}
      <div className="flex flex-col sm:flex-row items-stretch gap-2 mt-1">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search educator (e.g. 3Blue1Brown, Walter Lewin, StatQuest, H.C. Verma)..."
            value={educatorSearch}
            onChange={(e) => setEducatorSearch(e.target.value)}
            className="w-full bg-surface-container-low px-3 py-2 pl-8 rounded-lg text-body-sm text-on-surface border border-surface-container-high/60 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="material-symbols-outlined text-base text-on-surface-variant absolute left-2.5 top-2.5">
            search
          </span>
          {educatorSearch && (
            <button
              type="button"
              onClick={() => setEducatorSearch("")}
              className="absolute right-2.5 top-2.5 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>

        {/* Quick subject filter pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {["all", "physics", "math", "cs", "chemistry", "ai"].map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSelectedSubjectFilter(sub)}
              className={`px-2 py-1 rounded text-xs font-medium capitalize shrink-0 ${
                selectedSubjectFilter === sub
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Educator Search Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1 bg-surface-container-lowest rounded-xl border border-surface-container-high/60">
        {filteredEducators.length === 0 ? (
          <div className="col-span-full py-4 text-center text-xs text-on-surface-variant">
            No matching educators found in directory. Try searching by surname or topic.
          </div>
        ) : (
          filteredEducators.map((ed) => {
            const isSelected = preferredEducatorIds.includes(ed.id);
            return (
              <button
                key={ed.id}
                type="button"
                onClick={() => toggleEducatorPreference(ed.id)}
                className={`p-2.5 rounded-lg text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-primary-container text-on-primary-container border-primary"
                    : "bg-surface-container-low hover:bg-surface-container text-on-surface border-surface-container-high/40"
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <div className="min-w-0">
                    <span className="font-semibold text-xs text-on-surface truncate block">
                      {ed.name}
                    </span>
                    <span className="text-[11px] text-on-surface-variant truncate block">
                      {ed.ch} {ed.handle ? `· @${ed.handle}` : ""}
                    </span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-sm shrink-0 ${
                      isSelected ? "text-primary" : "text-outline-variant"
                    }`}
                  >
                    {isSelected ? "check_circle" : "add_circle"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-on-surface-variant pt-1 border-t border-surface-container-high/30">
                  <span className="truncate max-w-[120px]">{ed.topics || ed.aff || "General STEM"}</span>
                  <span className="font-mono text-secondary font-medium uppercase">
                    {ed.ver_status === "VERIFIED" ? "Verified" : "Curated"}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Target Academic Repositories Section */}
      <div className="mt-3 pt-3 border-t border-surface-container-high/50 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-secondary">database</span>
            Permitted Academic Repositories
          </span>
          <span className="text-[11px] text-on-surface-variant">At least 1 required</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {availableRepositories.map((repo) => {
            const isSelected = (repoPrefs.preferredRepositories || []).includes(repo.name);
            return (
              <button
                key={repo.name}
                type="button"
                onClick={() => toggleRepositoryPreference(repo.name)}
                className={`p-2 rounded-lg text-left text-xs transition-all flex items-center gap-2 border ${
                  isSelected
                    ? "bg-surface-container-highest text-primary border-primary/40 font-semibold shadow-xs"
                    : "bg-surface-container-low text-on-surface-variant border-surface-container-high/40 hover:bg-surface-container"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-base shrink-0 ${
                    isSelected ? "text-primary" : "text-on-surface-variant"
                  }`}
                >
                  {repo.icon}
                </span>
                <div className="min-w-0">
                  <span className="truncate block font-medium">{repo.label}</span>
                  <span className="text-[10px] opacity-75 truncate block">{repo.category}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Source Strategy Selector */}
        <div className="mt-2 pt-2 flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-on-surface">Source Prioritization Strategy:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {sourceStrategies.map((strat) => {
              const isSelected = repoPrefs.sourceStrategy === strat.id;
              return (
                <button
                  key={strat.id}
                  type="button"
                  onClick={() => {
                    updateConfig((prev) => ({
                      ...prev,
                      repositoryPreferences: {
                        ...prev.repositoryPreferences,
                        sourceStrategy: strat.id,
                      },
                    }));
                  }}
                  className={`p-2 rounded-lg text-left text-xs transition-all border ${
                    isSelected
                      ? "bg-secondary-container/40 text-on-secondary-container border-secondary font-semibold"
                      : "bg-surface-container-low text-on-surface border-surface-container-high/40 hover:bg-surface-container"
                  }`}
                >
                  <div className="font-semibold">{strat.label}</div>
                  <div className="text-[11px] opacity-80">{strat.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
