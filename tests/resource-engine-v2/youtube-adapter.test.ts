import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  YouTubeAdapterV2,
  SearchQueryItem,
  parseIsoDurationToSeconds,
  ProviderConfigurationError,
  ProviderQuotaExhaustedError,
  ProviderTimeoutError,
  ProviderMalformedResponseError,
} from '../../src/lib/resource-engine-v2';

describe('Resource Engine 2.0 - YouTubeAdapterV2', () => {
  const baseQuery: SearchQueryItem = {
    id: 'q-test-1',
    targetConcept: 'Matrices and Determinants',
    queryString: 'HSC Class 12 Matrices full tutorial explanation',
    intent: 'foundational_explanation',
    preferredModality: 'video',
    providerCompatibility: ['youtube'],
    priority: 1,
    provenance: 'Primary test query',
  };

  describe('Duration Parsing (ISO 8601 to Seconds)', () => {
    it('accurately parses standard ISO 8601 durations into seconds', () => {
      assert.strictEqual(parseIsoDurationToSeconds('PT4M13S'), 253);
      assert.strictEqual(parseIsoDurationToSeconds('PT1H2M10S'), 3730);
      assert.strictEqual(parseIsoDurationToSeconds('PT45S'), 45);
      assert.strictEqual(parseIsoDurationToSeconds('PT2H'), 7200);
      assert.strictEqual(parseIsoDurationToSeconds('P1DT2H'), 93600);
    });

    it('correctly distinguishes valid 0 duration from missing/invalid duration', () => {
      // Valid zero
      assert.strictEqual(parseIsoDurationToSeconds('PT0S'), 0);
      assert.strictEqual(parseIsoDurationToSeconds('PT0M0S'), 0);

      // Missing/invalid returns undefined (never guesses 20 min)
      assert.strictEqual(parseIsoDurationToSeconds(undefined), undefined);
      assert.strictEqual(parseIsoDurationToSeconds(null), undefined);
      assert.strictEqual(parseIsoDurationToSeconds(''), undefined);
      assert.strictEqual(parseIsoDurationToSeconds('invalid-duration'), undefined);
    });
  });

  describe('Configuration & Error Handling', () => {
    it('throws ProviderConfigurationError when YOUTUBE_API_KEY is missing', async () => {
      const adapter = new YouTubeAdapterV2({ apiKey: '' });
      await assert.rejects(
        async () => adapter.search(baseQuery),
        (err: unknown) => {
          assert.ok(err instanceof ProviderConfigurationError);
          assert.strictEqual(err.code, 'CONFIGURATION_ERROR');
          assert.strictEqual(err.retryable, false);
          return true;
        }
      );
    });

    it('handles 429 quota exhaustion, trips circuit breaker, and avoids retrying', async () => {
      let callCount = 0;
      const mockFetch = async () => {
        callCount++;
        return new Response(
          JSON.stringify({
            error: {
              code: 429,
              message: 'Quota exceeded for quota metric Queries and limit Queries per day',
              errors: [{ reason: 'quotaExceeded' }],
            },
          }),
          { status: 429, statusText: 'Too Many Requests' }
        );
      };

      const adapter = new YouTubeAdapterV2({
        apiKey: 'test-key',
        fetchFn: mockFetch as unknown as typeof fetch,
        circuitBreakerConfig: { quotaCooldownMs: 60_000 },
      });

      // First search should throw QuotaExhaustedError
      await assert.rejects(
        async () => adapter.search(baseQuery),
        (err: unknown) => {
          assert.ok(err instanceof ProviderQuotaExhaustedError);
          assert.strictEqual(err.code, 'QUOTA_EXHAUSTED');
          assert.strictEqual(err.retryable, false);
          return true;
        }
      );

      // Verify no multiple retries were wasted on quota exhaustion
      assert.strictEqual(callCount, 1, 'Should NOT retry on quota exhaustion');

      // Subsequent call should be blocked immediately by circuit breaker without network call
      const health = adapter.getHealthStatus();
      assert.strictEqual(health.circuitBreakerState, 'OPEN');
      assert.ok(health.cooldownRemainingMs > 0);

      await assert.rejects(
        async () => adapter.search(baseQuery),
        (err: unknown) => {
          assert.ok(err instanceof ProviderQuotaExhaustedError);
          assert.ok(err.message.includes('circuit breaker active'));
          return true;
        }
      );

      // Still only 1 network call occurred
      assert.strictEqual(callCount, 1);
    });

    it('handles malformed JSON response safely', async () => {
      const mockFetch = async () => new Response('Invalid Non-JSON Payload', { status: 200 });
      const adapter = new YouTubeAdapterV2({
        apiKey: 'test-key',
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      await assert.rejects(
        async () => adapter.search(baseQuery),
        (err: unknown) => {
          assert.ok(err instanceof ProviderMalformedResponseError);
          return true;
        }
      );
    });

    it('handles request timeout and cancellation', async () => {
      const controller = new AbortController();
      controller.abort();

      const adapter = new YouTubeAdapterV2({
        apiKey: 'test-key',
        fetchFn: (() => new Promise(() => {})) as unknown as typeof fetch,
      });

      await assert.rejects(
        async () => adapter.search(baseQuery, { signal: controller.signal }),
        (err: unknown) => {
          assert.ok(err instanceof ProviderTimeoutError || (err instanceof Error && err.message.includes('aborted')));
          return true;
        }
      );
    });
  });

  describe('Video Retrieval & Normalization', () => {
    it('normalizes genuine video candidates and retrieves genuine duration', async () => {
      const mockFetch = async (input: RequestInfo | URL) => {
        const urlStr = input.toString();

        if (urlStr.includes('/search')) {
          return new Response(
            JSON.stringify({
              items: [
                {
                  id: { kind: 'youtube#video', videoId: 'vid12345678' },
                  snippet: {
                    title: 'Class 12 Matrices Complete One Shot',
                    description: 'Comprehensive lecture covering determinants and matrices.',
                    channelTitle: 'Dinesh Sir Live Study',
                    channelId: 'UC12345',
                    publishedAt: '2024-03-15T10:00:00Z',
                    thumbnails: { high: { url: 'https://i.ytimg.com/vi/vid12345678/hqdefault.jpg' } },
                  },
                },
              ],
            }),
            { status: 200 }
          );
        }

        if (urlStr.includes('/videos')) {
          return new Response(
            JSON.stringify({
              items: [
                {
                  id: 'vid12345678',
                  snippet: {
                    title: 'Class 12 Matrices Complete One Shot',
                    description: 'Comprehensive lecture covering determinants and matrices.',
                    channelTitle: 'Dinesh Sir Live Study',
                    channelId: 'UC12345',
                    publishedAt: '2024-03-15T10:00:00Z',
                    thumbnails: { high: { url: 'https://i.ytimg.com/vi/vid12345678/hqdefault.jpg' } },
                  },
                  contentDetails: {
                    duration: 'PT1H45M20S',
                    definition: 'hd',
                  },
                  status: {
                    embeddable: true,
                    privacyStatus: 'public',
                  },
                },
              ],
            }),
            { status: 200 }
          );
        }

        return new Response(JSON.stringify({ items: [] }), { status: 200 });
      };

      const adapter = new YouTubeAdapterV2({
        apiKey: 'test-key',
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const result = await adapter.search(baseQuery);

      assert.strictEqual(result.provider, 'youtube');
      assert.strictEqual(result.candidates.length, 1);

      const candidate = result.candidates[0];
      assert.strictEqual(candidate.id, 'youtube_vid12345678');
      assert.strictEqual(candidate.externalId, 'vid12345678');
      assert.strictEqual(candidate.title, 'Class 12 Matrices Complete One Shot');
      assert.strictEqual(candidate.canonicalUrl, 'https://www.youtube.com/watch?v=vid12345678');
      assert.strictEqual(candidate.creator?.name, 'Dinesh Sir Live Study');
      assert.strictEqual(candidate.creator?.channelId, 'UC12345');
      // 1 hour 45 min 20 sec = 3600 + 2700 + 20 = 6320 seconds
      assert.strictEqual(candidate.durationSeconds, 6320);
      assert.strictEqual(candidate.isEmbeddable, true);
      assert.strictEqual(candidate.verificationStatus, 'unverified_candidate');
      assert.strictEqual(candidate.retrievalProvenance.queryString, baseQuery.queryString);
    });

    it('handles empty search results cleanly without error', async () => {
      const mockFetch = async () => new Response(JSON.stringify({ items: [] }), { status: 200 });
      const adapter = new YouTubeAdapterV2({
        apiKey: 'test-key',
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const result = await adapter.search(baseQuery);
      assert.strictEqual(result.candidates.length, 0);
    });

    it('deduplicates video IDs before requesting video details', async () => {
      let requestedVideoIdsParam = '';
      const mockFetch = async (input: RequestInfo | URL) => {
        const urlStr = input.toString();
        if (urlStr.includes('/search')) {
          return new Response(
            JSON.stringify({
              items: [
                { id: { kind: 'youtube#video', videoId: 'dupVideo123' } },
                { id: { kind: 'youtube#video', videoId: 'dupVideo123' } }, // Duplicate in search payload
              ],
            }),
            { status: 200 }
          );
        }
        if (urlStr.includes('/videos')) {
          const parsed = new URL(urlStr);
          requestedVideoIdsParam = parsed.searchParams.get('id') || '';
          return new Response(
            JSON.stringify({
              items: [
                {
                  id: 'dupVideo123',
                  snippet: { title: 'Test Video', channelTitle: 'Test Channel' },
                  contentDetails: { duration: 'PT5M' },
                  status: { embeddable: true },
                },
              ],
            }),
            { status: 200 }
          );
        }
        return new Response(JSON.stringify({ items: [] }), { status: 200 });
      };

      const adapter = new YouTubeAdapterV2({
        apiKey: 'test-key',
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const result = await adapter.search(baseQuery);
      assert.strictEqual(requestedVideoIdsParam, 'dupVideo123');
      assert.strictEqual(result.candidates.length, 1);
    });
  });

  describe('Playlist Expansion & Inaccessible Entry Handling', () => {
    it('expands playlist items and reports inaccessible/deleted items honestly', async () => {
      const mockFetch = async (input: RequestInfo | URL) => {
        const urlStr = input.toString();

        if (urlStr.includes('/search')) {
          return new Response(
            JSON.stringify({
              items: [
                {
                  id: { kind: 'youtube#playlist', playlistId: 'PLmath123' },
                  snippet: { title: 'Class 12 Math Playlist', channelTitle: 'Educator' },
                },
              ],
            }),
            { status: 200 }
          );
        }

        if (urlStr.includes('/playlistItems')) {
          return new Response(
            JSON.stringify({
              items: [
                {
                  snippet: {
                    title: 'Lesson 1: Introduction to Matrices',
                    resourceId: { kind: 'youtube#video', videoId: 'vidA1' },
                  },
                  status: { privacyStatus: 'public' },
                },
                {
                  snippet: {
                    title: 'Private video', // Deleted/private item
                    resourceId: { kind: 'youtube#video', videoId: 'vidA2' },
                  },
                  status: { privacyStatus: 'private' },
                },
                {
                  snippet: {
                    title: 'Lesson 2: Matrix Multiplication',
                    resourceId: { kind: 'youtube#video', videoId: 'vidA3' },
                  },
                  status: { privacyStatus: 'public' },
                },
              ],
              pageInfo: { totalResults: 3 },
            }),
            { status: 200 }
          );
        }

        if (urlStr.includes('/videos')) {
          return new Response(
            JSON.stringify({
              items: [
                {
                  id: 'vidA1',
                  snippet: { title: 'Lesson 1: Introduction to Matrices', channelTitle: 'Educator' },
                  contentDetails: { duration: 'PT25M10S' },
                  status: { embeddable: true },
                },
                {
                  id: 'vidA3',
                  snippet: { title: 'Lesson 2: Matrix Multiplication', channelTitle: 'Educator' },
                  contentDetails: { duration: 'PT30M' },
                  status: { embeddable: true },
                },
              ],
            }),
            { status: 200 }
          );
        }

        return new Response(JSON.stringify({ items: [] }), { status: 200 });
      };

      const adapter = new YouTubeAdapterV2({
        apiKey: 'test-key',
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const result = await adapter.search(baseQuery, { expandPlaylists: true });

      // Inaccessible item vidA2 was filtered out cleanly
      assert.strictEqual(result.candidates.length, 2);
      assert.strictEqual(result.candidates[0].externalId, 'vidA1');
      assert.strictEqual(result.candidates[0].durationSeconds, 25 * 60 + 10);
      assert.strictEqual(result.candidates[0].playlist?.playlistId, 'PLmath123');
      assert.strictEqual(result.candidates[0].playlist?.playlistIndex, 1);
      assert.strictEqual(result.candidates[0].playlist?.inaccessibleCount, 1);

      assert.strictEqual(result.candidates[1].externalId, 'vidA3');
      assert.strictEqual(result.candidates[1].durationSeconds, 1800);

      // Honest partial failure report
      assert.ok(result.partialFailures && result.partialFailures.length > 0);
      assert.ok(result.partialFailures.some((f) => f.includes('1 inaccessible/deleted items')));
    });
  });
});
