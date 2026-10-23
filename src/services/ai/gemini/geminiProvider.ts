/**
 * Gemini AI Provider Implementation
 * Implements the AIProvider contract using Google Gemini.
 * Cleanly separates LLM prompt engineering and output parsing from product UI and Supabase DB logic.
 */

import {
  AIProvider,
  GeneratePathInput,
  GeneratedLearningPath,
  GenerateModuleInput,
  GeneratedModule,
  GenerateSummaryInput,
  GeneratedLessonSummary,
  GenerateQuizInput,
  GeneratedQuiz,
  AnalyzeResourcesInput,
  OrganizedResources,
  RecommendationsInput,
  GeneratedRecommendations,
} from '../types';
import { callGemini, GeminiClientError } from './client';
import { extractJsonFromText } from '@/lib/resource-engine-v2/utils/text-utils';
import {
  analyzeTopicComplexity,
  validateAndSanitizeCurriculum,
  createTopicAdaptiveCurriculum,
} from '../curriculum-adaptive-engine';

function extractJson<T>(rawText: string, fallbackDesc: string): T {
  // First attempt using robust text-utils extractor (handles LaTeX unescaped slashes, code fences, truncation)
  const extracted = extractJsonFromText<T>(rawText);
  if (extracted) {
    return extracted;
  }

  try {
    // Secondary fallback cleanup
    let clean = rawText.trim();
    if (clean.startsWith('```')) {
      const firstNewline = clean.indexOf('\n');
      const lastFence = clean.lastIndexOf('```');
      if (firstNewline !== -1 && lastFence > firstNewline) {
        clean = clean.substring(firstNewline + 1, lastFence).trim();
      }
    }
    return JSON.parse(clean) as T;
  } catch (err) {
    console.error(`[GeminiProvider] Failed to parse JSON for ${fallbackDesc}:`, rawText);
    throw new GeminiClientError(
      `Gemini returned malformed structured JSON for ${fallbackDesc}: ${(err as Error).message}`
    );
  }
}

export class GeminiProvider implements AIProvider {
  public readonly providerName = 'Google Gemini';

