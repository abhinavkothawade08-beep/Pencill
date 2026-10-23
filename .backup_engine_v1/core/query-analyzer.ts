import { ParsedQuery, ResourceDifficulty, EngineResourceType } from '../types';
import { callGemini } from '@/services/ai/gemini/client';

export class QueryAnalyzer {
  /**
   * Primary entry point: deterministic parsing with optional AI semantic enhancement
   */
  async analyze(rawQuery: string, useAiFallback = true): Promise<ParsedQuery> {
    const trimmed = rawQuery.trim();
    const deterministic = this.analyzeDeterministic(trimmed);

    // If deterministic parsing extracted exam context and clear keywords, return immediately
    if (deterministic.examContext || (deterministic.keywords?.length || 0) >= 3 || !useAiFallback || !process.env.GEMINI_API_KEY) {
      return deterministic;
    }

    // Otherwise enhance with Gemini semantic intent extraction
    try {
      const aiEnhanced = await this.enhanceWithAi(trimmed, deterministic);
      return aiEnhanced;
    } catch {
      return deterministic;
    }
  }

  /**
   * Fast, reliable regex & dictionary extraction (zero latency)
   */
  analyzeDeterministic(rawQuery: string): ParsedQuery {
    const lower = rawQuery.toLowerCase();

    // 1. Detect Exam Context
    let examContext: string | undefined;
    if (/\b(jee|jee main|jee advanced|iit|iit jee)\b/.test(lower)) {
      examContext = 'JEE';
    } else if (/\b(neet|medical entrance|aiims)\b/.test(lower)) {
      examContext = 'NEET';
    } else if (/\b(upsc|ias|civil services)\b/.test(lower)) {
      examContext = 'UPSC';
    } else if (/\b(gate|psu)\b/.test(lower)) {
      examContext = 'GATE';
    } else if (/\b(cbse|ncert|icse)\b/.test(lower)) {
      examContext = 'CBSE';
    }

    // 2. Detect Subject / Domain
    let subject: string | undefined;
    if (/\b(physics|kinematics|mechanics|thermodynamics|optics|electromagnetism|quantum)\b/.test(lower)) {
      subject = 'Physics';
    } else if (/\b(chemistry|organic|inorganic|stoichiometry|periodic table)\b/.test(lower)) {
      subject = 'Chemistry';
    } else if (/\b(math|mathematics|calculus|algebra|trigonometry|geometry|matrices)\b/.test(lower)) {
      subject = 'Mathematics';
    } else if (/\b(biology|botany|zoology|genetics|cells|anatomy)\b/.test(lower)) {
      subject = 'Biology';
    } else if (/\b(computer science|programming|algorithm|data structure|python|javascript|typescript|llm|ai|machine learning|deep learning|fine[- ]tuning|neural|transformer|lora)\b/.test(lower)) {
      subject = 'Computer Science';
    }

    // 3. Detect Difficulty / Level
    let targetLevel: ResourceDifficulty = 'intermediate';
    if (examContext === 'JEE' || examContext === 'GATE' || /\b(advanced|hard|olympiad)\b/.test(lower)) {
      targetLevel = 'competitive';
    } else if (/\b(intro|beginner|beginners|basic|basics|fundamentals|foundation|start)\b/.test(lower)) {
      targetLevel = 'beginner';
    } else if (/\b(undergraduate|graduate|advanced|phd)\b/.test(lower)) {
      targetLevel = 'advanced';
    }

    // 4. Detect Intent
    let intent: ParsedQuery['intent'] = 'concept_learning';
    if (/\b(pyq|past year|previous year|paper|mock|test series|exam)\b/.test(lower)) {
      intent = 'exam_prep';
    } else if (/\b(problem|practice|questions|exercises|solutions|numerical)\b/.test(lower)) {
      intent = 'problem_solving';
    } else if (/\b(revision|one shot|quick|cheat sheet|summary|formula)\b/.test(lower)) {
      intent = 'revision';
    }

    // 5. Detect explicit resource type filters
    const targetResourceTypes: EngineResourceType[] = [];
    if (/\b(video|lecture|watch|playlist)\b/.test(lower)) {
      targetResourceTypes.push('video_lecture', 'youtube_playlist');
    }
    if (/\b(book|notes|reading|article|pdf)\b/.test(lower)) {
      targetResourceTypes.push('reading_material', 'pdf_lecture_notes');
    }
    if (/\b(quiz|mcq|test)\b/.test(lower)) {
      targetResourceTypes.push('ai_quiz', 'mock_test');
    }
    if (/\b(pyq|practice|problem)\b/.test(lower)) {
      targetResourceTypes.push('practice_questions', 'pyq');
    }

    // 6. Extract clean keywords
    const keywords = rawQuery
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !['and', 'the', 'for', 'with', 'from', 'course', 'class'].includes(w.toLowerCase()));

