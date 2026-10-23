import { NextRequest, NextResponse } from 'next/server';
import { QuizSubmitRequestSchema } from '@/lib/api-schemas';
import { submitQuizAttempt } from '@/services/supabase/quizService';
import { supabase, isSupabaseConfigured, getAuthenticatedSupabaseClient } from '@/services/supabase/client';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = QuizSubmitRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed on submission payload',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { attemptId, quizId, answers, flaggedQuestions, timeSpentSeconds } = parseResult.data;

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
        // Continue with anonymous/guest attempt
      }
    }

    const result = await submitQuizAttempt(
      {
        attemptId,
        quizId,
        answers,
        flaggedQuestions,
        timeSpentSeconds,
        userId,
      },
      client
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: unknown) {
    console.error('[API /api/quizzes/submit] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Authoritative grading failed',
      },
      { status: 500 }
    );
  }
}