  /**
   * 1. Synthesize a complete topic-adaptive curriculum structure from topic/query
   */
  async generateLearningPath(input: GeneratePathInput): Promise<GeneratedLearningPath> {
    const complexity = analyzeTopicComplexity(input.topic, input.depth || input.level);
    const targetHours = input.weeklyHours ? Math.max(16, input.weeklyHours * 4) : 36;

    const systemInstruction = `
You are the Chief Academic Curriculum Architect at Pencill, an elite scholarly learning platform.
Your mandate is to synthesize rigorous, deeply intuitive, pedagogical learning paths with zero superficial fluff.
CRITICAL PEDAGOGICAL INVARIANT:
The curriculum structure—including the number of modules, depth, sequence, and pedagogical granularity—MUST dynamically adapt to the inherent complexity and technical scope of the requested topic, rather than adhering to any artificial or fixed limit.
Always output pure valid JSON matching the exact schema requested.
`.trim();

    const prompt = `
Synthesize a structured, topic-adaptive academic learning path for the following topic:
- Topic: ${input.topic}
- Depth / Rigor: ${input.depth || 'rigorous'}
- Target Level: ${input.level || 'adaptive'}
- Target Weekly Study Hours: ${input.weeklyHours || 8}h
- Language: ${input.language || 'English'}
- Modalities: ${input.modalities?.join(', ') || 'Video lectures, monographs, problem sets, quizzes'}
${input.targetExam ? `- Target Academic Goal / Exam: ${input.targetExam}` : ''}
${input.expectedDurationHours ? `- Estimated Course Hours: ${input.expectedDurationHours}h` : ''}

DYNAMIC TOPIC-ADAPTIVE ARCHITECTURE GUIDELINES:
1. Module Count & Scoping:
   - DYNAMICALLY calibrate module count to topic complexity, learning level, and duration:
     * Recommended Target: ${complexity.recommendedModuleRange[0]} to ${complexity.recommendedModuleRange[1]} modules.
     * Narrow / single-concept subjects (e.g. Python Decorators, Binary Search, Gradient Descent): 2 to 3 cohesive modules.
     * Focused / foundational subjects (e.g. Python Basics, Python Programming, Git Fundamentals): 3 to 4 cohesive modules.
     * Intermediate multi-concept subjects (e.g. Data Structures & Algorithms, Linear Algebra): 4 to 5 cohesive modules.
     * Advanced / frontier engineering disciplines (e.g. Machine Learning, Large Language Models, Fine-Tuning of AI Models): 5 to 6 cohesive modules.
   - PEDAGOGICAL COHESION DIRECTIVE:
     * Combine closely related concepts into substantial, cohesive modules (e.g., unify LoRA, QLoRA, and PEFT into ONE parameter-efficient adaptation module; do not create separate modules for each).
     * Eliminate duplicate, trivial, overlapping, or filler modules. Do not generate extra modules merely to increase count.
     * Every module must represent a substantial conceptual milestone with a logical progression.

2. Curriculum Quality Invariants:
   - Every module must have a distinct, highly specific, technical title (NO generic placeholders like "Module 1", "Foundations of [Topic]", or "Applied Methods in [Topic]").
   - Modules must follow a rigorous, logical progression: Foundations & Axioms -> Core Architectures & Methods -> Applied Workflows & Optimization -> Production Synthesis.
   - In EACH module, include 3 to 4 structured lessons:
     * A core video lecture (type: "video") with a specific, search-ready title
     * An academic monograph or theoretical reading unit (type: "monograph")
     * An applied practice or problem set (type: "practice")
     * A diagnostic checkpoint assessment (type: "quiz") to verify module mastery
   - For every lesson, provide 2 to 4 concrete keyConcepts.

Output a single JSON object with this exact structure:
{
  "title": "${input.topic} Comprehensive Academic Curriculum",
  "description": "Comprehensive pedagogical description (2-3 sentences)",
  "domain": "${complexity.domain}",
  "level": "${input.level || 'Intermediate'}",
  "durationHours": ${targetHours},
  "moduleCount": 0,
  "tags": ["Tag1", "Tag2", "Tag3"],
  "syllabusNote": "Curatorial note describing seminal sources (e.g. MIT OCW, Stanford, arXiv, peer-reviewed textbooks)",
  "weeklyCheckpoint": {
    "title": "Module 1 Checkpoint",
    "description": "Formative evaluation description",
    "targetMilestone": "Mastery criterion by week 1"
  },
  "modules": [
    {
      "title": "Specific Module Title (e.g. Self-Attention Mechanics & Vector Primitives)",
      "moduleNumber": 1,
      "estimatedHours": 8,
      "objective": "Clear measurable conceptual goal for this module",
      "lessons": [
        {
          "title": "Specific lesson lecture title",
          "type": "video",
          "estimatedMinutes": 30,
          "keyConcepts": ["Concept 1", "Concept 2"]
        },
        {
          "title": "Specific Monograph & Reading Notes Title",
          "type": "monograph",
          "estimatedMinutes": 45,
          "keyConcepts": ["Theory 1", "Theory 2"]
        },
        {
          "title": "Specific Applied Problem Set & Exercises Title",
          "type": "practice",
          "estimatedMinutes": 40,
          "keyConcepts": ["Method 1", "Method 2"]
        },
        {
          "title": "Module Diagnostic Checkpoint Title",
          "type": "quiz",
          "estimatedMinutes": 20,
          "keyConcepts": ["Review 1", "Review 2"]
        }
      ]
    }
  ]
}
`.trim();

    try {
      const raw = await callGemini(prompt, systemInstruction, {
        jsonMode: true,
        timeoutMs: 40000,
        thinkingConfig: { thinkingLevel: 'low' },
      });

      const parsed = extractJson<GeneratedLearningPath>(raw, 'Learning Path Structure');
      const { valid, curriculum } = validateAndSanitizeCurriculum(parsed, input.topic);

      if (valid && curriculum.modules.length >= 2) {
        return curriculum;
      }

      console.warn('[GeminiProvider] Single-shot curriculum validation produced incomplete structure, attempting staged recovery...');
      return await this.stagedCurriculumSynthesis(input, parsed);
    } catch (err) {
      console.warn(`[GeminiProvider] Primary synthesis encountered issue: ${(err as Error).message}. Attempting staged recovery...`);
      try {
        return await this.stagedCurriculumSynthesis(input);
      } catch (stagedErr) {
        console.warn(`[GeminiProvider] Staged recovery failed: ${(stagedErr as Error).message}. Using topic-adaptive curriculum synthesizer.`);
        return createTopicAdaptiveCurriculum(input.topic, input.level, input.weeklyHours, [], {
          modalities: input.modalities,
          targetExam: input.targetExam,
          difficulty: input.difficulty,
          explicitDomain: input.domain,
          language: input.language,
        });
      }
    }
  }

