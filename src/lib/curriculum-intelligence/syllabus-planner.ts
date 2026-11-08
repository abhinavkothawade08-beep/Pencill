import {
  LearnerGoalInput,
  LearnerGoalInputSchema,
  CurriculumPlan,
  ModulePlan,
  ModuleObjective,
  EducationalDomain,
  AcademicLevel,
} from '../resource-engine/types';
import {
  CurriculumProposal,
  CurriculumModulePlan,
  CurriculumGenerationOptions,
} from './types';
import { analyzeCurriculumObjective } from './objective-analyzer';
import { clusterConceptsSemantically } from './semantic-grouping';
import { generateCurriculumWithGemini } from './gemini-provider';
import {
  validateCurriculumProposal,
  autoRepairCurriculumProposal,
} from './curriculum-validator';
import { isGeminiConfigured } from './configuration';

/**
 * Builds deterministic fallback curriculum proposal using semantic clustering
 * when Gemini API is unconfigured or rate limited.
 */
export function buildDeterministicProposal(
  rawInput: Partial<LearnerGoalInput> & { topic: string }
): CurriculumProposal {
  const input = LearnerGoalInputSchema.parse(rawInput);
  const analysis = analyzeCurriculumObjective(input);
  const rawConcepts = input.topics && input.topics.length > 0
    ? input.topics
    : [input.topic];

  const clusters = clusterConceptsSemantically(
    rawConcepts,
    analysis.detectedDomain,
    input.topic
  );

  const hoursPerModule = Math.max(
    1,
    Math.round(analysis.recommendedTotalHours / Math.max(1, clusters.length))
  );

  const modules: CurriculumModulePlan[] = clusters.map((cluster, idx) => {
    const isFirst = idx === 0;
    const prereqs = isFirst
      ? analysis.prerequisites.slice(0, 1)
      : [clusters[idx - 1].suggestedTitle];

    const cleanConceptQuery = (concept: string) => {
      const norm = concept.toLowerCase();
      const topNorm = input.topic.toLowerCase();
      if (norm.startsWith(topNorm)) {
        return concept;
      }
      return `${input.topic} ${concept}`;
    };

    const videoQueries =
      cluster.searchQueries?.videoQueries && cluster.searchQueries.videoQueries.length > 0
        ? cluster.searchQueries.videoQueries
        : cluster.concepts.map((c) => `${cleanConceptQuery(c)} lecture tutorial`);
    const readingQueries =
      cluster.searchQueries?.readingQueries && cluster.searchQueries.readingQueries.length > 0
        ? cluster.searchQueries.readingQueries
        : cluster.concepts.map((c) => `${cleanConceptQuery(c)} documentation reference notes`);

    const learningObjectives = cluster.concepts.map((c, cIdx) => ({
      id: `lo-${idx + 1}-${cIdx + 1}`,
      statement: `Master core principles, architecture and problem solving for ${c}`,
      keyTerms: [c, input.topic],
      bloomLevel: idx === 0 ? ('understand' as const) : ('apply' as const),
    }));

    const expectedOutcomes = cluster.concepts.map(
      (c) => `Demonstrate conceptual understanding and practical implementation of ${c}`
    );

    return {
      id: `module-${idx + 1}`,
      orderIndex: idx,
      title: cluster.suggestedTitle,
      description: cluster.rationale,
      concepts: [...cluster.concepts],
      learningObjectives,
      prerequisites: prereqs,
      estimatedHours: hoursPerModule,
      searchQueries: {
        videoQueries: videoQueries.slice(0, 4),
        readingQueries: readingQueries.slice(0, 3),
      },
      expectedOutcomes,
      practicalExercises: cluster.concepts.map(
        (c) => `Hands-on guided exercise: solve practical problem involving ${c}`
      ),
    };
  });

  return {
    courseTitle: input.title?.trim() || `${input.topic}: Comprehensive Curriculum`,
    domain: analysis.detectedDomain,
    academicLevel: analysis.normalizedLevel,
    totalEstimatedHours: analysis.recommendedTotalHours,
    pedagogicalRationale: `Deterministic academic curriculum sequenced across ${modules.length} coherent modules adhering to ONE COHERENT LEARNING UNIT = ONE MODULE.`,
    modules,
  };
}

/**
 * Transforms CurriculumProposal into standard CurriculumPlan used by Pencill's Resource Engine.
 */
