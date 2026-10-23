export function extractDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function extractYouTubeVideoId(urlStr: string): string | null {
  if (!urlStr || typeof urlStr !== 'string') return null;
  const trimmed = urlStr.trim();
  
  // Direct 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    // Add protocol if user/system passed domain without protocol
    const urlToParse = /^[a-zA-Z0-9_-]+\.[a-zA-Z]{2,}/.test(trimmed) && !trimmed.startsWith('http')
      ? `https://${trimmed}`
      : trimmed;
    const parsed = new URL(urlToParse);
    const hostname = parsed.hostname.toLowerCase().replace(/^(www\.|m\.|music\.)/, '');

    if (hostname === 'youtube.com' || hostname === 'youtube-nocookie.com') {
      const v = parsed.searchParams.get('v') || parsed.searchParams.get('vi') || parsed.searchParams.get('video_id');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

      const pathSegments = parsed.pathname.split('/').filter(Boolean);
      const prefix = pathSegments[0]?.toLowerCase();
      if (['embed', 'v', 'shorts', 'live', 'watch'].includes(prefix || '')) {
        const id = pathSegments[1];
        if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
      }
    } else if (hostname === 'youtu.be') {
      const id = parsed.pathname.slice(1).split('/')[0];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
  } catch {
    // Malformed URL - try regex fallback across entire string
    const match = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Parses timestamp string or number into total seconds.
 * Supports formats: "90", "90s", "1m30s", "1h2m30s", "01:30", "01:15:30".
 */
export function parseTimestampToSeconds(val?: string | number | null): number | null {
  if (val === undefined || val === null) return null;
  if (typeof val === 'number') return val >= 0 ? Math.floor(val) : null;
  const s = String(val).trim();
  if (!s) return null;

  // Pure integer / digits with optional 's'
  if (/^\d+s?$/i.test(s)) {
    return parseInt(s, 10);
  }

  // e.g. 1h2m3s, 2m30s, 90s
  const hmsMatch = s.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  if (hmsMatch && (hmsMatch[1] || hmsMatch[2] || hmsMatch[3])) {
    const h = parseInt(hmsMatch[1] || '0', 10);
    const m = parseInt(hmsMatch[2] || '0', 10);
    const sec = parseInt(hmsMatch[3] || '0', 10);
    return h * 3600 + m * 60 + sec;
  }

  // e.g. 01:23:45 or 12:34
  const colonMatch = s.match(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})$/);
  if (colonMatch) {
    const h = colonMatch[1] ? parseInt(colonMatch[1], 10) : 0;
    const m = parseInt(colonMatch[2], 10);
    const sec = parseInt(colonMatch[3], 10);
    return h * 3600 + m * 60 + sec;
  }

  return null;
}

/**
 * Extracts timestamp in seconds from a URL if present (e.g. ?t=120s or &start=90).
 */