  /**
   * Staged Curriculum Synthesis: generates topic outline first, then fills lessons per module.
   * Handles token limits and large syllabuses without truncation.
   */
  private async stagedCurriculumSynthesis(
    input: GeneratePathInput,
    partialOutline?: Partial<GeneratedLearningPath>
  ): Promise<GeneratedLearningPath> {
    const complexity = analyzeTopicComplexity(input.topic, input.depth || input.level);
    const targetHours = input.weeklyHours ? Math.max(16, input.weeklyHours * 4) : 36;

    // Stage 1: Outline Generation (if partialOutline has no modules)
    let outline = partialOutline;
    if (!outline || !Array.isArray(outline.modules) || outline.modules.length < 2) {
      const outlinePrompt = `
Generate a structured academic curriculum OUTLINE for:
- Topic: ${input.topic}
- Depth / Rigor: ${input.depth || 'rigorous'}
- Target Level: ${input.level || 'adaptive'}
- Target Hours: ${targetHours}h

INSTRUCTIONS:
1. Dynamically calibrate the number of modules to topic complexity and target level:
   - Target Range: ${complexity.recommendedModuleRange[0]} to ${complexity.recommendedModuleRange[1]} modules.
   - For introductory/focused topics: 3 to 4 cohesive modules.
   - For core multi-concept subjects: 4 to 5 cohesive modules.
   - For advanced/frontier engineering subjects (e.g. Fine-Tuning, LLMs, ML): 5 to 6 cohesive modules.
2. PEDAGOGICAL COHESION:
   - Combine closely related concepts into substantial modules rather than micro-fragmenting them.
   - Do not create overlapping or duplicate modules.
3. Return ONLY module-level outline (no lesson arrays needed here).

Output pure JSON:
{
  "title": "${input.topic} Comprehensive Academic Curriculum",
  "description": "2-3 sentences overview",
  "domain": "${complexity.domain}",
  "level": "${input.level || 'Intermediate'}",
  "durationHours": ${targetHours},
  "modules": [
    {
      "moduleNumber": 1,
      "title": "Specific Technical Module Title",
      "objective": "Measurable conceptual goal",
      "estimatedHours": 8
    }
  ]
}
`.trim();

      const rawOutline = await callGemini(outlinePrompt, undefined, {
        jsonMode: true,
        timeoutMs: 25000,
        thinkingConfig: { thinkingLevel: 'low' },
      });
      outline = extractJson<Partial<GeneratedLearningPath>>(rawOutline, 'Curriculum Outline');
    }

    const { curriculum } = validateAndSanitizeCurriculum(outline, input.topic);

    // Stage 2: Ensure every module has rich, distinct lessons
    const enrichedModules = await Promise.all(
      curriculum.modules.map(async (mod, idx) => {
        if (mod.lessons && mod.lessons.length >= 3) {
          return mod;
        }

        try {
          const modDetails = await this.generateModuleAndLessons({
            pathTitle: curriculum.title,
            domain: curriculum.domain,
            level: curriculum.level,
            moduleNumber: idx + 1,
            moduleTitle: mod.title,
            targetObjective: mod.objective,
          });

          if (modDetails && Array.isArray(modDetails.lessons) && modDetails.lessons.length > 0) {
            return {
              ...mod,
              lessons: modDetails.lessons.map((l) => ({
                title: l.title,
                type: l.type,
                estimatedMinutes: l.durationMinutes || 25,
                keyConcepts: l.summaryPoints || [mod.title],
              })),
            };
          }
        } catch (mErr) {
          console.warn(`[GeminiProvider] Lesson expansion warning for "${mod.title}":`, mErr);
        }

        return mod;
      })
    );

    return {
      ...curriculum,
      modules: enrichedModules,
      moduleCount: enrichedModules.length,
    };
  }

