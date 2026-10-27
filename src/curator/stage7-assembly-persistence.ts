/**
 * Stage 7: Assembly & Registry Persistence
 * 
 * Assembles the verified LearningPath entity, persists it to StorageAdapter and in-memory cache,
 * and fires completion notifications.
 */

import { BuilderConfig } from '@/lib/types/builderConfig';
import { storageAdapter } from '@/lib/storage/storageAdapter';
import { inMemoryPathCache } from '@/services/supabase/pathService';
import { CuratorModule, SynthesizedPathResult } from './types';
import { AuditResult } from './stage5-quality-audit';

export async function runStage7AssemblyAndPersistence(
  config: BuilderConfig,
  modules: CuratorModule[],
  audit: AuditResult
): Promise<SynthesizedPathResult> {
  const primaryTopic = config.selectedTopics[0]?.label || config.subjectId;
  const pathId = `path-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const totalResources = modules.reduce((sum, m) => sum + m.resources.length, 0);
  const totalMinutes = modules.reduce((sum, m) => sum + m.estimatedMinutes, 0);
  const totalHours = Math.round(totalMinutes / 60);

  // Honest identification of coverage gaps
  const coverageGaps: string[] = [];
  if (config.language !== 'en' && totalResources === 0) {
    coverageGaps.push(`0 verified resources found in language "${config.language}". Fall back to English available.`);
  }
  for (const m of modules) {
    if (m.resources.length === 0) {
      coverageGaps.push(`Module "${m.title}" has no verified resources meeting the active filter threshold.`);
    }
  }

  // Enrich modules with standard lessons structure for universal viewer compatibility
  const standardModules = modules.map((m, mIdx) => ({
    ...m,
    id: m.id,
    pathId,
    title: m.title,
    moduleNumber: mIdx + 1,
    orderIndex: mIdx,
    status: mIdx === 0 ? ('in_progress' as const) : ('locked' as const),
    totalResources: m.resources.length,
    completedResources: 0,
    objective: m.objectives?.join('; ') || m.description,
    lessons: m.resources.map((r, rIdx) => ({
      id: r.id,
      moduleId: m.id,
      title: r.title,
      type: r.modality === 'video' ? 'video' : r.modality === 'practice' ? 'practice' : 'reading',
      durationMinutes: (r as any).durationMinutes || (r.modality === 'video' ? 30 : 20),
      sourceName: r.source || 'Verified Educational Provider',
      sourceUrl: r.url,
      orderIndex: rIdx,
      isCompleted: false,
      verificationStatus: r.status === 'verified' ? 'verified' : 'provisional',
      qualityScore: r.qualityScore,
      qualityEvidence: {
        hasCaptions: r.hasCaptions,
        hasTranscript: r.hasTranscript,
      },
    })),
  }));

  const result: SynthesizedPathResult = {
    id: pathId,
    title: `${primaryTopic}: Structured Mastery Track`,
    configSnapshot: config,
    domainId: config.domainId,
    subjectId: config.subjectId,
    modules: standardModules,
    totalResources,
    totalHours,
    auditReport: {
      totalEvaluated: audit.totalEvaluated,
      passedAudit: audit.passedCount,
      droppedLowQuality: audit.droppedLowQuality,
      accessibilityViolations: audit.accessibilityViolations,
      averageQualityScore: audit.averageScore,
      completenessRatio: modules.length > 0 ? (modules.filter((m) => m.resources.length > 0).length / modules.length) : 0,
    },
    coverageGaps,
    createdAt: new Date().toISOString(),
  };

  const fullPathPayload: any = {
    ...result,
    description: `${modules.length} modules · ${totalHours} hours · Curated from ${config.advanced.repositories.join(', ')}`,
    domain: config.domainId,
    level: config.depthLevelId,
    durationHours: totalHours,
    moduleCount: modules.length,
    verified: true,
    modules: standardModules,
    depthLevel: config.depthLevelId,
    subject: config.subjectId,
  };

  // 1. Persist to storageAdapter
  await storageAdapter.savePath(fullPathPayload);

  // 2. Register in inMemoryPathCache for instant retrieval by getLearningPathById
  inMemoryPathCache.set(pathId, fullPathPayload);

  // 3. Register in local browser storage when in client environment
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`pencill_path_${pathId}`, JSON.stringify(fullPathPayload));
    } catch {}
  }

  // Record initial progress entry
  await storageAdapter.updateProgress(pathId, {
    completedLessonIds: [],
    hoursLogged: 0,
    quizScores: {},
    flashcardState: {},
  });

  // Fire notification
  await storageAdapter.addNotification({
    type: 'path_built',
    title: 'Curriculum Pathway Synthesized',
    message: `Generated "${result.title}" with ${modules.length} modules (${totalHours}h).`,
    link: `/courses/${pathId}`,
    read: false,
  });

  return result;
}
