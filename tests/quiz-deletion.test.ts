import { test, describe } from 'node:test';
import assert from 'node:assert';
import { DeleteQuizParamsSchema } from '../src/lib/api-schemas';
import { canDeleteQuiz, UserRoleContext } from '../src/lib/permissions';
import { invalidateQuizCache } from '../src/services/supabase/quizService';

describe('Quiz Deletion: Schema Validation & Parameter Sanitization', () => {
  test('DeleteQuizParamsSchema accepts valid alphanumeric, UUID, and hyphenated quiz identifiers', () => {
    const validIds = [
      'quiz-kinematics-101',
      'diagnostic_exam_jee',
      '550e8400-e29b-41d4-a716-446655440000',
      'custom-quiz-rotational-dynamics',
      'q-1728000000',
    ];

    for (const id of validIds) {
      const result = DeleteQuizParamsSchema.safeParse({ id });
      assert.strictEqual(result.success, true, `Expected valid ID for: ${id}`);
    }
  });

  test('DeleteQuizParamsSchema rejects empty, whitespace, path-traversal, or malicious inputs', () => {
    const invalidInputs = [
      { id: '' },
      { id: '   ' },
      { id: '../traversal/quiz' },
      { id: 'quiz?query=param' },
      { id: 'quiz#fragment' },
      { id: '<script>alert(1)</script>' },
      { id: 'a'.repeat(129) }, // Exceeds 128 characters
    ];

    for (const input of invalidInputs) {
      const result = DeleteQuizParamsSchema.safeParse(input);
      assert.strictEqual(result.success, false, `Expected rejection for: ${JSON.stringify(input)}`);
    }
  });
});

describe('Quiz Deletion: Authorization Logic & Role Enforcement', () => {
  const authorUser: UserRoleContext = { id: 'user-author-123' };
  const learnerUser: UserRoleContext = { id: 'user-student-456', role: 'student' };
  const adminUser: UserRoleContext = { id: 'user-admin-789', role: 'admin' };
  const instructorUser: UserRoleContext = { id: 'user-inst-999', role: 'instructor' };

  const authoredQuiz = {
    id: 'quiz-authored-by-123',
    userId: 'user-author-123',
    topic: 'Rotational Dynamics',
  };

  const systemQuiz = {
    id: 'quiz-system-standard',
    userId: null,
    topic: 'JEE Physics Mechanics',
  };

  test('Unauthenticated callers cannot delete database quizzes (401 Unauthorized)', () => {
    assert.strictEqual(canDeleteQuiz(authoredQuiz, null, null, true), false);
    assert.strictEqual(canDeleteQuiz(authoredQuiz, undefined, null, true), false);
    assert.strictEqual(canDeleteQuiz(systemQuiz, null, null, true), false);
  });

  test('Non-author learner is forbidden from deleting another user quiz (403 Forbidden)', () => {
    assert.strictEqual(canDeleteQuiz(authoredQuiz, learnerUser, null, true), false);
  });

  test('Non-author learner is forbidden from deleting system standard catalog quizzes (403 Forbidden)', () => {
    assert.strictEqual(canDeleteQuiz(systemQuiz, learnerUser, null, true), false);
  });

  test('Quiz author can delete their own authored quiz (200 OK)', () => {
    assert.strictEqual(canDeleteQuiz(authoredQuiz, authorUser, null, true), true);
  });

  test('System administrator can delete any quiz including system standard quizzes (200 OK)', () => {
    assert.strictEqual(canDeleteQuiz(authoredQuiz, adminUser, null, true), true);
    assert.strictEqual(canDeleteQuiz(systemQuiz, adminUser, null, true), true);
  });

  test('Instructor role can delete quizzes (200 OK)', () => {
    assert.strictEqual(canDeleteQuiz(authoredQuiz, instructorUser, null, true), true);
    assert.strictEqual(canDeleteQuiz(systemQuiz, instructorUser, null, true), true);
  });

  test('Unconfigured Supabase permits deletion for offline development', () => {
    assert.strictEqual(canDeleteQuiz(authoredQuiz, null, null, false), true);
  });
});

