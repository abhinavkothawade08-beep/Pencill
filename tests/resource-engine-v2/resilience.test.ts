import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CircuitBreaker,
  executeWithRetry,
  InMemoryCache,
  ProviderQuotaExhaustedError,
  ProviderResponseError,
} from '../../src/lib/resource-engine-v2';

describe('Resource Engine 2.0 - Resilience Controls', () => {
  describe('CircuitBreaker', () => {
    it('starts in CLOSED state and allows execution', () => {
      const breaker = new CircuitBreaker('TestProvider', { failureThreshold: 3 });
      const status = breaker.canExecute();
      assert.strictEqual(status.allowed, true);
      assert.strictEqual(status.state, 'CLOSED');
    });

    it('trips to OPEN state after reaching failure threshold', () => {
      const breaker = new CircuitBreaker('TestProvider', { failureThreshold: 2, cooldownMs: 5000 });
      breaker.recordFailure(false, 'Network error 1');
      assert.strictEqual(breaker.canExecute().allowed, true);

      breaker.recordFailure(false, 'Network error 2');
      const status = breaker.canExecute();
      assert.strictEqual(status.allowed, false);
      assert.strictEqual(status.state, 'OPEN');
      assert.ok(status.cooldownRemainingMs > 0);
    });

    it('trips immediately to OPEN with extended cooldown on 429 quota exhaustion', () => {
      const breaker = new CircuitBreaker('TestProvider', {
        failureThreshold: 5,
        quotaCooldownMs: 120_000,
      });

      // Single quota failure trips immediately even if threshold is 5
      breaker.recordFailure(true, '429 Quota Exhausted');

      const status = breaker.canExecute();
      assert.strictEqual(status.allowed, false);
      assert.strictEqual(status.state, 'OPEN');
      assert.ok(status.cooldownRemainingMs > 60_000);
    });

    it('transitions to HALF_OPEN after cooldown and recovers on success', async () => {
      const breaker = new CircuitBreaker('TestProvider', {
        failureThreshold: 1,
        cooldownMs: 50, // Short cooldown for test
      });

      breaker.recordFailure(false, 'Transient error');
      assert.strictEqual(breaker.canExecute().allowed, false);

      // Wait for cooldown to expire
      await new Promise((resolve) => setTimeout(resolve, 60));

      const halfOpenStatus = breaker.canExecute();
      assert.strictEqual(halfOpenStatus.allowed, true);
      assert.strictEqual(halfOpenStatus.state, 'HALF_OPEN');

      // Success in HALF_OPEN resets breaker to CLOSED
      breaker.recordSuccess();
      assert.strictEqual(breaker.canExecute().state, 'CLOSED');
      assert.strictEqual(breaker.getConsecutiveFailures(), 0);
    });
  });

  describe('RetryPolicy (executeWithRetry)', () => {
    it('retries transient failures up to maxRetries and succeeds', async () => {
      let attempts = 0;
      const result = await executeWithRetry(
        async () => {
          attempts++;
          if (attempts < 3) {
            // Transient 503 error
            throw new ProviderResponseError('Test', 503, 'Service Unavailable');
          }
          return 'success-payload';
        },
        { maxRetries: 3, initialBackoffMs: 10 }
      );

      assert.strictEqual(result, 'success-payload');
      assert.strictEqual(attempts, 3);
    });

    it('strictly does NOT retry non-retryable errors (e.g. Quota Exhaustion)', async () => {
      let attempts = 0;
      await assert.rejects(
        async () =>
          executeWithRetry(
            async () => {
              attempts++;
              throw new ProviderQuotaExhaustedError('Test', 'Out of quota');
            },
            { maxRetries: 3, initialBackoffMs: 10 }
          ),
        (err: unknown) => {
          assert.ok(err instanceof ProviderQuotaExhaustedError);
          return true;
        }
      );

      // Verify it aborted on attempt 1 without retrying
      assert.strictEqual(attempts, 1);
    });

    it('aborts immediately when AbortSignal is cancelled', async () => {
      const controller = new AbortController();
      controller.abort();

      let attempts = 0;
      await assert.rejects(
        async () =>
          executeWithRetry(
            async () => {
              attempts++;
              throw new Error('Some error');
            },
            { signal: controller.signal }
          )
      );

      assert.strictEqual(attempts, 0);
    });
  });

  describe('InMemoryCache', () => {
    it('stores and retrieves cached items before TTL expires', () => {
      const cache = new InMemoryCache<string[]>({ defaultTtlMs: 10_000 });
      cache.set('key1', ['alpha', 'beta']);

      assert.deepStrictEqual(cache.get('key1'), ['alpha', 'beta']);
      assert.strictEqual(cache.has('key1'), true);
    });

    it('returns null and evicts item after TTL expires', async () => {
      const cache = new InMemoryCache<string>({ defaultTtlMs: 50 }); // 50ms TTL
      cache.set('quickKey', 'quickValue');

      assert.strictEqual(cache.get('quickKey'), 'quickValue');

      await new Promise((resolve) => setTimeout(resolve, 60));

      assert.strictEqual(cache.get('quickKey'), null);
      assert.strictEqual(cache.has('quickKey'), false);
    });

    it('enforces maximum capacity with LRU eviction', () => {
      const cache = new InMemoryCache<number>({ maxEntries: 2 });
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3); // Should evict 'a'

      assert.strictEqual(cache.get('a'), null);
      assert.strictEqual(cache.get('b'), 2);
      assert.strictEqual(cache.get('c'), 3);
      assert.strictEqual(cache.size(), 2);
    });

    it('creates stable deterministic cache keys regardless of parameter ordering', () => {
      const key1 = InMemoryCache.createKey('youtube', { q: 'matrices', limit: 10, exam: 'HSC' });
      const key2 = InMemoryCache.createKey('youtube', { exam: 'HSC', limit: 10, q: 'matrices' });

      assert.strictEqual(key1, key2);
    });
  });
});
