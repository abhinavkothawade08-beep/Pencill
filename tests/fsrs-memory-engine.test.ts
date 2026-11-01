import test from 'node:test';
import assert from 'node:assert/strict';
import {
  scheduleCard,
  calculateRetrievability,
  calculateForgettingRisk,
  ReviewRating,
} from '../src/lib/memory-engine/fsrs';
import { SpacedCardRecord } from '../src/lib/storage/storageAdapter';

test('FSRS Memory Engine Suite', async (t) => {
  await t.test('calculateRetrievability: calculates power law decay correctly', () => {
    const card: SpacedCardRecord = {
      id: 'c1',
      courseId: 'course-1',
      concept: 'Vector Search',
      prompt: 'Explain cosine similarity',
      solution: 'Dot product divided by the product of magnitudes',
      cardType: 'concept',
      stability: 10,
      difficulty: 5,
      repetitions: 2,
      lapses: 0,
      lastReviewedAt: new Date(Date.now() - 10 * 86400000).toISOString(), // 10 days ago
      dueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    // Elapsed 10 days with S=10
    const r10 = calculateRetrievability(card);
    assert.ok(r10 < 1.0 && r10 > 0.85, `Expected ~0.90, got ${r10}`);

    // Brand new card without lastReviewedAt
    const freshCard: SpacedCardRecord = {
      ...card,
      lastReviewedAt: undefined,
    };
    assert.equal(calculateRetrievability(freshCard), 1.0);

    // Old card: 100 days elapsed
    const oldCard: SpacedCardRecord = {
      ...card,
      lastReviewedAt: new Date(Date.now() - 100 * 86400000).toISOString(),
    };
    const r100 = calculateRetrievability(oldCard);
    assert.ok(r100 < 0.6, `Expected < 0.6, got ${r100}`);
  });

  await t.test('calculateForgettingRisk: categorizes risk tiers based on retention probability', () => {
    const baseCard: SpacedCardRecord = {
      id: 'c2',
      courseId: 'course-1',
      concept: 'HNSW Indexing',
      prompt: 'What is M parameter in HNSW?',
      solution: 'Max number of bidirectional links per element',
      cardType: 'concept',
      stability: 5,
      difficulty: 6,
      repetitions: 1,
      lapses: 0,
      dueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    // Reviewed 1 hour ago -> low/minimal risk
    const recentCard: SpacedCardRecord = {
      ...baseCard,
      lastReviewedAt: new Date(Date.now() - 3600000).toISOString(),
    };
    const recentRisk = calculateForgettingRisk(recentCard);
    assert.ok(['minimal', 'low'].includes(recentRisk.riskTier));

    // Reviewed 60 days ago with stability 5 -> moderate/high risk
    const moderateRiskCard: SpacedCardRecord = {
      ...baseCard,
      lastReviewedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    };
    const modRisk = calculateForgettingRisk(moderateRiskCard);
    assert.ok(['moderate', 'high'].includes(modRisk.riskTier));

    // Reviewed 365 days ago with stability 5 -> critical risk
    const neglectedCard: SpacedCardRecord = {
      ...baseCard,
      lastReviewedAt: new Date(Date.now() - 365 * 86400000).toISOString(),
    };
    const criticalRisk = calculateForgettingRisk(neglectedCard);
    assert.equal(criticalRisk.riskTier, 'critical');
  });

  await t.test('scheduleCard: initial card scheduling with rating Good', () => {
    const freshCard: SpacedCardRecord = {
      id: 'card-1',
      courseId: 'course-algo',
      concept: 'Binary Search',
      prompt: 'What is the runtime complexity of binary search on a sorted array of size N?',
      solution: 'O(log N)',
      cardType: 'flashcard',
      stability: 1.0,
      difficulty: 5.0,
      repetitions: 0,
      lapses: 0,
      dueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const scheduled = scheduleCard(freshCard, ReviewRating.Good);

    assert.equal(scheduled.repetitions, 1);
    assert.equal(scheduled.lapses, 0);
    assert.ok(scheduled.stability > freshCard.stability, 'Stability should increase after a Good review');
    assert.ok(new Date(scheduled.dueDate).getTime() > Date.now(), 'Next review date must be in the future');
  });

  await t.test('scheduleCard: failure (rating Again) triggers lapse and shortens stability', () => {
    const matureCard: SpacedCardRecord = {
      id: 'card-2',
      courseId: 'course-algo',
      concept: 'QuickSort Partitioning',
      prompt: 'Explain the Lomuto partition scheme.',
      solution: 'Chooses the last element as pivot and swaps elements smaller than pivot to the left.',
      cardType: 'concept',
      stability: 15.0,
      difficulty: 6.0,
      repetitions: 5,
      lapses: 0,
      lastReviewedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      dueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const failed = scheduleCard(matureCard, ReviewRating.Again);

    assert.equal(failed.repetitions, 0, 'Repetitions should reset on failure');
    assert.equal(failed.lapses, 1, 'Lapses should increment');
    assert.ok(failed.stability < matureCard.stability, 'Stability must decrease upon lapse');
    assert.ok(failed.difficulty > matureCard.difficulty, 'Difficulty should increase on failure');
  });
});
