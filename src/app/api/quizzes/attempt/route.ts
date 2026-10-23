import { NextRequest, NextResponse } from 'next/server';
import { QuizStartAttemptRequestSchema } from '@/lib/api-schemas';
import { startQuizAttempt, getQuizAttempt, saveQuizAnswer } from '@/services/supabase/quizService';
import { supabase, isSupabaseConfigured, getAuthenticatedSupabaseClient } from '@/services/supabase/client';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = QuizStartAttemptRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed on attempt start payload',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { quizId, timeLimitMinutes, resumeAttemptId } = parseResult.data;

    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const client = getAuthenticatedSupabaseClient(token || undefined);

    if (token && isSupabaseConfigured) {
      try {
        const { data: { user } } = await client.auth.getUser(token);
        if (user) userId = user.id;
      } catch {
        // Guest mode
      }
    }

    const attempt = await startQuizAttempt(quizId, userId, timeLimitMinutes, client, resumeAttemptId);

    return NextResponse.json({
      success: true,
      attempt,
    });
  } catch (err: unknown) {
    console.error('[API /api/quizzes/attempt POST] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to start quiz attempt',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const attemptId = searchParams.get('attemptId');

    if (!attemptId) {
      return NextResponse.json(
        { success: false, error: 'attemptId query parameter is required' },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const client = getAuthenticatedSupabaseClient(token || undefined);

    const attempt = await getQuizAttempt(attemptId, client);
    if (!attempt) {
      return NextResponse.json(
        { success: false, error: 'Attempt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      attempt,
    });
  } catch (err: unknown) {
    console.error('[API /api/quizzes/attempt GET] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to fetch attempt',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { attemptId, questionId, selectedOption, isFlagged } = body;

    if (!attemptId || !questionId) {
      return NextResponse.json(
        { success: false, error: 'attemptId and questionId are required' },
        { status: 400 }
      );
    }

    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const client = getAuthenticatedSupabaseClient(token || undefined);

    if (token && isSupabaseConfigured) {
      try {
        const { data: { user } } = await client.auth.getUser(token);
        if (user) userId = user.id;
      } catch {
        // Guest mode
      }
    }

    await saveQuizAnswer(attemptId, questionId, selectedOption ?? null, Boolean(isFlagged), userId, client);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[API /api/quizzes/attempt PATCH] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to save answer',
      },
      { status: 500 }
    );
  }
}
