import {
  EngineResource,
  ValidationResult,
  EngineResourceType,
  SequencedPlaylistResult,
  SequencedResourceItem,
  SequenceValidationSummary,
} from '../types';
import {
  isValidUrl,
  extractCanonicalVideoKey,
  extractYouTubeVideoId,
  extractYouTubePlaylistId,
} from '../utils/url-utils';

const VALID_RESOURCE_TYPES = new Set<EngineResourceType>([
  'video_lecture',
  'youtube_playlist',
  'full_course',
  'reading_material',
  'article',
  'educational_web_page',
  'pdf_lecture_notes',
  'study_notes',
  'lecture_handout',
  'official_documentation',
  'reference_guide',
  'textbook',
  'research_paper',
  'practice_questions',
  'pyq',
  'question_bank',
  'mock_test',
  'ai_quiz',
  'monograph',
  'practice_sheet',
]);

export class ValidationEngine {
  /**
   * Validates a single discovered resource
   */
  validate(resource: EngineResource, minThreshold = 45): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Title validation
    if (!resource.title || resource.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long');
    }

    // URL validation
    if (!isValidUrl(resource.canonicalUrl)) {
      errors.push(`Invalid canonical URL: "${resource.canonicalUrl}"`);
    }

    // Exact destination validation for YouTube videos and playlists
    if (
      resource.provider === 'youtube' ||
      resource.type === 'video_lecture' ||
      resource.type === 'youtube_playlist' ||
      resource.type === 'full_course'
    ) {
      const url = resource.canonicalUrl || resource.sourceUrl || '';
      if (/youtube\.com|youtu\.be/i.test(url)) {
        const hasVid = extractYouTubeVideoId(url);
        const hasPl = extractYouTubePlaylistId(url);
        if (!hasVid && !hasPl) {
          errors.push(
            `Invalid YouTube destination: "${url}" is a generic channel or search URL. Must specify an exact videoId or playlistId.`
          );
        }
      }
    }

    // Embeddability validation
    if (resource.metadata?.isEmbeddable === false) {
      errors.push(`Video playback is disabled on third-party sites by the video owner`);
    }

    // Type validation
    if (!VALID_RESOURCE_TYPES.has(resource.type)) {
      errors.push(`Invalid resource type: "${resource.type}"`);
    }

    // Duration validation
    if (typeof resource.durationMinutes !== 'number' || resource.durationMinutes <= 0) {
      warnings.push(`Duration minutes is non-positive: ${resource.durationMinutes}. Defaulting to 15.`);
      resource.durationMinutes = 15;
    }

    // Score validation
    if (
      resource.score.overall < 0 || resource.score.overall > 100 ||
      resource.score.relevance < 0 || resource.score.relevance > 100
    ) {
      errors.push('Quality scores must be strictly between 0 and 100');
    }

    // Quality threshold rejection
    if (resource.score.overall < minThreshold) {
      errors.push(`Resource overall score (${resource.score.overall}) falls below acceptance threshold (${minThreshold})`);
    }

    return {
      isValid: errors.length === 0,
      resourceId: resource.id,
      errors,
      warnings,
    };
  }

  /**
   * Filters array of resources keeping only structurally valid items
   */
  filterValid(resources: EngineResource[], minThreshold = 45): EngineResource[] {
    return resources.filter((res) => {
      const result = this.validate(res, minThreshold);
      if (!result.isValid) {
        return false;
      }
      return true;
    });
  }

  /**
   * Validates and deterministically corrects an entire sequenced playlist
   */
  validateSequencedPlaylist(
    playlist: SequencedPlaylistResult,
    minQualityThreshold = 55
  ): SequencedPlaylistResult {
    const warnings: string[] = [...(playlist.coverageGaps || [])];
    const seenVideoKeys = new Set<string>();
    const sanitizedItems: SequencedResourceItem[] = [];
    let duplicateCountRemoved = 0;

    // 1. Duplicate removal check
    for (const item of playlist.items) {
      const vKey = extractCanonicalVideoKey(
        item.resource.canonicalUrl || item.resource.sourceUrl,
        item.resource.externalId
      ) || item.resource.canonicalUrl;

      if (seenVideoKeys.has(vKey)) {
        duplicateCountRemoved++;
        continue;
      }

      // 2. Acceptance threshold enforcement
      if (item.qualityScore.overall < minQualityThreshold) {
        warnings.push(
          `Pruned item "${item.resource.title}" failing quality threshold (${item.qualityScore.overall}/${minQualityThreshold})`
        );
        continue;
      }

      seenVideoKeys.add(vKey);
      sanitizedItems.push(item);
    }

    // 3. Prerequisite sequence ordering validation for learning paths
    let prerequisitesRespected = true;
    if (playlist.sequenceType === 'learning_path') {
      const roleOrder: Record<string, number> = {
        foundation: 1,
        core_concept: 2,
        practical_demonstration: 3,
        deep_dive: 4,
        advanced_synthesis: 5,
      };

      for (let i = 0; i < sanitizedItems.length - 1; i++) {
        const curRank = roleOrder[sanitizedItems[i].roleInSequence] || 3;
        const nextRank = roleOrder[sanitizedItems[i + 1].roleInSequence] || 3;

        // If an advanced capstone appears before a foundation topic, ordering is inverted!
        if (curRank > nextRank && curRank >= 4 && nextRank <= 2) {
          prerequisitesRespected = false;
          warnings.push(
            `Prerequisite inversion detected: "${sanitizedItems[i].resource.title}" (${sanitizedItems[i].roleInSequence}) was placed before "${sanitizedItems[i + 1].resource.title}" (${sanitizedItems[i + 1].roleInSequence}). Deterministically correcting.`
          );
          break;
        }
      }

      // Deterministic correction: re-sort by pedagogical rank
      if (!prerequisitesRespected) {
        sanitizedItems.sort((a, b) => {
          const rankA = roleOrder[a.roleInSequence] || 3;
          const rankB = roleOrder[b.roleInSequence] || 3;
          return rankA - rankB;
        });
        prerequisitesRespected = true;
      }
    }

    // 4. Renumber final sequence numbers
    sanitizedItems.forEach((item, index) => {
      item.sequenceNumber = index + 1;
    });

    const averageQuality =
      sanitizedItems.length > 0
        ? Math.round(
            sanitizedItems.reduce((acc, it) => acc + it.qualityScore.overall, 0) /
              sanitizedItems.length
          )
        : 0;

    const summary: SequenceValidationSummary = {
      isValid: sanitizedItems.length > 0,
      duplicateCountRemoved,
      prerequisitesRespected,
      averageQuality,
      warnings,
    };

    return {
      ...playlist,
      items: sanitizedItems,
      validationSummary: summary,
    };
  }
}
