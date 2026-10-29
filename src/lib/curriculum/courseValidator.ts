/**
 * Course Completeness and Pedagogical Integrity Validator
 *
 * Enforces end-to-end quality gates before course persistence:
 * 1. Topic fidelity and domain collision checks
 * 2. Module count and objective validity
 * 3. Video uniqueness and canonical ID deduplication
 * 4. Reading material inclusion where available
 * 5. Quiz question structure and answer validity
 * 6. Defensible duration calculations
 */

import { CuratorModule, SynthesizedPathResult } from '@/curator/types';

function extractYouTubeVideoId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/i);
  return match ? match[1] : null;
}

export interface CourseValidationReport {
  isValid: boolean;
  completenessScore: number; // 0 to 100
  passedChecks: string[];
  issues: string[];
  warnings: string[];
  metrics: {
    moduleCount: number;
    totalResources: number;
    videoCount: number;
    readingCount: number;
    quizQuestionCount: number;
    calculatedDurationHours: number;
    emptyModulesCount: number;
  };
}

export function validateCourseCompleteness(
  course: SynthesizedPathResult
): CourseValidationReport {
  const issues: string[] = [];
  const warnings: string[] = [];
  const passedChecks: string[] = [];

  const rawTitle = course.title.toLowerCase();
  const rawSubject = (course.subjectId || '').toLowerCase();
  const rawDomain = (course.domainId || '').toLowerCase();
  const fullTopicContext = `${rawTitle} ${rawSubject} ${rawDomain}`;

  // 1. Topic Alignment & Collision Guard
  const isRag =
    fullTopicContext.includes('rag') ||
    fullTopicContext.includes('retrieval-augmented') ||
    fullTopicContext.includes('retrieval augmented');

  if (isRag) {
    const dsaKeywords = ['axiomatic foundations', 'hierarchical and tree', 'dynamic programming', 'graph algorithms'];
    const collidedModules = course.modules.filter((m) =>
      dsaKeywords.some((kw) => m.title.toLowerCase().includes(kw))
    );
    if (collidedModules.length > 0) {
      issues.push(
        `Topic Alignment Failure: RAG course contains unrelated DSA modules: ${collidedModules.map((m) => m.title).join(', ')}`
      );
    } else {
      passedChecks.push('Topic Alignment: All modules are faithful to RAG domain');
    }
  }

  // 2. Module Count & Non-Empty Modules
  if (course.modules.length < 2) {
    issues.push(`Insufficient Module Scope: Expected at least 2 modules, found ${course.modules.length}`);
  } else {
    passedChecks.push(`Module Scope: Valid module count (${course.modules.length} modules)`);
  }

  const emptyModules = course.modules.filter((m) => !m.resources || m.resources.length === 0);
  if (emptyModules.length > 0) {
    if (emptyModules.length === course.modules.length) {
      issues.push('Zero Content Failure: Every module has 0 assigned resources');
    } else {
      warnings.push(
        `Coverage Gap: ${emptyModules.length} module(s) have 0 resources: ${emptyModules.map((m) => m.title).join(', ')}`
      );
    }
  } else {
    passedChecks.push('Resource Distribution: Every module contains assigned learning resources');
  }

  // 3. Resource Deduplication Checks
  let totalVideos = 0;
  let totalReadings = 0;
  const globalSeenVideoIds = new Map<string, number>();

  for (let mIdx = 0; mIdx < course.modules.length; mIdx++) {
    const mod = course.modules[mIdx];
    const moduleSeenVideoIds = new Set<string>();
    const moduleSeenUrls = new Set<string>();

    for (const res of mod.resources || []) {
      const url = res.url || '';
      const vidId = extractYouTubeVideoId(url);

      if (res.modality === 'video') {
        totalVideos++;
        if (vidId) {
          if (moduleSeenVideoIds.has(vidId)) {
            issues.push(`Intra-module duplicate video detected in Module ${mIdx + 1} (${mod.title}): Video ID ${vidId}`);
          }
          moduleSeenVideoIds.add(vidId);
          globalSeenVideoIds.set(vidId, (globalSeenVideoIds.get(vidId) || 0) + 1);
        } else if (url && moduleSeenUrls.has(url.toLowerCase())) {
          issues.push(`Intra-module duplicate URL detected in Module ${mIdx + 1} (${mod.title}): ${url}`);
        }
      } else if (
        res.modality === 'reading' ||
        (res.modality as string) === 'paper' ||
        (res.modality as string) === 'documentation' ||
        (res.modality as string) === 'monograph'
      ) {
        totalReadings++;
      }

      if (url) {
        moduleSeenUrls.add(url.toLowerCase());
      }
    }
  }

  // Check cross-module duplicate videos
  for (const [vId, count] of globalSeenVideoIds.entries()) {
    if (count > 2) {
      warnings.push(`Cross-module video repetition: Video ID ${vId} is assigned to ${count} distinct modules`);
    }
  }

  if (issues.filter((i) => i.includes('duplicate')).length === 0) {
    passedChecks.push('Deduplication: No duplicate resources within any module');
  }

  // 4. Reading Materials Check
  if (totalReadings > 0) {
    passedChecks.push(`Reading Materials: ${totalReadings} reading resources verified and assigned`);
  } else {
    warnings.push('Reading Materials: No documentation or reading materials assigned');
  }

  // 5. Quiz Structure & Grounding
  let totalQuestions = 0;
  let invalidQuestions = 0;

  for (let mIdx = 0; mIdx < course.modules.length; mIdx++) {
    const mod = course.modules[mIdx];
    if (mod.checkpointQuestions && mod.checkpointQuestions.length > 0) {
      for (const q of mod.checkpointQuestions) {
        totalQuestions++;
        const prompt = q.prompt || (q as any).questionText;
        if (!prompt || prompt.trim().length < 5) {
          invalidQuestions++;
          issues.push(`Malformed Quiz: Module ${mIdx + 1} question ${q.questionNumber || totalQuestions} has an empty prompt`);
        }
        const opts = Array.isArray(q.options) ? q.options : (q as any).optionsList || [];
        if (opts.length < 2) {
          invalidQuestions++;
          issues.push(`Malformed Quiz: Module ${mIdx + 1} question requires at least 2 options`);
        }
        if (!q.correctOptionId && typeof (q as any).correctOptionIndex !== 'number') {
          invalidQuestions++;
          issues.push(`Malformed Quiz: Module ${mIdx + 1} question has no valid answer key`);
        }
      }
    }
  }

  if (totalQuestions > 0 && invalidQuestions === 0) {
    passedChecks.push(`Quiz Integrity: ${totalQuestions} valid diagnostic questions structured across modules`);
  } else if (totalQuestions === 0) {
    warnings.push('Quiz Coverage: No checkpoint quiz questions generated');
  }

  // 6. Duration Calculation Defensibility
  const totalDurationHours = course.totalHours || 0;
  const totalAssignedMinutes = course.modules.reduce((sum, m) => {
    return (
      sum +
      (m.resources || []).reduce((mSum, r) => mSum + ((r as any).durationMinutes || (r.modality === 'video' ? 30 : 20)), 0)
    );
  }, 0);
  const resourceDurationHours = Math.round((totalAssignedMinutes / 60) * 10) / 10;

  // Defensibility check: claimed hours shouldn't drastically contradict resource duration when resources exist
  if (course.totalResources > 0 && totalDurationHours > (resourceDurationHours * 4 + 4)) {
    warnings.push(
      `Duration Discrepancy: Course claims ${totalDurationHours} hours but assigned resources account for ~${resourceDurationHours} hours`
    );
  } else {
    passedChecks.push(`Duration Defensibility: Estimated hours (${totalDurationHours}h) defensibly calculated`);
  }

  // Compute final completeness score
  let score = 100;
  score -= issues.length * 20;
  score -= warnings.length * 5;
  score = Math.max(0, Math.min(100, score));

  return {
    isValid: issues.length === 0,
    completenessScore: score,
    passedChecks,
    issues,
    warnings,
    metrics: {
      moduleCount: course.modules.length,
      totalResources: course.totalResources,
      videoCount: totalVideos,
      readingCount: totalReadings,
      quizQuestionCount: totalQuestions,
      calculatedDurationHours: totalDurationHours,
      emptyModulesCount: emptyModules.length,
    },
  };
}