    // Clean topic name by removing common filler phrases, exam contexts, and grade levels
    let topic = rawQuery
      .replace(/\b(complete course|full course|tutorial|in depth|guide|best|free|learn|how to|lecture notes|notes|lectures?|videos?)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // If an exam context was detected, strip it from the concept topic
    if (examContext) {
      topic = topic
        .replace(/\b(iit\s+jee|jee\s+advanced|jee\s+main|jee|neet|aiims|upsc|gate|cbse|ncert|icse)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Strip class/grade numbers from concept topic
    topic = topic
      .replace(/\b(class\s+9|class\s+10|class\s+11|class\s+12|grade\s+9|grade\s+10|grade\s+11|grade\s+12)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // If subject was at the front and remainder has distinct content, clean leading subject
    if (subject && topic.toLowerCase().startsWith(subject.toLowerCase())) {
      const remainder = topic.slice(subject.length).trim();
      if (remainder.length > 2) {
        topic = remainder;
      }
    }

    return {
      rawQuery,
      topic: topic || rawQuery,
      subject,
      domain: subject,
      targetLevel,
      examContext,
      targetResourceTypes: targetResourceTypes.length > 0 ? targetResourceTypes : undefined,
      language: 'en',
      intent,
      keywords,
    };
  }

  private async enhanceWithAi(rawQuery: string, fallback: ParsedQuery): Promise<ParsedQuery> {
    const prompt = `
You are the Query Understanding Engine for Pencill Education Platform.
Analyze this user query: "${rawQuery}"

Output ONLY a JSON object with this exact structure:
{
  "topic": "Clean canonical topic title",
  "subject": "Physics" | "Chemistry" | "Mathematics" | "Biology" | "Computer Science" | "General",
  "targetLevel": "beginner" | "intermediate" | "advanced" | "competitive",
  "examContext": "JEE" | "NEET" | "UPSC" | "GATE" | "CBSE" | null,
  "intent": "concept_learning" | "revision" | "exam_prep" | "problem_solving" | "quick_summary",
  "keywords": ["key1", "key2", "key3"]
}
`.trim();

    const response = await callGemini(prompt, undefined, {
      temperature: 0.1,
      timeoutMs: 6000,
    });

    const parsed = cleanJson<{
      topic?: string;
      subject?: string;
      targetLevel?: ResourceDifficulty;
      examContext?: string | null;
      intent?: ParsedQuery['intent'];
      keywords?: string[];
    }>(response);

    if (!parsed) return fallback;

    return {
      rawQuery,
      topic: parsed.topic || fallback.topic,
      subject: parsed.subject || fallback.subject,
      domain: parsed.subject || fallback.domain,
      targetLevel: parsed.targetLevel || fallback.targetLevel,
      examContext: (parsed.examContext as string) || fallback.examContext,
      targetResourceTypes: fallback.targetResourceTypes,
      language: 'en',
      intent: parsed.intent || fallback.intent,
      keywords: parsed.keywords && parsed.keywords.length > 0 ? parsed.keywords : fallback.keywords,
    };
  }
}

function cleanJson<T>(raw: string): T | null {
  try {
    let clean = raw.trim();
    if (clean.startsWith('```')) {
      const firstNewline = clean.indexOf('\n');
      const lastFence = clean.lastIndexOf('```');
      if (firstNewline !== -1 && lastFence > firstNewline) {
        clean = clean.substring(firstNewline + 1, lastFence).trim();
      }
    }
    return JSON.parse(clean) as T;
  } catch {
    return null;
  }
}
