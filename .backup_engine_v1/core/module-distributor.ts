import { EngineResource, SequencedPlaylistResult, SequencedResourceItem } from '../types';
import { GeneratedLearningPath } from '@/services/ai';
import { LessonNoteResource } from '@/types';
import { tokenize } from '../utils/text-utils';
import { calculateFreshnessScore } from '../utils/scoring-utils';
import {
  extractYouTubeVideoId,
  extractVideoChapters,
  formatYouTubeTimestampUrl,
  canonicalizeUrl,
} from '../utils/url-utils';

export interface ModuleDistributionOptions {
  minQualityScore?: number;
  preserveExistingSources?: boolean;
}

export interface DistributedModuleLesson {
  title: string;
  type: 'video' | 'monograph' | 'practice' | 'quiz';
  estimatedMinutes: number;
  keyConcepts: string[];
  sourceName: string;
  sourceUrl?: string;
  sequenceNumber?: number;
  roleInSequence?: string;
  selectionReason?: string;
  positionReason?: string;
  qualityScore?: number;
  qualityEvidence?: Record<string, unknown>;
  thumbnailUrl?: string;
  summaryPoints?: string[];
  studyNotes?: LessonNoteResource[];
  educatorId?: string;
  educatorName?: string;
  channelId?: string;
  discoverySource?: 'curated_directory' | 'verified_channel' | 'open_discovery' | 'fallback_search';
  verificationStatus?: string;
  selectionExplanation?: string;
  coverageAssessment?: string;
}

export interface DistributedModule {
  title: string;
  moduleNumber: number;
  estimatedHours: number;
  objective: string;
  totalResources?: number;
  lessons: DistributedModuleLesson[];
}

/**
 * Checks if a resource type qualifies as a document / monograph / study note.
 */
function isDocumentType(t: string): boolean {
  return [
    'study_notes',
    'pdf_lecture_notes',
    'lecture_handout',
    'official_documentation',
    'reference_guide',
    'textbook',
    'research_paper',
    'reading_material',
    'article',
    'educational_web_page',
    'monograph',
    'paper',
  ].includes(t);
}

/**
 * Checks if a resource type qualifies as a practice set or PYQ.
 */
function isPracticeType(t: string): boolean {
  return [
    'practice_questions',
    'pyq',
    'question_bank',
    'mock_test',
    'practice',
  ].includes(t);
}

/**
 * Converts an EngineResource to a structured LessonNoteResource.
 */
export function toLessonNoteResource(r: EngineResource): LessonNoteResource {
  let noteType: LessonNoteResource['type'] = 'study_notes';
  if (r.type === 'pdf_lecture_notes' || r.metadata?.isDirectPdf) {
    noteType = 'pdf_notes';
  } else if (r.type === 'lecture_handout') {
    noteType = 'lecture_handout';
  } else if (r.type === 'official_documentation') {
    noteType = 'official_documentation';
  } else if (r.type === 'reference_guide') {
    noteType = 'reference_guide';
  } else if (r.type === 'textbook') {
    noteType = 'textbook';
  } else if (r.type === 'research_paper') {
    noteType = 'research_paper';
  } else if (r.type === 'practice_questions' || r.type === 'pyq') {
    noteType = 'practice_exercise';
  } else {
    noteType = 'educational_article';
  }

  const directUrl = r.canonicalUrl || r.sourceUrl;
  const isDirectPdf = Boolean(r.metadata?.isDirectPdf || directUrl.toLowerCase().endsWith('.pdf'));

  return {
    id: r.id,
    title: r.title,
    type: noteType,
    sourceUrl: directUrl,
    downloadUrl: (r.metadata?.downloadUrl as string) || (isDirectPdf ? directUrl : undefined),
    publisher: r.authorOrChannel || r.sourceName,
    description: r.description,
    isDirectPdf,
    qualityScore: r.score?.overall ?? r.finalScore ?? 75,
    relevanceExplanation: r.score?.explanation || `Verified ${noteType.replace('_', ' ')} from ${r.sourceName}`,
  };
}

/**
 * Computes semantic token overlap score between a resource and a target lesson/module context.
 */
