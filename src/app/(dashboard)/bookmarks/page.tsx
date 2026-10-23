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

export default function BookmarksPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRemoved, setLastRemoved] = useState<Bookmark | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadBookmarks() {
      setLoading(true);
      if (user?.id) {
        const data = await getUserBookmarks(user.id);
        if (mounted) {
          setItems(data);
          setLoading(false);
        }
      } else {
        if (mounted) {
          setItems([]);
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
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "video" && item.category === "video") ||
      (activeTab === "monograph" && item.category === "monograph") ||
      (activeTab === "formulae" && item.category === "formulae");

    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.source.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const handleRemove = async (item: Bookmark) => {
    setLastRemoved(item);
    setItems((prev) => prev.filter((b) => b.id !== item.id));
    setToastMessage(`Removed "${item.title}" from bookmarks.`);
    setToastOpen(true);

    if (user?.id) {
      await removeBookmark(item.id, user.id);
    }
  };

  const handleUndo = async () => {
    if (lastRemoved) {
      const restored = lastRemoved;
      setItems((prev) => [restored, ...prev]);
      setToastMessage(`Restored "${restored.title}".`);
      setLastRemoved(null);

      if (user?.id) {
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
              <span className="text-secondary font-semibold">Personal Shelf</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary font-serif">
              Saved Bookmarks &amp; Shelf
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Your personal archive of bookmarked lectures, interactive monographs, problem sets, and mathematical proofs.
            </p>
          </div>

          <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-3 py-1 rounded-full shrink-0">
            {items.length} Items Saved
          </span>
        </header>

        {/* Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-md">
          {/* Tabs */}
          <div className="flex bg-surface-container-low p-1 rounded-lg border border-surface-container-high/60">
            {[
              { id: "all", label: "All Items" },
              { id: "video", label: "Video Lectures" },
              { id: "monograph", label: "Monographs" },
              { id: "formulae", label: "Formulae" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-md font-label-md text-label-md font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-surface-container-lowest text-primary shadow-xs font-semibold"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Filter */}
          <div className="relative max-w-xs w-full">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-base pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter saved resources..."
              className="w-full pl-9 pr-space-md py-1.5 bg-surface-container-lowest rounded-lg border border-surface-container-high text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Bookmark Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md animate-pulse">
            <div className="h-44 bg-surface-container-lowest rounded-xl border border-surface-container-high/60" />
            <div className="h-44 bg-surface-container-lowest rounded-xl border border-surface-container-high/60" />
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon="bookmark_border"
            title="No Saved Resources Found"
            description={
              searchQuery
                ? `No bookmarks match "${searchQuery}". Try changing your query or selecting another tab.`
                : "Your personal study shelf is currently clear. Save monographs, video timestamps, and problem sets to access them here."
            }
            actionText="Explore Curricula"
            actionHref="/explore"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-surface-container-high/60 flex flex-col justify-between group hover:border-primary/40 hover:shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-secondary-fixed bg-secondary-fixed/50 px-2 py-0.5 rounded font-medium capitalize">
                      <span className="material-symbols-outlined text-xs">
                        {item.type === "video" ? "videocam" : item.type === "monograph" ? "article" : "functions"}
                      </span>
                      {item.type}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(item)}
                      className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
                      title="Remove from Shelf"
                    >
                      <span className="material-symbols-outlined text-base">bookmark_remove</span>
                    </button>
                  </div>

                  <h3 className="font-headline-sm text-headline-sm text-primary font-sans font-semibold mb-1">
                    {item.title}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-space-sm mt-space-sm border-t border-surface-container-high/40 flex items-center justify-between text-label-sm text-on-surface-variant">
                  <span className="font-medium text-primary truncate max-w-[200px]">
                    {item.source}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{item.savedAt}</span>
                    <Link
                      href={
                        item.pathId && item.resourceId
                          ? `/learn/${item.pathId}/${item.resourceId}`
                          : item.pathId
                          ? `/courses/${item.pathId}`
                          : "/explore"
                      }
                      className="px-2.5 py-1 bg-surface-container text-primary font-semibold rounded hover:bg-primary hover:text-on-primary transition-colors text-xs"
                    >
                      Study
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
