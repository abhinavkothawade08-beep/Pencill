import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  OpenAlexAdapterV2,
  ArXivAdapterV2,
  SearchQueryItem,
  ProviderResponseError,
  ProviderTimeoutError,
} from '../../src/lib/resource-engine-v2';

describe('Resource Engine 2.0 - Academic Providers (OpenAlex & arXiv)', () => {
  const academicQuery: SearchQueryItem = {
    id: 'q-acad-1',
    targetConcept: 'Low-Rank Adaptation',
    queryString: 'LoRA Low-Rank Adaptation of Large Language Models paper documentation',
    intent: 'authoritative_documentation',
    preferredModality: 'paper',
    providerCompatibility: ['openalex', 'arxiv'],
    priority: 2,
    provenance: 'Authoritative research paper query',
  };

  describe('OpenAlexAdapterV2', () => {
    it('normalizes genuine OpenAlex works with Open Access links and authors', async () => {
      const mockFetch = async () =>
        new Response(
          JSON.stringify({
            results: [
              {
                id: 'https://openalex.org/W3128472910',
                title: 'LoRA: Low-Rank Adaptation of Large Language Models',
                doi: 'https://doi.org/10.48550/arxiv.2106.09685',
                publication_year: 2021,
                publication_date: '2021-06-17',
                type: 'preprint',
                open_access: {
                  is_oa: true,
                  oa_url: 'https://arxiv.org/pdf/2106.09685.pdf',
                },
                primary_location: {
                  pdf_url: 'https://arxiv.org/pdf/2106.09685.pdf',
                  landing_page_url: 'https://doi.org/10.48550/arxiv.2106.09685',
                  source: { display_name: 'arXiv (Cornell University)' },
                },
                authorships: [
                  { author: { id: 'https://openalex.org/A123', display_name: 'Edward J. Hu' } },
                  { author: { id: 'https://openalex.org/A456', display_name: 'Yelong Shen' } },
                ],
              },
            ],
          }),
          { status: 200 }
        );

      const adapter = new OpenAlexAdapterV2({
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const result = await adapter.search(academicQuery);

      assert.strictEqual(result.provider, 'openalex');
      assert.strictEqual(result.candidates.length, 1);

      const candidate = result.candidates[0];
      assert.strictEqual(candidate.id, 'openalex_W3128472910');
      assert.strictEqual(candidate.title, 'LoRA: Low-Rank Adaptation of Large Language Models');
      assert.strictEqual(candidate.creator?.name, 'Edward J. Hu');
      assert.strictEqual(candidate.publishedAt, '2021-06-17');
      assert.strictEqual(candidate.sourceUrl, 'https://arxiv.org/pdf/2106.09685.pdf');
      assert.strictEqual(candidate.modality, 'paper');
      assert.strictEqual(candidate.verificationStatus, 'unverified_candidate');

      // Academic paper duration must be undefined (never guessed)
      assert.strictEqual(candidate.durationSeconds, undefined);
      assert.ok(candidate.missingMetadata.includes('durationSeconds'));
    });

    it('handles HTTP error gracefully by tripping circuit breaker', async () => {
      const mockFetch = async () => new Response('Internal Server Error', { status: 500, statusText: 'Internal Error' });
      const adapter = new OpenAlexAdapterV2({
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      await assert.rejects(
        async () => adapter.search(academicQuery),
        (err: unknown) => {
          assert.ok(err instanceof ProviderResponseError);
          assert.strictEqual(err.statusCode, 500);
          return true;
        }
      );
    });

    it('handles timeout when request is aborted', async () => {
      const controller = new AbortController();
      controller.abort();

      const adapter = new OpenAlexAdapterV2({
        fetchFn: (() => new Promise(() => {})) as unknown as typeof fetch,
      });

      await assert.rejects(
        async () => adapter.search(academicQuery, { signal: controller.signal }),
        (err: unknown) => {
          assert.ok(err instanceof ProviderTimeoutError || (err instanceof Error && err.message.includes('aborted')));
          return true;
        }
      );
    });
  });

  describe('ArXivAdapterV2', () => {
    it('accurately parses Atom XML feed and normalizes arXiv candidates', async () => {
      const sampleAtomXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title type="html">arXiv Query</title>
  <entry>
    <id>http://arxiv.org/abs/2106.09685v2</id>
    <published>2021-06-17T18:00:00Z</published>
    <title>LoRA: Low-Rank Adaptation of Large Language Models</title>
    <summary>We propose Low-Rank Adaptation (LoRA), which freezes pre-trained model weights.</summary>
    <author>
      <name>Edward J. Hu</name>
    </author>
  </entry>
</feed>`;

      const mockFetch = async () => new Response(sampleAtomXml, { status: 200 });

      const adapter = new ArXivAdapterV2({
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const result = await adapter.search(academicQuery);

      assert.strictEqual(result.provider, 'arxiv');
      assert.strictEqual(result.candidates.length, 1);

      const candidate = result.candidates[0];
      assert.strictEqual(candidate.id, 'arxiv_2106.09685');
      assert.strictEqual(candidate.externalId, '2106.09685');
      assert.strictEqual(candidate.title, 'LoRA: Low-Rank Adaptation of Large Language Models');
      assert.strictEqual(candidate.canonicalUrl, 'https://arxiv.org/abs/2106.09685');
      assert.strictEqual(candidate.sourceUrl, 'https://arxiv.org/pdf/2106.09685.pdf');
      assert.strictEqual(candidate.creator?.name, 'Edward J. Hu');
      assert.strictEqual(candidate.publishedAt, '2021-06-17T18:00:00Z');
      assert.strictEqual(candidate.durationSeconds, undefined);
      assert.strictEqual(candidate.modality, 'paper');
    });

    it('returns empty array cleanly when no entries match in Atom feed', async () => {
      const emptyFeed = `<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>arXiv</title></feed>`;
      const mockFetch = async () => new Response(emptyFeed, { status: 200 });

      const adapter = new ArXivAdapterV2({
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const result = await adapter.search(academicQuery);
      assert.strictEqual(result.candidates.length, 0);
    });
  });
});
