/**
 * Pencill AI Service Domain Types & Abstraction
 * Defines provider-agnostic interfaces for learning-path synthesis, module design,
 * lesson analysis, quiz generation, resource evaluation, and recommendations.
 */

export interface GeneratePathInput {
  topic: string;
  depth?: 'foundation' | 'intermediate' | 'rigorous' | 'exam-prep';
  level?: string;
  weeklyHours?: number;
  language?: string;
  modalities?: string[];
  targetExam?: string;
  expectedDurationHours?: number;
  learningObjectives?: string[];
  difficulty?: string;
  domain?: string;
  preserveTechnicalTerms?: boolean;
  advancedPreferences?: Record<string, unknown>;
}

export interface GeneratedLessonSummaryOutline {
  title: string;
  type: 'video' | 'monograph' | 'practice' | 'quiz' | string;
  estimatedMinutes: number;
  keyConcepts: string[];
  id?: string;
  sourceUrl?: string;
  sourceName?: string;
  thumbnailUrl?: string;
  selectionReason?: string;
  positionReason?: string;
  authorOrChannel?: string;
  educatorId?: string;
  educatorName?: string;
  discoverySource?: string;
  verificationStatus?: string;
  chapters?: import('@/types').VideoChapter[];
  qualityScore?: number;
  resourceCategory?: string;
  practicalEvidence?: Record<string, unknown>;
  summaryPoints?: string[];
  studyNotes?: import('@/types').LessonNoteResource[];
  formulae?: Array<{ name: string; latex: string; notes?: string }>;
}

export interface GeneratedModuleOutline {
  title: string;
  moduleNumber: number;
  estimatedHours?: number;
  objective: string;
  description?: string;
  keySubtopics?: string[];
  prerequisites?: string[];
  practicalActivity?: string;
  lessons: GeneratedLessonSummaryOutline[];
}

export interface GeneratedLearningPath {
  id?: string;
  title: string;
  description?: string;
  domain: string;
  level: string;
  durationHours?: number;
  moduleCount?: number;
  tags?: string[];
  syllabusNote?: string;
  weeklyCheckpoint?: {
    title: string;
    description: string;
    targetMilestone: string;
  };
  modules: GeneratedModuleOutline[];
}

export interface GenerateModuleInput {
  pathTitle: string;
  domain: string;
  level: string;
  moduleNumber: number;
  moduleTitle: string;
  targetObjective?: string;
}

export interface GeneratedModule {
  title: string;
  moduleNumber: number;
  description: string;
  lessons: {
    title: string;
    type: 'video' | 'monograph' | 'practice' | 'quiz';
    durationMinutes: number;
    conceptId: string;
    prerequisitesNote?: string;
    summaryPoints: string[];
  }[];
}

export interface GenerateSummaryInput {
  lessonTitle: string;
  domain: string;
  contentOrTranscript: string;
}

export interface GeneratedLessonSummary {
  lessonTitle: string;
  coreThesis: string;
  keyPoints: string[];
  formulae: {
    name: string;
    latex: string;
    notes: string;
  }[];
  prerequisitesReminder?: string;
}

export interface GenerateQuizInput {
  topic: string;
  domain?: string;
  subject?: string;
  gradeLevel?: string;
  curriculum?: string;
  examTarget?: string;
  knowledgeLevel?: 'beginner' | 'intermediate' | 'advanced';
  difficulty?: 'easy' | 'medium' | 'hard' | 'olympiad' | 'mixed' | 'beginner' | 'intermediate' | 'advanced' | 'competitive';
  questionCount?: number;
  questionFormat?: 'single_choice' | 'multiple_choice' | 'true_false' | 'mixed';
  includeExplanations?: boolean;
  learningObjectives?: string;
  priorWeakTopics?: string[];
  moduleTitle?: string;
  courseTitle?: string;
  sourceContent?: string;
  sourceType?: 'transcript' | 'reading_notes' | 'learning_objectives';
}

export interface GeneratedQuizQuestion {
  id?: string;
  questionNumber: number;
  prompt: string;
  stemNote?: string;
  options: {
    id: 'A' | 'B' | 'C' | 'D' | string;
    text: string;
    latex?: string;
  }[];
  correctOptionId: 'A' | 'B' | 'C' | 'D' | string;
  correctOptions?: string[];
  explanation: string;
  formulaReference?: string;
  hint?: string;
  difficulty?: string;
  subtopic?: string;
  estimatedSeconds?: number;
  questionType?: 'single_choice' | 'multiple_choice' | 'true_false';
}

export interface GeneratedQuiz {
  title: string;
  domain?: string;
  subject?: string;
  timeLimitMinutes: number;
  questions: GeneratedQuizQuestion[];
}

export interface RecommendationsInput {
  userCurrentLevel: string;
  completedTopics: string[];
  recentQuizAccuracyPercent?: number;
  studyGoalHours?: number;
}

export interface GeneratedRecommendations {
  focusArea: string;
  nextRecommendedTopics: {
    title: string;
    rationale: string;
    estimatedHours: number;
  }[];
  reviewReminders: string[];
  weeklyPacingAdvice: string;
}

/**
 * Universal AI Provider Interface
 * Allows swapping Gemini, Anthropic, OpenAI, or local LLMs without touching product code.
 */
export interface AIProvider {
  readonly providerName: string;
  generateLearningPath(input: GeneratePathInput): Promise<GeneratedLearningPath>;
  generateModuleAndLessons(input: GenerateModuleInput): Promise<GeneratedModule>;
  generateLessonSummary(input: GenerateSummaryInput): Promise<GeneratedLessonSummary>;
  generateQuizQuestions(input: GenerateQuizInput): Promise<GeneratedQuiz>;
  generateRecommendations(input: RecommendationsInput): Promise<GeneratedRecommendations>;
}
