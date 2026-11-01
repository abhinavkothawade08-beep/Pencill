import { NextRequest, NextResponse } from 'next/server';
import { onDemandReadingEngine } from '@/lib/reading-engine';
import { RegenerateReadingRequestSchema } from '@/lib/reading-engine/types';
import { getAuthenticatedSupabaseClient } from '@/services/supabase/client';
import { classifyReadingError, logReadingEngineError } from '@/lib/reading-engine/error-handler';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: { documentId: string } }
) {
  const documentId = params?.documentId;
  const requestId = `req_regen_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  try {
    if (!documentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'documentId parameter is required.',
          stage: 'validation',
          code: 'MISSING_DOCUMENT_ID',
          requestId,
        },
        { status: 400 }
      );
    }

    let rawBody: Record<string, unknown> = {};
    try {
      rawBody = await req.json();
    } catch {
      // Body may be empty
    }

    const parseResult = RegenerateReadingRequestSchema.safeParse({
      documentId,
      ...rawBody,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error: Invalid regeneration parameters.',
          stage: 'validation',
          code: 'INVALID_PARAMETERS',
          requestId,
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

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

    console.info(`[API /api/reading/${documentId}/regenerate][${requestId}] Initiating regeneration:`, {
      reason: parseResult.data.reason,
      userId: userId || 'anonymous',
    });

    const document = await onDemandReadingEngine.regenerateDocument(
      documentId,
      parseResult.data.reason,
      userId,
      token
    );

    return NextResponse.json({
      success: true,
      data: document,
      requestId,
    });
  } catch (err: unknown) {
    const structured = classifyReadingError(err, requestId);
    logReadingEngineError(`RegenerateRoute:${documentId}`, structured);

    return NextResponse.json(
      {
        success: false,
        error: structured.userMessage,
        stage: structured.stage,
        code: structured.code,
        requestId: structured.requestId,
      },
      { status: structured.statusCode }
    );
  }
}
