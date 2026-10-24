export * from './types';
export * from './analysis';
export * from './planning';
export * from './resilience';
export * from './normalization';
export * from './providers';
export * from './evaluation';
export * from './chapters';
export * from './distribution';
export * from './persistence';
export * from './config';
export * from './orchestrator';
export * from './discovery-engine';
export * from './bridge';
export * from './evaluation-harness';
export * from './educators';
export * from './utils';

// Resolve re-export ambiguities
export { parseTimestampToSeconds } from './chapters';
export { stemWord } from './evaluation';
export { parseIsoDurationToMinutes } from './normalization';
export type { SequencedPlaylistResult, SequencedResourceItem } from './types';
export { isGoogleSearchAvailable, isYouTubeQuotaExhausted } from './bridge';
export { findVerifiedDirectoryResources } from './educators';
export { LegacySearchPlanner } from './planning/legacy-planner';
export { LegacyRankingEngine } from './evaluation/legacy-ranking';
export { LegacyQueryAnalyzer } from './analysis/legacy-analyzer';
export { LegacyNormalizationEngine } from './normalization/legacy-normalizer';
