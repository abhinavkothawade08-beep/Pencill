"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import educatorData from "../../../../data/master-youtube-educator-directory.json";

interface RawEducator {
  key: string;
  name: string;
  ch: string;
  et?: string;
  grp?: string;
  url: string;
  handle?: string;
  cid?: string;
  site?: string;
  tx?: string[];
  topics?: string;
  lvl?: string;
  fmt?: string;
  best?: string;
  ver?: string;
  aff?: string;
  country?: string;
  lang?: string;
  exams?: string[];
}

export default function EducatorDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"relevance" | "name" | "topics">("relevance");
  const [inspectedEducator, setInspectedEducator] = useState<RawEducator | null>(null);

  const educators: RawEducator[] = useMemo(() => {
    return (educatorData as any).educators || [];
  }, []);

  // Unique domain groups from actual data
  const domains = useMemo(() => {
    const set = new Set<string>();
    educators.forEach((e) => {
      if (e.grp) set.add(e.grp);
    });
    return Array.from(set).sort();
  }, [educators]);

  const filteredEducators = useMemo(() => {
    const list = educators.filter((e) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.ch.toLowerCase().includes(q) ||
        e.handle?.toLowerCase().includes(q) ||
        e.topics?.toLowerCase().includes(q) ||
        e.best?.toLowerCase().includes(q) ||
        e.tx?.some((t) => t.toLowerCase().includes(q)) ||
        e.exams?.some((ex) => ex.toLowerCase().includes(q));

      const matchesDomain = selectedDomain === "all" || e.grp === selectedDomain;
      const matchesVerified = !verifiedOnly || e.ver === "V";

      return matchesSearch && matchesDomain && matchesVerified;
    });

    if (sortBy === "name") {
      return [...list].sort((a, b) => a.ch.localeCompare(b.ch));
    }
    if (sortBy === "topics") {
      return [...list].sort((a, b) => (b.tx?.length || 0) - (a.tx?.length || 0));
    }
    return list;
  }, [educators, searchQuery, selectedDomain, verifiedOnly, sortBy]);

  return (
    <div className="space-y-space-xl max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-surface-container-low to-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-surface-container-high/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-secondary text-2xl">cast_for_education</span>
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              Pencill Verified Master Educator Directory
            </span>
          </div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary font-serif">
            World-Class Educators & Verified Channels
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant mt-2 leading-relaxed">
            Pencill never relies on arbitrary video scraping. Our curriculum engine prioritizes vetted educators,
            canonical YouTube channel IDs, and verified institutional courses across all 12 academic disciplines.
          </p>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-high/70 shadow-xs shrink-0 flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-base">verified</span>
            <span className="font-semibold text-primary">{educators.length} Curated Master Channels</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-base">fingerprint</span>
            <span>100% Canonical YouTube URLs & Handles</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-base">security</span>
            <span>Zero Broken Redirects · 12 Disciplines</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by channel, creator, topic, or exam (e.g. 3Blue1Brown, Python, Law, Organic Chem)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
          />
        </div>

        {/* Domain Filter */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-xs text-on-surface font-semibold focus:outline-none shadow-xs"
          >
            <option value="all">All 12 Disciplines</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-xs text-on-surface font-semibold focus:outline-none shadow-xs"
          >
            <option value="relevance">Sort: Recommended</option>
            <option value="name">Sort: Channel Name (A-Z)</option>
            <option value="topics">Sort: Topic Breadth</option>
          </select>

          <button
            type="button"
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all shadow-xs border ${
              verifiedOnly
                ? "bg-secondary text-on-secondary border-secondary"
                : "bg-surface-container-lowest text-on-surface-variant border-surface-container-high/80 hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-sm">verified</span>
            <span>Tier 1 Verified Only</span>
          </button>
        </div>
      </div>

      {/* Results Count & Active Domain Tags */}
      <div className="flex flex-wrap items-center justify-between text-xs text-on-surface-variant px-1 gap-2">
        <span>Showing {filteredEducators.length} of {educators.length} verified educators</span>
        <div className="flex items-center gap-2">
          {selectedDomain !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container/30 text-secondary font-semibold text-[11px]">
              Domain: {selectedDomain}
              <button
                type="button"
                onClick={() => setSelectedDomain("all")}
                className="hover:text-primary material-symbols-outlined text-xs"
              >
                close
              </button>
            </span>
          )}
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-primary hover:underline font-semibold"
            >
              Clear Search
            </button>
          )}
        </div>
      </div>

      {/* Grid of Educators or Empty State */}
      {filteredEducators.length === 0 ? (
        <EmptyState
          icon="search_off"
          title="No Educators Match Your Criteria"
          description={`No verified educators found matching "${searchQuery}". Try selecting "All 12 Disciplines" or clearing your search filter.`}
          actionText="Clear Filters"
          onAction={() => {
            setSearchQuery("");
            setSelectedDomain("all");
            setVerifiedOnly(false);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEducators.map((edu) => {
            const isTier1 = edu.ver === "V";
            const topicsList = edu.tx || (edu.topics ? edu.topics.split(",").map((s) => s.trim()) : []);

            return (
              <div
                key={edu.key}
                className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high/70 shadow-xs flex flex-col justify-between hover:border-primary/50 transition-all group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold font-serif text-lg border border-primary/20">
                        {edu.ch.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-sm text-primary truncate group-hover:text-secondary transition-colors">
                            {edu.ch}
                          </h3>
                          {isTier1 && (
                            <span
                              className="material-symbols-outlined text-secondary text-sm shrink-0"
                              title="Tier 1 Verified Master Channel"
                            >
                              verified
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-on-surface-variant truncate block">
                          {edu.name} {edu.handle ? `· ${edu.handle}` : ""}
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container text-on-surface-variant uppercase tracking-wider shrink-0 text-right max-w-[120px] truncate" title={edu.grp}>
                      {edu.grp || "STEM"}
                    </span>
                  </div>

                  {/* Best For / Overview */}
                  {edu.best && (
                    <p className="text-xs text-on-surface-variant line-clamp-2 bg-surface-container-low p-2.5 rounded-xl border border-surface-container-high/40 mb-3">
                      <span className="font-semibold text-primary">Best for: </span>
                      {edu.best}
                    </p>
                  )}

                  {/* Format and Level */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-on-surface-variant mb-3">
                    {edu.fmt && (
                      <span className="px-2 py-0.5 rounded-md bg-surface-container border border-surface-container-high/30">
                        {edu.fmt}
                      </span>
                    )}
                    {edu.lvl && (
                      <span className="px-2 py-0.5 rounded-md bg-surface-container border border-surface-container-high/30">
                        {edu.lvl}
                      </span>
                    )}
                  </div>

                  {/* Topics Tags */}
                  {topicsList.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {topicsList.slice(0, 4).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface-container-low text-on-surface-variant border border-surface-container-high/20"
                        >
                          {t}
                        </span>
                      ))}
                      {topicsList.length > 4 && (
                        <button
                          type="button"
                          onClick={() => setInspectedEducator(edu)}
                          className="text-[10px] text-secondary font-semibold hover:underline self-center ml-1"
                        >
                          +{topicsList.length - 4} more
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-5 pt-3 border-t border-surface-container-high/40 flex items-center justify-between gap-2">
                  <a
                    href={edu.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:text-primary transition-colors"
                  >
                    <span>Visit Channel</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setInspectedEducator(edu)}
                      className="px-2.5 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-semibold transition-colors"
                      title="View Profile Details"
                    >
                      <span className="material-symbols-outlined text-xs">info</span>
                    </button>
                    <Link
                      href={`/new-goal?educator=${encodeURIComponent(edu.cid || edu.handle || edu.ch)}`}
                      className="px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-xs flex items-center gap-1 transition-all"
                    >
                      <span className="material-symbols-outlined text-xs">auto_awesome</span>
                      <span>Learn with Channel</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Educator Details Modal */}
      {inspectedEducator && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-surface-container-high/80 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                  {inspectedEducator.grp}
                </span>
                <h3 className="font-bold text-xl text-primary font-serif mt-1">
                  {inspectedEducator.ch}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {inspectedEducator.name} {inspectedEducator.handle ? `· ${inspectedEducator.handle}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectedEducator(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {inspectedEducator.best && (
                <div className="bg-surface-container-low p-3 rounded-xl border border-surface-container-high/50">
                  <span className="font-bold text-primary block mb-0.5">Pedagogical Strengths:</span>
                  <p className="text-on-surface-variant leading-relaxed">{inspectedEducator.best}</p>
                </div>
              )}

              {inspectedEducator.topics && (
                <div>
                  <span className="font-semibold text-primary block mb-1">Curriculum &amp; Topics Covered:</span>
                  <p className="text-on-surface-variant leading-relaxed">{inspectedEducator.topics}</p>
                </div>
              )}

              {inspectedEducator.tx && inspectedEducator.tx.length > 0 && (
                <div>
                  <span className="font-semibold text-primary block mb-1.5">Key Concepts Indexed:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectedEducator.tx.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-surface-container rounded-md text-on-surface-variant text-[11px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {inspectedEducator.aff && (
                <div className="pt-2 border-t border-surface-container-high/40 text-[11px] text-on-surface-variant">
                  <span className="font-semibold text-on-surface">Institutional Affiliation: </span>
                  {inspectedEducator.aff}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-surface-container-high/40 flex items-center justify-end gap-3">
              <a
                href={inspectedEducator.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-primary flex items-center gap-1 transition-colors"
              >
                <span>Open YouTube Channel</span>
                <span className="material-symbols-outlined text-xs">open_in_new</span>
              </a>
              <Link
                href={`/new-goal?educator=${encodeURIComponent(inspectedEducator.cid || inspectedEducator.handle || inspectedEducator.ch)}`}
                onClick={() => setInspectedEducator(null)}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-xs flex items-center gap-1 transition-all"
              >
                <span className="material-symbols-outlined text-xs">auto_awesome</span>
                <span>Build Syllabus with Channel</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
