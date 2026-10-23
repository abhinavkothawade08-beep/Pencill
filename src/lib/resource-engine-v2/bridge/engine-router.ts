import { getEngineConfig, EngineConfig } from '../config';
import { ResourceEngineV2, EngineDiscoveryInput, EngineDiscoveryOutput } from '../orchestrator';
import { adaptV2ToDiscoverResponse } from './compatibility-adapter';

export interface ShadowTelemetryRecord {
  timestamp: string;
  query: string;
  v1DurationMs: number;
  v2DurationMs: number;
  v1ResourceCount: number;
  v2ResourceCount: number;
  overlapCount: number;
  jaccardSimilarity: number;
  v2Success: boolean;
  error?: string;
}

export interface ShadowTelemetrySummary {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageV1LatencyMs: number;
  averageV2LatencyMs: number;
  averageJaccardSimilarity: number;
  lastRecord?: ShadowTelemetryRecord;
}

// In-memory shadow comparison telemetry registry
const shadowTelemetryLog: ShadowTelemetryRecord[] = [];

/**
 * Computes Jaccard similarity index between two sets of URLs.
 */
function computeJaccardSimilarity(urlsA: string[], urlsB: string[]): number {
  const setA = new Set(urlsA.map((u) => u.toLowerCase().trim()));
  const setB = new Set(urlsB.map((u) => u.toLowerCase().trim()));

  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersection++;
    }
  }

  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : Number((intersection / union).toFixed(4));
}

/**
 * Records a shadow comparison event for analysis.
 */
export function recordShadowRun(record: ShadowTelemetryRecord): void {
  shadowTelemetryLog.push(record);
  if (shadowTelemetryLog.length > 500) {
    shadowTelemetryLog.shift(); // Keep bounded memory window
  }
}

/**
 * Retrieves aggregate summary metrics of shadow comparisons.
 */
export function getShadowTelemetrySummary(): ShadowTelemetrySummary {
  const total = shadowTelemetryLog.length;
  if (total === 0) {
    return {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      averageV1LatencyMs: 0,
      averageV2LatencyMs: 0,
      averageJaccardSimilarity: 0,
    };
  }

  const successful = shadowTelemetryLog.filter((r) => r.v2Success);
  const failed = shadowTelemetryLog.filter((r) => !r.v2Success);

  const avgV1 = shadowTelemetryLog.reduce((s, r) => s + r.v1DurationMs, 0) / total;
  const avgV2 = successful.length > 0
    ? successful.reduce((s, r) => s + r.v2DurationMs, 0) / successful.length
    : 0;
  const avgJaccard = successful.length > 0
    ? successful.reduce((s, r) => s + r.jaccardSimilarity, 0) / successful.length
    : 0;

  return {
    totalRuns: total,
    successfulRuns: successful.length,
    failedRuns: failed.length,
    averageV1LatencyMs: Math.round(avgV1),
    averageV2LatencyMs: Math.round(avgV2),
    averageJaccardSimilarity: Number(avgJaccard.toFixed(4)),
    lastRecord: shadowTelemetryLog[shadowTelemetryLog.length - 1],
  };
}

/**
 * Clears telemetry log for testing.
 */
export function clearShadowTelemetry(): void {
  shadowTelemetryLog.length = 0;
}

export interface RouterExecutionOptions {
  v2Engine?: ResourceEngineV2;
  configOverride?: EngineConfig;
  onShadowComplete?: (record: ShadowTelemetryRecord) => void;
}

/**
 * Safe Engine Router:
 * Routes resource discovery between V1, Shadow Mode, and V2 according to typed feature flags.
 * Defaults strictly to V1 and guarantees zero disruption to user responses.
 */
