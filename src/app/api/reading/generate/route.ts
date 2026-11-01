import { NextRequest, NextResponse } from 'next/server';
import { onDemandReadingEngine } from '@/lib/reading-engine';
import { GenerateReadingRequestSchema } from '@/lib/reading-engine/types';
import { getAuthenticatedSupabaseClient } from '@/services/supabase/client';
import { classifyReadingError, logReadingEngineError } from '@/lib/reading-engine/error-handler';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60s max for deep monograph synthesis

export async function POST(req: NextRequest) {
  const requestId = `req_gen_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const startTime = Date.now();

  try {
    const rawBody = await req.json();
    const parseResult = GenerateReadingRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const errorMsg = 'Validation Error: Invalid reading material generation parameters.';
      console.warn(`[API /api/reading/generate][${requestId}] Schema validation failed:`, parseResult.error.format());
      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
          stage: 'validation',
          code: 'INVALID_REQUEST_PARAMETERS',
          requestId,
          details: parseResult.error.format(),
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

    console.info(`[API /api/reading/generate][${requestId}] Initiating generation:`, {
      courseId: parseResult.data.courseId,
      lessonId: parseResult.data.lessonId,
      forceRegenerate: parseResult.data.forceRegenerate,
      hasClientContext: Boolean(parseResult.data.clientContext),
      userId: userId || 'anonymous',
    });

    const document = await onDemandReadingEngine.generateReadingDocument(
      parseResult.data,
      userId,
      token
    );

    const elapsed = Date.now() - startTime;
    console.info(`[API /api/reading/generate][${requestId}] Successfully generated monograph in ${elapsed}ms:`, {
      documentId: document.id,
      title: document.title,
      model: document.generationModel,
      tokens: document.tokenUsage,
    });

    return NextResponse.json({
      success: true,
      data: document,
      persisted: true,
      requestId,
    });
  } catch (err: unknown) {
    const structured = classifyReadingError(err, requestId);
    logReadingEngineError('GenerateRoute', structured);

    const unpersistedDocument = (err as any)?.unpersistedDocument || null;

    return NextResponse.json(
      {
        success: false,
        error: structured.userMessage,
        stage: structured.stage,
        code: structured.code,
        canRetrySaving: Boolean(unpersistedDocument),
        unpersistedDocument: unpersistedDocument,
        requestId: structured.requestId,
      },
      { status: structured.statusCode }
    );
  }
}
