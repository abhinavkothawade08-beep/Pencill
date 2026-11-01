import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { storageAdapter, StorageProgress, StorageBookmark } from '../src/lib/storage/storageAdapter';
import { getUserProgress } from '../src/services/supabase/progressService';
import { getUserNotes, addNote } from '../src/services/supabase/noteService';
import { evaluateUserAchievements } from '../src/lib/achievements/achievement-engine';

describe('Multi-User Authentication & Data Isolation Integrity', () => {
  const USER_A_ID = 'user-alice-0001-uuid';
  const USER_B_ID = 'user-bob-0002-uuid';

  beforeEach(async () => {
    storageAdapter.setUserScope(null);
    await storageAdapter.clearCurrentUserData();
  });

  afterEach(async () => {
    storageAdapter.setUserScope(null);
    await storageAdapter.clearCurrentUserData();
  });

  test('TEST A & B: Account A data is strictly isolated and absent from Account B session', async () => {
    // 1. Account A logs in and creates personal learning data
    storageAdapter.setUserScope(USER_A_ID);
    assert.strictEqual(storageAdapter.getActiveUserScope(), USER_A_ID);

    const pathA = {
      id: 'path-alice-calculus-01',
      title: 'Advanced Multivariable Calculus',
      domain: 'Mathematics',
      subject: 'Calculus',
      authorUserId: USER_A_ID,
      modules: [
        {
          id: 'mod-1',
          title: 'Partial Derivatives',
          lessons: [{ id: 'les-1', title: 'Gradient Vector' }],
        },
      ],
    };

    await storageAdapter.savePath(pathA);
    await storageAdapter.saveDraft('builder_config_draft', { domainId: 'math', title: 'Alice Draft' });
    await storageAdapter.addBookmark({
      type: 'path',
      title: 'Alice Bookmark - Stokes Theorem',
      pathId: pathA.id,
    });
    await storageAdapter.updateProgress(pathA.id, {
      completedLessonIds: ['les-1'],
      hoursLogged: 4.5,
    });

    // Verify Account A sees their data
    const alicePaths = await storageAdapter.getSavedPaths();
    assert.strictEqual(alicePaths.length, 1);
    assert.strictEqual(alicePaths[0].id, 'path-alice-calculus-01');

    const aliceBookmarks = await storageAdapter.getBookmarks();
    assert.strictEqual(aliceBookmarks.length, 1);
    assert.strictEqual(aliceBookmarks[0].title, 'Alice Bookmark - Stokes Theorem');

    const aliceProgress = await storageAdapter.getProgress(pathA.id);
    assert.ok(aliceProgress);
    assert.strictEqual(aliceProgress?.hoursLogged, 4.5);
    assert.deepStrictEqual(aliceProgress?.completedLessonIds, ['les-1']);

    const aliceDraft = await storageAdapter.getDraft('builder_config_draft');
    assert.ok(aliceDraft);

    // 2. Account A logs out -> Switch to Account B (Fresh new registration)
    storageAdapter.setUserScope(USER_B_ID);
    assert.strictEqual(storageAdapter.getActiveUserScope(), USER_B_ID);

    // VERIFY: Account B sees zero data from Account A
    const bobPaths = await storageAdapter.getSavedPaths();
    assert.strictEqual(bobPaths.length, 0, 'Account B must not see Account A saved paths');

    const bobBookmarks = await storageAdapter.getBookmarks();
    assert.strictEqual(bobBookmarks.length, 0, 'Account B must not see Account A bookmarks');

    const bobProgressOnPathA = await storageAdapter.getProgress(pathA.id);
    assert.strictEqual(bobProgressOnPathA, null, 'Account B must have null progress on Account A path');

    const bobDraft = await storageAdapter.getDraft('builder_config_draft');
    assert.strictEqual(bobDraft, null, 'Account B must not see Account A builder draft');

    // Account B creates their own independent data
    const pathB = {
      id: 'path-bob-genomics-02',
      title: 'CRISPR Cas9 Genome Editing',
      domain: 'Life Sciences',
      subject: 'Genomics',
      authorUserId: USER_B_ID,
      modules: [],
    };
    await storageAdapter.savePath(pathB);
    await storageAdapter.addBookmark({
      type: 'path',
      title: 'Bob Bookmark - Guide RNA Design',
      pathId: pathB.id,
    });

    const bobUpdatedPaths = await storageAdapter.getSavedPaths();
    assert.strictEqual(bobUpdatedPaths.length, 1);
    assert.strictEqual(bobUpdatedPaths[0].id, 'path-bob-genomics-02');

    const bobUpdatedBookmarks = await storageAdapter.getBookmarks();
    assert.strictEqual(bobUpdatedBookmarks.length, 1);
    assert.strictEqual(bobUpdatedBookmarks[0].title, 'Bob Bookmark - Guide RNA Design');

    // 3. TEST C: Account B logs out -> Account A logs back in
    storageAdapter.setUserScope(USER_A_ID);
    assert.strictEqual(storageAdapter.getActiveUserScope(), USER_A_ID);

    const aliceRestoredPaths = await storageAdapter.getSavedPaths();
    assert.strictEqual(aliceRestoredPaths.length, 1);
    assert.strictEqual(aliceRestoredPaths[0].id, 'path-alice-calculus-01', 'Account A original path must be intact');

    const aliceRestoredBookmarks = await storageAdapter.getBookmarks();
    assert.strictEqual(aliceRestoredBookmarks.length, 1);
    assert.strictEqual(aliceRestoredBookmarks[0].title, 'Alice Bookmark - Stokes Theorem');

    const aliceRestoredProgress = await storageAdapter.getProgress(pathA.id);
    assert.strictEqual(aliceRestoredProgress?.hoursLogged, 4.5);
    assert.deepStrictEqual(aliceRestoredProgress?.completedLessonIds, ['les-1']);

    // Ensure Account B path is completely absent from Account A
    assert.ok(!aliceRestoredPaths.some((p) => p.id === 'path-bob-genomics-02'));
    assert.ok(!aliceRestoredBookmarks.some((b) => b.title.includes('Bob Bookmark')));
  });

  test('TEST D: Achievements evaluation maintains strict zero-state for new account', async () => {
    // Fresh Account B with 0 enrollments and 0 completed lessons
    const achievements = await evaluateUserAchievements(USER_B_ID, [], []);
    assert.ok(Array.isArray(achievements));
    assert.strictEqual(achievements.length, 14);

    const unlocked = achievements.filter((a) => a.isEarned);
    assert.strictEqual(unlocked.length, 0, 'Fresh registered account must have 0 unlocked achievements');

    achievements.forEach((a) => {
      assert.strictEqual(a.currentProgress, 0);
      assert.strictEqual(a.progressPercent, 0);
      assert.strictEqual(a.isEarned, false);
    });
  });

  test('TEST E: Guest notes never leak to authenticated accounts on database error', async () => {
    // When an authenticated user requests notes and Supabase has no records or errors,
    // noteService must return [] rather than leaking un-scoped guest notes
    const notes = await getUserNotes(USER_B_ID, 'lesson-non-existent-999');
    assert.ok(Array.isArray(notes));
    assert.strictEqual(notes.length, 0, 'Authenticated user must receive empty array, not guest notes');
  });

  test('TEST F: Switching to guest scope isolates guest data from authenticated users', async () => {
    // Guest scope
    storageAdapter.setUserScope(null);
    assert.strictEqual(storageAdapter.getActiveUserScope(), 'guest');

    await storageAdapter.saveDraft('builder_config_draft', { domainId: 'guest-domain', title: 'Guest Draft' });
    const guestDraft = await storageAdapter.getDraft('builder_config_draft');
    assert.ok(guestDraft);
    assert.strictEqual((guestDraft as any).title, 'Guest Draft');

    // Fresh User C logs in: must NOT inherit unauthenticated guest draft
    const USER_C_ID = 'test-user-carol-fresh-999';
    storageAdapter.setUserScope(USER_C_ID);
    const userCDraft = await storageAdapter.getDraft('builder_config_draft');
    assert.strictEqual(userCDraft, null, 'Fresh User C must not inherit unauthenticated guest draft');

    // User A logs in: must retain Alice own draft, not guest draft
    storageAdapter.setUserScope(USER_A_ID);
    const userADraft = await storageAdapter.getDraft('builder_config_draft');
    assert.notDeepStrictEqual(userADraft, guestDraft, 'User A must not inherit guest draft');
    assert.strictEqual((userADraft as any).title, 'Alice Draft', 'User A keeps their own draft');
  });
});
