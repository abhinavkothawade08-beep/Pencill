import { z } from 'zod';

export type EducationalDomain =
  | 'computer_science'
  | 'mathematics'
  | 'natural_sciences'
  | 'ai_and_data'
  | 'engineering'
  | 'business_and_economics'
  | 'humanities_and_social_sciences'
  | 'medicine_and_health'
  | 'general';

export type AcademicLevel = 'beginner' | 'intermediate' | 'advanced' | 'undergraduate' | 'competitive_exam';
export type LearningStyle = 'balanced' | 'theory_focused' | 'practical_projects' | 'exam_preparation';

export const LearnerGoalInputSchema = z.object({
  topic: z.string().min(2, 'Topic must be at least 2 characters'),
  domain: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'undergraduate', 'competitive_exam']).optional().default('intermediate'),
  learningGoal: z.enum(['understand_concepts', 'prepare_exam', 'build_projects', 'master_subject']).optional().default('understand_concepts'),
  learningStyle: z.enum(['balanced', 'theory_focused', 'practical_projects', 'exam_preparation']).optional().default('balanced'),
  weeklyStudyHours: z.number().min(1).max(60).optional().default(10),
  targetWeeks: z.number().min(1).max(52).optional().default(4),
  language: z.string().optional().default('English'),
  targetExam: z.string().nullable().optional(),
  priorKnowledge: z.string().optional(),
  depth: z.enum(['introductory', 'comprehensive', 'rigorous']).optional().default('comprehensive'),
});

export type LearnerGoalInput = z.infer<typeof LearnerGoalInputSchema>;

export interface AnalyzedObjective {
  primaryTopic: string;
  detectedDomain: EducationalDomain;
  normalizedLevel: AcademicLevel;
  learningStyle: LearningStyle;
  targetExam?: string;
  coreConcepts: string[];
  prerequisites: string[];
  pedagogicalStrategy: {
    videoEmphasis: 'foundational' | 'comprehensive_tutorials' | 'worked_derivations' | 'practical_coding';
    readingEmphasis: 'official_docs' | 'academic_textbooks' | 'research_papers' | 'general_handouts';
    practiceEmphasis: 'code_challenges' | 'numerical_problems' | 'conceptual_quizzes' | 'exam_style_questions';
  };
}

export interface ModuleObjective {
  id: string;
  statement: string;
  bloomTaxonomyLevel?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate';
  keyTerms: string[];
}

export interface ModulePlan {
  id: string;
  moduleNumber: number;
  title: string;
  description: string;
  learningObjectives: ModuleObjective[];
  prerequisites: string[];
  estimatedHours: number;
  expectedOutcomes: string[];
  searchQueries: {
    videoQueries: string[];
    readingQueries: string[];
  };
}

export interface CurriculumPlan {
  courseTitle: string;
  description: string;
  domain: EducationalDomain;
  level: AcademicLevel;
  totalEstimatedHours: number;
  modules: ModulePlan[];
  pedagogicalRationale: string;
}

export interface MasterEducatorMatch {
  educatorId: string;
  name: string;
  channelName: string;
  channelId?: string;
  channelUrl: string;
  officialWebsite?: string;
  subjects: string[];
  verificationStatus: 'VERIFIED' | 'CHANNEL_VERIFIED_CONTENT_NOT_REVIEWED' | 'UNVERIFIED';
  matchScore: number;
  matchedConcepts: string[];
  teachingStyle?: string;
  bestUse?: string;
}

export type ResourceModality = 'video' | 'monograph' | 'documentation' | 'practice' | 'paper' | 'formulae' | 'quiz';

export interface RawCandidateResource {
  providerId: 'youtube' | 'reading_catalog' | 'arxiv' | 'openstax' | 'official_docs' | 'curated_directory';
  externalId: string;
  title: string;
  url: string;
  description?: string;
  modality: ResourceModality;
  authorOrChannel?: string;
  channelId?: string;
  durationSeconds?: number;
  publishedDate?: string;
  isEmbeddable?: boolean;
  thumbnailUrl?: string;
  licenseOrAttribution?: string;
  sourceRepository?: string;
  rawMetadata?: Record<string, unknown>;
}

