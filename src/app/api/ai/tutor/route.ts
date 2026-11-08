import { NextRequest, NextResponse } from 'next/server';
import { callGemini, GeminiClientError } from '@/services/ai/gemini/client';
import {
  TutorRequestSchema,
  PERSONALITY_SYSTEM_PROMPTS,
  generateFallbackResponse,
} from '@/lib/tutor/tutor-service';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const payload = TutorRequestSchema.parse(json);

    const systemPrompt = PERSONALITY_SYSTEM_PROMPTS[payload.personality] || PERSONALITY_SYSTEM_PROMPTS.simple_teacher;

    const contextHeader = `
EDUCATIONAL CONTEXT:
Course: ${payload.courseTitle}
Module: ${payload.moduleTitle}
Active Lesson: ${payload.lessonTitle} (${payload.lessonType})
${payload.studyNotes ? `Lesson Key Concepts: ${JSON.stringify(payload.studyNotes).slice(0, 500)}` : ''}

CONVERSATION HISTORY:
${payload.conversationHistory.slice(-4).map((m) => `${m.sender.toUpperCase()}: ${m.text}`).join('\n')}

STUDENT'S INQUIRY:
${payload.message}
`;

    let replyText = '';
    let isFallback = false;
    try {
      replyText = await callGemini(contextHeader, systemPrompt, {
        temperature: payload.personality === 'socratic_tutor' ? 0.4 : 0.2,
        maxOutputTokens: 1000,
      });
    } catch (err) {
      console.warn('[PersonalAITutor API] Gemini call fell back to deterministic response:', (err as any)?.message);
      replyText = generateFallbackResponse(payload.personality, payload.lessonTitle, payload.message);
      isFallback = true;
    }

    // Dynamic suggested next queries
    const suggestions: string[] = [];
    if (payload.personality === 'simple_teacher') {
      suggestions.push('Can you give another analogy?', 'How does this apply in real life?');
    } else if (payload.personality === 'socratic_tutor') {
      suggestions.push('Give me a small hint', 'I think the answer is related to the boundary conditions');
    } else if (payload.personality === 'exam_prep') {
      suggestions.push('Show me a typical trick question', 'What formula should I memorize?');
    } else if (payload.personality === 'programming_mentor') {
      suggestions.push('What is the Big-O complexity?', 'Show me code with error handling');
    } else {
      suggestions.push('Explain the math step-by-step', 'What are the main misconceptions?');
    }

    return NextResponse.json({
      success: true,
      response: replyText,
      personality: payload.personality,
      suggestions,
      isFallback,
    });
  } catch (err: any) {
    console.error('[PersonalAITutor API Error]', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to process tutor query',
      },
      { status: 400 }
    );
  }
}
