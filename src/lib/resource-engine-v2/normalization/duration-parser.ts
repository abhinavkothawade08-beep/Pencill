/**
 * Duration Parser for Pencill Resource Engine 2.0
 * 
 * Accurately parses ISO 8601 duration strings into genuine durations in seconds.
 * 
 * Strict Invariants:
 * - Returns exact seconds when valid ISO 8601 duration is present.
 * - Returns 0 for valid zero duration (e.g. PT0S).
 * - Returns undefined when duration is missing or unparseable.
 * - NEVER fabricates or guesses a duration (no defaulting to 20 or 120 minutes).
 */

/**
 * Parses an ISO 8601 duration string into seconds.
 * Supports standard format: P[n]Y[n]M[n]W[n]DT[n]H[n]M[n]S or PT[n]H[n]M[n]S.
 * 
 * @returns duration in seconds, or undefined if invalid/missing
 */
export function parseIsoDurationToSeconds(isoStr?: string | null): number | undefined {
  if (!isoStr || typeof isoStr !== 'string') {
    return undefined;
  }

  const trimmed = isoStr.trim();
  if (!trimmed) {
    return undefined;
  }

  // Check for standard ISO 8601 duration pattern
  const isoRegex = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i;
  const match = trimmed.match(isoRegex);

  if (!match) {
    // Fallback: simplified PT pattern
    const simpleMatch = trimmed.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
    if (!simpleMatch) {
      return undefined;
    }

    const h = parseInt(simpleMatch[1] || '0', 10);
    const m = parseInt(simpleMatch[2] || '0', 10);
    const s = parseInt(simpleMatch[3] || '0', 10);

    return h * 3600 + m * 60 + s;
  }

  const years = parseInt(match[1] || '0', 10);
  const months = parseInt(match[2] || '0', 10);
  const weeks = parseInt(match[3] || '0', 10);
  const days = parseInt(match[4] || '0', 10);
  const hours = parseInt(match[5] || '0', 10);
  const minutes = parseInt(match[6] || '0', 10);
  const seconds = parseFloat(match[7] || '0');

  // Verify at least one component was present
  if (
    !match[1] &&
    !match[2] &&
    !match[3] &&
    !match[4] &&
    !match[5] &&
    !match[6] &&
    !match[7]
  ) {
    return undefined;
  }

  const totalDays = years * 365 + months * 30 + weeks * 7 + days;
  const totalSeconds = totalDays * 86400 + hours * 3600 + minutes * 60 + seconds;

  if (isNaN(totalSeconds) || totalSeconds < 0) {
    return undefined;
  }

  return Math.round(totalSeconds);
}
