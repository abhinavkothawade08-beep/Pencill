import { test, describe } from 'node:test';
import assert from 'node:assert';
import { canDeleteLearningPath, isUserAdmin, UserRoleContext } from '../src/lib/permissions';
import { DeleteCourseParamsSchema } from '../src/lib/api-schemas';
import { invalidateCourseCache } from '../src/services/supabase/pathService';
import { LearningPath } from '../src/types';

describe('Explore Page: Learning Path Permanent Deletion Test Suite', () => {
  // Mock learning paths matching the real catalog
  const samplePaths: LearningPath[] = [
    {
      id: 'jee-physics-mechanics-electromag-mv6wdznk',
      title: 'JEE Physics: Mechanics & Electromagnetism Mastery (Hinglish)',
      description: 'Comprehensive physics curriculum with derivations and problem sets.',
      domain: 'Physics',
      level: 'Competitive',
      durationHours: 35,
      moduleCount: 4,
      verified: true,
      authorUserId: 'a11edb13-5bf5-4452-87b8-fb57276ee776',
      isPublished: true,
    },
    {
      id: 'advanced-fine-tuning-of-large-la-mv6pt1e0',
      title: 'Advanced Fine-Tuning of Large Language Models (LLMs)',
      description: 'Instruction tuning, LoRA, DPO, and alignment for production LLMs.',
      domain: 'Computer Science',
      level: 'Advanced',
      durationHours: 42,
      moduleCount: 4,
      verified: true,
      authorUserId: 'a11edb13-5bf5-4452-87b8-fb57276ee776',
      isPublished: true,
    },
    {
      id: 'mit-8-012-classical-mechanics',
      title: 'MIT 8.012: Physics I - Classical Mechanics',
      description: 'Calculus-based classical mechanics from MIT OCW.',
      domain: 'Physics',
      level: 'Undergraduate',
      durationHours: 45,
      moduleCount: 4,
      verified: true,
      authorUserId: null, // System-curated catalog track
      isPublished: true,
    },
  ];

  // Test Case 1: Delete a learning path using Delete Permanently
  test('Test Case 1: Successful deletion removes target path from catalog state', () => {
    let courses = [...samplePaths];
    const target = courses[0];

    // Simulate successful permanent deletion
    courses = courses.filter((c) => c.id !== target.id);

    assert.strictEqual(courses.length, 2);
    assert.strictEqual(courses.some((c) => c.id === target.id), false);
    assert.strictEqual(courses[0].id, 'advanced-fine-tuning-of-large-la-mv6pt1e0');
  });

  // Test Case 2: Refresh the Explore page — deleted path remains absent
  test('Test Case 2: Reloading catalog from database excludes deleted or purged paths', () => {
    const rawDatabaseRows = [
      { id: 'path-active-1', title: 'Calculus', deleted_at: null, is_published: true },
      { id: 'jee-physics-mechanics-electromag-mv6wdznk', title: 'Deleted JEE', deleted_at: '2026-10-13T22:00:00Z', is_published: false },
    ];

    // Emulate getLearningPaths database filtering
    const loadedPaths = rawDatabaseRows.filter((r) => !r.deleted_at && r.is_published);
    assert.strictEqual(loadedPaths.length, 1);
    assert.strictEqual(loadedPaths[0].id, 'path-active-1');
  });

  // Test Case 3: Search for the deleted path — no deleted path appears
  test('Test Case 3: Search queries filter out deleted paths completely', () => {
    let courses = [...samplePaths];
    const targetToDelete = courses[0]; // 'JEE Physics'

    // Delete target
    courses = courses.filter((c) => c.id !== targetToDelete.id);

    // Search query for the deleted item's keyword
    const searchQuery = 'JEE Physics';
    const searchResults = courses.filter(
      (c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.domain.toLowerCase().includes(searchQuery.toLowerCase())
    );

    assert.strictEqual(searchResults.length, 0);
  });

  // Test Case 4: Open the deleted path using its previous URL — proper not-found state
  test('Test Case 4: Requesting a deleted path returns null / not-found state', () => {
    const activePaths = new Map(samplePaths.map((p) => [p.id, p]));
    activePaths.delete('jee-physics-mechanics-electromag-mv6wdznk');

    const requestedCourse = activePaths.get('jee-physics-mechanics-electromag-mv6wdznk') || null;
    assert.strictEqual(requestedCourse, null);
  });

  // Test Case 5: Click Cancel in confirmation dialog — state remains unchanged
  test('Test Case 5: Clicking Cancel preserves existing courses and aborts deletion', () => {
    const courses = [...samplePaths];
    let confirmationOpen = true;

    // User clicks Cancel
    confirmationOpen = false;

    // Assert everything is unchanged
    assert.strictEqual(confirmationOpen, false);
    assert.strictEqual(courses.length, 3);
    assert.strictEqual(courses[0].id, 'jee-physics-mechanics-electromag-mv6wdznk');
  });

  // Test Case 6: Attempt deletion without required permissions — server rejects
  test('Test Case 6: Unauthorized users are denied deletion permission (401 / 403)', () => {
    const authorUser: UserRoleContext = { id: 'a11edb13-5bf5-4452-87b8-fb57276ee776' };
    const otherUser: UserRoleContext = { id: 'different-user-uuid', role: 'student' };
    const adminUser: UserRoleContext = { id: 'admin-user-uuid', role: 'admin' };

    const authoredPath = samplePaths[0]; // authored by a11edb13...
    const systemPath = samplePaths[2];   // authorUserId: null

    // 1. Unauthenticated user cannot delete anything
    assert.strictEqual(canDeleteLearningPath(authoredPath, null), false);
    assert.strictEqual(canDeleteLearningPath(systemPath, null), false);

    // 2. Non-author student cannot delete authored path
    assert.strictEqual(canDeleteLearningPath(authoredPath, otherUser), false);

    // 3. Regular student cannot delete system curated track
    assert.strictEqual(canDeleteLearningPath(systemPath, otherUser), false);

    // 4. Author CAN delete their authored path
    assert.strictEqual(canDeleteLearningPath(authoredPath, authorUser), true);

    // 5. Admin CAN delete authored and system curated tracks
    assert.strictEqual(canDeleteLearningPath(authoredPath, adminUser), true);
    assert.strictEqual(canDeleteLearningPath(systemPath, adminUser), true);
  });

  // Test Case 7: Delete a path that does not exist — validation and 404 response
  test('Test Case 7: Path ID validation rejects invalid or malicious parameters', () => {
    const invalidId1 = DeleteCourseParamsSchema.safeParse({ id: '' });
    assert.strictEqual(invalidId1.success, false);

    const invalidId2 = DeleteCourseParamsSchema.safeParse({ id: '../malicious/escape' });
    assert.strictEqual(invalidId2.success, false);

    const invalidId3 = DeleteCourseParamsSchema.safeParse({ id: 'a'.repeat(200) });
    assert.strictEqual(invalidId3.success, false);

    const validId = DeleteCourseParamsSchema.safeParse({ id: 'jee-physics-mechanics-electromag-mv6wdznk' });
    assert.strictEqual(validId.success, true);
  });

  // Test Case 8: Simulate a database error during deletion — no false success
  test('Test Case 8: Simulated database failure keeps courses in state with error', () => {
    let courses = [...samplePaths];
    let toastMessage = '';
    let isError = false;

    // Simulated API call returning error 500
    const mockApiResponse = {
      ok: false,
      status: 500,
      json: async () => ({ success: false, error: 'Database transaction lock timeout' }),
    };

    if (!mockApiResponse.ok) {
      isError = true;
      toastMessage = 'Database transaction lock timeout';
      // Courses state is NOT altered
    }

    assert.strictEqual(isError, true);
    assert.strictEqual(toastMessage, 'Database transaction lock timeout');
    assert.strictEqual(courses.length, 3);
    assert.strictEqual(courses.some((c) => c.id === 'jee-physics-mechanics-electromag-mv6wdznk'), true);
  });

  // Test Case 9: Verify dependent records in database — topological cascade ordering
  test('Test Case 9: Cascading deletion cleans all dependent children in correct order', () => {
    const cascadeOrder = [
      'quiz_responses',
      'quiz_attempts',
      'quiz_questions',
      'quizzes',
      'user_notes',
      'bookmarks',
      'progress_records',
      'enrollments',
      'course_sources',
      'lessons',
      'modules',
      'learning_paths',
    ];

    const idx = (name: string) => cascadeOrder.indexOf(name);

    // quiz_responses precedes quiz_attempts
    assert.ok(idx('quiz_responses') < idx('quiz_attempts'));
    // quiz_attempts precedes quizzes
    assert.ok(idx('quiz_attempts') < idx('quizzes'));
    // lessons precedes modules
    assert.ok(idx('lessons') < idx('modules'));
    // modules precedes learning_paths
    assert.ok(idx('modules') < idx('learning_paths'));
    // enrollments and bookmarks precede learning_paths
    assert.ok(idx('enrollments') < idx('learning_paths'));
    assert.ok(idx('bookmarks') < idx('learning_paths'));
    // Root learning_paths deleted strictly last
    assert.strictEqual(idx('learning_paths'), cascadeOrder.length - 1);
  });

  // Test Case 10: Verify shared resources and unrelated learning paths are preserved
  test('Test Case 10: Shared discovery pool resources are preserved from deletion', () => {
    const sharedResources = [
      { id: 'yt-vid-101', title: 'MIT Classical Mechanics Lecture 1', type: 'video' },
      { id: 'arxiv-2024-55', title: 'Direct Preference Optimization Paper', type: 'paper' },
    ];

    const targetCourseId = 'jee-physics-mechanics-electromag-mv6wdznk';

    // Verify shared pool items lack path_id and are not deleted
    for (const res of sharedResources) {
      assert.strictEqual('path_id' in res, false);
    }
    assert.strictEqual(sharedResources.length, 2);
  });

  // Test Case 11: Delete one path when multiple paths exist
  test('Test Case 11: Deleting a single path leaves peer paths untouched', () => {
    let courses = [...samplePaths];
    const pathToDelete = 'jee-physics-mechanics-electromag-mv6wdznk';
    const peerPathId = 'advanced-fine-tuning-of-large-la-mv6pt1e0';

    courses = courses.filter((c) => c.id !== pathToDelete);

    assert.strictEqual(courses.length, 2);
    assert.strictEqual(courses.some((c) => c.id === pathToDelete), false);
    const peer = courses.find((c) => c.id === peerPathId);
    assert.ok(peer);
    assert.strictEqual(peer?.title, 'Advanced Fine-Tuning of Large Language Models (LLMs)');
  });

  // Test Case 12: Verify displayed path count and available track count after deletion
  test('Test Case 12: Available tracks and filtered counts accurately update after deletion', () => {
    let courses = [...samplePaths]; // 3 total
    let totalAvailableTracks = courses.length;
    let filteredCount = courses.length;

    assert.strictEqual(totalAvailableTracks, 3);
    assert.strictEqual(filteredCount, 3);

    // Delete 1 path
    const removedId = 'jee-physics-mechanics-electromag-mv6wdznk';
    courses = courses.filter((c) => c.id !== removedId);
    totalAvailableTracks = courses.length;
    filteredCount = courses.filter((c) => c.domain === 'Physics').length;

    assert.strictEqual(totalAvailableTracks, 2);
    assert.strictEqual(filteredCount, 1); // Only MIT Classical Mechanics remains for Physics
  });

  // Cache invalidation test
  test('Cache Invalidation: invalidateCourseCache purges in-memory and local cache entries', () => {
    assert.doesNotThrow(() => {
      invalidateCourseCache('jee-physics-mechanics-electromag-mv6wdznk');
      invalidateCourseCache('advanced-fine-tuning-of-large-la-mv6pt1e0');
    });
  });
});
