import {
  AnalyzedObjective,
  NormalizedResourceCandidate,
  RankingOptions,
  RankedResult,
  EvaluatedResourceCandidate,
  ResourceModality,
} from '../types';
import { ExplainableRelevanceScorer } from './relevance-scorer';
import { EducationalDepthEvaluator } from './depth-evaluator';
import { DurationIntelligenceEvaluator } from './duration-intelligence';
import { ObjectiveCoverageAnalyzer } from './coverage-analyzer';
import { PracticalResourceClassifier } from './practical-classifier';
import { educatorRegistry } from '../educators/educator-registry';

/**
 * Objective-aware modality suitability guard.
 * Prevents inappropriate academic research papers from displacing practical
 * or foundational resources for beginner learners, high school exams, or coding tutorials.
 */
export function isModalityAppropriateForObjective(
  modality: ResourceModality,
  objective: AnalyzedObjective
): boolean {
  if (modality === 'paper') {
    // Academic paper: NOT appropriate for beginner/elementary learners or school board exams (Class 10-12, CBSE, HSC, NEET, JEE)
    const isBeginner = objective.academicLevel === 'beginner' || objective.academicLevel === 'elementary';
    const isSchoolOrBoardExam = !!objective.targetExam && /^(hsc|cbse|icse|class\s*1[012]|neet|jee)/i.test(objective.targetExam);

    if (isBeginner || isSchoolOrBoardExam) {
      return false;
    }

    // For hands-on coding walkthroughs at non-advanced levels (intermediate/foundation), paper is inappropriate
    if (
      (objective.cognitiveIntent === 'coding_walkthrough' || objective.cognitiveIntent === 'project_implementation') &&
      objective.academicLevel !== 'advanced' &&
      objective.academicLevel !== 'expert'
    ) {
      return false;
    }

    return true;
  }

  if (modality === 'documentation') {
    // Official documentation: appropriate for computer science, AI, coding, and authoritative spec intent
    return (
      objective.domain === 'computer_science' ||
      objective.domain === 'data_science_ai' ||
      objective.cognitiveIntent === 'coding_walkthrough' ||
      objective.cognitiveIntent === 'project_implementation' ||
      objective.cognitiveIntent === 'authoritative_documentation'
    );
  }

  if (modality === 'practice' || modality === 'quiz') {
    return (
      objective.cognitiveIntent === 'worked_examples' ||
      objective.cognitiveIntent === 'exam_practice' ||
      !!objective.targetExam
    );
  }

  if (modality === 'project') {
    return (
      objective.cognitiveIntent === 'project_implementation' ||
      objective.cognitiveIntent === 'coding_walkthrough'
    );
  }

  // Videos and textbooks/monographs are broadly applicable
  return true;
}

export class ExplainableRankingEngine {
  constructor(
    private relevanceScorer = new ExplainableRelevanceScorer(),
    private depthEvaluator = new EducationalDepthEvaluator(),
    private durationEvaluator = new DurationIntelligenceEvaluator(),
    private coverageAnalyzer = new ObjectiveCoverageAnalyzer(),
    private practicalClassifier = new PracticalResourceClassifier()
  ) {}

