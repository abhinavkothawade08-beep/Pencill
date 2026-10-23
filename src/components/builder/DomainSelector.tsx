"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  EDUCATIONAL_DOMAINS,
  searchEducationalDomain,
  SearchDomainResult,
  getDomainTopicSuggestions,
} from "@/lib/catalogs/domainCatalog";

interface DomainSelectorProps {
  selectedDomainId: string;
  selectedSubject: string;
  topics: string[];
  onDomainChange: (domainId: string, domainName: string) => void;
  onSubjectChange: (subject: string) => void;
  onTopicsChange: (topics: string[]) => void;
}

const RECENT_TOPICS_KEY = "pencill_recent_topics";

export default function DomainSelector({
  selectedDomainId,
  selectedSubject,
  topics,
  onDomainChange,
  onSubjectChange,
  onTopicsChange,
}: DomainSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchDomainResult[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCustomSubjectMode, setIsCustomSubjectMode] = useState(false);
  const [customSubjectText, setCustomSubjectText] = useState("");
  const [editingTopicIndex, setEditingTopicIndex] = useState<number | null>(null);
  const [recentTopics, setRecentTopics] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentDomain = EDUCATIONAL_DOMAINS.find((d) => d.id === selectedDomainId) || EDUCATIONAL_DOMAINS[0];

  // Load recent topics from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(RECENT_TOPICS_KEY);
        if (stored) {
          setRecentTopics(JSON.parse(stored).slice(0, 6));
        } else {
          setRecentTopics([
            "Class 12 Physics: Electromagnetism",
            "Python Foundations & Algorithms",
            "Organic Chemistry: Haloalkanes",
            "Machine Learning: Transformers",
            "Macroeconomics & Fiscal Policy",
          ]);
        }
      } catch {}
    }
  }, []);

  // Save topic to recents
  const saveToRecents = (topicName: string) => {
    if (typeof window === "undefined" || !topicName) return;
    try {
      const updated = [topicName, ...recentTopics.filter((t) => t !== topicName)].slice(0, 8);
      setRecentTopics(updated);
      localStorage.setItem(RECENT_TOPICS_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Perform search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }

    const results = searchEducationalDomain(searchQuery, 8);
    setSearchResults(results);
    setIsDropdownOpen(true);
  }, [searchQuery]);

  // Handle outside click to close search dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSearchResult = (result: SearchDomainResult) => {
    onDomainChange(result.domainId, result.domainName);
    if (result.subjectName) {
      onSubjectChange(result.subjectName);
    }
    const topicToAdd = result.subtopicName || result.topicName || result.subjectName;
    if (topicToAdd && !topics.includes(topicToAdd)) {
      onTopicsChange([...topics, topicToAdd]);
      saveToRecents(topicToAdd);
    }
    setSearchQuery("");
    setIsDropdownOpen(false);
  };

  const handleAddCustomTopic = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customInput.trim();
    if (!clean) return;

    if (editingTopicIndex !== null) {
      // Update existing topic
      const updated = [...topics];
      updated[editingTopicIndex] = clean;
      onTopicsChange(updated);
      setEditingTopicIndex(null);
    } else {
      if (!topics.includes(clean)) {
        onTopicsChange([...topics, clean]);
        saveToRecents(clean);
      }
    }
    setCustomInput("");
  };

  const handleEditTopic = (index: number) => {
    setCustomInput(topics[index]);
    setEditingTopicIndex(index);
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    onTopicsChange(topics.filter((t) => t !== topicToRemove));
    if (editingTopicIndex !== null && topics[editingTopicIndex] === topicToRemove) {
      setEditingTopicIndex(null);
      setCustomInput("");
    }
  };

  const handleAddSuggestedTopic = (topic: string) => {
    if (!topics.includes(topic)) {
      onTopicsChange([...topics, topic]);
      saveToRecents(topic);
    }
  };

  const handleSaveCustomSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSubjectText.trim()) return;
    onSubjectChange(customSubjectText.trim());
    setIsCustomSubjectMode(false);
  };

  const suggestedTopics = getDomainTopicSuggestions(selectedDomainId);

  // Available subjects for current domain's disciplines
  const allDomainSubjects = currentDomain.disciplines.flatMap((disc) =>
    disc.subjects.map((sub) => ({ discipline: disc.name, subject: sub.name, id: sub.id }))
  );

  return (
    <div className="flex flex-col gap-space-md">
      {/* Step Header */}
      <div className="flex items-center justify-between">
        <label className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs font-sans">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
            1
          </span>
          Educational Domain, Subject &amp; Topics
        </label>
        <span className="font-label-sm text-label-sm text-secondary font-medium">Universal Taxonomy</span>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant -mt-2">
        Choose from standard academic domains or type any specialized topic, custom subject, or curriculum.
      </p>

      {/* Domain Quick-Select Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
        {EDUCATIONAL_DOMAINS.map((domain) => {
          const isSelected = domain.id === selectedDomainId;
          return (
            <button
              key={domain.id}
              type="button"
              onClick={() => {
                onDomainChange(domain.id, domain.name);
                const firstSub = domain.disciplines[0]?.subjects[0]?.name;
                if (firstSub && !selectedSubject) {
                  onSubjectChange(firstSub);
                }
              }}
              className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                isSelected
                  ? "bg-primary-container text-on-primary border-primary-container shadow-xs"
                  : "bg-surface-container-low hover:bg-surface-container text-on-surface border-surface-container-high/50"
              }`}
            >
              <span
                className={`material-symbols-outlined text-lg shrink-0 ${
                  isSelected ? "text-secondary-fixed" : "text-primary/80"
                }`}
              >
                {domain.icon}
              </span>
              <span className="font-label-sm text-label-sm font-semibold truncate leading-tight">
                {domain.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cascading Subject & Discipline Bar */}
      <div className="p-3 bg-surface-container-low/70 rounded-lg border border-surface-container-high/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-on-surface-variant shrink-0">Active Subject:</span>
          {isCustomSubjectMode ? (
            <form onSubmit={handleSaveCustomSubject} className="flex items-center gap-1.5 flex-1">
              <input
                type="text"
                value={customSubjectText}
                onChange={(e) => setCustomSubjectText(e.target.value)}
                placeholder="Type unlisted subject name..."
                className="bg-surface-container-lowest px-2.5 py-1 rounded text-xs text-on-surface border border-surface-container-high w-full"
                autoFocus
              />
              <button
                type="submit"
                className="px-2 py-1 bg-primary text-on-primary text-xs rounded font-semibold shrink-0"
              >
                Set
              </button>
              <button
                type="button"
                onClick={() => setIsCustomSubjectMode(false)}
                className="text-xs text-on-surface-variant hover:text-on-surface px-1"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedSubject}
                onChange={(e) => onSubjectChange(e.target.value)}
                className="bg-surface-container-lowest text-xs text-on-surface px-2.5 py-1 rounded border border-surface-container-high font-medium"
              >
                {allDomainSubjects.map((sub) => (
                  <option key={`${sub.discipline}-${sub.id}`} value={sub.subject}>
                    {sub.discipline} → {sub.subject}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setCustomSubjectText(selectedSubject);
                  setIsCustomSubjectMode(true);
                }}
                className="text-[11px] text-primary hover:underline font-semibold"
              >
                + Custom Subject
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Across All Catalogs */}
      <div className="relative mt-1" ref={dropdownRef}>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-on-surface-variant text-lg">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim().length > 0) setIsDropdownOpen(true);
            }}
            placeholder="Search disciplines, subjects, or subtopics (e.g. Electrodynamics, Machine Learning, Organic Chemistry)..."
            className="w-full bg-surface-container-low pl-10 pr-4 py-3 rounded-lg text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] border border-surface-container-high/40 transition-all placeholder:text-on-surface-variant/70"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setIsDropdownOpen(false);
              }}
              className="absolute right-3 top-3 text-on-surface-variant hover:text-primary p-0.5 rounded-full"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isDropdownOpen && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-lowest rounded-xl shadow-lg border border-surface-container-high overflow-hidden z-30 max-h-72 overflow-y-auto">
            <div className="px-3 py-1.5 bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm border-b border-surface-container-high flex items-center justify-between">
              <span>Matching Catalog Items</span>
              <span className="font-mono text-[10px]">{searchResults.length} found</span>
            </div>
            {searchResults.map((item, idx) => (
              <button
                key={`${item.domainId}-${item.displayName}-${idx}`}
                type="button"
                onClick={() => handleSelectSearchResult(item)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-surface-container-low border-b border-surface-container-high/30 last:border-b-0 flex items-center justify-between group transition-colors"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="font-label-md text-label-md text-on-surface font-medium group-hover:text-primary truncate">
                    {item.topicName || item.subtopicName || item.subjectName || item.displayName}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                    {item.domainName} {item.subjectName && `· ${item.subjectName}`}
                  </span>
                </div>
                <span className="material-symbols-outlined text-sm text-secondary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  add_circle
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Topics Chips */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
            Selected Topics / Learning Targets ({topics.length}):
          </span>
          {topics.length > 0 && (
            <button
              type="button"
              onClick={() => onTopicsChange([])}
              className="text-[11px] font-label-sm text-error hover:underline"
            >
              Clear All
            </button>
          )}
        </div>

        {topics.length === 0 ? (
          <div className="p-3 rounded-lg bg-surface-container-low border border-dashed border-surface-container-high/70 text-on-surface-variant font-body-sm text-body-sm text-center">
            No specific topics selected yet. Add custom concepts below or click a suggested topic.
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-surface-container-low/70 border border-surface-container-high/40 min-h-[46px] items-center">
            {topics.map((t, idx) => (
              <span
                key={`${t}-${idx}`}
                className="inline-flex items-center gap-1.5 bg-surface-container-lowest text-primary px-3 py-1 rounded-full font-label-md text-label-md font-medium border border-surface-container-high shadow-2xs group"
              >
                <span>{t}</span>
                <button
                  type="button"
                  onClick={() => handleEditTopic(idx)}
                  className="text-on-surface-variant hover:text-primary rounded-full p-0.5 transition-colors"
                  title={`Edit "${t}"`}
                >
                  <span className="material-symbols-outlined text-xs">edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveTopic(t)}
                  className="text-on-surface-variant hover:text-error rounded-full p-0.5 transition-colors"
                  title={`Remove "${t}"`}
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Custom Topic Input with Edit state */}
      <form onSubmit={handleAddCustomTopic} className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder={
            editingTopicIndex !== null
              ? `Editing topic #${editingTopicIndex + 1}...`
              : "Add custom topic or learning objective (e.g. Quantum Error Correction, Rotational Dynamics)..."
          }
          className="flex-1 bg-surface-container-low px-3.5 py-2 rounded-lg text-on-surface font-body-sm text-body-sm focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary border border-surface-container-high/40 transition-all placeholder:text-on-surface-variant/70"
        />
        <button
          type="submit"
          disabled={!customInput.trim()}
          className="bg-primary hover:bg-primary-container disabled:opacity-40 text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md font-semibold flex items-center gap-1 transition-all shadow-2xs"
        >
          <span className="material-symbols-outlined text-sm">
            {editingTopicIndex !== null ? "done" : "add"}
          </span>
          <span>{editingTopicIndex !== null ? "Update" : "Add"}</span>
        </button>
        {editingTopicIndex !== null && (
          <button
            type="button"
            onClick={() => {
              setEditingTopicIndex(null);
              setCustomInput("");
            }}
            className="px-2 py-2 text-xs text-on-surface-variant hover:text-on-surface"
          >
            Cancel
          </button>
        )}
      </form>

      {/* Recent & Frequently Used Topics */}
      {recentTopics.length > 0 && (
        <div className="flex flex-col gap-1 pt-1">
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-xs text-secondary">history</span>
            <span className="font-label-sm text-xs font-semibold">
              Recent &amp; Frequently Explored:
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recentTopics.map((rec) => (
              <button
                key={rec}
                type="button"
                onClick={() => handleAddSuggestedTopic(rec)}
                className="bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary px-2 py-0.5 rounded text-[11px] transition-colors border border-surface-container-high/40"
              >
                + {rec}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Domain-Specific Suggestions */}
      {suggestedTopics.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm text-secondary">lightbulb</span>
            <span className="font-label-sm text-label-sm font-medium">
              Popular topics in {currentDomain.name}:
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedTopics.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => handleAddSuggestedTopic(sub)}
                className="bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary px-2.5 py-1 rounded-md font-label-sm text-label-sm transition-colors flex items-center gap-1 border border-surface-container-high/40"
              >
                <span>+</span>
                <span>{sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
