import { NextRequest, NextResponse } from 'next/server';
import { onDemandReadingEngine } from '@/lib/reading-engine';
import { classifyReadingError, logReadingEngineError } from '@/lib/reading-engine/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  const lessonId = params?.lessonId;
  const courseId = req.nextUrl.searchParams.get('courseId') || '';
  const requestId = `req_eval_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  try {
    if (!lessonId) {
      return NextResponse.json(
        {
          success: false,
          error: 'lessonId parameter is required.',
          stage: 'validation',
          code: 'MISSING_LESSON_ID',
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

    const evaluation = await onDemandReadingEngine.evaluateLessonReading(
      lessonId,
      courseId,
      null,
      token
    );

    return NextResponse.json({
      success: true,
      data: evaluation,
      requestId,
    });
  } catch (err: unknown) {
    const structured = classifyReadingError(err, requestId);
    logReadingEngineError(`EvalRoute:${lessonId}`, structured);

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
