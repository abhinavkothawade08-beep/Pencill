/**
 * Typed Single Source of Truth Builder Configuration Model
 * Conforms strictly to Specification Section 1 & Screenshot Visual Source of Truth.
 */

import { LearningPathConfig } from './builder';

export type SelectedTopicSource = 'taxonomy' | 'custom' | 'recent' | 'popular';

export interface SelectedTopicItem {
  id: string;
  label: string;
  source: SelectedTopicSource;
  complexity?: number;
  prereqs?: string[];
}

export interface ExamAlignmentConfig {
  enabled: boolean;
  examId?: string;
  examName?: string;
  syllabusUnits?: string[];
}

export type LearnerDifficultyTier = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert';

export interface BuilderModalitiesConfig {
  video: boolean;
  reading: boolean;
  practice: boolean;
  diagnostic: boolean;
  flashcards: boolean;
  worked: boolean;
  pyq: boolean;
  coding: boolean;
  projects: boolean;
}

export interface AdvancedDensityConfig {
  maxVideos: number;
  maxReadings: number;
  practiceQs: number;
  quizCadence: 'every-module' | 'milestone-only' | 'end-of-path';
  formulaDeck: 'standard' | 'high' | 'minimal' | 'disabled';
  revisionCadence: 'every-module' | 'alternate-modules' | 'end-of-path';
  mockExams: 'none' | 'mid-and-final' | 'weekly';
  projects: 'none' | 'capstone' | 'per-module';
}

export interface AdvancedCadenceConfig {
  rhythm: 'flexible-daily' | 'weekday-intensive' | 'weekend-immersion' | 'self-paced';
  sessionMinutes: number;
  vintage: 'any-verified' | 'recent-5-years' | 'seminal-classic';
  citationStd: 'open-edu-repos' | 'institutional-peer-reviewed';
}

export interface AdvancedAccessibilityConfig {
  captions: boolean;
  highContrast: boolean;
  transcripts: boolean;
}

export interface AdvancedLearningConfig {
  goal:
    | 'concept-mastery'
    | 'exam-preparation'
    | 'assignment-support'
    | 'revision-recap'
    | 'skill-job-readiness'
    | 'research-foundations'
    | 'curiosity';
  currentLevel: 'complete-beginner' | 'some-basics' | 'intermediate' | 'advanced';
  targetMastery: 'familiarity' | 'working-competence' | 'deep-conceptual' | 'exam-ready' | 'true-mastery';
  explanationStyle:
    | 'step-by-step-analytical'
    | 'simple-intuitive'
    | 'mathematical-rigorous'
    | 'example-driven'
    | 'visual-diagram'
    | 'socratic'
    | 'exam-oriented'
    | 'project-based'
    | 'research-oriented';
  repositories: string[];
  density: AdvancedDensityConfig;
  cadence: AdvancedCadenceConfig;
  accessibility: AdvancedAccessibilityConfig;
  curatorNotes: string;
}

export interface BuilderConfig {
  domainId: string;
  subjectId: string;
  selectedTopics: SelectedTopicItem[];
  examAlign: ExamAlignmentConfig;
  depthLevelId: string;
  difficulty: LearnerDifficultyTier;
  language: string;
  preserveTechnicalTerms: boolean;
  modalities: BuilderModalitiesConfig;
  weeklyHours: number;
  deadline: string | null;
  advanced: AdvancedLearningConfig;
}

export const DEFAULT_BUILDER_CONFIG_STATE: BuilderConfig = {
  domainId: 'school-education',
  subjectId: 'school-physics',
  selectedTopics: [
    {
      id: 'sp-mechanics',
      label: 'Class 11 Mechanics & Rotational Dynamics',
      source: 'popular',
      complexity: 3,
      prereqs: ['Vectors & Kinematics', "Newton's Laws of Motion"],
    },
  ],
  examAlign: {
    enabled: false,
    examId: undefined,
    examName: undefined,
  },
  depthLevelId: 'class-11',
  difficulty: 'intermediate',
  language: 'en',
  preserveTechnicalTerms: true,
  modalities: {
    video: true,
    reading: true,
    practice: true,
    diagnostic: true,
    flashcards: true,
    worked: true,
    pyq: true,
    coding: false,
    projects: false,
  },
  weeklyHours: 6,
  deadline: null,
  advanced: {
    goal: 'concept-mastery',
    currentLevel: 'some-basics',
    targetMastery: 'deep-conceptual',
    explanationStyle: 'step-by-step-analytical',
    repositories: ['NCERT', 'NPTEL', 'Khan Academy', 'MIT OCW'],
    density: {
      maxVideos: 2,
      maxReadings: 3,
      practiceQs: 8,
      quizCadence: 'every-module',
      formulaDeck: 'standard',
      revisionCadence: 'every-module',
      mockExams: 'mid-and-final',
      projects: 'capstone',
    },
    cadence: {
      rhythm: 'flexible-daily',
      sessionMinutes: 45,
      vintage: 'any-verified',
      citationStd: 'open-edu-repos',
    },
    accessibility: {
      captions: false,
      highContrast: false,
      transcripts: false,
    },
    curatorNotes: '',
  },
};

