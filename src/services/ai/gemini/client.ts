/**
 * Server-Side Gemini REST Client
 * Communicates with Google Gemini Generative Language API.
 * Never accessible in browser clients. Enforces timeouts, structured logging, and key redaction.
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_TIMEOUT_MS = 25000;
const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];
const PRIMARY_MODEL = CANDIDATE_MODELS[0];
const FALLBACK_MODEL = CANDIDATE_MODELS[1];

export interface GeminiRequestOptions {
  model?: string;
  timeoutMs?: number;
  temperature?: number;
  jsonMode?: boolean;
  maxOutputTokens?: number;
  thinkingConfig?: {
    thinkingLevel?: 'minimal' | 'low' | 'medium' | 'high';
    thinkingBudget?: number;
  };
}

export class GeminiClientError extends Error {
  public readonly statusCode?: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode?: number,
    details?: unknown
  ) {
    super(message);
    this.name = 'GeminiClientError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

function getApiKey(): string {
  // Ensure we are strictly server-side
  if (typeof window !== 'undefined') {
    throw new GeminiClientError('Security Violation: Gemini API cannot be invoked in browser contexts.');
  }

  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new GeminiClientError(
      'GEMINI_API_KEY environment variable is not configured on the server. Please set it in .env.local.'
    );
  }
  return key;
}

function sanitizeLogMessage(msg: string): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return msg;
  return msg.split(key).join('[REDACTED_API_KEY]');
}

export async function callGemini(
  prompt: string,
  systemInstruction?: string,
  options: GeminiRequestOptions = {}
): Promise<string> {
  const apiKey = getApiKey();
  const requestedModel = options.model || PRIMARY_MODEL;
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;

  // Determine models to try (starting from requested model or candidate list)
  const modelsToTry = options.model
    ? [options.model]
    : Array.from(new Set([requestedModel, ...CANDIDATE_MODELS]));

  let lastError: Error | null = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];
    const endpoint = `${GEMINI_API_BASE}/models/${encodeURIComponent(currentModel)}:generateContent`;

    const generationConfig: Record<string, unknown> = {
      temperature: options.temperature ?? 0.2,
      responseMimeType: options.jsonMode ? 'application/json' : 'text/plain',
    };

    if (options.maxOutputTokens) {
      generationConfig.maxOutputTokens = options.maxOutputTokens;
    }

    if (options.thinkingConfig) {
      generationConfig.thinkingConfig = options.thinkingConfig;
    }

    const body: Record<string, unknown> = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig,
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const startTime = Date.now();

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

      const elapsed = Date.now() - startTime;
      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text();
        let parsedError: { error?: { message?: string; status?: string; code?: number } } = {};
        try {
          parsedError = JSON.parse(errorText);
        } catch {
          // use raw text
        }

        const errorMessage = sanitizeLogMessage(
          parsedError.error?.message || `HTTP ${response.status}: ${response.statusText}`
        );

        console.warn(`[GeminiClient] Model "${currentModel}" failed (${response.status}) after ${elapsed}ms: ${errorMessage}`);

        const isQuotaExhausted =
          response.status === 429 &&
          (parsedError.error?.status === 'RESOURCE_EXHAUSTED' ||
            errorMessage.toLowerCase().includes('quota'));

        // If quota is exhausted on the project, all candidate models share the same limit; fail fast
        if (isQuotaExhausted) {
          throw new GeminiClientError(errorMessage, response.status, parsedError);
        }

        // If another model is available in fallback list for transient errors, try next model
        if (i < modelsToTry.length - 1 && (response.status === 404 || response.status === 503)) {
          console.warn(`[GeminiClient] Retrying with next candidate model="${modelsToTry[i + 1]}"...`);
          continue;
        }

        throw new GeminiClientError(errorMessage, response.status, parsedError);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        console.warn(`[GeminiClient] Empty candidate returned from "${currentModel}" after ${elapsed}ms`, {
          finishReason: data.candidates?.[0]?.finishReason,
        });
        if (i < modelsToTry.length - 1) continue;
        throw new GeminiClientError('No response content generated by Gemini.');
      }

      return rawText;
    } catch (err: unknown) {
      clearTimeout(timer);
      lastError = err as Error;

      if (err instanceof GeminiClientError) {
        if (err.statusCode === 429) {
          throw err;
        }
        if (err.statusCode && (err.statusCode === 404 || err.statusCode === 503)) {
          if (i < modelsToTry.length - 1) {
            continue;
          }
        }
      }

      if ((err as { name?: string }).name === 'AbortError') {
        if (i < modelsToTry.length - 1) {
          console.warn(`[GeminiClient] Model "${currentModel}" timed out, attempting fallback model...`);
          continue;
        }
        const timeoutError = `Gemini API request timed out after ${timeoutMs}ms.`;
        console.error(`[GeminiClient] ${timeoutError}`);
        throw new GeminiClientError(timeoutError, 408);
      }

      if (i < modelsToTry.length - 1) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new GeminiClientError('All Gemini candidate models failed to generate content.');
}

