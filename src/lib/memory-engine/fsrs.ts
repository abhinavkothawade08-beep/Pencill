/**
 * Pencill Spaced Repetition & Memory Science Engine
 * Based on Free Spaced Repetition Scheduler (FSRS) principles and memory decay curves.
 * 
 * Equations:
 * Retrievability: R(t, S) = (1 + FACTOR * (t / S)) ^ DECAY
 * Stability: S updates based on recall difficulty and response tier.
 * Interval: I = S / FACTOR * (R ^ (1/DECAY) - 1)
 */

import { SpacedCardRecord } from '@/lib/storage/storageAdapter';
import { LearningPath, Module } from '@/types';

export enum ReviewRating {
  Again = 1, // Complete blackout / failed recall
  Hard = 2,  // Recalled with significant hesitation
  Good = 3,  // Successful, standard recall
  Easy = 4,  // Instant, confident mastery
}

const DECAY = -0.5;
const FACTOR = 19 / 81; // Standard FSRS power-law parameter

/**
 * Calculates retrievability (0.0 to 1.0) for a card at a given point in time.
 * @param card The spaced repetition card record
 * @param asOfDate Target evaluation date (defaults to now)
 */
export function calculateRetrievability(card: SpacedCardRecord, asOfDate: Date = new Date()): number {
  if (!card.lastReviewedAt) {
    // Brand new card
    return 1.0;
  }

  const lastReviewTime = new Date(card.lastReviewedAt).getTime();
  const currentTime = asOfDate.getTime();
  const elapsedDays = Math.max(0, (currentTime - lastReviewTime) / (1000 * 60 * 60 * 24));

  const stability = Math.max(0.1, card.stability || 1.0);
  const retrievability = Math.pow(1 + FACTOR * (elapsedDays / stability), DECAY);
  return Math.min(1.0, Math.max(0.0, retrievability));
}

/**
 * Evaluates forgetting risk for the given concept.
 */
export function calculateForgettingRisk(
  card: SpacedCardRecord,
  asOfDate: Date = new Date()
): {
  riskScore: number; // 0 (no risk) to 100 (critical risk)
  riskTier: 'minimal' | 'low' | 'moderate' | 'high' | 'critical';
  retrievability: number;
} {
  const r = calculateRetrievability(card, asOfDate);
  const riskScore = Math.round((1 - r) * 100);

  let riskTier: 'minimal' | 'low' | 'moderate' | 'high' | 'critical' = 'minimal';
  if (riskScore >= 75) riskTier = 'critical';
  else if (riskScore >= 50) riskTier = 'high';
  else if (riskScore >= 30) riskTier = 'moderate';
  else if (riskScore >= 15) riskTier = 'low';

  return { riskScore, riskTier, retrievability: Math.round(r * 100) / 100 };
}

/**
 * Schedules the next review interval and stability based on user recall feedback.
 */
export function scheduleCard(
  card: SpacedCardRecord,
  rating: ReviewRating,
  reviewDate: Date = new Date()
): SpacedCardRecord {
  const currentStability = Math.max(0.2, card.stability || 1.0);
  const currentDifficulty = Math.max(1, Math.min(10, card.difficulty || 5.0));
  const currentReps = card.repetitions || 0;
  const currentLapses = card.lapses || 0;

  let newStability: number;
  let newDifficulty: number;
  let newReps: number;
  let newLapses: number;

  switch (rating) {
    case ReviewRating.Again:
      // Failure to recall
      newStability = Math.max(0.2, currentStability * 0.25);
      newDifficulty = Math.min(10, currentDifficulty + 0.8);
      newReps = 0;
      newLapses = currentLapses + 1;
      break;

    case ReviewRating.Hard:
      // Hesitant recall
      newStability = Math.max(currentStability * 1.1, currentStability + 0.3);
      newDifficulty = Math.min(10, currentDifficulty + 0.3);
      newReps = currentReps + 1;
      newLapses = currentLapses;
      break;

    case ReviewRating.Good:
      // Standard optimal recall
      newStability = Math.max(currentStability * 2.2, currentStability + 1.2);
      newDifficulty = Math.max(1, currentDifficulty - 0.1);
      newReps = currentReps + 1;
      newLapses = currentLapses;
      break;

    case ReviewRating.Easy:
      // Mastered / rapid recall
      newStability = Math.max(currentStability * 3.6, currentStability + 3.0);
      newDifficulty = Math.max(1, currentDifficulty - 0.5);
      newReps = currentReps + 1;
      newLapses = currentLapses;
      break;
  }

  // Calculate interval in days based on desired 90% target retention
  const targetRetention = 0.90;
  const intervalDays = Math.max(
    rating === ReviewRating.Again ? 0.2 : 1,
    Math.round((newStability / FACTOR) * (Math.pow(targetRetention, 1 / DECAY) - 1))
  );

  const nextDueDate = new Date(reviewDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  return {
    ...card,
    stability: Math.round(newStability * 100) / 100,
    difficulty: Math.round(newDifficulty * 100) / 100,
    repetitions: newReps,
    lapses: newLapses,
    lastRating: rating,
    dueDate: nextDueDate.toISOString(),
    lastReviewedAt: reviewDate.toISOString(),
  };
}

/**
 * Harvests all formula flashcards and checkpoint quiz concepts from an enrolled course
 * into initial SpacedCardRecords ready for spaced repetition scheduling.
 */
export function harvestCardsFromPath(course: LearningPath): SpacedCardRecord[] {
  const cards: SpacedCardRecord[] = [];
  if (!course?.modules) return cards;

  course.modules.forEach((mod: Module, mIdx: number) => {
    // 1. Harvest formula flashcards
    if (mod.flashcards && Array.isArray(mod.flashcards)) {
      mod.flashcards.forEach((fc: any, cIdx: number) => {
        const conceptTitle = fc.concept || fc.title || `${mod.title} Concept ${cIdx + 1}`;
        const solutionText = fc.formula || fc.explanation || fc.definition || 'Formula anchor';
        const promptText = fc.variables || fc.prompt || `What is the core formulation and meaning of ${conceptTitle}?`;

        cards.push({
          id: `fsrs-card-${course.id}-${mod.id}-fc-${cIdx}`,
          courseId: course.id,
          moduleId: mod.id,
          concept: conceptTitle,
          prompt: promptText,
          solution: solutionText,
          cardType: 'formula',
          stability: 1.0,
          difficulty: 5.0,
          repetitions: 0,
          lapses: 0,
          dueDate: new Date().toISOString(), // Due immediately on enrollment
          createdAt: new Date().toISOString(),
        });
      });
    }

    // 2. Harvest checkpoint quiz questions as diagnostic cards
    if (mod.checkpointQuestions && Array.isArray(mod.checkpointQuestions)) {
      mod.checkpointQuestions.slice(0, 3).forEach((q: any, qIdx: number) => {
        const correctOpt = q.options?.find((o: any) => o.id === q.correctOptionId)?.text || 'Correct solution';
        cards.push({
          id: `fsrs-card-${course.id}-${mod.id}-qq-${qIdx}`,
          courseId: course.id,
          moduleId: mod.id,
          concept: `${mod.title}: Milestone Check`,
          prompt: q.prompt,
          solution: `${correctOpt}\n\nExplanation: ${q.explanation}`,
          cardType: 'quiz_revisit',
          stability: 1.5,
          difficulty: 5.5,
          repetitions: 0,
          lapses: 0,
          dueDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
      });
    }
  });

  return cards;
}