  /**
   * 2. Generate detailed module with rich lesson breakdowns
   */
  async generateModuleAndLessons(input: GenerateModuleInput): Promise<GeneratedModule> {
    const systemInstruction = `
You are an expert pedagogical designer for Pencill.
Generate rigorous lesson progressions with clear prerequisites, concrete durations, and succinct summary points.
Always return pure valid JSON.
`.trim();

    const prompt = `
Design lessons for the following module:
- Course: ${input.pathTitle} (${input.domain}, Level: ${input.level})
- Module ${input.moduleNumber}: ${input.moduleTitle}
${input.targetObjective ? `- Objective: ${input.targetObjective}` : ''}

Output JSON with this structure:
{
  "title": "${input.moduleTitle}",
  "moduleNumber": ${input.moduleNumber},
  "description": "Pedagogical scope of this module",
  "lessons": [
    {
      "title": "Lesson title",
      "type": "video",
      "durationMinutes": 25,
      "conceptId": "DOMAIN-NUM-TAG-01",
      "prerequisitesNote": "Specific prior concept required or null",
      "summaryPoints": [
        "First key mathematical/conceptual invariant",
        "Second deduction or methodology",
        "Common student pitfall to avoid"
      ]
    }
  ]
}
`.trim();

    const raw = await callGemini(prompt, systemInstruction, { jsonMode: true });
    return extractJson<GeneratedModule>(raw, `Module ${input.moduleNumber}`);
  }

  /**
   * 3. Generate synthesis notes, formulas, and thesis for a lesson
   */
  async generateLessonSummary(input: GenerateSummaryInput): Promise<GeneratedLessonSummary> {
    const systemInstruction = `
You are a senior academic tutor at Pencill.
Extract the fundamental thesis, mathematical derivations/formulae in LaTeX, and core insights from the provided lesson material.
Always return pure valid JSON.
`.trim();

    const prompt = `
Analyze and summarize the following lesson:
- Title: ${input.lessonTitle}
- Domain: ${input.domain}
- Lesson Transcript or Content Excerpt:
"${input.contentOrTranscript.slice(0, 4000)}"

Output JSON with this structure:
{
  "lessonTitle": "${input.lessonTitle}",
  "coreThesis": "Single overarching conceptual principle of the lesson",
  "keyPoints": [
    "First essential point",
    "Second essential point",
    "Third essential point"
  ],
  "formulae": [
    {
      "name": "Formula or Law Name",
      "latex": "\\\\frac{a}{b} = c",
      "notes": "Physical or mathematical constraint under which this holds"
    }
  ],
  "prerequisitesReminder": "Brief prerequisite note if applicable"
}
`.trim();

    const raw = await callGemini(prompt, systemInstruction, { jsonMode: true });
    return extractJson<GeneratedLessonSummary>(raw, `Lesson Summary for ${input.lessonTitle}`);
  }

