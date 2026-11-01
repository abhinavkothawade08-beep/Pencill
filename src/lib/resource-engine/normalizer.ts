import {
  RawCandidateResource,
  NormalizedResource,
} from './types';

export function normalizeCandidateResource(raw: RawCandidateResource): NormalizedResource {
  const canonicalUrl = canonicalizeUrl(raw.url);
  const durationSeconds = Math.max(60, raw.durationSeconds || 1200);
  const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

  let embedUrl: string | undefined;
  const ytId = extractYouTubeVideoId(canonicalUrl);
  if (ytId) {
    embedUrl = `https://www.youtube-nocookie.com/embed/${ytId}`;
  }

  const isVerifiedEducator = Boolean(
    raw.rawMetadata?.isVerifiedEducator ||
    raw.providerId === 'curated_directory'
  );

  let discoverySource: NormalizedResource['discoverySource'] = 'open_discovery';
  if (isVerifiedEducator) {
    discoverySource = 'master_educator_directory';
  } else if (raw.providerId === 'official_docs') {
    discoverySource = 'official_docs';
  } else if (raw.providerId === 'arxiv' || raw.providerId === 'openstax') {
    discoverySource = 'scholarly_repo';
  }

  return {
    id: `res-${raw.providerId}-${raw.externalId || generateSimpleHash(canonicalUrl)}`,
    providerId: raw.providerId,
    externalId: raw.externalId || ytId || generateSimpleHash(canonicalUrl),
    title: sanitizeTitle(raw.title),
    canonicalUrl,
    url: canonicalUrl,
    embedUrl,
    description: raw.description ? raw.description.trim() : `Educational ${raw.modality} resource.`,
    modality: raw.modality,
    authorOrChannel: raw.authorOrChannel?.trim() || 'Educational Creator',
    channelId: raw.channelId,
    durationSeconds,
    durationMinutes,
    isEmbeddable: raw.isEmbeddable !== false,
    thumbnailUrl: raw.thumbnailUrl,
    publishedDate: raw.publishedDate,
    educatorId: raw.rawMetadata?.educatorId as string | undefined,
    isVerifiedEducator,
    discoverySource,
  };
}

export function canonicalizeUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  try {
    const url = new URL(rawUrl.trim());
    if (url.protocol === 'http:' && !url.hostname.includes('localhost') && !url.hostname.includes('127.0.0.1')) {
      url.protocol = 'https:';
    }
    // Normalize YouTube URLs
    if (url.hostname.includes('youtu.be')) {
      const vid = url.pathname.replace(/^\//, '');
      return `https://www.youtube.com/watch?v=${vid}`;
    }
    if (url.hostname.includes('youtube.com')) {
      const vid = url.searchParams.get('v');
      if (vid) {
        return `https://www.youtube.com/watch?v=${vid}`;
      }
    }
    // Strip common tracking parameters
    const paramsToStrip = ['utm_source', 'utm_medium', 'utm_campaign', 'si', 'feature', 'fbclid'];
    for (const p of paramsToStrip) {
      url.searchParams.delete(p);
    }
    return url.toString();
  } catch {
    return rawUrl.trim();
  }
}

export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/i);
  return match ? match[1] : null;
}

function sanitizeTitle(rawTitle: string): string {
  if (!rawTitle) return 'Educational Resource';
  return rawTitle
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function generateSimpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