/**
 * Adapter to translate BuilderConfig into legacy LearningPathConfig for backend endpoints.
 */
export function toLegacyLearningPathConfig(cfg: BuilderConfig, domainLabel = 'School Education', subjectLabel = 'Physics'): LearningPathConfig {
  return {
    domainId: cfg.domainId,
    domainName: domainLabel,
    subject: subjectLabel,
    topics: cfg.selectedTopics.map((t) => t.label),
    targetExam: cfg.examAlign.enabled && cfg.examAlign.examName
      ? {
          id: cfg.examAlign.examId,
          name: cfg.examAlign.examName,
          acronym: cfg.examAlign.examName.split(' ')[0],
        }
      : null,
    depthLevel: cfg.depthLevelId as any,
    difficulty: cfg.difficulty,
    instructionLanguage: cfg.language === 'en' ? 'English' : cfg.language === 'hi' ? 'Hindi' : cfg.language,
    preserveTechnicalTerms: cfg.preserveTechnicalTerms,
    modalities: {
      videos: cfg.modalities.video,
      reading: cfg.modalities.reading,
      practice: cfg.modalities.practice,
      quizzes: cfg.modalities.diagnostic,
      flashcards: cfg.modalities.flashcards,
      workedExamples: cfg.modalities.worked,
      pastPapers: cfg.modalities.pyq,
      codingExercises: cfg.modalities.coding,
      projects: cfg.modalities.projects,
    },
    weeklyHours: cfg.weeklyHours,
    pacingStrategy:
      cfg.weeklyHours <= 4 ? 'casual' :
      cfg.weeklyHours <= 9 ? 'balanced' :
      cfg.weeklyHours <= 18 ? 'intensive' : 'sprint',
    targetCompletionDate: cfg.deadline || undefined,
    advancedPreferences: {
      currentKnowledgeLevel: cfg.advanced.currentLevel.replace('-', '_') as any,
      desiredMastery: cfg.advanced.targetMastery.replace('-', '_') as any,
      learningGoal: cfg.advanced.goal.replace('-', '_'),
      explanationStyle: cfg.advanced.explanationStyle.replace(/-/g, '_') as any,
      preferredSources: cfg.advanced.repositories,
      maxVideosPerModule: cfg.advanced.density.maxVideos,
      maxReadingPerModule: cfg.advanced.density.maxReadings,
      desiredPracticeQuestions: cfg.advanced.density.practiceQs,
      quizFrequency: cfg.advanced.density.quizCadence.replace('-', '_') as any,
      flashcardFrequency: cfg.advanced.density.formulaDeck as any,
      revisionFrequency: cfg.advanced.density.revisionCadence.replace('-', '_') as any,
      mockExamFrequency: cfg.advanced.density.mockExams.replace(/-/g, '_') as any,
      practicalProjects: cfg.advanced.density.projects === 'capstone' ? 'capstone_only' : cfg.advanced.density.projects === 'none' ? 'none' : 'hands_on_per_module',
      accessibility: {
        closedCaptions: cfg.advanced.accessibility.captions,
        highContrastNotes: cfg.advanced.accessibility.highContrast,
        transcriptsRequired: cfg.advanced.accessibility.transcripts,
      },
      dailyAvailability: cfg.advanced.cadence.rhythm,
      preferredSessionLengthMinutes: cfg.advanced.cadence.sessionMinutes,
      resourceFreshness: cfg.advanced.cadence.vintage.replace(/-/g, '_') as any,
      citationRequirement: cfg.advanced.cadence.citationStd.replace(/-/g, '_') as any,
      customInstructions: cfg.advanced.curatorNotes,
    },
  };
}