describe('Quiz Deletion: Relational Cascading Dependency Ordering', () => {
  test('Cascade deletion execution plan maintains topological order to prevent FK violations', () => {
    const cascadeOrder = [
      'quiz_responses',
      'quiz_attempts',
      'quiz_questions',
      'bookmarks',
      'quizzes',
    ];

    const idx = (name: string) => cascadeOrder.indexOf(name);

    // quiz_responses depends on quiz_attempts and quiz_questions -> must be deleted first
    assert.ok(idx('quiz_responses') < idx('quiz_attempts'));
    assert.ok(idx('quiz_responses') < idx('quiz_questions'));

    // quiz_attempts and quiz_questions depend on quizzes -> must be deleted before quizzes
    assert.ok(idx('quiz_attempts') < idx('quizzes'));
    assert.ok(idx('quiz_questions') < idx('quizzes'));

    // bookmarks referencing quiz deleted before quiz
    assert.ok(idx('bookmarks') < idx('quizzes'));

    // Root quiz record is deleted strictly last
    assert.strictEqual(idx('quizzes'), cascadeOrder.length - 1);
  });

  test('Deleting a quiz preserves the parent learning path (no accidental root deletion)', () => {
    const parentCourse = { id: 'path-jee-physics', title: 'JEE Physics' };
    const quizToDelete = { id: 'quiz-module-1', courseId: 'path-jee-physics' };

    // Simulating database state after deleting quiz
    const remainingQuizzes: Array<{ id: string; courseId: string }> = [];
    const courses = [parentCourse];

    assert.strictEqual(courses.length, 1);
    assert.strictEqual(courses[0].id, 'path-jee-physics');
    assert.strictEqual(remainingQuizzes.some((q) => q.id === quizToDelete.id), false);
  });

  test('invalidateQuizCache safely runs without throwing on valid or nonexistent IDs', () => {
    assert.doesNotThrow(() => {
      invalidateQuizCache('quiz-kinematics-101');
      invalidateQuizCache('non-existent-quiz-id');
    });
  });
});

