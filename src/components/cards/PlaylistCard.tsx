"use client";

import React, { useState } from "react";
import { PlaylistResource } from "@/lib/resource-engine/types";

interface PlaylistCardProps {
  playlist: PlaylistResource;
  moduleTitle?: string;
}

export default function PlaylistCard({ playlist, moduleTitle }: PlaylistCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const items = playlist.items || [];

  return (
    <div className="bg-gradient-to-br from-surface-container-lowest to-surface-container-low rounded-xl border border-secondary/30 p-4 shadow-xs hover:border-secondary/50 transition-all mb-3">
      {/* Top Header Badge Row */}
      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-secondary-container text-on-secondary-container uppercase tracking-wide flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">playlist_play</span>
            <span>Curated Lecture Series</span>
          </span>

          {playlist.isCurated && (
            <span className="px-2 py-0.5 rounded-md font-sans text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">verified</span>
              <span>Verified Instructor</span>
            </span>
          )}

          <span className="px-2 py-0.5 rounded-md font-mono text-[11px] text-on-surface-variant bg-surface-container">
            {playlist.itemCount} Lectures
          </span>

          {playlist.totalDurationMinutes && (
            <span className="px-2 py-0.5 rounded-md font-mono text-[11px] text-on-surface-variant bg-surface-container">
              ~{Math.round(playlist.totalDurationMinutes / 60)}h total
            </span>
          )}
        </div>

        <a
          href={playlist.playlistUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:text-secondary-container transition-colors shrink-0"
        >
          <span>Open YouTube Playlist</span>
          <span className="material-symbols-outlined text-sm">open_in_new</span>
        </a>
      </div>

      {/* Title & Channel */}
      <div className="min-w-0 mb-2">
        <h4 className="font-headline-sm text-sm sm:text-base font-semibold text-primary">
          {playlist.title}
        </h4>
        <p className="text-xs text-on-surface-variant flex items-center gap-1.5 mt-0.5">
          <span className="material-symbols-outlined text-sm">school</span>
          <span className="font-medium text-on-surface">{playlist.channelName}</span>
          {moduleTitle && (
            <>
              <span>·</span>
              <span className="text-on-surface-variant">Aligned to {moduleTitle}</span>
            </>
          )}
        </p>
      </div>

      {/* Topics Covered Tags */}
      {playlist.topicsCovered && playlist.topicsCovered.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <span className="text-[11px] font-medium text-on-surface-variant">Covers:</span>
          {playlist.topicsCovered.slice(0, 5).map((topic, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded text-[11px] bg-surface-container text-on-surface font-medium"
            >
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* Expand/Collapse Video Sequence */}
      {items.length > 0 && (
        <div className="border-t border-surface-container-high/40 pt-2 mt-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors py-1"
          >
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">format_list_numbered</span>
              <span>{isExpanded ? "Hide Video Sequence" : `View Full Syllabus Sequence (${items.length} Lessons)`}</span>
            </span>
            <span
              className={`material-symbols-outlined text-sm transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            >
              expand_more
            </span>
          </button>

          {isExpanded && (
            <div className="space-y-1.5 mt-2 max-h-60 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div
                  key={item.videoId || idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container-low transition-colors text-xs border border-surface-container-high/30"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[11px] font-bold text-on-surface-variant px-1.5 py-0.5 rounded bg-surface-container shrink-0">
                      #{item.sequenceNumber || idx + 1}
                    </span>
                    <span className="text-on-surface font-medium truncate">
                      {item.title}
                    </span>
                  </div>

                  <a
                    href={item.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-on-surface-variant hover:text-primary shrink-0 transition-colors"
                    title="Watch this lecture"
                  >
                    <span className="material-symbols-outlined text-sm">play_circle</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
