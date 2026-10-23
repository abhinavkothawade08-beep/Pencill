import { NextRequest, NextResponse } from 'next/server';
import {
  ResourceEngineV2,
  adaptV2ToDiscoverResponse,
  extractYouTubeVideoId,
  SearchOptions,
  EngineResource,
  toPublicResource,
  ResourceDifficulty,
  isYouTubeQuotaExhausted,
  isGoogleSearchAvailable,
} from '@/lib/resource-engine-v2';
import { aiService, GeneratedLearningPath } from '@/services/ai';
import { createQuiz } from '@/services/supabase/quizService';
import { QuizQuestion } from '@/types';
import { createTopicAdaptiveCurriculum, inferDomain } from '@/services/ai/curriculum-adaptive-engine';
import { DiscoverRequestSchema } from '@/lib/api-schemas';

// Helper to map UI level IDs to depth strings for Gemini
function mapLevelToDepth(level?: string): 'foundation' | 'intermediate' | 'rigorous' | 'exam-prep' {
  if (!level) return 'intermediate';
  const l = level.toLowerCase();
  if (l.includes('foundation') || l.includes('9') || l.includes('10')) return 'foundation';
  if (l.includes('11')) return 'intermediate';
  if (l.includes('12')) return 'rigorous';
  if (l.includes('competitive') || l.includes('jee') || l.includes('neet')) return 'exam-prep';
  if (l.includes('undergraduate')) return 'rigorous';
  return 'intermediate';
}

function createFallbackModuleQuestions(
  moduleTitle: string,
  courseTopic: string,
  lessons: Array<{ title: string; keyConcepts?: string[] }>
): QuizQuestion[] {
  const lessonTitles = lessons.map((l) => l.title);
  const primaryConcept = lessonTitles[0] || moduleTitle;
  const secondaryConcept = lessonTitles[1] || primaryConcept;

  return [
    {
      id: `q-fb-1-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      questionNumber: 1,
      prompt: `What is the core conceptual foundation of "${moduleTitle}" within ${courseTopic}?`,
      options: [
        { id: 'A', text: `Analyzing and applying principles of ${primaryConcept}.` },
        { id: 'B', text: `Reviewing unrelated historical context outside of ${courseTopic}.` },
        { id: 'C', text: `Memorizing arbitrary terminology without conceptual models.` },
        { id: 'D', text: `Skipping core theoretical foundations to proceed to unrelated domains.` },
      ],
      correctOptionId: 'A',
      explanation: `"${moduleTitle}" focuses systematically on establishing clarity in ${primaryConcept} to build authentic competence in ${courseTopic}.`,
      difficulty: 'foundation',
      topic: moduleTitle,
    },
    {
      id: `q-fb-2-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      questionNumber: 2,
      prompt: `In the context of ${moduleTitle}, which method is essential for rigorous problem solving?`,
      options: [
        { id: 'A', text: `Ignoring core constraints and variable boundaries.` },
        { id: 'B', text: `Applying systematic frameworks aligned to ${secondaryConcept}.` },
        { id: 'C', text: `Relying solely on untested heuristics.` },
        { id: 'D', text: `Treating all parameters as fixed constants regardless of context.` },
      ],
      correctOptionId: 'B',
      explanation: `Mastery in ${moduleTitle} requires applying systematic analytical frameworks aligned to ${secondaryConcept}.`,
      difficulty: 'intermediate',
      topic: moduleTitle,
    },
    {
      id: `q-fb-3-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      questionNumber: 3,
      prompt: `How do the principles in "${moduleTitle}" contribute to broader mastery in ${courseTopic}?`,
      options: [
        { id: 'A', text: `They provide the analytical grounding needed to address complex edge cases and applied workflows.` },
        { id: 'B', text: `They are isolated and have no relationship to subsequent modules.` },
        { id: 'C', text: `They replace all empirical and experimental validation.` },
        { id: 'D', text: `They prevent learners from integrating multi-variable scenarios.` },
      ],
      correctOptionId: 'A',
      explanation: `The concepts established in ${moduleTitle} provide the structural foundation for progressing through ${courseTopic}.`,
      difficulty: 'intermediate',
      topic: moduleTitle,
    },
    {
      id: `q-fb-4-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      questionNumber: 4,
      prompt: `When evaluating solutions in ${moduleTitle}, which validation criterion is most critical?`,
      options: [
        { id: 'A', text: `Verifying dimensional consistency, edge-case behavior, and alignment with foundational axioms.` },
        { id: 'B', text: `Assuming the first intuitive output is always correct.` },
        { id: 'C', text: `Disregarding mathematical proofs and analytical constraints.` },
        { id: 'D', text: `Limiting evaluation strictly to superficial cosmetic formatting.` },
      ],
      correctOptionId: 'A',
      explanation: `Rigorous academic verification requires confirming dimensional consistency, edge cases, and alignment with foundational theory.`,
      difficulty: 'advanced',
      topic: moduleTitle,
    },
  ];
}

