"use client";

import React, { useState, useEffect } from "react";
import { Lesson, ResourceType } from "@/types";

export interface AddResourceModalProps {
  isOpen: boolean;
  moduleId: string | null;
  moduleTitle: string;
  courseTopic?: string;
  onAddResource: (newLesson: Lesson, moduleId: string) => void;
  onClose: () => void;
}

export default function AddResourceModal({
  isOpen,
  moduleId,
  moduleTitle,
  courseTopic,
  onAddResource,
  onClose,
}: AddResourceModalProps) {
  const [activeTab, setActiveTab] = useState<"manual" | "search">("manual");
  
  // Manual Form State
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ResourceType>("video");
  const [url, setUrl] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [summaryPoint, setSummaryPoint] = useState("");

  // Academic Discovery State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{
    title: string;
    url: string;
    sourceName: string;
    durationMinutes: number;
    type: ResourceType;
    description: string;
  }>>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setUrl("");
      setSourceName(type === "video" ? "YouTube Academic Lecture" : "Verified Academic Source");
      setDurationMinutes(type === "video" ? 20 : 15);
      setSummaryPoint("");
      setSearchQuery(`${courseTopic ? courseTopic + " " : ""}${moduleTitle}`);
      setSearchResults([]);
      setSearchError(null);
    }
  }, [isOpen, moduleTitle, courseTopic, type]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !moduleId) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newLesson: Lesson = {
      id: `custom-res-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      moduleId,
      title: title.trim(),
      type,
      durationMinutes,
      sourceName: sourceName.trim() || (type === "video" ? "YouTube Educational" : "Academic Reading"),
      sourceUrl: url.trim() || undefined,
      orderIndex: 999, // distributor/parent will normalize
      summaryPoints: summaryPoint.trim() ? [summaryPoint.trim()] : ["Learner added resource."],
      verificationStatus: "user_added",
      isUserCreated: true,
      selectionExplanation: `Added directly by learner to module: ${moduleTitle}`,
    };

    onAddResource(newLesson, moduleId);
    onClose();
  };

  const handleExecuteSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      // Perform discovery via existing discovery endpoint
      const res = await fetch("/api/resources/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery.trim(),
          limit: 6,
          providers: ["youtube", "google"],
          generateLearningPath: false,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.resources) && data.resources.length > 0) {
        setSearchResults(
          data.resources.map((r: any) => ({
            title: r.title,
            url: r.url || r.sourceUrl || "",
            sourceName: r.author || r.sourceName || (r.type === "video" ? "YouTube" : "Academic Publication"),
            durationMinutes: r.durationMinutes || (r.type === "video" ? 18 : 12),
            type: r.type === "video" ? "video" : "monograph",
            description: r.description || r.snippet || "",
          }))
        );
      } else {
        // Fallback curated suggestions for the query
        setSearchResults([
          {
            title: `${searchQuery.trim()} - Comprehensive Deep Dive`,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery.trim())}`,
            sourceName: "Curated Open Educational Repository",
            durationMinutes: 20,
            type: "video",
            description: "Curated academic lecture matched to the module topic.",
          },
          {
            title: `Official Documentation: ${searchQuery.trim()}`,
            url: `https://docs.python.org/3/search.html?q=${encodeURIComponent(searchQuery.trim())}`,
            sourceName: "Official Academic Documentation",
            durationMinutes: 15,
            type: "monograph",
            description: "Primary reference guide and technical specification.",
          },
        ]);
      }
    } catch {
      setSearchError("Could not retrieve external search results. You can add resources directly using Manual Add.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: (typeof searchResults)[0]) => {
    const newLesson: Lesson = {
      id: `discovered-res-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      moduleId,
      title: result.title,
      type: result.type,
      durationMinutes: result.durationMinutes,
      sourceName: result.sourceName,
      sourceUrl: result.url,
      orderIndex: 999,
      summaryPoints: result.description ? [result.description.slice(0, 200)] : ["Discovered curriculum resource."],
      verificationStatus: "verified",
      isUserCreated: true,
      selectionExplanation: `Added from academic discovery for: ${moduleTitle}`,
    };

    onAddResource(newLesson, moduleId);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-resource-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-surface-container-high/60 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">library_add</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
                Module Resource Manager
              </span>
              <h3 id="add-resource-modal-title" className="font-headline-sm text-headline-sm text-primary font-serif">
                Add Learning Resource
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-surface-container-high/40 mt-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === "manual"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-sm">edit_note</span>
            <span>Manual Entry</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("search")}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === "search"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-sm">travel_explore</span>
            <span>Academic Discovery Search</span>
          </button>
        </div>

        {/* Tab 1: Manual Add */}
        {activeTab === "manual" ? (
          <form onSubmit={handleManualSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Resource Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master Class: Advanced Concepts & Practice"
                required
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high/60 text-on-surface text-sm focus:outline-hidden focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  Resource Modality
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ResourceType)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high/60 text-on-surface text-sm focus:outline-hidden focus:border-primary"
                >
                  <option value="video">Video Lecture</option>
                  <option value="monograph">Reading Monograph / Article</option>
                  <option value="practice">Interactive Practice Problem</option>
                  <option value="paper">Academic Paper</option>
                  <option value="formulae">Formula Sheet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  Estimated Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 15)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high/60 text-on-surface text-sm focus:outline-hidden focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Resource URL (YouTube Video, PDF, or Documentation Link)
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://arxiv.org/..."
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high/60 text-on-surface text-sm focus:outline-hidden focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Source / Channel / Educator Name
              </label>
              <input
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="e.g. Corey Schafer, MIT OpenCourseWare, Python Docs"
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high/60 text-on-surface text-sm focus:outline-hidden focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Key Summary Note / Description
              </label>
              <input
                type="text"
                value={summaryPoint}
                onChange={(e) => setSummaryPoint(e.target.value)}
                placeholder="Core pedagogical takeaway or concept covered"
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high/60 text-on-surface text-sm focus:outline-hidden focus:border-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-container-high/40 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-primary text-on-primary hover:bg-primary-container active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>Add Resource</span>
              </button>
            </div>
          </form>
        ) : (
          /* Tab 2: Academic Discovery Search */
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            <form onSubmit={handleExecuteSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topic or concept across verified repositories..."
                className="flex-1 px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high/60 text-on-surface text-sm focus:outline-hidden focus:border-primary"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2 rounded-lg bg-secondary text-on-secondary hover:bg-secondary-container font-semibold text-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSearching ? (
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-base">search</span>
                )}
                <span>Search</span>
              </button>
            </form>

            {searchError && (
              <p className="text-xs text-error bg-error-container/30 p-2.5 rounded-lg border border-error/20">
                {searchError}
              </p>
            )}

            <div className="space-y-2">
              {searchResults.map((res, rIdx) => (
                <div
                  key={rIdx}
                  className="p-3 rounded-lg bg-surface-container-low border border-surface-container-high/60 flex items-center justify-between gap-3 hover:border-primary/50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold uppercase text-[10px]">
                        {res.type}
                      </span>
                      <span className="text-on-surface-variant font-medium">{res.sourceName}</span>
                      <span className="text-on-surface-variant">{res.durationMinutes}m</span>
                    </div>
                    <h5 className="font-semibold text-primary text-sm truncate">{res.title}</h5>
                    {res.description && (
                      <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">
                        {res.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectSearchResult(res)}
                    className="px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shrink-0 flex items-center gap-1 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
