import { SearchQueryItem, PlannerConfig, DEFAULT_PLANNER_CONFIG } from '../types';

const COMMON_STOP_WORDS = new Set([
  'a', 'an', 'the', 'in', 'on', 'at', 'for', 'to', 'of', 'and', 'with',
  'by', 'from', 'about', 'as', 'into', 'through', 'during', 'before', 'after',
]);

/**
 * Deduplicates and prunes redundant search query candidates.
 * Detects word-order permutations, token overlaps, and enforces diversity limits.
 */
export class QueryDeduplicator {
  /**
   * Generates a normalized token signature for detecting word-order permutations.
   */
  public static getCanonicalSignature(queryStr: string): string {
    const tokens = queryStr
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .split(/\s+/)
      .filter((t) => t.length > 1 && !COMMON_STOP_WORDS.has(t));

    tokens.sort();
    return Array.from(new Set(tokens)).join(' ');
  }

  /**
   * Computes Jaccard similarity between two token sets.
   */
  public static calculateTokenSimilarity(queryA: string, queryB: string): number {
    const tokensA = new Set(
      queryA.toLowerCase().split(/\s+/).filter((t) => t.length > 2 && !COMMON_STOP_WORDS.has(t))
    );
    const tokensB = new Set(
      queryB.toLowerCase().split(/\s+/).filter((t) => t.length > 2 && !COMMON_STOP_WORDS.has(t))
    );

    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    let intersection = 0;
    for (const t of tokensA) {
      if (tokensB.has(t)) intersection++;
    }

    const union = new Set([...tokensA, ...tokensB]).size;
    return union === 0 ? 0 : intersection / union;
  }

  /**
   * Deduplicates queries while respecting priority and diversity limits.
   */
  public static deduplicate(
    candidates: SearchQueryItem[],
    config: PlannerConfig = {}
  ): SearchQueryItem[] {
    const maxTotal = config.maxTotalQueries ?? DEFAULT_PLANNER_CONFIG.maxTotalQueries;
    const maxPerIntent = config.maxQueriesPerIntent ?? DEFAULT_PLANNER_CONFIG.maxQueriesPerIntent;
    const maxPerModality = config.maxQueriesPerModality ?? DEFAULT_PLANNER_CONFIG.maxQueriesPerModality;

    // 1. Sort candidates by priority ascending (1 is highest priority)
    const sorted = [...candidates].sort((a, b) => a.priority - b.priority);

    const retained: SearchQueryItem[] = [];
    const seenSignatures = new Set<string>();
    const seenExactModalityQueries = new Set<string>();
    const countByIntent = new Map<string, number>();
    const countByModality = new Map<string, number>();

    for (const item of sorted) {
      if (retained.length >= maxTotal) break;

      const normalizedQuery = item.queryString.trim().toLowerCase();
      const exactModalityKey = `${item.preferredModality}::${normalizedQuery}`;

      // 1. Skip exact duplicate query string for the same modality
      if (seenExactModalityQueries.has(exactModalityKey)) {
        continue;
      }

      // 2. Check for token permutation collision within the same intent and modality
      const signature = QueryDeduplicator.getCanonicalSignature(item.queryString);
      const signatureKey = `${item.intent}::${item.preferredModality}::${signature}`;

      if (seenSignatures.has(signatureKey)) {
        continue; // Skip redundant permutation for the same intent and modality
      }

      // 3. Check for fuzzy token overlap with already retained queries of the SAME intent and modality
      // Allows distinct educational intents (e.g. worked solutions vs conceptual derivations vs monographs)
      // to retain their concept terms without premature pruning.
      const hasHighOverlap = retained.some(
        (existing) =>
          existing.intent === item.intent &&
          existing.preferredModality === item.preferredModality &&
          QueryDeduplicator.calculateTokenSimilarity(existing.queryString, item.queryString) >= 0.8
      );
      if (hasHighOverlap) {
        continue;
      }

      // 4. Check intent limit
      const currentIntentCount = countByIntent.get(item.intent) || 0;
      if (currentIntentCount >= maxPerIntent) {
        continue;
      }

      // 5. Check modality limit
      const currentModalityCount = countByModality.get(item.preferredModality) || 0;
      if (currentModalityCount >= maxPerModality) {
        continue;
      }

      // Query passed all filters; retain it
      retained.push(item);
      seenSignatures.add(signatureKey);
      seenExactModalityQueries.add(exactModalityKey);
      countByIntent.set(item.intent, currentIntentCount + 1);
      countByModality.set(item.preferredModality, currentModalityCount + 1);
    }

    return retained;
  }
}
