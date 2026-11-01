/**
 * Dedicated Server-Side Gemini Provider for On-Demand Reading Generation.
 *
 * Isolated configuration:
 * - GEMINI_READING_API_KEY (with fallback to GEMINI_API_KEY on the server)
 * - GEMINI_READING_MODEL (configurable model selection)
 *
 * Security & Reliability:
 * - Strictly server-side: blocks browser invocation
 * - Key redaction in all logging and exception details
 * - Concurrency control with in-flight Semaphore
 * - Exponential backoff retry with jitter for transient failures
 * - Fast fail on permanent authentication (401, 403) or hard quota exhaustion
 * - Usage tracking (prompt, candidate, and total tokens)
 */

import { GeneratedReadingDocumentContent, GeneratedReadingDocumentContentSchema } from './types';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_TIMEOUT_MS = 60000; // 60s for deep monograph synthesis

const DEFAULT_CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];

export interface ReadingGenerationOptions {
  model?: string;
  timeoutMs?: number;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface ReadingGenerationResponse {
  content: GeneratedReadingDocumentContent;
  rawJson: string;
  model: string;
  tokenUsage?: {
    promptTokens?: number;
    candidatesTokens?: number;
    totalTokens?: number;
  };
}

export class ReadingGeminiError extends Error {
  public readonly statusCode?: number;
  public readonly isTransient: boolean;
  public readonly stage: string;
  public readonly code: string;

  constructor(
    message: string,
    statusCode?: number,
    isTransient = false,
    stage = 'engine',
    code = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'ReadingGeminiError';
    this.statusCode = statusCode;
    this.isTransient = isTransient;
    this.stage = stage;
    this.code = code;
  }
}

/**
 * Concurrency limiter to protect against quota exhaustion and burst limits.
 */
class Semaphore {
  private current = 0;
  private queue: Array<() => void> = [];

  constructor(private readonly maxConcurrent: number = 2) {}

  async acquire(): Promise<void> {
    if (this.current < this.maxConcurrent) {
      this.current++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.current++;
        resolve();
      });
    });
  }

  release(): void {
    this.current--;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

const generationSemaphore = new Semaphore(2);

function getReadingApiKey(): string {
  if (typeof window !== 'undefined') {
    throw new ReadingGeminiError(
      'Security Violation: Gemini Reading API cannot be invoked in browser contexts.',
      403,
      false,
      'auth',
      'AUTH_BROWSER_FORBIDDEN'
    );
  }

  const readingKey = process.env.GEMINI_READING_API_KEY?.trim();
  if (readingKey) return readingKey;

  const defaultKey = process.env.GEMINI_API_KEY?.trim();
  if (defaultKey) return defaultKey;

  throw new ReadingGeminiError(
    'GEMINI_READING_API_KEY (or GEMINI_API_KEY) is not configured on the server. Please set it in .env.local.',
    401,
    false,
    'auth',
    'AUTH_KEY_NOT_CONFIGURED'
  );
}

function sanitizeLog(message: string): string {
  const k1 = process.env.GEMINI_READING_API_KEY;
  const k2 = process.env.GEMINI_API_KEY;
  let sanitized = message;
  if (k1 && k1.length > 5) sanitized = sanitized.split(k1).join('[REDACTED_READING_KEY]');
  if (k2 && k2.length > 5) sanitized = sanitized.split(k2).join('[REDACTED_KEY]');
  return sanitized;
}

/**
 * Execute single REST call to Gemini with timeout
 */
async function executeGeminiRequest(
  prompt: string,
  systemInstruction: string,
  modelName: string,
  apiKey: string,
  options: ReadingGenerationOptions
): Promise<{ text: string; usage?: { promptTokens?: number; candidatesTokens?: number; totalTokens?: number } }> {
  const endpoint = `${GEMINI_API_BASE}/models/${encodeURIComponent(modelName)}:generateContent`;
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const body: Record<string, unknown> = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    generationConfig: {
      temperature: options.temperature ?? 0.2,
      responseMimeType: 'application/json',
      maxOutputTokens: options.maxOutputTokens ?? 8192,
    },
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError: { error?: { message?: string; status?: string; code?: number } } = {};
      try {
        parsedError = JSON.parse(errorText);
      } catch {
        // raw text
      }

      const rawMsg = parsedError.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      const sanitized = sanitizeLog(rawMsg);

      const isQuotaExhausted =
        response.status === 429 &&
        (parsedError.error?.status === 'RESOURCE_EXHAUSTED' || sanitized.toLowerCase().includes('quota'));

      const isAuthError = response.status === 401 || response.status === 403;
      const isTransient = !isAuthError && (response.status === 429 || response.status >= 500);

      const stage = isAuthError ? 'auth' : isQuotaExhausted ? 'quota' : response.status === 404 ? 'model' : 'network';
      const code = isAuthError
        ? 'AUTH_REJECTED'
        : isQuotaExhausted
        ? 'API_QUOTA_EXHAUSTED'
        : response.status === 404
        ? 'MODEL_NOT_FOUND'
        : 'API_HTTP_ERROR';

      throw new ReadingGeminiError(
        sanitized,
        response.status,
        isQuotaExhausted ? false : isTransient,
        stage,
        code
      );
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new ReadingGeminiError('Empty candidate returned from Gemini.', 500, true, 'ai_response', 'EMPTY_CANDIDATE');
    }

    const usageMeta = data.usageMetadata;
    const usage = usageMeta
      ? {
          promptTokens: usageMeta.promptTokenCount,
          candidatesTokens: usageMeta.candidatesTokenCount,
          totalTokens: usageMeta.totalTokenCount,
        }
      : undefined;

    return { text: rawText, usage };
  } catch (err: unknown) {
    clearTimeout(timer);
    if ((err as { name?: string }).name === 'AbortError') {
      throw new ReadingGeminiError(`Gemini request timed out after ${timeoutMs}ms.`, 408, true, 'network', 'REQUEST_TIMEOUT');
    }
    throw err;
  }
}

