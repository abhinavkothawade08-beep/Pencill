import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateUserAchievements,
  CANONICAL_ACHIEVEMENT_DEFINITIONS,
} from '../src/lib/achievements/achievement-engine';

test('Real-Data Achievement Engine Suite', async (t) => {
  await t.test('Canonical definitions integrity: 14 distinct verifiable milestones', () => {
    assert.equal(CANONICAL_ACHIEVEMENT_DEFINITIONS.length, 14);
    const idSet = new Set(CANONICAL_ACHIEVEMENT_DEFINITIONS.map((a) => a.id));
    assert.equal(idSet.size, 14, 'Every achievement must have a unique ID');
  });

  await t.test('Zero auto-granting: empty activity profile unlocks 0 achievements', async () => {
    const achievements = await evaluateUserAchievements('user-test-empty', [], []);
    const unlocked = achievements.filter((a) => a.isEarned);

    assert.equal(
      unlocked.length,
      0,
      'No achievements should be earned by a user with zero activity'
    );

    // Verify progress is 0%
    for (const ach of achievements) {
      assert.equal(ach.progressPercent, 0);
      assert.equal(ach.isEarned, false);
      assert.equal(ach.earnedAt, undefined);
    }
  });

  await t.test('Verifiable milestones: completing 1 lesson unlocks first_lesson', async () => {
    const achievements = await evaluateUserAchievements('user-test-1', [], ['lesson-101']);
    const firstLesson = achievements.find((a) => a.id === 'first_lesson');

    assert.ok(firstLesson, 'first_lesson achievement must exist');
    assert.equal(firstLesson?.isEarned, true);
    assert.equal(firstLesson?.progressPercent, 100);
    assert.ok(firstLesson?.earnedAt, 'earnedAt must be an ISO timestamp');

    // Next achievement 'lesson_scholar' requires 5 lessons (1/5 = 20%)
    const lessonScholar = achievements.find((a) => a.id === 'lesson_scholar');
    assert.equal(lessonScholar?.isEarned, false);
    assert.equal(lessonScholar?.progressPercent, 20);
  });

  await t.test('Module and path milestones are calculated from genuine completed lessons', async () => {
    const mockCourse = {
      id: 'course-calc-1',
      title: 'Calculus I',
      domain: 'Mathematics',
      modules: [
        {
          id: 'mod-1',
          title: 'Limits',
          lessons: [{ id: 'les-1', title: 'Intro' }, { id: 'les-2', title: 'Continuity' }],
        },
      ],
    };

    // Completing all lessons of module clears the module and path
    const achievements = await evaluateUserAchievements(
      'user-test-course',
      [mockCourse as any],
      ['les-1', 'les-2']
    );

    const pathFinisher = achievements.find((a) => a.id === 'path_finisher');
    assert.ok(pathFinisher, 'path_finisher achievement must exist');
    assert.equal(pathFinisher?.isEarned, true);
    assert.equal(pathFinisher?.progressPercent, 100);
  });
});
