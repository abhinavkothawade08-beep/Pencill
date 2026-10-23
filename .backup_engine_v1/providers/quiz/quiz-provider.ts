import { ResourceProvider, ProviderSearchOptions } from '../base-provider';
import { EngineResource } from '../../types';
import { callGemini } from '@/services/ai/gemini/client';
import { extractJsonFromText } from '../../utils/text-utils';

export interface QuizQuestionItem {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export class QuizProvider implements ResourceProvider {
  readonly id = 'ai-quiz-engine';
  readonly name = 'Pencill AI Quiz Generator';
  readonly providerType = 'quiz' as const;
  readonly supportedTypes = ['ai_quiz' as const];

  isAvailable(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }

  getAvailabilityStatus(): { available: boolean; reason?: string } {
    if (!this.isAvailable()) {
      return {
        available: false,
        reason: 'GEMINI_API_KEY is not configured for AI quiz generation.',
      };
    }
    return { available: true };
  }

  async search(query: string, options?: ProviderSearchOptions): Promise<EngineResource[]> {
    if (!this.isAvailable()) return [];

    try {
      const quiz = await this.generateQuiz(query, options);
      if (!quiz) return [];
      return [quiz];
    } catch (err) {
      console.warn('[QuizProvider] Failed to generate AI quiz:', err instanceof Error ? err.message : String(err));
      return [];
    }
  }

  async generateQuiz(
    topic: string,
    options?: ProviderSearchOptions
  ): Promise<EngineResource | null> {
    const questionCount = 5;
    const prompt = `
You are the Senior Assessment Psychometrician at Pencill.
Generate a high-yield diagnostic quiz with exactly ${questionCount} multiple choice questions for:
- Topic: "${topic}"
- Target Level: "${options?.difficulty || 'intermediate'}"
- Exam Context: "${options?.examContext || 'General Rigorous Study'}"

REQUIREMENTS:
- Questions must test deep conceptual understanding, intuition, and error discrimination (not just rote recall).
- Provide exactly 4 options per question.
- Explicitly identify the 0-indexed correct option.
- Include a crisp pedagogical explanation for why the option is correct and where students typically stumble.
- Output ONLY valid JSON.

JSON Structure:
{
  "quizTitle": "Diagnostic Check: ${topic}",
  "estimatedMinutes": 15,
  "difficulty": "${options?.difficulty || 'intermediate'}",
  "questions": [
    {
      "id": "q1",
      "question": "Question text...",
      "options": ["A", "B", "C", "D"],
      "correctOptionIndex": 0,
      "explanation": "Detailed rationale..."
    }
  ]
}
`.trim();

    const response = await callGemini(prompt, undefined, {
      temperature: 0.2,
      timeoutMs: options?.timeoutMs || 25000,
    });

    const parsed = extractJsonFromText<{
      quizTitle: string;
      estimatedMinutes: number;
      difficulty: string;
      questions: QuizQuestionItem[];
    }>(response);

    if (!parsed || !parsed.questions || parsed.questions.length === 0) {
      console.warn('[QuizProvider] Parsed quiz was null or empty. Raw response was:\n', response.slice(0, 500));
      return null;
    }

    const quizId = `quiz_${Date.now()}`;
    const canonical = `https://pencill.ai/practice/${quizId}`;

    return {
      id: quizId,
      title: parsed.quizTitle || `Practice Quiz: ${topic}`,
      description: `Interactive formative assessment containing ${parsed.questions.length} questions to calibrate your mastery of ${topic}.`,
      type: 'ai_quiz',
      canonicalUrl: canonical,
      sourceUrl: canonical,
      sourceName: 'Pencill AI Assessment',
      provider: 'quiz',
      authorOrChannel: 'Pencill AI Curriculum Engine',
      durationMinutes: parsed.estimatedMinutes || 15,
      difficulty: (parsed.difficulty as EngineResource['difficulty']) || 'intermediate',
      language: 'en',
      score: {
        overall: 95,
        relevance: 98,
        educationalValue: 96,
        structureCompleteness: 95,
        freshness: 100,
        explanation: 'Dynamically synthesized tailored quiz calibrating conceptual misconceptions',
      },
      tags: ['quiz', 'assessment', 'practice', topic.toLowerCase()],
      metadata: {
        questions: parsed.questions,
        questionCount: parsed.questions.length,
        isInteractive: true,
      },
      discoveredAt: new Date().toISOString(),
    };
  }
}

