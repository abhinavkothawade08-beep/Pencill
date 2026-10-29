import { callGemini } from '@/services/ai/gemini/client';
import {
  ModulePlan,
  GeneratedQuiz,
  GeneratedQuizQuestion,
  GeneratedStudyNote,
  EducationalDomain,
} from './types';

export async function generateModuleQuiz(
  modulePlan: ModulePlan,
  domain: EducationalDomain,
  notes: GeneratedStudyNote[],
  topic: string
): Promise<GeneratedQuiz> {
  try {
    const aiQuiz = await generateQuizWithGemini(modulePlan, domain, notes, topic);
    if (aiQuiz && aiQuiz.questions.length >= 2) {
      return aiQuiz;
    }
  } catch (err) {
    console.warn(`[QuizGenerator] Gemini quiz generation failed for module "${modulePlan.title}":`, (err as Error).message);
  }

  return generateGroundedFallbackQuiz(modulePlan, domain, topic);
}

async function generateQuizWithGemini(
  modulePlan: ModulePlan,
  domain: EducationalDomain,
  notes: GeneratedStudyNote[],
  topic: string
): Promise<GeneratedQuiz | null> {
  const objectiveList = modulePlan.learningObjectives.map((o) => `- ${o.statement}`).join('\n');
  const notesOverview = notes.map((n) => n.overview).join('\n');

  const prompt = `
You are an Academic Examination Specialist at Pencill.
Generate a rigorous formative assessment quiz for the following module:
- Course Topic: "${topic}"
- Module Title: "${modulePlan.title}"
- Domain: ${domain}
- Specific Learning Objectives:
${objectiveList}
${notesOverview ? `- Lesson Notes Summary:\n${notesOverview}` : ''}

ASSESSMENT REQUIREMENTS:
1. Generate exactly 3 to 4 high-quality questions assessing these specific objectives.
2. For programming: include code snippet interpretation or bug identification.
3. For mathematics / engineering: include conceptual derivation or numerical problem questions.
4. Each question MUST have:
   - Clear, unambiguous prompt
   - Exactly 4 plausible answer options (no silly or giveaway distractors)
   - "correctOptionIndex": integer 0, 1, 2, or 3. RANDOMIZE the correct answer position across questions (do not always make it 0 or 1).
   - In-depth pedagogical explanation explaining why the correct choice is true and why other choices fail.
   - Reference to the specific learning objective.

Output pure, valid JSON with this exact schema:
{
  "title": "${modulePlan.title} Diagnostic Checkpoint",
  "timeLimitMinutes": 15,
  "questions": [
    {
      "prompt": "Question text...",
      "questionType": "multiple_choice",
      "options": ["Choice A", "Choice B", "Choice C", "Choice D"],
      "correctOptionIndex": 1,
      "explanation": "Detailed pedagogical explanation...",
      "difficulty": "intermediate",
      "learningObjectiveReference": "Objective statement..."
    }
  ]
}
`.trim();

  const rawJson = await callGemini(prompt, undefined, {
    jsonMode: true,
    temperature: 0.3,
  });

  const parsed = JSON.parse(rawJson);
  if (!parsed || !Array.isArray(parsed.questions)) return null;

  const validatedQuestions: GeneratedQuizQuestion[] = [];
  parsed.questions.forEach((q: any, idx: number) => {
    if (
      q.prompt &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      typeof q.correctOptionIndex === 'number' &&
      q.correctOptionIndex >= 0 &&
      q.correctOptionIndex < 4
    ) {
      validatedQuestions.push({
        id: `q-${modulePlan.id}-${idx + 1}`,
        questionNumber: idx + 1,
        prompt: q.prompt,
        questionType: q.questionType || 'multiple_choice',
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation || 'Option verified by module syllabus.',
        difficulty: q.difficulty || 'intermediate',
        learningObjectiveReference: q.learningObjectiveReference || modulePlan.learningObjectives[0]?.statement || 'Core concept',
      });
    }
  });

  if (validatedQuestions.length === 0) return null;

  return {
    id: `quiz-${modulePlan.id}`,
    title: parsed.title || `${modulePlan.title} Diagnostic Quiz`,
    moduleId: modulePlan.id,
    moduleTitle: modulePlan.title,
    timeLimitMinutes: parsed.timeLimitMinutes || 15,
    questions: validatedQuestions,
  };
}

