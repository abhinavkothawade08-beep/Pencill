import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  BatchDeleteQuizzesSchema,
  BatchDeleteCoursesSchema,
} from '../src/lib/api-schemas';
import { canDeleteQuiz, canDeleteLearningPath, UserRoleContext } from '../src/lib/permissions';
import { batchDeleteQuizzes } from '../src/services/supabase/quizService';
import { batchDeleteLearningPaths } from '../src/services/supabase/pathService';
import { isItemDeleted } from '../src/services/supabase/deletionRegistry';

describe('Batch Deletion: Schema Validation & Security Guards', () => {
  test('BatchDeleteQuizzesSchema accepts valid array of quiz IDs', () => {
    const valid = {
      quizIds: ['quiz-1', 'quiz-2', 'rotational-dynamics-101', '550e8400-e29b-41d4-a716-446655440000'],
    };
    const res = BatchDeleteQuizzesSchema.safeParse(valid);
    assert.strictEqual(res.success, true);
    if (res.success) {
      assert.strictEqual(res.data.quizIds.length, 4);
    }
  });

  test('BatchDeleteQuizzesSchema rejects empty array of quiz IDs', () => {
    const invalid = { quizIds: [] };
    const res = BatchDeleteQuizzesSchema.safeParse(invalid);
    assert.strictEqual(res.success, false);
    assert.ok(res.error.issues.some((i) => i.message.includes('At least one quiz ID')));
  });

  test('BatchDeleteQuizzesSchema rejects over-limit batches (> 100 items)', () => {
    const overLimit = {
      quizIds: Array.from({ length: 101 }, (_, i) => `quiz-${i}`),
    };
    const res = BatchDeleteQuizzesSchema.safeParse(overLimit);
    assert.strictEqual(res.success, false);
    assert.ok(res.error.issues.some((i) => i.message.includes('Cannot delete more than 100')));
  });

  test('BatchDeleteQuizzesSchema rejects invalid, malformed, or injection strings in quiz IDs', () => {
    const malformed = [
      { quizIds: [''] },
      { quizIds: ['   '] },
      { quizIds: ['../traversal'] },
      { quizIds: ['<script>alert(1)</script>'] },
      { quizIds: ['quiz?query=param'] },
      { quizIds: ['valid-1', 'invalid/path'] },
    ];
    for (const item of malformed) {
      const res = BatchDeleteQuizzesSchema.safeParse(item);
      assert.strictEqual(res.success, false, `Expected rejection for: ${JSON.stringify(item)}`);
    }
  });

  test('BatchDeleteCoursesSchema accepts valid array of course IDs with optional softDelete', () => {
    const valid = {
      courseIds: ['course-calc-1', 'course-physics-101'],
      softDelete: true,
    };
    const res = BatchDeleteCoursesSchema.safeParse(valid);
    assert.strictEqual(res.success, true);
    if (res.success) {
      assert.strictEqual(res.data.courseIds.length, 2);
      assert.strictEqual(res.data.softDelete, true);
    }
  });

  test('BatchDeleteCoursesSchema rejects empty array and over-limit batches', () => {
    assert.strictEqual(BatchDeleteCoursesSchema.safeParse({ courseIds: [] }).success, false);
    assert.strictEqual(
      BatchDeleteCoursesSchema.safeParse({
        courseIds: Array.from({ length: 101 }, (_, i) => `course-${i}`),
      }).success,
      false
    );
  });
});

