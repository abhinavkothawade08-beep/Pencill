/**
 * Universal Learning Path Builder Configuration & State Model
 * 
 * Defines the complete typed configuration schema for course synthesis,
 * client draft persistence, validation, and estimation.
 */

export type TargetDepthLevel =
  | 'foundation'
  | 'school'
  | 'class-11'
  | 'class-12'
  | 'competitive'
  | 'undergraduate-intro'
  | 'undergraduate-intermediate'
  | 'undergraduate-advanced'
  | 'postgraduate'
  | 'research'
  | 'professional'
  | 'custom';

export type LearnerDifficulty =
  | 'beginner'
  | 'elementary'
  | 'intermediate'
  | 'advanced'
  | 'expert';

export type PacingStrategy = 'casual' | 'balanced' | 'intensive' | 'sprint';

export interface TargetExamConfig {
  id?: string;
  name: string;
  acronym?: string;
  category?: string;
  countryOrRegion?: string;
  examDate?: string;
  targetScore?: string;
  attemptNumber?: number;
  previousPerformance?: string;
  examSubject?: string;
}

export interface BuilderModalities {
  videos: boolean;
  reading: boolean;
  practice: boolean;
  quizzes: boolean;
  flashcards: boolean;
  codingExercises?: boolean;
  workedExamples?: boolean;
  simulations?: boolean;
  caseStudies?: boolean;
  projects?: boolean;
  pastPapers?: boolean;
}

export interface AdvancedLearningPreferences {
  currentKnowledgeLevel: 'complete_beginner' | 'some_basics' | 'intermediate' | 'advanced';
  desiredMastery: 'familiarity' | 'working_competence' | 'deep_conceptual' | 'exam_ready' | 'mastery';
  learningGoal: string;
  explanationStyle:
    | 'simple_intuitive'
    | 'step_by_step'
    | 'mathematical_rigorous'
    | 'example_driven'
    | 'visual_diagram'
    | 'socratic'
    | 'exam_oriented'
    | 'project_based'
    | 'research_oriented';
  preferredSources: string[];
  maxVideosPerModule: number;
  maxReadingPerModule: number;
  desiredPracticeQuestions: number;
  quizFrequency: 'every_module' | 'milestone_only' | 'end_of_path';
  flashcardFrequency: 'high' | 'standard' | 'minimal' | 'disabled';
  revisionFrequency?: 'every_module' | 'alternate_modules' | 'end_of_path';
  mockExamFrequency?: 'none' | 'mid_and_final' | 'weekly';
  practicalProjects?: 'none' | 'capstone_only' | 'hands_on_per_module';
  accessibility?: {
    closedCaptions?: boolean;
    highContrastNotes?: boolean;
    transcriptsRequired?: boolean;
  };
  dailyAvailability?: string;
  preferredSessionLengthMinutes?: number;
  resourceFreshness?: 'recent_years' | 'seminal_classic' | 'any_verified';
  citationRequirement?: 'institutional_peer_reviewed' | 'standard_open_educational';
  customInstructions?: string;
}

export interface LearningPathConfig {
  domainId: string;
  domainName: string;
  disciplineId?: string;
  disciplineName?: string;
  subject: string;
  topics: string[];
  targetExam?: TargetExamConfig | null;
  depthLevel: TargetDepthLevel;
  customDepthLevel?: string;
  difficulty: LearnerDifficulty;
  instructionLanguage: string;
  explanationLanguage?: string;
  resourceLanguage?: string;
  quizLanguage?: string;
  bilingualExplanations?: boolean;
  preserveTechnicalTerms: boolean;
  modalities: BuilderModalities;
  weeklyHours: number;
  pacingStrategy: PacingStrategy;
  targetCompletionDate?: string;
  advancedPreferences: AdvancedLearningPreferences;
}

export const DEFAULT_BUILDER_CONFIG: LearningPathConfig = {
  domainId: 'school-education',
  domainName: 'School Education',
  subject: 'Physics',
  topics: ['Class 11 Mechanics & Rotational Dynamics'],
  targetExam: null,
  depthLevel: 'class-11',
  difficulty: 'intermediate',
  instructionLanguage: 'English',
  explanationLanguage: 'English',
  resourceLanguage: 'English',
  preserveTechnicalTerms: true,
  modalities: {
    videos: true,
    reading: true,
    practice: true,
    quizzes: true,
    flashcards: true,
    codingExercises: false,
    workedExamples: true,
    simulations: false,
    caseStudies: false,
    projects: false,
    pastPapers: true,
  },
  weeklyHours: 6,
  pacingStrategy: 'balanced',
  advancedPreferences: {
    currentKnowledgeLevel: 'some_basics',
    desiredMastery: 'deep_conceptual',
    learningGoal: 'concept_mastery',
    explanationStyle: 'step_by_step',
    preferredSources: ['NCERT', 'NPTEL', 'Khan Academy', 'MIT OCW', 'Standard Curricula'],
    maxVideosPerModule: 2,
    maxReadingPerModule: 3,
    desiredPracticeQuestions: 8,
    quizFrequency: 'every_module',
    flashcardFrequency: 'standard',
    revisionFrequency: 'every_module',
    mockExamFrequency: 'mid_and_final',
    practicalProjects: 'capstone_only',
    accessibility: {
      closedCaptions: false,
      highContrastNotes: false,
      transcriptsRequired: false,
    },
    dailyAvailability: 'Flexible Daily',
    preferredSessionLengthMinutes: 45,
    resourceFreshness: 'any_verified',
    citationRequirement: 'standard_open_educational',
    customInstructions: '',
  },
};
