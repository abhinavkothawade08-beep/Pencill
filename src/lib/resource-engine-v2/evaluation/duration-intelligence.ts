import {
  NormalizedResourceCandidate,
  DurationPreference,
  DurationEvaluation,
  CognitiveIntent,
} from '../types';

export class DurationIntelligenceEvaluator {
  /**
   * Evaluates the duration suitability of a resource candidate against learner preference and cognitive intent.
   * Tolerates missing durations with a neutral baseline and handles non-video modalities appropriately.
   */
  evaluate(
    candidate: NormalizedResourceCandidate,
    preference: DurationPreference = 'balanced',
    intent?: CognitiveIntent
  ): DurationEvaluation {
    const isVideo = candidate.modality === 'video';

    // 1. Non-video resources (papers, books, documentation, articles)
    if (!isVideo) {
      return {
        score: 80,
        durationSeconds: candidate.durationSeconds,
        preference,
        suitabilityRationale: `Textual reading resource (${candidate.modality}) is self-paced; duration constraints not applicable.`,
        isUnknownDuration: candidate.durationSeconds === undefined,
      };
    }

    // 2. Video with unknown duration
    if (candidate.durationSeconds === undefined) {
      return {
        score: 50,
        durationSeconds: undefined,
        preference,
        suitabilityRationale: 'Video duration metadata is unavailable; neutral baseline score (50/100) assigned without penalizing or falsely promoting.',
        isUnknownDuration: true,
      };
    }

    // 3. Video with zero duration (live stream, placeholder)
    if (candidate.durationSeconds === 0) {
      return {
        score: 20,
        durationSeconds: 0,
        preference,
        suitabilityRationale: 'Zero-duration video indicator (potential active live stream or empty container).',
        isUnknownDuration: false,
      };
    }

    const d = candidate.durationSeconds;
    const minutes = Math.round(d / 60);
    let score = 50;
    let rationale = '';

    // 4. Score based on learner preference
    switch (preference) {
      case 'concise': {
        // Ideal: 5-15 min (300-900s)
        if (d >= 300 && d <= 900) {
          score = 95;
          rationale = `${minutes} min perfectly matches concise preference (ideal: 5-15 min).`;
        } else if (d >= 180 && d < 300) {
          score = 82;
          rationale = `${minutes} min is slightly shorter than ideal, but suitable for quick review.`;
        } else if (d > 900 && d <= 1500) {
          score = 75;
          rationale = `${minutes} min is slightly longer than preferred 15 min ceiling.`;
        } else if (d > 1500 && d <= 2400) {
          score = 55;
          rationale = `${minutes} min exceeds concise preference limit.`;
        } else if (d > 2400) {
          score = 30;
          rationale = `${minutes} min is too long for a concise preference.`;
        } else {
          score = 35;
          rationale = `${minutes} min is under 3 minutes; likely too brief.`;
        }
        break;
      }

      case 'balanced': {
        // Ideal: 15-40 min (900-2400s)
        if (d >= 900 && d <= 2400) {
          score = 95;
          rationale = `${minutes} min fits standard balanced learning module (ideal: 15-40 min).`;
        } else if (d >= 600 && d < 900) {
          score = 85;
          rationale = `${minutes} min provides a focused, concise explanation within balanced tolerance.`;
        } else if (d > 2400 && d <= 3600) {
          score = 85;
          rationale = `${minutes} min provides deep coverage slightly above standard balanced target.`;
        } else if (d >= 300 && d < 600) {
          score = 70;
          rationale = `${minutes} min is on the shorter end for a balanced module.`;
        } else if (d > 3600 && d <= 5400) {
          score = 65;
          rationale = `${minutes} min is quite long for a balanced module.`;
        } else if (d > 5400) {
          score = 50;
          rationale = `${minutes} min is extended lecture length; may cause fatigue for balanced preference.`;
        } else {
          score = 30;
          rationale = `${minutes} min is under 5 minutes; too brief for a balanced module.`;
        }
        break;
      }

      case 'detailed': {
        // Ideal: 30-75 min (1800-4500s)
        if (d >= 1800 && d <= 4500) {
          score = 95;
          rationale = `${minutes} min matches detailed deep-dive preference (ideal: 30-75 min).`;
        } else if (d >= 1200 && d < 1800) {
          score = 82;
          rationale = `${minutes} min provides solid depth, approaching detailed threshold.`;
        } else if (d > 4500 && d <= 6000) {
          score = 85;
          rationale = `${minutes} min provides substantial depth for detailed study.`;
        } else if (d >= 600 && d < 1200) {
          score = 65;
          rationale = `${minutes} min is shorter than typical detailed deep dive.`;
        } else if (d > 6000) {
          score = 70;
          rationale = `${minutes} min is a very long session; detailed but requires high commitment.`;
        } else {
          score = 40;
          rationale = `${minutes} min is under 10 minutes; too short for a detailed deep dive.`;
        }
        break;
      }

      case 'comprehensive': {
        // Ideal: 60-180+ min (3600-10800s)
        if (d >= 3600) {
          score = 95;
          rationale = `${minutes} min matches comprehensive full-course preference (> 60 min).`;
        } else if (d >= 2400 && d < 3600) {
          score = 80;
          rationale = `${minutes} min provides substantial coverage, approaching full course duration.`;
        } else if (d >= 1500 && d < 2400) {
          score = 65;
          rationale = `${minutes} min is moderate length; below comprehensive expectations.`;
        } else if (d >= 900 && d < 1500) {
          score = 50;
          rationale = `${minutes} min is standard lecture length, not a comprehensive course.`;
        } else {
          score = 30;
          rationale = `${minutes} min is far too brief for comprehensive course preference.`;
        }
        break;
      }
    }

    // 5. Cognitive Intent Adjustments
    if (intent === 'project_implementation' && d < 600) {
      score = Math.max(20, score - 20);
      rationale += ' (Penalized: Project implementation requires sufficient duration for architecture and code walkthrough).';
    } else if (intent === 'conceptual_foundations' && d > 7200 && preference !== 'comprehensive') {
      score = Math.max(30, score - 15);
      rationale += ' (Adjusted: Multi-hour video is overly exhaustive for basic conceptual foundations).';
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      durationSeconds: d,
      preference,
      suitabilityRationale: rationale,
      isUnknownDuration: false,
    };
  }
}
