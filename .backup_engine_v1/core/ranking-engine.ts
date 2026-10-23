import { EngineResource, RankedItem, DiversityConfig, RankingWeights } from '../types';
import { calculateSourceAuthorityScore, calculateWeightedRankScore } from '../utils/scoring-utils';
import { extractDomain } from '../utils/url-utils';
import { DEFAULT_ENGINE_CONFIG } from '../config/engine-config';

export class RankingEngine {
  constructor(
    private weights: RankingWeights = DEFAULT_ENGINE_CONFIG.rankingWeights,
    private diversity: DiversityConfig = DEFAULT_ENGINE_CONFIG.diversity
  ) {}

  rank(resources: EngineResource[], limit = 12): RankedItem[] {
    if (resources.length === 0) return [];

    // 1. Calculate final weighted scores for each resource
    const scoredList = resources.map((res) => {
      const authorityScore = calculateSourceAuthorityScore(res.canonicalUrl, res.authorOrChannel);
      let finalScore = calculateWeightedRankScore(res.score, authorityScore, this.weights);

      // Prioritize educational videos with appropriate duration, practical depth, and freshness when topic relevance is verified
      const isVideo = res.type === 'video_lecture' || res.type === 'youtube_playlist' || res.type === 'full_course';
      if (isVideo && res.score?.relevance && res.score.relevance >= 60) {
        // Duration suitability contribution
        const durationSuit = res.score?.durationSuitability ?? res.durationSuitabilityScore ?? (res.metadata?.durationSuitabilityScore as number);
        if (typeof durationSuit === 'number') {
          if (durationSuit >= 92) {
            finalScore = Math.min(99, finalScore + 2);
          } else if (durationSuit < 45) {
            finalScore = Math.max(1, finalScore - 4);
          }
        }

        // Practical learning signals contribution
        const practicalScore = res.score?.practicalDepth ?? res.practicalDepthScore ?? (res.metadata?.practicalDepthScore as number);
        if (typeof practicalScore === 'number' && practicalScore >= 65) {
          finalScore = Math.min(99, finalScore + 2);
        }

        const freshness = res.score?.freshness ?? 50;
        if (freshness >= 85) {
          finalScore = Math.min(99, finalScore + 2);
        }
      }

      return {
        resource: res,
        finalScore,
        domainOrAuthor: (res.authorOrChannel || extractDomain(res.canonicalUrl)).toLowerCase(),
      };
    });

    // 2. Sort candidates by finalScore descending, with practical depth and recency tie-breaking
    scoredList.sort((a, b) => {
      if (Math.abs(a.finalScore - b.finalScore) <= 4) {
        const relA = a.resource.score?.relevance ?? 0;
        const relB = b.resource.score?.relevance ?? 0;
        // Significant relevance gap always wins
        if (Math.abs(relA - relB) >= 6) {
          return relB - relA;
        }

        // Practical depth preference for technical learning
        const practA = a.resource.score?.practicalDepth ?? a.resource.practicalDepthScore ?? (a.resource.metadata?.practicalDepthScore as number) ?? 50;
        const practB = b.resource.score?.practicalDepth ?? b.resource.practicalDepthScore ?? (b.resource.metadata?.practicalDepthScore as number) ?? 50;
        if (Math.abs(practA - practB) >= 15 && relA >= 60 && relB >= 60) {
          return practB - practA;
        }

        if (relA >= 60 && relB >= 60) {
          const freshA = a.resource.score?.freshness ?? 50;
          const freshB = b.resource.score?.freshness ?? 50;
          if (freshA !== freshB) return freshB - freshA;
        }
      }
      return b.finalScore - a.finalScore;
    });

    // 3. Apply diversity allocation and domain limits
    const domainCounts = new Map<string, number>();
    const typeCounts = new Map<string, number>();
    const selected: Array<{ resource: EngineResource; finalScore: number; reason: string }> = [];

    // Phase A: Select items respecting diversity slot minimums and domain maximums
    for (const item of scoredList) {
      if (selected.length >= limit) break;

      const domain = item.domainOrAuthor;
      const curDomainCount = domainCounts.get(domain) || 0;
      if (curDomainCount >= this.diversity.maxPerDomainOrChannel) {
        continue; // Prevent single-source dominance
      }

      const type = item.resource.type;
      const curTypeCount = typeCounts.get(type) || 0;
      const slotDef = this.diversity.slots.find((s) => s.type === type);

      if (slotDef && curTypeCount >= slotDef.max) {
        continue; // Exceeded category ceiling
      }

      domainCounts.set(domain, curDomainCount + 1);
      typeCounts.set(type, curTypeCount + 1);

      selected.push({
        resource: item.resource,
        finalScore: item.finalScore,
        reason: `Ranked #${selected.length + 1} with composite quality score ${item.finalScore}/100`,
      });
    }

    // Phase B: If slots still open, fill with remaining highest scoring items that meet minimum quality
    if (selected.length < limit) {
      for (const item of scoredList) {
        if (selected.length >= limit) break;
        if (selected.some((s) => s.resource.id === item.resource.id)) continue;

        // Strictly reject candidates with low composite score or poor relevance
        if (item.finalScore < 50) continue;
        if (item.resource.score?.relevance !== undefined && item.resource.score.relevance < 40) continue;

        const domain = item.domainOrAuthor;
        const curDomainCount = domainCounts.get(domain) || 0;
        if (curDomainCount >= this.diversity.maxPerDomainOrChannel + 1) continue;

        domainCounts.set(domain, curDomainCount + 1);
        selected.push({
          resource: item.resource,
          finalScore: item.finalScore,
          reason: `High scoring candidate (${item.finalScore}/100) added for comprehensive coverage`,
        });
      }
    }

    // Format output as RankedItem with 1-based ranks
    return selected.map((item, index) => ({
      resource: item.resource,
      finalScore: item.finalScore,
      rank: index + 1,
      reason: item.reason,
    }));
  }
}
