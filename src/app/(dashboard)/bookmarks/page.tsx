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

  const filteredItems = items.filter((item) => {
    const itemCat = item.category || item.type || "path";
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "video" && itemCat === "video") ||
      (activeTab === "monograph" && (itemCat === "monograph" || itemCat === "reading")) ||
      (activeTab === "formulae" && itemCat === "formulae") ||
      (activeTab === "path" && (itemCat === "path" || item.pathId));

    const matchesSearch =
      !searchQuery ||
      (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.source && item.source.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesSearch;
  });

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

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-space-md border-b border-surface-container-high/60 pb-space-md">
          <div>
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-secondary font-semibold">Bookmarks</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary font-serif">
              Personal Study Shelf
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              {items.length > 0
                ? `You have ${items.length} saved resources across your active study disciplines.`
                : "Curate your private archive of high-yield lectures, textbooks, and pathways."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/explore"
              className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-primary rounded-lg font-label-md font-semibold transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">travel_explore</span>
              <span>Find More</span>
            </Link>
            <Link
              href="/new-goal"
              className="px-4 py-2 bg-primary text-on-primary hover:bg-primary-container rounded-lg font-label-md font-semibold transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>New Goal</span>
            </Link>
          </div>
        </header>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-space-sm items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-xl border border-surface-container-high/60 overflow-x-auto">
            {[
              { id: "all", label: "All Items", icon: "bookmarks" },
              { id: "path", label: "Pathways", icon: "conversion_path" },
              { id: "video", label: "Lectures", icon: "play_circle" },
              { id: "monograph", label: "Readings", icon: "menu_book" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary-container text-on-primary shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-base">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter bookmarked resources..."
              className="w-full pl-9 pr-3 py-1.5 bg-surface-container-low rounded-lg border border-surface-container-high text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

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
