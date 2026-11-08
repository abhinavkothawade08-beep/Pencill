import {
  EducationalDomain,
  ModulePlan,
  PlaylistCoverageMap,
  PlaylistResource,
  PlaylistItem,
  ScoredResource,
  SyllabusSubtopic,
} from './types';
import { extractYouTubeVideoId } from './normalizer';

// In-memory cache for playlist coverage maps with 15-minute TTL
const coverageMapCache = new Map<string, { map: PlaylistCoverageMap; timestamp: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * Extracts canonical YouTube video ID from full URL, short URL, embed URL, or bare ID.
 * Supports standard 11-char IDs, custom catalog IDs, and test IDs (5-40 chars).
 */
export function extractCanonicalVideoId(urlOrId?: string | null): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If already a bare alphanumeric/hyphen/underscore identifier
  if (/^[a-zA-Z0-9_-]{5,40}$/.test(trimmed)) {
    return trimmed;
  }

  // Extract from full YouTube URL (watch, embed, short, youtu.be, etc.)
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{5,40})/i);
  if (match) {
    return match[1];
  }

  const queryMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{5,40})/i);
  if (queryMatch) {
    return queryMatch[1];
  }

  return null;
}

/**
 * Formats a canonical YouTube watch URL from a video ID or URL.
 */
export function canonicalizeWatchUrl(urlOrId?: string | null): string | null {
  const vidId = extractCanonicalVideoId(urlOrId);
  if (!vidId) return null;
  return `https://www.youtube.com/watch?v=${vidId}`.toLowerCase();
}

/**
 * Builds a structured, high-precision PlaylistCoverageMap for a recommended playlist.
 * Tracks verified video IDs, canonical watch URLs, and syllabus/objective coverage.
 */
export function buildPlaylistCoverageMap(
  playlist: PlaylistResource,
  modulePlan: ModulePlan,
  domain?: EducationalDomain,
  courseTopic?: string
): PlaylistCoverageMap {
  const cacheKey = `cov:${playlist.id || playlist.playlistUrl}:${modulePlan.id}`;
  const cached = coverageMapCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.map;
  }

  const items = playlist.items || [];
  const verifiedVideoIds: string[] = [];
  const verifiedVideoIdSet = new Set<string>();
  const canonicalWatchUrls: string[] = [];
  const canonicalWatchUrlSet = new Set<string>();
  const availableVideoTitles: string[] = [];

  for (const item of items) {
    const rawId = item.videoId || extractCanonicalVideoId(item.videoUrl);
    if (rawId) {
      const cleanId = rawId.toLowerCase();
      if (!verifiedVideoIdSet.has(cleanId)) {
        verifiedVideoIdSet.add(cleanId);
        verifiedVideoIds.push(cleanId);
      }
    }

    const watchUrl = canonicalizeWatchUrl(item.videoUrl || rawId);
    if (watchUrl && !canonicalWatchUrlSet.has(watchUrl)) {
      canonicalWatchUrlSet.add(watchUrl);
      canonicalWatchUrls.push(watchUrl);
    }

    if (item.title) {
      availableVideoTitles.push(item.title);
    }
  }

  // Check playlist URL itself if items was empty
  if (verifiedVideoIds.length === 0 && playlist.playlistUrl) {
    const fromPlUrl = extractCanonicalVideoId(playlist.playlistUrl);
    if (fromPlUrl) {
      verifiedVideoIds.push(fromPlUrl.toLowerCase());
      verifiedVideoIdSet.add(fromPlUrl.toLowerCase());
    }
  }

  // Objective Matching across playlist title, description, topics covered, and expanded item titles
  const fullTextParts = [
    playlist.title || '',
    playlist.description || '',
    ...(playlist.topicsCovered || []),
    ...availableVideoTitles,
  ];
  const combinedText = fullTextParts.join(' ').toLowerCase();

  const coveredLearningObjectives: string[] = [];
  const uncoveredObjectives: string[] = [];
  let matchedCount = 0;

  for (const rawObj of modulePlan.learningObjectives || []) {
    const objId = typeof rawObj === 'string' ? '' : (rawObj.id || '');
    const statement = typeof rawObj === 'string' ? rawObj : (rawObj.statement || '');
    const keyTerms: string[] = Array.isArray((rawObj as any).keyTerms) && (rawObj as any).keyTerms.length > 0
      ? (rawObj as any).keyTerms
      : statement
          .toLowerCase()
          .split(/[\s,;:.()/-]+/)
          .filter((w: string) => w.length > 3 && !['with', 'from', 'into', 'under', 'their'].includes(w));

    let isMatched = false;
    for (const term of keyTerms) {
      if (term && combinedText.includes(term.toLowerCase())) {
        isMatched = true;
        break;
      }
    }

    if (isMatched) {
      matchedCount++;
      coveredLearningObjectives.push(statement);
      if (objId) coveredLearningObjectives.push(objId);
    } else {
      uncoveredObjectives.push(statement);
      if (objId) uncoveredObjectives.push(objId);
    }
  }

  const totalObjectives = Math.max(1, (modulePlan.learningObjectives || []).length);
  const coveragePercent = Math.round((matchedCount / totalObjectives) * 100);

  // Covered syllabus topics derived from playlist topics and item titles
  const coveredSyllabusTopics: string[] = Array.from(
    new Set([
      ...(playlist.topicsCovered || []),
      ...availableVideoTitles.map((t) => t.replace(/^(Lecture|Class|Module|Session|Video|\d+)[\s:.-]+/i, '').trim()),
    ])
  );

  // Verification status determination (Rule F: unverified playlists are flagged safely)
  let verificationStatus: PlaylistCoverageMap['verificationStatus'];
  if (
    playlist.coverageStatus === 'UNVERIFIED' ||
    (items.length === 0 && (!playlist.topicsCovered || playlist.topicsCovered.length === 0))
  ) {
    verificationStatus = 'UNVERIFIED';
  } else if (items.length >= 3 && coveragePercent >= 70) {
    verificationStatus = 'VERIFIED_COMPLETE';
  } else {
    verificationStatus = 'PARTIALLY_VERIFIED';
  }

  const coverageMap: PlaylistCoverageMap = {
    playlistId: playlist.playlistId || playlist.id,
    playlistUrl: playlist.playlistUrl,
    channelId: playlist.channelId,
    channelName: playlist.channelName,
    verifiedVideoIds,
    canonicalWatchUrls,
    availableVideoTitles,
    coveredSyllabusTopics,
    coveredLearningObjectives,
    uncoveredObjectives,
    coveragePercent,
    verificationStatus,
    lastVerificationTimestamp: Date.now(),
    isCurated: Boolean(playlist.isCurated),
  };

  coverageMapCache.set(cacheKey, { map: coverageMap, timestamp: Date.now() });
  return coverageMap;
}