  /**
   * 4. Generate diagnostic quiz questions with distractors and explanations
   */
  /**
   * 4. Generate diagnostic quiz questions with distractors and explanations
   */
  async generateQuizQuestions(input: GenerateQuizInput): Promise<GeneratedQuiz> {
    if (!input.topic || !input.topic.trim()) {
      throw new GeminiClientError('Topic is required and cannot be empty for quiz generation.', 400);
    }

    const questionCount = Math.max(1, Math.min(20, input.questionCount || 5));
    const domain = input.subject || input.domain || 'General Studies';
    const gradeLevel = input.gradeLevel || 'Senior Secondary / Undergraduate';
    const knowledgeLevel = input.knowledgeLevel || 'intermediate';
    const difficulty = input.difficulty || 'medium';
    const questionFormat = input.questionFormat || 'single_choice';
    const curriculum = input.curriculum ? `Curriculum: ${input.curriculum}` : '';
    const examTarget = input.examTarget ? `Target Examination: ${input.examTarget}` : '';
    const learningObjectives = input.learningObjectives ? `Learning Objectives: ${input.learningObjectives}` : '';
    const moduleScope = input.moduleTitle ? `Target Module: "${input.moduleTitle}"` : '';
    const courseScope = input.courseTitle ? `Course Context: "${input.courseTitle}"` : '';
    const contentGrounding = input.sourceContent
      ? `VERIFIED SOURCE MATERIAL GROUNDING:
The student has directly studied the following content excerpt/notes. ALL questions and authoritative answers must test and be directly verifiable from these concepts:
"""
${input.sourceContent.slice(0, 4000)}
"""`
      : input.learningObjectives
      ? `LEARNING OBJECTIVES GROUNDING:
All questions must test mastery of the following specific learning objectives for this module:
"${input.learningObjectives}"`
      : '';
    const priorWeaknesses = input.priorWeakTopics && input.priorWeakTopics.length > 0
      ? `Prior Weak Areas To Emphasize: ${input.priorWeakTopics.join(', ')}`
      : '';

    const systemInstruction = `
You are the Senior Assessment Psychometrician and Chief Examination Specialist at Pencill.
Author authoritative, educationally rigorous, age-appropriate questions that measure deep conceptual understanding, causal intuition, problem-solving derivation, and distractor discrimination.

STRICT INVARIANTS:
1. Student Knowledge Level describes the learner's background (${knowledgeLevel}). Question Difficulty describes the problem complexity (${difficulty}). Do not confuse them.
2. Every question must have an unambiguous stem, clear answer options, and EXACTLY ONE authoritative correctOptionId matching an existing option id.
3. For single-choice MCQ, provide exactly 4 distinct plausible options (A, B, C, D).
4. For true/false questions, provide 2 options (A: True, B: False).
5. For multiple-choice questions, provide 4 options and mark the correct option.
6. Provide an authoritative pedagogical explanation detailing why the answer is correct and analyzing common student misconceptions.
7. For numerical/derivation problems, ensure formulas and calculations are mathematically exact.
8. GROUNDING RULE: All questions must be strictly grounded in the module's learning objectives and provided study concepts. Never produce generic questions merely from the broad subject name.
9. Output pure valid JSON matching the exact schema requested without Markdown fences or extra commentary.
`.trim();

    const prompt = `
Generate a ${questionCount}-question assessment for:
- Topic: "${input.topic.trim()}"
${moduleScope ? `- ${moduleScope}` : ''}
${courseScope ? `- ${courseScope}` : ''}
- Subject/Domain: "${domain}"
- Educational Level: "${gradeLevel}"
${curriculum ? `- ${curriculum}` : ''}
${examTarget ? `- ${examTarget}` : ''}
- Student Knowledge Level: "${knowledgeLevel}"
- Question Difficulty Target: "${difficulty}"
- Question Format: "${questionFormat}"
${learningObjectives ? `- ${learningObjectives}` : ''}
${contentGrounding ? `\n${contentGrounding}\n` : ''}
${priorWeaknesses ? `- ${priorWeaknesses}` : ''}
- Explanations Required: ${input.includeExplanations !== false ? 'Yes' : 'No'}

JSON Structure to return:
{
  "title": "${input.moduleTitle || input.topic.trim()} Diagnostic Assessment",
  "domain": "${domain}",
  "subject": "${domain}",
  "timeLimitMinutes": ${Math.max(5, questionCount * 2)},
  "questions": [
    {
      "questionNumber": 1,
      "prompt": "Clear, precise question stem...",
      "stemNote": "Optional contextual assumptions or constraints",
      "questionType": "single_choice",
      "difficulty": "medium",
      "subtopic": "Subtopic or concept tag",
      "hint": "Optional pedagogical hint without giving away the answer",
      "options": [
        { "id": "A", "text": "First option text", "latex": "\\\\text{LaTeX if applicable}" },
        { "id": "B", "text": "Second option text", "latex": "\\\\text{LaTeX if applicable}" },
        { "id": "C", "text": "Third option text", "latex": "\\\\text{LaTeX if applicable}" },
        { "id": "D", "text": "Fourth option text", "latex": "\\\\text{LaTeX if applicable}" }
      ],
      "correctOptionId": "A",
      "explanation": "Authoritative pedagogical explanation.",
      "formulaReference": "Optional reference formula or theorem"
    }
  ]
}
`.trim();

    const raw = await callGemini(prompt, systemInstruction, { jsonMode: true, timeoutMs: 35000 });
    let parsed = extractJson<GeneratedQuiz>(raw, `Quiz on ${input.topic}`);

    // Post-generation validation & bounded repair
    parsed = this.validateAndFilterQuiz(parsed, questionCount, input.topic);

    if (!parsed.questions || parsed.questions.length === 0) {
      throw new GeminiClientError(`AI generation produced no valid questions for topic "${input.topic}".`, 502);
    }

    return parsed;
  }

