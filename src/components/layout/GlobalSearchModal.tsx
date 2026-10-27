"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import taxonomyData from "@/data/taxonomy.json";
import { storageAdapter } from "@/lib/storage/storageAdapter";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  category: "Topics" | "Courses" | "Notes" | "Resources";
  subtitle: string;
  actionUrl: string;
  badge?: string;
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<SearchItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global Ctrl/Cmd + K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or custom event
          const event = new CustomEvent("open-global-search");
          window.dispatchEvent(event);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Search logic across taxonomy, courses, notes, resources
  useEffect(() => {
    let isMounted = true;
    const clean = query.trim().toLowerCase();

    const fetchResults = async () => {
      const items: SearchItem[] = [];

      // 1. Search taxonomy topics
      for (const domain of taxonomyData.domains) {
        for (const cat of domain.categories) {
          for (const sub of cat.subjects) {
            for (const topic of sub.topics) {
              if (
                !clean ||
                topic.label.toLowerCase().includes(clean) ||
                topic.synonyms.some((s) => s.toLowerCase().includes(clean)) ||
                sub.label.toLowerCase().includes(clean)
              ) {
                items.push({
                  id: `topic-${topic.id}`,
                  title: topic.label,
                  category: "Topics",
                  subtitle: `${domain.label} · ${sub.label}`,
                  actionUrl: `/new-goal?topic=${encodeURIComponent(topic.label)}&domain=${domain.id}`,
                  badge: topic.popular ? "Popular" : undefined,
                });
              }
              if (items.filter((i) => i.category === "Topics").length >= 5) break;
            }
          }
        }
      }

      // 2. Search saved / existing courses
      const savedPaths = await storageAdapter.getSavedPaths();
      for (const path of savedPaths) {
        if (!clean || path.title?.toLowerCase().includes(clean) || path.subject?.toLowerCase().includes(clean)) {
          items.push({
            id: `course-${path.id}`,
            title: path.title || "Curriculum Track",
            category: "Courses",
            subtitle: `${path.modules?.length || 4} Modules · ${path.depthLevel || "Standard"}`,
            actionUrl: `/courses/${path.id}`,
            badge: "Active",
          });
        }
        if (items.filter((i) => i.category === "Courses").length >= 4) break;
      }

      // 3. Search curated notes
      const notes = [
        {
          id: "note-1",
          title: "Newton's Laws of Motion & Friction Handouts",
          subtitle: "Class 11 Physics · Theory Monograph",
          actionUrl: "/new-goal?topic=Class+11+Mechanics",
        },
        {
          id: "note-2",
          title: "Differential Calculus & Rate of Change Reference",
          subtitle: "Mathematics · Fundamental Derivations",
          actionUrl: "/new-goal?topic=Differential+Calculus",
        },
      ];
      for (const note of notes) {
        if (!clean || note.title.toLowerCase().includes(clean)) {
          items.push({
            ...note,
            category: "Notes",
          });
        }
      }

      // 4. Resources
      const resources = [
        {
          id: "res-1",
          title: "NPTEL: Classical Mechanics Video Series",
          subtitle: "Prof. Walter Lewin / IIT Faculty · Verified",
          actionUrl: "/explore?q=Mechanics",
          badge: "NPTEL",
        },
        {
          id: "res-2",
          title: "NCERT Class 11 Physics Part 1 Textbook Extract",
          subtitle: "National Council of Educational Research · PDF Extract",
          actionUrl: "/explore?q=NCERT",
          badge: "NCERT",
        },
      ];
      for (const res of resources) {
        if (!clean || res.title.toLowerCase().includes(clean)) {
          items.push({
            ...res,
            category: "Resources",
          });
        }
      }

      if (isMounted) {
        setResults(items);
        setSelectedIndex(0);
      }
    };

    fetchResults();

    return () => {
      isMounted = false;
    };
  }, [query]);

  // Arrow key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const handleSelect = (item: SearchItem) => {
    onClose();
    router.push(item.actionUrl);
  };

  if (!isOpen) return null;

  // Group items by category
  const categories: Array<"Topics" | "Courses" | "Notes" | "Resources"> = ["Topics", "Courses", "Notes", "Resources"];

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-surface-container-high bg-surface-container-low/40">
          <span className="material-symbols-outlined text-primary text-xl">search</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics, courses, notes, and academic repositories..."
            className="flex-1 bg-transparent text-on-surface font-body-md text-body-md placeholder:text-on-surface-variant focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono font-semibold bg-surface-container text-on-surface-variant rounded border border-surface-container-high">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-4">
          {results.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant text-sm flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-3xl opacity-40">search_off</span>
              <span>No matching academic topics or resources found for &quot;{query}&quot;.</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push(`/new-goal?topic=${encodeURIComponent(query)}`);
                }}
                className="mt-2 text-primary font-semibold hover:underline"
              >
                + Add &quot;{query}&quot; as custom topic in Builder
              </button>
            </div>
          ) : (
            categories.map((cat) => {
              const catItems = results.filter((i) => i.category === cat);
              if (catItems.length === 0) return null;

              return (
                <div key={cat} className="space-y-1">
                  <div className="px-3 py-1 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {cat}
                  </div>
                  {catItems.map((item) => {
                    const globalIdx = results.indexOf(item);
                    const isSelected = globalIdx === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className={`px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-primary text-on-primary"
                            : "hover:bg-surface-container text-on-surface"
                        }`}
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm truncate">{item.title}</span>
                            {item.badge && (
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                  isSelected
                                    ? "bg-primary-container text-primary-fixed"
                                    : "bg-surface-container text-secondary font-medium"
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-xs truncate ${
                              isSelected ? "text-primary-fixed-dim" : "text-on-surface-variant"
                            }`}
                          >
                            {item.subtitle}
                          </span>
                        </div>
                        <span
                          className={`material-symbols-outlined text-sm ${
                            isSelected ? "text-on-primary" : "text-on-surface-variant opacity-60"
                          }`}
                        >
                          arrow_forward
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-surface-container-high bg-surface-container-low/50 flex items-center justify-between text-[11px] text-on-surface-variant">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-surface-container px-1 rounded">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="font-mono bg-surface-container px-1 rounded">↵</kbd> Select
            </span>
          </div>
          <span>Pencill Universal Knowledge Directory</span>
        </div>
      </div>
    </div>
  );
}
