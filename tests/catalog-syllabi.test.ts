import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { testCurriculumFixtures } from './fixtures/curriculum-fixture';

describe('Catalog Syllabi and Modular Curriculum Integrity', () => {
  test('All primary catalog courses have fully populated modules and lessons', () => {
    const coursesToCheck = [
      'python-foundations',
      'calculus-3',
      'modern-ai',
      'organic-chemistry',
    ];

    for (const courseId of coursesToCheck) {
      const course = testCurriculumFixtures.find((c) => c.id === courseId);
      assert.ok(course, `Catalog course ${courseId} should exist`);
      assert.ok(course.modules && course.modules.length > 0, `Course ${courseId} must have at least one module`);

      for (const module of course.modules) {
        assert.ok(module.id, `Module in ${courseId} must have an id`);
        assert.ok(module.title, `Module in ${courseId} must have a title`);
        assert.ok(module.lessons && module.lessons.length > 0, `Module ${module.id} in ${courseId} must have lessons`);

        for (const lesson of module.lessons) {
          assert.ok(lesson.id, `Lesson in ${courseId} must have an id`);
          assert.ok(lesson.title, `Lesson ${lesson.id} in ${courseId} must have a title`);
          assert.ok(typeof lesson.durationMinutes === 'number' && lesson.durationMinutes > 0, `Lesson ${lesson.id} must have a positive duration`);
        }
      }
    }
  });

  test('Cross-module traversal computes correct sequential ordering', () => {
    const course = testCurriculumFixtures.find((c) => c.id === 'python-foundations');
    assert.ok(course && course.modules && course.modules.length >= 2);

    const allLessons = course.modules.flatMap((m) => m.lessons);
    assert.ok(allLessons.length >= 4, 'Should have multiple lessons across modules');

    // Test first module boundary
    const firstModuleLastLesson = course.modules[0].lessons[course.modules[0].lessons.length - 1];
    const secondModuleFirstLesson = course.modules[1].lessons[0];

    const firstIndex = allLessons.findIndex((l) => l.id === firstModuleLastLesson.id);
    const secondIndex = allLessons.findIndex((l) => l.id === secondModuleFirstLesson.id);

    assert.strictEqual(secondIndex, firstIndex + 1, 'Next lesson after module 1 end should be module 2 first lesson');
  });
});
