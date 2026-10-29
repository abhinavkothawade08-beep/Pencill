import { NormalizedResource } from './types';
import { extractYouTubeVideoId } from './normalizer';

export function validateResource(res: NormalizedResource): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!res.title || res.title.trim().length === 0) {
    errors.push('Resource title cannot be empty.');
  }

  if (!res.canonicalUrl) {
    errors.push('Resource must have a canonical URL.');
  } else {
    try {
      const parsed = new URL(res.canonicalUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        errors.push(`Invalid protocol: ${parsed.protocol}`);
      }
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '0.0.0.0') {
        errors.push('Resource URL cannot be localhost or private loopback.');
      }
    } catch {
      errors.push(`Malformed URL: ${res.canonicalUrl}`);
    }
  }

  if (res.durationSeconds <= 0) {
    errors.push('Resource duration must be greater than zero.');
  }

  if (res.modality === 'video' && res.isEmbeddable === false) {
    errors.push('Video resource must be embeddable.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function deduplicateResources<T extends NormalizedResource>(resources: T[]): T[] {
  const seenUrls = new Set<string>();
  const seenVideoIds = new Set<string>();
  const unique: T[] = [];

  for (const r of resources) {
    const urlLower = r.canonicalUrl.toLowerCase();
    const vidId = extractYouTubeVideoId(r.canonicalUrl);

    if (seenUrls.has(urlLower)) continue;
    if (vidId && seenVideoIds.has(vidId)) continue;

    seenUrls.add(urlLower);
    if (vidId) seenVideoIds.add(vidId);
    unique.push(r);
  }

  return unique;
}
