import {
  AnalyzedObjective,
  NormalizedResourceCandidate,
  ObjectiveCoverageResult,
} from '../types';
import { stemWord, tokenizeAndStem } from './relevance-scorer';

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class ObjectiveCoverageAnalyzer {
  /**
   * Deterministically analyzes how much of an AnalyzedObjective is covered
   * by a NormalizedResourceCandidate's observed metadata.
   * Explicitly documents limitations (metadata-only, no transcript inspection, discounts title stuffing).
   */
  analyze(
    objective: AnalyzedObjective,
    candidate: NormalizedResourceCandidate
  ): ObjectiveCoverageResult {
    const titleNorm = normalizeText(candidate.title);
    const descNorm = normalizeText(candidate.description || '');
    const combinedNorm = `${titleNorm} ${descNorm}`;
    const titleStems = new Set(tokenizeAndStem(titleNorm));
    const descStems = new Set(tokenizeAndStem(descNorm));

    const coveredPrimaryConcepts: string[] = [];
    const coveredSupportingConcepts: string[] = [];
    const coveredOutcomes: string[] = [];
    const coveredSkills: string[] = [];
    const uncoveredConcepts: string[] = [];
    const evidence: string[] = [];
    const limitations: string[] = [
      'Analysis is based solely on resource title, description, and available metadata; actual full-text video transcript was not verified.',
    ];

    const hasMinimalDesc = !candidate.description || candidate.description.trim().length < 40;
    const isShortDuration = candidate.durationSeconds !== undefined && candidate.durationSeconds < 600;

    if (hasMinimalDesc) {
      limitations.push('Resource description was empty or minimal; concept coverage inferred strictly from resource title.');
    }

    let titleOnlyPrimaryMatches = 0;

    // 1. Primary Concepts
    for (const concept of objective.primaryConcepts) {
      const cNorm = normalizeText(concept);
      if (!cNorm) continue;

      const phraseRegex = new RegExp(`\\b${escapeRegex(cNorm)}\\b`, 'i');
      const conceptStems = tokenizeAndStem(cNorm);

      const matchedDescStems = conceptStems.filter((s) => descStems.has(s));
      const hasDescMatch = phraseRegex.test(descNorm) || (conceptStems.length > 0 && matchedDescStems.length === conceptStems.length);

      const matchedTitleStems = conceptStems.filter((s) => titleStems.has(s));
      const hasTitleMatch = phraseRegex.test(titleNorm) || (conceptStems.length > 0 && matchedTitleStems.length === conceptStems.length);

      if (hasDescMatch) {
        coveredPrimaryConcepts.push(concept);
        evidence.push(`Primary concept "${concept}" matched in description`);
      } else if (hasTitleMatch) {
        titleOnlyPrimaryMatches++;
        // If a short-form resource with minimal description packs 3+ concepts into the title,
        // it cannot credibly teach all of them. Only credit up to 2 title-only concepts for short videos without description.
        if (titleOnlyPrimaryMatches > 2 && isShortDuration && hasMinimalDesc) {
          uncoveredConcepts.push(concept);
          evidence.push(`Primary concept "${concept}" mentioned in title but uncredited due to short duration (< 10 min) and minimal description`);
          if (!limitations.some((l) => l.includes('Multiple distinct concepts observed in title'))) {
            limitations.push('Multiple distinct concepts observed in title of short-duration resource; superficial title mentions without explanatory description were not credited as confirmed coverage.');
          }
        } else {
          coveredPrimaryConcepts.push(concept);
          evidence.push(`Primary concept "${concept}" matched in title`);
        }
      } else {
        uncoveredConcepts.push(concept);
      }
    }

    // 2. Supporting Concepts
    for (const supp of objective.supportingConcepts) {
      const sNorm = normalizeText(supp);
      if (!sNorm) continue;

      const phraseRegex = new RegExp(`\\b${escapeRegex(sNorm)}\\b`, 'i');
      if (phraseRegex.test(combinedNorm)) {
        coveredSupportingConcepts.push(supp);
        evidence.push(`Supporting concept "${supp}" matched in resource text`);
      }
    }

    // 3. Explicit Outcomes
    for (const outcome of objective.explicitOutcomes) {
      const oNorm = normalizeText(outcome);
      if (!oNorm) continue;

      // Extract meaningful tokens
      const oTokens = oNorm.split(' ').filter((t) => t.length > 3);
      if (oTokens.length === 0) continue;

      const matchedTokens = oTokens.filter((t) =>
        new RegExp(`\\b${escapeRegex(t)}\\b`, 'i').test(combinedNorm)
      );

      if (matchedTokens.length >= Math.min(2, oTokens.length)) {
        coveredOutcomes.push(outcome);
        evidence.push(`Learning outcome "${outcome}" supported by matched action tokens (${matchedTokens.join(', ')})`);
      }
    }

    // 4. Expected Skills
    for (const skill of objective.expectedSkills) {
      const skNorm = normalizeText(skill);
      if (!skNorm) continue;

      const skTokens = skNorm.split(' ').filter((t) => t.length > 3);
      if (skTokens.length === 0) continue;

      const matchedTokens = skTokens.filter((t) =>
        new RegExp(`\\b${escapeRegex(t)}\\b`, 'i').test(combinedNorm)
      );

      if (matchedTokens.length >= Math.min(2, skTokens.length)) {
        coveredSkills.push(skill);
        evidence.push(`Practical skill "${skill}" indicated in resource metadata`);
      }
    }

    // 5. Weighted Coverage Ratio Calculation
    const weightPrimary = 3.0;
    const weightSupporting = 1.5;
    const weightOutcome = 1.0;
    const weightSkill = 1.0;

    const totalWeight =
      (objective.primaryConcepts.length * weightPrimary) +
      (objective.supportingConcepts.length * weightSupporting) +
      (objective.explicitOutcomes.length * weightOutcome) +
      (objective.expectedSkills.length * weightSkill);

    const earnedWeight =
      (coveredPrimaryConcepts.length * weightPrimary) +
      (coveredSupportingConcepts.length * weightSupporting) +
      (coveredOutcomes.length * weightOutcome) +
      (coveredSkills.length * weightSkill);

    const rawRatio = totalWeight > 0 ? earnedWeight / totalWeight : 0;
    const coverageRatio = Math.max(0, Math.min(1, Math.round(rawRatio * 100) / 100));

    const confidence = candidate.description && candidate.description.length > 150 ? 0.85 : 0.55;

    return {
      coveredPrimaryConcepts,
      coveredSupportingConcepts,
      coveredOutcomes,
      coveredSkills,
      uncoveredConcepts,
      coverageRatio,
      confidence,
      evidence,
      limitations,
    };
  }
}