const v2Engine = new ResourceEngineV2();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = DiscoverRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const flattened = parseResult.error.flatten();
      const firstFieldError = Object.entries(flattened.fieldErrors)[0];
      const errorDetail = firstFieldError
        ? `${firstFieldError[0]}: ${firstFieldError[1]?.join(', ')}`
        : flattened.formErrors[0] || 'Invalid request parameters';

      return NextResponse.json(
        {
          success: false,
          error: `Validation failed: ${errorDetail}`,
          details: flattened.fieldErrors,
          formErrors: flattened.formErrors,
        },
        { status: 400 }
      );
    }

    const body = parseResult.data;
    const validTopics = Array.isArray(body.topics)
      ? body.topics.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      : [];
    const topicsStr = validTopics.length > 0 ? validTopics.join(' · ') : '';
    const query = (body.query || body.goal || topicsStr || body.subject || '').trim();

    const level = (typeof body.customDepthLevel === 'string' && body.customDepthLevel.trim())
      ? body.customDepthLevel.trim()
      : typeof body.depthLevel === 'string'
      ? body.depthLevel
      : typeof body.level === 'string'
      ? body.level
      : undefined;

    const shouldGeneratePath = body.generateLearningPath !== false;
    const weeklyHours = typeof body.weeklyHours === 'number' ? body.weeklyHours : 5;
    const language = typeof body.language === 'string' ? body.language : 'English';

    let modalitiesList: string[] = [];
    if (Array.isArray(body.modalities)) {
      modalitiesList = body.modalities.filter((m: unknown) => typeof m === 'string');
    } else if (body.modalities && typeof body.modalities === 'object') {
      modalitiesList = Object.entries(body.modalities)
        .filter(([, active]) => Boolean(active))
        .map(([name]) => name);
    }

    const targetExamName = typeof body.targetExam === 'string'
      ? body.targetExam
      : body.targetExam && typeof body.targetExam === 'object'
      ? ((body.targetExam as Record<string, unknown>).name as string) || ((body.targetExam as Record<string, unknown>).acronym as string)
      : undefined;

    const detectedExam = targetExamName
      || (query.toLowerCase().includes('jee') ? 'JEE'
      : query.toLowerCase().includes('neet') ? 'NEET'
      : query.toLowerCase().includes('gate') ? 'GATE'
      : query.toLowerCase().includes('upsc') ? 'UPSC'
      : undefined);

    function mapLevelToDifficulty(levelStr?: string): ResourceDifficulty {
      if (!levelStr) return 'intermediate';
      const l = levelStr.toLowerCase();
      if (l.includes('beginner') || l.includes('foundation') || l.includes('9') || l.includes('10')) return 'beginner';
      if (l.includes('11')) return 'intermediate';
      if (l.includes('competitive') || l.includes('jee') || l.includes('neet')) return 'competitive';
      return 'advanced';
    }

    const options: SearchOptions = {
      limit: typeof body.limit === 'number' ? body.limit : 12,
      providers: body.providers || undefined,
      resourceTypes: body.resourceTypes || undefined,
      difficulty: body.difficulty ? (body.difficulty.toLowerCase() as ResourceDifficulty) : mapLevelToDifficulty(level),
      examContext: detectedExam,
      minQualityScore: body.minQualityScore ?? undefined,
      enableAiEvaluation: body.enableAiEvaluation ?? true,
      saveToDatabase: body.saveToDatabase ?? false,
      timeoutMs: body.timeoutMs ?? 45000,
      sequenceType: body.sequenceType || undefined,
      contentType: body.contentType || undefined,
    };

    // 1. Synthesize Learning Path if requested
    let learningPath: GeneratedLearningPath | null = null;
    let modulesInput: Array<{
      moduleId: string;
      moduleNumber: number;
      moduleTitle: string;
      subtopics?: string[];
      objective?: string;
    }> | undefined = undefined;

    if (shouldGeneratePath) {
      try {
        learningPath = await aiService.generateLearningPath({
          topic: query,
          depth: mapLevelToDepth(level),
          level,
          targetExam: options.examContext,
          weeklyHours,
          language,
          modalities: modalitiesList,
          difficulty: body.difficulty || undefined,
          domain: body.domain || undefined,
          advancedPreferences: body.advancedPreferences || undefined,
        });
      } catch (aiErr) {
        console.warn('[API /api/resources/discover] AI provider error, using resilient curriculum synthesis:', aiErr);
        learningPath = createTopicAdaptiveCurriculum(query, level, weeklyHours, [], {
          modalities: modalitiesList,
          targetExam: options.examContext,
          difficulty: body.difficulty || undefined,
          explicitDomain: body.domain || undefined,
          depthLevel: level,
          language,
        });
      }

      if (learningPath?.modules?.length) {
        modulesInput = learningPath.modules.map((m) => ({
          moduleId: `mod-${m.moduleNumber}`,
          moduleNumber: m.moduleNumber,
          moduleTitle: m.title,
          subtopics: m.keySubtopics || m.lessons?.map((l) => l.title) || [],
          objective: m.objective,
        }));
      }
    }

    // 2. Discover resources directly via Resource Engine 2.0 (Clean, V2 Direct Execution)
    const v2Output = await v2Engine.discover({
      query,
      academicLevel: level,
      level,
      domain: body.domain || undefined,
      targetExam: options.examContext,
      language,
      modalities: modalitiesList as any,
      limit: options.limit,
      saveToDatabase: options.saveToDatabase,
      timeoutMs: options.timeoutMs,
      modules: modulesInput,
    });

    // 3. Transform via compatibility adapter into public contract
    const formattedResponse = adaptV2ToDiscoverResponse(v2Output, {
      learningPathTemplate: learningPath,
    });

    // 4. Ensure Module Diagnostics / Checkpoints are preserved if requested
    if (formattedResponse.learningPath && formattedResponse.learningPath.modules && formattedResponse.learningPath.modules.length > 0) {
      for (const mod of formattedResponse.learningPath.modules) {
        const modNumber = mod.moduleNumber;
        const quizId = `quiz-${Date.now().toString(36)}-m${modNumber}-${Math.random().toString(36).substring(2, 6)}`;
        let questions: QuizQuestion[] = [];
        try {
          if (aiService && typeof aiService.generateQuizQuestions === 'function') {
            const quizResp = await aiService.generateQuizQuestions({
              topic: mod.title,
              knowledgeLevel: 'intermediate',
              questionCount: 4,
            });
            questions = (quizResp.questions || []).map((q, idx) => ({
              ...q,
              id: q.id || `${quizId}-q${idx + 1}`,
            }));
          }
        } catch {
          questions = createFallbackModuleQuestions(mod.title, query, mod.lessons);
        }

        if (questions.length > 0) {
          await createQuiz(
            {
              id: quizId,
              title: `${mod.title} Diagnostic Checkpoint`,
              topic: mod.title,
              subject: query,
              knowledgeLevel: 'intermediate',
              difficulty: mapLevelToDifficulty(level),
              timeLimitMinutes: 15,
              moduleId: `mod-${modNumber}`,
              metadata: {
                module_number: modNumber,
                module_title: mod.title,
                course_topic: query,
                grounding: 'module_specific_learning_objectives',
              },
            },
            questions
          ).catch((e) => console.warn('[API /api/resources/discover] Quiz save notice:', e));
        }
      }
    }

    return NextResponse.json(formattedResponse);
  } catch (err: unknown) {
    console.error('[API /api/resources/discover] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Internal discovery failure',
      },
      { status: 500 }
    );
  }
}
