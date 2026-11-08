import { callGemini, GeminiClientError } from '@/services/ai/gemini/client';
import { CurriculumProposalSchema } from './schemas';
import { CurriculumProposal, ObjectiveAnalysis } from './types';
import { getCurriculumConfig, redactSecrets, isGeminiConfigured } from './configuration';

export class CurriculumGeminiError extends Error {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, code = 'CURRICULUM_GEMINI_ERROR', details?: unknown) {
    super(redactSecrets(message));
    this.name = 'CurriculumGeminiError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Strips markdown code blocks and trims whitespace.
 */
function cleanJsonText(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

/**
 * Calls Gemini Generative Language API with strict JSON schema instructions,
 * automated error recovery, and Zod validation.
 */
export async function generateCurriculumWithGemini(
  analysis: ObjectiveAnalysis,
  additionalContext?: {
    priorKnowledge?: string;
    targetExam?: string;
    language?: string;
    customObjectives?: readonly string[];
  }
): Promise<CurriculumProposal> {
  if (!isGeminiConfigured()) {
    throw new CurriculumGeminiError(
      'Gemini API is not configured on the server. Falling back to deterministic curriculum engine.',
      'API_KEY_MISSING'
    );
  }

  const config = getCurriculumConfig();

  const systemInstruction = `
You are the Chief Academic Curriculum Architect at Pencill.
Your mission is to synthesize rigorous, cohesive, logically sequenced learning paths without unnecessary module fragmentation or content duplication.

CORE PEDAGOGICAL INVARIANTS:
- ONE COHERENT LEARNING UNIT = ONE MODULE.
- Closely related concepts must be grouped together in the same module (e.g. syntax, variables, types and basic operators belong in one foundational module).
- Do NOT artificially split concepts into separate tiny modules.
- Target Module Count: ${
  analysis.complexity === 'narrow_focused'
    ? 'exactly 1 module (or 2 if advanced or extensive duration)'
    : analysis.complexity === 'comprehensive'
    ? `between 4 and ${Math.max(5, analysis.recommendedModuleCount)} cohesive modules (Fundamentals → Core Concepts → Practical Applications → Advanced Integration)`
    : `${analysis.recommendedModuleCount} cohesive modules`
} for this ${analysis.complexity} topic.
- Module count must be determined strictly by pedagogical requirements and topic complexity. Never collapse a broad subject into only 1 module, and never artificially split narrow single concepts.
- Prerequisite DAG: Ensure earlier modules provide prerequisites for subsequent modules with 0 circular dependencies.
- Output strictly valid JSON matching the requested schema. No markdown prose.
`;

  const prompt = `
Create an academic curriculum proposal for:
- Topic: "${analysis.topic}"
- Domain: ${analysis.detectedDomain}
- Target Level: ${analysis.normalizedLevel}
- Complexity: ${analysis.complexity}
- Recommended Module Count: ${analysis.recommendedModuleCount} modules
- Target Study Duration: ${analysis.recommendedTotalHours} hours
${additionalContext?.targetExam ? `- Target Examination / Board: ${additionalContext.targetExam}` : ''}
${additionalContext?.priorKnowledge ? `- Prior Knowledge: ${additionalContext.priorKnowledge}` : ''}
${additionalContext?.language ? `- Instruction Language: ${additionalContext.language}` : ''}
${
  additionalContext?.customObjectives && additionalContext.customObjectives.length > 0
    ? `- Learner Objectives: ${additionalContext.customObjectives.join('; ')}`
    : ''
}

JSON Schema structure:
{
  "courseTitle": "string",
  "domain": "${analysis.detectedDomain}",
  "academicLevel": "${analysis.normalizedLevel}",
  "totalEstimatedHours": ${analysis.recommendedTotalHours},
  "pedagogicalRationale": "string",
  "modules": [
    {
      "id": "module-1",
      "orderIndex": 0,
      "title": "string",
      "description": "string",
      "concepts": ["concept1", "concept2"],
      "learningObjectives": [
        {
          "id": "lo-1-1",
          "statement": "string",
          "keyTerms": ["term1", "term2"],
          "bloomLevel": "understand"
        }
      ],
      "prerequisites": ["prereq1"],
      "estimatedHours": number,
      "searchQueries": {
        "videoQueries": ["query1", "query2"],
        "readingQueries": ["query1", "query2"]
      },
      "expectedOutcomes": ["outcome1"],
      "practicalExercises": ["exercise1"]
    }
  ]
}
`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const rawText = await callGemini(prompt, systemInstruction, {
        model: config.primaryModel,
        timeoutMs: config.timeoutMs,
        temperature: config.temperature,
        jsonMode: true,
        maxOutputTokens: config.maxOutputTokens,
      });

      const cleaned = cleanJsonText(rawText);
      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        throw new CurriculumGeminiError(
          `Failed to parse Gemini JSON output: ${(parseErr as Error).message}`,
          'JSON_PARSE_ERROR',
          cleaned
        );
      }

      const parseResult = CurriculumProposalSchema.safeParse(parsed);
      if (!parseResult.success) {
        const issues = parseResult.error.flatten().fieldErrors;
        throw new CurriculumGeminiError(
          `Gemini curriculum output violated schema contract: ${JSON.stringify(issues)}`,
          'SCHEMA_VALIDATION_ERROR',
          issues
        );
      }

      return parseResult.data;
    } catch (err: unknown) {
      lastError = err as Error;
      if (err instanceof GeminiClientError && err.statusCode === 429) {
        // Quota exhausted, do not retry
        throw new CurriculumGeminiError(
          'Gemini quota exhausted (429): Utilizing deterministic curriculum fallback engine.',
          'QUOTA_EXHAUSTED'
        );
      }

      if (attempt < config.maxRetries) {
        const delay = config.retryDelayMs * Math.pow(1.5, attempt);
        console.warn(
          `[CurriculumGeminiProvider] Attempt ${attempt + 1} failed (${redactSecrets((err as Error).message)}). Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new CurriculumGeminiError(
    `Failed to generate curriculum with Gemini after ${config.maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`,
    'RETRIES_EXHAUSTED'
  );
}
