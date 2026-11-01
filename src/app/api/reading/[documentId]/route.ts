import { NextRequest, NextResponse } from 'next/server';
import { getGeneratedReadingById } from '@/services/supabase/readingService';
import { classifyReadingError, logReadingEngineError } from '@/lib/reading-engine/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { documentId: string } }
) {
  const documentId = params?.documentId;
  const requestId = `req_get_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  try {
    if (!documentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Document ID is required.',
          stage: 'validation',
          code: 'MISSING_DOCUMENT_ID',
          requestId,
        },
        { status: 400 }
      );
    }

    let token: string | undefined = undefined;
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split('Bearer ')[1]?.trim();
    }

    const document = await getGeneratedReadingById(documentId, token);
    if (!document) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reading document not found.',
          stage: 'context',
          code: 'DOCUMENT_NOT_FOUND',
          requestId,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: document,
      requestId,
    });
  } catch (err: unknown) {
    const structured = classifyReadingError(err, requestId);
    logReadingEngineError(`GetRoute:${documentId}`, structured);

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
