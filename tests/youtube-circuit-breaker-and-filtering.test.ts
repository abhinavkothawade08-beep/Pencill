import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  findVerifiedDirectoryResources,
  isYouTubeQuotaExhausted,
  recordYouTubeQuotaExhaustion,
  resetYouTubeQuotaForTesting,
  YouTubeProvider,
  isGoogleSearchAvailable,
  recordGoogleSearchQuotaExhaustion,
  recordGoogleProjectDisabled,
  resetGoogleSearchCircuitBreakerForTesting,
  GoogleSearchProvider,
} from '../src/lib/resource-engine-v2';

describe('YouTube Provider: Topic Filtering & Quota Circuit Breakers', () => {
  beforeEach(() => {
    resetYouTubeQuotaForTesting();
    resetGoogleSearchCircuitBreakerForTesting();
  });

  afterEach(() => {
    resetYouTubeQuotaForTesting();
    resetGoogleSearchCircuitBreakerForTesting();
  });

  test('Content token filtering prevents generic format stop-word bleed (Python query does not match Algorithms playlist)', () => {
    // "Complete Python Programming Course" contains generic words 'complete', 'course'
    // but the actual content token is 'python'.
    // The directory candidate "Algorithms Complete Course Playlist" should NOT match.
    const pythonResults = findVerifiedDirectoryResources('Complete Python Programming Course');
    const matchedAlgorithm = pythonResults.some((r) =>
      r.title.toLowerCase().includes('algorithm')
    );
    assert.strictEqual(
      matchedAlgorithm,
      false,
      'Generic words "complete course" must not bleed into matching an Algorithms playlist for a Python search'
    );
  });

  test('Content token filtering correctly matches authentic topic queries', () => {
    // "Algorithms Full Course" has content token 'algorithms'
    const algoResults = findVerifiedDirectoryResources('Algorithms Full Course');
    assert.ok(algoResults.length > 0, 'Should match verified Algorithms resource');
    assert.ok(
      algoResults[0].title.toLowerCase().includes('algorithm'),
      'First match should be an Algorithms resource'
    );

    // "JEE Chemistry Haloalkanes" has content tokens 'chemistry', 'haloalkanes'
    const haloResults = findVerifiedDirectoryResources('JEE Chemistry Haloalkanes');
    assert.ok(haloResults.length > 0, 'Should match verified Chemistry Haloalkanes resource');
    assert.ok(
      haloResults.some((r) => r.title.toLowerCase().includes('haloalkane') || (r.description && r.description.toLowerCase().includes('haloalkane'))),
      'Should match resource mentioning haloalkanes'
    );
  });

  test('YouTube Quota Circuit Breaker trips cleanly and provides graceful directory fallback', async () => {
    const ytProvider = new YouTubeProvider();

    // Verify baseline (not exhausted)
    assert.strictEqual(isYouTubeQuotaExhausted(), false);

    // Trip circuit breaker
    recordYouTubeQuotaExhaustion(60000); // 1 minute cooldown
    assert.strictEqual(isYouTubeQuotaExhausted(), true);

    // Verify provider availability status reports quota exhaustion with directory fallback
    const status = ytProvider.getAvailabilityStatus();
    assert.strictEqual(status.available, true, 'Provider remains available via verified directory fallback');
    assert.strictEqual(status.isQuotaExhausted, true, 'Status correctly flags quota exhaustion');
    assert.ok(status.reason?.includes('quota exhausted'), 'Reason explains quota exhaustion');

    // Searching during quota exhaustion should immediately return directory resources without network calls
    const results = await ytProvider.search('Algorithms Complete Course');
    assert.ok(results.length > 0, 'Should serve directory resources even when quota is exhausted');
    assert.ok(results[0].title.toLowerCase().includes('algorithm'));

    // Searching for unknown topic during quota exhaustion safely returns empty array without throwing
    const unknownResults = await ytProvider.search('ArbitraryNonExistentTopicXYZ123');
    assert.deepStrictEqual(unknownResults, []);

    // Reset circuit breaker
    resetYouTubeQuotaForTesting();
    assert.strictEqual(isYouTubeQuotaExhausted(), false);
  });

  test('Google Search Provider: Circuit breaker tracks 429 quota exhaustion and 403 project access', () => {
    const googleProvider = new GoogleSearchProvider();

    // Baseline
    resetGoogleSearchCircuitBreakerForTesting();

    // Record quota exhaustion
    recordGoogleSearchQuotaExhaustion(60000);
    assert.strictEqual(isGoogleSearchAvailable(), false);
    const statusAfterQuota = googleProvider.getAvailabilityStatus();
    assert.strictEqual(statusAfterQuota.isQuotaExhausted, true);

    // Reset
    resetGoogleSearchCircuitBreakerForTesting();
    assert.strictEqual(isGoogleSearchAvailable(), true);

    // Record project disabled (HTTP 403 project lacks Custom Search access)
    recordGoogleProjectDisabled('Project lacks Custom Search JSON API');
    assert.strictEqual(isGoogleSearchAvailable(), false);
    const statusAfterDisabled = googleProvider.getAvailabilityStatus();
    assert.strictEqual(statusAfterDisabled.available, false);
    assert.ok(statusAfterDisabled.reason?.includes('403') || statusAfterDisabled.reason?.includes('disabled'));

    // Reset cleans up for subsequent runs
    resetGoogleSearchCircuitBreakerForTesting();
    assert.strictEqual(isGoogleSearchAvailable(), true);
  });
});
