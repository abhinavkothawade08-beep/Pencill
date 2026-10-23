export type EngineResourceType =
  | 'video_lecture'
  | 'youtube_playlist'
  | 'full_course'
  | 'reading_material'
  | 'article'
  | 'educational_web_page'
  | 'pdf_lecture_notes'
  | 'study_notes'
  | 'lecture_handout'
  | 'official_documentation'
  | 'reference_guide'
  | 'textbook'
  | 'research_paper'
  | 'practice_questions'
  | 'pyq'
  | 'question_bank'
  | 'mock_test'
  | 'ai_quiz'
  | 'monograph'
  | 'practice_sheet';

export type ResourceDifficulty =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'competitive';

export type ResourceProviderType =
  | 'google'
  | 'youtube'
  | 'web'
  | 'practice'
  | 'quiz'
  | 'notes'
  | 'academic_notes'
  | 'arxiv'
  | 'openalex'
  | 'wikimedia'
  | 'database'
  | 'internal'
  | 'archive'
  | 'open_educational'
  | 'custom';

export type LearningObjectiveIntent =
  | 'concept_quick'
  | 'concept_detailed'
  | 'hands_on_tutorial'
  | 'practical_project'
  | 'comprehensive_course';

export interface DurationRange {
  minMinutes: number;
  targetMinMinutes: number;
  targetMaxMinutes: number;
  maxMinutes: number;
}

export type DurationPreferenceMap = Record<LearningObjectiveIntent, DurationRange>;

export interface PracticalLearningSignals {
  hasProject: boolean;
  hasCodeWalkthrough: boolean;
  hasHandsOn: boolean;
  hasStepByStep: boolean;
  hasExercises: boolean;
  hasRealWorld: boolean;
  hasCompleteImplementation: boolean;
  signalScore: number; // 0 - 100
}

export interface ResourceQualityBreakdown {
  overall: number; // 0 - 100
  relevance: number; // 0 - 100
  educationalValue: number; // 0 - 100
  structureCompleteness: number; // 0 - 100
  freshness: number; // 0 - 100
  durationSuitability?: number; // 0 - 100
  practicalDepth?: number; // 0 - 100
  explanation?: string;
}

export interface EngineResource {
  id: string;
  title: string;
  description?: string;
  type: EngineResourceType;
  canonicalUrl: string;
  sourceUrl: string;
  sourceName: string;
  provider?: ResourceProviderType;
  externalId?: string;
  authorOrChannel?: string;
  thumbnailUrl?: string;
  durationMinutes: number;
  difficulty: ResourceDifficulty;
  language: string;
  score: ResourceQualityBreakdown;
  tags: string[];
  examCategory?: string;
  metadata?: Record<string, unknown>;
  discoveredAt?: string;

  // Practical depth & duration suitability signals
  durationSuitabilityScore?: number;
  practicalDepthScore?: number;
  learningIntent?: LearningObjectiveIntent;
  resourceCategory?: string;
  practicalEvidence?: Record<string, unknown>;

  // Master Educator Directory enrichment
  educatorId?: string;
  educatorName?: string;
  channelId?: string;
  discoverySource?: 'curated_directory' | 'fallback_search';
  verificationStatus?: 'VERIFIED' | 'UNVERIFIED' | string;
  selectionExplanation?: string;
  coverageAssessment?: string;
  isCompleteCourse?: boolean;
  isStructuredPlaylist?: boolean;

  // Compatibility and alias fields
  url?: string;
  author?: string;
  duration?: string;
  publishedAt?: string;
  relevanceScore?: number;
  educationalValueScore?: number;
  structureScore?: number;
  freshnessScore?: number;
  authorityScore?: number;
  finalScore?: number;
}

export interface NormalizedPublicResource {
  id: string;
  title: string;
  url: string;
  description?: string;
  type:
    | 'video'
    | 'playlist'
    | 'article'
    | 'course'
    | 'book'
    | 'notes'
    | 'practice'
    | 'quiz'
    | 'other';
  provider: 'google' | 'youtube' | 'internal';
  sourceName?: string;
  thumbnailUrl?: string;
  author?: string;
  duration?: string;
  publishedAt?: string;
  relevanceScore?: number;
  educationalValueScore?: number;
  structureScore?: number;
  freshnessScore?: number;
  authorityScore?: number;
  finalScore?: number;
  isDirectPdf?: boolean;
  downloadUrl?: string;

  // Educator Directory metadata
  educatorId?: string;
  educatorName?: string;
  channelId?: string;
  discoverySource?: 'curated_directory' | 'fallback_search';
  verificationStatus?: string;
  selectionExplanation?: string;
  coverageAssessment?: string;
  isCompleteCourse?: boolean;
  resourceCategory?: string;
  practicalEvidence?: Record<string, unknown>;
}

/**
 * Maps granular EngineResourceType to core Pencill database / frontend ResourceType
 * ('video' | 'monograph' | 'practice' | 'quiz' | 'paper' | 'formulae')
 */