/**
 * Generates structured reading material using Gemini with retries, model fallbacks,
 * and concurrency limiting.
 */
export async function generateReadingMaterialWithGemini(
  prompt: string,
  systemInstruction: string,
  options: ReadingGenerationOptions = {}
): Promise<ReadingGenerationResponse> {
  const apiKey = getReadingApiKey();

  // Determine candidate model hierarchy
  const configuredModel =
    options.model ||
    process.env.GEMINI_READING_MODEL?.trim() ||
    DEFAULT_CANDIDATE_MODELS[0];

  const modelsToTry = Array.from(new Set([configuredModel, ...DEFAULT_CANDIDATE_MODELS]));

  await generationSemaphore.acquire();

  try {
    let lastError: Error | null = null;

    for (let mIdx = 0; mIdx < modelsToTry.length; mIdx++) {
      const currentModel = modelsToTry[mIdx];
      let attempt = 0;
      const maxRetries = 2;
      let delayMs = 1200;

      while (attempt <= maxRetries) {
        try {
          const result = await executeGeminiRequest(
            prompt,
            systemInstruction,
            currentModel,
            apiKey,
            options
          );

          // Parse and validate structured output
          let parsedJson: unknown;
          try {
            parsedJson = JSON.parse(result.text);
          } catch {
            // Strip markdown block if model wrapped in ```json
            const stripped = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            try {
              parsedJson = JSON.parse(stripped);
            } catch {
              const firstBrace = stripped.indexOf('{');
              const lastBrace = stripped.lastIndexOf('}');
              if (firstBrace !== -1 && lastBrace > firstBrace) {
                parsedJson = JSON.parse(stripped.substring(firstBrace, lastBrace + 1));
              } else {
                throw new ReadingGeminiError(
                  'Failed to parse Gemini output into structured JSON.',
                  500,
                  true,
                  'ai_response',
                  'JSON_PARSE_FAILED'
                );
              }
            }
          }

          const validation = GeneratedReadingDocumentContentSchema.safeParse(parsedJson);
          if (!validation.success) {
            console.warn(
              `[ReadingGeminiProvider] Schema validation warning on model "${currentModel}":`,
              validation.error.flatten().fieldErrors
            );

            // Attempt partial recovery if required core fields exist
            const raw = parsedJson as Partial<GeneratedReadingDocumentContent>;
            if (raw.title && raw.detailedConceptualExplanation) {
              const healedContent: GeneratedReadingDocumentContent = {
                title: raw.title,
                introduction: raw.introduction || `Introduction to ${raw.title}. This monograph provides an analytical breakdown of core principles.`,
                learningObjectives: Array.isArray(raw.learningObjectives) && raw.learningObjectives.length > 0
                  ? raw.learningObjectives
                  : ['Master core conceptual foundations and analytical techniques.'],
                prerequisiteConcepts: Array.isArray(raw.prerequisiteConcepts) ? raw.prerequisiteConcepts : [],
                detailedConceptualExplanation: raw.detailedConceptualExplanation,
                importantDefinitions: Array.isArray(raw.importantDefinitions) ? raw.importantDefinitions : [],
                stepByStepExplanations: Array.isArray(raw.stepByStepExplanations) ? raw.stepByStepExplanations : [],
                relevantExamples: Array.isArray(raw.relevantExamples) ? raw.relevantExamples : [],
                practicalApplications: Array.isArray(raw.practicalApplications) ? raw.practicalApplications : [],
                diagramsOrDescriptions: Array.isArray(raw.diagramsOrDescriptions) ? raw.diagramsOrDescriptions : [],
                commonMistakesAndMisconceptions: Array.isArray(raw.commonMistakesAndMisconceptions) ? raw.commonMistakesAndMisconceptions : [],
                workedExamples: Array.isArray(raw.workedExamples) ? raw.workedExamples : [],
                keyTakeaways: Array.isArray(raw.keyTakeaways) && raw.keyTakeaways.length >= 2
                  ? raw.keyTakeaways
                  : [
                      'Understand and verify core invariants before applying high-level abstractions.',
                      'Review worked examples and self-assessment items to consolidate mastery.',
                    ],
                summary: raw.summary || `In summary, this reading unit established theoretical principles, practical examples, and common misconceptions for ${raw.title}.`,
                selfAssessmentQuestions: Array.isArray(raw.selfAssessmentQuestions) && raw.selfAssessmentQuestions.length > 0
                  ? raw.selfAssessmentQuestions
                  : [
                      {
                        id: 'sa-1',
                        question: `What is the primary governing principle of ${raw.title}?`,
                        correctAnswer: 'Analyze the foundational mechanisms and apply them to standard problem constraints.',
                        explanation: 'Mastering the governing axioms allows deductive problem-solving in subsequent units.',
                      },
                    ],
                furtherReading: Array.isArray(raw.furtherReading) ? raw.furtherReading : [],
              };

              return {
                content: healedContent,
                rawJson: JSON.stringify(healedContent),
                model: currentModel,
                tokenUsage: result.usage,
              };
            }

            throw new ReadingGeminiError(
              `Model returned JSON that failed structured schema validation: ${JSON.stringify(validation.error.flatten().fieldErrors)}`,
              422,
              true,
              'ai_response',
              'SCHEMA_VALIDATION_FAILED'
            );
          }

          return {
            content: validation.data,
            rawJson: result.text,
            model: currentModel,
            tokenUsage: result.usage,
          };
        } catch (err: unknown) {
          lastError = err as Error;

          if (err instanceof ReadingGeminiError) {
            // Non-transient errors (401, 403, quota exhausted) should not retry the same model
            if (!err.isTransient) {
              break;
            }
          }

          attempt++;
          if (attempt <= maxRetries) {
            const jitter = Math.floor(Math.random() * 400);
            await new Promise((res) => setTimeout(res, delayMs + jitter));
            delayMs *= 2;
          }
        }
      }

      // If this model permanently failed with auth error, do not try other models
      if (lastError instanceof ReadingGeminiError && (lastError.statusCode === 401 || lastError.statusCode === 403)) {
        throw lastError;
      }
    }

    throw (
      lastError ||
      new ReadingGeminiError(
        'All Gemini candidate models failed to synthesize reading material.',
        502,
        false,
        'model',
        'ALL_MODELS_FAILED'
      )
    );
  } finally {
    generationSemaphore.release();
  }
}
