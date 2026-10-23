import { NextRequest, NextResponse } from 'next/server';
import { EvaluationEngine, EngineResource } from '@/lib/resource-engine-v2';
import { z } from 'zod';

const evaluator = new EvaluationEngine();

const EvaluateRequestSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  targetLevel: z.string().optional(),
  examContext: z.string().optional(),
  resources: z.array(z.any()).min(1, 'At least one resource must be provided for evaluation'),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = EvaluateRequestSchema.safeParse(rawBody);

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

    const { topic, targetLevel, examContext, resources } = parseResult.data;

    const evalMap = await evaluator.evaluateBatch(
      (resources as EngineResource[]).slice(0, 10),
      {
        topic,
        targetLevel,
        examContext,
      }
    );

    const evaluations = Array.from(evalMap.values());

    return NextResponse.json({
      success: true,
      evaluations,
    });
  } catch (err: unknown) {
    console.error('[API /api/resources/evaluate] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Evaluation failed',
      },
      { status: 500 }
    );
  }
}
