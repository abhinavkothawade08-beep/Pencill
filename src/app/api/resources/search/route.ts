import { NextRequest, NextResponse } from 'next/server';
import { discoverResources } from '@/lib/resource-engine-v2';
import { ResourceSearchRequestSchema } from '@/lib/api-schemas';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = ResourceSearchRequestSchema.safeParse(rawBody);

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

    const { query, limit } = parseResult.data;

    // Fast search with Resource Engine 2.0
    const result = await discoverResources(query, {
      limit,
    });

    return NextResponse.json({
      success: true,
      resources: result.rankedResources.map((r) => r.resource),
      totalFound: result.totalFound,
      metadata: {
        query,
        providers: ['youtube', 'arxiv', 'openalex'],
        total: result.rankedResources.length,
      },
    });
  } catch (err: unknown) {
    console.error('[API /api/resources/search] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Search request failed',
      },
      { status: 500 }
    );
  }
}