export function convertProposalToPlan(
  proposal: CurriculumProposal
): CurriculumPlan {
  const modules: ModulePlan[] = proposal.modules.map((m, idx) => {
    const learningObjectives: ModuleObjective[] = m.learningObjectives.map((lo) => ({
      id: lo.id,
      statement: lo.statement,
      bloomTaxonomyLevel:
        lo.bloomLevel === 'remember' ||
        lo.bloomLevel === 'understand' ||
        lo.bloomLevel === 'apply' ||
        lo.bloomLevel === 'analyze' ||
        lo.bloomLevel === 'evaluate'
          ? lo.bloomLevel
          : 'understand',
      keyTerms: lo.keyTerms,
    }));

    return {
      id: m.id || `module-${idx + 1}`,
      moduleNumber: idx + 1,
      title: m.title,
      description: m.description,
      learningObjectives,
      prerequisites: m.prerequisites,
      estimatedHours: m.estimatedHours,
      expectedOutcomes: m.expectedOutcomes,
      searchQueries: m.searchQueries,
    };
  });

  return {
    courseTitle: proposal.courseTitle,
    description: proposal.pedagogicalRationale,
    domain: proposal.domain as EducationalDomain,
    level: proposal.academicLevel as AcademicLevel,
    totalEstimatedHours: proposal.totalEstimatedHours,
    modules,
    pedagogicalRationale: proposal.pedagogicalRationale,
  };
}

/**
 * Intelligent Curriculum Planner Orchestrator
 * Integrates Gemini AI generation, pre-discovery validation, automated repair,
 * and deterministic fallbacks.
 */
export async function planIntelligentCurriculum(
  rawInput: Partial<LearnerGoalInput> & { topic: string },
  options: CurriculumGenerationOptions = {}
): Promise<CurriculumPlan> {
  const input = LearnerGoalInputSchema.parse(rawInput);
  const analysis = analyzeCurriculumObjective(input);
  let proposal: CurriculumProposal | null = null;

  // 1. Attempt Gemini Generation if configured and not explicitly forced to fallback
  if (!options.forceFallback && isGeminiConfigured()) {
    try {
      proposal = await generateCurriculumWithGemini(analysis, {
        priorKnowledge: input.priorKnowledge,
        targetExam: input.targetExam || undefined,
        language: input.language,
        customObjectives: input.learningObjectives?.map((lo) => lo.text),
      });
    } catch (err) {
      console.warn(
        `[CurriculumPlanner] Gemini synthesis failed or rate-limited: ${(err as Error).message}. Activating intelligent fallback planner.`
      );
    }
  }

  // 2. Deterministic Fallback if Gemini did not produce a proposal
  if (!proposal) {
    proposal = buildDeterministicProposal(input);
  }

  // 3. Pre-Discovery Validation Gate
  const validationResult = validateCurriculumProposal(proposal, {
    complexity: analysis.complexity,
    expectedModuleCount: analysis.recommendedModuleCount,
    strictMode: options.strictValidation,
  });

  // 4. Automated Repair if over-fragmented or redundant
  const targetModuleCap = Math.max(
    analysis.complexity === 'narrow_focused' ? 1 : 2,
    analysis.recommendedModuleCount
  );
  if (!validationResult.isValid || proposal.modules.length > targetModuleCap) {
    proposal = autoRepairCurriculumProposal(
      proposal,
      proposal.modules.length > targetModuleCap ? targetModuleCap : proposal.modules.length
    );
  }

  // 5. Apply User Blueprint Overrides and Custom Titles
  if (input.title && input.title.trim().length > 0) {
    proposal.courseTitle = input.title.trim();
  }

  if (input.curriculumBlueprintOverrides && input.curriculumBlueprintOverrides.length > 0) {
    for (const override of input.curriculumBlueprintOverrides) {
      if (override.moduleIndex >= 0 && override.moduleIndex < proposal.modules.length) {
        if (override.title) {
          proposal.modules[override.moduleIndex].title = override.title;
        }
        if (override.customObjectives && override.customObjectives.length > 0) {
          proposal.modules[override.moduleIndex].expectedOutcomes = override.customObjectives;
        }
      }
    }
  }

  // Apply user-specified custom objectives
  if (input.learningObjectives && input.learningObjectives.length > 0) {
    input.learningObjectives.forEach((lo, idx) => {
      const targetModule = proposal!.modules[idx % proposal!.modules.length];
      if (targetModule) {
        targetModule.learningObjectives.push({
          id: `custom-lo-${idx + 1}`,
          statement: lo.text,
          keyTerms: lo.text.toLowerCase().split(/\s+/).filter((w) => w.length > 4),
          bloomLevel: 'apply',
        });
        if (lo.successCriteria) {
          targetModule.expectedOutcomes.push(lo.successCriteria);
        }
      }
    });
  }

  return convertProposalToPlan(proposal);
}