  /**
   * Deterministically evaluates, gates, deduplicates, and ranks candidates for an AnalyzedObjective.
   */
  rank(
    objective: AnalyzedObjective,
    candidates: NormalizedResourceCandidate[],
    options: RankingOptions = {}
  ): RankedResult {
    const minRelevanceThreshold = options.minRelevanceThreshold ?? 50;
    const durationPreference = options.durationPreference ?? 'balanced';
    const maxResults = options.maxResults ?? 6;
    const requireModalityDiversity = options.requireModalityDiversity ?? true;
    const allowUnknownDuration = options.allowUnknownDuration ?? true;

    // Configurable scoring weights with default 50/25/15/10 breakdown
    const relW = options.weights?.relevanceWeight ?? 0.50;
    const depW = options.weights?.depthWeight ?? 0.25;
    const durW = options.weights?.durationWeight ?? 0.15;
    const covW = options.weights?.coverageWeight ?? 0.10;
    const sumW = relW + depW + durW + covW;

    const normRelW = sumW > 0 ? relW / sumW : 0.50;
    const normDepW = sumW > 0 ? depW / sumW : 0.25;
    const normDurW = sumW > 0 ? durW / sumW : 0.15;
    const normCovW = sumW > 0 ? covW / sumW : 0.10;

    const rejectedCandidates: RankedResult['rejectedCandidates'] = [];
    const evaluatedEligible: EvaluatedResourceCandidate[] = [];

    // Seen tracking for deduplication
    const seenUrls = new Set<string>();
    const seenExternalIds = new Set<string>();

    for (const candidate of candidates) {
      // Deduplicate identical URLs or external IDs early
      const urlKey = candidate.canonicalUrl.toLowerCase();
      const extKey = `${candidate.provider}:${candidate.externalId}`.toLowerCase();

      if (seenUrls.has(urlKey) || seenExternalIds.has(extKey)) {
        continue;
      }

      // Check unknown duration policy
      if (!allowUnknownDuration && candidate.modality === 'video' && candidate.durationSeconds === undefined) {
        rejectedCandidates.push({
          candidate,
          rejectionReasons: ['Video candidate rejected because duration is unknown and allowUnknownDuration is disabled.'],
          relevanceScore: 0,
        });
        continue;
      }

      // Check modality appropriateness for this objective
      if (!isModalityAppropriateForObjective(candidate.modality, objective)) {
        rejectedCandidates.push({
          candidate,
          rejectionReasons: [`Modality '${candidate.modality}' is not pedagogically appropriate for ${objective.domain} at ${objective.academicLevel} level with intent '${objective.cognitiveIntent}'.`],
          relevanceScore: 0,
        });
        continue;
      }

      // 1. Relevance Scoring (Gating Factor)
      const relevance = this.relevanceScorer.score(objective, candidate);

      if (!relevance.isEligible || relevance.score < minRelevanceThreshold) {
        rejectedCandidates.push({
          candidate,
          rejectionReasons: relevance.rejectionReasons.length
            ? relevance.rejectionReasons
            : [`Relevance score (${relevance.score}/100) below threshold (${minRelevanceThreshold})`],
          relevanceScore: relevance.score,
        });
        continue;
      }

      // 2. Depth Evaluation
      const depth = this.depthEvaluator.evaluate(objective, candidate);

      // 3. Duration Intelligence Evaluation
      const durationSuitability = this.durationEvaluator.evaluate(
        candidate,
        durationPreference,
        objective.cognitiveIntent
      );

      // 4. Objective Coverage Analysis
      const coverage = this.coverageAnalyzer.analyze(objective, candidate);

      // 5. Practical Learning Classification
      const practicalEval = this.practicalClassifier.classify(candidate, objective);

      // Duration calibration for category: do not penalize focused exercises or practical coding tutorials
      let categoryAdjustedDuration = durationSuitability;
      if (candidate.modality === 'video' && candidate.durationSeconds !== undefined) {
        const d = candidate.durationSeconds;
        // Solved problem sets or micro-demonstrations: 7-25 min is ideal
        if (practicalEval.primaryCategory === 'guided_exercise' && d >= 420 && d <= 1800) {
          categoryAdjustedDuration = {
            ...durationSuitability,
            score: Math.max(durationSuitability.score, 92),
            suitabilityRationale: `${Math.round(d / 60)} min is an optimal duration for a guided exercise / problem set walkthrough.`,
          };
        } else if (practicalEval.primaryCategory === 'practical_tutorial' && d >= 720 && d <= 2700) {
          categoryAdjustedDuration = {
            ...durationSuitability,
            score: Math.max(durationSuitability.score, 92),
            suitabilityRationale: `${Math.round(d / 60)} min is an optimal duration for a hands-on coding tutorial.`,
          };
        } else if (practicalEval.primaryCategory === 'project_based' && d >= 1800 && d <= 7200) {
          categoryAdjustedDuration = {
            ...durationSuitability,
            score: Math.max(durationSuitability.score, 92),
            suitabilityRationale: `${Math.round(d / 60)} min provides comprehensive project construction depth.`,
          };
        }
      }

      // Category-Specific Alignment Bonus / Buzzword Penalty
      let categoryAlignmentBonus = 0;
      if (objective.intentProfile) {
        const emphasis = objective.intentProfile.practicalEmphasis;
        if (emphasis === 'primary' || emphasis === 'high') {
          if (practicalEval.primaryCategory === 'practical_tutorial' || practicalEval.primaryCategory === 'project_based') {
            categoryAlignmentBonus = Math.round(practicalEval.practicalQualityScore * 0.08);
          } else if (practicalEval.primaryCategory === 'guided_exercise') {
            categoryAlignmentBonus = Math.round(practicalEval.categoryScores.guided_exercise * 0.06);
          }
        } else if (emphasis === 'moderate') {
          if (practicalEval.primaryCategory === 'guided_exercise' || practicalEval.primaryCategory === 'conceptual_explanation') {
            categoryAlignmentBonus = 5;
          }
        }

        if (practicalEval.isSuperficialBuzzwordOnly) {
          categoryAlignmentBonus -= 25;
        }
      }

      // 6. Master Educator Trust & Subject-Aware Pedagogical Adaptation
      let educatorTrustBonus = 0;
      let educatorAttribution = '';

      const rawMeta = candidate.rawMetadata || {};
      const isVerifiedEducator = candidate.verificationStatus === 'verified_channel' || rawMeta.isVerifiedEducator === true;
      const educatorId = (rawMeta.educatorId as string | undefined) || candidate.creator?.authorId;
      const eduRecord = educatorId
        ? educatorRegistry.getById(educatorId)
        : candidate.creator?.channelId
        ? educatorRegistry.getByChannelId(candidate.creator.channelId)
        : undefined;

      if (isVerifiedEducator && eduRecord) {
        // Base trust bonus: +8 pts for verified directory educator
        educatorTrustBonus += 8;

        // Corroboration / Tier boost: +2 pts for Tier 1 / Gold / L1
        if (
          eduRecord.Corroboration_Level === 'L1' ||
          eduRecord.Confidence_Level === 'Gold' ||
          eduRecord.Confidence_Level === 'Tier 1' ||
          eduRecord.Verification_Status === 'VERIFIED'
        ) {
          educatorTrustBonus += 2;
        }

        // Subject / Domain Alignment Boost
        const eduSubjects = (eduRecord.Subjects || '').toLowerCase();
        const objDomain = (objective.domain || '').toLowerCase();
        const objSubject = (objective.subject || '').toLowerCase();
        const primaryConceptLower = objective.primaryConcepts.map((c) => c.toLowerCase());

        const hasSubjectMatch =
          eduSubjects.includes(objSubject) ||
          eduSubjects.includes(objDomain.replace(/_/g, ' ')) ||
          primaryConceptLower.some((c) => eduSubjects.includes(c));

        if (hasSubjectMatch) {
          educatorTrustBonus += 2;
        }

        // Subject-specific pedagogical adaptation (Section 5)
        // 1. Programming & CS: practical coding demonstrations, implementation depth
        if (objective.domain === 'computer_science' || objective.domain === 'data_science_ai') {
          if (
            practicalEval.primaryCategory === 'practical_tutorial' ||
            practicalEval.primaryCategory === 'project_based' ||
            practicalEval.practicalQualityScore >= 65
          ) {
            educatorTrustBonus += 3;
          }
        }
        // 2. Mathematics: conceptual rigor, derivations, worked problem solving
        else if (objective.domain === 'mathematics') {
          if (
            practicalEval.primaryCategory === 'guided_exercise' ||
            depth.tier === 'in_depth_lecture' ||
            depth.tier === 'comprehensive_course'
          ) {
            educatorTrustBonus += 3;
          }
        }
        // 3. Physics & Engineering: balance of theory and practical / laboratory demonstrations
        else if (objective.domain === 'physics' || objective.domain === 'engineering') {
          if (
            depth.score >= 70 ||
            practicalEval.primaryCategory === 'guided_exercise' ||
            practicalEval.primaryCategory === 'practical_tutorial'
          ) {
            educatorTrustBonus += 3;
          }
        }
        // 4. Competitive Exams: Syllabus alignment, exam focus
        if (objective.targetExam) {
          const targetExamLower = objective.targetExam.toLowerCase();
          const eduExams = (eduRecord.Relevant_Examinations || '').toLowerCase();
          const eduExamIds = (eduRecord.Exam_IDs || []).map((e) => e.toLowerCase());
          if (eduExams.includes(targetExamLower) || eduExamIds.some((e) => e.includes(targetExamLower))) {
            educatorTrustBonus += 4;
          }
        }

        // Cap educator bonus to +15 pts max so it cannot overshadow fundamental quality and relevance
        educatorTrustBonus = Math.min(15, educatorTrustBonus);
        educatorAttribution = `Educator Trust: +${educatorTrustBonus} (${eduRecord.Educator_Name} verified); `;
      }

      // 7. Overall Score Computation (Normalized weights sum to 1.0)
      const overallScore = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            relevance.score * normRelW +
            depth.score * normDepW +
            categoryAdjustedDuration.score * normDurW +
            coverage.coverageRatio * 100 * normCovW +
            categoryAlignmentBonus +
            educatorTrustBonus
          )
        )
      );

      const rankingRationale =
        `Overall: ${overallScore}/100 — ${educatorAttribution}Category: ${practicalEval.primaryCategory} (Quality: ${practicalEval.practicalQualityScore}/100); ` +
        `Relevance: ${relevance.score}/100; Depth: ${depth.tier} (${depth.score}/100); ` +
        `Duration: ${categoryAdjustedDuration.suitabilityRationale}; Coverage: ${Math.round(coverage.coverageRatio * 100)}%.`;

      seenUrls.add(urlKey);
      seenExternalIds.add(extKey);

      evaluatedEligible.push({
        candidate,
        relevance,
        depth,
        durationSuitability: categoryAdjustedDuration,
        coverage,
        detectedCategory: practicalEval.primaryCategory,
        practicalQualityScore: practicalEval.practicalQualityScore,
        categoryEvaluation: practicalEval as any,
        overallScore,
        rankingRationale,
      });
    }

    // 6. Sort Eligible Candidates Deterministically (OverallScore desc, tiebreak candidate.id)
    evaluatedEligible.sort((a, b) => {
      if (b.overallScore !== a.overallScore) {
        return b.overallScore - a.overallScore;
      }
      return a.candidate.id.localeCompare(b.candidate.id);
    });

    // 7. Objective-Aware Modality Diversity Slotting
    let finalRanked: EvaluatedResourceCandidate[] = [];

    if (requireModalityDiversity && evaluatedEligible.length > 2) {
      const videoItems = evaluatedEligible.filter((item) => item.candidate.modality === 'video');
      const textItems = evaluatedEligible.filter((item) => item.candidate.modality !== 'video');

      // Filter text items to only those whose modality is educationally appropriate for this objective
      const appropriateTextItems = textItems.filter((item) =>
        isModalityAppropriateForObjective(item.candidate.modality, objective)
      );

      if (videoItems.length > 0 && appropriateTextItems.length > 0) {
        const slotted: EvaluatedResourceCandidate[] = [];
        const seenCandidateIds = new Set<string>();

        // Top overall item gets slot #1
        const topItem = evaluatedEligible[0];
        slotted.push(topItem);
        seenCandidateIds.add(topItem.candidate.id);

        if (topItem.candidate.modality === 'video') {
          // Find next best video
          const nextVideo = videoItems.find((v) => !seenCandidateIds.has(v.candidate.id));
          if (nextVideo) {
            slotted.push(nextVideo);
            seenCandidateIds.add(nextVideo.candidate.id);
          }

          // Slot top appropriate text item into slot #3 if competitive (score >= 60 and within 25 pts of top)
          const topText = appropriateTextItems.find((t) => !seenCandidateIds.has(t.candidate.id));
          if (topText && topText.overallScore >= 60 && (topItem.overallScore - topText.overallScore <= 25)) {
            slotted.push(topText);
            seenCandidateIds.add(topText.candidate.id);
          }
        } else {
          // Top item is non-video; ensure top video is slotted
          const nextText = appropriateTextItems.find((t) => !seenCandidateIds.has(t.candidate.id));
          const topVideo = videoItems.find((v) => !seenCandidateIds.has(v.candidate.id));

          if (nextText) {
            slotted.push(nextText);
            seenCandidateIds.add(nextText.candidate.id);
          }
          if (topVideo) {
            slotted.push(topVideo);
            seenCandidateIds.add(topVideo.candidate.id);
          }
        }

        // Fill remaining slots in natural order of overall score
        for (const item of evaluatedEligible) {
          if (!seenCandidateIds.has(item.candidate.id)) {
            slotted.push(item);
            seenCandidateIds.add(item.candidate.id);
          }
          if (slotted.length >= maxResults) break;
        }

        finalRanked = slotted;
      } else {
        // No appropriate diverse candidates exist; use natural score order
        finalRanked = evaluatedEligible.slice(0, maxResults);
      }
    } else {
      finalRanked = evaluatedEligible.slice(0, maxResults);
    }

    // Update ranking rationale with final position
    finalRanked = finalRanked.map((item, index) => ({
      ...item,
      rankingRationale: `Rank #${index + 1} — ${item.rankingRationale}`,
    }));

    // 8. Generate Summary
    const totalEvaluated = candidates.length;
    const eligibleCount = evaluatedEligible.length;
    const avgRelevance =
      finalRanked.length > 0
        ? Math.round((finalRanked.reduce((sum, item) => sum + item.relevance.score, 0) / finalRanked.length) * 10) / 10
        : 0;
    const highestScore = finalRanked.length > 0 ? finalRanked[0].overallScore : 0;
    const modalitiesRepresented = Array.from(new Set(finalRanked.map((r) => r.candidate.modality)));

    const explanation =
      finalRanked.length > 0
        ? `Successfully ranked ${finalRanked.length} resources across ${modalitiesRepresented.join(', ')} ` +
          `(Top Score: ${highestScore}/100, Avg Relevance: ${avgRelevance}/100). ` +
          `Rejected ${rejectedCandidates.length} candidate(s) failing relevance or collision thresholds.`
        : `No candidates satisfied relevance gating (evaluated ${totalEvaluated}, rejected ${rejectedCandidates.length}).`;

    return {
      rankedCandidates: finalRanked,
      rejectedCandidates,
      totalEvaluated,
      eligibleCount,
      summary: {
        averageRelevance: avgRelevance,
        highestScore,
        modalitiesRepresented,
        explanation,
      },
    };
  }
}
