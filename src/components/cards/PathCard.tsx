"use client";

import Link from "next/link";
import { LearningPath } from "@/types";
import { useState, useEffect } from "react";

interface PathCardProps {
  path: LearningPath;
  onBookmarkToggle?: (pathId: string, isBookmarked: boolean) => void;
  isInitialBookmarked?: boolean;
  onDelete?: (path: LearningPath) => void;
  canDelete?: boolean;
}

export default function PathCard({
  path,
  onBookmarkToggle,
  isInitialBookmarked = false,
  onDelete,
  canDelete = true,
}: PathCardProps) {
  const [bookmarked, setBookmarked] = useState(isInitialBookmarked);

  useEffect(() => {
    setBookmarked(isInitialBookmarked);
  }, [isInitialBookmarked]);

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    const nextState = !bookmarked;
    setBookmarked(nextState);
    onBookmarkToggle?.(path.id, nextState);
  };

  return (
    <article className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between group border border-surface-container-high/60">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-space-sm">
          <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-secondary-container/30 text-on-secondary-fixed-variant font-medium">
            {path.domain}
          </span>
          <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <span>~{path.durationHours} hrs</span>
            <span className="w-1 h-1 rounded-full bg-surface-variant"></span>
            <span>{path.moduleCount} modules</span>
          </div>
        </div>

        {/* Title */}
        <Link href={`/courses/${path.id}`}>
          <h3 className="font-headline-md text-headline-md text-primary group-hover:text-primary-container transition-colors mb-2 font-serif">
            {path.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md line-clamp-3 leading-relaxed">
          {path.description}
        </p>

        {/* Level Indicator */}
        <div className="p-space-xs px-space-sm rounded-lg bg-surface-container-low mb-space-md flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-secondary">explore</span>
          <span className="font-label-sm text-label-sm text-on-surface font-medium">
            Level: {path.level}
          </span>
        </div>
      </div>

      {/* Action Row */}
      <div className="pt-space-sm border-t border-surface-container-high flex items-center justify-between gap-2">
        <Link
          href={`/courses/${path.id}`}
          className="flex-1 text-center bg-primary text-on-primary hover:bg-primary-container px-space-md py-2 rounded-lg font-label-lg text-label-lg transition-colors shadow-sm active:scale-[0.98]"
        >
          View Path
        </Link>
        <button
          type="button"
          aria-label="Bookmark Path"
          onClick={handleBookmark}
          className={`p-2 rounded-lg transition-colors ${
            bookmarked
              ? "bg-secondary text-on-secondary shadow-sm"
              : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-secondary"
          }`}
          title={bookmarked ? "Remove Bookmark" : "Save to Bookmarks"}
        >
          <span
            className="material-symbols-outlined text-lg"
            style={{ fontVariationSettings: bookmarked ? "'FILL' 1" : "'FILL' 0" }}
          >
            bookmark
          </span>
        </button>
        {canDelete && onDelete && (
          <button
            type="button"
            aria-label={`Delete ${path.title}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(path);
            }}
            className="p-2 rounded-lg bg-surface-container-low hover:bg-error-container/20 text-on-surface-variant hover:text-error transition-colors focus:outline-none focus:ring-2 focus:ring-error/30 active:scale-95"
            title="Delete Learning Path"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        )}
      </div>
    </article>
  );
}
