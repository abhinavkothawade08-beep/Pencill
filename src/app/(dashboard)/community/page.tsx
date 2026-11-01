"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  getDiscussions,
  getDiscussionById,
  createDiscussion,
  toggleDiscussionUpvote,
  addReply,
  toggleReplyUpvote,
  toggleAcceptedAnswer,
  updateDiscussion,
  deleteDiscussion,
  deleteReply,
  reportDiscussion,
  CommunityDiscussion,
} from "@/services/supabase/communityService";
import { storageAdapter } from "@/lib/storage/storageAdapter";
import { useAuth } from "@/context/AuthContext";
import Toast from "@/components/ui/Toast";
import EmptyState from "@/components/ui/EmptyState";
import { addBookmark } from "@/services/supabase/bookmarkService";

const TAXONOMY_DOMAINS = [
  "School Education",
  "Engineering & Technology",
  "Medical & Health Sciences",
  "Business, Management & Commerce",
  "Science & Mathematics",
  "Arts, Humanities & Social Sciences",
  "Law & Government",
  "Finance, Accounting & Professional Qualifications",
  "Vocational & Applied Technical Skills",
  "Languages & Communication",
  "Research & Academic Development",
  "Personal & Practical Learning",
];

const ITEMS_PER_PAGE = 6;