function computeSemanticAffinity(
  resource: EngineResource,
  contextTokens: Set<string>,
  targetDifficulty?: string,
  targetModuleNumber?: number,
  targetModuleId?: string,
  targetLessonTokens?: Set<string>
): number {
  const resourceText = `${resource.title} ${resource.description || ''} ${(resource.tags || []).join(' ')} ${resource.authorOrChannel || ''}`;
  const resTokens = tokenize(resourceText);

  if (resTokens.size === 0 || contextTokens.size === 0) {
    return 10;
  }

  let matchCount = 0;
  for (const tok of contextTokens) {
    if (resTokens.has(tok)) {
      matchCount++;
    }
  }

  // If there is zero token overlap with lesson context, the video cannot be assumed topically accurate
  if (matchCount === 0) {
    return Math.min(20, Math.round((resource.score?.overall || 50) * 0.2));
  }

  const isModuleTagged = (
    (typeof resource.metadata?.moduleNumber === 'number' && resource.metadata.moduleNumber === targetModuleNumber) ||
    (typeof resource.metadata?.moduleId === 'string' && (
      resource.metadata.moduleId === `mod-${targetModuleNumber}` ||
      (Boolean(targetModuleId) && resource.metadata.moduleId === targetModuleId)
    ))
  );

  const isComprehensive = Boolean(
    resource.metadata?.isComprehensive ||
    resource.metadata?.isOneShot ||
    resource.metadata?.isFullCourse ||
    resource.type === 'full_course' ||
    resource.type === 'youtube_playlist' ||
    resource.metadata?.isPlaylist ||
    (resource.durationMinutes && resource.durationMinutes >= 60) ||
    /\b(one[\s-]?shot|full[\s-]?(course|chapter|lecture)|complete\s+(course|playlist|chapter|tutorial)|masterclass)\b/i.test(resource.title)
  );

  const hasModuleMismatch = !isComprehensive && (
    (typeof resource.metadata?.moduleNumber === 'number' && resource.metadata.moduleNumber !== targetModuleNumber) ||
    (typeof resource.metadata?.moduleId === 'string' && (
      (resource.metadata.moduleId.startsWith('mod-') && resource.metadata.moduleId !== `mod-${targetModuleNumber}`) ||
      (Boolean(targetModuleId) && resource.metadata.moduleId !== targetModuleId && !resource.metadata.moduleId.startsWith('general'))
    ))
  );

  const overlapRatio = matchCount / Math.max(contextTokens.size, 1);
  const baseScore = resource.score?.overall || 60;

  // Bonus for matching pedagogical difficulty
  let difficultyBonus = 0;
  if (targetDifficulty && resource.difficulty === targetDifficulty) {
    difficultyBonus = 8;
  }

  // Bonus if resource was discovered specifically for this module, or penalty if tagged for a different module
  let moduleAffinityBonus = 0;
  if (isModuleTagged) {
    moduleAffinityBonus = 15;
  } else if (hasModuleMismatch) {
    moduleAffinityBonus = -35;
  }

  const genericTitleWords = new Set(['reaction', 'react', 'compound', 'module', 'lecture', 'lectur', 'part', 'chapter', 'intro', 'basic']);
  const titleTokens = tokenize(resource.title);
  let titleMatchCount = 0;
  for (const tok of titleTokens) {
    if (targetLessonTokens ? (targetLessonTokens.has(tok) && !genericTitleWords.has(tok)) : contextTokens.has(tok)) {
      titleMatchCount++;
    }
  }
  const titleOverlapRatio = titleTokens.size > 0 ? titleMatchCount / titleTokens.size : 0;
  const isDirectTitleMatch = (titleMatchCount >= 2 && titleOverlapRatio >= 0.25) || (titleMatchCount >= 1 && titleTokens.size <= 4);

  const isDeclaredFullCourse = Boolean(
    resource.metadata?.isOneShot ||
    /\b(full course|complete course|masterclass|bootcamp|complete tutorial|all-in-one|one[\s-]?shot|full[\s-]?(chapter|lecture)|complete\s+chapter)\b/i.test(resource.title)
  );

  // Sparse overlap discount: if video is neither a targeted title match nor a declared full course,
  // apply discount when it does not match the target lesson tokens or has sparse overlap relative to context
  const tokenSignificanceDiscount = (isDirectTitleMatch || isDeclaredFullCourse)
    ? 1.0
    : (titleMatchCount === 0 && contextTokens.size >= 8)
    ? 0.50
    : (matchCount === 1 && contextTokens.size >= 8)
    ? 0.45
    : (matchCount === 2 && contextTokens.size >= 16)
    ? 0.60
    : 1.0;

  // Title alignment bonus for videos whose titles specifically address this module's concepts
  let titleAffinityBonus = 0;
  if (isDirectTitleMatch) {
    titleAffinityBonus = Math.round(titleOverlapRatio * 20);
  }

  // Priority bonus for recent verified educational videos when topic relevance is established
  let recencyBonus = 0;
  const isVideo = resource.type === 'video_lecture' || resource.type === 'youtube_playlist' || resource.type === 'full_course';
  if (isVideo && (resource.score?.relevance ?? 70) >= 60 && (overlapRatio >= 0.18 || isDirectTitleMatch) && matchCount >= 3) {
    const freshness = resource.score?.freshness ?? calculateFreshnessScore(resource.publishedAt || (resource.metadata?.publishedAt as string));
    if (freshness >= 85) {
      recencyBonus = 8;
    }
  }

  // Duration suitability & practical depth matching for lessons
  let durationAffinityBonus = 0;
  if (isVideo && resource.durationMinutes > 0) {
    const isProjectLesson = targetLessonTokens
      ? Array.from(targetLessonTokens).some((t) => ['project', 'build', 'application', 'capstone', 'implementation', 'clone', 'fullstack', 'full-stack'].includes(t))
      : false;
    const isNarrowLesson = targetLessonTokens
      ? Array.from(targetLessonTokens).some((t) => ['method', 'methods', 'syntax', 'operator', 'operators', 'regex', 'decorator', 'slice'].includes(t))
      : false;

    if (isProjectLesson) {
      // For practical project lessons, prefer substantial length (25-150 min) and practical signals
      if (resource.durationMinutes >= 25 && resource.durationMinutes <= 150) {
        durationAffinityBonus += 10;
      } else if (resource.durationMinutes < 15) {
        durationAffinityBonus -= 12; // Penalize superficial clips for project lessons
      }
      const practical = resource.score?.practicalDepth ?? resource.practicalDepthScore ?? (resource.metadata?.practicalDepthScore as number) ?? 40;
      if (practical >= 65) {
        durationAffinityBonus += 8;
      }
    } else if (isNarrowLesson) {
      // For narrow concept lessons, do not penalize short focused tutorials
      if (resource.durationMinutes >= 5 && resource.durationMinutes <= 25) {
        durationAffinityBonus += 8;
      } else if (resource.durationMinutes > 180) {
        durationAffinityBonus -= 8; // Disfavor massive course for narrow concept lesson
      }
    } else {
      // Standard lesson: moderate duration (15-60 min)
      if (resource.durationMinutes >= 15 && resource.durationMinutes <= 60) {
        durationAffinityBonus += 5;
      }
    }
  }

  return Math.max(0, Math.round(overlapRatio * 100 * 0.6 + baseScore * 0.4 * tokenSignificanceDiscount + difficultyBonus + moduleAffinityBonus + titleAffinityBonus + recencyBonus + durationAffinityBonus));
}

/**
 * Intelligent Module-Wise Resource Distributor.
 * Takes a synthesized or loaded learning path and distributes discovered resources
 * (videos, monographs, practice sets, quizzes) across modules based on specific module
 * objectives, lesson concepts, and pedagogical ordering — preventing cross-module leakage
 * and eliminating greedy first-come-first-served bias.
 */
