"use client";

import { useState, useEffect } from "react";
import { Bookmark } from "@/types";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import Toast from "@/components/ui/Toast";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import {
  getUserBookmarks,
  addBookmark,
  removeBookmark,
} from "@/services/supabase/bookmarkService";
import { storageAdapter } from "@/lib/storage/storageAdapter";

export default function BookmarksPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRemoved, setLastRemoved] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadBookmarks() {
      setLoading(true);
      try {
        let remoteList: any[] = [];
        if (user?.id) {
          try {
            remoteList = await getUserBookmarks(user.id);
          } catch (e) {
            console.warn("[Bookmarks] Supabase load failed, using storageAdapter:", e);
          }
        }

        const localList = await storageAdapter.getBookmarks();
        const map = new Map<string, any>();
        remoteList.forEach((b) => map.set(b.id, b));
        localList.forEach((b) => {
          if (!map.has(b.id)) {
            map.set(b.id, {
              ...b,
              source: (b as any).sourceName || b.source || "Pencill Verified Resource",
              description: (b as any).description || "Saved learning pathway item.",
            });
          }
        });

        if (mounted) {
          setItems(Array.from(map.values()));
        }
      } catch (err) {
        console.error("Error loading bookmarks:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadBookmarks();

    return () => {
      mounted = false;
    };
  }, [user]);

  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all");

  const disciplines = Array.from(
    new Set(
      items
        .map((i) => i.discipline || i.subject || i.domain || (i.category === "video" ? "Lectures" : "General"))
        .filter(Boolean)
    )
  );

  const filteredItems = items.filter((item) => {
    const itemCat = item.category || item.type || "path";
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "path" && (itemCat === "path" || item.pathId)) ||
      (activeTab === "video" && itemCat === "video") ||
      (activeTab === "reading" && (itemCat === "monograph" || itemCat === "reading" || itemCat === "article")) ||
      (activeTab === "practice" && (itemCat === "practice" || itemCat === "quiz"));

    const itemDiscipline =
      item.discipline || item.subject || item.domain || (item.category === "video" ? "Lectures" : "General");
    const matchesDiscipline = selectedDiscipline === "all" || itemDiscipline === selectedDiscipline;

    const matchesSearch =
      !searchQuery ||
      (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.source && item.source.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesDiscipline && matchesSearch;
  });

  const countByTab = {
    all: items.length,
    path: items.filter((i) => (i.category || i.type) === "path" || i.pathId).length,
    video: items.filter((i) => (i.category || i.type) === "video").length,
    reading: items.filter((i) => ["monograph", "reading", "article"].includes(i.category || i.type)).length,
    practice: items.filter((i) => ["practice", "quiz"].includes(i.category || i.type)).length,
  };

  const handleDownloadNotes = () => {
    if (items.length === 0) return;
    const content = items
      .map(
        (it, idx) =>
          `## ${idx + 1}. ${it.title}\n- Type: ${it.category || it.type || "Resource"}\n- Source: ${it.source || it.sourceName || "Pencill"}\n- Notes: ${it.notes || it.description || "N/A"}\n- Link: ${it.sourceUrl || "N/A"}\n`
      )
      .join("\n\n");
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pencill-bookmarks-notes-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Downloaded compiled study notes.");
    setToastOpen(true);
  };

  const handleExportBibTeX = () => {
    if (items.length === 0) return;
    const bibtex = items
      .map((it, idx) => {
        const key = `pencill_${idx + 1}_${(it.title || "ref").replace(/\W+/g, "_").toLowerCase().slice(0, 16)}`;
        return `@misc{${key},\n  title = {${it.title || "Untitled"}},\n  howpublished = {${it.source || "Pencill Academic Library"}},\n  year = {${new Date().getFullYear()}},\n  note = {Archived in Pencill Personal Repository}\n}`;
      })
      .join("\n\n");
    const blob = new Blob([bibtex], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pencill-citations.bib`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Exported BibTeX citation catalog.");
    setToastOpen(true);
  };

  const handleRemove = async (item: any) => {
    setLastRemoved(item);
    setItems((prev) => prev.filter((b) => b.id !== item.id));
    setToastMessage(`Removed "${item.title}" from bookmarks.`);
    setToastOpen(true);

    await storageAdapter.removeBookmark(item.id);
    if (user?.id) {
      try {
        await removeBookmark(item.id, user.id);
      } catch {}
    }
  };

  const handleUndo = async () => {
    if (lastRemoved) {
      const restored = lastRemoved;
      setItems((prev) => [restored, ...prev]);
      setToastMessage(`Restored "${restored.title}".`);
      setLastRemoved(null);

      await storageAdapter.addBookmark(restored);
      if (user?.id) {
        try {
          await addBookmark(
            {
              title: restored.title,
              type: restored.type,
              source: restored.source,
              category: restored.category,
              description: restored.description,
              notes: restored.notes,
              pathId: restored.pathId,
              resourceId: restored.resourceId,
            },
            user.id
          );
        } catch {}
      }
    }
  };

  return (
    <AuthGuard>
      <div className="flex flex-col gap-space-xl pb-space-xl max-w-6xl mx-auto w-full">
        {/* Undo Toast */}
        <Toast
          isOpen={toastOpen}
          message={toastMessage}
          onClose={() => setToastOpen(false)}
          onUndo={lastRemoved ? handleUndo : undefined}
        />

        {/* Top Academic Breadcrumb & Meta Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm mb-space-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/40 text-on-secondary-fixed-variant font-label-sm text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span>Personal Academic Repository</span>
            </span>
            <span className="text-outline font-label-sm text-xs">/</span>
            <span className="font-label-sm text-xs text-on-surface-variant font-medium">
              {items.length} Saved {items.length === 1 ? "Resource" : "Resources"} Across Disciplines
            </span>
          </div>

          {/* Quick Archival Meta Actions */}
          <div className="flex items-center gap-space-sm">
            <button
              type="button"
              onClick={handleDownloadNotes}
              disabled={items.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-xs font-semibold hover:bg-surface-container transition-all shadow-sm border border-surface-container-high/60 disabled:opacity-50"
              title="Download compiled notes as Markdown"
            >
              <span className="material-symbols-outlined text-base text-secondary">download</span>
              <span>Download Notes</span>
            </button>
            <button
              type="button"
              onClick={handleExportBibTeX}
              disabled={items.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-xs font-semibold hover:bg-surface-container transition-all shadow-sm border border-surface-container-high/60 disabled:opacity-50"
              title="Export citations in BibTeX format"
            >
              <span className="material-symbols-outlined text-base text-primary">menu_book</span>
              <span>Export BibTeX</span>
            </button>
          </div>
        </div>

        {/* Editorial Header Section */}
        <header className="mb-space-sm">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md pb-space-sm">
            <div className="max-w-3xl">
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-serif">
                Saved Bookmarks &amp; Repository
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1.5 leading-relaxed">
                Your personal scholarly library of archived lectures, peer derivations, curriculum chapters, and synthesized problem drills.
              </p>
            </div>

            {/* Quick Repository Search Bar */}
            <div className="w-full lg:w-96">
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-lg pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter bookmarks by keyword, formula, or tag..."
                  className="w-full pl-9 pr-12 py-2.5 bg-surface-container-lowest rounded-lg font-body-sm text-xs text-on-surface placeholder:text-on-surface-variant shadow-sm border border-surface-container-high/60 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
                <kbd className="absolute right-2.5 px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono text-[10px]">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs (Editorial Paper Segmented Control) */}
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar pb-1">
          <nav className="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-xl border border-surface-container-high/60">
            {[
              { id: "all", label: "All Items", count: countByTab.all },
              { id: "path", label: "Courses & Pathways", count: countByTab.path },
              { id: "video", label: "Video Lectures", count: countByTab.video },
              { id: "reading", label: "Articles & Readings", count: countByTab.reading },
              { id: "practice", label: "Practice & Drills", count: countByTab.practice },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg font-label-md text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-surface-container-lowest text-primary shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                    activeTab === tab.id
                      ? "bg-surface-container text-primary"
                      : "bg-surface-container/60 text-on-surface-variant"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Discipline Filter Pills */}
        {disciplines.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold mr-1">
              Discipline:
            </span>
            <button
              type="button"
              onClick={() => setSelectedDiscipline("all")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                selectedDiscipline === "all"
                  ? "bg-primary-container text-on-primary shadow-xs"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              All ({items.length})
            </button>
            {disciplines.map((d) => {
              const dCount = items.filter(
                (i) => (i.discipline || i.subject || i.domain || (i.category === "video" ? "Lectures" : "General")) === d
              ).length;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDiscipline(d)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    selectedDiscipline === d
                      ? "bg-primary-container text-on-primary shadow-xs"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                >
                  {d} ({dCount})
                </button>
              );
            })}
          </div>
        )}

        {/* Bookmarked Items Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-surface-container-lowest rounded-xl border border-surface-container-high/60" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon="bookmark_border"
            title={items.length === 0 ? "Your Shelf is Empty" : "No Matching Bookmarks"}
            description={
              items.length === 0
                ? "Save high-yield lectures, textbooks, and generated pathways by clicking the bookmark icon anywhere in the app."
                : "No saved items match your active search and category filters."
            }
            actionText={items.length === 0 ? "Browse Curricula" : "Browse All"}
            actionHref={items.length === 0 ? "/courses" : "/bookmarks"}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container-high/60 flex flex-col justify-between hover:border-primary/40 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-on-surface-variant mb-2">
                    <span className="font-semibold text-secondary uppercase tracking-wider">
                      {item.category || item.type || "Pathway"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(item)}
                      className="text-on-surface-variant hover:text-error transition-colors p-1 rounded"
                      title="Remove from bookmarks"
                    >
                      <span className="material-symbols-outlined text-base">bookmark_remove</span>
                    </button>
                  </div>

                  <h3 className="font-headline-sm text-headline-sm text-primary font-serif mb-1 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 leading-relaxed">
                    {item.description || "Curated academic resource preserved in your study shelf."}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-surface-container-high/40 flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant font-medium truncate max-w-[150px]">
                    {item.source || item.sourceName || "Verified Provider"}
                  </span>
                  {item.pathId ? (
                    <Link
                      href={`/courses/${item.pathId}`}
                      className="px-3 py-1 rounded bg-primary text-on-primary hover:bg-primary-container font-semibold transition-colors flex items-center gap-1"
                    >
                      <span>Open Track</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </Link>
                  ) : item.sourceUrl ? (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded bg-primary text-on-primary hover:bg-primary-container font-semibold transition-colors flex items-center gap-1"
                    >
                      <span>Study</span>
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
