/**
 * Comprehensive Error Categorization, Internal Logging & User-Facing Diagnostics
 * for the Pencill On-Demand AI Reading Engine.
 */

export type ReadingErrorStage =
  | 'auth'
  | 'quota'
  | 'model'
  | 'network'
  | 'ai_response'
  | 'validation'
  | 'context'
  | 'database'
  | 'unknown';

export interface StructuredReadingError {
  stage: ReadingErrorStage;
  code: string;
  statusCode: number;
  userMessage: string;
  technicalMessage: string;
  requestId: string;
  timestamp: string;
}

/**
 * Strips sensitive API keys from strings before logging or transmission.
 */
export function sanitizeSensitiveInfo(message: string): string {
  const k1 = process.env.GEMINI_READING_API_KEY;
  const k2 = process.env.GEMINI_API_KEY;
  let sanitized = message || '';
  if (k1 && k1.length > 5) {
    sanitized = sanitized.split(k1).join('[REDACTED_READING_KEY]');
  }
  if (k2 && k2.length > 5) {
    sanitized = sanitized.split(k2).join('[REDACTED_KEY]');
  }
  return sanitized;
}

/**
 * Classifies any thrown error into a structured, production-grade error entity.
 */
export function classifyReadingError(err: unknown, customRequestId?: string): StructuredReadingError {
  const requestId = customRequestId || `req_read_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();

  let rawMessage = '';
  let statusCode = 500;
  let customStage: ReadingErrorStage | undefined = undefined;
  let customCode: string | undefined = undefined;

  if (err instanceof Error) {
    rawMessage = err.message || '';
    if ('statusCode' in err && typeof (err as any).statusCode === 'number') {
      statusCode = (err as any).statusCode;
    }
    if ('stage' in err && typeof (err as any).stage === 'string') {
      customStage = (err as any).stage as ReadingErrorStage;
    }
    if ('code' in err && typeof (err as any).code === 'string') {
      customCode = (err as any).code;
    }
  } else if (typeof err === 'string') {
    rawMessage = err;
  } else {
    rawMessage = 'Unknown internal exception';
  }

  const sanitizedTechnical = sanitizeSensitiveInfo(rawMessage);
  const lowerMsg = sanitizedTechnical.toLowerCase();

  // 1. Stage & Code Identification
  let stage: ReadingErrorStage = customStage || 'unknown';
  let code = customCode || 'INTERNAL_ERROR';
  let userMessage = "We couldn't generate your study notes right now. Please click Retry Generation.";

  if (
    statusCode === 401 ||
    statusCode === 403 ||
    lowerMsg.includes('api key') ||
    lowerMsg.includes('unauthorized') ||
    lowerMsg.includes('not configured') ||
    lowerMsg.includes('security violation')
  ) {
    stage = 'auth';
    code = 'AUTH_INVALID_KEY';
    statusCode = statusCode === 403 ? 403 : 401;
    userMessage = 'AI generation authorization failed. The server Gemini API key is missing or invalid. Please check GEMINI_READING_API_KEY in .env.local.';
  } else if (
    statusCode === 429 ||
    lowerMsg.includes('quota') ||
    lowerMsg.includes('resource_exhausted') ||
    lowerMsg.includes('rate limit') ||
    lowerMsg.includes('too many requests')
  ) {
    stage = 'quota';
    code = 'API_QUOTA_EXHAUSTED';
    statusCode = 429;
    userMessage = 'Gemini API quota or rate limit is temporarily exhausted. Please wait a few moments and click Retry Generation.';
  } else if (
    (statusCode === 404 && lowerMsg.includes('model')) ||
    lowerMsg.includes('model is no longer available') ||
    lowerMsg.includes('not found for api version') ||
    lowerMsg.includes('candidate models failed')
  ) {
    stage = 'model';
    code = 'UNSUPPORTED_MODEL';
    statusCode = 502;
    userMessage = 'The configured AI model is temporarily unavailable or unsupported. Click Retry Generation to switch to a fallback model.';
  } else if (
    statusCode === 408 ||
    lowerMsg.includes('timeout') ||
    lowerMsg.includes('timed out') ||
    lowerMsg.includes('aborterror') ||
    lowerMsg.includes('econnreset') ||
    lowerMsg.includes('fetch failed')
  ) {
    stage = 'network';
    code = 'NETWORK_TIMEOUT';
    statusCode = 408;
    userMessage = 'Network connection timed out while synthesizing your study notes. Please verify your connection and click Retry Generation.';
  } else if (
    statusCode === 422 ||
    lowerMsg.includes('relevance') ||
    lowerMsg.includes('pedagogical') ||
    lowerMsg.includes('off-topic') ||
    lowerMsg.includes('rigor')
  ) {
    stage = 'validation';
    code = 'RELEVANCE_VALIDATION_FAILED';
    statusCode = 422;
    userMessage = 'The generated notes did not meet strict academic rigor or topic relevance standards. Click Retry Generation to synthesize fresh notes.';
  } else if (
    lowerMsg.includes('json') ||
    lowerMsg.includes('schema validation') ||
    lowerMsg.includes('empty candidate') ||
    lowerMsg.includes('structured output')
  ) {
    stage = 'ai_response';
    code = 'INVALID_AI_RESPONSE';
    statusCode = 502;
    userMessage = 'The AI synthesis response could not be parsed into a structured monograph. Please click Retry Generation.';
  } else if (
    (statusCode === 404 && lowerMsg.includes('lesson')) ||
    lowerMsg.includes('unable to find lesson') ||
    lowerMsg.includes('invalid lesson or course')
  ) {
    stage = 'context';
    code = 'LESSON_CONTEXT_NOT_FOUND';
    statusCode = 404;
    userMessage = 'Could not resolve curriculum details for this lesson. Please refresh the page or click Retry Generation.';
  } else if (
    lowerMsg.includes('supabase') ||
    lowerMsg.includes('database') ||
    lowerMsg.includes('postgres') ||
    lowerMsg.includes('rls')
  ) {
    stage = 'database';
    code = 'DATABASE_PERSISTENCE_FAILED';
    statusCode = 500;
    userMessage = 'Database storage encountered a transient error. Your notes may still be available locally. Click Retry Generation.';
  }

  return {
    stage,
    code,
    statusCode,
    userMessage,
    technicalMessage: sanitizedTechnical,
    requestId,
    timestamp,
  };
}

/**
 * Structured server-side logger that outputs full diagnostic traces
 * while ensuring credentials are never printed.
 */
export function logReadingEngineError(stageTag: string, error: StructuredReadingError): void {
  console.error(`[ReadingEngineError][${stageTag}]`, {
    requestId: error.requestId,
    stage: error.stage,
    code: error.code,
    httpStatus: error.statusCode,
    timestamp: error.timestamp,
    technicalDetails: error.technicalMessage,
  });
}