export async function routeDiscovery<TResponse extends Record<string, unknown>>(
  input: EngineDiscoveryInput,
  v1Executor: () => Promise<TResponse>,
  options?: RouterExecutionOptions
): Promise<TResponse | ReturnType<typeof adaptV2ToDiscoverResponse>> {
  const config = options?.configOverride || getEngineConfig();
  const v2Engine = options?.v2Engine || new ResourceEngineV2();

  // Mode 1: Default V1 Engine
  if (config.mode === 'v1') {
    return await v1Executor();
  }

  // Mode 2: Shadow Mode (V1 returned immediately, V2 runs asynchronously in dry-run mode)
  if (config.mode === 'shadow') {
    const v1Start = Date.now();
    const v1Response = await v1Executor();
    const v1DurationMs = Date.now() - v1Start;

    // Asynchronously trigger V2 shadow evaluation in isolated promise
    (async () => {
      const v2Start = Date.now();
      const shadowController = new AbortController();
      let timeoutId: NodeJS.Timeout | undefined;
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            shadowController.abort();
            reject(new Error(`Shadow V2 timeout after ${config.shadowTimeoutMs}ms`));
          }, config.shadowTimeoutMs);
        });

        // Invariant: saveToDatabase is strictly forced to FALSE in shadow mode
        const shadowInput: EngineDiscoveryInput = {
          ...input,
          saveToDatabase: false,
          signal: shadowController.signal,
          timeoutMs: config.shadowTimeoutMs,
        };

        const v2Task = v2Engine.discover(shadowInput, { config });
        const v2Result = (await Promise.race([v2Task, timeoutPromise])) as EngineDiscoveryOutput;
        const v2DurationMs = Date.now() - v2Start;

        // Extract URLs for overlap analysis
        const v1Resources = Array.isArray(v1Response.resources) ? (v1Response.resources as Array<{ url?: string }>) : [];
        const v1Urls = v1Resources.map((r) => r.url || '').filter(Boolean);
        const v2Urls = v2Result.rankedPool.rankedCandidates.map((c) => c.candidate.canonicalUrl);

        const jaccard = computeJaccardSimilarity(v1Urls, v2Urls);
        const overlapCount = v1Urls.filter((u) => v2Urls.includes(u)).length;

        const record: ShadowTelemetryRecord = {
          timestamp: new Date().toISOString(),
          query: input.query || input.topic || 'Unknown',
          v1DurationMs,
          v2DurationMs,
          v1ResourceCount: v1Urls.length,
          v2ResourceCount: v2Urls.length,
          overlapCount,
          jaccardSimilarity: jaccard,
          v2Success: true,
        };

        recordShadowRun(record);
        if (options?.onShadowComplete) {
          options.onShadowComplete(record);
        }
      } catch (shadowErr: unknown) {
        const errMessage = shadowErr instanceof Error ? shadowErr.message : String(shadowErr);
        const record: ShadowTelemetryRecord = {
          timestamp: new Date().toISOString(),
          query: input.query || input.topic || 'Unknown',
          v1DurationMs,
          v2DurationMs: Date.now() - v2Start,
          v1ResourceCount: 0,
          v2ResourceCount: 0,
          overlapCount: 0,
          jaccardSimilarity: 0,
          v2Success: false,
          error: errMessage,
        };
        recordShadowRun(record);
        if (options?.onShadowComplete) {
          options.onShadowComplete(record);
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    })().catch(() => {
      // Uncaught promise safety valve: never crash process
    });

    return v1Response;
  }

  // Mode 3: V2 Active Engine
  if (config.mode === 'v2') {
    try {
      const v2Output = await v2Engine.discover(input, { config });
      return adaptV2ToDiscoverResponse(v2Output);
    } catch (v2Err: unknown) {
      console.warn('[ResourceEngineV2] Primary execution encountered unexpected error. Safe fallback to V1:', v2Err);
      // Safe fallback to V1 ensures zero outage for end users
      return await v1Executor();
    }
  }

  // Unrecognized mode: Safe fallback to V1
  return await v1Executor();
}
