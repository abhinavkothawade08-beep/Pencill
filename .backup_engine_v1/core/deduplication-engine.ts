import { EngineResource } from '../types';
import { calculateTitleSimilarity, tokenize } from '../utils/text-utils';
import {
  extractCanonicalVideoKey,
  canonicalizeUrl,
  extractYouTubeVideoId,
  extractYouTubePlaylistId,
} from '../utils/url-utils';

export class DeduplicationEngine {
  /**
   * Deduplicates candidate resources across:
   * 1. Canonical Video IDs (e.g., YouTube 11-char ID)
   * 2. Canonicalized URLs (stripped tracking, normalized domains)
   * 3. Playlist Membership (same playlist ID or playlist membership)
   * 4. Cross-provider representations
   * 5. Semantic redundancy (pruning repetitive content while preserving diverse pedagogical approaches)
   */
  deduplicate(resources: EngineResource[]): EngineResource[] {
    const videoKeyMap = new Map<string, EngineResource>();
    const canonicalUrlMap = new Map<string, EngineResource>();
    const playlistIdMap = new Map<string, EngineResource>();
    const uniqueList: EngineResource[] = [];

    for (const res of resources) {
      // Clean and normalize URLs
      const cleanCanonical = canonicalizeUrl(res.canonicalUrl || res.sourceUrl);
      res.canonicalUrl = cleanCanonical;

      // Extract canonical video key (e.g. yt:VIDEO_ID)
      const rawYtId =
        extractYouTubeVideoId(res.externalId || '') ||
        extractYouTubeVideoId(res.canonicalUrl || '') ||
        extractYouTubeVideoId(res.sourceUrl || '');

      if (rawYtId) {
        res.externalId = rawYtId;
        if (!res.metadata) res.metadata = {};
        res.metadata.videoId = rawYtId;
      }

      const videoKey = extractCanonicalVideoKey(res.canonicalUrl, res.externalId);

      // Extract playlist ID if applicable
      const playlistId =
        (res.metadata?.playlistId as string) ||
        extractYouTubePlaylistId(res.canonicalUrl) ||
        extractYouTubePlaylistId(res.sourceUrl);
      if (playlistId && !res.metadata?.playlistId) {
        if (!res.metadata) res.metadata = {};
        res.metadata.playlistId = playlistId;
      }

      // 1. Check exact video key match across all providers
      if (videoKey && videoKeyMap.has(videoKey)) {
        const existing = videoKeyMap.get(videoKey)!;
        this.mergeResources(existing, res);
        continue;
      }

      // 2. Check canonical URL match
      if (cleanCanonical && canonicalUrlMap.has(cleanCanonical)) {
        const existing = canonicalUrlMap.get(cleanCanonical)!;
        this.mergeResources(existing, res);
        continue;
      }

      // 3. Check playlist ID match for playlist resources
      const isPlaylist = res.type === 'youtube_playlist' || Boolean(res.metadata?.isPlaylist);
      if (isPlaylist && playlistId && playlistIdMap.has(playlistId)) {
        const existing = playlistIdMap.get(playlistId)!;
        this.mergeResources(existing, res);
        continue;
      }

      // 4. Semantic similarity & repetition check
      let isRedundantDuplicate = false;
      for (const existing of uniqueList) {
        const isSameAuthor =
          Boolean(existing.authorOrChannel &&
          res.authorOrChannel &&
          existing.authorOrChannel.toLowerCase().trim() === res.authorOrChannel.toLowerCase().trim());

        const titleSim = calculateTitleSimilarity(existing.title, res.title);
        const existingPedagogy = this.detectPedagogicalRole(existing.title);
        const candidatePedagogy = this.detectPedagogicalRole(res.title);

        // Same channel with high title similarity & same pedagogical intent (ignoring year differences like 2023 vs 2024)
        // CRITICAL SAFETY GUARD: Never merge distinct classes, parts, chapters, or semesters (e.g. Class 10 vs Class 12, Part 1 vs Part 2)
        const cleanA = existing.title.replace(/\b(19|20)\d{2}\b/g, '').toLowerCase();
        const cleanB = res.title.replace(/\b(19|20)\d{2}\b/g, '').toLowerCase();
        const partsA = new Set(cleanA.match(/\b(\d+|[ivx]+|part\s*\d+|class\s*\d+|grade\s*\d+|ch\s*\d+|chapter\s*\d+|day\s*\d+|sem\s*\d+)\b/g) || []);
        const partsB = new Set(cleanB.match(/\b(\d+|[ivx]+|part\s*\d+|class\s*\d+|grade\s*\d+|ch\s*\d+|chapter\s*\d+|day\s*\d+|sem\s*\d+)\b/g) || []);
        const hasIdenticalParts = partsA.size === partsB.size && Array.from(partsA).every((p) => partsB.has(p));

        const cleanTitleExisting = existing.title.replace(/\b(19|20)\d{2}\b/g, '').trim();
        const cleanTitleRes = res.title.replace(/\b(19|20)\d{2}\b/g, '').trim();
        const sameAuthorTitleSim = calculateTitleSimilarity(cleanTitleExisting, cleanTitleRes);

        if (isSameAuthor && hasIdenticalParts && sameAuthorTitleSim >= 0.80 && existingPedagogy === candidatePedagogy) {
          this.mergeResources(existing, res);
          isRedundantDuplicate = true;
          break;
        }

        // Different creators with very high title similarity (re-uploads or identical topics)
        if (titleSim >= 0.88 && existingPedagogy === candidatePedagogy) {
          this.mergeResources(existing, res);
          isRedundantDuplicate = true;
          break;
        }

        // Both are broad full-length course tutorials for the exact same subject
        const isBothBroadFullCourses =
          (existing.type === 'full_course' || Boolean(existing.metadata?.isFullCourse) || /\b(full course|complete course|masterclass)\b/i.test(existing.title)) &&
          (res.type === 'full_course' || Boolean(res.metadata?.isFullCourse) || /\b(full course|complete course|masterclass)\b/i.test(res.title));

        if (isBothBroadFullCourses) {
          const existingTokens = tokenize(existing.title);
          const candTokens = tokenize(res.title);
          let sharedConcepts = 0;
          for (const tok of candTokens) {
            if (existingTokens.has(tok)) sharedConcepts++;
          }
          const overlap = sharedConcepts / Math.max(Math.min(existingTokens.size, candTokens.size), 1);
          if (overlap >= 0.70) {
            // Merge into higher quality full course tutorial
            this.mergeResources(existing, res);
            isRedundantDuplicate = true;
            break;
          }
        }
      }

      if (isRedundantDuplicate) continue;

      // Register and keep candidate
      if (videoKey) videoKeyMap.set(videoKey, res);
      if (cleanCanonical) canonicalUrlMap.set(cleanCanonical, res);
      if (isPlaylist && playlistId) playlistIdMap.set(playlistId, res);
      uniqueList.push(res);
    }

    return uniqueList;
  }

