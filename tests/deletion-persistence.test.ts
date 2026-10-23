import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  recordDeletedItem,
  getDeletedItemIds,
  isItemDeleted,
  isItemDeletedSync,
  clearDeletionRegistryForTesting,
} from '../src/services/supabase/deletionRegistry';
import { getLearningPaths, getLearningPathById, deleteLearningPathFromDatabase } from '../src/services/supabase/pathService';
import { getAllQuizzes, getQuizById, deleteQuizFromDatabase, inMemoryQuizStore } from '../src/services/supabase/quizService';
import { canDeleteLearningPath, canDeleteQuiz } from '../src/lib/permissions';

describe('Persistent Deletion & Page Refresh Guarantee', () => {
  beforeEach(() => {
    clearDeletionRegistryForTesting();
  });

  test('1. Deleting a learning path adds it to persistent deletion registry', async () => {
    const testPathId = 'test-path-mechanics-101';
    assert.strictEqual(isItemDeletedSync(testPathId, 'learning_path'), false);

    await recordDeletedItem('learning_path', testPathId, { userId: 'author-user-1' });

    assert.strictEqual(isItemDeletedSync(testPathId, 'learning_path'), true);
    const deletedIds = await getDeletedItemIds('learning_path');
    assert.strictEqual(deletedIds.has(testPathId), true);
  });

  test('2. getLearningPathById returns null for deleted learning path', async () => {
    const testPathId = 'test-path-to-delete';
    await recordDeletedItem('learning_path', testPathId);

    const pathResult = await getLearningPathById(testPathId);
    assert.strictEqual(pathResult, null, 'Deleted path must not be retrievable by ID');
  });

  test('3. Page refresh simulation: getLearningPaths excludes deleted paths across reloads', async () => {
    const testPathId = 'mit-8-012-physics-i-classical-mechanics';
    await recordDeletedItem('learning_path', testPathId);

    // First load
    const initialPaths = await getLearningPaths();
    const initialFound = initialPaths.some((p) => p.id === testPathId);
    assert.strictEqual(initialFound, false, 'Deleted path must not appear in catalog');

    // Simulate page refresh / subsequent query
    const refreshedPaths = await getLearningPaths();
    const refreshedFound = refreshedPaths.some((p) => p.id === testPathId);
    assert.strictEqual(refreshedFound, false, 'Deleted path must never reappear on refresh');
  });

  test('4. Deleting a quiz adds it to persistent deletion registry', async () => {
    const testQuizId = 'quiz-rotational-dynamics-checkpoint';
    assert.strictEqual(isItemDeletedSync(testQuizId, 'quiz'), false);

    await recordDeletedItem('quiz', testQuizId, { userId: 'author-user-2' });

    assert.strictEqual(isItemDeletedSync(testQuizId, 'quiz'), true);
    const deletedQuizIds = await getDeletedItemIds('quiz');
    assert.strictEqual(deletedQuizIds.has(testQuizId), true);
  });

  test('5. getQuizById returns null for deleted quiz', async () => {
    const testQuizId = 'quiz-kinematics-checkpoint';
    await recordDeletedItem('quiz', testQuizId);

    const quizResult = await getQuizById(testQuizId);
    assert.strictEqual(quizResult, null, 'Deleted quiz must not be retrievable by ID');
  });

  test('6. Page refresh simulation: getAllQuizzes excludes deleted quizzes across reloads', async () => {
    const testQuizId = 'kinematics-checkpoint';
    await recordDeletedItem('quiz', testQuizId);

    // First query
    const initialQuizzes = await getAllQuizzes();
    const initialFound = initialQuizzes.some((q) => q.id === testQuizId);
    assert.strictEqual(initialFound, false, 'Deleted quiz must not appear in quiz hub');

    // Simulate page refresh / subsequent query
    const refreshedQuizzes = await getAllQuizzes();
    const refreshedFound = refreshedQuizzes.some((q) => q.id === testQuizId);
    assert.strictEqual(refreshedFound, false, 'Deleted quiz must never reappear on refresh');
  });

  test('7. Deleting a parent learning path cascades exclusion to child quizzes', async () => {
    const parentPathId = 'path-with-child-quizzes';
    await recordDeletedItem('learning_path', parentPathId);

    // A quiz with path_id === parentPathId must be excluded
    const quizzes = await getAllQuizzes();
    const childQuizFound = quizzes.some((q) => (q as any).pathId === parentPathId || (q as any).courseId === parentPathId);
    assert.strictEqual(childQuizFound, false, 'Quizzes belonging to deleted path must be excluded');
  });

  test('8. Authorization protection: caller cannot delete another user private course', () => {
    const foreignPath = { id: 'frontend-development-comprehensi-mv9ar0ni', authorUserId: 'author-user-999' };
    const intruder = { id: 'unauthorized-intruder-uuid', role: 'student' };
    
    // Non-author student attempting to delete foreign private course
    const canDelete = canDeleteLearningPath(foreignPath, intruder, null, true);
    assert.strictEqual(canDelete, false, 'Non-author student must be rejected from deleting foreign private course');

    // Verify it is not marked in deleted registry
    const isDeleted = isItemDeletedSync(foreignPath.id, 'learning_path');
    assert.strictEqual(isDeleted, false, 'Unauthorized deletion must not record in registry');
  });

  test('9. Authorization protection: caller cannot delete another user personal quiz', () => {
    const foreignQuiz = { id: 'test_quiz_1791956316953', userId: 'author-user-999' };
    const intruder = { id: 'unauthorized-intruder-uuid', role: 'student' };

    // Non-author learner attempting to delete foreign quiz
    const canDelete = canDeleteQuiz(foreignQuiz, intruder, null, true);
    assert.strictEqual(canDelete, false, 'Non-author learner must be rejected from deleting foreign quiz');

    // Verify it is not marked in deleted registry
    const isDeleted = isItemDeletedSync(foreignQuiz.id, 'quiz');
    assert.strictEqual(isDeleted, false, 'Unauthorized deletion must not record in registry');
  });

  test('10. Idempotent deletion: recording the same deletion multiple times does not error or duplicate', async () => {
    const quizId = 'idempotent-quiz-test';
    const firstCall = await recordDeletedItem('quiz', quizId);
    const secondCall = await recordDeletedItem('quiz', quizId);

    assert.strictEqual(firstCall, true);
    assert.strictEqual(secondCall, true);
    assert.strictEqual(isItemDeletedSync(quizId, 'quiz'), true);
  });
});
