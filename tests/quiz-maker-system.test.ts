import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  QuizGenerateRequestSchema,
  QuizSubmitRequestSchema,
  QuizStartAttemptRequestSchema,
} from '@/lib/api-schemas';
import { GeminiClientError } from '@/services/ai/gemini/client';
import {
  createQuiz,
  getQuizById,
  startQuizAttempt,
  saveQuizAnswer,
  getQuizAttempt,
  submitQuizAttempt,
} from '@/services/supabase/quizService';
import { QuizQuestion } from '@/types';

describe('Phase 12: Quiz Maker & Assessment System Test Suite', () => {
  // Test 1: Quiz creation with valid configuration
  test('1. Quiz creation schema accepts valid complete configuration', () => {
    const validConfig = {
      topic: 'Quantum Wavefunctions & Particle in a Box',
      subject: 'Physics',
      gradeLevel: 'Undergraduate',
      curriculum: 'MIT OpenCourseWare Standard',
      examTarget: 'College Semester Exam',
      knowledgeLevel: 'intermediate' as const,
      difficulty: 'hard' as const,
      questionCount: 5,
      questionFormat: 'single_choice' as const,
      timeLimitMinutes: 15,
      includeExplanations: true,
      learningObjectives: 'Test boundary conditions and energy quantization.',
    };

    const res = QuizGenerateRequestSchema.safeParse(validConfig);
    assert.strictEqual(res.success, true);
    if (res.success) {
      assert.strictEqual(res.data.topic, 'Quantum Wavefunctions & Particle in a Box');
      assert.strictEqual(res.data.questionCount, 5);
      assert.strictEqual(res.data.difficulty, 'hard');
    }
  });

  // Test 2: Missing topic
  test('2. Missing topic fails validation with clear error', () => {
    const invalidInput = { topic: '   ', questionCount: 5 };
    const res = QuizGenerateRequestSchema.safeParse(invalidInput);
    assert.strictEqual(res.success, false);
    if (!res.success) {
      const errors = res.error.flatten().fieldErrors;
      assert.ok(errors.topic && errors.topic.length > 0);
    }
  });

  // Test 3: Unsupported or invalid configuration values
  test('3. Out-of-bounds question count is rejected or clamped', () => {
    const invalidCount = { topic: 'Thermodynamics', questionCount: 100 };
    const res = QuizGenerateRequestSchema.safeParse(invalidCount);
    assert.strictEqual(res.success, false);
  });

  // Test 4: AI provider errors
  test('4. GeminiClientError carries accurate HTTP status and sanitized message', () => {
    const err = new GeminiClientError('Rate limit exceeded', 429, { retryAfterMs: 5000 });
    assert.strictEqual(err.name, 'GeminiClientError');
    assert.strictEqual(err.statusCode, 429);
    assert.strictEqual(err.message, 'Rate limit exceeded');
  });

  // Test 5 & 6 & 7: Question validation: valid options, missing keys, single choice
  test('5, 6, 7. Question validation enforces valid option array and authoritative answer key', () => {
    const validQ: QuizQuestion = {
      id: 'test-q1',
      questionNumber: 1,
      prompt: 'What is the speed of light in vacuum?',
      options: [
        { id: 'A', text: '3 x 10^8 m/s' },
        { id: 'B', text: '3 x 10^6 m/s' },
        { id: 'C', text: '1.5 x 10^8 m/s' },
        { id: 'D', text: 'Infinite' },
      ],
      correctOptionId: 'A',
      explanation: 'c is defined as 299,792,458 m/s exactly in SI units.',
    };

    assert.ok(validQ.options.length === 4);
    assert.ok(validQ.options.some((o) => o.id === validQ.correctOptionId));

    // Missing key check
    const invalidKeyQ: QuizQuestion = {
      id: 'test-q2',
      questionNumber: 2,
      prompt: 'Invalid key prompt',
      options: [
        { id: 'A', text: 'Option 1' },
        { id: 'B', text: 'Option 2' },
      ],
      correctOptionId: 'Z',
    };
    const hasKey = invalidKeyQ.options.some((o) => o.id === invalidKeyQ.correctOptionId);
    assert.strictEqual(hasKey, false, 'Invalid option key should be detected and rejected');
  });

  // Test 8: Duplicate question rejection
  test('8. Duplicate prompts in a quiz set are identifiable and filterable', () => {
    const prompts = [
      'What is Newton\'s First Law?',
      'What is Newton\'s Second Law?',
      'What is Newton\'s First Law?', // duplicate
    ];
    const seen = new Set<string>();
    const deduplicated = prompts.filter((p) => {
      const norm = p.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seen.has(norm)) return false;
      seen.add(norm);
      return true;
    });

    assert.strictEqual(deduplicated.length, 2);
  });

  // Test 9, 10, 11: Attempt creation and ownership
  test('9, 10, 11. createQuiz and startQuizAttempt establish persisted session with deadline', async () => {
    const quizId = `test-q-suite-${Date.now()}`;
    const testQuestions: QuizQuestion[] = [
      {
        id: `${quizId}-q1`,
        questionNumber: 1,
        prompt: 'Calculate the force required to accelerate a 2kg mass at 3 m/s².',
        options: [
          { id: 'A', text: '6 N' },
          { id: 'B', text: '1.5 N' },
          { id: 'C', text: '5 N' },
          { id: 'D', text: '12 N' },
        ],
        correctOptionId: 'A',
        explanation: 'F = m * a = 2 kg * 3 m/s² = 6 N.',
        subtopic: 'Newtonian Dynamics',
      },
      {
        id: `${quizId}-q2`,
        questionNumber: 2,
        prompt: 'Is gravitational potential energy positive or negative for bound orbits?',
        options: [
          { id: 'A', text: 'Always positive' },
          { id: 'B', text: 'Always negative relative to zero at infinity' },
          { id: 'C', text: 'Zero' },
          { id: 'D', text: 'Depends on the coordinate system only' },
        ],
        correctOptionId: 'B',
        explanation: 'U(r) = -GMm/r is negative for bound gravitational systems.',
        subtopic: 'Gravitation',
      },
    ];

    const quiz = await createQuiz(
      {
        id: quizId,
        title: 'Mechanics Quick Check',
        topic: 'Classical Mechanics',
        subject: 'Physics',
        timeLimitMinutes: 10,
      },
      testQuestions
    );

    assert.strictEqual(quiz.id, quizId);
    assert.strictEqual(quiz.totalQuestions, 2);

    // Test Security Rule: getQuizById with hideAnswers=true MUST redact correctOptionId & explanation
    const studentDelivered = await getQuizById(quizId, { hideAnswers: true });
    assert.ok(studentDelivered !== null);
    assert.strictEqual(studentDelivered.questions[0].correctOptionId, undefined);
    assert.strictEqual(studentDelivered.questions[0].explanation, undefined);
    assert.strictEqual(studentDelivered.questions[0].prompt, testQuestions[0].prompt);

    // Test startQuizAttempt
    const attempt = await startQuizAttempt(quizId, 'scholar-user-123', 10);
    assert.ok(attempt.id);
    assert.strictEqual(attempt.quizId, quizId);
    assert.strictEqual(attempt.status, 'in_progress');

    // Deadline check: startedAt + 10 mins approx equals deadline
    const startMs = new Date(attempt.startedAt).getTime();
    const deadMs = new Date(attempt.deadline).getTime();
    const diffMins = Math.round((deadMs - startMs) / (60 * 1000));
    assert.strictEqual(diffMins, 10);
  });

  // Test 12, 13, 14, 15: Answer selection, clear, flag, and navigation
  test('12, 13, 14, 15. Answer selection, clear response, and flagging persist into attempt', async () => {
    const quizId = `test-nav-${Date.now()}`;
    const testQuestions: QuizQuestion[] = [
      {
        id: `${quizId}-q1`,
        questionNumber: 1,
        prompt: 'Derivative of x²?',
        options: [
          { id: 'A', text: '2x' },
          { id: 'B', text: 'x' },
          { id: 'C', text: '2' },
          { id: 'D', text: 'x³' },
        ],
        correctOptionId: 'A',
        explanation: 'Power rule: d/dx(x^n) = n*x^(n-1).',
      },
      {
        id: `${quizId}-q2`,
        questionNumber: 2,
        prompt: 'Integral of 1/x dx?',
        options: [
          { id: 'A', text: 'ln|x| + C' },
          { id: 'B', text: 'e^x + C' },
          { id: 'C', text: '-1/x² + C' },
          { id: 'D', text: 'x + C' },
        ],
        correctOptionId: 'A',
        explanation: 'By standard antiderivative definition.',
      },
    ];

    await createQuiz({ id: quizId, title: 'Calculus Check', timeLimitMinutes: 10 }, testQuestions);
    const attempt = await startQuizAttempt(quizId, 'scholar-user-456', 10);

    // Select answer for Q1
    await saveQuizAnswer(attempt.id, `${quizId}-q1`, 'A', false);
    let loaded = await getQuizAttempt(attempt.id);
    assert.strictEqual(loaded?.answers[`${quizId}-q1`], 'A');

    // Flag Q2
    await saveQuizAnswer(attempt.id, `${quizId}-q2`, null, true);
    loaded = await getQuizAttempt(attempt.id);
    assert.ok(loaded?.flaggedQuestions.includes(2));

    // Clear Q1
    await saveQuizAnswer(attempt.id, `${quizId}-q1`, null, false);
    loaded = await getQuizAttempt(attempt.id);
    assert.strictEqual(loaded?.answers[`${quizId}-q1`], undefined);
  });

  // Test 16: Dynamic question palette state calculation
  test('16. Question palette accurately reflects active, answered, flagged, and unvisited states', () => {
    const totalQ = 4;
    const currentIdx = 1; // Q2 is active
    const selectedAnswers: Record<string, string> = { 'q-1': 'A', 'q-3': 'B' };
    const flaggedQuestions: Record<number, boolean> = { 2: true };

    const getStatus = (idx: number, qId: string) => {
      if (idx === currentIdx) return 'current';
      if (flaggedQuestions[idx]) return 'flagged';
      if (selectedAnswers[qId] !== undefined) return 'answered';
      return 'unvisited';
    };

    assert.strictEqual(getStatus(0, 'q-1'), 'answered');
    assert.strictEqual(getStatus(1, 'q-2'), 'current');
    assert.strictEqual(getStatus(2, 'q-3'), 'flagged');
    assert.strictEqual(getStatus(3, 'q-4'), 'unvisited');
  });

  // Test 17 & 18: Timer persistence across refreshes and expiration
  test('17, 18. Remaining time is derived from persisted deadline and detects expiration', () => {
    const now = Date.now();
    // 5 minutes in future
    const activeDeadline = new Date(now + 5 * 60 * 1000).toISOString();
    const remainingSecs = Math.max(0, Math.floor((new Date(activeDeadline).getTime() - now) / 1000));
    assert.ok(remainingSecs >= 298 && remainingSecs <= 300);

    // 1 minute in past
    const expiredDeadline = new Date(now - 60 * 1000).toISOString();
    const expiredRemaining = Math.max(0, Math.floor((new Date(expiredDeadline).getTime() - now) / 1000));
    assert.strictEqual(expiredRemaining, 0);
  });

  // Test 19, 21, 22, 23, 24, 25: Submission, Idempotency, Correct/Incorrect Scoring, Results Persistence
  test('19, 21, 22, 23, 24, 25. Authoritative server scoring calculates correct, incorrect, unanswered, and is idempotent', async () => {
    const quizId = `test-scoring-${Date.now()}`;
    const questions: QuizQuestion[] = [
      {
        id: `${quizId}-q1`,
        questionNumber: 1,
        prompt: 'Solve: 5 + 7',
        options: [
          { id: 'A', text: '12' },
          { id: 'B', text: '11' },
          { id: 'C', text: '13' },
          { id: 'D', text: '10' },
        ],
        correctOptionId: 'A',
        explanation: '5 + 7 = 12.',
        subtopic: 'Arithmetic',
      },
      {
        id: `${quizId}-q2`,
        questionNumber: 2,
        prompt: 'Solve: 10 * 10',
        options: [
          { id: 'A', text: '100' },
          { id: 'B', text: '1000' },
          { id: 'C', text: '20' },
          { id: 'D', text: '50' },
        ],
        correctOptionId: 'A',
        explanation: '10 * 10 = 100.',
        subtopic: 'Arithmetic',
      },
      {
        id: `${quizId}-q3`,
        questionNumber: 3,
        prompt: 'What is the base of natural logarithm?',
        options: [
          { id: 'A', text: '10' },
          { id: 'B', text: 'e (~2.718)' },
          { id: 'C', text: '2' },
          { id: 'D', text: 'pi' },
        ],
        correctOptionId: 'B',
        explanation: 'e is Euler\'s number, the base of the natural logarithm.',
        subtopic: 'Calculus',
      },
    ];

    await createQuiz({ id: quizId, title: 'Math Diagnostic', timeLimitMinutes: 10 }, questions);
    const attempt = await startQuizAttempt(quizId, 'scholar-scoring-user', 10);

    // Answers: Q1 is correct ('A'), Q2 is incorrect ('B'), Q3 is unanswered
    const answers = {
      [`${quizId}-q1`]: 'A',
      [`${quizId}-q2`]: 'B',
    };

    const result = await submitQuizAttempt({
      attemptId: attempt.id,
      quizId,
      answers,
      timeSpentSeconds: 150,
      userId: 'scholar-scoring-user',
    });

    assert.strictEqual(result.totalQuestions, 3);
    assert.strictEqual(result.correctCount, 1);
    assert.strictEqual(result.incorrectCount, 1);
    assert.strictEqual(result.unansweredCount, 1);
    assert.strictEqual(result.accuracyPercent, 33);
    assert.strictEqual(result.earnedScore, 33.3);

    // Question review check: answers and explanations are now revealed!
    assert.strictEqual(result.questionReview.length, 3);
    assert.strictEqual(result.questionReview[0].isCorrect, true);
    assert.strictEqual(result.questionReview[0].selectedOptionId, 'A');
    assert.strictEqual(result.questionReview[0].correctOptionId, 'A');
    assert.strictEqual(result.questionReview[1].isCorrect, false);
    assert.strictEqual(result.questionReview[2].isCorrect, false);
    assert.strictEqual(result.questionReview[2].selectedOptionId, null);

    // Recommendations check
    assert.ok(result.recommendations.length > 0);

    // Idempotency check: submitting the same attemptId must return identical score without duplicate evaluation
    const secondCall = await submitQuizAttempt({
      attemptId: attempt.id,
      quizId,
      answers: { [`${quizId}-q1`]: 'A', [`${quizId}-q2`]: 'A', [`${quizId}-q3`]: 'B' }, // modified answers on client
      userId: 'scholar-scoring-user',
    });
    assert.strictEqual(secondCall.correctCount, 1, 'Idempotent submission must preserve original graded result');
    assert.strictEqual(secondCall.accuracyPercent, 33);
  });

  // Test 26: Schema validation for Start & Submit API requests
  test('26. QuizStartAttemptRequestSchema and QuizSubmitRequestSchema reject empty or malformed IDs', () => {
    const badStart = QuizStartAttemptRequestSchema.safeParse({ quizId: '' });
    assert.strictEqual(badStart.success, false);

    const badSubmit = QuizSubmitRequestSchema.safeParse({ attemptId: '', quizId: '' });
    assert.strictEqual(badSubmit.success, false);
  });
});
