import { ChapterTimestampReference } from '../types/distribution';

/**
 * Parses a timestamp string or integer into non-negative seconds.
 * Rejects negative, malformed, or non-numeric values.
 */
export function parseTimestampToSeconds(val?: string | number | null): number | null {
  if (val === undefined || val === null) return null;
  if (typeof val === 'number') {
    return Number.isFinite(val) && val >= 0 ? Math.floor(val) : null;
  }

  const s = String(val).trim();
  if (!s || s.startsWith('-')) return null;

  // Pure digits with optional trailing 's' (e.g. "120", "120s")
  if (/^\d+s?$/i.test(s)) {
    const sec = parseInt(s, 10);
    return Number.isFinite(sec) && sec >= 0 ? sec : null;
  }

  // Hours, minutes, seconds format: 1h30m20s, 45m, 90s
  const hmsMatch = s.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  if (hmsMatch && (hmsMatch[1] || hmsMatch[2] || hmsMatch[3])) {
    const h = parseInt(hmsMatch[1] || '0', 10);
    const m = parseInt(hmsMatch[2] || '0', 10);
    const sec = parseInt(hmsMatch[3] || '0', 10);
    const total = h * 3600 + m * 60 + sec;
    return total >= 0 ? total : null;
  }

  // Colon format: hh:mm:ss or mm:ss or m:ss (e.g. "01:23:45", "12:34", "0:45")
  const colonMatch = s.match(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})$/);
  if (colonMatch) {
    const h = colonMatch[1] ? parseInt(colonMatch[1], 10) : 0;
    const m = parseInt(colonMatch[2], 10);
    const sec = parseInt(colonMatch[3], 10);
    if (m >= 60 || sec >= 60) return null; // Invalid minute or second
    const total = h * 3600 + m * 60 + sec;
    return total >= 0 ? total : null;
  }

  return null;
}

/**
 * Formats integer seconds into a standardized mm:ss or hh:mm:ss timestamp string.
 */
export function formatSecondsToTimestamp(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  const mStr = String(m).padStart(2, '0');
  const sStr = String(s).padStart(2, '0');

  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${mStr}:${sStr}`;
  }
  return `${mStr}:${sStr}`;
}

/**
 * Generates an authentic deep link URL with timestamp parameter.
 * Preserves existing URL parameters (e.g. ?v=... on YouTube).
 */
export function generateDeepLinkUrl(baseUrl: string, seconds: number): string {
  if (!baseUrl || typeof baseUrl !== 'string') return '';
  const cleanSeconds = Math.max(0, Math.floor(seconds));

  try {
    const parsed = new URL(baseUrl.trim());
    const host = parsed.hostname.toLowerCase();

    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      parsed.searchParams.set('t', `${cleanSeconds}s`);
      return parsed.toString();
    }

    // Generic URLs: use standard 't' query parameter
    parsed.searchParams.set('t', String(cleanSeconds));
    return parsed.toString();
  } catch {
    // If not a parseable URL, append query or hash cleanly
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}t=${cleanSeconds}s`;
  }
}

/**
 * Extracts and validates genuine chapter markers from video description text.
 * Rejects timestamps exceeding known video duration, malformed rows, and out-of-range markers.
 */
export function extractChaptersFromDescription(
  description?: string,
  durationSeconds?: number,
  baseUrl?: string
): ChapterTimestampReference[] {
  if (!description || typeof description !== 'string') return [];

  const chapters: ChapterTimestampReference[] = [];
  const lines = description.split(/\r?\n/);

  // Pattern matches:
  // "00:00 Introduction"
  // "05:23 - Matrix Multiplication"
  // "1:15:30 Worked Solutions"
  // "12:45 | Step-by-step Proof"
  const lineRegex = /^(?:[\s*•-])*(?:(?:(\d{1,2}):)?(\d{1,2}):(\d{2}))\s*(?:[-–—:|]\s*)?([^\r\n]+)$/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(lineRegex);
    if (!match) continue;

    const h = match[1] ? parseInt(match[1], 10) : 0;
    const m = parseInt(match[2], 10);
    const s = parseInt(match[3], 10);
    const rawTitle = match[4]?.trim();

    if (m >= 60 || s >= 60 || !rawTitle) continue;

    const totalSeconds = h * 3600 + m * 60 + s;
    if (totalSeconds < 0) continue;

    // Reject timestamps that exceed known video duration
    if (durationSeconds !== undefined && durationSeconds > 0 && totalSeconds > durationSeconds) {
      continue;
    }

    const formatted = formatSecondsToTimestamp(totalSeconds);
    const cleanTitle = rawTitle.replace(/^[-\s:|]+/, '').trim();
    if (!cleanTitle) continue;

    const deepLinkUrl = baseUrl ? generateDeepLinkUrl(baseUrl, totalSeconds) : '';

    chapters.push({
      timestampFormatted: formatted,
      seconds: totalSeconds,
      title: cleanTitle.slice(0, 150),
      deepLinkUrl,
      provenance: 'parsed_description_timestamp',
      confidence: 0.85,
    });
  }

  // Sort chronologically by seconds
  chapters.sort((a, b) => a.seconds - b.seconds);

  // Deduplicate timestamps on identical seconds
  const uniqueMap = new Map<number, ChapterTimestampReference>();
  for (const chap of chapters) {
    if (!uniqueMap.has(chap.seconds)) {
      uniqueMap.set(chap.seconds, chap);
    }
  }

  return Array.from(uniqueMap.values());
}
