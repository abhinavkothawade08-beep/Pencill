"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { storageAdapter, SpacedCardRecord } from "@/lib/storage/storageAdapter";
import {
  ReviewRating,
  scheduleCard,
  calculateRetrievability,
  calculateForgettingRisk,
  harvestCardsFromPath,
} from "@/lib/memory-engine";
import Toast from "@/components/ui/Toast";
import EmptyState from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";

export default function SmartReviewDashboardPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState<SpacedCardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"due" | "all" | "risk" | "mastered">("due");

  // Interactive Review Session State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionCards, setSessionCards] = useState<SpacedCardRecord[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompletedCount, setSessionCompletedCount] = useState(0);

  // Toast
  const [toast, setToast] = useState<{ open: boolean; message: string; icon?: string }>({
    open: false,
    message: "",
    icon: "check_circle",
  });

  const loadMemoryCards = useCallback(async () => {
    setLoading(true);
    try {
      let storedCards = await storageAdapter.getSpacedCards();

      // If no cards are stored, attempt harvesting only from user's active enrolled courses
      if (!storedCards || storedCards.length === 0) {
        let activeCourses: any[] = [];
        if (user?.id) {
          const { getUserEnrollments } = await import("@/services/supabase/enrollmentService");
          const enrollments = await getUserEnrollments(user.id);
          activeCourses = enrollments.map((e) => e.course).filter(Boolean);
        } else {
          activeCourses = await storageAdapter.getSavedPaths();
        }

        const harvested: SpacedCardRecord[] = [];
        for (const path of activeCourses) {
          const pathCards = harvestCardsFromPath(path);
          harvested.push(...pathCards);
        }
        if (harvested.length > 0) {
          await storageAdapter.saveSpacedCards(harvested);
          storedCards = harvested;
        }
      }

      setCards(storedCards || []);
    } catch (err) {
      console.error("Failed to load spaced repetition cards:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadMemoryCards();
  }, [loadMemoryCards]);

  useEffect(() => {
    const handleAuthReset = () => {
      setCards([]);
      setCurrentCardIdx(0);
      setIsFlipped(false);
    };
    window.addEventListener("pencill:auth-state-reset", handleAuthReset);
    return () => window.removeEventListener("pencill:auth-state-reset", handleAuthReset);
  }, []);

  const now = new Date();

  // Categorize cards
  const dueCards = cards.filter((c) => new Date(c.dueDate) <= now);
  const atRiskCards = cards.filter((c) => {
    const risk = calculateForgettingRisk(c, now);
    return risk.riskTier === "critical" || risk.riskTier === "high";
  });
  const masteredCards = cards.filter((c) => {
    const r = calculateRetrievability(c, now);
    return r >= 0.85 && (c.stability || 0) >= 7;
  });

  // Aggregate Metrics
  const avgStability = cards.length > 0
    ? Math.round((cards.reduce((acc, c) => acc + (c.stability || 1), 0) / cards.length) * 10) / 10
    : 1.0;

  const avgRetention = cards.length > 0
    ? Math.round(
        (cards.reduce((acc, c) => acc + calculateRetrievability(c, now), 0) / cards.length) * 100
      )
    : 100;

  // Start Review Session
  const handleStartReview = (cardSubset?: SpacedCardRecord[]) => {
    const target = cardSubset || (dueCards.length > 0 ? dueCards : cards);
    if (target.length === 0) {
      setToast({
        open: true,
        message: "No memory cards due for review! All concepts are currently well-retained.",
        icon: "verified",
      });
      return;
    }
    setSessionCards(target);
    setCurrentCardIdx(0);
    setIsFlipped(false);
    setSessionCompletedCount(0);
    setIsSessionActive(true);
  };

  // Grade Card Recall
  const handleRateCard = async (rating: ReviewRating) => {
    const card = sessionCards[currentCardIdx];
    if (!card) return;

    const updated = scheduleCard(card, rating, new Date());
    await storageAdapter.updateSpacedCard(updated.id, updated);

    // Update state
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSessionCompletedCount((prev) => prev + 1);

    if (currentCardIdx + 1 < sessionCards.length) {
      setCurrentCardIdx((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      // Completed session
      setIsSessionActive(false);
      setToast({
        open: true,
        message: `Review session complete! You reinforced ${sessionCompletedCount + 1} core concepts.`,
        icon: "celebration",
      });
    }
  };

  const currentActiveCard = sessionCards[currentCardIdx];

  return (
    <div className="space-y-space-xl max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-2xl">psychology</span>
            <h1 className="font-headline-lg text-headline-lg text-primary font-serif">
              Smart Spaced Retention & Memory Science
            </h1>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Free Spaced Repetition Scheduling (FSRS) calculating personalized memory decay curves and daily review targets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadMemoryCards}
            className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface-variant flex items-center gap-1.5 transition-colors border border-surface-container-high/60"
            title="Refresh memory schedule"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            <span>Sync Decks</span>
          </button>

          <button
            type="button"
            onClick={() => handleStartReview()}
            className="px-5 py-2.5 rounded-xl bg-secondary text-on-secondary hover:bg-secondary-container text-sm font-semibold shadow-sm flex items-center gap-2 transition-transform hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-base">play_arrow</span>
            <span>Review Due Today ({dueCards.length})</span>
          </button>
        </div>
      </div>

      {/* Memory Science Telemetry Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high/60 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">schedule</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
              Due For Review Today
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-primary font-sans">{dueCards.length}</span>
              <span className="text-xs text-on-surface-variant">of {cards.length} cards</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high/60 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">trending_up</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
              Estimated Retention
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-primary font-sans">{avgRetention}%</span>
              <span className="text-xs text-secondary font-medium">FSRS Target 90%</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high/60 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">warning</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
              At Forgetting Risk
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-error font-sans">{atRiskCards.length}</span>
              <span className="text-xs text-on-surface-variant">decaying concepts</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high/60 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-surface-container text-on-surface flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">verified</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
              Mastered Anchors
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-primary font-sans">{masteredCards.length}</span>
              <span className="text-xs text-on-surface-variant">stability &gt; 7d</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Filter */}
      <div className="flex items-center gap-2 border-b border-surface-container-high/60 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("due")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === "due"
              ? "bg-primary text-on-primary shadow-xs"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-sm">schedule</span>
          <span>Due Today ({dueCards.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("risk")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === "risk"
              ? "bg-primary text-on-primary shadow-xs"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-sm">warning</span>
          <span>At Risk of Forgetting ({atRiskCards.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("mastered")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === "mastered"
              ? "bg-primary text-on-primary shadow-xs"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-sm">verified</span>
          <span>Mastered ({masteredCards.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === "all"
              ? "bg-primary text-on-primary shadow-xs"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-sm">style</span>
          <span>All Deck Cards ({cards.length})</span>
        </button>
      </div>

      {/* Card Grid */}
      {(() => {
        const displayedCards =
          activeTab === "due"
            ? dueCards
            : activeTab === "risk"
            ? atRiskCards
            : activeTab === "mastered"
            ? masteredCards
            : cards;

        if (loading) {
          return (
            <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-surface-container-high/60">
              <span className="material-symbols-outlined animate-spin text-3xl text-secondary">
                progress_activity
              </span>
              <p className="text-xs text-on-surface-variant mt-2">Computing memory retention schedules...</p>
            </div>
          );
        }

        if (displayedCards.length === 0) {
          return (
            <EmptyState
              title={activeTab === "due" ? "All Caught Up!" : "No Flashcards Found"}
              description={
                activeTab === "due"
                  ? "You have zero overdue reviews. Great job maintaining your memory stability!"
                  : "Enroll in courses with formula flashcards to build your personal memory retention deck."
              }
              actionText="Explore Learning Paths"
              actionHref="/explore"
              icon="psychology"
            />
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedCards.map((card) => {
              const r = calculateRetrievability(card, now);
              const risk = calculateForgettingRisk(card, now);
              const isDue = new Date(card.dueDate) <= now;

              return (
                <div
                  key={card.id}
                  className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high/60 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container text-on-surface-variant uppercase tracking-wider">
                        {card.cardType}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            risk.riskTier === "critical"
                              ? "bg-error"
                              : risk.riskTier === "high"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                        />
                        <span className="text-[11px] font-medium text-on-surface-variant">
                          {Math.round(r * 100)}% Retained
                        </span>
                      </div>
                    </div>

                    <h3 className="font-headline-sm text-base font-bold text-primary line-clamp-2">
                      {card.concept}
                    </h3>

                    <p className="text-xs text-on-surface-variant mt-2 line-clamp-3 bg-surface-container-low p-2.5 rounded-xl border border-surface-container-high/30">
                      {card.prompt}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-surface-container-high/40 flex items-center justify-between text-xs text-on-surface-variant">
                    <span>Stability: {card.stability || 1.0}d</span>
                    <span className={isDue ? "font-semibold text-secondary" : ""}>
                      {isDue ? "Due Now" : `Due in ${Math.max(1, Math.round((new Date(card.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))}d`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Interactive Review Modal */}
      {isSessionActive && currentActiveCard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-surface-container-high/60 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">psychology</span>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Reviewing {currentCardIdx + 1} of {sessionCards.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsSessionActive(false)}
                aria-label="Close review"
                className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Flashcard Flipper */}
            <div className="my-6 flex-1 overflow-y-auto">
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="min-h-[220px] p-6 rounded-2xl bg-surface-container-low border border-surface-container-high/60 flex flex-col items-center justify-center text-center cursor-pointer shadow-inner transition-transform hover:scale-[1.01]"
              >
                {!isFlipped ? (
                  <>
                    <span className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                      Prompt / Question
                    </span>
                    <h3 className="text-lg font-bold text-primary mb-3">
                      {currentActiveCard.concept}
                    </h3>
                    <p className="text-sm text-on-surface-variant font-mono">
                      {currentActiveCard.prompt}
                    </p>
                    <span className="text-xs text-on-surface-variant mt-6 flex items-center gap-1 opacity-75">
                      <span className="material-symbols-outlined text-sm">flip</span>
                      Click card to reveal memory anchor
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                      Memory Anchor / Formulation
                    </span>
                    <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-high/60 text-sm font-mono text-primary whitespace-pre-wrap max-w-full">
                      {currentActiveCard.solution}
                    </div>
                    <span className="text-xs text-on-surface-variant mt-4">
                      Rate how readily you recalled this concept:
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* FSRS Rating Buttons */}
            {isFlipped ? (
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-surface-container-high/40">
                <button
                  type="button"
                  onClick={() => handleRateCard(ReviewRating.Again)}
                  className="p-2.5 rounded-xl bg-error/10 hover:bg-error/20 text-error font-semibold text-xs flex flex-col items-center gap-1 transition-colors"
                >
                  <span>Again</span>
                  <span className="text-[10px] opacity-75">&lt; 1d</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRateCard(ReviewRating.Hard)}
                  className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 font-semibold text-xs flex flex-col items-center gap-1 transition-colors"
                >
                  <span>Hard</span>
                  <span className="text-[10px] opacity-75">+1d</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRateCard(ReviewRating.Good)}
                  className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 font-semibold text-xs flex flex-col items-center gap-1 transition-colors"
                >
                  <span>Good</span>
                  <span className="text-[10px] opacity-75">+3d</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRateCard(ReviewRating.Easy)}
                  className="p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs flex flex-col items-center gap-1 transition-colors"
                >
                  <span>Easy</span>
                  <span className="text-[10px] opacity-75">+7d</span>
                </button>
              </div>
            ) : (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsFlipped(true)}
                  className="px-6 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-xs"
                >
                  Show Answer / Solution
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.open && (
        <Toast
          message={toast.message}
          icon={toast.icon}
          isOpen={toast.open}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
        />
      )}
    </div>
  );
}
