import { NextResponse } from 'next/server';
import { aiService, GeminiClientError } from '@/services/ai';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/test
 * Quick connectivity health check for the server-side Gemini AI provider.
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Quick test: generate a 2-question diagnostic quiz outline
    const testQuiz = await aiService.generateQuizQuestions({
      topic: 'Classical Mechanics & Vectors',
      domain: 'Physics',
      difficulty: 'medium',
      questionCount: 2,
    });

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      provider: aiService.providerName,
      latencyMs,
      sampleOutput: {
        title: testQuiz.title,
        domain: testQuiz.domain,
        questionCount: testQuiz.questions.length,
        firstQuestionPrompt: testQuiz.questions[0]?.prompt,
      },
    });
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const isClientError = err instanceof GeminiClientError;

    return NextResponse.json(
      {
        status: 'error',
        provider: aiService.providerName,
        latencyMs,
        error: (err as Error).message,
        statusCode: isClientError ? (err as GeminiClientError).statusCode : 500,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/test
 * Test specific capabilities (path, module, summary, quiz, resources, recommendations)
 */
export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const capability = body.capability || 'path';

    let result: unknown;

    switch (capability) {
      case 'path':
        result = await aiService.generateLearningPath({
          topic: body.topic || 'Linear Algebra: Eigenvalues and Spectral Theorem',
          depth: body.depth || 'rigorous',
          weeklyHours: body.weeklyHours || 6,
        });
        break;

      case 'summary':
        result = await aiService.generateLessonSummary({
          lessonTitle: body.lessonTitle || 'Stokes Theorem and Surface Integrals',
          domain: body.domain || 'Mathematics',
          contentOrTranscript:
            body.content ||
            'Stokes theorem relates the surface integral of the curl of a vector field over a surface in Euclidean three-space to the line integral of the vector field over its boundary curve.',
        });
        break;

      case 'quiz':
        result = await aiService.generateQuizQuestions({
          topic: body.topic || 'Thermodynamic Cycles & Entropy',
          domain: body.domain || 'Physics',
          difficulty: body.difficulty || 'medium',
          questionCount: body.questionCount || 2,
        });
        break;

      case 'recommendations':
        result = await aiService.generateRecommendations({
          userCurrentLevel: body.level || 'Class 11',
          completedTopics: body.completedTopics || ['Vectors', '1D Kinematics'],
          recentQuizAccuracyPercent: body.accuracy ?? 85,
        });
        break;

      default:
        return NextResponse.json(
          {
            error: `Unsupported test capability: "${capability}". Supported: path, summary, quiz, recommendations`,
          },
          { status: 400 }
        );
    }

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      capability,
      provider: aiService.providerName,
      latencyMs,
      data: result,
    });
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    return NextResponse.json(
      {
        success: false,
        latencyMs,
        error: (err as Error).message,
      },
      { status: 500 }
    );
  }
}
