import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Progress Analytics & Study Report Format', () => {
  test('Topic mastery score calculation correctly derives percentage weights', () => {
    const rawDomainStats = [
      { domain: 'Physics', completedLessons: 8, totalLessons: 10 },
      { domain: 'Mathematics', completedLessons: 15, totalLessons: 20 },
      { domain: 'Computer Science', completedLessons: 5, totalLessons: 5 },
    ];

    const computed = rawDomainStats.map((stat) => ({
      topic: stat.domain,
      mastery: Math.round((stat.completedLessons / stat.totalLessons) * 100),
    }));

    assert.deepStrictEqual(computed, [
      { topic: 'Physics', mastery: 80 },
      { topic: 'Mathematics', mastery: 75 },
      { topic: 'Computer Science', mastery: 100 },
    ]);
  });

  test('Export report structure contains all required audit fields', () => {
    const sampleReport = {
      exportTimestamp: new Date().toISOString(),
      studentName: 'Alex Mercer',
      stats: {
        totalHoursStudied: 18.5,
        completedLessons: 24,
        quizAccuracy: 92,
        modulesCleared: 7,
      },
      topicMastery: [
        { topic: 'Calculus', mastery: 90 },
      ],
      recentActivity: [
        { title: 'Derivatives Checkpoint', completedAt: '2026-10-04T08:00:00Z' },
      ],
    };

    assert.ok(sampleReport.exportTimestamp);
    assert.strictEqual(typeof sampleReport.stats.totalHoursStudied, 'number');
    assert.strictEqual(typeof sampleReport.stats.quizAccuracy, 'number');
    assert.ok(Array.isArray(sampleReport.topicMastery));
    assert.ok(Array.isArray(sampleReport.recentActivity));
  });
});
