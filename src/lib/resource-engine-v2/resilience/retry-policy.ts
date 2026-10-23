import { ProviderError } from '../types/errors';

export interface RetryOptions {
  maxRetries?: number;          // Default: 2
  initialBackoffMs?: number;    // Default: 100ms
  backoffMultiplier?: number;   // Default: 2
  maxBackoffMs?: number;        // Default: 2000ms
  signal?: AbortSignal;
}

/**
 * Executes an asynchronous provider action with bounded retries for transient failures.
 * Strictly avoids retrying non-retryable errors (e.g. Quota Exhausted, Bad Config, Client 4xx).
 */
export async function executeWithRetry<T>(
  action: (attemptNumber: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 2;
  const initialBackoffMs = options.initialBackoffMs ?? 100;
  const backoffMultiplier = options.backoffMultiplier ?? 2;
  const maxBackoffMs = options.maxBackoffMs ?? 2000;
  const signal = options.signal;

  let attempt = 0;
  let currentBackoffMs = initialBackoffMs;

  while (true) {
    if (signal?.aborted) {
      throw new Error('Operation aborted before execution');
    }

    try {
      return await action(attempt);
    } catch (err: unknown) {
      attempt++;

      // 1. Check if error is explicitly non-retryable
      if (err instanceof ProviderError && !err.retryable) {
        throw err;
      }

      // 2. Check if max retry attempts reached
      if (attempt > maxRetries) {
        throw err;
      }

      // 3. Check if aborted while attempting
      if (signal?.aborted) {
        throw err;
      }

      // 4. Wait for backoff period before next attempt
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => resolve(), currentBackoffMs);
        if (signal) {
          const onAbort = () => {
            clearTimeout(timer);
            signal.removeEventListener('abort', onAbort);
            reject(new Error('Operation aborted during retry backoff'));
          };
          signal.addEventListener('abort', onAbort, { once: true });
        }
      });

      currentBackoffMs = Math.min(maxBackoffMs, currentBackoffMs * backoffMultiplier);
    }
  }
}
