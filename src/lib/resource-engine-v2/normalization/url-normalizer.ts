/**
 * Canonical URL Normalizer and Validator for Pencill Resource Engine 2.0
 */

const FORBIDDEN_SCHEMES = ['javascript:', 'data:', 'vbscript:', 'file:'];
const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  'si',
  'feature',
  'ref',
  'referral',
]);

/**
 * Validates that a string is a legitimate web URL (http: or https:)
 * and strips tracking query parameters.
 */
export function validateAndCanonicalizeUrl(urlStr?: string | null): string | null {
  if (!urlStr || typeof urlStr !== 'string') return null;
  const trimmed = urlStr.trim();
  if (!trimmed) return null;

  for (const forbidden of FORBIDDEN_SCHEMES) {
    if (trimmed.toLowerCase().startsWith(forbidden)) return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    // Strip tracking parameters
    for (const param of Array.from(parsed.searchParams.keys())) {
      if (TRACKING_PARAMS.has(param.toLowerCase())) {
        parsed.searchParams.delete(param);
      }
    }

    // Clean trailing slash if path is only '/'
    let res = parsed.toString();
    if (parsed.pathname === '/' && !parsed.search && !parsed.hash) {
      res = `${parsed.protocol}//${parsed.host}`;
    }

    return res;
  } catch {
    return null;
  }
}

/**
 * Generates canonical YouTube video URL.
 */
export function buildYouTubeVideoUrl(videoId: string): string {
  const cleanId = videoId.trim();
  return `https://www.youtube.com/watch?v=${cleanId}`;
}

/**
 * Generates canonical YouTube playlist URL.
 */
export function buildYouTubePlaylistUrl(playlistId: string): string {
  const cleanId = playlistId.trim();
  return `https://www.youtube.com/playlist?list=${cleanId}`;
}

/**
 * Extracts YouTube video or playlist ID from an arbitrary URL.
 */
export function extractYouTubeIds(url: string): { videoId?: string; playlistId?: string } {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    // Check for youtu.be shortlinks
    if (host === 'youtu.be') {
      const vid = parsed.pathname.slice(1).split('/')[0];
      return { videoId: vid || undefined };
    }

    if (host.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v') || undefined;
      const playlistId = parsed.searchParams.get('list') || undefined;

      if (parsed.pathname.startsWith('/embed/')) {
        const embedId = parsed.pathname.split('/embed/')[1]?.split('?')[0];
        return { videoId: embedId || undefined, playlistId };
      }

      return { videoId, playlistId };
    }

    return {};
  } catch {
    return {};
  }
}

/**
 * Generates canonical arXiv URLs.
 */
export function buildArxivUrls(arxivId: string): { canonicalUrl: string; pdfUrl: string } {
  const cleanId = arxivId.replace(/^arxiv:/i, '').trim();
  return {
    canonicalUrl: `https://arxiv.org/abs/${cleanId}`,
    pdfUrl: `https://arxiv.org/pdf/${cleanId}.pdf`,
  };
}