function generateGroundedFallbackQuiz(
  modulePlan: ModulePlan,
  domain: EducationalDomain,
  topic: string
): GeneratedQuiz {
  const isCS = domain === 'computer_science';
  const isMath = domain === 'mathematics';
  const isPhysics = domain === 'natural_sciences';

  const questions: GeneratedQuizQuestion[] = modulePlan.learningObjectives.slice(0, 3).map((obj, idx) => {
    let prompt = `In the context of ${modulePlan.title}, what is the primary consideration when evaluating "${obj.statement}"?`;
    let options = [
      `Ensuring strict adherence to underlying mathematical axioms and boundary constraints.`,
      `Applying the primary formulation directly without checking prerequisite conditions.`,
      `Treating the operation as completely isolated from system state.`,
      `Maximizing computational execution speed without checking precision.`,
    ];
    let correctIndex = idx % 4; // rotate 0, 1, 2, 3
    let explanation = `When working with "${obj.statement}", verifying prerequisite boundary constraints is essential to prevent erroneous edge-case failures.`;

    if (isCS) {
      prompt = `When implementing "${obj.statement}" in ${topic}, which of the following represents the optimal architectural practice?`;
      options = [
        `Maintaining strict modular boundaries and handling edge conditions idempotently.`,
        `Relying on global mutable state across module boundaries.`,
        `Ignoring error propagation to minimize function call overhead.`,
        `Hardcoding configuration parameters directly into algorithmic loops.`,
      ];
      correctIndex = (idx + 1) % 4;
      explanation = `Modular design and idempotent handling of edge conditions ensure code correctness, testability, and maintainability.`;
    } else if (isMath) {
      prompt = `Which condition must hold true when solving analytical equations related to "${obj.statement}"?`;
      options = [
        `The continuity and differentiability of the functions across the domain of definition.`,
        `The equations must only have real integer roots.`,
        `The determinant of any auxiliary matrix must be strictly negative.`,
        `The boundary values must vanish at all coordinate points.`,
      ];
      correctIndex = (idx + 2) % 4;
      explanation = `Analytical solutions in differential and integral calculus require continuity across the domain of definition for theorems to remain valid.`;
    } else if (isPhysics) {
      prompt = `According to fundamental physical laws concerning "${obj.statement}", which statement accurately describes the system behavior?`;
      options = [
        `The equations of motion must conserve momentum in the absence of external net forces.`,
        `Frictional resistance is completely independent of the normal contact force.`,
        `Acceleration always points opposite to the net applied force vector.`,
        `Energy is continuously destroyed in closed thermodynamic cycles.`,
      ];
      correctIndex = (idx + 3) % 4;
      explanation = `Conservation of momentum is a foundational physical invariance in all closed mechanical systems.`;
    }

    // Shuffle options so correct answer is at correctIndex
    const correctOptionText = options[0];
    const otherOptions = options.slice(1);
    const finalOptions = [...otherOptions];
    finalOptions.splice(correctIndex, 0, correctOptionText);

    return {
      id: `q-${modulePlan.id}-${idx + 1}`,
      questionNumber: idx + 1,
      prompt,
      questionType: isCS ? 'code_interpretation' : isMath ? 'problem_solving' : 'conceptual',
      options: finalOptions,
      correctOptionIndex: correctIndex,
      explanation,
      difficulty: 'intermediate',
      learningObjectiveReference: obj.statement,
    };
  });

  return {
    id: `quiz-${modulePlan.id}`,
    title: `${modulePlan.title} Diagnostic Checkpoint`,
    moduleId: modulePlan.id,
    moduleTitle: modulePlan.title,
    timeLimitMinutes: 15,
    questions,
  };
}
