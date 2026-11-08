/**
 * Curriculum Intelligence Configuration & Secret Protection
 * Governs model selection, token budgets, timeout constraints, retry policies,
 * and hermetic secret sanitization for the Gemini Curriculum Architect.
 */

export interface CurriculumIntelligenceConfig {
  readonly primaryModel: string;
  readonly candidateModels: readonly string[];
  readonly timeoutMs: number;
  readonly maxRetries: number;
  readonly retryDelayMs: number;
  readonly temperature: number;
  readonly maxOutputTokens: number;
}

export const CANDIDATE_CURRICULUM_MODELS: readonly string[] = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.8-flash',
  'gemini-flash-latest',
] as const;

export const DEFAULT_CURRICULUM_CONFIG: CurriculumIntelligenceConfig = {
  primaryModel: 'gemini-3.5-flash-lite',
  candidateModels: CANDIDATE_CURRICULUM_MODELS,
  timeoutMs: 30000,
  maxRetries: 2,
  retryDelayMs: 1200,
  temperature: 0.2,
  maxOutputTokens: 4096,
};

/**
 * Returns runtime curriculum intelligence configuration derived from environment variables
 * with production fallbacks.
 */
export function getCurriculumConfig(
  overrides?: Partial<CurriculumIntelligenceConfig>
): CurriculumIntelligenceConfig {
  const envModel = process.env.GEMINI_CURRICULUM_MODEL?.trim();
  const primaryModel = envModel || DEFAULT_CURRICULUM_CONFIG.primaryModel;

  const candidateModels = Array.from(
    new Set([primaryModel, ...DEFAULT_CURRICULUM_CONFIG.candidateModels])
  );

  return {
    ...DEFAULT_CURRICULUM_CONFIG,
    primaryModel,
    candidateModels,
    ...overrides,
  };
}

/**
 * Redacts API keys, bearer tokens, and sensitive strings from logs and diagnostics.
 */
export function redactSecrets(text: string): string {
  if (!text) return text;
  let sanitized = text;

  const keysToRedact = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_READING_API_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ].filter((k): k is string => Boolean(k && k.trim().length > 0));

  for (const key of keysToRedact) {
    sanitized = sanitized.split(key).join('[REDACTED_API_KEY]');
  }

  // Redact potential AI tokens or query strings formatted like key=AIza...
  sanitized = sanitized.replace(/AIza[0-9A-Za-z-_]{20,50}/g, '[REDACTED_GEMINI_KEY]');

  return sanitized;
}

/**
 * Checks if the Gemini API key is configured on the server.
 */
export function isGeminiConfigured(): boolean {
  if (typeof window !== 'undefined') return false;
  const key = process.env.GEMINI_API_KEY?.trim();
  return Boolean(key && key.length > 5);
}
