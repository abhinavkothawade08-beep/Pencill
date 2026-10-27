import {
  AnalyzedObjective,
  NormalizedResourceCandidate,
  CognitiveIntent,
  ResourceCategory,
} from '../types';
import {
  DistributedResourceItem,
  DistributedModuleOutput,
  DistributionPlanOutput,
  DistributionOptions,
  AssignedResourceRole,
} from '../types/distribution';
import { ExplainableRankingEngine } from '../evaluation/ranking-engine';
import { extractChaptersFromDescription } from '../chapters/chapter-resolver';

export interface ModuleInputContext {
  moduleId: string;
  moduleNumber: number;
  moduleTitle: string;
  objective: AnalyzedObjective;
}

/**
 * Maps a candidate to a pedagogical role based on modality, textual markers, and cognitive intent.
 */
export function determineResourceRole(
  candidate: NormalizedResourceCandidate,
  intent: CognitiveIntent,
  category?: ResourceCategory
): AssignedResourceRole {
  // Modality-driven roles take priority for non-video formats
  if (candidate.modality === 'paper' || candidate.modality === 'monograph' || candidate.modality === 'documentation') {
    return 'supplementary_reading';
  }
  if (candidate.modality === 'practice' || candidate.modality === 'quiz') {
    return 'practice_exercise';
  }
  if (candidate.modality === 'project') {
    return 'practical_application';
  }

  // Category-driven roles (from evidence-based practical resource classifier)
  if (category === 'conceptual_explanation') {
    return 'primary_conceptual';
  }
  if (
    category === 'practical_tutorial' ||
    category === 'project_based' ||
    category === 'real_world_application' ||
    category === 'advanced_optimization'
  ) {
    return 'practical_application';
  }
  if (category === 'guided_exercise') {
    return 'worked_demonstration';
  }

  // Modality: video fallback heuristics
  const text = `${candidate.title} ${candidate.description || ''}`.toLowerCase();

  if (/\b(worked\s*examples?|practice\s*problems?|step\s*by\s*step\s*proof|problem\s*set|solutions?)\b/i.test(text)) {
    return 'worked_demonstration';
  }

  if (/\b(code\s*walkthrough|hands-?on|implementation|from\s*scratch|build|live\s*coding|github\.com)\b/i.test(text)) {
    return 'practical_application';
  }

  if (/\b(concept(ual)?|foundations?|theory|introduction|intro|overview|derivation|principles?)\b/i.test(text)) {
    return 'primary_conceptual';
  }

  if (intent === 'worked_examples') {
    return 'worked_demonstration';
  }
  if (intent === 'coding_walkthrough' || intent === 'project_implementation') {
    return 'practical_application';
  }
  if (intent === 'exam_practice') {
    return 'practice_exercise';
  }

  return 'primary_conceptual';
}

export class ResourceModuleDistributor {
  constructor(private rankingEngine = new ExplainableRankingEngine()) {}