export function toCoreResourceType(
  type: EngineResourceType
): 'video' | 'monograph' | 'practice' | 'quiz' | 'paper' | 'formulae' {
  switch (type) {
    case 'video_lecture':
    case 'youtube_playlist':
    case 'full_course':
      return 'video';
    case 'reading_material':
    case 'article':
    case 'educational_web_page':
    case 'study_notes':
    case 'lecture_handout':
    case 'official_documentation':
    case 'reference_guide':
    case 'textbook':
    case 'monograph':
      return 'monograph';
    case 'pdf_lecture_notes':
    case 'research_paper':
      return 'paper';
    case 'practice_questions':
    case 'pyq':
    case 'question_bank':
    case 'mock_test':
    case 'practice_sheet':
      return 'practice';
    case 'ai_quiz':
      return 'quiz';
    default:
      return 'monograph';
  }
}

export function toPublicResource(res: EngineResource, finalScore?: number): NormalizedPublicResource {
  let mappedType: NormalizedPublicResource['type'] = 'other';
  switch (res.type) {
    case 'video_lecture':
      mappedType = 'video';
      break;
    case 'youtube_playlist':
      mappedType = 'playlist';
      break;
    case 'full_course':
      mappedType = 'course';
      break;
    case 'reading_material':
    case 'textbook':
      mappedType = 'book';
      break;
    case 'article':
    case 'educational_web_page':
    case 'official_documentation':
    case 'research_paper':
      mappedType = 'article';
      break;
    case 'pdf_lecture_notes':
    case 'study_notes':
    case 'lecture_handout':
    case 'reference_guide':
    case 'monograph':
      mappedType = 'notes';
      break;
    case 'practice_questions':
    case 'pyq':
    case 'question_bank':
    case 'mock_test':
    case 'practice_sheet':
      mappedType = 'practice';
      break;
    case 'ai_quiz':
      mappedType = 'quiz';
      break;
    default:
      mappedType = 'other';
  }

  let provider: NormalizedPublicResource['provider'] = 'internal';
  if (res.provider === 'google' || res.provider === 'web') {
    provider = 'google';
  } else if (res.provider === 'youtube') {
    provider = 'youtube';
  }

  const directUrl = res.canonicalUrl || res.sourceUrl;
  const isDirectPdf = Boolean(res.metadata?.isDirectPdf || directUrl.toLowerCase().endsWith('.pdf'));
  const downloadUrl = (res.metadata?.downloadUrl as string) || (isDirectPdf ? directUrl : undefined);

  return {
    id: res.id,
    title: res.title,
    url: directUrl,
    description: res.description,
    type: mappedType,
    provider,
    sourceName: res.sourceName,
    thumbnailUrl: res.thumbnailUrl,
    author: res.authorOrChannel || res.author,
    duration: res.duration || (res.durationMinutes ? `${res.durationMinutes} min` : undefined),
    publishedAt: (res.metadata?.publishedAt as string) || res.publishedAt,
    relevanceScore: res.score?.relevance,
    educationalValueScore: res.score?.educationalValue,
    structureScore: res.score?.structureCompleteness,
    freshnessScore: res.score?.freshness,
    authorityScore: res.authorityScore,
    finalScore: finalScore ?? res.finalScore ?? res.score?.overall,
    isDirectPdf,
    downloadUrl,
    educatorId: res.educatorId || (res.metadata?.educatorId as string),
    educatorName: res.educatorName || (res.metadata?.educatorName as string),
    channelId: res.channelId || (res.metadata?.channelId as string),
    discoverySource: res.discoverySource || (res.metadata?.discoverySource as any) || 'curated_directory',
    verificationStatus: res.verificationStatus || (res.metadata?.verificationStatus as string),
    selectionExplanation: res.selectionExplanation || (res.metadata?.selectionExplanation as string) || res.score?.explanation,
    coverageAssessment: res.coverageAssessment || (res.metadata?.coverageAssessment as string),
    isCompleteCourse: res.isCompleteCourse || Boolean(res.metadata?.isFullCourse || res.metadata?.isComprehensive),
  };
}

export interface SearchOptions {
  limit?: number;
  providers?: string[];
  resourceTypes?: string[];
  difficulty?: ResourceDifficulty;
  examContext?: string;
  minQualityScore?: number;
  enableAiEvaluation?: boolean;
  saveToDatabase?: boolean;
  timeoutMs?: number;
  sequenceType?: string;
  contentType?: string;
}

export interface DiscoveryResult {
  rankedResources: Array<{ resource: EngineResource; finalScore: number; rank: number; reason?: string }>;
  totalFound: number;
  executionMetrics: {
    durationMs: number;
    providerLatencies: Record<string, number>;
    countsByProvider?: Record<string, number>;
  };
  sequencedPlaylist?: any;
  filterStats?: any;
  deduplicationStats?: any;
  queryInterpretation?: any;
}

export interface LegacyRankingWeights {
  relevance: number;
  educationalValue: number;
  structureCompleteness: number;
  freshness: number;
  sourceAuthority: number;
}

export interface RankedItem {
  resource: EngineResource;
  finalScore: number;
  rank: number;
  reason: string;
}

export interface DiversitySlotTarget {
  type: EngineResourceType;
  min: number;
  max: number;
}

export interface DiversityConfig {
  slots: DiversitySlotTarget[];
  maxPerDomainOrChannel: number;
}


