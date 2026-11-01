"use client";

import React, { useState, useEffect, useRef } from "react";
import taxonomyData from "@/data/taxonomy.json";
import { storageAdapter, StorageRecentItem } from "@/lib/storage/storageAdapter";
import { useBuilderStore } from "@/lib/store/builderStore";
import { SelectedTopicItem } from "@/lib/types/builderConfig";

export default function DomainSelector() {
  const {
    config,
    updateConfig,
    setTitle,
    addTopic,
    removeTopic,
    renameTopic,
    clearTopics,
  } = useBuilderStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{
      id: string;
      label: string;
      domainId: string;
      domainName: string;
      subjectName: string;
      synonyms: string[];
      complexity: number;
      prereqs: string[];
    }>
  >([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchHighlightIndex, setSearchHighlightIndex] = useState(0);

  // Custom topic input & feedback
  const [customTopicInput, setCustomTopicInput] = useState("");
  const [customTopicError, setCustomTopicError] = useState<string | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingTopicText, setEditingTopicText] = useState("");

  // Custom subject input
  const [isCustomSubjectMode, setIsCustomSubjectMode] = useState(false);
  const [customSubjectText, setCustomSubjectText] = useState("");

  // Domain change cascade prompt
  const [domainSwitchPending, setDomainSwitchPending] = useState<string | null>(null);

  // Recent topics
  const [recentTopics, setRecentTopics] = useState<StorageRecentItem[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Active domain lookup
  const currentDomain =
    taxonomyData.domains.find((d) => d.id === config.domainId) || taxonomyData.domains[0];

  // Load recents from storage on mount
  useEffect(() => {
    storageAdapter.getRecents().then((list) => {
      if (list.length > 0) {
        setRecentTopics(list);
      } else {
        // Seed helpful initial recents
        const seed: StorageRecentItem[] = [
          { id: "r1", type: "topic", label: "Class 11 Mechanics & Rotational Dynamics", domainId: "school-education", timestamp: new Date().toISOString() },
          { id: "r2", type: "topic", label: "Electrostatics & Current Electricity", domainId: "school-education", timestamp: new Date().toISOString() },
          { id: "r3", type: "topic", label: "Differential Calculus & Vectors", domainId: "science-mathematics", timestamp: new Date().toISOString() },
          { id: "r4", type: "topic", label: "Data Structures & Algorithmic Complexity", domainId: "engineering-technology", timestamp: new Date().toISOString() },
        ];
        setRecentTopics(seed);
      }
    });
  }, []);

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

  // Search logic over taxonomy names and synonyms
  useEffect(() => {
    const clean = searchQuery.trim().toLowerCase();
    if (!clean) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }

    const matches: Array<{
      id: string;
      label: string;
      domainId: string;
      domainName: string;
      subjectName: string;
      synonyms: string[];
      complexity: number;
      prereqs: string[];
    }> = [];

    for (const d of taxonomyData.domains) {
      for (const cat of d.categories) {
        for (const sub of cat.subjects) {
          for (const top of sub.topics) {
            const matchName = top.label.toLowerCase().includes(clean);
            const matchSyn = top.synonyms.some((s) => s.toLowerCase().includes(clean));
            const matchSub = sub.label.toLowerCase().includes(clean);

            if (matchName || matchSyn || matchSub) {
              matches.push({
                id: top.id,
                label: top.label,
                domainId: d.id,
                domainName: d.label,
                subjectName: sub.label,
                synonyms: top.synonyms,
                complexity: top.complexity,
                prereqs: top.prereqs,
              });
            }
            if (matches.length >= 10) break;
          }
        }
      }
    }

    setSearchResults(matches);
    setSearchHighlightIndex(0);
    setIsDropdownOpen(true);
  }, [searchQuery]);

  // Handle Domain Selection
  const handleDomainTileClick = (newDomainId: string) => {
    if (newDomainId === config.domainId) return;

    // Check if topics are currently selected
    if (config.selectedTopics.length > 0) {
      setDomainSwitchPending(newDomainId);
    } else {
      executeDomainSwitch(newDomainId, true);
    }
  };

  const executeDomainSwitch = (newDomainId: string, clearExistingTopics: boolean) => {
    const targetDomain = taxonomyData.domains.find((d) => d.id === newDomainId) || taxonomyData.domains[0];
    const firstSubject = targetDomain.categories[0]?.subjects[0]?.label || "General";

    updateConfig((prev) => ({
      ...prev,
      domainId: newDomainId,
      subjectId: firstSubject,
      selectedTopics: clearExistingTopics ? [] : prev.selectedTopics,
    }));

    setDomainSwitchPending(null);
    setCustomTopicError(null);
  };

  // Add custom subject
  const handleSaveCustomSubject = async () => {
    const clean = customSubjectText.trim();
    if (!clean) return;

    await storageAdapter.saveCustomTaxonomyNode({
      id: `custom-sub-${Date.now()}`,
      domainId: config.domainId,
      type: "subject",
      name: clean,
    });

    updateConfig((prev) => ({
      ...prev,
      subjectId: clean,
    }));

    setIsCustomSubjectMode(false);
    setCustomSubjectText("");
  };

  // Add custom topic
  const handleAddCustomTopic = () => {
    const raw = customTopicInput;
    const clean = raw.trim();

    if (!clean) {
      setCustomTopicError("Please enter a topic name.");
      return;
    }

    if (clean.length < 3) {
      setCustomTopicError("Topic must be at least 3 characters long.");
      return;
    }

    const res = addTopic({
      label: clean,
      source: "custom",
      complexity: 3,
    });

    if (res.added) {
      setCustomTopicInput("");
      setCustomTopicError(null);
    } else {
      setCustomTopicError(res.reason || "Topic could not be added.");
    }
  };

  // Keyboard navigation for search dropdown
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSearchHighlightIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSearchHighlightIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (searchResults.length > 0 && searchResults[searchHighlightIndex]) {
        const item = searchResults[searchHighlightIndex];
        const res = addTopic({
          id: item.id,
          label: item.label,
          source: "taxonomy",
          complexity: item.complexity,
          prereqs: item.prereqs,
        });
        if (res.added) {
          setSearchQuery("");
          setIsDropdownOpen(false);
          setCustomTopicError(null);
        } else {
          setCustomTopicError(res.reason || "Topic could not be added.");
        }
      } else if (searchQuery.trim().length >= 3) {
        const res = addTopic({
          label: searchQuery.trim(),
          source: "custom",
          complexity: 3,
        });
        if (res.added) {
          setSearchQuery("");
          setIsDropdownOpen(false);
          setCustomTopicError(null);
        } else {
          setCustomTopicError(res.reason || "Topic could not be added.");
        }
      }
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
    }
  };

  // Clear all topics with confirmation if > 2
  const handleClearAll = () => {
    if (config.selectedTopics.length > 2) {
      if (window.confirm(`Clear all ${config.selectedTopics.length} selected topics?`)) {
        clearTopics();
        setCustomTopicError(null);
      }
    } else {
      clearTopics();
      setCustomTopicError(null);
    }
  };

  // Subjects for dropdown
  const availableSubjects = currentDomain.categories.flatMap((cat) =>
    cat.subjects.map((sub) => ({
      categoryLabel: cat.label,
      subjectLabel: sub.label,
      id: sub.id,
    }))
  );

  // Popular topics for current domain
  const popularTopicsInDomain = currentDomain.popularTopics || [];

  return (
    <div className="flex flex-col gap-space-md">
      {/* Header & Learning Path Title */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs font-sans">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
              1
            </span>
            Educational Domain, Subject &amp; Topics
          </label>
          <span className="font-label-sm text-label-sm text-secondary font-medium">Step 1 of 8</span>
        </div>

        {/* Title Input */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-primary">title</span>
            <span>Learning Path Title</span>
          </label>
          <input
            type="text"
            value={config.title || ""}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Class 11 Mechanics & Rotational Dynamics"
            className="w-full bg-surface-container-low px-3 py-2 rounded-lg text-body-sm text-on-surface font-semibold border border-surface-container-high/60 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest transition-all"
          />
        </div>
      </div>

      {/* Domain Switch Confirmation Banner if pending */}
      {domainSwitchPending && (
        <div className="p-3 bg-secondary-container/40 border border-secondary/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-base">swap_horiz</span>
            <span>
              You have {config.selectedTopics.length} topic(s) selected in {currentDomain.label}. Switch domain and:
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => executeDomainSwitch(domainSwitchPending, false)}
              className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high rounded text-on-surface font-semibold"
            >
              Keep Topics
            </button>
            <button
              type="button"
              onClick={() => executeDomainSwitch(domainSwitchPending, true)}
              className="px-2.5 py-1 bg-primary text-on-primary rounded font-semibold"
            >
              Clear &amp; Switch
            </button>
            <button
              type="button"
              onClick={() => setDomainSwitchPending(null)}
              className="text-on-surface-variant hover:text-on-surface px-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 12 Domain Tiles (Single-Select Radio Group) */}
      <div
        role="radiogroup"
        aria-label="Educational Domain"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1"
      >
        {taxonomyData.domains.map((dom) => {
          const isSelected = dom.id === config.domainId;
          return (
            <button
              key={dom.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleDomainTileClick(dom.id)}
              className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                isSelected
                  ? "bg-primary-container text-on-primary border-primary-container shadow-xs ring-1 ring-primary-container"
                  : "bg-surface-container-low hover:bg-surface-container text-on-surface border-surface-container-high/50"
              }`}
            >
              <span
                className={`material-symbols-outlined text-lg shrink-0 ${
                  isSelected ? "text-secondary-fixed" : "text-primary/80"
                }`}
              >
                {dom.icon}
              </span>
              <span className="font-label-sm text-label-sm font-semibold truncate leading-tight">
                {dom.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Subject Selector & Custom Subject Trigger */}
      <div className="p-3 bg-surface-container-low/70 rounded-lg border border-surface-container-high/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-xs font-semibold text-on-surface-variant shrink-0">Active Subject:</span>
          {isCustomSubjectMode ? (
            <div className="flex items-center gap-1.5 flex-1">
              <input
                type="text"
                value={customSubjectText}
                onChange={(e) => setCustomSubjectText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveCustomSubject();
                  } else if (e.key === "Escape") {
                    setIsCustomSubjectMode(false);
                  }
                }}
                placeholder="Type custom subject name..."
                className="bg-surface-container-lowest px-2.5 py-1 rounded text-xs text-on-surface border border-surface-container-high w-full focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveCustomSubject}
                className="px-2 py-1 bg-primary text-on-primary text-xs rounded font-semibold shrink-0 cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsCustomSubjectMode(false)}
                className="text-xs text-on-surface-variant hover:text-on-surface px-1 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={config.subjectId}
                onChange={(e) => updateConfig({ subjectId: e.target.value })}
                className="bg-surface-container-lowest text-xs text-on-surface px-2.5 py-1 rounded border border-surface-container-high font-medium max-w-[280px] truncate"
              >
                {availableSubjects.map((sub, i) => (
                  <option key={`${sub.id}-${i}`} value={sub.subjectLabel}>
                    {sub.categoryLabel} → {sub.subjectLabel}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setCustomSubjectText("");
                  setIsCustomSubjectMode(true);
                }}
                className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
              >
                + Custom Subject
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fuzzy Topic Search Box with Keyboard Navigation */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-lg pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => {
              if (searchQuery.trim().length > 0) setIsDropdownOpen(true);
            }}
            placeholder="Search disciplines, subjects, subtopics or synonyms (e.g. Electrodynamics, Machine Learning)..."
            className="w-full pl-10 pr-10 py-3 bg-surface-container-low rounded-lg text-on-surface font-body-sm text-body-sm focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setIsDropdownOpen(false);
              }}
              className="absolute right-3 text-on-surface-variant hover:text-on-surface p-1"
              aria-label="Clear search input"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container-high z-40 max-h-64 overflow-y-auto divide-y divide-surface-container-high/40">
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-xs text-on-surface-variant">
                <span>No match for &quot;{searchQuery}&quot;.</span>
                {searchQuery.trim().length >= 3 && (
                  <button
                    type="button"
                    onClick={() => {
                      const res = addTopic({ label: searchQuery.trim(), source: "custom", complexity: 3 });
                      if (res.added) {
                        setSearchQuery("");
                        setIsDropdownOpen(false);
                        setCustomTopicError(null);
                      } else {
                        setCustomTopicError(res.reason || "Topic could not be added.");
                      }
                    }}
                    className="block mx-auto mt-2 text-primary font-semibold hover:underline cursor-pointer"
                  >
                    + Add &quot;{searchQuery}&quot; as custom topic
                  </button>
                )}
              </div>
            ) : (
              searchResults.map((item, idx) => {
                const isHighlighted = idx === searchHighlightIndex;
                const isAlreadySelected = config.selectedTopics.some(
                  (t) => t.label.toLowerCase() === item.label.toLowerCase()
                );
                return (
                  <div
                    key={`${item.id}-${idx}`}
                    onMouseEnter={() => setSearchHighlightIndex(idx)}
                    onClick={() => {
                      if (!isAlreadySelected) {
                        const res = addTopic({
                          id: item.id,
                          label: item.label,
                          source: "taxonomy",
                          complexity: item.complexity,
                          prereqs: item.prereqs,
                        });
                        if (res.added) {
                          setSearchQuery("");
                          setIsDropdownOpen(false);
                          setCustomTopicError(null);
                        } else {
                          setCustomTopicError(res.reason || "Topic could not be added.");
                        }
                      } else {
                        setSearchQuery("");
                        setIsDropdownOpen(false);
                      }
                    }}
                    className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                      isHighlighted ? "bg-surface-container" : "hover:bg-surface-container-low"
                    } ${isAlreadySelected ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-semibold text-xs text-on-surface truncate">
                        {item.label}
                      </span>
                      <span className="text-[11px] text-on-surface-variant truncate">
                        {item.domainName} · {item.subjectName}
                      </span>
                    </div>
                    <span className="font-label-sm text-[10px] text-secondary shrink-0 font-medium">
                      {isAlreadySelected ? "Selected" : "+ Add"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Selected Topics Tray */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
            <span>Selected Learning Topics</span>
            <span className="font-mono text-secondary font-bold">
              ({config.selectedTopics.length}/8)
            </span>
          </span>
          {config.selectedTopics.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-error hover:underline font-medium cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        {config.selectedTopics.length === 0 ? (
          <div className="p-3 bg-surface-container-low rounded-lg border border-dashed border-surface-container-high text-center text-xs text-on-surface-variant">
            No topics selected. Select from popular topics below, search, or add a custom concept. (Minimum 1 topic required to build).
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {config.selectedTopics.map((topic) => {
              const isEditing = editingTopicId === topic.id;
              return (
                <div
                  key={topic.id}
                  className="group flex items-center gap-1.5 bg-primary text-on-primary px-3 py-1.5 rounded-lg text-xs font-medium shadow-xs"
                >
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingTopicText}
                      onChange={(e) => setEditingTopicText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          renameTopic(topic.id, editingTopicText);
                          setEditingTopicId(null);
                        } else if (e.key === "Escape") {
                          setEditingTopicId(null);
                        }
                      }}
                      onBlur={() => {
                        renameTopic(topic.id, editingTopicText);
                        setEditingTopicId(null);
                      }}
                      className="bg-primary-container text-on-primary px-1.5 py-0.5 rounded text-xs focus:outline-none w-32"
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => {
                        setEditingTopicId(topic.id);
                        setEditingTopicText(topic.label);
                      }}
                      className="cursor-pointer hover:underline"
                      title="Click to rename"
                    >
                      {topic.label}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      removeTopic(topic.id);
                      setCustomTopicError(null);
                    }}
                    className="text-primary-fixed-dim hover:text-white transition-colors cursor-pointer"
                    aria-label={`Remove topic ${topic.label}`}
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inline Custom Topic Input */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customTopicInput}
            onChange={(e) => {
              setCustomTopicInput(e.target.value);
              if (customTopicError) setCustomTopicError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomTopic();
              }
            }}
            placeholder="Add specialized or unlisted topic (e.g. Projectile Motion on Inclined Plane)..."
            className="flex-1 bg-surface-container-low px-3 py-2 rounded-lg text-xs text-on-surface border border-surface-container-high focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={handleAddCustomTopic}
            className="px-3 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors shadow-xs"
          >
            + Add Topic
          </button>
        </div>
        {customTopicError && (
          <p className="text-xs text-error font-medium flex items-center gap-1 animate-in fade-in duration-150">
            <span className="material-symbols-outlined text-xs">info</span>
            <span>{customTopicError}</span>
          </p>
        )}
      </div>

      {/* Popular Topics in Domain */}
      {popularTopicsInDomain.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-semibold text-on-surface-variant">
            Popular in {currentDomain.label}:
          </span>
          {popularTopicsInDomain.map((pop) => {
            const isSelected = config.selectedTopics.some(
              (t) => t.label.toLowerCase() === pop.toLowerCase()
            );
            return (
              <button
                key={pop}
                type="button"
                disabled={isSelected}
                onClick={() => {
                  const res = addTopic({ label: pop, source: "popular" });
                  if (res.added) {
                    setCustomTopicError(null);
                  } else {
                    setCustomTopicError(res.reason || "Topic could not be added.");
                  }
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-surface-container-high text-on-surface-variant opacity-60 cursor-not-allowed"
                    : "bg-surface-container hover:bg-surface-container-high text-primary"
                }`}
              >
                {isSelected ? `✓ ${pop}` : `+ ${pop}`}
              </button>
            );
          })}
        </div>
      )}

      {/* Recent & Frequently Explored Topics */}
      {recentTopics.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-semibold text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">history</span>
            Recent &amp; Frequently Explored:
          </span>
          {recentTopics.slice(0, 4).map((rec) => {
            const isSelected = config.selectedTopics.some(
              (t) => t.label.toLowerCase() === rec.label.toLowerCase()
            );
            return (
              <button
                key={rec.id}
                type="button"
                disabled={isSelected}
                onClick={() => {
                  const res = addTopic({ label: rec.label, source: "recent" });
                  if (res.added) {
                    setCustomTopicError(null);
                  } else {
                    setCustomTopicError(res.reason || "Topic could not be added.");
                  }
                }}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-surface-container-high text-on-surface-variant opacity-50 cursor-not-allowed"
                    : "bg-surface-container-low hover:bg-surface-container text-on-surface"
                }`}
              >
                {rec.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
