import { NextRequest, NextResponse } from 'next/server';
import { resourceEngine } from '@/lib/resource-engine';
import { LearnerGoalInputSchema, EngineTelemetryStage, ResourceEngineTelemetry } from '@/lib/resource-engine/types';
import { getAuthenticatedSupabaseClient } from '@/services/supabase/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60s max for intensive synthesis

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = LearnerGoalInputSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error: Invalid course generation parameters.',
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    // Extract auth user if access token is present
    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1]?.trim();
      if (token) {
        try {
          const authClient = getAuthenticatedSupabaseClient(token);
          const { data } = await authClient.auth.getUser();
          if (data?.user?.id) {
            userId = data.user.id;
          }
        } catch {
          // Continue as guest
        }
      }
    }

    const wantsStream =
      req.headers.get('accept')?.includes('text/event-stream') ||
      req.nextUrl.searchParams.get('stream') === 'true';

    if (wantsStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const result = await resourceEngine.execute(parseResult.data, userId, {
              onStageChange: (stage: EngineTelemetryStage) => {
                try {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'stage', stage })}\n\n`)
                  );
                } catch {}
              },
              onTelemetryUpdate: (telemetry: ResourceEngineTelemetry) => {
                try {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'telemetry', telemetry })}\n\n`)
                  );
                } catch {}
              },
            });

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'complete', data: result })}\n\n`)
            );
            controller.close();
          } catch (err: any) {
            try {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'error', error: err.message || 'Generation failed' })}\n\n`
                )
              );
              controller.close();
            } catch {}
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    const result = await resourceEngine.execute(parseResult.data, userId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('[API /api/courses/generate Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Course generation failed on the server.',
      },
      { status: 500 }
    );
  }
}
