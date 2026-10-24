import { z } from 'zod';
import { LegacyRankingWeights as RankingWeights, DiversityConfig, DurationPreferenceMap } from './types/legacy-contracts';

export const DEFAULT_DURATION_PREFERENCES: DurationPreferenceMap = {
  concept_quick: {
    minMinutes: 3,
    targetMinMinutes: 5,
    targetMaxMinutes: 15,
    maxMinutes: 25,
  },
  concept_detailed: {
    minMinutes: 10,
    targetMinMinutes: 15,
    targetMaxMinutes: 30,
    maxMinutes: 50,
  },
  hands_on_tutorial: {
    minMinutes: 15,
    targetMinMinutes: 20,
    targetMaxMinutes: 60,
    maxMinutes: 90,
  },
  practical_project: {
    minMinutes: 20,
    targetMinMinutes: 30,
    targetMaxMinutes: 120,
    maxMinutes: 240,
  },
  comprehensive_course: {
    minMinutes: 45,
    targetMinMinutes: 60,
    targetMaxMinutes: 240,
    maxMinutes: 600,
  },
};

export interface ResourceEngineConfig {
  rankingWeights: RankingWeights;
  diversity: DiversityConfig;
  durationPreferences: DurationPreferenceMap;
  defaultLimit: number;
  googleWebResultsLimit: number;
  youTubeResultsLimit: number;
  providerTimeoutMs: number;
  discoveryTimeoutMs: number;
  aiEvaluationBatchSize: number;
  authorityDomains: Record<string, number>;
  authorityChannels: Record<string, number>;
}

export const DEFAULT_ENGINE_CONFIG: ResourceEngineConfig = {
  rankingWeights: {
    relevance: 0.40,
    educationalValue: 0.25,
    structureCompleteness: 0.15,
    freshness: 0.10,
    sourceAuthority: 0.10,
  },
  diversity: {
    slots: [
      { type: 'video_lecture', min: 2, max: 4 },
      { type: 'youtube_playlist', min: 1, max: 2 },
      { type: 'full_course', min: 0, max: 2 },
      { type: 'reading_material', min: 1, max: 3 },
      { type: 'article', min: 0, max: 2 },
      { type: 'educational_web_page', min: 0, max: 2 },
      { type: 'pdf_lecture_notes', min: 0, max: 2 },
      { type: 'practice_questions', min: 1, max: 3 },
      { type: 'pyq', min: 1, max: 3 },
      { type: 'question_bank', min: 0, max: 2 },
      { type: 'mock_test', min: 0, max: 2 },
      { type: 'ai_quiz', min: 1, max: 2 },
    ],
    maxPerDomainOrChannel: 3,
  },
  durationPreferences: DEFAULT_DURATION_PREFERENCES,
  defaultLimit: 12,
  googleWebResultsLimit: parseInt(process.env.GOOGLE_SEARCH_RESULTS_LIMIT || '6', 10),
  youTubeResultsLimit: parseInt(process.env.YOUTUBE_RESULTS_LIMIT || '8', 10),
  providerTimeoutMs: 25000,
  discoveryTimeoutMs: 35000,
  aiEvaluationBatchSize: 6,
  authorityDomains: {
    'khanacademy.org': 95,
    'ocw.mit.edu': 98,
    'stanford.edu': 98,
    'harvard.edu': 98,
    'coursera.org': 85,
    'edx.org': 85,
    'nptel.ac.in': 92,
    'geeksforgeeks.org': 80,
    'w3schools.com': 75,
    'developer.mozilla.org': 95,
    'docs.python.org': 95,
    'wikipedia.org': 70,
  },
  authorityChannels: {
    '3Blue1Brown': 98,
    'freeCodeCamp.org': 92,
    'MIT OpenCourseWare': 98,
    'Stanford': 98,
    'Harvard CS50': 96,
    'Traversy Media': 85,
    'Fireship': 88,
    'CrashCourse': 88,
    'StatQuest with Josh Starmer': 94,
    'Two Minute Papers': 85,
    'Corey Schafer': 92,
    'Physics Wallah': 85,
    'Unacademy JEE': 85,
  },
};

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