  private detectPedagogicalRole(title: string): 'theory' | 'problem_solving' | 'experiment' | 'revision' {
    const lower = title.toLowerCase();
    if (/\b(problems|practice|questions|numerical|exercises|solutions|mcqs|pyq)\b/.test(lower)) {
      return 'problem_solving';
    }
    if (/\b(experiment|demonstration|lab|animation|simulation|visual)\b/.test(lower)) {
      return 'experiment';
    }
    if (/\b(revision|summary|one shot|crash course|cheat sheet|in 10 minutes)\b/.test(lower)) {
      return 'revision';
    }
    return 'theory';
  }

  private mergeResources(target: EngineResource, source: EngineResource): void {
    // Keep higher overall quality score
    if ((source.score?.overall || 0) > (target.score?.overall || 0)) {
      target.score = source.score;
      target.title = source.title; // Prefer higher scoring title
    }

    // Keep richer description
    if ((source.description?.length || 0) > (target.description?.length || 0)) {
      target.description = source.description;
    }

    // Keep verified thumbnail if target is missing
    if (!target.thumbnailUrl && source.thumbnailUrl) {
      target.thumbnailUrl = source.thumbnailUrl;
    }

    // Merge tags
    const combinedTags = new Set([...(target.tags || []), ...(source.tags || [])]);
    target.tags = Array.from(combinedTags);

    // Merge metadata
    target.metadata = {
      ...(source.metadata || {}),
      ...(target.metadata || {}),
    };
  }
}
