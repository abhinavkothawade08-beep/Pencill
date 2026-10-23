import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeCandidate,
  deduplicateCandidates,
  validateAndCanonicalizeUrl,
  NormalizedResourceCandidate,
  NormalizedResourceCandidateSchema,
} from '../../src/lib/resource-engine-v2';

describe('Resource Engine 2.0 - Normalization & Cross-Provider Deduplication', () => {
  describe('URL Canonicalization & Safety Guard', () => {
    it('accepts valid http and https URLs and strips tracking parameters', () => {
      const dirtyUrl = 'https://www.youtube.com/watch?v=12345&utm_source=twitter&utm_medium=social&si=abcd&feature=shared';
      const cleanUrl = validateAndCanonicalizeUrl(dirtyUrl);

      assert.strictEqual(cleanUrl, 'https://www.youtube.com/watch?v=12345');
    });

    it('rejects unsafe protocols (javascript:, data:, file:)', () => {
      assert.strictEqual(validateAndCanonicalizeUrl('javascript:alert(1)'), null);
      assert.strictEqual(validateAndCanonicalizeUrl('data:text/html,<b>xss</b>'), null);
      assert.strictEqual(validateAndCanonicalizeUrl('file:///etc/passwd'), null);
      assert.strictEqual(validateAndCanonicalizeUrl('not-a-url'), null);
      assert.strictEqual(validateAndCanonicalizeUrl(''), null);
    });
  });

  describe('Candidate Normalization Boundary', () => {
    it('normalizes valid raw candidate and preserves missing metadata explicitly', () => {
      const raw = {
        provider: 'youtube' as const,
        externalId: 'v9876543210',
        title: 'Rotational Dynamics Lecture 1',
        description: '', // Empty description
        rawUrl: 'https://www.youtube.com/watch?v=v9876543210',
        modality: 'video' as const,
        creator: { name: 'Mohit Tyagi' },
        durationSeconds: 1845,
        thumbnailUrl: 'https://i.ytimg.com/vi/v9876543210/default.jpg',
        provenance: {
          queryString: 'JEE Advanced Rotational Dynamics',
        },
      };

      const result = normalizeCandidate(raw);
      assert.ok(result.candidate !== null);
      assert.doesNotThrow(() => NormalizedResourceCandidateSchema.parse(result.candidate));

      const c = result.candidate!;
      assert.strictEqual(c.id, 'youtube_v9876543210');
      assert.strictEqual(c.durationSeconds, 1845);
      assert.strictEqual(c.title, 'Rotational Dynamics Lecture 1');
      assert.strictEqual(c.creator?.name, 'Mohit Tyagi');

      // Description and publishedAt are missing; durationSeconds is present
      assert.ok(c.missingMetadata.includes('description'));
      assert.ok(c.missingMetadata.includes('publishedAt'));
      assert.ok(!c.missingMetadata.includes('durationSeconds'));
    });

    it('safely drops malformed candidate without throwing or crashing', () => {
      const invalidRaw = {
        provider: 'youtube' as const,
        externalId: '', // Empty external ID
        title: '   ',   // Empty title
        rawUrl: 'not a url', // Invalid URL
        modality: 'video' as const,
        provenance: { queryString: 'test' },
      };

      const result = normalizeCandidate(invalidRaw);
      assert.strictEqual(result.candidate, null);
      assert.ok(result.error && result.error.length > 0);
    });

    it('distinguishes genuine 0 duration from missing duration', () => {
      const withZero = normalizeCandidate({
        provider: 'youtube' as const,
        externalId: 'zero123',
        title: 'Quick Teaser',
        rawUrl: 'https://www.youtube.com/watch?v=zero123',
        modality: 'video' as const,
        durationSeconds: 0,
        provenance: { queryString: 'test' },
      });

      assert.strictEqual(withZero.candidate?.durationSeconds, 0);
      assert.ok(!withZero.candidate?.missingMetadata.includes('durationSeconds'));

      const withMissing = normalizeCandidate({
        provider: 'openalex' as const,
        externalId: 'W12345',
        title: 'Research Paper',
        rawUrl: 'https://doi.org/10.1234/test',
        modality: 'paper' as const,
        durationSeconds: undefined,
        provenance: { queryString: 'test' },
      });

      assert.strictEqual(withMissing.candidate?.durationSeconds, undefined);
      assert.ok(withMissing.candidate?.missingMetadata.includes('durationSeconds'));
    });
  });

  describe('Cross-Provider Deduplication', () => {
    it('deduplicates identical candidates and merges richer metadata', () => {
      const candidateA: NormalizedResourceCandidate = {
        id: 'youtube_abc123',
        provider: 'youtube',
        externalId: 'abc123',
        title: 'Physics Lecture',
        canonicalUrl: 'https://www.youtube.com/watch?v=abc123',
        sourceUrl: 'https://www.youtube.com/watch?v=abc123',
        modality: 'video',
        missingMetadata: ['durationSeconds', 'thumbnailUrl'],
        verificationStatus: 'unverified_candidate',
        retrievalProvenance: {
          queryString: 'physics',
          provider: 'youtube',
          retrievedAt: new Date().toISOString(),
        },
      };

      const candidateB: NormalizedResourceCandidate = {
        id: 'youtube_abc123',
        provider: 'youtube',
        externalId: 'abc123',
        title: 'Physics Lecture',
        canonicalUrl: 'https://www.youtube.com/watch?v=abc123',
        sourceUrl: 'https://www.youtube.com/watch?v=abc123',
        modality: 'video',
        durationSeconds: 1200, // Provides duration missing in A
        thumbnailUrl: 'https://i.ytimg.com/vi/abc123/hqdefault.jpg',
        missingMetadata: [],
        verificationStatus: 'unverified_candidate',
        retrievalProvenance: {
          queryString: 'physics lecture',
          provider: 'youtube',
          retrievedAt: new Date().toISOString(),
        },
      };

      const candidateC: NormalizedResourceCandidate = {
        id: 'arxiv_2106.09685',
        provider: 'arxiv',
        externalId: '2106.09685',
        title: 'LoRA Paper',
        canonicalUrl: 'https://arxiv.org/abs/2106.09685',
        sourceUrl: 'https://arxiv.org/pdf/2106.09685.pdf',
        modality: 'paper',
        missingMetadata: ['durationSeconds'],
        verificationStatus: 'unverified_candidate',
        retrievalProvenance: {
          queryString: 'lora',
          provider: 'arxiv',
          retrievedAt: new Date().toISOString(),
        },
      };

      const deduplicated = deduplicateCandidates([candidateA, candidateB, candidateC]);

      // A and B merged into 1; C kept distinct
      assert.strictEqual(deduplicated.length, 2);

      const merged = deduplicated.find((c) => c.externalId === 'abc123')!;
      assert.strictEqual(merged.durationSeconds, 1200);
      assert.strictEqual(merged.thumbnailUrl, 'https://i.ytimg.com/vi/abc123/hqdefault.jpg');
      assert.ok(!merged.missingMetadata.includes('durationSeconds'));
    });
  });
});
