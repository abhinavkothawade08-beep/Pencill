import { z } from 'zod';

export const EngineModeSchema = z.enum(['v1', 'shadow', 'v2']);
export type EngineMode = z.infer<typeof EngineModeSchema>;

export interface EngineConfig {
  readonly mode: EngineMode;
  readonly shadowTimeoutMs: number;
  readonly v2TimeoutMs: number;
  readonly concurrencyLimit: number;
  readonly allowShadowDatabaseWrites: false; // Strictly false by contract
  readonly enableMetricsLogging: boolean;
  readonly defaultMinRelevanceThreshold: number;
}

// Module-level override for deterministic testing without mutating process.env
let testModeOverride: EngineMode | null = null;

/**
 * Returns current Resource Engine configuration based on environment variables.
 * Safe fallback: Defaults strictly to 'v1' if unset or invalid.
 */
export function getEngineConfig(): EngineConfig {
  let activeMode: EngineMode = 'v1';

  if (testModeOverride !== null) {
    activeMode = testModeOverride;
  } else {
    const envVersion = (process.env.RESOURCE_ENGINE_VERSION || '').trim().toLowerCase();
    const parsed = EngineModeSchema.safeParse(envVersion);
    if (parsed.success) {
      activeMode = parsed.data;
    } else {
      activeMode = 'v1';
    }
  }

  const shadowTimeoutMs = Number.parseInt(process.env.RESOURCE_ENGINE_SHADOW_TIMEOUT_MS || '', 10);
  const v2TimeoutMs = Number.parseInt(process.env.RESOURCE_ENGINE_TIMEOUT_MS || '', 10);
  const concurrencyLimit = Number.parseInt(process.env.RESOURCE_ENGINE_CONCURRENCY || '', 10);

  return {
    mode: activeMode,
    shadowTimeoutMs: Number.isFinite(shadowTimeoutMs) && shadowTimeoutMs > 0 ? shadowTimeoutMs : 15000,
    v2TimeoutMs: Number.isFinite(v2TimeoutMs) && v2TimeoutMs > 0 ? v2TimeoutMs : 45000,
    concurrencyLimit: Number.isFinite(concurrencyLimit) && concurrencyLimit > 0 ? concurrencyLimit : 4,
    allowShadowDatabaseWrites: false, // Invariant: shadow mode NEVER writes to persistence
    enableMetricsLogging: process.env.NODE_ENV !== 'test' || process.env.ENABLE_RESOURCE_METRICS === 'true',
    defaultMinRelevanceThreshold: 50,
  };
}

/**
 * Helper to determine if V2 is active as the primary engine.
 */
export function isV2Active(): boolean {
  return getEngineConfig().mode === 'v2';
}

/**
 * Helper to determine if shadow testing is currently active.
 */
export function isShadowMode(): boolean {
  return getEngineConfig().mode === 'shadow';
}

/**
 * Helper to determine if V1 is the active primary engine.
 */
export function isV1Active(): boolean {
  return getEngineConfig().mode === 'v1';
}

/**
 * Test utility to temporarily override engine mode in unit tests.
 * Pass null to restore default environment behavior.
 */
export function setEngineModeOverride(mode: EngineMode | null): void {
  testModeOverride = mode;
}
