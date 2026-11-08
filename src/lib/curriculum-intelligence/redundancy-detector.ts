import { CurriculumModulePlan, CurriculumValidationIssue } from './types';

export interface RedundancyAnalysisResult {
  readonly hasRedundancy: boolean;
  readonly redundancyScore: number; // 0 (no redundancy) to 1 (extreme redundancy)
  readonly duplicateConcepts: readonly string[];
  readonly duplicateObjectives: readonly string[];
  readonly issues: readonly CurriculumValidationIssue[];
  readonly sanitizedModules: readonly CurriculumModulePlan[];
}

function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['and', 'the', 'for', 'with', 'from', 'that', 'this'].includes(w));
  return new Set(words);
}

function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Detects redundancy, overlapping learning objectives, duplicate concepts,
 * and redundant search queries across curriculum modules.
 */
export function detectCurriculumRedundancy(
  modules: readonly CurriculumModulePlan[]
): RedundancyAnalysisResult {
  const issues: CurriculumValidationIssue[] = [];
  const seenConcepts = new Map<string, number>(); // concept -> moduleIndex
  const duplicateConcepts: string[] = [];
  const duplicateObjectives: string[] = [];

  const sanitizedModules: CurriculumModulePlan[] = [];

  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i];
    const uniqueConceptsInModule: string[] = [];

    // Check concept duplication across modules
    for (const concept of mod.concepts) {
      const cNorm = concept.toLowerCase().trim();
      if (!cNorm) continue;

      if (seenConcepts.has(cNorm)) {
        const prevIdx = seenConcepts.get(cNorm)!;
        if (prevIdx !== i) {
          duplicateConcepts.push(concept);
          issues.push({
            code: 'DUPLICATE_CONCEPTS',
            severity: 'warning',
            message: `Concept "${concept}" appears in Module ${prevIdx + 1} and Module ${i + 1}.`,
            moduleIndex: i,
            remediation: 'Consolidate related concepts into a single coherent module.',
          });
        }
      } else {
        seenConcepts.set(cNorm, i);
        uniqueConceptsInModule.push(concept);
      }
    }

    // Check objective overlap within and across modules
    const uniqueObjectives = [...mod.learningObjectives];
    for (let j = 0; j < mod.learningObjectives.length; j++) {
      const objA = mod.learningObjectives[j];
      const tokensA = tokenize(objA.statement);

      // Check against previous modules
      for (let prev = 0; prev < i; prev++) {
        for (const objPrev of modules[prev].learningObjectives) {
          const tokensPrev = tokenize(objPrev.statement);
          const sim = calculateJaccardSimilarity(tokensA, tokensPrev);
          if (sim > 0.75) {
            duplicateObjectives.push(objA.statement);
            issues.push({
              code: 'REDUNDANT_OBJECTIVES',
              severity: 'warning',
              message: `Objective "${objA.statement}" overlaps heavily with Module ${prev + 1} ("${objPrev.statement}").`,
              moduleIndex: i,
              remediation: 'Refine objective to focus on distinct sub-skills or advance complexity.',
            });
          }
        }
      }
    }

    // Deduplicate search queries
    const uniqueVideoQueries = Array.from(new Set(mod.searchQueries.videoQueries.map((q) => q.trim())));
    const uniqueReadingQueries = Array.from(new Set(mod.searchQueries.readingQueries.map((q) => q.trim())));

    sanitizedModules.push({
      ...mod,
      concepts: uniqueConceptsInModule.length > 0 ? uniqueConceptsInModule : mod.concepts,
      searchQueries: {
        videoQueries: uniqueVideoQueries,
        readingQueries: uniqueReadingQueries,
      },
    });
  }

  const totalConcepts = modules.reduce((acc, m) => acc + m.concepts.length, 0);
  const redundancyScore =
    totalConcepts === 0
      ? 0
      : Math.min(1, (duplicateConcepts.length * 2 + duplicateObjectives.length) / Math.max(1, totalConcepts));

  return {
    hasRedundancy: duplicateConcepts.length > 0 || duplicateObjectives.length > 0,
    redundancyScore: Number(redundancyScore.toFixed(2)),
    duplicateConcepts: Array.from(new Set(duplicateConcepts)),
    duplicateObjectives: Array.from(new Set(duplicateObjectives)),
    issues,
    sanitizedModules,
  };
}
