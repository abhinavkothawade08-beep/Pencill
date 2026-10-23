import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  ResourceEngineV2,
  EngineDiscoveryInput,
  getEngineConfig,
  setEngineModeOverride,
  isV1Active,
  isShadowMode,
  isV2Active,
  routeDiscovery,
  getShadowTelemetrySummary,
  clearShadowTelemetry,
  adaptV2ToDiscoverResponse,
  ProviderRegistry,
  ResourceProviderAdapter,
  SearchQueryItem,
  ProviderExecutionOptions,
  ProviderHealthStatus,
  ProviderSearchResult,
  NormalizedResourceCandidate,
  createBenchmarkFixtures,
  DeterministicMockAdapter,
} from '../../src/lib/resource-engine-v2';

/**
 * Failing Mock Adapter for Resilience Testing
 */
class FailingMockAdapter implements ResourceProviderAdapter {
  constructor(
    public readonly id: 'youtube' | 'openalex' | 'arxiv',
    public readonly name: string,
    private readonly failureType: 'throw' | 'timeout' | 'unavailable'
  ) {}

  public readonly capabilities = {
    supportedModalities: ['video', 'paper'] as const,
    maxBatchSize: 10,
    supportsCancellation: true,
    supportsPlaylistExpansion: false,
    quotaLimited: true,
    requiresApiKey: true,
  };

  public supportsQuery(query: SearchQueryItem): boolean {
    return query.providerCompatibility.includes(this.id);
  }

  public getHealthStatus(): ProviderHealthStatus {
    if (this.failureType === 'unavailable') {
      return {
        available: false,
        quotaExhausted: true,
        cooldownRemainingMs: 30000,
        circuitBreakerState: 'OPEN',
        reason: 'Quota exhausted 429: secret_key_123456789abcdef',
      };
    }
    return {
      available: true,
      quotaExhausted: false,
      cooldownRemainingMs: 0,
      circuitBreakerState: 'CLOSED',
    };
  }

  public async search(_query: SearchQueryItem, _options?: ProviderExecutionOptions): Promise<ProviderSearchResult> {
    if (this.failureType === 'throw') {
      throw new Error('API server rejected request with key=SECRET_KEY_987654321');
    }
    if (this.failureType === 'timeout') {
      return new Promise((resolve) => setTimeout(resolve, 5000));
    }
    return {
      provider: this.id,
      query: '',
      candidates: [],
      metadata: { latencyMs: 1 },
    };
  }
}

