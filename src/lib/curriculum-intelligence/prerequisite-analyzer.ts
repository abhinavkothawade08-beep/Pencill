import { CurriculumModulePlan } from './types';
import { CurriculumValidationIssue } from './types';

export interface PrerequisiteAnalysisResult {
  readonly hasCycle: boolean;
  readonly cyclePath?: readonly string[];
  readonly topologicallySortedModules: readonly CurriculumModulePlan[];
  readonly issues: readonly CurriculumValidationIssue[];
}

/**
 * Prerequisite DAG & Topological Ordering Analyzer
 * Detects circular dependencies, validates progression, and guarantees prerequisite acyclicity.
 */
export function analyzePrerequisites(
  modules: readonly CurriculumModulePlan[]
): PrerequisiteAnalysisResult {
  const issues: CurriculumValidationIssue[] = [];

  if (!modules || modules.length === 0) {
    return {
      hasCycle: false,
      topologicallySortedModules: [],
      issues: [],
    };
  }

  // Map module titles and IDs for dependency resolution
  const titleToIndex = new Map<string, number>();
  const idToIndex = new Map<string, number>();

  modules.forEach((mod, idx) => {
    titleToIndex.set(mod.title.toLowerCase().trim(), idx);
    idToIndex.set(mod.id.toLowerCase().trim(), idx);
  });

  // Build Adjacency List: dependency -> dependent (or module -> prerequisites)
  // We track edges: u must come before v
  const adj = new Map<number, Set<number>>();
  const inDegree = new Array(modules.length).fill(0);

  for (let i = 0; i < modules.length; i++) {
    adj.set(i, new Set<number>());
  }

  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i];
    for (const prereq of mod.prerequisites) {
      const prereqLower = prereq.toLowerCase().trim();
      let prereqIdx = titleToIndex.get(prereqLower);
      if (prereqIdx === undefined) {
        prereqIdx = idToIndex.get(prereqLower);
      }

      // Check if prereq matches any earlier module title partially
      if (prereqIdx === undefined) {
        for (const [title, idx] of titleToIndex.entries()) {
          if (title.includes(prereqLower) || prereqLower.includes(title)) {
            prereqIdx = idx;
            break;
          }
        }
      }

      if (prereqIdx !== undefined) {
        if (prereqIdx === i) {
          // Self dependency
          issues.push({
            code: 'CIRCULAR_PREREQUISITE',
            severity: 'error',
            message: `Module "${mod.title}" lists itself as a prerequisite.`,
            moduleIndex: i,
            remediation: 'Remove self-referential prerequisite.',
          });
        } else if (prereqIdx > i) {
          // Forward reference: module requires a module that appears later
          issues.push({
            code: 'OUT_OF_ORDER_PREREQUISITE',
            severity: 'warning',
            message: `Module "${mod.title}" (index ${i}) requires later module "${modules[prereqIdx].title}" (index ${prereqIdx}).`,
            moduleIndex: i,
            remediation: 'Reorder modules so foundational prerequisite appears first.',
          });
          if (!adj.get(prereqIdx)!.has(i)) {
            adj.get(prereqIdx)!.add(i);
            inDegree[i]++;
          }
        } else {
          if (!adj.get(prereqIdx)!.has(i)) {
            adj.get(prereqIdx)!.add(i);
            inDegree[i]++;
          }
        }
      }
    }
  }

  // Detect cycle using Kahn's algorithm (topological sort)
  const queue: number[] = [];
  for (let i = 0; i < modules.length; i++) {
    if (inDegree[i] === 0) {
      queue.push(i);
    }
  }

  const sortedIndices: number[] = [];
  while (queue.length > 0) {
    const u = queue.shift()!;
    sortedIndices.push(u);

    for (const v of adj.get(u)!) {
      inDegree[v]--;
      if (inDegree[v] === 0) {
        queue.push(v);
      }
    }
  }

  const hasCycle = sortedIndices.length !== modules.length;

  if (hasCycle) {
    issues.push({
      code: 'CIRCULAR_PREREQUISITE',
      severity: 'error',
      message: 'Circular prerequisite dependency detected among curriculum modules.',
      remediation: 'Eliminate reciprocal prerequisite constraints to form a Directed Acyclic Graph.',
    });

    return {
      hasCycle: true,
      cyclePath: ['Circular dependency cycle detected'],
      topologicallySortedModules: [...modules],
      issues,
    };
  }

  // Rebuild modules according to topological sort if reordering is needed
  const isAlreadySorted = sortedIndices.every((idx, pos) => idx === pos);
  const topologicallySortedModules = isAlreadySorted
    ? [...modules]
    : sortedIndices.map((idx, newOrder) => ({
        ...modules[idx],
        orderIndex: newOrder,
      }));

  return {
    hasCycle: false,
    topologicallySortedModules,
    issues,
  };
}
