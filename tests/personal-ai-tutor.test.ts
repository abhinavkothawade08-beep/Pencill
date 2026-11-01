import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TutorRequestSchema,
  PERSONALITY_SYSTEM_PROMPTS,
  generateFallbackResponse,
} from '../src/lib/tutor/tutor-service';

test('Personal AI Tutor Suite', async (t) => {
  await t.test('TutorRequestSchema: validates structured tutor input', () => {
    const valid = TutorRequestSchema.parse({
      courseTitle: 'Introduction to Algorithms',
      moduleTitle: 'Graph Theory',
      lessonTitle: 'Breadth-First Search (BFS)',
      personality: 'socratic_tutor',
      message: 'Why do we need a queue for BFS instead of a stack?',
      conversationHistory: [],
    });

    assert.equal(valid.personality, 'socratic_tutor');
    assert.equal(valid.lessonTitle, 'Breadth-First Search (BFS)');
  });

  await t.test('TutorRequestSchema: rejects empty user message', () => {
    assert.throws(() => {
      TutorRequestSchema.parse({
        courseTitle: 'Calculus',
        moduleTitle: 'Limits',
        lessonTitle: 'Epsilon-Delta Definition',
        message: '',
      });
    });
  });

  await t.test('All 6 tutor personalities have distinct pedagogical system prompts', () => {
    const requiredPersonalities = [
      'simple_teacher',
      'socratic_tutor',
      'exam_prep',
      'practical_instructor',
      'programming_mentor',
      'research_assistant',
    ];

    for (const p of requiredPersonalities) {
      assert.ok(
        PERSONALITY_SYSTEM_PROMPTS[p],
        `Personality "${p}" must have a defined system prompt`
      );
      assert.ok(
        PERSONALITY_SYSTEM_PROMPTS[p].length > 50,
        `Personality "${p}" prompt must be substantive`
      );
    }
  });

  await t.test('generateFallbackResponse: provides personality-specific pedagogical guidance when offline', () => {
    const socratic = generateFallbackResponse(
      'socratic_tutor',
      'Dynamic Programming',
      'Can you explain memoization?'
    );
    assert.ok(
      socratic.includes('Dynamic Programming'),
      'Should mention lesson title'
    );
    assert.ok(
      socratic.includes('?'),
      'Socratic response should include guiding questions'
    );

    const exam = generateFallbackResponse(
      'exam_prep',
      'Newton Laws of Motion',
      'How to solve pulley problems?'
    );
    assert.ok(exam.includes('Exam Focus'), 'Exam prep response must highlight exam focus');
    assert.ok(exam.includes('Common Trap'), 'Exam prep response must highlight common traps');

    const programming = generateFallbackResponse(
      'programming_mentor',
      'Binary Search Tree',
      'Why is my deletion buggy?'
    );
    assert.ok(
      programming.includes('Complexity') || programming.includes('Defensive Guard'),
      'Programming response must include complexity or defensive code advice'
    );
  });
});
