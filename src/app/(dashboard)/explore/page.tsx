"use client";

import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getLearningPaths } from "@/services/supabase";
import { deleteLearningPath, batchDeleteLearningPaths } from "@/services/supabase/pathService";
import { isSupabaseConfigured } from "@/services/supabase/client";
import { canDeleteLearningPath } from "@/lib/permissions";
import { LearningPath } from "@/types";
import PathCard from "@/components/cards/PathCard";
import Toast from "@/components/ui/Toast";
import EmptyState from "@/components/ui/EmptyState";
import DeleteLearningPathModal from "@/components/ui/DeleteLearningPathModal";
import DeleteAllModal from "@/components/ui/DeleteAllModal";

import { useAuth } from "@/context/AuthContext";
import {
  getUserBookmarks,
  addBookmark,
  removeBookmark,
} from "@/services/supabase/bookmarkService";

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const { user, session, profile } = useAuth();

  const [courses, setCourses] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedMap, setBookmarkedMap] = useState<Map<string, string>>(new Map());

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [targetPathToDelete, setTargetPathToDelete] = useState<LearningPath | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeletingAllPaths, setIsDeletingAllPaths] = useState(false);
  const [toastState, setToastState] = useState<{ open: boolean; message: string; icon?: string }>({
    open: false,
    message: "",
    icon: "check_circle",
  });

  const loadPaths = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pathsData, bookmarksData] = await Promise.all([
        getLearningPaths(),
        user?.id ? getUserBookmarks(user.id) : Promise.resolve([]),
      ]);
      setCourses(pathsData);

      const bMap = new Map<string, string>();
      bookmarksData.forEach((b) => {
        if (b.pathId) {
          bMap.set(b.pathId, b.id);
        }
      });
      setBookmarkedMap(bMap);
    } catch (err: unknown) {
      console.error("Failed to load learning paths:", err);
      setError("Unable to load curriculum catalog from database.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPaths();
  }, [loadPaths]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesQuery =
        !searchQuery ||
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDifficulty =
        difficultyFilter === "all" ||
        (difficultyFilter === "beginner" && (course.level === "Beginner" || course.level === "Foundation")) ||
        (difficultyFilter === "intermediate" && (course.level === "Intermediate" || course.level === "Class 11")) ||
        (difficultyFilter === "advanced" && (course.level === "Advanced" || course.level === "Competitive" || course.level === "Undergraduate"));

      const matchesDuration =
        durationFilter === "all" ||
        (durationFilter === "short" && course.durationHours <= 20) ||
        (durationFilter === "long" && course.durationHours > 20);

      return matchesQuery && matchesDifficulty && matchesDuration;
    });
  }, [courses, searchQuery, difficultyFilter, durationFilter]);

  const handleBookmarkToggle = async (pathId: string, isBookmarked: boolean) => {
    const course = courses.find((c) => c.id === pathId);
    if (!course) return;

    if (!user) {
      setToastState({
        open: true,
        message: "Please sign in to save learning paths to your shelf.",
      });
      return;
    }

    if (isBookmarked) {
      const newId = await addBookmark(
        {
          title: course.title,
          source: course.domain,
          type: "path",
          category: "path",
          description: course.description,
          pathId: course.id,
        },
        user.id
      );

      if (newId) {
        setBookmarkedMap((prev) => new Map(prev).set(pathId, newId));
        setToastState({
          open: true,
          message: `Saved "${course.title}" to your shelf.`,
        });
      }
    } else {
      const existingBookmarkId = bookmarkedMap.get(pathId);
      if (existingBookmarkId) {
        await removeBookmark(existingBookmarkId, user.id);
        setBookmarkedMap((prev) => {
          const next = new Map(prev);
          next.delete(pathId);
          return next;
        });
        setToastState({
          open: true,
          message: `Removed "${course.title}" from bookmarks.`,
          icon: "bookmark_remove",
        });
      }
    }
  };

  const checkCanDelete = useCallback(
    (path: LearningPath) => {
      return canDeleteLearningPath(path, user, profile, isSupabaseConfigured);
    },
    [user, profile]
  );

  const handleDeleteTrigger = (path: LearningPath) => {
    setTargetPathToDelete(path);
  };

  const handleConfirmDelete = async () => {
    if (!targetPathToDelete) return;
    setIsDeleting(true);

    try {
      const res = await deleteLearningPath(targetPathToDelete.id, {
        accessToken: session?.access_token,
      });

      if (res.success) {
        // Immediately remove deleted path from state
        setCourses((prev) => prev.filter((c) => c.id !== targetPathToDelete.id));
        setBookmarkedMap((prev) => {
          const next = new Map(prev);
          next.delete(targetPathToDelete.id);
          return next;
        });
        setToastState({
          open: true,
          message: "Learning path permanently deleted.",
          icon: "check_circle",
        });
        setTargetPathToDelete(null);
      } else {
        setToastState({
          open: true,
          message: res.error || "Failed to delete learning path.",
          icon: "error",
        });
      }
    } catch (err: unknown) {
      setToastState({
        open: true,
        message: err instanceof Error ? err.message : "Failed to delete learning path.",
        icon: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isPathOwnedByUser = useCallback(
    (path: LearningPath) => {
      if (!path.authorUserId) return false;
      if (user?.id) return path.authorUserId === user.id;
      return true;
    },
    [user?.id]
  );

  const userPathsInScope = useMemo(() => {
    return filteredCourses.filter(isPathOwnedByUser);
  }, [filteredCourses, isPathOwnedByUser]);

  const totalUserPaths = useMemo(() => {
    return courses.filter(isPathOwnedByUser);
  }, [courses, isPathOwnedByUser]);

  const isFilterActive = searchQuery.trim().length > 0 || difficultyFilter !== "all" || durationFilter !== "all";
  const scopeDescription = isFilterActive
    ? `Filtered View (${filteredCourses.length} paths shown, ${userPathsInScope.length} user-owned)`
    : "All Personal Learning Paths";

  const handleConfirmDeleteAllPaths = async () => {
    if (userPathsInScope.length === 0) return;
    setIsDeletingAllPaths(true);
    const targetIds = userPathsInScope.map((c) => c.id);

    try {
      const res = await batchDeleteLearningPaths(targetIds, {
        accessToken: session?.access_token,
      });

      if (res.success && res.deletedCount > 0) {
        const deletedSet = new Set(res.deletedIds);
        setCourses((prev) => prev.filter((c) => !deletedSet.has(c.id)));
        setBookmarkedMap((prev) => {
          const next = new Map(prev);
          res.deletedIds.forEach((id) => next.delete(id));
          return next;
        });
        setToastState({
          open: true,
          message: `Successfully deleted ${res.deletedCount} learning ${res.deletedCount === 1 ? "path" : "paths"}.`,
          icon: "check_circle",
        });
        setIsDeleteAllModalOpen(false);
      } else {
        setToastState({
          open: true,
          message: res.errors?.[0] || "Failed to delete learning paths.",
          icon: "error",
        });
      }
    } catch (err: unknown) {
      setToastState({
        open: true,
        message: err instanceof Error ? err.message : "Failed to delete learning paths.",
        icon: "error",
      });
    } finally {
      setIsDeletingAllPaths(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[1280px] mx-auto pb-space-xl">
      {/* Toast Notification */}
      <Toast
        isOpen={toastState.open}
        message={toastState.message}
        icon={toastState.icon}
        onClose={() => setToastState({ open: false, message: "", icon: "check_circle" })}
      />

      {/* Page Header & Academic Premise */}
      <header className="mb-space-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary-container/40 text-on-secondary-fixed-variant font-label-sm text-label-sm uppercase tracking-wider mb-space-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              Curated Academic Wayfinding
            </div>
            <h1 className="font-headline-lg text-display-lg text-primary tracking-tight font-serif">
              Find your next path.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-xl leading-relaxed">
              Structured learning journeys synthesized from peer-reviewed, university-grade, and verified open-access materials. No promotional feeds.
            </p>
          </div>

          {/* Quick Summary Stat */}
          <div className="hidden lg:flex items-center gap-6 bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-high/60">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Available Tracks
              </span>
              <span className="font-headline-md text-headline-md text-primary font-serif font-semibold">
                {courses.length}
              </span>
            </div>
            <div className="w-px h-8 bg-surface-variant" />
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Status
              </span>
              <span className="font-headline-md text-headline-md text-secondary font-serif font-semibold">
                {loading ? "Loading..." : courses.length > 0 ? "Active Catalog" : "Awaiting Catalog"}
              </span>
            </div>
          </div>
        </div>

        {/* Architectural Search Module */}
        <div className="relative w-full max-w-3xl">
          <div className="relative flex items-center bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/60 focus-within:ring-2 focus-within:ring-primary-container transition-all">
            <span className="material-symbols-outlined absolute left-4 text-on-surface-variant text-xl pointer-events-none">
              travel_explore
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What do you want to learn? (e.g. Classical Mechanics, Differential Equations, Signals & Systems)"
              className="w-full pl-12 pr-28 py-3.5 bg-transparent rounded-xl font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none"
            />
            <div className="absolute right-3 flex items-center gap-1.5 bg-surface-container px-2 py-1 rounded-md text-on-surface-variant pointer-events-none font-label-sm text-label-sm">
              <span>⌘</span>
              <span>K</span>
            </div>
          </div>

          {/* Frequent Query Suggestions */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Frequent queries:</span>
            {["Physics", "Computer Science", "Mathematics", "Differential Equations"].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setSearchQuery(q)}
                className="px-2.5 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors border border-surface-container-high/30"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Refined Filtering Layer */}
        <div className="mt-space-lg pt-space-md flex flex-wrap items-center justify-between gap-space-md border-t border-surface-container-high/40">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Difficulty Filter */}
            <div className="relative inline-block">
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="appearance-none bg-surface-container-lowest text-on-surface font-label-md text-label-md px-3 py-2 pr-8 rounded-lg shadow-sm border border-surface-container-high/60 focus:outline-none cursor-pointer hover:bg-surface-container-low transition-colors"
              >
                <option value="all">Difficulty: All Levels</option>
                <option value="beginner">Beginner / Foundation</option>
                <option value="intermediate">Intermediate / Class 11</option>
                <option value="advanced">Advanced / Undergraduate</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-2.5 text-on-surface-variant text-sm pointer-events-none">
                expand_more
              </span>
            </div>

            {/* Duration Filter */}
            <div className="relative inline-block">
              <select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
                className="appearance-none bg-surface-container-lowest text-on-surface font-label-md text-label-md px-3 py-2 pr-8 rounded-lg shadow-sm border border-surface-container-high/60 focus:outline-none cursor-pointer hover:bg-surface-container-low transition-colors"
              >
                <option value="all">Duration: Any</option>
                <option value="short">1 – 20 hours</option>
                <option value="long">20+ hours</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-2.5 text-on-surface-variant text-sm pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
            {loading ? "Searching..." : `${filteredCourses.length} ${filteredCourses.length === 1 ? "Path" : "Paths"} available`}
          </span>
        </div>
      </header>

      {/* Curators' Scholarly Picks from Real Verified Database Records */}
      {courses.filter((c) => c.verified).length > 0 && (
        <section className="mb-space-xl">
          <div className="flex items-center justify-between mb-space-md">
            <div>
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">
                Institutional Curricula
              </span>
              <h2 className="font-headline-md text-headline-md text-primary font-serif">
                Featured Academic Curricula
              </h2>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
              Verified Sources
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
            {courses
              .filter((c) => c.verified)
              .slice(0, 2)
              .map((featured) => (
                <div
                  key={featured.id}
                  className="relative bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/60 p-space-lg flex flex-col justify-between group hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-space-sm">
                      <span className="bg-surface-container-high text-primary px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold">
                        {featured.domain}
                      </span>
                      <span className="text-on-surface-variant font-label-sm text-label-sm">
                        Level: {featured.level}
                      </span>
                    </div>
                    <h3 className="font-headline-md text-headline-md text-primary font-serif font-semibold group-hover:text-secondary transition-colors">
                      {featured.title}
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs leading-relaxed line-clamp-3">
                      {featured.description}
                    </p>
                  </div>
                  <div className="pt-space-md mt-space-md border-t border-surface-container-high/40 flex flex-wrap items-center justify-between gap-space-sm">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {featured.moduleCount} Modules · ~{featured.durationHours}h Rigor
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Delete ${featured.title}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteTrigger(featured);
                        }}
                        className="p-1.5 rounded-lg bg-surface-container-low hover:bg-error-container/20 text-on-surface-variant hover:text-error transition-colors focus:outline-none focus:ring-2 focus:ring-error/30 active:scale-95"
                        title="Delete Learning Path"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                      <a
                        href={`/courses/${featured.id}`}
                        className="inline-flex items-center gap-1.5 font-label-lg text-label-lg text-primary font-semibold group-hover:translate-x-0.5 transition-all"
                      >
                        <span>Study Curriculum</span>
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                      </a>
                    </div>
                  </div>

                </div>
              ))}
          </div>
        </section>
      )}

      {/* PRIMARY SECTION: Curated Learning Paths Grid */}
      <section className="mb-space-xl">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-space-md mb-space-md">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-primary-container"></span>
              <h2 className="font-headline-lg text-headline-lg text-primary font-serif">
                Learning Paths
              </h2>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Sequential roadmaps guiding you from foundational axioms to domain synthesis.
            </p>
          </div>

          {/* Delete All Button for User-Owned Learning Paths */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDeleteAllModalOpen(true)}
              disabled={userPathsInScope.length === 0}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 border ${
                userPathsInScope.length > 0
                  ? "bg-error/10 hover:bg-error/20 text-error border-error/30 hover:border-error/50 active:scale-95"
                  : "bg-surface-container-low text-on-surface-variant/40 border-surface-container-high cursor-not-allowed"
              }`}
              title={
                userPathsInScope.length > 0
                  ? `Delete all ${userPathsInScope.length} user-owned learning paths in this view`
                  : totalUserPaths.length === 0
                  ? "No user-created learning paths exist in catalog (System catalog tracks are protected)"
                  : "No user-created paths match the active filter"
              }
            >
              <span className="material-symbols-outlined text-sm">delete_sweep</span>
              <span>
                {isFilterActive
                  ? `Delete Filtered Paths (${userPathsInScope.length})`
                  : `Delete All My Paths (${userPathsInScope.length})`}
              </span>
            </button>
          </div>
        </div>

        {/* Loading State Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-surface-container-lowest rounded-xl p-space-md border border-surface-container-high/60 animate-pulse space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-surface-container rounded w-20"></div>
                  <div className="h-4 bg-surface-container rounded w-24"></div>
                </div>
                <div className="h-6 bg-surface-container rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-3.5 bg-surface-container-low rounded w-full"></div>
                  <div className="h-3.5 bg-surface-container-low rounded w-5/6"></div>
                </div>
                <div className="h-8 bg-surface-container-low rounded w-full mt-4"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <EmptyState
            title="Database Connection Error"
            description={error}
            actionText="Retry Loading"
            actionHref="/explore"
          />
        )}

        {/* Empty State */}
        {!loading && !error && filteredCourses.length === 0 && (
          <EmptyState
            title={courses.length === 0 ? "No Published Curricula" : "No Matching Paths"}
            description={
              courses.length === 0
                ? "No published learning paths are currently available in the catalog. You can synthesize a personalized academic syllabus using our Resource Engine."
                : "No paths match your active search terms and filters. Try clearing your filters or changing your query."
            }
            actionText={
              courses.length === 0
                ? "Synthesize Academic Path"
                : searchQuery || difficultyFilter !== "all" || durationFilter !== "all"
                ? "Clear All Filters"
                : "Browse Catalog"
            }
            actionHref={
              courses.length === 0
                ? "/new-goal"
                : "/explore"
            }
          />
        )}

        {/* Loaded Paths Grid */}
        {!loading && !error && filteredCourses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
            {filteredCourses.map((course) => (
              <PathCard
                key={course.id}
                path={course}
                isInitialBookmarked={bookmarkedMap.has(course.id)}
                onBookmarkToggle={handleBookmarkToggle}
                canDelete={true}
                onDelete={handleDeleteTrigger}
              />
            ))}

          </div>
        )}
      </section>

      {/* Confirmation Modal */}
      {targetPathToDelete && (
        <DeleteLearningPathModal
          isOpen={Boolean(targetPathToDelete)}
          onClose={() => {
            if (!isDeleting) {
              setTargetPathToDelete(null);
            }
          }}
          onConfirm={handleConfirmDelete}
          pathTitle={targetPathToDelete.title}
          pathId={targetPathToDelete.id}
          isDeleting={isDeleting}
        />
      )}

      {/* Delete All Paths Confirmation Modal */}
      {isDeleteAllModalOpen && (
        <DeleteAllModal
          isOpen={isDeleteAllModalOpen}
          onClose={() => {
            if (!isDeletingAllPaths) {
              setIsDeleteAllModalOpen(false);
            }
          }}
          onConfirm={handleConfirmDeleteAllPaths}
          itemType="learning path"
          itemTypePlural="learning paths"
          items={userPathsInScope.map((c) => ({ id: c.id, title: c.title }))}
          scopeDescription={scopeDescription}
          isDeleting={isDeletingAllPaths}
        />
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-on-surface-variant font-label-md">Loading curricula catalog...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