export function extractTimestampFromUrl(urlStr: string): number | null {
  try {
    const parsed = new URL(urlStr.trim());
    const tParam = parsed.searchParams.get('t') || parsed.searchParams.get('start');
    if (tParam) {
      return parseTimestampToSeconds(tParam);
    }
  } catch {
    const match = urlStr.match(/[?&](?:t|start)=([^&#]+)/i);
    if (match && match[1]) {
      return parseTimestampToSeconds(match[1]);
    }
  }
  return null;
}

export interface VideoChapter {
  title: string;
  timestampSeconds: number;
  timestampFormatted: string;
}

/**
 * Extracts chapter markers from video description (e.g. "02:30 Variables and Syntax").
 */
export function extractVideoChapters(description?: string): VideoChapter[] {
  if (!description || typeof description !== 'string') return [];
  const chapters: VideoChapter[] = [];
  const lines = description.split(/\r?\n/);

  // Regex matches timestamps like 0:00, 00:00, 1:23:45 at start of line or after bullet/separator
  const chapterRegex = /(?:^|\s*[-–—•|]?\s*)(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s*[-–—:|]?\s*(.+)$/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(chapterRegex);
    if (match) {
      const h = match[1] ? parseInt(match[1], 10) : 0;
      const m = parseInt(match[2], 10);
      const s = parseInt(match[3], 10);
      const seconds = h * 3600 + m * 60 + s;
      const title = match[4].trim().replace(/^[-–—:|]+/, '').trim();
      if (title.length >= 2) {
        chapters.push({
          title,
          timestampSeconds: seconds,
          timestampFormatted: h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`,
        });
      }
    }
  }

  return chapters.sort((a, b) => a.timestampSeconds - b.timestampSeconds);
}

/**
 * Formats a YouTube URL with a specific start timestamp in seconds (e.g. &t=120s).
 */
export function formatYouTubeTimestampUrl(baseUrl: string, seconds: number): string {
  const videoId = extractYouTubeVideoId(baseUrl);
  if (!videoId) return baseUrl;
  if (seconds <= 0) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(seconds)}s`;
}

/**
 * Extracts a normalized, provider-agnostic video key (e.g. yt:dQw4w9WgXcQ)
 */
export function extractCanonicalVideoKey(urlStr: string, externalId?: string): string | null {
  const ytId = extractYouTubeVideoId(urlStr) || (externalId && extractYouTubeVideoId(externalId));
  if (ytId) return `yt:${ytId}`;

  const ytListId = extractYouTubePlaylistId(urlStr);
  if (ytListId) return `yt_list:${ytListId}`;

  return null;
}

export function extractYouTubePlaylistId(urlStr: string): string | null {
  try {
    const parsed = new URL(urlStr.trim());
    const hostname = parsed.hostname.toLowerCase().replace(/^(www\.|m\.)/, '');
    if (hostname === 'youtube.com' || hostname === 'youtube-nocookie.com') {
      const list = parsed.searchParams.get('list');
      if (list && /^[a-zA-Z0-9_-]+$/.test(list)) return list;
    }
  } catch {
    // Malformed URL - try regex fallback
    const match = urlStr.match(/[?&]list=([a-zA-Z0-9_-]+)/i);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

export function canonicalizeUrl(rawUrl: string, options?: { preserveTimestamp?: boolean }): string {
  try {
    const parsed = new URL(rawUrl.trim());
    
    // Normalize YouTube URLs
    const ytVideoId = extractYouTubeVideoId(rawUrl);
    if (ytVideoId) {
      if (options?.preserveTimestamp) {
        const timestamp = extractTimestampFromUrl(rawUrl);
        if (timestamp && timestamp > 0) {
          return `https://www.youtube.com/watch?v=${ytVideoId}&t=${Math.floor(timestamp)}s`;
        }
      }
      return `https://www.youtube.com/watch?v=${ytVideoId}`;
    }

    const ytPlaylistId = extractYouTubePlaylistId(rawUrl);
    if (ytPlaylistId) {
      return `https://www.youtube.com/playlist?list=${ytPlaylistId}`;
    }

    // Strip common tracking and referral query parameters
    const paramsToStrip = new Set([
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      'ref',
      'ref_src',
      'si', // YouTube share tracking
      'feature',
      'tracker',
    ]);

    const keysToDelete: string[] = [];
    parsed.searchParams.forEach((_, key) => {
      const lk = key.toLowerCase();
      if (paramsToStrip.has(lk) || lk.startsWith('utm_') || lk.startsWith('track')) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((k) => parsed.searchParams.delete(k));

    // Remove hash/fragment unless essential
    parsed.hash = '';

    // Remove trailing slash if path is longer than /
    let clean = parsed.toString();
    if (clean.endsWith('/') && parsed.pathname.length > 1) {
      clean = clean.slice(0, -1);
    }
    return clean;
  } catch {
    return rawUrl.trim();
  }
}

export function isValidUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
