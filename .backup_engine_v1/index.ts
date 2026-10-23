/**
 * PENCILL RESOURCE ENGINE
 * Native, modular, production-ready educational discovery & ranking engine.
 * Replaces external n8n workflows with typed Next.js/TypeScript architecture.
 */

import { DiscoveryEngine } from './core/discovery-engine';
import { SearchOptions, DiscoveryResult, EngineResource } from './types';

export * from './types';
export * from './config/engine-config';
export * from './utils/url-utils';
export * from './utils/text-utils';
export * from './utils/scoring-utils';
export * from './providers';
export * from './core/query-analyzer';
export * from './core/search-planner';
export * from './core/normalization-engine';
export * from './core/validation-engine';
export * from './core/evaluation-engine';
export * from './core/deduplication-engine';
export * from './core/quality-scoring';
export * from './core/sequence-generator';
export * from './core/ranking-engine';
export * from './core/duration-manager';
export * from './core/discovery-engine';
export * from './core/module-distributor';
export * from './educators';

// Singleton instance for server-side resource discovery across Pencill
export const resourceEngine = new DiscoveryEngine();

/**
 * Primary high-level function for discovering verified resources across all 12 categories
 */
export async function discoverResources(
  query: string,
  options?: SearchOptions
): Promise<DiscoveryResult> {
  return resourceEngine.discover(query, options);
}

/**
 * High-level function for targeted lesson-level notes, lecture handouts, and official docs discovery
 */
export async function discoverLessonNotes(
  lessonTitle: string,
  topic: string,
  options?: {
    domain?: string;
    examContext?: string;
    limit?: number;
    minQualityScore?: number;
    timeoutMs?: number;
  }
): Promise<EngineResource[]> {
  return resourceEngine.discoverNotesForLesson(lessonTitle, topic, options);
}

/**
 * High-level function for targeted module-level resources (videos, reading materials, practice)
 */
export async function discoverModuleResources(
  moduleContext: {
    title: string;
    objective: string;
    description?: string;
    subtopics?: string[];
    keySubtopics?: string[];
    moduleNumber: number;
    totalModules?: number;
    courseTopic: string;
    domain?: string;
    level?: string;
    lessons?: Array<{ title: string; type: string; keyConcepts?: string[] }>;
  },
  options?: {
    excludeUrls?: Set<string>;
    excludeVideoIds?: Set<string>;
    minQualityScore?: number;
    timeoutMs?: number;
  }
): Promise<{
  videos: EngineResource[];
  readingNotes: EngineResource[];
  practiceSets: EngineResource[];
}> {
  return resourceEngine.discoverModuleResources(moduleContext, options);
}

/**
 * High-level function for targeted practice questions, problem sets, and PYQ discovery
 */
export async function discoverPractice(
  topic: string,
  options?: {
    examContext?: string;
    difficulty?: string;
    limit?: number;
    minQualityScore?: number;
    timeoutMs?: number;
  }
): Promise<EngineResource[]> {
  return resourceEngine.discoverPractice(topic, options);
}