/**
 * RULE A: Checks whether an individual video exists inside a recommended playlist by canonical video ID or URL.
 */
export function isExactVideoInPlaylist(
  video: { url?: string; canonicalUrl?: string; externalId?: string },
  coverageMap: PlaylistCoverageMap
): boolean {
  if (!coverageMap) return false;

  const idsToCheck = [
    extractCanonicalVideoId(video.externalId),
    extractCanonicalVideoId(video.canonicalUrl),
    extractCanonicalVideoId(video.url),
    video.externalId,
  ].filter(Boolean) as string[];

  for (const id of idsToCheck) {
    if (coverageMap.verifiedVideoIds.some((vId) => vId.toLowerCase() === id.toLowerCase())) {
      return true;
    }
  }

  const urlsToCheck = [
    canonicalizeWatchUrl(video.canonicalUrl),
    canonicalizeWatchUrl(video.url),
    canonicalizeWatchUrl(video.externalId),
    video.canonicalUrl,
    video.url,
  ].filter(Boolean) as string[];

  for (const u of urlsToCheck) {
    if (coverageMap.canonicalWatchUrls.some((cUrl) => cUrl.toLowerCase() === u.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * Evaluates whether an individual video resource is redundant given a recommended playlist.
 * Implements Rules A, B, C, D, and F.
 */
export function isTopicCoveredByPlaylist(
  video: ScoredResource,
  coverageMap: PlaylistCoverageMap,
  modulePlan: ModulePlan,
  subtopics?: SyllabusSubtopic[]
): { isCovered: boolean; reason: string } {
  // Always preserve user-created or custom-added resources
  if ((video as any).isUserCreated || (video as any).isCustom) {
    return { isCovered: false, reason: 'User created resource - preserved unconditionally' };
  }

  // RULE A: Exact video duplicate check
  if (isExactVideoInPlaylist(video, coverageMap)) {
    return {
      isCovered: true,
      reason: 'Exact video already included in recommended playlist sequence (Rule A)',
    };
  }

  // RULE F: Unverified playlists must NOT perform unsafe topic-level deduplication
  if (coverageMap.verificationStatus === 'UNVERIFIED') {
    return {
      isCovered: false,
      reason: 'Playlist verification status is UNVERIFIED; preserving supplementary videos (Rule F)',
    };
  }

  // Helper matching objective ID or statement
  const isObjUncovered = (objIdOrStatement: string): boolean => {
    const target = objIdOrStatement.toLowerCase();
    if (coverageMap.uncoveredObjectives.some((u) => u.toLowerCase() === target)) {
      return true;
    }
    const found = modulePlan.learningObjectives?.find(
      (lo) => typeof lo !== 'string' && lo.id?.toLowerCase() === target
    );
    if (found && typeof found !== 'string') {
      return coverageMap.uncoveredObjectives.some(
        (u) => u.toLowerCase() === found.statement.toLowerCase()
      );
    }
    return false;
  };

  const isObjCovered = (objIdOrStatement: string): boolean => {
    const target = objIdOrStatement.toLowerCase();
    if (coverageMap.coveredLearningObjectives.some((c) => c.toLowerCase() === target)) {
      return true;
    }
    const found = modulePlan.learningObjectives?.find(
      (lo) => typeof lo !== 'string' && lo.id?.toLowerCase() === target
    );
    if (found && typeof found !== 'string') {
      return coverageMap.coveredLearningObjectives.some(
        (c) => c.toLowerCase() === found.statement.toLowerCase()
      );
    }
    return false;
  };

  // RULE C & RULE D: Check if video teaches a missing/uncovered objective
  const matchedObjs = video.matchedObjectives || [];
  const coversUncoveredObjective = matchedObjs.some((obj) => isObjUncovered(obj));

  if (coversUncoveredObjective) {
    return {
      isCovered: false,
      reason: 'Teaches supplementary learning objective not covered by playlist (Rule C)',
    };
  }

  // Check against subtopics for missing syllabus concepts (e.g. Expected Credit Loss)
  if (subtopics && subtopics.length > 0) {
    const videoTitleLower = (video.title || '').toLowerCase();
    const missingSubtopics = subtopics.filter(
      (s) =>
        s.coverageStatus === 'Missing Resources' ||
        s.coverageStatus === 'Needs Verification' ||
        s.coverageStatus === 'Partially Covered'
    );

    for (const sub of missingSubtopics) {
      const subTitleWords = sub.title
        .toLowerCase()
        .split(/[\s:.-]+/)
        .filter((w) => w.length > 3 && !['with', 'from', 'under', 'into'].includes(w));

      const matchesSubtopic = subTitleWords.some((w) => videoTitleLower.includes(w));
      const inPlaylistTitles = coverageMap.availableVideoTitles.some((pTitle) =>
        subTitleWords.some((w) => pTitle.toLowerCase().includes(w))
      );

      // If the individual video covers this subtopic and the playlist DOES NOT, retain it!
      if (matchesSubtopic && !inPlaylistTitles) {
        return {
          isCovered: false,
          reason: `Teaches missing syllabus subtopic "${sub.title}" not present in playlist (Rule D)`,
        };
      }
    }
  }

  // RULE B: If all objectives matched by this video are already covered by the playlist, it is redundant
  if (matchedObjs.length > 0) {
    const allObjectivesCovered = matchedObjs.every((obj) => isObjCovered(obj));

    if (allObjectivesCovered) {
      return {
        isCovered: true,
        reason: 'All learning objectives already covered by primary playlist sequence (Rule B)',
      };
    }
  }

  // Check if title directly duplicates playlist covered topics without adding new value
  const vTitleLower = (video.title || '').toLowerCase();
  const directTopicMatch = coverageMap.coveredSyllabusTopics.some((topic) => {
    const tWords = topic.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    return tWords.length > 0 && tWords.every((w) => vTitleLower.includes(w));
  });

  if (directTopicMatch && coverageMap.coveragePercent >= 75) {
    return {
      isCovered: true,
      reason: 'Topic concept already taught in primary playlist sequence (Rule B)',
    };
  }

  // Default: retain as complementary content (Rule D)
  return {
    isCovered: false,
    reason: 'Complementary educational material adding distinct value (Rule D)',
  };
}

/**
 * Deduplicates individual candidate videos against a recommended primary playlist.
 * Separates videos into genuinely supplementary videos and redundant duplicate videos.
 */
export function deduplicateModuleVideosAgainstPlaylist(
  candidateVideos: ScoredResource[],
  primaryPlaylist: PlaylistResource | undefined,
  modulePlan: ModulePlan,
  subtopics?: SyllabusSubtopic[],
  domain?: EducationalDomain,
  courseTopic?: string
): {
  supplementaryVideos: ScoredResource[];
  removedVideos: ScoredResource[];
  coverageMap?: PlaylistCoverageMap;
} {
  if (!primaryPlaylist) {
    return {
      supplementaryVideos: candidateVideos,
      removedVideos: [],
    };
  }

  const coverageMap = buildPlaylistCoverageMap(primaryPlaylist, modulePlan, domain, courseTopic);
  primaryPlaylist.coverageMap = coverageMap;

  const supplementaryVideos: ScoredResource[] = [];
  const removedVideos: ScoredResource[] = [];

  for (const video of candidateVideos) {
    const evalResult = isTopicCoveredByPlaylist(video, coverageMap, modulePlan, subtopics);
    if (evalResult.isCovered) {
      removedVideos.push(video);
    } else {
      supplementaryVideos.push(video);
    }
  }

  return {
    supplementaryVideos,
    removedVideos,
    coverageMap,
  };
}

/**
 * RULE E: Selects the single best playlist from multiple candidates.
 * Prevents recommending multiple redundant playlists for the same module.
 */
export function selectBestPlaylist(
  playlists: PlaylistResource[],
  modulePlan: ModulePlan,
  domain?: EducationalDomain,
  courseTopic?: string
): PlaylistResource | undefined {
  if (!playlists || playlists.length === 0) return undefined;

  // Filter out completely empty or invalid playlists
  const validPlaylists = playlists.filter((pl) => pl && (pl.itemCount > 0 || (pl.items && pl.items.length > 0)));
  if (validPlaylists.length === 0) return undefined;
  if (validPlaylists.length === 1) return validPlaylists[0];

  // Score each candidate playlist comprehensively
  const scored = validPlaylists.map((pl) => {
    const coverageMap = buildPlaylistCoverageMap(pl, modulePlan, domain, courseTopic);
    let score = pl.relevanceScore || 50;

    // Bonus for high objective coverage
    score += Math.round((coverageMap.coveragePercent / 100) * 30);

    // Bonus for verified curated instructor
    if (pl.isCurated) score += 20;

    // Bonus for optimal length (5 to 35 videos)
    if (pl.itemCount >= 5 && pl.itemCount <= 35) {
      score += 15;
    } else if (pl.itemCount > 35) {
      score += 5;
    }

    // Penalty for unverified or empty
    if (coverageMap.verificationStatus === 'UNVERIFIED') score -= 30;

    return { playlist: pl, score, coverageMap };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.playlist;
}

/**
 * Sanitizes existing or loaded module lessons against a primary playlist.
 * Prunes redundant video lessons matching the playlist while preserving user-added
 * content and non-video educational modalities (notes, readings, quizzes).
 */
export function sanitizeModuleLessonsAgainstPlaylist(module: any): {
  lessons: any[];
  removedCount: number;
} {
  const originalLessons = module.lessons || module.resources || [];
  const primaryPlaylist: PlaylistResource | undefined = module.primaryPlaylist;

  if (!primaryPlaylist) {
    return { lessons: originalLessons, removedCount: 0 };
  }

  const items = primaryPlaylist.items || [];
  const verifiedIds = new Set<string>();
  const canonicalUrls = new Set<string>();

  for (const item of items) {
    const vidId = extractCanonicalVideoId(item.videoId || item.videoUrl);
    if (vidId) verifiedIds.add(vidId.toLowerCase());
    if (item.videoId) verifiedIds.add(item.videoId.toLowerCase());
    const cUrl = canonicalizeWatchUrl(item.videoUrl || vidId);
    if (cUrl) canonicalUrls.add(cUrl.toLowerCase());
    if (item.videoUrl) canonicalUrls.add(item.videoUrl.toLowerCase());
  }

  let removedCount = 0;
  const sanitizedLessons: any[] = [];

  for (const lesson of originalLessons) {
    // 1. Never remove user-created or custom resources
    if (lesson.isUserCreated || lesson.isCustom) {
      sanitizedLessons.push(lesson);
      continue;
    }

    // 2. Hide redundant lesson row if it's the playlist itself (since PlaylistCard renders it)
    if (lesson.isPlaylist) {
      removedCount++;
      continue;
    }

    // 3. Non-video modalities are ALWAYS preserved (readings, monographs, quizzes, notes)
    if (lesson.type !== 'video') {
      sanitizedLessons.push(lesson);
      continue;
    }

    // 4. Exact video matching against playlist sequence
    const lessonVidId = extractCanonicalVideoId(lesson.sourceUrl || lesson.url || lesson.id || lesson.externalId);
    const lessonWatchUrl = canonicalizeWatchUrl(lesson.sourceUrl || lesson.url);

    const isDuplicate =
      (lessonVidId && verifiedIds.has(lessonVidId.toLowerCase())) ||
      (lesson.externalId && verifiedIds.has(lesson.externalId.toLowerCase())) ||
      (lesson.id && verifiedIds.has(lesson.id.toLowerCase())) ||
      (lessonWatchUrl && canonicalUrls.has(lessonWatchUrl.toLowerCase())) ||
      (lesson.sourceUrl && canonicalUrls.has(lesson.sourceUrl.toLowerCase()));

    if (isDuplicate) {
      removedCount++;
      continue;
    }

    sanitizedLessons.push(lesson);
  }

  return {
    lessons: sanitizedLessons,
    removedCount,
  };
}