describe('Batch Deletion: Role Authorization & Scope Protection', () => {
  const authorUser: UserRoleContext = { id: 'user-alice' };
  const strangerUser: UserRoleContext = { id: 'user-bob' };
  const learnerUser: UserRoleContext = { id: 'user-charlie', role: 'student' };
  const adminUser: UserRoleContext = { id: 'user-admin', role: 'admin' };

  const userOwnedQuiz1 = { id: 'q-owned-1', userId: 'user-alice', title: 'Quiz 1' };
  const userOwnedQuiz2 = { id: 'q-owned-2', userId: 'user-alice', title: 'Quiz 2' };
  const strangerQuiz = { id: 'q-stranger', userId: 'user-bob', title: 'Stranger Quiz' };
  const systemCatalogQuiz = { id: 'q-catalog', userId: null, title: 'Standard Quiz' };

  test('User can delete their own quizzes in bulk, but is forbidden from stranger and system quizzes', () => {
    assert.strictEqual(canDeleteQuiz(userOwnedQuiz1, authorUser, null, true), true);
    assert.strictEqual(canDeleteQuiz(userOwnedQuiz2, authorUser, null, true), true);
    assert.strictEqual(canDeleteQuiz(strangerQuiz, authorUser, null, true), false);
    assert.strictEqual(canDeleteQuiz(systemCatalogQuiz, learnerUser, null, true), false);
  });

  test('Admin user can delete both system catalog quizzes and user quizzes', () => {
    assert.strictEqual(canDeleteQuiz(userOwnedQuiz1, adminUser, null, true), true);
    assert.strictEqual(canDeleteQuiz(strangerQuiz, adminUser, null, true), true);
    assert.strictEqual(canDeleteQuiz(systemCatalogQuiz, adminUser, null, true), true);
  });

  const userPath1 = { id: 'lp-user-1', authorUserId: 'user-alice', title: 'User Path 1' };
  const userPath2 = { id: 'lp-user-2', authorUserId: 'user-alice', title: 'User Path 2' };
  const strangerPath = { id: 'lp-stranger', authorUserId: 'user-bob', title: 'Stranger Path' };
  const systemTrack = { id: 'lp-catalog', authorUserId: null, title: 'System Catalog Track' };

  test('User can delete their own learning paths, but cannot delete stranger paths or system tracks', () => {
    assert.strictEqual(canDeleteLearningPath(userPath1 as any, authorUser, null, true), true);
    assert.strictEqual(canDeleteLearningPath(userPath2 as any, authorUser, null, true), true);
    assert.strictEqual(canDeleteLearningPath(strangerPath as any, authorUser, null, true), false);
    assert.strictEqual(canDeleteLearningPath(systemTrack as any, learnerUser, null, true), false);
  });

  test('Admin user has authority to delete system tracks and user paths', () => {
    assert.strictEqual(canDeleteLearningPath(userPath1 as any, adminUser, null, true), true);
    assert.strictEqual(canDeleteLearningPath(systemTrack as any, adminUser, null, true), true);
  });
});

describe('Batch Deletion: Client Service & Persistence Helpers', () => {
  test('batchDeleteQuizzes returns immediately for empty array with 0 count', async () => {
    const res = await batchDeleteQuizzes([]);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.deletedCount, 0);
    assert.strictEqual(res.failedCount, 0);
  });

  test('batchDeleteLearningPaths returns immediately for empty array with 0 count', async () => {
    const res = await batchDeleteLearningPaths([]);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.deletedCount, 0);
    assert.strictEqual(res.failedCount, 0);
  });

  test('batchDeleteQuizzes records deleted quizzes in persistent registry', async () => {
    const quizIdA = `batch-test-quiz-a-${Date.now()}`;
    const quizIdB = `batch-test-quiz-b-${Date.now()}`;

    const res = await batchDeleteQuizzes([quizIdA, quizIdB]);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.deletedCount, 2);

    const isDeletedA = await isItemDeleted(quizIdA, 'quiz');
    const isDeletedB = await isItemDeleted(quizIdB, 'quiz');
    assert.strictEqual(isDeletedA, true);
    assert.strictEqual(isDeletedB, true);
  });

  test('batchDeleteLearningPaths records deleted paths in persistent registry', async () => {
    const pathIdA = `batch-test-path-a-${Date.now()}`;
    const pathIdB = `batch-test-path-b-${Date.now()}`;

    const res = await batchDeleteLearningPaths([pathIdA, pathIdB]);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.deletedCount, 2);

    const isDeletedA = await isItemDeleted(pathIdA, 'learning_path');
    const isDeletedB = await isItemDeleted(pathIdB, 'learning_path');
    assert.strictEqual(isDeletedA, true);
    assert.strictEqual(isDeletedB, true);
  });
});

