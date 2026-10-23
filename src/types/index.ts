export type ResourceType = 'video' | 'monograph' | 'practice' | 'quiz' | 'paper' | 'formulae';

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  durationMinutes: number;
  sourceName: string;
  sourceUrl?: string;
  isCompleted?: boolean;
  isLocked?: boolean;
  isActive?: boolean;
  description?: string;
  educatorId?: string;
  educatorName?: string;
  channelId?: string;
  discoverySource?: 'curated_directory' | 'verified_channel' | 'open_discovery' | 'fallback_search';
  verificationStatus?: string;
  selectionExplanation?: string;
  coverageAssessment?: string;
}

export interface VideoChapter {
  timestamp: string; // e.g. "08:30"
  seconds: number;
  title: string;
}

export interface LessonNoteResource {
  id: string;
  title: string;
  type:
    | 'study_notes'
    | 'pdf_notes'
    | 'pdf_lecture_notes'
    | 'lecture_handout'
    | 'official_documentation'
    | 'educational_article'
    | 'article'
    | 'reference_guide'
    | 'textbook'
    | 'research_paper'
    | 'practice_exercise'
    | 'practice_questions';
  url?: string;
  sourceUrl?: string;
  sourceName?: string;
  description?: string;
  publisher?: string;
  qualityScore?: number;
  isDirectPdf?: boolean;
  downloadUrl?: string;
  author?: string;
  lessonId?: string;
  relevanceExplanation?: string;
}

export interface Lesson extends Resource {
  moduleId: string;
  orderIndex: number;
  conceptId?: string;
  chapters?: VideoChapter[];
  prerequisitesNote?: string;
  formulae?: { name: string; latex: string; notes?: string }[];
  summaryPoints?: string[];
  sequenceNumber?: number;
  roleInSequence?: string;
  selectionReason?: string;
  positionReason?: string;
  qualityScore?: number;
  qualityEvidence?: {
    hasCaptions?: boolean;
    hasHd?: boolean;
    hasChapters?: boolean;
    confidence?: 'high' | 'medium' | 'low';
    uncertaintyReasons?: string[];
  };
  thumbnailUrl?: string;
  studyNotes?: LessonNoteResource[];
  keyConcepts?: string[];
}

export interface Module {
  id: string;
  pathId: string;
  title: string;
  moduleNumber: number; // e.g. 1
  orderIndex: number;
  status: 'completed' | 'in_progress' | 'locked';
  totalResources: number;
  completedResources: number;
  lessons: Lesson[];
  objective?: string;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  domain: string;
  level: 'Foundation' | 'Class 11' | 'Class 12' | 'Competitive' | 'Undergraduate' | 'Beginner' | 'Intermediate' | 'Advanced';
  durationHours: number;
  moduleCount: number;
  verified: boolean;
  enrolledCount?: number;
  averageCompletion?: string;
  progressPercent?: number;
  currentLessonId?: string;
  modules?: Module[];
  syllabusNote?: string;
  tags?: string[];
  weeklyCheckpoint?: {
    title: string;
    description: string;
    progressPercent: number;
  };
  authorUserId?: string | null;
  isPublished?: boolean;
  deletedAt?: string | null;
}

export interface QuizOption {
  id: 'A' | 'B' | 'C' | 'D' | string;
  text: string;
  latex?: string;
}

export interface QuizQuestion {
  id: string;
  questionNumber: number;
  prompt: string;
  stemNote?: string;
  options: QuizOption[];
  correctOptionId?: 'A' | 'B' | 'C' | 'D' | string;
  explanation?: string;
  formulaReference?: string;
  hint?: string;
  difficulty?: string;
  topic?: string;
  subtopic?: string;
  questionType?: 'single_choice' | 'multiple_choice' | 'true_false';
}

export interface Quiz {
  id: string;
  title: string;
  topic?: string;
  subject?: string;
  gradeLevel?: string;
  curriculum?: string;
  examTarget?: string;
  knowledgeLevel?: string;
  difficulty?: string;
  courseId: string;
  courseTitle: string;
  moduleId?: string;
  totalQuestions: number;
  questions: QuizQuestion[];
  timeLimitMinutes: number;
  createdAt?: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface QuizCreationFormInput {
  topic: string;
  subject?: string;
  gradeLevel?: string;
  curriculum?: string;
  examTarget?: string;
  knowledgeLevel: 'beginner' | 'intermediate' | 'advanced';
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionCount: number;
  questionFormat: 'single_choice' | 'multiple_choice' | 'true_false' | 'mixed';
  timeLimitMinutes: number;
  includeExplanations: boolean;
  learningObjectives?: string;
}

export interface QuizAttempt {
  id: string;
  userId: string | null;
  quizId: string;
  status: 'in_progress' | 'submitted' | 'expired' | 'abandoned';
  startedAt: string;
  deadline: string;
  submissionTimestamp?: string;
  score: number;
  accuracyPercent: number;
  timeSpentSeconds: number;
  answers: Record<string, string>;
  flaggedQuestions: number[];
  scoringMetadata?: QuizSubmissionResult;
}

export interface QuizResultReviewItem {
  questionId: string;
  questionNumber: number;
  prompt: string;
  options: QuizOption[];
  selectedOptionId: string | null;
  correctOptionId: string;
  isCorrect: boolean;
  explanation?: string;
  formulaReference?: string;
  topic?: string;
  subtopic?: string;
  hint?: string;
}

export interface QuizTopicBreakdown {
  topic: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface QuizSubmissionResult {
  attemptId: string;
  quizId: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  earnedScore: number;
  totalPossibleScore: number;
  accuracyPercent: number;
  timeSpentSeconds: number;
  allocatedMinutes: number;
  status: 'submitted' | 'expired';
  questionReview: QuizResultReviewItem[];
  topicBreakdown: QuizTopicBreakdown[];
  weakAreas: string[];
  strongAreas: string[];
  recommendations: string[];
}

export interface ProgressMetrics {
  overallPercent: number;
  totalHoursInvested: number;
  hoursChangeVsLastWeek: number;
  clearedModules: number;
  totalModules: number;
  quizAccuracy: number;
  quizAccuracyTier: string;
  quizzesTaken: number;
  streakDays: number;
  longestStreakDays: number;
  weeklyMomentum: {
    day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
    hours: number;
    goalHours: number;
  }[];
  topicMastery: {
    name: string;
    percentage: number;
    level: string;
  }[];
  recentActivity: {
    id: string;
    title: string;
    type: ResourceType;
    courseTitle: string;
    timestamp: string;
    timeSpent: string;
  }[];
}

export interface Bookmark {
  id: string;
  resourceId?: string;
  pathId?: string;
  title: string;
  type: ResourceType | 'path';
  source: string;
  description: string;
  savedAt: string;
  category: 'video' | 'monograph' | 'practice' | 'formulae' | 'path';
  notes?: string;
}

export interface UserProfile {
  name: string;
  grade: string;
  avatarUrl: string;
  targetExam: string;
  tier: string;
  streakDays: number;
}