export default function CommunityDiscussionsPage() {
  const { user, profile } = useAuth();
  const currentUserId = user?.id || "guest-scholar";
  const currentUserName = profile?.name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Scholar";
  const currentUserAvatar = profile?.avatarUrl || "/avatars/default-avatar.svg";

  const [discussions, setDiscussions] = useState<CommunityDiscussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "solved" | "unsolved" | "my_posts">("all");
  const [sortBy, setSortBy] = useState<"recent" | "upvotes">("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDiscussion, setActiveDiscussion] = useState<CommunityDiscussion | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // New Question Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newDomain, setNewDomain] = useState("Science & Mathematics");
  const [newTags, setNewTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Question Modal State
  const [editingDisc, setEditingDisc] = useState<CommunityDiscussion | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Report Modal State
  const [reportingDiscId, setReportingDiscId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");

  // Reply Input
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ open: boolean; message: string; icon?: string }>({
    open: false,
    message: "",
  });

  const loadDiscussions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Purge any stale mock/seed data from storage
      await storageAdapter.purgeMockDiscussions();

      // Fetch genuine persisted discussions
      const list = await getDiscussions({
        domain: selectedDomain,
        status: statusFilter,
        currentUserId,
        searchQuery,
        sortBy,
      });

      setDiscussions(list || []);
    } catch (e: any) {
      console.error("Failed to load community discussions:", e);
      setError("Unable to connect to the peer forum. Please check your network and retry.");
    } finally {
      setLoading(false);
    }
  }, [selectedDomain, statusFilter, currentUserId, searchQuery, sortBy]);

  useEffect(() => {
    loadDiscussions();
  }, [loadDiscussions]);

  // Keep activeDiscussion in sync with updated discussions
  useEffect(() => {
    if (activeDiscussion) {
      const fresh = discussions.find((d) => d.id === activeDiscussion.id);
      if (fresh) setActiveDiscussion(fresh);
    }
  }, [discussions, activeDiscussion]);

  // Create genuine question
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    try {
      const parsedTags = newTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const created = await createDiscussion({
        title: newTitle.trim(),
        content: newContent.trim(),
        domain: newDomain,
        tags: parsedTags.length > 0 ? parsedTags : [newDomain],
        userId: currentUserId !== "guest-scholar" ? currentUserId : null,
        authorName: currentUserName,
        authorAvatar: currentUserAvatar,
      });

      setDiscussions((prev) => [created, ...prev]);
      setActiveDiscussion(created);
      setIsModalOpen(false);
      setNewTitle("");
      setNewContent("");
      setNewTags("");
      setToast({
        open: true,
        message: "Your academic question was published to the peer forum!",
        icon: "check_circle",
      });
    } catch (err: any) {
      setToast({ open: true, message: err.message || "Failed to publish question.", icon: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upvote Question with duplicate vote gating
  const handleToggleQuestionUpvote = async (discId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const updated = await toggleDiscussionUpvote(discId, currentUserId);
      if (updated) {
        setDiscussions((prev) => prev.map((d) => (d.id === discId ? updated : d)));
        if (activeDiscussion?.id === discId) {
          setActiveDiscussion(updated);
        }
      }
    } catch (err) {
      console.error("Question upvote error:", err);
    }
  };

  // Post Reply
  const handleAddReply = async (discId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsReplying(true);
    try {
      const reply = await addReply({
        discussionId: discId,
        content: replyText.trim(),
        userId: currentUserId !== "guest-scholar" ? currentUserId : null,
        authorName: currentUserName,
        authorAvatar: currentUserAvatar,
      });

      if (reply) {
        const refreshed = await getDiscussionById(discId);
        if (refreshed) {
          setDiscussions((prev) => prev.map((d) => (d.id === discId ? refreshed : d)));
          setActiveDiscussion(refreshed);
        }
        setReplyText("");
        setToast({ open: true, message: "Response published to discussion!", icon: "reply" });
      }
    } catch (err: any) {
      setToast({ open: true, message: err.message || "Failed to publish response.", icon: "error" });
    } finally {
      setIsReplying(false);
    }
  };

  // Upvote Reply with duplicate vote gating
  const handleToggleReplyUpvote = async (discId: string, repId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const updated = await toggleReplyUpvote(discId, repId, currentUserId);
      if (updated) {
        setDiscussions((prev) => prev.map((d) => (d.id === discId ? updated : d)));
        setActiveDiscussion(updated);
      }
    } catch (err) {
      console.error("Reply upvote error:", err);
    }
  };

  // Toggle Accepted Answer / Solved
  const handleToggleSolved = async (discId: string, repId?: string) => {
    try {
      const updated = await toggleAcceptedAnswer(discId, repId);
      if (updated) {
        setDiscussions((prev) => prev.map((d) => (d.id === discId ? updated : d)));
        setActiveDiscussion(updated);
        setToast({
          open: true,
          message: updated.isSolved ? "Thread marked as resolved!" : "Thread marked as open.",
          icon: "verified",
        });
      }
    } catch (err) {
      console.error("Toggle solved error:", err);
    }
  };

  // Bookmark Discussion
  const handleBookmarkDiscussion = async (disc: CommunityDiscussion, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      if (user?.id) {
        await addBookmark(
          {
            title: disc.title,
            source: `Community Q&A · ${disc.domain}`,
            type: "practice",
            category: "practice",
            description: disc.content.slice(0, 150),
          },
          user.id
        );
      }
      await storageAdapter.addBookmark({
        type: "resource",
        title: disc.title,
        pathId: disc.id,
        source: `Community Q&A (${disc.domain})`,
      });
      setToast({ open: true, message: "Discussion saved to your bookmarks!", icon: "bookmark" });
    } catch {
      setToast({ open: true, message: "Saved to personal bookmarks." });
    }
  };

  // Edit Discussion
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDisc || !editTitle.trim() || !editContent.trim()) return;

    try {
      const updated = await updateDiscussion(editingDisc.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
      });

      if (updated) {
        setDiscussions((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        if (activeDiscussion?.id === updated.id) setActiveDiscussion(updated);
        setEditingDisc(null);
        setToast({ open: true, message: "Question successfully updated!", icon: "check_circle" });
      }
    } catch (err: any) {
      setToast({ open: true, message: err.message || "Failed to update question.", icon: "error" });
    }
  };

  // Delete Discussion
  const handleDeleteDiscussion = async (discId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this discussion?")) return;

    try {
      await deleteDiscussion(discId);
      setDiscussions((prev) => prev.filter((d) => d.id !== discId));
      if (activeDiscussion?.id === discId) setActiveDiscussion(null);
      setToast({ open: true, message: "Discussion deleted.", icon: "delete" });
    } catch {
      setToast({ open: true, message: "Failed to delete discussion.", icon: "error" });
    }
  };

  // Delete Reply
  const handleDeleteReply = async (discId: string, repId: string) => {
    if (!window.confirm("Are you sure you want to delete this reply?")) return;
    try {
      const updated = await deleteReply(discId, repId);
      if (updated) {
        setDiscussions((prev) => prev.map((d) => (d.id === discId ? updated : d)));
        setActiveDiscussion(updated);
        setToast({ open: true, message: "Reply deleted.", icon: "delete" });
      }
    } catch {
      setToast({ open: true, message: "Failed to delete reply.", icon: "error" });
    }
  };

  // Report Inappropriate Content
  const handleConfirmReport = async () => {
    if (!reportingDiscId || !reportReason.trim()) return;
    try {
      await reportDiscussion(reportingDiscId, reportReason.trim());
      setReportingDiscId(null);
      setReportReason("");
      setToast({ open: true, message: "Discussion flagged for academic moderation. Thank you.", icon: "flag" });
    } catch {
      setToast({ open: true, message: "Failed to submit report.", icon: "error" });
    }
  };

  const resetFilters = () => {
    setSelectedDomain("all");
    setStatusFilter("all");
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Filtered & Sorted discussions
  const filteredDiscussions = useMemo(() => {
    return discussions
      .filter((d) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          d.title.toLowerCase().includes(q) ||
          d.content.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)) ||
          d.authorName.toLowerCase().includes(q);

        const matchesDomain = selectedDomain === "all" || d.domain === selectedDomain;

        let matchesStatus = true;
        if (statusFilter === "solved") matchesStatus = d.isSolved;
        if (statusFilter === "unsolved") matchesStatus = !d.isSolved;
        if (statusFilter === "my_posts") matchesStatus = d.userId === currentUserId;

        return matchesSearch && matchesDomain && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "upvotes") return b.upvotes - a.upvotes;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [discussions, searchQuery, selectedDomain, statusFilter, sortBy, currentUserId]);

  // Paginated records
  const totalPages = Math.ceil(filteredDiscussions.length / ITEMS_PER_PAGE) || 1;
  const paginatedDiscussions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDiscussions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDiscussions, currentPage]);

  return (
    <div className="space-y-space-xl max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-surface-container-low to-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-surface-container-high/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-secondary text-2xl">forum</span>
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              Pencill Peer Scholar Forum
            </span>
          </div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary font-serif">
            Community Q&amp;A &amp; Collaborative Learning
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant mt-2 max-w-2xl leading-relaxed">
            Collaborate on challenging derivations, question foundational theorems, and discuss curriculum modules
            with fellow scholars. Authentic, database-backed interactions with verified timestamps and voting.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-sm flex items-center gap-2 shrink-0 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-base">add_comment</span>
          <span>Ask a Question</span>
        </button>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search questions by topic, concept, tag, or author..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
          />
        </div>

        {/* Domain Filter */}
        <select
          value={selectedDomain}
          onChange={(e) => {
            setSelectedDomain(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-xs text-on-surface font-semibold focus:outline-none shadow-xs"
        >
          <option value="all">All 12 Disciplines</option>
          {TAXONOMY_DOMAINS.map((dom) => (
            <option key={dom} value={dom}>
              {dom}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as any);
            setCurrentPage(1);
          }}
          className="px-3 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-xs text-on-surface font-semibold focus:outline-none shadow-xs"
        >
          <option value="all">All Questions</option>
          <option value="solved">Solved Threads</option>
          <option value="unsolved">Unanswered / Open</option>
          <option value="my_posts">My Questions</option>
        </select>

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-xs text-on-surface font-semibold focus:outline-none shadow-xs"
        >
          <option value="recent">Sort: Most Recent</option>
          <option value="upvotes">Sort: Most Upvoted</option>
        </select>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-6 bg-surface-container-lowest rounded-2xl border border-error/30 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-2xl shrink-0">error_outline</span>
            <div>
              <h3 className="text-xs font-bold text-primary">Connection Issue</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => loadDiscussions()}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Main Grid: Discussion List & Active Inspector */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high/60 shadow-xs space-y-3 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-surface-container-high" />
                    <div className="w-24 h-3 rounded bg-surface-container-high" />
                  </div>
                  <div className="w-20 h-4 rounded-full bg-surface-container-high" />
                </div>
                <div className="w-3/4 h-4 rounded bg-surface-container-high" />
                <div className="w-full h-8 rounded bg-surface-container-high" />
              </div>
            ))}
          </div>
          <div className="lg:col-span-5 hidden lg:block">
            <div className="bg-surface-container-lowest rounded-3xl p-6 border border-surface-container-high/60 shadow-xs h-64 animate-pulse" />
          </div>
        </div>
      ) : filteredDiscussions.length === 0 ? (
        <EmptyState
          icon={discussions.length === 0 ? "forum" : "search_off"}
          title={discussions.length === 0 ? "No Community Discussions Yet" : "No Matching Questions Found"}
          description={
            discussions.length === 0
              ? "Be the first scholar to ask an academic question, request a concept derivation, or share an insight with the community."
              : `No questions match your current search and filter selections. Try selecting "All 12 Disciplines" or clearing your query.`
          }
          actionText={discussions.length === 0 ? "Ask the First Question" : "Reset Filters"}
          onAction={discussions.length === 0 ? () => setIsModalOpen(true) : resetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Discussions Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between text-xs text-on-surface-variant px-1">
              <span>Showing {filteredDiscussions.length} discussions</span>
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

            {paginatedDiscussions.map((disc) => {
              const isSelected = activeDiscussion?.id === disc.id;
              const hasUpvoted = disc.upvoterUserIds?.includes(currentUserId);
              const isAuthor = disc.userId === currentUserId;

              return (
                <div
                  key={disc.id}
                  onClick={() => setActiveDiscussion(disc)}
                  className={`bg-surface-container-lowest rounded-2xl p-5 border transition-all cursor-pointer shadow-xs ${
                    isSelected
                      ? "border-primary ring-1 ring-primary/40 bg-primary/5"
                      : "border-surface-container-high/70 hover:border-surface-container-highest"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {disc.authorName.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-primary block truncate">
                          {disc.authorName}
                        </span>
                        <span className="text-[10px] text-on-surface-variant">
                          {new Date(disc.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container text-on-surface-variant uppercase tracking-wider">
                        {disc.domain}
                      </span>
                      {disc.isSolved && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
                          <span className="material-symbols-outlined text-[12px]">check_circle</span>
                          Solved
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-primary line-clamp-2 mt-1 font-serif">
                    {disc.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant line-clamp-2 mt-1 leading-relaxed">
                    {disc.content}
                  </p>

                  {/* Tags */}
                  {disc.tags && disc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {disc.tags.slice(0, 4).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface-container-low text-on-surface-variant border border-surface-container-high/30"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Card Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-surface-container-high/40 flex items-center justify-between text-xs text-on-surface-variant">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => handleToggleQuestionUpvote(disc.id, e)}
                        className={`inline-flex items-center gap-1 font-semibold transition-colors ${
                          hasUpvoted ? "text-primary font-bold" : "hover:text-primary"
                        }`}
                        title={hasUpvoted ? "Remove upvote" : "Upvote question"}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {hasUpvoted ? "thumb_up" : "thumb_up_off_alt"}
                        </span>
                        <span>{disc.upvotes}</span>
                      </button>

                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">mode_comment</span>
                        <span>{disc.replies?.length || disc.replyCount || 0}</span>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleBookmarkDiscussion(disc, e)}
                        className="hover:text-secondary inline-flex items-center gap-0.5"
                        title="Bookmark discussion"
                      >
                        <span className="material-symbols-outlined text-sm">bookmark_add</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isAuthor && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingDisc(disc);
                              setEditTitle(disc.title);
                              setEditContent(disc.content);
                            }}
                            className="text-[11px] font-semibold text-secondary hover:underline px-1.5 py-0.5"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteDiscussion(disc.id, e)}
                            className="text-[11px] font-semibold text-error hover:underline px-1.5 py-0.5"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReportingDiscId(disc.id);
                        }}
                        className="text-[11px] text-on-surface-variant hover:text-error px-1"
                        title="Report inappropriate content"
                      >
                        <span className="material-symbols-outlined text-xs">flag</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 px-1 text-xs">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-container-high text-on-surface font-semibold disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-on-surface-variant">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-container-high text-on-surface font-semibold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Active Discussion Thread & Replies (5 Cols) */}
          <div className="lg:col-span-5">
            {activeDiscussion ? (
              <div className="bg-surface-container-lowest rounded-3xl p-6 border border-surface-container-high/70 shadow-sm space-y-6 sticky top-24">
                {/* Active Header */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                      {activeDiscussion.domain}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleSolved(activeDiscussion.id)}
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                        activeDiscussion.isSolved
                          ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                          : "bg-surface-container text-on-surface-variant border-surface-container-high hover:bg-surface-container-high"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {activeDiscussion.isSolved ? "check_circle" : "check"}
                      </span>
                      <span>{activeDiscussion.isSolved ? "Solved" : "Mark as Solved"}</span>
                    </button>
                  </div>

                  <h2 className="font-bold text-lg text-primary font-serif">
                    {activeDiscussion.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-on-surface-variant">
                    <span className="font-semibold text-primary">{activeDiscussion.authorName}</span>
                    <span>·</span>
                    <span>{new Date(activeDiscussion.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container-high/40 text-xs text-on-surface leading-relaxed whitespace-pre-wrap">
                  {activeDiscussion.content}
                </div>

                {/* Reply Count & Section */}
                <div>
                  <h4 className="font-bold text-xs text-primary uppercase tracking-wider mb-3">
                    Replies &amp; Peer Explanations ({activeDiscussion.replies?.length || 0})
                  </h4>

                  {!activeDiscussion.replies || activeDiscussion.replies.length === 0 ? (
                    <p className="text-xs text-on-surface-variant italic py-3">
                      No answers yet. Share your conceptual breakdown or reference below!
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto no-scrollbar pr-1">
                      {activeDiscussion.replies.map((rep) => {
                        const repUpvoted = rep.upvoterUserIds?.includes(currentUserId);
                        const isRepAuthor = rep.userId === currentUserId;

                        return (
                          <div
                            key={rep.id}
                            className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                              rep.isAcceptedAnswer
                                ? "bg-emerald-500/5 border-emerald-500/40"
                                : "bg-surface-container-low border-surface-container-high/50"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-5 h-5 rounded-full bg-secondary/10 text-secondary font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {rep.authorName.slice(0, 1).toUpperCase()}
                                </span>
                                <span className="font-semibold text-primary truncate">
                                  {rep.authorName}
                                </span>
                                <span className="text-[10px] text-on-surface-variant">
                                  {new Date(rep.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>

                              {rep.isAcceptedAnswer && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                  Accepted Answer
                                </span>
                              )}
                            </div>

                            <p className="text-on-surface leading-relaxed whitespace-pre-wrap">
                              {rep.content}
                            </p>

                            <div className="pt-2 border-t border-surface-container-high/30 flex items-center justify-between text-[11px] text-on-surface-variant">
                              <button
                                type="button"
                                onClick={() => handleToggleReplyUpvote(activeDiscussion.id, rep.id)}
                                className={`inline-flex items-center gap-1 font-semibold ${
                                  repUpvoted ? "text-primary font-bold" : "hover:text-primary"
                                }`}
                              >
                                <span className="material-symbols-outlined text-[13px]">
                                  {repUpvoted ? "thumb_up" : "thumb_up_off_alt"}
                                </span>
                                <span>{rep.upvotes}</span>
                              </button>

                              <div className="flex items-center gap-2">
                                {(activeDiscussion.userId === currentUserId || isRepAuthor) && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSolved(activeDiscussion.id, rep.id)}
                                    className="text-secondary hover:underline font-semibold"
                                  >
                                    {rep.isAcceptedAnswer ? "Unmark Accepted" : "Accept as Answer"}
                                  </button>
                                )}
                                {isRepAuthor && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteReply(activeDiscussion.id, rep.id)}
                                    className="text-error hover:underline"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Reply Form */}
                <form
                  onSubmit={(e) => handleAddReply(activeDiscussion.id, e)}
                  className="space-y-2 pt-2 border-t border-surface-container-high/40"
                >
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Contribute your mathematical derivation, proof, or clarification..."
                    className="w-full p-3 rounded-xl bg-surface-container-low border border-surface-container-high/70 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isReplying || !replyText.trim()}
                      className="px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-xs disabled:opacity-40 transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {isReplying ? "progress_activity" : "send"}
                      </span>
                      <span>{isReplying ? "Posting..." : "Post Response"}</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 text-xs text-on-surface-variant">
                Select any question from the feed to view peer responses or post an answer.
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-surface-container-high/80 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                  Academic Discourse
                </span>
                <h3 className="font-bold text-xl text-primary font-serif mt-0.5">
                  Ask a Community Question
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-primary block mb-1">Target Discipline</label>
                <select
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container-high/70 text-on-surface font-semibold"
                >
                  {TAXONOMY_DOMAINS.map((dom) => (
                    <option key={dom} value={dom}>
                      {dom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-primary block mb-1">Question Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Intuitive geometric proof for Cauchy-Schwarz inequality"
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/70 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-semibold text-primary block mb-1">
                  Question Details &amp; Mathematical Context
                </label>
                <textarea
                  rows={4}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Describe your current step in the derivation, where the contradiction arises, or specific syllabus context..."
                  className="w-full p-3 rounded-xl bg-surface-container-low border border-surface-container-high/70 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-semibold text-primary block mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="Linear Algebra, Dot Product, Proofs"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container-high/70 text-on-surface placeholder:text-on-surface-variant"
                />
              </div>

              <div className="pt-3 border-t border-surface-container-high/40 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim() || !newContent.trim()}
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container font-semibold shadow-xs disabled:opacity-40 flex items-center gap-1.5"
                >
                  {isSubmitting && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
                  <span>{isSubmitting ? "Publishing..." : "Publish Question"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {editingDisc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-surface-container-high/80 shadow-2xl space-y-5">
            <h3 className="font-bold text-xl text-primary font-serif">Edit Question</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-primary block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/70"
                />
              </div>
              <div>
                <label className="font-semibold text-primary block mb-1">Details</label>
                <textarea
                  rows={4}
                  required
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-3 rounded-xl bg-surface-container-low border border-surface-container-high/70"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDisc(null)}
                  className="px-4 py-2 rounded-xl bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Inappropriate Content Dialog */}
      {reportingDiscId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-3xl p-6 max-w-md w-full border border-surface-container-high/80 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-base text-primary font-serif flex items-center gap-1.5">
              <span className="material-symbols-outlined text-error text-base">flag</span>
              <span>Report Community Content</span>
            </h3>
            <p className="text-on-surface-variant">
              Please specify the reason this discussion breaches academic standards or integrity policies:
            </p>
            <textarea
              rows={3}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="e.g. Spam, offensive language, off-topic promotion..."
              className="w-full p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/70"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReportingDiscId(null)}
                className="px-4 py-1.5 rounded-xl bg-surface-container font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reportReason.trim()}
                onClick={handleConfirmReport}
                className="px-4 py-1.5 rounded-xl bg-error text-white font-semibold disabled:opacity-40"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast
        isOpen={toast.open}
        message={toast.message}
        icon={toast.icon}
        onClose={() => setToast({ open: false, message: "" })}
      />
    </div>
  );
}
