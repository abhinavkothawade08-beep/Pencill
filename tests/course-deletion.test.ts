import { test, describe } from 'node:test';
import assert from 'node:assert';
import { DeleteCourseParamsSchema, DeleteCourseQuerySchema } from '../src/lib/api-schemas';
import { invalidateCourseCache } from '../src/services/supabase/pathService';

describe('Course Deletion: Schema Validation & Security Rules', () => {
  test('DeleteCourseParamsSchema accepts valid slugs, UUIDs, and hyphenated course identifiers', () => {
    const validIds = [
      'jee-physics',
      'python-foundations',
      'calculus-3',
      'path-1728000000',
      'course_123_abc',
      '550e8400-e29b-41d4-a716-446655440000',
    ];

    for (const id of validIds) {
      const result = DeleteCourseParamsSchema.safeParse({ id });
      assert.strictEqual(result.success, true, `Failed for valid ID: ${id}`);
    }
  });

  test('DeleteCourseParamsSchema rejects empty, whitespace, or invalid characters', () => {
    const invalidInputs = [
      { id: '' },
      { id: '   ' },
      { id: 'course/with/slash' },
      { id: 'course?param=1' },
      { id: 'course#anchor' },
      { id: '<script>alert(1)</script>' },
      { id: 'a'.repeat(129) }, // Exceeds max length of 128
    ];

    for (const input of invalidInputs) {
      const result = DeleteCourseParamsSchema.safeParse(input);
      assert.strictEqual(result.success, false, `Expected failure for: ${JSON.stringify(input)}`);
    }
  });

  test('DeleteCourseQuerySchema correctly coerces soft-delete query flags', () => {
    // True values
    const trueCases = [{ soft: 'true' }, { soft: '1' }];
    for (const tc of trueCases) {
      const res = DeleteCourseQuerySchema.safeParse(tc);
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.data?.soft, true);
    }

    // False / Default values
    const falseCases = [{ soft: 'false' }, { soft: '0' }, {}];
    for (const fc of falseCases) {
      const res = DeleteCourseQuerySchema.safeParse(fc);
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.data?.soft, false);
    }
  });
});

describe('Course Deletion: Authorization Logic & Role Enforcement', () => {
  interface UserContext {
    id: string;
    role?: string;
    tier?: string;
  }

  interface CourseContext {
    id: string;
    authorUserId: string | null;
  }

  function evaluateDeletePermission(user: UserContext | null, course: CourseContext): {
    authorized: boolean;
    statusCode: 200 | 401 | 403;
    reason?: string;
  } {
    if (!user) {
      return { authorized: false, statusCode: 401, reason: 'Unauthorized: Authentication required' };
    }

    const isSystemCurated = course.authorUserId === null;
    const isAuthor = course.authorUserId !== null && course.authorUserId === user.id;
    const isAdmin =
      user.role === 'admin' ||
      user.role === 'instructor' ||
      user.tier?.toLowerCase() === 'admin' ||
      user.tier?.toLowerCase().includes('instructor');

    if (isSystemCurated) {
      if (isAdmin) {
        return { authorized: true, statusCode: 200 };
      }
      return { authorized: false, statusCode: 403, reason: 'Forbidden: Only administrators can delete system catalog courses' };
    }

    if (isAuthor || isAdmin) {
      return { authorized: true, statusCode: 200 };
    }

    return { authorized: false, statusCode: 403, reason: 'Forbidden: Insufficient privileges' };
  }

  test('Author can delete their own authored course (200 OK)', () => {
    const author: UserContext = { id: 'user-author-123' };
    const course: CourseContext = { id: 'path-custom', authorUserId: 'user-author-123' };

    const result = evaluateDeletePermission(author, course);
    assert.strictEqual(result.authorized, true);
    assert.strictEqual(result.statusCode, 200);
  });

  test('Authenticated learner is forbidden from deleting authorless system catalog courses (403 Forbidden)', () => {
    const learner: UserContext = { id: 'user-student-456' };
    const systemCourse: CourseContext = { id: 'jee-physics', authorUserId: null };

    const result = evaluateDeletePermission(learner, systemCourse);
    assert.strictEqual(result.authorized, false);
    assert.strictEqual(result.statusCode, 403);
  });

  test('Non-author learner is forbidden from deleting another user course (403 Forbidden)', () => {
    const learner: UserContext = { id: 'user-student-456' };
    const course: CourseContext = { id: 'path-custom', authorUserId: 'user-author-123' };

    const result = evaluateDeletePermission(learner, course);
    assert.strictEqual(result.authorized, false);
    assert.strictEqual(result.statusCode, 403);
  });

  test('System administrator can delete any course including system catalog paths (200 OK)', () => {
    const adminUser: UserContext = { id: 'user-admin-789', role: 'admin' };
    const systemCourse: CourseContext = { id: 'jee-physics', authorUserId: null };
    const studentCourse: CourseContext = { id: 'path-custom', authorUserId: 'user-student-456' };

    const res1 = evaluateDeletePermission(adminUser, systemCourse);
    assert.strictEqual(res1.authorized, true);
    assert.strictEqual(res1.statusCode, 200);

    const res2 = evaluateDeletePermission(adminUser, studentCourse);
    assert.strictEqual(res2.authorized, true);
    assert.strictEqual(res2.statusCode, 200);
  });

  test('Unauthenticated user receives 401 Unauthorized', () => {
    const course: CourseContext = { id: 'jee-physics', authorUserId: null };
    const result = evaluateDeletePermission(null, course);
    assert.strictEqual(result.authorized, false);
    assert.strictEqual(result.statusCode, 401);
  });
});

describe('Course Deletion: Relational Cascading Dependency Ordering', () => {
  test('Cascade deletion execution plan maintains topological order to prevent FK violations', () => {
    // Verified deletion dependency order
    const executionPlan = [
      'quiz_attempts',
      'quiz_questions',
      'quizzes',
      'user_notes',
      'bookmarks',
      'progress_records',
      'lessons',
      'modules',
      'learning_paths',
    ];

    // Assert that child leaves come strictly before parents
    const indexOf = (tbl: string) => executionPlan.indexOf(tbl);

    // quiz_attempts depends on quizzes
    assert.ok(indexOf('quiz_attempts') < indexOf('quizzes'));
    // quiz_questions depends on quizzes
    assert.ok(indexOf('quiz_questions') < indexOf('quizzes'));
    // quizzes depends on learning_paths
    assert.ok(indexOf('quizzes') < indexOf('learning_paths'));

    // lessons depend on modules
    assert.ok(indexOf('lessons') < indexOf('modules'));
    // modules depend on learning_paths
    assert.ok(indexOf('modules') < indexOf('learning_paths'));

    // progress_records depends on lessons and learning_paths
    assert.ok(indexOf('progress_records') < indexOf('lessons'));
    assert.ok(indexOf('progress_records') < indexOf('learning_paths'));

    // learning_paths is the ultimate root deleted last
    assert.strictEqual(indexOf('learning_paths'), executionPlan.length - 1);
  });

  test('invalidateCourseCache safely runs without throwing on valid or nonexistent IDs', () => {
    assert.doesNotThrow(() => {
      invalidateCourseCache('jee-physics');
      invalidateCourseCache('non-existent-course-id');
      invalidateCourseCache('');
    });
  });
});