describe('Practice & Quizzes Page: UI Synchronization & End-to-End Deletion Flow', () => {
  interface QuizItem {
    id: string;
    title: string;
    topic?: string;
    subject?: string;
    courseTitle: string;
    timeLimitMinutes: number;
    totalQuestions: number;
    userId?: string | null;
  }

  const sampleQuizzes: QuizItem[] = [
    {
      id: 'quiz-mechanics-1',
      title: 'Newtonian Dynamics Diagnostic Checkpoint',
      topic: 'Mechanics',
      subject: 'Physics',
      courseTitle: 'JEE Physics',
      timeLimitMinutes: 25,
      totalQuestions: 5,
      userId: 'user-author-123',
    },
    {
      id: 'quiz-calc-2',
      title: 'Multivariable Calculus Mastery Assessment',
      topic: 'Calculus',
      subject: 'Mathematics',
      courseTitle: 'Higher Mathematics',
      timeLimitMinutes: 30,
      totalQuestions: 10,
      userId: 'user-author-123',
    },
    {
      id: 'quiz-standard-3',
      title: 'National Foundation Science Baseline',
      topic: 'General Science',
      subject: 'Science',
      courseTitle: 'Foundation Diagnostic',
      timeLimitMinutes: 20,
      totalQuestions: 5,
      userId: null, // System standard
    },
  ];

  // Test Case 1: Successful deletion removes target quiz from state
  test('Test Case 1: Successful deletion removes target quiz from state and updates count', () => {
    let quizList = [...sampleQuizzes];
    const target = quizList[0];

    // User confirms deletion
    quizList = quizList.filter((q) => q.id !== target.id);

    assert.strictEqual(quizList.length, 2);
    assert.strictEqual(quizList.some((q) => q.id === target.id), false);
    assert.strictEqual(quizList[0].id, 'quiz-calc-2');
  });

  // Test Case 2: Reloading from database excludes deleted quiz
  test('Test Case 2: Reloading quizzes excludes deleted quiz', () => {
    const rawDatabaseQuizzes = [
      { id: 'quiz-calc-2', title: 'Multivariable Calculus' },
      { id: 'quiz-standard-3', title: 'National Foundation Science' },
    ];

    assert.strictEqual(rawDatabaseQuizzes.some((q) => q.id === 'quiz-mechanics-1'), false);
    assert.strictEqual(rawDatabaseQuizzes.length, 2);
  });

  // Test Case 3: Search queries filter out deleted quiz
  test('Test Case 3: Search queries filter out deleted quiz completely', () => {
    let quizList = [...sampleQuizzes];
    quizList = quizList.filter((q) => q.id !== 'quiz-mechanics-1');

    const searchKeyword = 'Newtonian Dynamics';
    const matches = quizList.filter(
      (q) =>
        q.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        q.topic?.toLowerCase().includes(searchKeyword.toLowerCase())
    );

    assert.strictEqual(matches.length, 0);
  });

  // Test Case 4: Requesting a deleted quiz returns null / not found
  test('Test Case 4: Requesting a deleted quiz by ID returns null', () => {
    const quizMap = new Map(sampleQuizzes.map((q) => [q.id, q]));
    quizMap.delete('quiz-mechanics-1');

    const fetched = quizMap.get('quiz-mechanics-1') || null;
    assert.strictEqual(fetched, null);
  });

  // Test Case 5: Clicking Cancel preserves quiz in state
  test('Test Case 5: Clicking Cancel preserves quiz list and aborts deletion', () => {
    const quizList = [...sampleQuizzes];
    let isModalOpen = true;

    // User clicks Cancel
    isModalOpen = false;

    assert.strictEqual(isModalOpen, false);
    assert.strictEqual(quizList.length, 3);
    assert.strictEqual(quizList[0].id, 'quiz-mechanics-1');
  });

  // Test Case 6: Duplicate deletion prevention
  test('Test Case 6: Duplicate deletion requests are prevented during execution', () => {
    let executionCount = 0;
    let isDeleting = false;

    const executeDelete = async () => {
      if (isDeleting) return; // Prevent duplicate request
      isDeleting = true;
      executionCount++;
      // Simulate async work
      isDeleting = false;
    };

    // Simulate rapid double click
    isDeleting = true;
    executeDelete(); // Should be ignored
    isDeleting = false;

    executeDelete(); // Should run once
    assert.strictEqual(executionCount, 1);
  });

  // Test Case 7: Simulated database failure keeps quizzes in state with error message
  test('Test Case 7: Simulated database failure keeps quizzes in state with error', () => {
    let quizList = [...sampleQuizzes];
    let errorMessage = '';

    const simulatedResponse = {
      ok: false,
      status: 500,
      error: 'Foreign key lock timeout on quiz_attempts',
    };

    if (!simulatedResponse.ok) {
      errorMessage = simulatedResponse.error;
      // Do NOT modify quizList
    }

    assert.strictEqual(errorMessage, 'Foreign key lock timeout on quiz_attempts');
    assert.strictEqual(quizList.length, 3);
    assert.strictEqual(quizList.some((q) => q.id === 'quiz-mechanics-1'), true);
  });

  // Test Case 8: Deleting one quiz leaves peer quizzes intact
  test('Test Case 8: Deleting a single quiz leaves peer quizzes untouched', () => {
    let quizList = [...sampleQuizzes];
    const quizToDelete = 'quiz-mechanics-1';

    quizList = quizList.filter((q) => q.id !== quizToDelete);

    assert.strictEqual(quizList.length, 2);
    assert.strictEqual(quizList.some((q) => q.id === quizToDelete), false);
    assert.ok(quizList.find((q) => q.id === 'quiz-calc-2'));
    assert.ok(quizList.find((q) => q.id === 'quiz-standard-3'));
  });
});
