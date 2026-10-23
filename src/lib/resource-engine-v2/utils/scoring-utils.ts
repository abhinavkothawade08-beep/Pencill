import type { LegacyRankingWeights, ResourceQualityBreakdown } from '../types/legacy-contracts';
import { extractDomain } from './url-utils';

export const DEFAULT_AUTHORITY_DOMAINS: Record<string, number> = {
  'ocw.mit.edu': 95,
  'mit.edu': 95,
  'nptel.ac.in': 92,
  'khanacademy.org': 90,
  'stanford.edu': 95,
  'harvard.edu': 95,
  'berkeley.edu': 95,
  'cmu.edu': 95,
  'ox.ac.uk': 94,
  'cam.ac.uk': 94,
  'arxiv.org': 93,
  'openalex.org': 93,
  'ncert.nic.in': 90,
  'physicsclassroom.com': 85,
  'libretexts.org': 88,
  'geeksforgeeks.org': 80,
  'brilliant.org': 85,
  'openstax.org': 92,
  'coursera.org': 88,
  'edx.org': 88,
};

export const DEFAULT_AUTHORITY_CHANNELS: Record<string, number> = {
  '3blue1brown': 98,
  'mit opencourseware': 96,
  'khan academy': 92,
  'freecodecamp.org': 92,
  'statquest with josh starmer': 94,
  'abdul bari': 94,
  'corey schafer': 90,
  'traversy media': 88,
  'neso academy': 90,
  'dinesh sir': 90,
  'pawan wagh': 90,
  'mohit tyagi': 92,
  'physics wallah': 88,
};

export const DEFAULT_RANKING_WEIGHTS: LegacyRankingWeights = {
  relevance: 0.40,
  educationalValue: 0.25,
  structureCompleteness: 0.15,
  freshness: 0.10,
  sourceAuthority: 0.10,
};

export function clampScore(score: number, min = 0, max = 100): number {
  if (isNaN(score)) return min;
  return Math.min(Math.max(Math.round(score), min), max);
}

export function calculateSourceAuthorityScore(
  url: string,
  channelOrAuthor?: string
): number {
  const domain = extractDomain(url);

  // Check domain authority map
  for (const [authDomain, score] of Object.entries(DEFAULT_AUTHORITY_DOMAINS)) {
    if (domain === authDomain || domain.endsWith('.' + authDomain)) {
      return score;
    }
  }

  // Check channel authority map
  if (channelOrAuthor) {
    const norm = channelOrAuthor.toLowerCase().trim();
    for (const [authChan, score] of Object.entries(DEFAULT_AUTHORITY_CHANNELS)) {
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
  weights: LegacyRankingWeights = DEFAULT_RANKING_WEIGHTS
): number {
  const weighted =
    (score.relevance * weights.relevance) +
    (score.educationalValue * weights.educationalValue) +
    (score.structureCompleteness * weights.structureCompleteness) +
    (score.freshness * weights.freshness) +
    (authorityScore * weights.sourceAuthority);

  return clampScore(weighted);
}