  /**
   * Validates and cleans generated quiz questions against psychometric standards
   */
  private validateAndFilterQuiz(quiz: GeneratedQuiz, targetCount: number, topic: string): GeneratedQuiz {
    if (!quiz || !Array.isArray(quiz.questions)) {
      throw new GeminiClientError(`Invalid quiz response format for "${topic}".`, 502);
    }

    const seenPrompts = new Set<string>();
    const validQuestions: typeof quiz.questions = [];

    quiz.questions.forEach((q, idx) => {
      if (!q.prompt || typeof q.prompt !== 'string' || !q.prompt.trim()) {
        return;
      }

      // Check duplicates
      const normalizedPrompt = q.prompt.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seenPrompts.has(normalizedPrompt)) {
        return;
      }
      seenPrompts.add(normalizedPrompt);

      // Validate options array
      if (!Array.isArray(q.options) || q.options.length < 2) {
        return;
      }

      // Ensure option IDs are clean and texts are non-empty
      const validOptions = q.options.filter(
        (opt) => opt && opt.id && typeof opt.text === 'string' && opt.text.trim().length > 0
      );

      if (validOptions.length < 2) {
        return;
      }

      // Validate correctOptionId exists among valid options
      const hasValidKey = validOptions.some((opt) => opt.id === q.correctOptionId);
      if (!hasValidKey) {
        // If not matching, check if correctOptionId is an index like "0" or "1"
        const indexKey = Number(q.correctOptionId);
        if (!isNaN(indexKey) && indexKey >= 0 && indexKey < validOptions.length) {
          q.correctOptionId = validOptions[indexKey].id;
        } else {
          // Reject invalid key
          return;
        }
      }

      validQuestions.push({
        ...q,
        questionNumber: validQuestions.length + 1,
        options: validOptions,
        prompt: q.prompt.trim(),
        explanation: q.explanation || 'Refer to fundamental principles for step-by-step resolution.',
      });
    });

    return {
      title: quiz.title || `${topic} Assessment`,
      domain: quiz.domain || quiz.subject || 'Academic Studies',
      subject: quiz.subject || quiz.domain || 'Academic Studies',
      timeLimitMinutes: quiz.timeLimitMinutes || Math.max(5, validQuestions.length * 2),
      questions: validQuestions.slice(0, targetCount),
    };
  }

  /**
   * 5. Analyze and organize discovered web/video resources into pedagogical order
   */
  async analyzeResources(input: AnalyzeResourcesInput): Promise<OrganizedResources> {
    const systemInstruction = `
You are an editorial resource evaluator at Pencill.
Critique and sequence raw crawled educational materials, assigning quality scores (0-100) based on conceptual clarity, absence of commercial fluff, and rigor.
Always return pure valid JSON.
`.trim();

    const resourcesJson = JSON.stringify(input.resources.slice(0, 10), null, 2);

    const prompt = `
Evaluate and pedagogically order the following raw resources discovered for "${input.topic}" (${input.domain}):
${resourcesJson}

Output JSON with this structure:
{
  "topic": "${input.topic}",
  "evaluatedResources": [
    {
      "title": "Clean academic title",
      "sourceUrl": "The exact sourceUrl provided",
      "sourceName": "Publisher or institution name",
      "recommendedCategory": "core_lecture",
      "qualityScore": 88,
      "pedagogicalSequenceOrder": 1,
      "evaluationRationale": "Explains why this fits early in the student journey"
    }
  ],
  "synthesizedStudySequence": [
    "Step 1: Understand intuition through resource X",
    "Step 2: Formalize mathematical rigor with resource Y"
  ]
}
`.trim();

    const raw = await callGemini(prompt, systemInstruction, { jsonMode: true });
    return extractJson<OrganizedResources>(raw, `Resource Analysis for ${input.topic}`);
  }

  /**
   * 6. Generate adaptive study recommendations based on student progress
   */
  async generateRecommendations(input: RecommendationsInput): Promise<GeneratedRecommendations> {
    const systemInstruction = `
You are an academic mentor at Pencill.
Formulate deliberate, structured study recommendations without motivational hyperbole. Focus on conceptual consolidation and momentum.
Always return pure valid JSON.
`.trim();

    const prompt = `
Generate study recommendations for student with:
- Current Level: ${input.userCurrentLevel}
- Completed Topics: ${input.completedTopics.join(', ') || 'Kinematics in 1D, Units & Dimensions'}
- Recent Quiz Accuracy: ${input.recentQuizAccuracyPercent ?? 82}%
- Weekly Goal: ${input.studyGoalHours ?? 10} hours

Output JSON with this structure:
{
  "focusArea": "Primary concept requiring deliberate focus next",
  "nextRecommendedTopics": [
    {
      "title": "Topic title",
      "rationale": "Why this logically follows the student's mastery profile",
      "estimatedHours": 4
    }
  ],
  "reviewReminders": [
    "Key concept to periodically revisit"
  ],
  "weeklyPacingAdvice": "Concrete schedule pacing advice for the week"
}
`.trim();

    const raw = await callGemini(prompt, systemInstruction, { jsonMode: true });
    return extractJson<GeneratedRecommendations>(raw, 'Study Recommendations');
  }
}
