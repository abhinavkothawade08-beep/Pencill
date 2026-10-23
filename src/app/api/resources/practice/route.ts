import { NextRequest, NextResponse } from 'next/server';
import { discoverPractice } from '@/lib/resource-engine-v2';
import { searchResourcesInDatabase, getVerifiedResources } from '@/services/supabase/resourceService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get('topic') || searchParams.get('q') || '';
    const difficulty = searchParams.get('difficulty') || undefined;
    const examTarget = searchParams.get('examTarget') || searchParams.get('exam') || undefined;
    const limit = Math.min(25, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

    if (!topic.trim()) {
      // If no topic specified, fetch top verified practice resources from database
      const dbPractices = await getVerifiedResources({ type: 'practice', limit });
      return NextResponse.json({
        success: true,
        topic: 'Curated Practice Problems',
        resources: dbPractices,
        total: dbPractices.length,
        source: 'database',
      });
    }

    // 1. Check existing verified database practice resources
    const dbMatches = await searchResourcesInDatabase(topic, { type: 'practice', limit: 5 });

    // 2. Discover live practice problem sets, PYQs, and question banks
    const discovered = await discoverPractice(topic, {
      examContext: examTarget,
      difficulty,
      limit,
    });

    const formattedDiscovered = discovered.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      sourceName: r.sourceName,
      sourceUrl: r.canonicalUrl || r.sourceUrl,
      durationMinutes: r.durationMinutes,
      description: r.description,
      externalId: r.externalId,
      difficulty: r.difficulty,
      qualityScore: r.score?.overall ?? r.finalScore ?? 80,
      tags: r.tags || [],
    }));

    return NextResponse.json({
      success: true,
      topic,
      examTarget,
      difficulty,
      resources: formattedDiscovered,
      databaseMatches: dbMatches,
      total: formattedDiscovered.length,
      source: 'native-engine',
    });
  } catch (err) {
    console.error('[API /api/resources/practice] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Practice discovery failed',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const topic = (body.topic || body.query || '').trim();
    const difficulty = body.difficulty || undefined;
    const examTarget = body.examTarget || body.examContext || undefined;
    const limit = Math.min(30, Math.max(1, typeof body.limit === 'number' ? body.limit : 12));

    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'A search topic is required for practice resource discovery.' },
        { status: 400 }
      );
    }

    const discovered = await discoverPractice(topic, {
      examContext: examTarget,
      difficulty,
      limit,
    });

    const formatted = discovered.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      sourceName: r.sourceName,
      sourceUrl: r.canonicalUrl || r.sourceUrl,
      durationMinutes: r.durationMinutes,
      description: r.description,
      externalId: r.externalId,
      difficulty: r.difficulty,
      qualityScore: r.score?.overall ?? r.finalScore ?? 80,
      tags: r.tags || [],
    }));

    return NextResponse.json({
      success: true,
      topic,
      resources: formatted,
      total: formatted.length,
    });
  } catch (err) {
    console.error('[API /api/resources/practice] POST error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Practice discovery failed',
      },
      { status: 500 }
    );
  }
}
