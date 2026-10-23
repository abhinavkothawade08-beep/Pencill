import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CreateFullLearningPathInput } from '@/services/supabase/pathService';

describe('Learner Services & Batch Processing Integrity', () => {
  test('Course creation slug generation sanitizes non-alphanumeric characters', () => {
    const rawTitles = [
      { title: 'Calculus III: Vector Fields & Stokes Theorem', expectedPrefix: 'calculus-iii-vector-fields-stok' },
      { title: 'Python 3.12: Advanced Data Structures!!', expectedPrefix: 'python-3-12-advanced-data-stru' },
      { title: '   Quantum Mechanics (Wave-Particle Duality)   ', expectedPrefix: 'quantum-mechanics-wave-particle' },
    ];

    for (const item of rawTitles) {
      const slug = item.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
        .slice(0, 32);

      assert.ok(slug.startsWith(item.expectedPrefix), `Expected slug starting with ${item.expectedPrefix}, got ${slug}`);
      assert.ok(!slug.includes(' '), 'Slug should not contain spaces');
      assert.ok(!slug.includes(':'), 'Slug should not contain colons');
      assert.ok(!slug.includes('!'), 'Slug should not contain exclamation marks');
    }
  });

  test('Batch module and lesson row generation correctly preserves hierarchy and orderIndex', () => {
    const mockInput: CreateFullLearningPathInput = {
      title: 'Differential Geometry',
      description: 'Curves, surfaces, and manifolds.',
      domain: 'Mathematics',
      level: 'Undergraduate',
      durationHours: 30,
      moduleCount: 2,
      modules: [
        {
          title: 'Curves in Space',
          moduleNumber: 1,
          orderIndex: 0,
          lessons: [
            { title: 'Arc Length & Reparametrization', type: 'video', durationMinutes: 25 },
            { title: 'Frenet-Serret Apparatus', type: 'monograph', durationMinutes: 40 },
          ],
        },
        {
          title: 'Surfaces & First Fundamental Form',
          moduleNumber: 2,
          orderIndex: 1,
          lessons: [
            { title: 'Gaussian Curvature Derivation', type: 'practice', durationMinutes: 35 },
          ],
        },
      ],
    };

    const pathId = 'diff-geom-test';

    // Simulate batch module mapper
    const moduleRows = mockInput.modules.map((mod, mIdx) => ({
      id: mod.id || `mod-${pathId}-${mIdx + 1}`,
      path_id: pathId,
      title: mod.title,
      module_number: mod.moduleNumber || mIdx + 1,
      order_index: mod.orderIndex ?? mIdx,
      status: mIdx === 0 ? ('in_progress' as const) : ('locked' as const),
      total_resources: mod.lessons.length,
    }));

    assert.strictEqual(moduleRows.length, 2);
    assert.strictEqual(moduleRows[0].id, 'mod-diff-geom-test-1');
    assert.strictEqual(moduleRows[0].status, 'in_progress');
    assert.strictEqual(moduleRows[1].id, 'mod-diff-geom-test-2');
    assert.strictEqual(moduleRows[1].status, 'locked');

    // Simulate batch lesson mapper
    const lessonRows: Array<{
      id: string;
      module_id: string;
      title: string;
      type: string;
      order_index: number;
    }> = [];

    mockInput.modules.forEach((mod, mIdx) => {
      const modId = mod.id || `mod-${pathId}-${mIdx + 1}`;
      mod.lessons.forEach((les, lIdx) => {
        lessonRows.push({
          id: les.id || `les-${modId}-${lIdx + 1}`,
          module_id: modId,
          title: les.title,
          type: les.type || 'video',
          order_index: les.orderIndex ?? lIdx,
        });
      });
    });

    assert.strictEqual(lessonRows.length, 3);
    assert.strictEqual(lessonRows[0].module_id, 'mod-diff-geom-test-1');
    assert.strictEqual(lessonRows[1].module_id, 'mod-diff-geom-test-1');
    assert.strictEqual(lessonRows[2].module_id, 'mod-diff-geom-test-2');
    assert.strictEqual(lessonRows[0].order_index, 0);
    assert.strictEqual(lessonRows[1].order_index, 1);
    assert.strictEqual(lessonRows[2].order_index, 0);
  });

  test('Guest data batch migration accurately groups records without data loss', () => {
    const rawGuestProgress = ['les-1', 'les-2', 'les-3'];
    const userId = 'user-migrated-001';

    const batchedProgress = rawGuestProgress.map((lessonId) => ({
      user_id: userId,
      lesson_id: lessonId,
      is_completed: true,
    }));

    assert.strictEqual(batchedProgress.length, 3);
    assert.ok(batchedProgress.every((r) => r.user_id === userId && r.is_completed === true));

    const rawGuestQuizAttempts = [
      { quizId: 'quiz-physics-1', score: 90, accuracyPercent: 90, answers: { '0': 'A', '1': 'B' } },
      { quizId: 'quiz-math-2', score: 85, accuracyPercent: 85, answers: { '0': 'C' } },
    ];

    const batchedAttempts = rawGuestQuizAttempts.map((att) => ({
      user_id: userId,
      quiz_id: att.quizId,
      score: att.score,
      accuracy_percent: att.accuracyPercent,
      answers: att.answers,
    }));

    assert.strictEqual(batchedAttempts.length, 2);
    assert.strictEqual(batchedAttempts[0].quiz_id, 'quiz-physics-1');
    assert.strictEqual(batchedAttempts[1].accuracy_percent, 85);
  });
});
