import type { RankingWeights, ResourceQualityBreakdown } from '../types';
import { extractDomain } from './url-utils';
import { DEFAULT_ENGINE_CONFIG } from '../config/engine-config';

export function clampScore(score: number, min = 0, max = 100): number {
  if (isNaN(score)) return min;
  return Math.min(Math.max(Math.round(score), min), max);
}

export function calculateSourceAuthorityScore(
  url: string,
  channelOrAuthor?: string
): number {
  const domain = extractDomain(url);
  const cfg = DEFAULT_ENGINE_CONFIG;

  // Check domain authority map
  for (const [authDomain, score] of Object.entries(cfg.authorityDomains)) {
    if (domain === authDomain || domain.endsWith('.' + authDomain)) {
      return score;
    }
  }

  // Check channel authority map
  if (channelOrAuthor) {
    const norm = channelOrAuthor.toLowerCase().trim();
    for (const [authChan, score] of Object.entries(cfg.authorityChannels)) {
      if (norm.includes(authChan) || authChan.includes(norm)) {
        return score;
      }
    }
  }

  // Baseline standard score for other valid web / educational sources
  return 55;
}

export function calculateFreshnessScore(
  publishedAtStr?: string,
  isFastEvolvingTopic = false
): number {
  if (!publishedAtStr) return 52; // Neutral baseline for unverified/missing dates (does not outrank verified fresh videos)
  try {
    const publishedDate = new Date(publishedAtStr);
    if (isNaN(publishedDate.getTime())) return 52;

    const now = new Date();
    const ageInMonths = Math.max(
      0,
      (now.getFullYear() - publishedDate.getFullYear()) * 12 +
        (now.getMonth() - publishedDate.getMonth())
    );

    if (isFastEvolvingTopic) {
      // Fast-moving disciplines (AI, LLMs, Web frameworks, Cloud) have higher temporal sensitivity
      if (ageInMonths <= 12) return 98;
      if (ageInMonths <= 24) return 92;
      if (ageInMonths <= 36) return 80;
      if (ageInMonths <= 48) return 68;
      if (ageInMonths <= 72) return 55;
      return 45; // Deprecated tech conventions
    }

    // Standard educational curriculum
    if (ageInMonths <= 12) return 98;
    if (ageInMonths <= 24) return 92;
    if (ageInMonths <= 36) return 85;
    if (ageInMonths <= 60) return 76;
    if (ageInMonths <= 84) return 68;
    return 58; // Foundational concepts remain accessible as evergreen fallback
  } catch {
    return 52;
  }
}

export function calculateWeightedRankScore(
  score: ResourceQualityBreakdown,
  authorityScore: number,
  weights: RankingWeights = DEFAULT_ENGINE_CONFIG.rankingWeights
): number {
  const weighted =
    (score.relevance * weights.relevance) +
    (score.educationalValue * weights.educationalValue) +
    (score.structureCompleteness * weights.structureCompleteness) +
    (score.freshness * weights.freshness) +
    (authorityScore * weights.sourceAuthority);

  return clampScore(weighted);
}