describe('Resource Engine 2.0 - Phase 6 Orchestrator & Production Bridge', () => {
  beforeEach(() => {
    setEngineModeOverride(null);
    clearShadowTelemetry();
  });

  afterEach(() => {
    setEngineModeOverride(null);
    clearShadowTelemetry();
  });

  describe('1. Configuration & Feature Flag Defaults', () => {
    it('defaults strictly to v1 when environment variable is unset', () => {
      delete process.env.RESOURCE_ENGINE_VERSION;
      setEngineModeOverride(null);
      const config = getEngineConfig();
      assert.equal(config.mode, 'v1');
      assert.equal(isV1Active(), true);
      assert.equal(isShadowMode(), false);
      assert.equal(isV2Active(), false);
    });

    it('falls back safely to v1 when environment variable contains invalid value', () => {
      process.env.RESOURCE_ENGINE_VERSION = 'invalid_experimental_mode';
      setEngineModeOverride(null);
      const config = getEngineConfig();
      assert.equal(config.mode, 'v1');
      delete process.env.RESOURCE_ENGINE_VERSION;
    });

    it('activates shadow mode when configured and enforces allowShadowDatabaseWrites = false', () => {
      setEngineModeOverride('shadow');
      const config = getEngineConfig();
      assert.equal(config.mode, 'shadow');
      assert.equal(isShadowMode(), true);
      assert.equal(config.allowShadowDatabaseWrites, false);
    });

    it('activates v2 mode when explicitly configured', () => {
      setEngineModeOverride('v2');
      assert.equal(isV2Active(), true);
      assert.equal(getEngineConfig().mode, 'v2');
    });

    it('kill switch immediately forces v1 mode regardless of previous state', () => {
      setEngineModeOverride('v2');
      assert.equal(isV2Active(), true);

      // Trigger kill switch
      setEngineModeOverride('v1');
      assert.equal(isV1Active(), true);
      assert.equal(isV2Active(), false);
      assert.equal(isShadowMode(), false);
    });
  });

  describe('2. End-to-End Orchestrator Pipeline', () => {
    it('executes full pipeline on structured curriculum with clean module separation', async () => {
      const fixtures = createBenchmarkFixtures();
      const registry = new ProviderRegistry({ empty: true });
      registry.register(new DeterministicMockAdapter('youtube', 'Mock YouTube', fixtures));
      registry.register(new DeterministicMockAdapter('openalex', 'Mock OpenAlex', fixtures));
      registry.register(new DeterministicMockAdapter('arxiv', 'Mock arXiv', fixtures));

      const engine = new ResourceEngineV2({ providerRegistry: registry });

      const input: EngineDiscoveryInput = {
        query: 'Linear Algebra',
        academicLevel: 'undergraduate',
        modules: [
          {
            moduleId: 'mod-matrices',
            moduleNumber: 1,
            moduleTitle: 'Matrix Multiplication and Dot Products',
            subtopics: ['Matrix Multiplication', 'Dot Product', 'Dimension Compatibility'],
          },
          {
            moduleId: 'mod-eigen',
            moduleNumber: 2,
            moduleTitle: 'Eigenvalues and Eigenvectors',
            subtopics: ['Eigenvalues', 'Eigenvectors', 'Characteristic Equation'],
          },
        ],
      };

      const result = await engine.discover(input);

      assert.equal(result.engineVersion, 'v2');
      assert.equal(result.domain, 'mathematics');
      assert.equal(result.distributedModules.length, 2);

      const mod1 = result.distributedModules[0];
      const mod2 = result.distributedModules[1];

      assert.equal(mod1.moduleTitle, 'Matrix Multiplication and Dot Products');
      assert.equal(mod2.moduleTitle, 'Eigenvalues and Eigenvectors');

      // Zero cross-contamination verification
      for (const res of mod1.resources) {
        assert.equal(res.title.toLowerCase().includes('eigenvalue'), false, 'Module 1 must not contain eigenvalue resources');
      }
      for (const res of mod2.resources) {
        assert.equal(res.title.toLowerCase().includes('matrix multiplication'), false, 'Module 2 must not contain matrix multiplication resources');
      }

      // Pre-write Supabase dry-run validation passed
      assert.equal(result.validationReport.isValid, true);
      assert.equal(result.validationReport.errors.length, 0);
    });

    it('extracts chapter timestamps for long lectures and attaches deep link URLs', async () => {
      const fixtures = createBenchmarkFixtures();
      const registry = new ProviderRegistry({ empty: true });
      registry.register(new DeterministicMockAdapter('youtube', 'Mock YouTube', fixtures));
      registry.register(new DeterministicMockAdapter('openalex', 'Mock OpenAlex', fixtures));
      registry.register(new DeterministicMockAdapter('arxiv', 'Mock arXiv', fixtures));

      const engine = new ResourceEngineV2({ providerRegistry: registry });

      const input: EngineDiscoveryInput = {
        query: 'Matrix Multiplication',
        modules: [
          {
            moduleId: 'mod-1',
            moduleNumber: 1,
            moduleTitle: 'Matrix Multiplication',
            subtopics: ['Matrix Multiplication', 'Dot Product'],
          },
        ],
      };

      const result = await engine.discover(input);
      const mod1 = result.distributedModules[0];
      const lecture = mod1.resources.find((r) => r.modality === 'video' && r.durationMinutes >= 15);

      assert.ok(lecture, 'Must assign lecture video');
      assert.ok(lecture.chapters && lecture.chapters.length > 0, 'Must extract chapters from description');
      assert.equal(lecture.chapters[0].timestampFormatted, '00:00');
      assert.ok(lecture.chapterReference?.deepLinkUrl.includes('t='), 'Must generate deep link timestamp url');
    });
  });

  describe('3. Provider Failure Resilience & Privacy Safeguards', () => {
    it('gracefully tolerates partial provider failure without throwing or aborting discovery', async () => {
      const fixtures = createBenchmarkFixtures();
      const registry = new ProviderRegistry({ empty: true });
      // YouTube throws an error with a secret key
      registry.register(new FailingMockAdapter('youtube', 'Broken YouTube', 'throw'));
      // OpenAlex succeeds
      registry.register(new DeterministicMockAdapter('openalex', 'Healthy OpenAlex', fixtures));
      registry.register(new DeterministicMockAdapter('arxiv', 'Healthy arXiv', fixtures));

      const engine = new ResourceEngineV2({ providerRegistry: registry });

      const input: EngineDiscoveryInput = {
        query: 'Matrix Multiplication',
      };

      const result = await engine.discover(input);

      // Must not crash, should deliver OpenAlex candidates
      assert.equal(result.engineVersion, 'v2');
      assert.ok(result.executionMetrics.partialFailures.length > 0, 'Must record partial failure');

      // Crucial privacy verification: API key must be redacted
      const failLog = result.executionMetrics.partialFailures.join(' ');
      assert.equal(failLog.includes('SECRET_KEY_987654321'), false, 'Sensitive API keys must be redacted');
      assert.ok(failLog.includes('[REDACTED]'), 'Must include redacted placeholder');
    });

    it('aborts underlying provider retrieval immediately when AbortSignal is cancelled', async () => {
      let abortedSignalObserved = false;

      class CancellableAdapter implements ResourceProviderAdapter {
        public readonly id = 'youtube' as const;
        public readonly name = 'Cancellable YouTube';
        public readonly capabilities = {
          supportedModalities: ['video'] as const,
          maxBatchSize: 10,
          supportsCancellation: true,
          supportsPlaylistExpansion: false,
          quotaLimited: false,
          requiresApiKey: false,
        };
        public supportsQuery(q: SearchQueryItem): boolean {
          return q.providerCompatibility.includes(this.id);
        }
        public getHealthStatus(): ProviderHealthStatus {
          return { available: true, quotaExhausted: false, cooldownRemainingMs: 0, circuitBreakerState: 'CLOSED' };
        }
        public async search(_q: SearchQueryItem, options?: ProviderExecutionOptions): Promise<ProviderSearchResult> {
          if (options?.signal) {
            options.signal.addEventListener('abort', () => {
              abortedSignalObserved = true;
            }, { once: true });
          }
          // Simulate hanging request
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return { provider: 'youtube', query: '', candidates: [], metadata: { latencyMs: 2000 } };
        }
      }

      const registry = new ProviderRegistry({ empty: true });
      registry.register(new CancellableAdapter());
      const engine = new ResourceEngineV2({ providerRegistry: registry });

      const controller = new AbortController();
      // Abort quickly after 50ms
      setTimeout(() => controller.abort(), 50);

      const result = await engine.discover({
        query: 'Cancellable Query',
        signal: controller.signal,
      });

      assert.equal(abortedSignalObserved, true, 'Provider adapter must receive abort signal when parent is aborted');
      assert.equal(result.engineVersion, 'v2');
    });

    it('handles total provider failure with an honest empty state without unhandled promise rejections', async () => {
      const registry = new ProviderRegistry({ empty: true });
      registry.register(new FailingMockAdapter('youtube', 'Broken YouTube', 'throw'));
      registry.register(new FailingMockAdapter('openalex', 'Broken OpenAlex', 'unavailable'));
      registry.register(new FailingMockAdapter('arxiv', 'Broken arXiv', 'unavailable'));

      const engine = new ResourceEngineV2({ providerRegistry: registry });

      const input: EngineDiscoveryInput = {
        query: 'Quantum Computing Theory',
      };

      const result = await engine.discover(input);

      assert.equal(result.engineVersion, 'v2');
      assert.equal(result.distributedModules.length, 1);
      assert.equal(result.distributedModules[0].isEmptyState, true);
      assert.ok(result.distributedModules[0].emptyStateReason?.includes('threshold'), 'Empty state must provide clear reason');
      assert.equal(result.executionMetrics.totalCandidatesDistributed, 0);
    });
  });

  describe('4. Safe Engine Router & Shadow Mode Integrity', () => {
    it('in v1 mode: calls V1 executor directly and returns its payload', async () => {
      setEngineModeOverride('v1');
      let v1Called = false;

      const v1MockResponse = {
        success: true,
        resources: [{ id: 'v1-res-1', title: 'V1 Resource' }],
        metadata: { query: 'test' },
      };

      const response = await routeDiscovery(
        { query: 'test' },
        async () => {
          v1Called = true;
          return v1MockResponse;
        }
      );

      assert.equal(v1Called, true);
      assert.deepEqual(response, v1MockResponse);
    });

    it('in shadow mode: returns V1 response immediately and executes V2 in background with zero writes', async () => {
      setEngineModeOverride('shadow');

      const fixtures = createBenchmarkFixtures();
      const registry = new ProviderRegistry({ empty: true });
      registry.register(new DeterministicMockAdapter('youtube', 'Mock YouTube', fixtures));
      registry.register(new DeterministicMockAdapter('openalex', 'Mock OpenAlex', fixtures));
      registry.register(new DeterministicMockAdapter('arxiv', 'Mock arXiv', fixtures));
      const v2Engine = new ResourceEngineV2({ providerRegistry: registry });

      let shadowCompleted = false;
      let shadowRecordResult: any = null;

      let resolveShadow: () => void;
      const shadowPromise = new Promise<void>((resolve) => {
        resolveShadow = resolve;
      });

      const v1MockResponse = {
        success: true,
        resources: [{ url: 'https://www.youtube.com/watch?v=vid-matrix-01', title: 'Matrix Video' }],
        metadata: { query: 'Matrix Multiplication' },
      };

      const response = await routeDiscovery(
        {
          query: 'Matrix Multiplication',
          saveToDatabase: true, // Should be overridden to FALSE in shadow mode
        },
        async () => v1MockResponse,
        {
          v2Engine,
          onShadowComplete: (rec) => {
            shadowCompleted = true;
            shadowRecordResult = rec;
            resolveShadow();
          },
        }
      );

      // Caller receives V1 response immediately
      assert.deepEqual(response, v1MockResponse);

      // Await completion of async shadow worker without arbitrary timeout race
      await shadowPromise;

      assert.equal(shadowCompleted, true);
      assert.ok(shadowRecordResult);
      assert.equal(shadowRecordResult.v2Success, true);
      assert.ok(shadowRecordResult.jaccardSimilarity >= 0);

      // Check shadow telemetry summary
      const summary = getShadowTelemetrySummary();
      assert.equal(summary.totalRuns, 1);
      assert.equal(summary.successfulRuns, 1);
      assert.equal(summary.failedRuns, 0);
    });

    it('in shadow mode: V2 exceptions do NOT break or delay V1 caller response', async () => {
      setEngineModeOverride('shadow');

      // V2 engine that fails
      const registry = new ProviderRegistry({ empty: true });
      registry.register(new FailingMockAdapter('youtube', 'Broken', 'throw'));
      registry.register(new FailingMockAdapter('openalex', 'Broken', 'throw'));
      registry.register(new FailingMockAdapter('arxiv', 'Broken', 'throw'));
      const v2Engine = new ResourceEngineV2({ providerRegistry: registry });

      let shadowFinished = false;
      let resolveShadow: () => void;
      const shadowPromise = new Promise<void>((resolve) => {
        resolveShadow = resolve;
      });

      const v1MockResponse = {
        success: true,
        resources: [],
        metadata: { query: 'Failing Query' },
      };

      const response = await routeDiscovery(
        { query: 'Failing Query' },
        async () => v1MockResponse,
        {
          v2Engine,
          onShadowComplete: () => {
            shadowFinished = true;
            resolveShadow();
          },
        }
      );

      // Caller still gets clean V1 response
      assert.deepEqual(response, v1MockResponse);

      await shadowPromise;
      assert.equal(shadowFinished, true);
    });

    it('in v2 mode: routes to V2 engine and formats response via compatibility adapter', async () => {
      setEngineModeOverride('v2');

      const fixtures = createBenchmarkFixtures();
      const registry = new ProviderRegistry({ empty: true });
      registry.register(new DeterministicMockAdapter('youtube', 'Mock YouTube', fixtures));
      registry.register(new DeterministicMockAdapter('openalex', 'Mock OpenAlex', fixtures));
      registry.register(new DeterministicMockAdapter('arxiv', 'Mock arXiv', fixtures));
      const v2Engine = new ResourceEngineV2({ providerRegistry: registry });

      const response = (await routeDiscovery(
        {
          query: 'Matrix Multiplication',
          modules: [
            {
              moduleId: 'mod-1',
              moduleNumber: 1,
              moduleTitle: 'Matrix Multiplication',
              subtopics: ['Matrix Multiplication', 'Dot Product'],
            },
          ],
        },
        async () => ({ success: false, error: 'Should not call V1' }),
        { v2Engine }
      )) as ReturnType<typeof adaptV2ToDiscoverResponse>;

      assert.equal(response.success, true);
      assert.ok(Array.isArray(response.resources));
      assert.ok(response.metadata);
      assert.equal(response.metadata.engineVersion, 'v2');
      assert.ok(response.learningPath);
      assert.equal(response.learningPath.modules.length, 1);
      assert.ok(response.discoveredResources.length > 0);
    });

    it('in v2 mode: unexpected catastrophic failure safely falls back to V1', async () => {
      setEngineModeOverride('v2');

      // Corrupt engine that throws
      const corruptEngine = {
        discover: async () => {
          throw new Error('Catastrophic failure in V2 engine');
        },
      } as unknown as ResourceEngineV2;

      let v1FallbackCalled = false;
      const v1FallbackResponse = {
        success: true,
        resources: [],
        metadata: { query: 'fallback', isV1: true },
      };

      const response = await routeDiscovery(
        { query: 'Crash Query' },
        async () => {
          v1FallbackCalled = true;
          return v1FallbackResponse;
        },
        { v2Engine: corruptEngine }
      );

      assert.equal(v1FallbackCalled, true, 'Must safely fall back to V1 on unhandled V2 error');
      assert.deepEqual(response, v1FallbackResponse);
    });
  });

  describe('5. Compatibility Adapter Contract Fidelity', () => {
    it('produces response matching legacy API contract with all mandatory properties', async () => {
      const fixtures = createBenchmarkFixtures();
      const registry = new ProviderRegistry({ empty: true });
      registry.register(new DeterministicMockAdapter('youtube', 'Mock YouTube', fixtures));
      registry.register(new DeterministicMockAdapter('openalex', 'Mock OpenAlex', fixtures));
      registry.register(new DeterministicMockAdapter('arxiv', 'Mock arXiv', fixtures));
      const engine = new ResourceEngineV2({ providerRegistry: registry });

      const v2Output = await engine.discover({
        query: 'Matrix Multiplication',
        modules: [
          {
            moduleId: 'mod-1',
            moduleNumber: 1,
            moduleTitle: 'Matrix Multiplication',
            subtopics: ['Matrix Multiplication', 'Dot Product'],
          },
        ],
      });

      const publicResponse = adaptV2ToDiscoverResponse(v2Output);

      assert.equal(publicResponse.success, true);
      assert.ok(Array.isArray(publicResponse.resources));
      assert.ok(Array.isArray(publicResponse.discoveredResources));
      assert.ok(publicResponse.metadata);
      assert.equal(publicResponse.metadata.engineVersion, 'v2');

      // Verify learning path shape
      const lp = publicResponse.learningPath;
      assert.ok(lp);
      assert.ok(lp.id);
      assert.ok(lp.title);
      assert.ok(lp.domain);
      assert.ok(lp.level);
      assert.ok(Array.isArray(lp.modules));

      const mod = lp.modules[0];
      assert.equal(mod.moduleNumber, 1);
      assert.equal(mod.title, 'Matrix Multiplication');
      assert.ok(Array.isArray(mod.lessons));

      for (const lesson of mod.lessons) {
        assert.ok(lesson.id);
        assert.ok(lesson.title);
        assert.ok(lesson.type);
        assert.ok(lesson.sourceUrl);
        assert.ok(typeof lesson.estimatedMinutes === 'number');
        assert.ok(typeof lesson.qualityScore === 'number');
      }
    });
  });
});
