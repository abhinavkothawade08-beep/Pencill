/**
 * Typed Single Source of Truth Builder Configuration Model
 * Conforms strictly to Universal Learning Path Builder 2.0 Specifications.
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
export type TeachingStyleType = 'theory_first' | 'practice_first' | 'balanced' | 'custom_mix';
export type DifficultyPreferenceType = 'easy' | 'moderate' | 'challenging' | 'progressive';

export interface LearningObjectiveItem {
  id: string;
  text: string;
  successCriteria?: string;
}

export interface CustomTeachingMix {
  theory: number;
  workedExamples: number;
  practicalExercises: number;
  projects: number;
}

export interface VideoPreferences {
  minDurationMinutes?: number;
  maxDurationMinutes?: number;
  preferredEducatorIds: string[];
  preferredInstitutions: string[];
  requireCaptions: boolean;
}

export interface ReadingPreferences {
  readingDepth: 'concise' | 'standard' | 'detailed' | 'rigorous';
}

export interface PracticePreferences {
  questionTypes: string[];
}

export interface AssessmentPreferences {
  includeDiagnostic: boolean;
  moduleQuizzes: boolean;
  finalAssessment: boolean;
  questionsPerQuiz: number;
  adaptiveDifficulty: boolean;
  includeExplanations: boolean;
}

export interface RevisionPreferences {
  flashcards: boolean;
  spacedRepetition: boolean;
  formulaSheets: boolean;
}

export interface ProjectPreferences {
  projectType: 'none' | 'mini_projects' | 'capstone' | 'guided';
}

export interface RepositoryPreferences {
  preferredRepositories: string[];
  excludedRepositories: string[];
  officialOnly: boolean;
  openAccessOnly: boolean;
  sourceStrategy: 'balanced' | 'official_first' | 'educator_first' | 'open_first';
}

export interface GranularLanguageSettings {
  explanationLanguage: string;
  videoLanguage: string;
  readingLanguage: string;
  quizLanguage: string;
}

export interface ScheduleSettings {
  studyDaysPerWeek: number;
  sessionMinutes: number;
  startDate?: string;
  targetCompletionDate?: string;
  pace: 'casual' | 'steady' | 'balanced' | 'intensive' | 'custom';
  bufferDays: number;
}

export interface CurriculumBlueprintOverride {
  moduleIndex: number;
  title: string;
  customObjectives?: string[];
  isRemoved?: boolean;
}

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
  title: string;
  domainId: string;
  subjectId: string;
  subjectCustomName?: string;
  selectedTopics: SelectedTopicItem[];
  subtopics: string[];
  learningObjectives: LearningObjectiveItem[];
  prerequisites: string[];
  knownConcepts: string[];
  difficultConcepts: string[];
  excludedTopics: string[];
  examAlign: ExamAlignmentConfig;
  depthLevelId: string;
  difficulty: LearnerDifficultyTier;
  difficultyPreference: DifficultyPreferenceType;
  teachingStyle: TeachingStyleType;
  customTeachingMix: CustomTeachingMix;
  language: string;
  languageSettings: GranularLanguageSettings;
  preserveTechnicalTerms: boolean;
  modalities: BuilderModalitiesConfig;
  videoPreferences: VideoPreferences;
  readingPreferences: ReadingPreferences;
  practicePreferences: PracticePreferences;
  assessmentPreferences: AssessmentPreferences;
  revisionPreferences: RevisionPreferences;
  projectPreferences: ProjectPreferences;
  repositoryPreferences: RepositoryPreferences;
  educatorPreferences: {
    preferredEducatorIds: string[];
    excludedEducatorIds: string[];
  };
  weeklyHours: number;
  deadline: string | null;
  scheduleSettings: ScheduleSettings;
  curriculumBlueprintOverrides: CurriculumBlueprintOverride[];
  advanced: AdvancedLearningConfig;
}

export const DEFAULT_BUILDER_CONFIG_STATE: BuilderConfig = {
  title: 'Class 11 Mechanics & Rotational Dynamics',
  domainId: 'school-education',
  subjectId: 'school-physics',
  subjectCustomName: '',
  selectedTopics: [
    {
      id: 'sp-mechanics',
      label: 'Class 11 Mechanics & Rotational Dynamics',
      source: 'popular',
      complexity: 3,
      prereqs: ['Vectors & Kinematics', "Newton's Laws of Motion"],
    },
  ],
  subtopics: [
    'Units, Dimensions & Measurement Errors',
    '1D & 2D Kinematics and Projectile Motion',
    "Newton's Laws of Motion, Friction & Circular Dynamics",
    'Work, Energy, Power & Conservation Laws',
    'System of Particles & Rotational Dynamics',
  ],
  learningObjectives: [
    { id: 'lo-1', text: 'Derive and explain rotational dynamics, torque, and moment of inertia of regular bodies.' },
    { id: 'lo-2', text: 'Solve multi-body equilibrium, inclined plane, and friction problems with free-body diagrams.' },
    { id: 'lo-3', text: 'Apply conservation of energy and angular momentum to rolling motion without slipping.' },
  ],
  prerequisites: [
    'Vectors and unit-vector notation',
    'Basic differential and integral calculus',
  ],
  knownConcepts: [
    'Scalar vs Vector arithmetic',
    'Elementary kinematics in 1 dimension',
  ],
  difficultConcepts: [
    'Pure rolling on an inclined plane',
    'Parallel and perpendicular axes theorems',
  ],
  excludedTopics: [],
  examAlign: {
    enabled: false,
    examId: undefined,
    examName: undefined,
  },
  depthLevelId: 'class-11',
  difficulty: 'intermediate',
  difficultyPreference: 'moderate',
  teachingStyle: 'balanced',
  customTeachingMix: {
    theory: 40,
    workedExamples: 25,
    practicalExercises: 25,
    projects: 10,
  },
  language: 'en',
  languageSettings: {
    explanationLanguage: 'English',
    videoLanguage: 'English',
    readingLanguage: 'English',
    quizLanguage: 'English',
  },
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
  videoPreferences: {
    minDurationMinutes: 10,
    maxDurationMinutes: 60,
    preferredEducatorIds: [],
    preferredInstitutions: ['NPTEL', 'MIT OCW', 'Khan Academy'],
    requireCaptions: false,
  },
  readingPreferences: {
    readingDepth: 'detailed',
  },
  practicePreferences: {
    questionTypes: ['multiple_choice', 'numerical', 'short_answer'],
  },
  assessmentPreferences: {
    includeDiagnostic: true,
    moduleQuizzes: true,
    finalAssessment: true,
    questionsPerQuiz: 5,
    adaptiveDifficulty: true,
    includeExplanations: true,
  },
  revisionPreferences: {
    flashcards: true,
    spacedRepetition: true,
    formulaSheets: true,
  },
  projectPreferences: {
    projectType: 'capstone',
  },
  repositoryPreferences: {
    preferredRepositories: ['NCERT', 'NPTEL', 'Khan Academy', 'MIT OCW'],
    excludedRepositories: [],
    officialOnly: false,
    openAccessOnly: true,
    sourceStrategy: 'balanced',
  },
  educatorPreferences: {
    preferredEducatorIds: [],
    excludedEducatorIds: [],
  },
  weeklyHours: 6,
  deadline: null,
  scheduleSettings: {
    studyDaysPerWeek: 5,
    sessionMinutes: 45,
    pace: 'balanced',
    bufferDays: 3,
  },
  curriculumBlueprintOverrides: [],
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
    subject: cfg.subjectCustomName || subjectLabel,
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
    instructionLanguage: cfg.languageSettings?.explanationLanguage || (cfg.language === 'en' ? 'English' : cfg.language === 'hi' ? 'Hindi' : cfg.language),
    explanationLanguage: cfg.languageSettings?.explanationLanguage || (cfg.language === 'en' ? 'English' : cfg.language === 'hi' ? 'Hindi' : cfg.language),
    resourceLanguage: cfg.languageSettings?.videoLanguage || 'English',
    quizLanguage: cfg.languageSettings?.quizLanguage || 'English',
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
      preferredSources: cfg.repositoryPreferences?.preferredRepositories?.length
        ? cfg.repositoryPreferences.preferredRepositories
        : cfg.advanced.repositories,
      maxVideosPerModule: cfg.advanced.density.maxVideos,
      maxReadingPerModule: cfg.advanced.density.maxReadings,
      desiredPracticeQuestions: cfg.advanced.density.practiceQs,
      quizFrequency: cfg.advanced.density.quizCadence.replace('-', '_') as any,
      flashcardFrequency: cfg.advanced.density.formulaDeck as any,
      revisionFrequency: cfg.advanced.density.revisionCadence.replace('-', '_') as any,
      mockExamFrequency: cfg.advanced.density.mockExams.replace(/-/g, '_') as any,
      practicalProjects: cfg.advanced.density.projects === 'capstone' ? 'capstone_only' : cfg.advanced.density.projects === 'none' ? 'none' : 'hands_on_per_module',
      accessibility: {
        closedCaptions: cfg.videoPreferences?.requireCaptions || cfg.advanced.accessibility.captions,
        highContrastNotes: cfg.advanced.accessibility.highContrast,
        transcriptsRequired: cfg.advanced.accessibility.transcripts,
      },
      dailyAvailability: cfg.advanced.cadence.rhythm,
      preferredSessionLengthMinutes: cfg.scheduleSettings?.sessionMinutes || cfg.advanced.cadence.sessionMinutes,
      resourceFreshness: cfg.advanced.cadence.vintage.replace(/-/g, '_') as any,
      citationRequirement: cfg.advanced.cadence.citationStd.replace(/-/g, '_') as any,
      customInstructions: cfg.advanced.curatorNotes,
    },
  };
}
