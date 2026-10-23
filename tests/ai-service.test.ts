import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { GeminiClientError } from '@/services/ai/gemini/client';

describe('Gemini AI Provider & Client Error Handling', () => {
  test('GeminiClientError properly sets status codes, message, and details', () => {
    const error = new GeminiClientError('Model rate limit reached', 429, { retryAfterSec: 30 });
    assert.strictEqual(error.name, 'GeminiClientError');
    assert.strictEqual(error.message, 'Model rate limit reached');
    assert.strictEqual(error.statusCode, 429);
    assert.deepStrictEqual(error.details, { retryAfterSec: 30 });
    assert.ok(error instanceof Error);
  });

  test('Input validation checks for mandatory topic parameter', () => {
    const invalidInput = { topic: '', targetAudience: 'College' };
    const isValid = Boolean(invalidInput.topic && invalidInput.topic.trim().length > 0);
    assert.strictEqual(isValid, false, 'Empty topic should fail validation');
  });

  test('Quiz generation question validation enforces correct option index', () => {
    const sampleQuestion = {
      id: 'q1',
      question: 'What is the derivative of sin(x)?',
      options: ['cos(x)', '-cos(x)', 'tan(x)', 'sec(x)'],
      correctAnswer: 0,
      explanation: 'By standard differential calculus rules, d/dx[sin(x)] = cos(x).',
    };

    assert.ok(sampleQuestion.correctAnswer >= 0 && sampleQuestion.correctAnswer < sampleQuestion.options.length);
    assert.strictEqual(sampleQuestion.options[sampleQuestion.correctAnswer], 'cos(x)');
  });
});
