import { NextRequest, NextResponse } from 'next/server';
import { saveGeneratedReadingDocument } from '@/services/supabase/readingService';
import { getAuthenticatedSupabaseClient } from '@/services/supabase/client';
import { GeneratedReadingDocument } from '@/lib/reading-engine/types';
import { classifyReadingError, logReadingEngineError } from '@/lib/reading-engine/error-handler';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const requestId = `req_save_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  try {
    const rawBody = await req.json();
    const document = (rawBody.document || rawBody) as GeneratedReadingDocument;

    if (!document || !document.lessonId || !document.courseId || !document.content) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error: Invalid reading document provided for saving.',
          stage: 'validation',
          code: 'INVALID_DOCUMENT_PAYLOAD',
          requestId,
        },
        { status: 400 }
      );
    }

    // Extract auth user if access token is present
    let userId: string | null = null;
    let token: string | undefined = undefined;
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split('Bearer ')[1]?.trim();
      if (token) {
        try {
          const authClient = getAuthenticatedSupabaseClient(token);
          const { data } = await authClient.auth.getUser();
          if (data?.user?.id) {
            userId = data.user.id;
          }
        } catch {
          // Guest mode
        }
      }
    }

    if (userId) {
      document.userId = userId;
    }

    console.info(`[API /api/reading/save][${requestId}] Saving study notes for lesson ${document.lessonId}`);

    const savedDoc = await saveGeneratedReadingDocument(document, token);

    return NextResponse.json({
      success: true,
      data: savedDoc,
      persisted: true,
      requestId,
    });
  } catch (err: unknown) {
    const structured = classifyReadingError(err, requestId);
    logReadingEngineError('SaveRoute', structured);

    return NextResponse.json(
      {
        success: false,
        error: structured.userMessage || 'Database persistence failed. Please click Retry Saving.',
        stage: 'database',
        code: structured.code || 'DATABASE_PERSISTENCE_FAILED',
        canRetrySaving: true,
        requestId: structured.requestId,
      },
      { status: structured.statusCode || 500 }
    );
  }
}