  /**
   * Distributes ranked candidate resources to learning modules.
   * Enforces coverage-aware role complementarity, cross-module deduplication,
   * configurable limits, and honest empty states.
   */
  distribute(
    modules: ModuleInputContext[],
    candidatePool: NormalizedResourceCandidate[],
    options: Partial<DistributionOptions> = {}
  ): DistributionPlanOutput {
    const minResourcesPerModule = options.minResourcesPerModule ?? 1;
    const maxResourcesPerModule = options.maxResourcesPerModule ?? 4;
    const maxTotalResources = options.maxTotalResources ?? 15;
    const allowCrossModuleSharing = options.allowCrossModuleSharing ?? false;
    const minCrossModuleCoverageThreshold = options.minCrossModuleCoverageThreshold ?? 0.5;
    const minRelevanceThreshold = options.minRelevanceThreshold ?? 50;
    const durationPreference = options.durationPreference ?? 'balanced';

    const distributedModules: DistributedModuleOutput[] = [];
    const globallyAssignedUrlToModuleIds = new Map<string, Set<string>>();
    let totalAssignedAcrossCourse = 0;
    let sharedResourcesCount = 0;

    for (const mod of modules) {
      // 1. Rank the candidate pool specifically against this module's objective
      const rankResult = this.rankingEngine.rank(mod.objective, candidatePool, {
        minRelevanceThreshold,
        durationPreference,
        maxResults: candidatePool.length, // Evaluate all to enable distribution filtering
        requireModalityDiversity: true,
      });

      const eligibleCandidates = rankResult.rankedCandidates;

      // 2. Filter eligible candidates against cross-module assignment rules
      const assignableCandidates: typeof eligibleCandidates = [];

      for (const item of eligibleCandidates) {
        const canonicalUrl = item.candidate.canonicalUrl.toLowerCase();
        const existingAssignments = globallyAssignedUrlToModuleIds.get(canonicalUrl);

        if (!existingAssignments || existingAssignments.size === 0) {
          // Fresh, unassigned candidate
          assignableCandidates.push(item);
        } else if (allowCrossModuleSharing) {
          // Re-use is only allowed if candidate genuinely covers module's primary concepts
          if (item.coverage.coverageRatio >= minCrossModuleCoverageThreshold) {
            assignableCandidates.push(item);
          }
        }
        // If sharing is false or coverage is insufficient, candidate is excluded for this module
      }

      // 3. Honest Empty State Check
      if (assignableCandidates.length === 0) {
        distributedModules.push({
          moduleId: mod.moduleId,
          moduleNumber: mod.moduleNumber,
          moduleTitle: mod.moduleTitle,
          resources: [],
          coverageSummary: {
            satisfiedRatio: 0,
            coveredConcepts: [],
            uncoveredConcepts: [...mod.objective.primaryConcepts],
          },
          isEmptyState: true,
          emptyStateReason: `No candidate resources satisfied the minimum relevance threshold (${minRelevanceThreshold}/100) or coverage constraints for this module.`,
          totalDurationMinutes: 0,
        });
        continue;
      }

      // 4. Coverage-Aware & Pedagogically Balanced Role Selection
      const selectedForModule: DistributedResourceItem[] = [];
      const assignedRolesInModule = new Set<AssignedResourceRole>();
      const assignedCategoriesInModule = new Set<ResourceCategory>();
      const moduleSeenUrls = new Set<string>();
      const moduleSeenExternalIds = new Set<string>();

      const selectCandidate = (item: (typeof assignableCandidates)[0]) => {
        const urlKey = item.candidate.canonicalUrl.toLowerCase();
        const extKey = `${item.candidate.provider}:${item.candidate.externalId}`.toLowerCase();

        if (moduleSeenUrls.has(urlKey) || moduleSeenExternalIds.has(extKey)) {
          return false;
        }

        const role = determineResourceRole(
          item.candidate,
          mod.objective.cognitiveIntent,
          item.detectedCategory
        );

        const itemChapters = extractChaptersFromDescription(
          item.candidate.description,
          item.candidate.durationSeconds,
          item.candidate.canonicalUrl
        );

        const itemMatchedChapter = itemChapters.find((ch) =>
          mod.objective.primaryConcepts.some((c) =>
            ch.title.toLowerCase().includes(c.toLowerCase())
          )
        );

        const categoryLabel = item.detectedCategory
          ? item.detectedCategory.replace(/_/g, ' ')
          : role;

        const rawMeta = item.candidate.rawMetadata || {};
        const educatorId = (rawMeta.educatorId as string | undefined) || item.candidate.creator?.authorId;
        const educatorName = (rawMeta.educatorName as string | undefined) || (item.candidate.verificationStatus === 'verified_channel' ? item.candidate.creator?.name : undefined);
        const channelId = (rawMeta.channelId as string | undefined) || item.candidate.creator?.channelId;
        const discoverySource = (rawMeta.discoverySource as string | undefined) || item.candidate.retrievalProvenance.provider;
        const selectionExplanation = (rawMeta.selectionExplanation as string | undefined) || (educatorName ? `Selected verified educational resource from ${educatorName}` : item.rankingRationale);

        selectedForModule.push({
          resourceId: `res-${mod.moduleId}-${selectedForModule.length + 1}`,
          candidateId: item.candidate.id,
          provider: item.candidate.provider,
          externalId: item.candidate.externalId,
          title: item.candidate.title,
          canonicalUrl: item.candidate.canonicalUrl,
          sourceUrl: item.candidate.sourceUrl,
          modality: item.candidate.modality,
          durationSeconds: item.candidate.durationSeconds,
          durationMinutes: Math.round((item.candidate.durationSeconds || 0) / 60),
          relevanceScore: item.relevance.score,
          overallScore: item.overallScore,
          selectionReason: item.rankingRationale,
          coverageAssessment: `Pedagogical focus: ${categoryLabel}. Role: ${role}. Covers ${Math.round(item.coverage.coverageRatio * 100)}% of module concepts.`,
          assignedRole: role,
          resourceCategory: item.detectedCategory,
          practicalEvidence: item.categoryEvaluation?.evidence as any,
          chapterReference: itemMatchedChapter,
          chapters: itemChapters,
          creator: item.candidate.creator,
          sourceName: item.candidate.creator?.name || item.candidate.provider,
          isVerified: item.candidate.verificationStatus !== 'unverified_candidate',
          discoverySource,
          educatorId,
          educatorName,
          channelId,
          selectionExplanation,
        });

        assignedRolesInModule.add(role);
        if (item.detectedCategory) {
          assignedCategoriesInModule.add(item.detectedCategory);
        }
        moduleSeenUrls.add(urlKey);
        moduleSeenExternalIds.add(extKey);
        return true;
      };

      const profile = mod.objective.intentProfile;

      if (profile && options.requireComplementaryRoles !== false) {
        // Strategy 1: Intent-Profile-Driven Category Balancing
        let targetCategoryGroups: ResourceCategory[][] = [];

        if (profile.practicalEmphasis === 'primary' || profile.practicalEmphasis === 'high') {
          // Software engineering, web dev, practical coding
          // Step 1: Conceptual mental model
          // Step 2: Authentic hands-on coding tutorial
          // Step 3: Guided exercise or project walkthrough
          // Step 4: Real-world application, optimization, or authoritative reference
          targetCategoryGroups = [
            ['conceptual_explanation'],
            ['practical_tutorial'],
            ['guided_exercise', 'project_based'],
            ['real_world_application', 'advanced_optimization', 'conceptual_explanation', 'practical_tutorial'],
          ];
        } else if (profile.practicalEmphasis === 'moderate') {
          // Hybrid: Electronics, Applied AI, Systems, Computational Math
          // Step 1: Core concepts
          // Step 2: Solved problems / numerical calculations
          // Step 3: Circuit/simulation demo or real-world application
          // Step 4: Supplementary reading or advanced extension
          targetCategoryGroups = [
            ['conceptual_explanation'],
            ['guided_exercise'],
            ['real_world_application', 'practical_tutorial'],
            ['conceptual_explanation', 'guided_exercise', 'real_world_application'],
          ];
        } else {
          // 'none': Pure mathematics, proofs, theoretical physics
          // Step 1: Theoretical foundation
          // Step 2: Solved derivations / proof demonstrations
          // Step 3: Real-world context / physical application or monograph
          // Step 4: Supplementary reading / additional derivation
          targetCategoryGroups = [
            ['conceptual_explanation'],
            ['guided_exercise'],
            ['real_world_application', 'conceptual_explanation'],
            ['conceptual_explanation', 'guided_exercise'],
          ];
        }

        // Iterate through target category groups to assemble a balanced pedagogical set
        for (const group of targetCategoryGroups) {
          if (selectedForModule.length >= maxResourcesPerModule) break;
          if (totalAssignedAcrossCourse + selectedForModule.length >= maxTotalResources) break;

          // Find the best unselected candidate matching any category in the group
          const match = assignableCandidates.find((c) => {
            const urlKey = c.candidate.canonicalUrl.toLowerCase();
            const extKey = `${c.candidate.provider}:${c.candidate.externalId}`.toLowerCase();
            if (moduleSeenUrls.has(urlKey) || moduleSeenExternalIds.has(extKey)) return false;
            if (!c.detectedCategory || !group.includes(c.detectedCategory)) return false;
            if (c.overallScore < minRelevanceThreshold) return false;
            return true;
          });

          if (match) {
            selectCandidate(match);
          }
        }

        // If slots remain, fill with next best distinct candidates
        for (const candidateItem of assignableCandidates) {
          if (selectedForModule.length >= maxResourcesPerModule) break;
          if (totalAssignedAcrossCourse + selectedForModule.length >= maxTotalResources) break;

          const urlKey = candidateItem.candidate.canonicalUrl.toLowerCase();
          const extKey = `${candidateItem.candidate.provider}:${candidateItem.candidate.externalId}`.toLowerCase();
          if (moduleSeenUrls.has(urlKey) || moduleSeenExternalIds.has(extKey)) continue;

          // For pure theory/math with practicalEmphasis === 'none', skip irrelevant programming tutorials
          if (profile.practicalEmphasis === 'none' && candidateItem.detectedCategory === 'practical_tutorial') {
            continue;
          }

          if (candidateItem.overallScore >= minRelevanceThreshold) {
            selectCandidate(candidateItem);
          }
        }
      } else {
        // Strategy 2: Role Complementarity (Pass A top pick + Pass B distinct roles)
        // Pass A: Pick top candidate (#1)
        if (assignableCandidates.length > 0) {
          selectCandidate(assignableCandidates[0]);
        }

        // Pass B: Select complementary roles for remaining slots
        for (let i = 1; i < assignableCandidates.length; i++) {
          if (selectedForModule.length >= maxResourcesPerModule) break;
          if (totalAssignedAcrossCourse + selectedForModule.length >= maxTotalResources) break;

          const candidateItem = assignableCandidates[i];
          const urlKey = candidateItem.candidate.canonicalUrl.toLowerCase();
          const extKey = `${candidateItem.candidate.provider}:${candidateItem.candidate.externalId}`.toLowerCase();

          if (moduleSeenUrls.has(urlKey) || moduleSeenExternalIds.has(extKey)) {
            continue;
          }

          const role = determineResourceRole(
            candidateItem.candidate,
            mod.objective.cognitiveIntent,
            candidateItem.detectedCategory
          );

          // If we require complementary roles and this role is already taken, check if other distinct roles exist in remaining pool
          if (options.requireComplementaryRoles !== false && assignedRolesInModule.has(role)) {
            const hasUnseenRoleAvailable = assignableCandidates.slice(i + 1).some((other) => {
              const otherUrl = other.candidate.canonicalUrl.toLowerCase();
              if (moduleSeenUrls.has(otherUrl)) return false;
              const otherRole = determineResourceRole(
                other.candidate,
                mod.objective.cognitiveIntent,
                other.detectedCategory
              );
              return !assignedRolesInModule.has(otherRole) && other.overallScore >= 55;
            });

            // If an unseen complementary role exists down the list, skip this redundant duplicate role
            if (hasUnseenRoleAvailable) {
              continue;
            }
          }

          selectCandidate(candidateItem);
        }
      }

      // Record global assignment tracking
      for (const res of selectedForModule) {
        const urlKey = res.canonicalUrl.toLowerCase();
        let set = globallyAssignedUrlToModuleIds.get(urlKey);
        if (!set) {
          set = new Set<string>();
          globallyAssignedUrlToModuleIds.set(urlKey, set);
        }
        if (set.size > 0) {
          sharedResourcesCount++;
        }
        set.add(mod.moduleId);
      }

      totalAssignedAcrossCourse += selectedForModule.length;

      // Compute module collective coverage
      const allCoveredInModule = new Set<string>();
      for (const res of selectedForModule) {
        for (const concept of mod.objective.primaryConcepts) {
          if (res.title.toLowerCase().includes(concept.toLowerCase())) {
            allCoveredInModule.add(concept);
          }
        }
      }

      const coveredList = Array.from(allCoveredInModule);
      const uncoveredList = mod.objective.primaryConcepts.filter((c) => !allCoveredInModule.has(c));
      const satisfiedRatio =
        mod.objective.primaryConcepts.length > 0
          ? Math.round((coveredList.length / mod.objective.primaryConcepts.length) * 100) / 100
          : 1.0;

      const totalDurationMinutes = selectedForModule.reduce((acc, r) => acc + r.durationMinutes, 0);

      distributedModules.push({
        moduleId: mod.moduleId,
        moduleNumber: mod.moduleNumber,
        moduleTitle: mod.moduleTitle,
        resources: selectedForModule,
        coverageSummary: {
          satisfiedRatio,
          coveredConcepts: coveredList,
          uncoveredConcepts: uncoveredList,
        },
        isEmptyState: false,
        totalDurationMinutes,
      });
    }

    const summary = `Successfully distributed ${totalAssignedAcrossCourse} resources across ${distributedModules.length} module(s) (Shared cross-module: ${sharedResourcesCount}).`;

    return {
      modules: distributedModules,
      totalResourcesAssigned: totalAssignedAcrossCourse,
      sharedResourcesCount,
      summary,
    };
  }
}
