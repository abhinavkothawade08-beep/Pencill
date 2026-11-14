import {
  CurriculumProposal,
  CurriculumValidationResult,
  CurriculumValidationIssue,
  TopicComplexity,
} from './types';
import { analyzePrerequisites } from './prerequisite-analyzer';
import { detectCurriculumRedundancy } from './redundancy-detector';
import { evaluateTopicConsistency } from './topic-consistency-validator';

export interface CurriculumValidationGateOptions {
  readonly complexity: TopicComplexity;
  readonly expectedModuleCount: number;
  readonly strictMode?: boolean;
}

/**
 * Pre-Discovery Curriculum Validation Gate
 * Evaluates curriculum structure, fragmentation, DAG acyclicity, and concept redundancy
 * before resource discovery begins.
 */
export function validateCurriculumProposal(
  proposal: CurriculumProposal,
  options: CurriculumValidationGateOptions
): CurriculumValidationResult {
  const issues: CurriculumValidationIssue[] = [];
  const moduleCount = proposal.modules.length;

  // 1. Module Fragmentation Checks
  if (options.complexity === 'narrow_focused' && moduleCount > 2) {
    issues.push({
      code: 'OVER_FRAGMENTED_MODULES',
      severity: 'error',
      message: `Topic is a narrow-focused single concept but generated ${moduleCount} modules (maximum allowed is 2).`,
      remediation: 'Consolidate subtopics into 1-2 cohesive modules.',
    });
  } else if (options.complexity === 'comprehensive' && moduleCount < 4) {
    issues.push({
      code: 'UNDER_FRAGMENTED_MODULES',
      severity: 'warning',
      message: `Comprehensive academic discipline generated only ${moduleCount} modules (recommended minimum is 4).`,
      remediation: 'Expand curriculum into full academic syllabus modules.',
    });
  }

  // 2. Individual Module Sanity & Topic Consistency Checks
  proposal.modules.forEach((mod, idx) => {
    // Topic Consistency Check
    const evalRes = evaluateTopicConsistency(mod.title, proposal.courseTitle);
    if (!evalRes.isConsistent) {
      issues.push({
        code: 'TOPIC_CONSISTENCY_COLLISION',
        severity: 'error',
        message: `Module ${idx + 1} ("${mod.title}") is irrelevant or collides with course topic "${proposal.courseTitle}".`,
        moduleIndex: idx,
        remediation: 'Regenerate module with strictly topic-consistent curriculum.',
      });
    }

    if (!mod.concepts || mod.concepts.length === 0) {
      issues.push({
        code: 'EMPTY_MODULE_CONCEPTS',
        severity: 'error',
        message: `Module ${idx + 1} ("${mod.title}") contains no concepts.`,
        moduleIndex: idx,
        remediation: 'Assign at least one specific academic concept to this module.',
      });
    }

    if (!mod.searchQueries.videoQueries || mod.searchQueries.videoQueries.length === 0) {
      issues.push({
        code: 'INSUFFICIENT_SEARCH_QUERIES',
        severity: 'warning',
        message: `Module ${idx + 1} has empty video search queries.`,
        moduleIndex: idx,
      });
    }

    if (mod.estimatedHours <= 0) {
      issues.push({
        code: 'UNREALISTIC_PACING',
        severity: 'error',
        message: `Module ${idx + 1} has non-positive estimated hours (${mod.estimatedHours}).`,
        moduleIndex: idx,
      });
    }
  });

  // 3. Prerequisite DAG Validation
  const prereqResult = analyzePrerequisites(proposal.modules);
  issues.push(...prereqResult.issues);

  // 4. Redundancy & Duplication Check
  const redundancyResult = detectCurriculumRedundancy(proposal.modules);
  issues.push(...redundancyResult.issues);

  // 5. Score Calculation
  let score = 100;
  for (const issue of issues) {
    if (issue.severity === 'error') {
      score -= 25;
    } else if (issue.severity === 'warning') {
      score -= 10;
    } else {
      score -= 2;
    }
  }
  score = Math.max(0, Math.min(100, score));

  const hasErrors = issues.some((i) => i.severity === 'error');
  const isValid = !hasErrors && score >= 70;

  const suggestedCorrections = issues.map((i) => i.remediation || i.message);

  return {
    isValid,
    score,
    moduleCount,
    issues,
    suggestedCorrections,
  };
}

/**
 * Automatically repairs and consolidates a curriculum proposal that suffered
 * from over-fragmentation or duplicate concepts.
 */
export function autoRepairCurriculumProposal(
  proposal: CurriculumProposal,
  targetModuleCount: number
): CurriculumProposal {
  if (proposal.modules.length <= targetModuleCount) {
    // If not over-fragmented, just prune redundancy and sort prerequisites
    const prereq = analyzePrerequisites(proposal.modules);
    const red = detectCurriculumRedundancy(prereq.topologicallySortedModules);

    return {
      ...proposal,
      modules: [...red.sanitizedModules],
    };
  }

  // Consolidate modules adjacent to each other pair-by-pair until reaching targetModuleCount
  let currentModules = [...proposal.modules];
  while (currentModules.length > targetModuleCount) {
    let bestIdx = 0;
    let minCombinedHours = Infinity;
    for (let i = 0; i < currentModules.length - 1; i++) {
      const combined = currentModules[i].estimatedHours + currentModules[i + 1].estimatedHours;
      if (combined < minCombinedHours) {
        minCombinedHours = combined;
        bestIdx = i;
      }
    }
    const a = currentModules[bestIdx];
    const b = currentModules[bestIdx + 1];

    // Compute intelligent non-repetitive merged title
    let mergedTitle = `${a.title} & ${b.title}`;
    const aParts = a.title.split(':').map((s) => s.trim());
    const bParts = b.title.split(':').map((s) => s.trim());
    if (aParts.length > 1 && bParts.length > 1 && aParts[0].toLowerCase() === bParts[0].toLowerCase()) {
      mergedTitle = `${aParts[0]}: ${aParts[1]} & ${bParts[1]}`;
    } else {
      const cleanA = aParts[0];
      const cleanB = bParts[0];
      if (cleanA.toLowerCase() === cleanB.toLowerCase()) {
        mergedTitle = a.title.length > b.title.length ? a.title : b.title;
      } else {
        mergedTitle = `${cleanA} & ${cleanB}`;
      }
    }

    const merged = {
      id: a.id,
      orderIndex: bestIdx,
      title: mergedTitle,
      description: `${a.description} ${b.description}`,
      concepts: Array.from(new Set([...a.concepts, ...b.concepts])),
      learningObjectives: [...a.learningObjectives, ...b.learningObjectives],
      prerequisites: a.prerequisites,
      estimatedHours: a.estimatedHours + b.estimatedHours,
      searchQueries: {
        videoQueries: Array.from(new Set([...a.searchQueries.videoQueries, ...b.searchQueries.videoQueries])),
        readingQueries: Array.from(new Set([...a.searchQueries.readingQueries, ...b.searchQueries.readingQueries])),
      },
      expectedOutcomes: Array.from(new Set([...a.expectedOutcomes, ...b.expectedOutcomes])),
      practicalExercises: Array.from(new Set([...(a.practicalExercises || []), ...(b.practicalExercises || [])])),
    };
    currentModules.splice(bestIdx, 2, merged);
    currentModules = currentModules.map((m, idx) => ({ ...m, orderIndex: idx }));
  }

  const prereq = analyzePrerequisites(currentModules);
  const red = detectCurriculumRedundancy(prereq.topologicallySortedModules);

  return {
    ...proposal,
    modules: [...red.sanitizedModules],
  };
}