export function distributeResourcesToCourse(
  learningPath: GeneratedLearningPath,
  discoveredResources: EngineResource[],
  sequencedPlaylist?: SequencedPlaylistResult | null,
  options?: ModuleDistributionOptions
): GeneratedLearningPath {
  if (!learningPath || !learningPath.modules || learningPath.modules.length === 0) {
    return learningPath;
  }

  const courseTitleTokens = tokenize(learningPath.title);

  // 1. Partition discovered resources by modality
  const playlistItems: SequencedResourceItem[] = sequencedPlaylist?.items || [];
  const videoResources = discoveredResources.filter(
    (r) => r.type === 'video_lecture' || r.type === 'youtube_playlist' || r.type === 'full_course'
  );
  const documentResources = discoveredResources.filter((r) => isDocumentType(r.type));
  const practiceResources = discoveredResources.filter((r) => isPracticeType(r.type));
  const quizResources = discoveredResources.filter((r) => r.type === 'ai_quiz');

  type LessonTarget = {
    modIdx: number;
    lesIdx: number;
    lesson: DistributedModuleLesson;
    combinedTokens: Set<string>;
    lessonTokens: Set<string>;
    moduleNumber: number;
    moduleId?: string;
    moduleTitle: string;
    isIntroductoryModule: boolean;
    isAdvancedModule: boolean;
  };

  const totalModules = learningPath.modules.length;
  const videoTargets: LessonTarget[] = [];
  const docTargets: LessonTarget[] = [];
  const practiceTargets: LessonTarget[] = [];
  const quizTargets: LessonTarget[] = [];

  learningPath.modules.forEach((mod, modIdx) => {
    const modTokens = tokenize(`${mod.title} ${mod.objective}`);
    const isIntroductoryModule = modIdx === 0;
    const isAdvancedModule = modIdx === totalModules - 1;

    mod.lessons.forEach((rawLes, lesIdx) => {
      const les = { ...rawLes } as DistributedModuleLesson;
      const lessonTokens = tokenize(`${les.title} ${(les.keyConcepts || []).join(' ')} ${mod.title}`);
      const combinedTokens = new Set([...lessonTokens, ...modTokens]);
      const target: LessonTarget = {
        modIdx,
        lesIdx,
        lesson: les,
        combinedTokens,
        lessonTokens,
        moduleNumber: mod.moduleNumber || modIdx + 1,
        moduleId: (mod as { id?: string }).id,
        moduleTitle: mod.title,
        isIntroductoryModule,
        isAdvancedModule,
      };

      if (les.type === 'video') videoTargets.push(target);
      else if (les.type === 'monograph') docTargets.push(target);
      else if (les.type === 'practice') practiceTargets.push(target);
      else if (les.type === 'quiz') quizTargets.push(target);
    });
  });

  // Derive pedagogical difficulty level
  const normalizedLevel = (learningPath.level || '').toLowerCase();
  const targetDifficulty =
    normalizedLevel.includes('beginner') || normalizedLevel.includes('foundation') || normalizedLevel.includes('9') || normalizedLevel.includes('10')
      ? 'beginner'
      : normalizedLevel.includes('advanced') || normalizedLevel.includes('undergraduate') || normalizedLevel.includes('jee') || normalizedLevel.includes('neet')
      ? 'advanced'
      : 'intermediate';

  // -------------------------------------------------------------
  // 1. Assign Videos: Intelligent Sourcing & Concept Coverage Strategy
  // -------------------------------------------------------------
  // Prioritizes:
  // - Priority 1: One high-quality comprehensive full-length tutorial covering most of syllabus.
  // - Priority 2: One complete relevant playlist covering most of syllabus.
  // - Targeted supplementary videos: only for concepts/modules missing from primary resource.
  // - Smart Fallback: Smallest combination of complementary resources achieving sufficient coverage.
  // - Strict duplicate prevention and module-resource alignment.
  // -------------------------------------------------------------
  type VideoAssignment = {
    video: EngineResource;
    playlistItem?: SequencedResourceItem;
    customSelectionReason?: string;
    customUrl?: string;
  };

  const videoAssignmentMap = new Map<string, VideoAssignment>();

  // Helper to extract a normalized canonical deduplication key for candidate videos
  function getCandidateVideoKey(resource: EngineResource): string {
    const rawUrl = resource.canonicalUrl || resource.sourceUrl;
    const vidId = extractYouTubeVideoId(rawUrl) || resource.externalId || resource.metadata?.videoId;
    if (vidId) return `yt:${vidId}`;
    const canonUrl = canonicalizeUrl(rawUrl);
    if (canonUrl) return `url:${canonUrl}`;
    return resource.id;
  }

  // Collect candidate videos from both direct discovery and sequenced playlist
  const uniqueVideosMap = new Map<string, { video: EngineResource; playlistItem?: SequencedResourceItem }>();
  for (const v of videoResources) {
    const key = getCandidateVideoKey(v);
    if (!uniqueVideosMap.has(key)) {
      uniqueVideosMap.set(key, { video: v });
    } else {
      const existing = uniqueVideosMap.get(key)!;
      const existingScore = existing.video.score?.overall ?? existing.video.finalScore ?? 0;
      const newScore = v.score?.overall ?? v.finalScore ?? 0;
      if (newScore > existingScore) {
        uniqueVideosMap.set(key, { ...existing, video: v });
      }
    }
  }
  for (const item of playlistItems) {
    const key = getCandidateVideoKey(item.resource);
    const existing = uniqueVideosMap.get(key);
    if (existing) {
      existing.playlistItem = item;
    } else {
      uniqueVideosMap.set(key, { video: item.resource, playlistItem: item });
    }
  }
  const allVideoCandidates = Array.from(uniqueVideosMap.values());

  // Evaluate concept coverage and module-affinity per candidate
  interface CandidateCoverage {
    video: EngineResource;
    playlistItem?: SequencedResourceItem;
    coveredModules: Set<number>;
    moduleScores: Map<number, number>;
    isComprehensiveTutorial: boolean;
    isCompletePlaylist: boolean;
    coverageRatio: number;
    compositeScore: number;
  }

  const coverageEvaluations: CandidateCoverage[] = allVideoCandidates.map(({ video: v, playlistItem: pItem }) => {
    const isPlaylist =
      v.type === 'youtube_playlist' ||
      Boolean(v.metadata?.isPlaylist) ||
      Boolean(v.metadata?.playlistId) ||
      (Boolean(v.canonicalUrl) && v.canonicalUrl.includes('list='));

    const isFullCourseType = v.type === 'full_course' ||
      Boolean(v.metadata?.isFullCourse) ||
      Boolean(v.metadata?.isOneShot) ||
      Boolean(v.metadata?.isComprehensive);
    const hasFullCourseTitle = /\b(full course|complete course|masterclass|bootcamp|complete tutorial|all-in-one|one[\s-]?shot|full[\s-]?(chapter|lecture)|complete\s+chapter)\b/i.test(v.title);
    const isLongForm = v.durationMinutes >= 60 || isFullCourseType || (v.durationMinutes >= 45 && hasFullCourseTitle);

    const coveredModules = new Set<number>();
    const moduleScores = new Map<number, number>();

    learningPath.modules.forEach((mod, mIdx) => {
      const modTarget = videoTargets.find((vt) => vt.modIdx === mIdx);
      const tokens = modTarget ? modTarget.combinedTokens : tokenize(`${mod.title} ${mod.objective}`);
      let score = computeSemanticAffinity(
        v,
        tokens,
        targetDifficulty,
        mod.moduleNumber || mIdx + 1,
        (mod as { id?: string }).id,
        modTarget?.lessonTokens || tokenize(mod.title)
      );

      // Chapter timestamps analysis: if video description contains chapters matching module keywords
      if (v.description && /(?:\d{1,2}:\d{2})/g.test(v.description)) {
        const descTokens = tokenize(v.description);
        const modTitleTokens = tokenize(mod.title);
        let chapterMatch = 0;
        for (const tok of modTitleTokens) {
          if (descTokens.has(tok)) chapterMatch++;
        }
        if (chapterMatch >= 2) {
          score += 10;
        }
      }

      // If video is a long-form tutorial or full course matching course topic, check broad relevance
      const courseTokens = tokenize(learningPath.title);
      const vTitleTokens = tokenize(v.title);
      let courseMatchCount = 0;
      for (const tok of courseTokens) {
        if (vTitleTokens.has(tok)) courseMatchCount++;
      }
      const normCourseTitle = (learningPath.title || '').toLowerCase();
      const normVTitle = v.title.toLowerCase();
      const firstCourseWord = normCourseTitle.split(/\s+/)[0] || '';
      const matchesCourse =
        courseMatchCount >= 1 && (
          normVTitle.includes(normCourseTitle) ||
          normCourseTitle.includes(normVTitle) ||
          courseTokens.size <= 2 ||
          courseMatchCount >= 2 ||
          (firstCourseWord.length >= 3 && normVTitle.includes(firstCourseWord))
        );

      if (isLongForm && matchesCourse && score < 48) {
        const titleAndDesc = `${v.title} ${v.description || ''} ${(v.tags || []).join(' ')}`.toLowerCase();
        const modConceptTokens = new Set<string>();
        for (const tok of tokenize(`${mod.title} ${mod.objective}`)) {
          modConceptTokens.add(tok);
        }
        for (const les of mod.lessons) {
          for (const tok of tokenize(`${les.title} ${(les.keyConcepts || []).join(' ')}`)) {
            modConceptTokens.add(tok);
          }
        }
        const courseGeneralWords = new Set([
          'python', 'program', 'comput', 'basic', 'intro', 'learn', 'course', 'tutori',
          'chemistr', 'scienc', 'jee', 'neet', 'reaction', 'react', 'compound', 'concept',
          'method', 'overview', 'fundament', 'mechan', 'aspect', 'applic', 'synthesi',
          'synthet', 'process', 'exercis', 'problem', 'drill', 'analysi',
          ...courseTokens,
        ]);
        let conceptMatchCount = 0;
        for (const tok of modConceptTokens) {
          if (!courseGeneralWords.has(tok) && titleAndDesc.includes(tok)) {
            conceptMatchCount++;
          }
        }

        const modTitleTokens = tokenize(mod.title);
        const distinctiveTitleTokens = new Set<string>();
        let titleMatchCount = 0;
        for (const tok of modTitleTokens) {
          if (!courseGeneralWords.has(tok)) {
            distinctiveTitleTokens.add(tok);
            if (titleAndDesc.includes(tok)) {
              titleMatchCount++;
            }
          }
        }

        // Module is covered if:
        // 1. Video explicitly declares itself as a "full course", "complete course", "one shot", or "complete tutorial" matching the entire course topic, OR
        // 2. Video matches at least one distinctive keyword from the module title, OR
        // 3. Video matches multiple distinct module-specific concepts when module title keywords are generic
        const isDeclaredComprehensiveCourse = hasFullCourseTitle && matchesCourse;
        const coversModule = isDeclaredComprehensiveCourse || titleMatchCount >= 1 || (distinctiveTitleTokens.size === 0 && conceptMatchCount >= 2) || conceptMatchCount >= 3;
        if (coversModule) {
          score = Math.max(score, 55);
        }
      }

      // Role in sequence bonus if playlist item
      if (pItem) {
        if (mIdx === 0 && (pItem.roleInSequence === 'foundation' || pItem.roleInSequence === 'core_concept')) {
          score += 6;
        } else if (mIdx === totalModules - 1 && (pItem.roleInSequence === 'advanced_synthesis' || pItem.roleInSequence === 'deep_dive')) {
          score += 6;
        }
      }

      moduleScores.set(mIdx, score);
      if (score >= 48) {
        coveredModules.add(mIdx);
      }
    });

    const coverageRatio = totalModules > 0 ? coveredModules.size / totalModules : 0;
    const isComprehensiveTutorial = !isPlaylist && (isLongForm || isFullCourseType || hasFullCourseTitle) &&
      (coverageRatio >= 0.60 || (totalModules <= 3 && coveredModules.size >= 2) || (totalModules === 4 && coveredModules.size >= 3));
    const isCompletePlaylist = isPlaylist &&
      (coverageRatio >= 0.60 || (totalModules <= 3 && coveredModules.size >= 2) || (totalModules === 4 && coveredModules.size >= 3));

    const baseScore = v.score?.overall ?? v.finalScore ?? 75;
    const verifiedBonus = (v.verificationStatus === 'verified' || Boolean(v.educatorName)) ? 6 : 0;
    const freshness = v.score?.freshness ?? calculateFreshnessScore(v.publishedAt || (v.metadata?.publishedAt as string));
    // Quality, syllabus relevance and educator verification signals dominate recency
    const compositeScore = (baseScore + verifiedBonus) * 0.75 + freshness * 0.25;

    return {
      video: v,
      playlistItem: pItem,
      coveredModules,
      moduleScores,
      isComprehensiveTutorial,
      isCompletePlaylist,
      coverageRatio,
      compositeScore,
    };
  });

  // Strategy 1: Look for One High-Quality Comprehensive Tutorial (Priority 1)
  const comprehensiveTutorialCandidates = coverageEvaluations
    .filter((c) => c.isComprehensiveTutorial && (c.video.score?.overall || 60) >= 50)
    .sort((a, b) => {
      if (b.coveredModules.size !== a.coveredModules.size) {
        return b.coveredModules.size - a.coveredModules.size;
      }
      return b.compositeScore - a.compositeScore;
    });

  // Strategy 2: Look for One Complete Relevant Playlist (Priority 2)
  const completePlaylistCandidates = coverageEvaluations
    .filter((c) => c.isCompletePlaylist && (c.video.score?.overall || 60) >= 50)
    .sort((a, b) => {
      if (b.coveredModules.size !== a.coveredModules.size) {
        return b.coveredModules.size - a.coveredModules.size;
      }
      return b.compositeScore - a.compositeScore;
    });

  let primaryResource: CandidateCoverage | null = null;
  let primaryKind: 'tutorial' | 'playlist' | 'none' = 'none';

  if (comprehensiveTutorialCandidates.length > 0) {
    primaryResource = comprehensiveTutorialCandidates[0];
    primaryKind = 'tutorial';
  } else if (completePlaylistCandidates.length > 0) {
    primaryResource = completePlaylistCandidates[0];
    primaryKind = 'playlist';
  }

  function extractCleanVideoId(video: EngineResource): string | null {
    const vUrl = video.canonicalUrl || video.sourceUrl;
    const fromUrl = extractYouTubeVideoId(vUrl);
    if (fromUrl) return fromUrl;
    if (video.externalId) return video.externalId;
    if (typeof video.metadata?.videoId === 'string') return video.metadata.videoId;
    return null;
  }

  if (primaryResource) {
    const usedVideoIds = new Set<string>();
    const usedCanonicalUrls = new Set<string>();
    const usedChapterSeconds = new Set<number>();

    const primaryVid = primaryResource.video;
    const primaryVidId = extractCleanVideoId(primaryVid);
    const primaryUrl = primaryVid.canonicalUrl || primaryVid.sourceUrl;

    // Check if primary video has chapters
    const chapters = primaryKind === 'tutorial'
      ? extractVideoChapters(primaryVid.description || (primaryVid.metadata?.description as string) || '')
      : [];

    learningPath.modules.forEach((mod, mIdx) => {
      const isCovered = primaryResource!.coveredModules.has(mIdx);
      const modTargets = videoTargets.filter((vt) => vt.modIdx === mIdx);

      if (isCovered) {
        let assignedVideo = primaryVid;
        let assignedUrl = primaryUrl;
        let selectionReason =
          primaryKind === 'tutorial'
            ? `Comprehensive full-course tutorial${primaryVid.educatorName ? ` from verified educator ${primaryVid.educatorName}` : ''} covering ${mod.title} concepts.`
            : `Complete course playlist${primaryVid.educatorName ? ` from verified educator ${primaryVid.educatorName}` : ''} covering ${mod.title} syllabus progression.`;

        if (primaryKind === 'tutorial') {
          // 1. Try to find a matching chapter in the comprehensive video
          let matchedChapter = null as ReturnType<typeof extractVideoChapters>[number] | null;
          if (chapters.length > 0) {
            const modTokens = tokenize(`${mod.title} ${mod.objective} ${mod.lessons.map(l => `${l.title} ${(l.keyConcepts || []).join(' ')}`).join(' ')}`);
            let bestScore = 0;
            for (const ch of chapters) {
              if (usedChapterSeconds.has(ch.timestampSeconds)) continue;
              const chTokens = tokenize(ch.title);
              let matchCount = 0;
              for (const t of chTokens) {
                if (modTokens.has(t)) matchCount++;
              }
              if (matchCount > bestScore) {
                bestScore = matchCount;
                matchedChapter = ch;
              }
            }
          }

          if (matchedChapter) {
            usedChapterSeconds.add(matchedChapter.timestampSeconds);
            assignedUrl = formatYouTubeTimestampUrl(primaryUrl, matchedChapter.timestampSeconds);
            selectionReason = `Comprehensive full-course tutorial (Chapter: "${matchedChapter.title}" at ${matchedChapter.timestampFormatted}) covering ${mod.title} concepts.`;
            if (primaryVidId) usedVideoIds.add(primaryVidId);
            if (assignedUrl) usedCanonicalUrls.add(assignedUrl);
          } else {
            // Comprehensive one-shot lecture adequately covers the topic: anchor it across modules without arbitrarily mixing channels
            assignedVideo = primaryVid;
            assignedUrl = primaryUrl;
            selectionReason = `Comprehensive full-course tutorial${primaryVid.educatorName ? ` from verified educator ${primaryVid.educatorName}` : ''} covering ${mod.title} concepts.`;
            if (primaryVidId) usedVideoIds.add(primaryVidId);
            if (assignedUrl) usedCanonicalUrls.add(assignedUrl);
          }
        } else if (primaryKind === 'playlist') {
          // 2. Complete Playlist: Map constituent videos from the same playlist if available
          const constituentCandidates = coverageEvaluations
            .filter((cand) => {
              const cVid = cand.video;
              if (cVid === primaryVid) return false;
              const samePlaylist = Boolean(
                (cVid.metadata?.playlistId && cVid.metadata.playlistId === primaryVid.metadata?.playlistId) ||
                (cand.playlistItem && primaryResource?.playlistItem)
              );
              const cVidId = extractCleanVideoId(cVid);
              const cUrl = cVid.canonicalUrl || cVid.sourceUrl;
              if (cVidId && usedVideoIds.has(cVidId)) return false;
              if (cUrl && usedCanonicalUrls.has(cUrl)) return false;
              return samePlaylist && (cand.moduleScores.get(mIdx) || 0) >= 45;
            })
            .sort((a, b) => (b.moduleScores.get(mIdx) || 0) - (a.moduleScores.get(mIdx) || 0));

          if (constituentCandidates.length > 0) {
            const constituent = constituentCandidates[0];
            assignedVideo = constituent.video;
            assignedUrl = constituent.video.canonicalUrl || constituent.video.sourceUrl;
            const cVidId = extractCleanVideoId(assignedVideo);
            if (cVidId) usedVideoIds.add(cVidId);
            if (assignedUrl) usedCanonicalUrls.add(assignedUrl);
            selectionReason = `Complete course playlist lecture${assignedVideo.educatorName ? ` from verified educator ${assignedVideo.educatorName}` : ''} covering ${mod.title} syllabus progression.`;
          } else {
            assignedVideo = primaryVid;
            assignedUrl = primaryUrl;
            selectionReason = `Complete course playlist${primaryVid.educatorName ? ` from verified educator ${primaryVid.educatorName}` : ''} covering ${mod.title} syllabus progression.`;
            if (primaryVidId) usedVideoIds.add(primaryVidId);
            if (primaryUrl) usedCanonicalUrls.add(primaryUrl);
          }
        }

        for (const target of modTargets) {
          const lessonKey = `${target.modIdx}-${target.lesIdx}`;
          videoAssignmentMap.set(lessonKey, {
            video: assignedVideo,
            playlistItem: assignedVideo === primaryVid ? primaryResource!.playlistItem : undefined,
            customUrl: assignedUrl,
            customSelectionReason: selectionReason,
          });
        }
      } else {
        // Module concepts missing from primary resource: assign targeted supplementary individual video
        // First check if the primary educator has a supplementary video covering this module
        const sameEducatorSupplementary = coverageEvaluations
          .filter((cand) => {
            const cVid = cand.video;
            if (cVid === primaryVid) return false;
            const cVidId = extractCleanVideoId(cVid);
            const cUrl = cVid.canonicalUrl || cVid.sourceUrl;
            if (primaryVidId && cVidId === primaryVidId) return false;
            if (cVidId && usedVideoIds.has(cVidId)) return false;
            if (cUrl && usedCanonicalUrls.has(cUrl)) return false;
            const sameEducator = Boolean(
              (primaryVid.educatorName && cVid.educatorName === primaryVid.educatorName) ||
              (primaryVid.authorOrChannel && cVid.authorOrChannel === primaryVid.authorOrChannel)
            );
            return sameEducator && (cand.moduleScores.get(mIdx) || 0) >= 45;
          })
          .sort((a, b) => (b.moduleScores.get(mIdx) || 0) - (a.moduleScores.get(mIdx) || 0));

        const supplementaryCandidates = (sameEducatorSupplementary.length > 0 ? sameEducatorSupplementary : coverageEvaluations)
          .filter((cand) => {
            const cVidId = extractCleanVideoId(cand.video);
            const cUrl = cand.video.canonicalUrl || cand.video.sourceUrl;
            if (primaryVidId && cVidId === primaryVidId) return false;
            if (cVidId && usedVideoIds.has(cVidId)) return false;
            if (cUrl && usedCanonicalUrls.has(cUrl)) return false;
            return (cand.moduleScores.get(mIdx) || 0) >= 48;
          })
          .sort((a, b) => (b.moduleScores.get(mIdx) || 0) - (a.moduleScores.get(mIdx) || 0));

        if (supplementaryCandidates.length > 0) {
          const supp = supplementaryCandidates[0];
          const sUrl = supp.video.canonicalUrl || supp.video.sourceUrl;
          const sVidId = extractYouTubeVideoId(sUrl) || supp.video.externalId;
          if (sVidId && !supp.isCompletePlaylist && supp.video.type !== 'youtube_playlist') {
            usedVideoIds.add(sVidId);
          }
          if (sUrl && !supp.isCompletePlaylist && supp.video.type !== 'youtube_playlist') {
            usedCanonicalUrls.add(sUrl);
          }
          for (const target of modTargets) {
            const lessonKey = `${target.modIdx}-${target.lesIdx}`;
            videoAssignmentMap.set(lessonKey, {
              video: supp.video,
              playlistItem: supp.playlistItem,
              customUrl: sUrl,
              customSelectionReason: `Targeted supplementary lecture${supp.video.educatorName ? ` from verified educator ${supp.video.educatorName}` : ''} covering ${mod.title} concepts missing from the primary course tutorial.`,
            });
          }
        }
      }
    });
  } else {
    // Strategy 3: Smart Fallback (Smallest Complementary Combination)
    // When no single tutorial or playlist covers >= 60% of syllabus, select
    // the minimal subset of complementary resources that achieves sufficient coverage.
    // Ensure strict module-resource alignment and avoid duplicate recommendations.

    // Identify dominant educator/channel across all candidates with score >= 48
    // to encourage coherent multi-module series over arbitrary channel hopping
    const educatorCoverageCounts = new Map<string, number>();
    for (const cand of coverageEvaluations) {
      const eduKey = cand.video.educatorName || cand.video.authorOrChannel || '';
      if (!eduKey) continue;
      let count = 0;
      for (let mIdx = 0; mIdx < totalModules; mIdx++) {
        if ((cand.moduleScores.get(mIdx) || 0) >= 48) count++;
      }
      educatorCoverageCounts.set(eduKey, (educatorCoverageCounts.get(eduKey) || 0) + count);
    }

    let dominantEducator: string | null = null;
    let maxCoverage = 1;
    for (const [edu, count] of educatorCoverageCounts.entries()) {
      if (count > maxCoverage) {
        maxCoverage = count;
        dominantEducator = edu;
      }
    }

    interface ModulePairing {
      cand: CandidateCoverage;
      modIdx: number;
      score: number;
      isMultiModule: boolean;
    }

    const pairings: ModulePairing[] = [];
    for (const cand of coverageEvaluations) {
      const isMultiModule = cand.isCompletePlaylist || cand.video.type === 'youtube_playlist';
      const eduKey = cand.video.educatorName || cand.video.authorOrChannel || '';
      const isDominant = Boolean(dominantEducator && eduKey === dominantEducator);

      for (let mIdx = 0; mIdx < totalModules; mIdx++) {
        let score = cand.moduleScores.get(mIdx) || 0;
        if (score >= 48) {
          if (isDominant) {
            score += 8; // Channel coherence bonus to maintain consistent educator
          }
          pairings.push({
            cand,
            modIdx: mIdx,
            score,
            isMultiModule,
          });
        }
      }
    }

    const moduleCandidateCounts = new Map<number, number>();
    for (let mIdx = 0; mIdx < totalModules; mIdx++) {
      let count = 0;
      for (const cand of coverageEvaluations) {
        if ((cand.moduleScores.get(mIdx) || 0) >= 48) count++;
      }
      moduleCandidateCounts.set(mIdx, count);
    }

    // Sort pairings: prioritize modules with fewer candidate options (MRV) to prevent greedy starvation,
    // then highest affinity score, then composite score.
    pairings.sort((a, b) => {
      const countA = moduleCandidateCounts.get(a.modIdx) || 0;
      const countB = moduleCandidateCounts.get(b.modIdx) || 0;
      if (countA !== countB) {
        return countA - countB;
      }
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.cand.compositeScore - a.cand.compositeScore;
    });

    const coveredModules = new Map<number, { video: EngineResource; playlistItem?: SequencedResourceItem; score: number }>();
    const usedVideoIds = new Set<string>();
    const usedCanonicalUrls = new Set<string>();

    for (const pair of pairings) {
      // If module is already covered by a better or equal resource, skip
      if (coveredModules.has(pair.modIdx)) {
        continue;
      }

      const vUrl = pair.cand.video.canonicalUrl || pair.cand.video.sourceUrl;
      const vidId = extractCleanVideoId(pair.cand.video);
      const canonicalUrl = canonicalizeUrl(vUrl);

      // If individual video has already been assigned to another module, it cannot be reused
      if (!pair.isMultiModule) {
        if (vidId && usedVideoIds.has(vidId)) {
          continue;
        }
        if (canonicalUrl && usedCanonicalUrls.has(canonicalUrl)) {
          continue;
        }
      }

      coveredModules.set(pair.modIdx, {
        video: pair.cand.video,
        playlistItem: pair.cand.playlistItem,
        score: pair.score,
      });

      if (!pair.isMultiModule) {
        if (vidId) usedVideoIds.add(vidId);
        if (canonicalUrl) usedCanonicalUrls.add(canonicalUrl);
      }
    }

    // For any module not yet covered, check next-best candidates
    for (let mIdx = 0; mIdx < totalModules; mIdx++) {
      if (!coveredModules.has(mIdx)) {
        const remaining = coverageEvaluations
          .filter((cand) => {
            const vUrl = cand.video.canonicalUrl || cand.video.sourceUrl;
            const vidId = extractCleanVideoId(cand.video);
            const canonicalUrl = canonicalizeUrl(vUrl);
            const isMulti = cand.isCompletePlaylist || cand.video.type === 'youtube_playlist';
            if (!isMulti) {
              if (vidId && usedVideoIds.has(vidId)) return false;
              if (canonicalUrl && usedCanonicalUrls.has(canonicalUrl)) return false;
            }
            return (cand.moduleScores.get(mIdx) || 0) >= 48;
          })
          .sort((a, b) => (b.moduleScores.get(mIdx) || 0) - (a.moduleScores.get(mIdx) || 0));

        if (remaining.length > 0) {
          const best = remaining[0];
          const vUrl = best.video.canonicalUrl || best.video.sourceUrl;
          const vidId = extractCleanVideoId(best.video);
          const canonicalUrl = canonicalizeUrl(vUrl);
          const isMulti = best.isCompletePlaylist || best.video.type === 'youtube_playlist';

          coveredModules.set(mIdx, {
            video: best.video,
            playlistItem: best.playlistItem,
            score: best.moduleScores.get(mIdx) || 0,
          });

          if (!isMulti) {
            if (vidId) usedVideoIds.add(vidId);
            if (canonicalUrl) usedCanonicalUrls.add(canonicalUrl);
          }
        }
      }
    }

    // Map assigned resources to module video lessons
    for (const target of videoTargets) {
      const lessonKey = `${target.modIdx}-${target.lesIdx}`;
      const match = coveredModules.get(target.modIdx);
      if (match) {
        let assignedVideo = match.video;
        let assignedPlaylistItem = match.playlistItem;
        let assignedReason = `Topical lecture${match.video.educatorName ? ` from verified educator ${match.video.educatorName}` : ''} covering ${target.lesson.title} aligned to ${target.moduleTitle}.`;

        // If this is a secondary video lesson in the same module, see if there is an unused candidate specifically matching it
        if (target.lesIdx > 0) {
          const lessonIsPractical = /\b(project|implement|code|hands[\s-]?on|practice|exercise|build)\b/i.test(target.lesson.title);
          const lessonUnused = coverageEvaluations
            .filter((cand) => {
              const vUrl = cand.video.canonicalUrl || cand.video.sourceUrl;
              const vidId = extractCleanVideoId(cand.video);
              const canonicalUrl = canonicalizeUrl(vUrl);
              if (vidId && usedVideoIds.has(vidId)) return false;
              if (canonicalUrl && usedCanonicalUrls.has(canonicalUrl)) return false;
              return (cand.moduleScores.get(target.modIdx) || 0) >= 48;
            })
            .sort((a, b) => {
              if (lessonIsPractical) {
                const practA = a.video.score?.practicalDepth ?? a.video.practicalDepthScore ?? 50;
                const practB = b.video.score?.practicalDepth ?? b.video.practicalDepthScore ?? 50;
                if (Math.abs(practA - practB) >= 15) {
                  return practB - practA;
                }
              }
              return (b.moduleScores.get(target.modIdx) || 0) - (a.moduleScores.get(target.modIdx) || 0);
            });

          if (lessonUnused.length > 0) {
            const specificVideo = lessonUnused[0];
            const vUrl = specificVideo.video.canonicalUrl || specificVideo.video.sourceUrl;
            const vidId = extractYouTubeVideoId(vUrl) || specificVideo.video.externalId;
            const canonicalUrl = canonicalizeUrl(vUrl);
            if (vidId) usedVideoIds.add(vidId);
            if (canonicalUrl) usedCanonicalUrls.add(canonicalUrl);
            assignedVideo = specificVideo.video;
            assignedPlaylistItem = specificVideo.playlistItem;
            assignedReason = `Complementary ${lessonIsPractical ? 'practical hands-on' : 'topical'} lecture${specificVideo.video.educatorName ? ` from verified educator ${specificVideo.video.educatorName}` : ''} covering ${target.lesson.title}.`;
          }
        }

        videoAssignmentMap.set(lessonKey, {
          video: assignedVideo,
          playlistItem: assignedPlaylistItem,
          customUrl: assignedVideo.canonicalUrl || assignedVideo.sourceUrl,
          customSelectionReason: assignedReason,
        });
      }
    }
  }

  // -------------------------------------------------------------
  // 2. Assign Documents (Monographs / Papers)
  // -------------------------------------------------------------
  const docCandidates: { target: LessonTarget; doc: EngineResource; score: number }[] = [];
  for (const target of docTargets) {
    for (const d of documentResources) {
      const score = computeSemanticAffinity(d, target.combinedTokens, targetDifficulty, target.moduleNumber, target.moduleId, target.lessonTokens);
      docCandidates.push({ target, doc: d, score });
    }
  }
  docCandidates.sort((a, b) => b.score - a.score);

  const assignedDocUrls = new Set<string>();
  const assignedDocLessons = new Set<string>();
  const docAssignmentMap = new Map<string, EngineResource>();

  for (const cand of docCandidates) {
    const lessonKey = `${cand.target.modIdx}-${cand.target.lesIdx}`;
    const dUrl = cand.doc.canonicalUrl || cand.doc.sourceUrl;
    if (cand.score >= 35 && !assignedDocLessons.has(lessonKey) && !assignedDocUrls.has(dUrl)) {
      assignedDocLessons.add(lessonKey);
      assignedDocUrls.add(dUrl);
      docAssignmentMap.set(lessonKey, cand.doc);
    }
  }

  // Second pass: assign best available unassigned document candidate to remaining reading lessons
  for (const target of docTargets) {
    const lessonKey = `${target.modIdx}-${target.lesIdx}`;
    if (!assignedDocLessons.has(lessonKey)) {
      const fallbackDoc = documentResources.find((d) => !assignedDocUrls.has(d.canonicalUrl || d.sourceUrl));
      if (fallbackDoc) {
        const dUrl = fallbackDoc.canonicalUrl || fallbackDoc.sourceUrl;
        assignedDocLessons.add(lessonKey);
        assignedDocUrls.add(dUrl);
        docAssignmentMap.set(lessonKey, fallbackDoc);
      }
    }
  }

  // -------------------------------------------------------------
  // 3. Assign Practice Sets (Problem Sets / PYQs)
  // -------------------------------------------------------------
  const practiceCandidates: { target: LessonTarget; practice: EngineResource; score: number }[] = [];
  for (const target of practiceTargets) {
    for (const pr of practiceResources) {
      const score = computeSemanticAffinity(pr, target.combinedTokens, targetDifficulty, target.moduleNumber, target.moduleId, target.lessonTokens);
      practiceCandidates.push({ target, practice: pr, score });
    }
  }
  practiceCandidates.sort((a, b) => b.score - a.score);

  const assignedPracticeUrls = new Set<string>();
  const assignedPracticeLessons = new Set<string>();
  const practiceAssignmentMap = new Map<string, EngineResource>();

  for (const cand of practiceCandidates) {
    const lessonKey = `${cand.target.modIdx}-${cand.target.lesIdx}`;
    const pUrl = cand.practice.canonicalUrl || cand.practice.sourceUrl;
    if (cand.score >= 40 && !assignedPracticeLessons.has(lessonKey) && !assignedPracticeUrls.has(pUrl)) {
      assignedPracticeLessons.add(lessonKey);
      assignedPracticeUrls.add(pUrl);
      practiceAssignmentMap.set(lessonKey, cand.practice);
    }
  }

  // -------------------------------------------------------------
  // 4. Assign Quizzes (Diagnostic Checkpoints)
  // -------------------------------------------------------------
  const quizCandidates: { target: LessonTarget; quiz: EngineResource; score: number }[] = [];
  for (const target of quizTargets) {
    for (const q of quizResources) {
      let score = computeSemanticAffinity(q, target.combinedTokens, targetDifficulty, target.moduleNumber, target.moduleId, target.lessonTokens);
      if (q.title.toLowerCase().includes(target.moduleTitle.toLowerCase())) {
        score += 20;
      }
      quizCandidates.push({ target, quiz: q, score });
    }
  }
  quizCandidates.sort((a, b) => b.score - a.score);

  const assignedQuizUrls = new Set<string>();
  const assignedQuizLessons = new Set<string>();
  const quizAssignmentMap = new Map<string, EngineResource>();

  for (const cand of quizCandidates) {
    const lessonKey = `${cand.target.modIdx}-${cand.target.lesIdx}`;
    const qUrl = cand.quiz.canonicalUrl || cand.quiz.sourceUrl;
    if (cand.score >= 35 && !assignedQuizLessons.has(lessonKey) && !assignedQuizUrls.has(qUrl)) {
      assignedQuizLessons.add(lessonKey);
      assignedQuizUrls.add(qUrl);
      quizAssignmentMap.set(lessonKey, cand.quiz);
    }
  }

  // -------------------------------------------------------------
  // 5. Construct Final Distributed Modules
  // -------------------------------------------------------------
  const distributedModules = learningPath.modules.map((mod, modIdx) => {
    let moduleResourceCount = 0;
    const modTokens = tokenize(`${mod.title} ${mod.objective}`);

    const distributedLessons = mod.lessons.map((rawLes, lesIdx) => {
      const les = { ...rawLes } as DistributedModuleLesson;
      const lessonKey = `${modIdx}-${lesIdx}`;
      const lessonTokens = tokenize(`${les.title} ${(les.keyConcepts || []).join(' ')} ${mod.title}`);
      const combinedTokens = new Set([...lessonTokens, ...modTokens]);

      // Video Lesson
      if (les.type === 'video') {
        const match = videoAssignmentMap.get(lessonKey);
        if (match) {
          const { video, playlistItem } = match;
          const videoUrl = match.customUrl || video.canonicalUrl || video.sourceUrl;
          les.sourceName = video.authorOrChannel || video.sourceName;
          les.sourceUrl = videoUrl;
          if (video.durationMinutes > 0) {
            les.estimatedMinutes = video.durationMinutes;
          }
          les.qualityScore = video.score?.overall ?? video.finalScore ?? 85;
          les.thumbnailUrl = video.thumbnailUrl;
          les.educatorId = video.educatorId;
          les.educatorName = video.educatorName;
          les.channelId = video.channelId;
          les.discoverySource = video.discoverySource;
          les.verificationStatus = video.verificationStatus;
          les.selectionExplanation = video.selectionExplanation;
          les.coverageAssessment = video.coverageAssessment;
          if (playlistItem) {
            les.sequenceNumber = playlistItem.sequenceNumber;
            les.roleInSequence = playlistItem.roleInSequence;
            les.selectionReason = match.customSelectionReason || playlistItem.selectionReason;
            les.positionReason = playlistItem.positionReason;
            les.qualityEvidence = {
              hasCaptions: playlistItem.qualityScore.evidence.hasCaptionsOrTranscript,
              hasHd: playlistItem.qualityScore.evidence.hasHighDefinition,
              hasChapters: playlistItem.qualityScore.evidence.hasTimestampsOrChapters,
              confidence: playlistItem.qualityScore.evidence.evidenceConfidence,
              uncertaintyReasons: playlistItem.qualityScore.evidence.uncertaintyReasons,
            };
          } else if (match.customSelectionReason) {
            les.selectionReason = match.customSelectionReason;
          } else if (video.selectionExplanation) {
            les.selectionReason = video.selectionExplanation;
          } else if (!les.selectionReason) {
            les.selectionReason = `Topical lecture covering ${les.title} aligned to ${mod.title}.`;
          }
          moduleResourceCount++;
        } else {
          // Honest empty state when no verified video candidate meets relevance criteria
          les.sourceName = 'Curated Lecture Video';
          les.sourceUrl = undefined;
          les.thumbnailUrl = undefined;
          les.qualityScore = undefined;
          les.selectionReason = `No external video met the stringent topical alignment threshold for "${les.title}".`;
        }
      }
      // Monograph / Reading Lesson
      else if (les.type === 'monograph') {
        const doc = docAssignmentMap.get(lessonKey) || documentResources.find((d) => !assignedDocUrls.has(d.canonicalUrl || d.sourceUrl)) || documentResources[0];
        if (doc) {
          les.sourceName = doc.authorOrChannel || doc.sourceName || doc.provider || 'Pencill Academic Library';
          les.sourceUrl = doc.canonicalUrl || doc.sourceUrl;
          les.qualityScore = doc.score?.overall ?? doc.finalScore ?? 85;
          moduleResourceCount++;
        } else {
          les.sourceName = 'Pencill Academic Library';
          les.sourceUrl = undefined;
          les.qualityScore = 80;
          moduleResourceCount++;
        }
      }
      // Practice Lesson
      else if (les.type === 'practice') {
        const practice = practiceAssignmentMap.get(lessonKey);
        if (practice) {
          les.sourceName = practice.authorOrChannel || practice.sourceName || practice.provider || 'Pencill Problem Set Archive';
          les.sourceUrl = practice.canonicalUrl || practice.sourceUrl;
          les.qualityScore = practice.score?.overall ?? practice.finalScore;
          moduleResourceCount++;
        } else {
          les.sourceName = 'Pencill Problem Set Archive';
          les.sourceUrl = undefined;
          les.qualityScore = 80;
          moduleResourceCount++;
        }
      }
      // Quiz Lesson
      else if (les.type === 'quiz') {
        const quiz = quizAssignmentMap.get(lessonKey) || quizResources.find((q) => !assignedPracticeUrls.has(q.canonicalUrl || q.sourceUrl)) || quizResources[0];
        if (quiz) {
          const qUrl = quiz.canonicalUrl || quiz.sourceUrl;
          assignedPracticeUrls.add(qUrl);
          les.sourceName = quiz.sourceName || 'Pencill Formative Assessment';
          les.sourceUrl = qUrl;
          les.qualityScore = quiz.score?.overall ?? quiz.finalScore ?? 90;
          moduleResourceCount++;
        } else {
          les.sourceName = 'Pencill Formative Checkpoint';
          les.sourceUrl = undefined;
          les.qualityScore = 85;
          moduleResourceCount++;
        }
      }
      // Formula / Memory Deck Lesson
      else if (les.type === 'formulae') {
        les.sourceName = 'Pencill Memory Deck & Formula Sheets';
        les.qualityScore = 90;
        moduleResourceCount++;
      }

      // Companion Study Notes (Assigned to all lessons for deep study)
      const candidateNotes = documentResources
        .map((doc) => ({
          doc,
          score: computeSemanticAffinity(doc, combinedTokens, undefined, mod.moduleNumber || modIdx + 1, (mod as { id?: string }).id),
        }))
        .filter((sd) => sd.score >= (options?.minQualityScore ?? 45))
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
        .map((sd) => toLessonNoteResource(sd.doc));

      if (candidateNotes.length > 0) {
        les.studyNotes = candidateNotes;
      } else {
        les.studyNotes = [
          {
            id: `note-${mod.moduleNumber || modIdx + 1}-${lesIdx + 1}`,
            title: `${les.title} Reference Guide`,
            type: 'reference_guide',
            sourceUrl: undefined,
            publisher: 'Pencill Academic Library',
            description: `Academic reference notes covering ${les.title} aligned to ${mod.title} learning objectives.`,
            isDirectPdf: false,
            qualityScore: 80,
            relevanceExplanation: `Curated syllabus reference notes covering ${les.title}`,
          },
        ];
      }

      return les;
    });

    return {
      ...mod,
      totalResources: moduleResourceCount,
      lessons: distributedLessons,
    };
  });

  return {
    ...learningPath,
    modules: distributedModules,
  };
}
