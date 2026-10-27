/**
 * Stage 2: Prerequisite Hierarchy Mapping
 * 
 * Performs topological sorting of concepts and dependencies, pruned by learner knowledge level.
 */

import { BuilderConfig } from '@/lib/types/builderConfig';
import { DeconstructionResult } from './stage1-domain-deconstruction';

export interface PrerequisiteMappingResult {
  orderedSequence: string[];
  prunedPrerequisites: string[];
  retainedPrerequisites: string[];
  summary: string;
}

export async function runStage2PrerequisiteMapping(
  config: BuilderConfig,
  deconstruction: DeconstructionResult
): Promise<PrerequisiteMappingResult> {
  const currentKnowledge = config.advanced.currentLevel; // 'complete-beginner' | 'some-basics' | 'intermediate' | 'advanced'

  const rawPrereqs = deconstruction.prerequisiteDependencies;
  const subtopics = deconstruction.identifiedSubtopics;

  const retainedPrereqs: string[] = [];
  const prunedPrereqs: string[] = [];

  // Pruning logic based on learner knowledge
  for (const prereq of rawPrereqs) {
    const pLower = prereq.toLowerCase();
    const isBasic =
      pLower.includes('basic') ||
      pLower.includes('foundational') ||
      pLower.includes('intro') ||
      pLower.includes('algebra') ||
      pLower.includes('primer');

    if ((currentKnowledge === 'intermediate' || currentKnowledge === 'advanced') && isBasic) {
      prunedPrereqs.push(prereq);
    } else {
      retainedPrereqs.push(prereq);
    }
  }

  // Topological sorting: prerequisites first, then foundational subtopics, then core topics, then applied topics
  const foundations: string[] = [];
  const core: string[] = [];
  const applied: string[] = [];

  for (const st of subtopics) {
    const sLower = st.toLowerCase();
    if (sLower.includes('intro') || sLower.includes('unit') || sLower.includes('vector') || sLower.includes('dimension')) {
      foundations.push(st);
    } else if (sLower.includes('advanced') || sLower.includes('rotational') || sLower.includes('synthesis') || sLower.includes('exam')) {
      applied.push(st);
    } else {
      core.push(st);
    }
  }

  // Deduplicated ordered sequence
  const orderedSequence = Array.from(new Set([
    ...retainedPrereqs,
    ...foundations,
    ...core,
    ...applied,
  ]));

  const summary = `Mapped ${orderedSequence.length} ordered topics; pruned ${prunedPrereqs.length} basic prerequisites for ${currentKnowledge} learner.`;

  return {
    orderedSequence,
    prunedPrerequisites: prunedPrereqs,
    retainedPrerequisites: retainedPrereqs,
    summary,
  };
}
