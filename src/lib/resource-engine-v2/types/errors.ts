/**
 * Structured Provider Errors for Pencill Resource Engine 2.0
 * 
 * Explicitly distinguishes configuration, quota, rate-limit, timeout,
 * network, and malformed-response failures so that callers can make
 * intelligent retry, cooldown, and fallback decisions.
 */

export type ProviderErrorCode =
  | 'CONFIGURATION_ERROR'   // Missing API key, bad environment setup (Permanent: DO NOT RETRY)
  | 'QUOTA_EXHAUSTED'       // API quota fully depleted (Permanent for session: DO NOT RETRY)
  | 'RATE_LIMITED'          // Transient rate limit exceeded (Temporary: Backoff required)
  | 'TIMEOUT'               // Request exceeded configured timeout
  | 'NETWORK_ERROR'         // DNS, socket, connection reset
  | 'RESPONSE_ERROR'        // Non-success HTTP status (4xx/5xx)
  | 'MALFORMED_RESPONSE'    // JSON parse error, unexpected schema
  | 'UNSUPPORTED_QUERY';    // Query parameters incompatible with provider

export interface ProviderErrorDetails {
  provider: string;
  code: ProviderErrorCode;
  message: string;
  statusCode?: number;
  retryable: boolean;
  endpoint?: string;
  cause?: unknown;
}

export class ProviderError extends Error {
  readonly provider: string;
  readonly code: ProviderErrorCode;
  readonly statusCode?: number;
  readonly retryable: boolean;
  readonly endpoint?: string;

  constructor(details: ProviderErrorDetails) {
    super(`[${details.provider}] ${details.code}: ${details.message}`);
    this.name = 'ProviderError';
    this.provider = details.provider;
    this.code = details.code;
    this.statusCode = details.statusCode;
    this.retryable = details.retryable;
    this.endpoint = details.endpoint;
    if (details.cause) {
      this.cause = details.cause;
    }
  }
}

export class ProviderConfigurationError extends ProviderError {
  constructor(provider: string, message: string, endpoint?: string) {
    super({
      provider,
      code: 'CONFIGURATION_ERROR',
      message,
      retryable: false,
      endpoint,
    });
    this.name = 'ProviderConfigurationError';
  }
}

export class ProviderQuotaExhaustedError extends ProviderError {
  constructor(provider: string, message: string, endpoint?: string) {
    super({
      provider,
      code: 'QUOTA_EXHAUSTED',
      message,
      statusCode: 429,
      retryable: false,
      endpoint,
    });
    this.name = 'ProviderQuotaExhaustedError';
  }
}

export class ProviderRateLimitError extends ProviderError {
  readonly retryAfterSeconds?: number;

  constructor(provider: string, message: string, retryAfterSeconds?: number, endpoint?: string) {
    super({
      provider,
      code: 'RATE_LIMITED',
      message,
      statusCode: 429,
      retryable: true,
      endpoint,
    });
    this.name = 'ProviderRateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class ProviderTimeoutError extends ProviderError {
  constructor(provider: string, message: string, endpoint?: string) {
    super({
      provider,
      code: 'TIMEOUT',
      message,
      retryable: true,
      endpoint,
    });
    this.name = 'ProviderTimeoutError';
  }
}

export class ProviderNetworkError extends ProviderError {
  constructor(provider: string, message: string, cause?: unknown, endpoint?: string) {
    super({
      provider,
      code: 'NETWORK_ERROR',
      message,
      retryable: true,
      cause,
      endpoint,
    });
    this.name = 'ProviderNetworkError';
  }
}

export class ProviderResponseError extends ProviderError {
  constructor(provider: string, statusCode: number, message: string, endpoint?: string) {
    // 5xx errors are retryable; 4xx errors (except 429) are client errors and not retryable
    const retryable = statusCode >= 500 && statusCode <= 599;
    super({
      provider,
      code: 'RESPONSE_ERROR',
      message,
      statusCode,
      retryable,
      endpoint,
    });
    this.name = 'ProviderResponseError';
  }
}

export class ProviderMalformedResponseError extends ProviderError {
  constructor(provider: string, message: string, cause?: unknown, endpoint?: string) {
    super({
      provider,
      code: 'MALFORMED_RESPONSE',
      message,
      retryable: false,
      cause,
      endpoint,
    });
    this.name = 'ProviderMalformedResponseError';
  }
}
