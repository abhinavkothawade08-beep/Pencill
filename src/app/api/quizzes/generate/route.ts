import { NextRequest, NextResponse } from 'next/server';
import { QuizGenerateRequestSchema } from '@/lib/api-schemas';
import { GeminiProvider } from '@/services/ai/gemini/geminiProvider';
import { createQuiz } from '@/services/supabase/quizService';
import { supabase, isSupabaseConfigured, getAuthenticatedSupabaseClient } from '@/services/supabase/client';
import { QuizQuestion } from '@/types';
import { generateGroundedFallbackQuiz } from '@/lib/resource-engine/quiz-generator';

const geminiProvider = new GeminiProvider();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = QuizGenerateRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      topic,
      subject,
      gradeLevel,
      curriculum,
      examTarget,
      knowledgeLevel,
      difficulty,
      questionCount,
      questionFormat,
      timeLimitMinutes,
      includeExplanations,
      learningObjectives,
      courseId,
      moduleId,
    } = parseResult.data;

    // Optional user authentication via Bearer token
    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const client = getAuthenticatedSupabaseClient(token || undefined);

    if (token && isSupabaseConfigured) {
      try {
        const { data: { user } } = await client.auth.getUser(token);
        if (user) {
          userId = user.id;
        }
      } catch {
        // Guest generation is permitted
      }
    }

    // Generate questions using Gemini if key is present, otherwise fallback to grounded psychometric bank
    let generated: any = null;
    if (process.env.GEMINI_API_KEY) {
      try {
        generated = await geminiProvider.generateQuizQuestions({
          topic,
          subject,
          gradeLevel,
          curriculum,
          examTarget,
          knowledgeLevel,
          difficulty,
          questionCount,
          questionFormat,
          includeExplanations,
          learningObjectives,
        });
      } catch (aiErr) {
        console.warn(`[QuizGenerateAPI] Gemini quiz generation failed, invoking grounded fallback quiz:`, (aiErr as Error).message);
      }
    }

    if (!generated || !generated.questions || generated.questions.length === 0) {
      const fallback = generateGroundedFallbackQuiz(
        {
          id: moduleId || 'mod-fallback',
          moduleNumber: 1,
          title: topic,
          description: `Diagnostic assessment on ${topic}`,
          learningObjectives: [
            { id: 'obj-1', statement: `Demonstrate conceptual understanding of ${topic}`, keyTerms: [topic] },
          ],
          prerequisites: [],
          estimatedHours: 2,
          expectedOutcomes: [],
          searchQueries: { videoQueries: [], readingQueries: [] },
        },
        (subject || 'Computer Science') as any,
        topic
      );

      generated = {
        title: fallback.title,
        domain: subject || 'General Studies',
        subject: subject || 'General Studies',
        timeLimitMinutes: fallback.timeLimitMinutes,
        questions: fallback.questions.map((q, idx) => ({
          questionNumber: idx + 1,
          prompt: q.prompt,
          questionType: 'single_choice',
          difficulty: q.difficulty || 'medium',
          options: q.options.map((opt, oIdx) => ({
            id: ['A', 'B', 'C', 'D'][oIdx] || `opt-${oIdx + 1}`,
            text: opt,
          })),
          correctOptionId: ['A', 'B', 'C', 'D'][q.correctOptionIndex] || 'A',
          explanation: q.explanation,
        })),
      };
    }

    const quizId = `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const calculatedDuration = timeLimitMinutes || generated.timeLimitMinutes || Math.max(5, generated.questions.length * 2);

    const quizQuestions: QuizQuestion[] = generated.questions.map((q: any, idx: number) => ({
      id: `${quizId}-q${idx + 1}`,
      questionNumber: idx + 1,
      prompt: q.prompt,
      stemNote: q.stemNote,
      options: q.options,
      correctOptionId: q.correctOptionId,
      explanation: q.explanation,
      formulaReference: q.formulaReference,
      hint: q.hint,
      difficulty: q.difficulty || difficulty,
      subtopic: q.subtopic || topic,
      questionType: (q.questionType as any) || questionFormat || 'single_choice',
    }));

    // Persist quiz to Supabase and cache
    const savedQuiz = await createQuiz(
      {
        id: quizId,
        title: generated.title || `${topic} Assessment`,
        topic,
        subject: subject || generated.subject || 'Academic Studies',
        gradeLevel,
        curriculum,
        examTarget,
        knowledgeLevel,
        difficulty,
        courseId,
        moduleId,
        timeLimitMinutes: calculatedDuration,
        userId,
      },
      quizQuestions,
      userId,
      client
    );

    // Prepare safe client response (omitting answers for taking)
    const clientSafeQuiz = {
      id: savedQuiz.id,
      title: savedQuiz.title,
      topic: savedQuiz.topic,
      subject: savedQuiz.subject,
      difficulty: savedQuiz.difficulty,
      totalQuestions: savedQuiz.totalQuestions,
      timeLimitMinutes: savedQuiz.timeLimitMinutes,
      courseId: savedQuiz.courseId,
      moduleId: savedQuiz.moduleId,
      createdAt: savedQuiz.createdAt,
      questions: quizQuestions.map((q) => ({
        id: q.id,
        questionNumber: q.questionNumber,
        prompt: q.prompt,
        stemNote: q.stemNote,
        options: q.options,
        difficulty: q.difficulty,
        subtopic: q.subtopic,
        hint: q.hint,
        questionType: q.questionType,
      })),
    };

    // For backwards compatibility with EngineResource discovery
    const canonical = `https://pencill.ai/practice/${quizId}`;
    const resourcePayload = {
      id: quizId,
      title: savedQuiz.title,
      description: `Interactive formative assessment containing ${quizQuestions.length} questions to calibrate your mastery of ${topic}.`,
      type: 'ai_quiz',
      canonicalUrl: canonical,
      sourceUrl: canonical,
      sourceName: 'Pencill AI Assessment',
      provider: 'quiz',
      durationMinutes: calculatedDuration,
      difficulty,
      tags: ['quiz', 'assessment', 'practice', topic.toLowerCase()],
      metadata: {
        questionCount: quizQuestions.length,
        isInteractive: true,
      },
    };

    return NextResponse.json({
      success: true,
      quizId: savedQuiz.id,
      quiz: clientSafeQuiz,
      resource: resourcePayload,
    });
  } catch (err: unknown) {
    console.error('[API /api/quizzes/generate] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Quiz generation failed',
      },
      { status: 500 }
    );
  }
}