export interface NormalizedResource {
  id: string;
  providerId: RawCandidateResource['providerId'];
  externalId: string;
  title: string;
  canonicalUrl: string;
  embedUrl?: string;
  description: string;
  modality: ResourceModality;
  authorOrChannel: string;
  channelId?: string;
  durationMinutes: number;
  durationSeconds: number;
  isEmbeddable: boolean;
  thumbnailUrl?: string;
  publishedDate?: string;
  educatorId?: string;
  isVerifiedEducator: boolean;
  discoverySource: 'master_educator_directory' | 'verified_channel' | 'open_discovery' | 'official_docs' | 'scholarly_repo';
}

export interface ScoredResource extends NormalizedResource {
  relevanceScore: number; // 0 - 100
  qualityScore: number; // 0 - 100
  combinedScore: number; // 0 - 100
  matchedObjectives: string[];
  scoringFactors: {
    titleConceptMatch: number;
    descriptionMatch: number;
    domainAlignment: number;
    educatorBonus: number;
    durationPenalty: number;
    collisionPenalty: number;
  };
  passedRelevanceGate: boolean;
  rejectionReason?: string;
}

export interface GeneratedStudyNote {
  id: string;
  title: string;
  type: 'study_notes' | 'official_documentation' | 'reference_guide' | 'textbook' | 'research_paper';
  canonicalUrl?: string;
  authorOrInstitution?: string;
  estimatedReadingMinutes: number;
  overview: string;
  keyConcepts: Array<{
    term: string;
    explanation: string;
    codeExample?: string;
    formulaLatex?: string;
  }>;
  commonMisconceptions: string[];
  keyTakeaways: string[];
  verificationStatus: 'verified' | 'curated' | 'generated_grounded';
}

export interface QuizQuestionOption {
  id: string;
  text: string;
}

export interface GeneratedQuizQuestion {
  id: string;
  questionNumber: number;
  prompt: string;
  questionType: 'multiple_choice' | 'conceptual' | 'code_interpretation' | 'problem_solving';
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  learningObjectiveReference: string;
}

export interface GeneratedQuiz {
  id: string;
  title: string;
  moduleId: string;
  moduleTitle: string;
  timeLimitMinutes: number;
  questions: GeneratedQuizQuestion[];
}

export interface ModuleResourceAssignment {
  moduleId: string;
  moduleTitle: string;
  videos: ScoredResource[];
  readings: ScoredResource[];
  studyNotes: GeneratedStudyNote[];
  quiz?: GeneratedQuiz;
  coverageScore: number;
  unmetObjectives: string[];
}

export interface CurriculumCoverageAudit {
  overallCoveragePercent: number;
  isComplete: boolean;
  totalModules: number;
  totalVideos: number;
  totalReadings: number;
  totalNotes: number;
  totalQuizzes: number;
  moduleAudits: Array<{
    moduleId: string;
    title: string;
    objectiveCoveragePercent: number;
    hasVideo: boolean;
    hasReading: boolean;
    hasStudyNotes: boolean;
    hasQuiz: boolean;
    coverageGaps: string[];
  }>;
  diagnosticMessages: string[];
}

export interface EngineTelemetryStage {
  stage: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
  summary?: string;
  error?: string;
}

export interface ResourceEngineTelemetry {
  generationId: string;
  startedAt: number;
  totalDurationMs?: number;
  currentStage: number;
  stages: EngineTelemetryStage[];
  apiMetrics: {
    youtubeCalls: number;
    youtubeQuotaExhausted: boolean;
    geminiCalls: number;
    geminiTokensUsed?: number;
    cacheHits: number;
  };
  counts: {
    candidatesDiscovered: number;
    candidatesRejected: number;
    verifiedEducatorMatches: number;
    resourcesAssigned: number;
  };
  errors: Array<{
    stage: string;
    message: string;
    isRecoverable: boolean;
  }>;
}

export interface EngineExecutionResult {
  success: boolean;
  courseId: string;
  title: string;
  curriculum: CurriculumPlan;
  assignments: ModuleResourceAssignment[];
  coverage: CurriculumCoverageAudit;
  telemetry: ResourceEngineTelemetry;
  diagnostics: string[];
  course?: import('@/types').LearningPath;
}

export interface ResourceProvider {
  readonly id: string;
  readonly name: string;
  search(query: string, options?: { maxResults?: number; targetConcept?: string; domain?: EducationalDomain }): Promise<RawCandidateResource[]>;
  isAvailable(): Promise<boolean>;
}
