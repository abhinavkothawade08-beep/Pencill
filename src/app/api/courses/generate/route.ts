import { NextRequest, NextResponse } from 'next/server';
import { resourceEngine } from '@/lib/resource-engine';
import { LearnerGoalInputSchema } from '@/lib/resource-engine/types';
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