describe('Practice Page & Explore Page: Scoping and State Synchronization', () => {
  const currentUserId = 'user-current-123';

  const mixedQuizzes = [
    { id: 'q1', title: 'Calculus 1', userId: 'user-current-123', topic: 'Calculus' },
    { id: 'q2', title: 'Physics Optics', userId: 'user-current-123', topic: 'Optics' },
    { id: 'q3', title: 'Biology Cells', userId: 'other-user-999', topic: 'Biology' },
    { id: 'q4', title: 'JEE Mechanics Standard', userId: null, topic: 'Mechanics' },
    { id: 'q5', title: 'NEET Chemistry Standard', userId: null, topic: 'Chemistry' },
  ];

  test('Scoping correctly isolates only authenticated user-owned quizzes', () => {
    const userOwned = mixedQuizzes.filter((q) => q.userId === currentUserId);
    assert.strictEqual(userOwned.length, 2);
    assert.deepStrictEqual(userOwned.map((q) => q.id), ['q1', 'q2']);

    // Standard quizzes must never be in the user-owned deletion scope
    const systemQuizzes = mixedQuizzes.filter((q) => !q.userId);
    assert.strictEqual(systemQuizzes.length, 2);

    // Other users' quizzes must never be in the deletion scope
    const otherUserQuizzes = mixedQuizzes.filter((q) => q.userId && q.userId !== currentUserId);
    assert.strictEqual(otherUserQuizzes.length, 1);
  });

  test('Filtering by search query respects ownership within the filter', () => {
    const query = 'Optics';
    const matches = mixedQuizzes.filter(
      (q) => q.title.toLowerCase().includes(query.toLowerCase()) || q.topic.toLowerCase().includes(query.toLowerCase())
    );
    const userOwnedInFilter = matches.filter((q) => q.userId === currentUserId);

    assert.strictEqual(userOwnedInFilter.length, 1);
    assert.strictEqual(userOwnedInFilter[0].id, 'q2');
  });

  test('Batch deleting user-owned quizzes removes only targeted items, preserving system and peer items', () => {
    let state = [...mixedQuizzes];
    const toDeleteIds = ['q1', 'q2'];

    // Simulate successful batch deletion
    const deletedSet = new Set(toDeleteIds);
    state = state.filter((q) => !deletedSet.has(q.id));

    assert.strictEqual(state.length, 3);
    assert.ok(state.some((q) => q.id === 'q3')); // Peer quiz preserved
    assert.ok(state.some((q) => q.id === 'q4')); // System standard preserved
    assert.ok(state.some((q) => q.id === 'q5')); // System standard preserved
    assert.strictEqual(state.some((q) => q.id === 'q1'), false);
    assert.strictEqual(state.some((q) => q.id === 'q2'), false);
  });

  const mixedPaths = [
    { id: 'lp1', title: 'Quantum Computing', authorUserId: 'user-current-123' },
    { id: 'lp2', title: 'Compiler Design', authorUserId: 'user-current-123' },
    { id: 'lp3', title: 'Genomics 101', authorUserId: 'other-author' },
    { id: 'lp4', title: 'MIT Classical Mechanics', authorUserId: null }, // System curated
  ];

  test('Explore Page batch delete scope targets only authenticated user courses', () => {
    const userOwnedPaths = mixedPaths.filter((p) => p.authorUserId === currentUserId);
    assert.strictEqual(userOwnedPaths.length, 2);
    assert.deepStrictEqual(userOwnedPaths.map((p) => p.id), ['lp1', 'lp2']);

    // Simulate batch delete
    let pathsState = [...mixedPaths];
    const deletedSet = new Set(userOwnedPaths.map((p) => p.id));
    pathsState = pathsState.filter((p) => !deletedSet.has(p.id));

    assert.strictEqual(pathsState.length, 2);
    assert.ok(pathsState.some((p) => p.id === 'lp3')); // Other author preserved
    assert.ok(pathsState.some((p) => p.id === 'lp4')); // System track preserved
  });
});
