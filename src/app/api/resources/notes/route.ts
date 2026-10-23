import { NextRequest, NextResponse } from 'next/server';
import { discoverLessonNotes, EngineResource } from '@/lib/resource-engine-v2';
import { NotesDiscoverRequestSchema } from '@/lib/api-schemas';
import { LessonNoteResource } from '@/types';

function mapToLessonNote(r: EngineResource): LessonNoteResource {
  let noteType: LessonNoteResource['type'] = 'study_notes';
  if (r.type === 'pdf_lecture_notes' || r.metadata?.isDirectPdf) {
    noteType = 'pdf_notes';
  } else if (r.type === 'lecture_handout') {
    noteType = 'lecture_handout';
  } else if (r.type === 'official_documentation') {
    noteType = 'official_documentation';
  } else if (r.type === 'reference_guide') {
    noteType = 'reference_guide';
  } else if (r.type === 'textbook') {
    noteType = 'textbook';
  } else if (r.type === 'research_paper') {
    noteType = 'research_paper';
  } else if (r.type === 'practice_questions' || r.type === 'pyq') {
    noteType = 'practice_exercise';
  } else {
    noteType = 'educational_article';
  }

  const directUrl = r.canonicalUrl || r.sourceUrl;
  const isDirectPdf = Boolean(r.metadata?.isDirectPdf || directUrl.toLowerCase().endsWith('.pdf'));

  return {
    id: r.id,
    title: r.title,
    type: noteType,
    sourceUrl: directUrl,
    downloadUrl: (r.metadata?.downloadUrl as string) || (isDirectPdf ? directUrl : undefined),
    publisher: r.authorOrChannel || r.sourceName,
    description: r.description,
    isDirectPdf,
    qualityScore: r.score?.overall ?? r.finalScore ?? 75,
    relevanceExplanation: r.score?.explanation || `Verified ${noteType.replace('_', ' ')} from ${r.sourceName}`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = NotesDiscoverRequestSchema.safeParse(rawBody);

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

    const { topic, lessonTitle, domain, examContext, limit, minQualityScore } = parseResult.data;
    const targetLesson = (lessonTitle || topic).trim();

    const resources = await discoverLessonNotes(targetLesson, topic, {
      domain,
      examContext,
      limit,
      minQualityScore: minQualityScore ?? 40,
    });

    const notes: LessonNoteResource[] = resources.map(mapToLessonNote);

    return NextResponse.json({
      success: true,
      lessonTitle: targetLesson,
      topic,
      notes,
      total: notes.length,
      isFallbackEmpty: notes.length === 0,
      metadata: {
        searchedAt: new Date().toISOString(),
        limit,
      },
    });
  } catch (err: unknown) {
    console.error('[API /api/resources/notes] Discovery error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Notes discovery failed',
      },
      { status: 500 }
    );
  }
}
