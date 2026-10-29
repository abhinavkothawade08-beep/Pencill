/**
 * Curator Engine Types & State Machine Contracts
 */

import { BuilderConfig } from '@/lib/types/builderConfig';

export type CuratorEngineState = 'STANDBY' | 'RUNNING' | 'COMPLETE' | 'PARTIAL' | 'FAILED';

export type StageExecutionStatus = 'pending' | 'running' | 'done' | 'warning' | 'error';

export interface StageProgressUpdate {
  stageNumber: number;
  stageName: string;
  status: StageExecutionStatus;
  durationMs: number;
  resultSummary: string;
  telemetryUpdates?: Partial<CuratorTelemetry>;
  error?: string;
  warning?: string;
}

export interface CuratorAuditSummary {
  totalEvaluated?: number;
  passedCount?: number;
  droppedLowQuality?: number;
  accessibilityViolations?: number;
  averageScore?: number;
}

export interface CuratorTelemetry {
  resourcesIndexed: number;
  modulesSynthesized: number;
  verifiedCount: number;
  provisionalCount: number;
  unverifiedCount: number;
  repoBreakdown: Record<string, number>;
  activeStep: number;
  totalSteps: number;
  elapsedMs: number;
}

export interface CuratorResource {
  id: string;
  title: string;
  url: string;
  source: string; // e.g. NCERT, NPTEL, MIT OCW, Khan Academy, YouTube
  modality: 'video' | 'reading' | 'practice' | 'quiz' | 'flashcard' | 'coding' | 'project' | 'pyq';
  status: 'verified' | 'provisional' | 'unverified';
  language: string;
  hasCaptions: boolean;
  hasTranscript: boolean;
  publishedYear?: number;
  qualityScore: number; // 0 to 100
  auditNotes: string;
  verifiedAt?: string;
}

export interface CuratorCheckpointQuizQuestion {
  id: string;
  questionNumber: number;
  prompt: string;
  questionText?: string;
  options: Array<{ id: string; text: string }> | string[];
  optionsList?: string[];
  correctOptionId: string;
  correctOptionIndex?: number;
  explanation: string;
  difficulty: 'foundation' | 'intermediate' | 'advanced';
  topic: string;
  isPYQ?: boolean;
  pyqSource?: string;
}

export interface CuratorFlashcard {
  id: string;
  termOrConcept: string;
  formulaOrDefinition: string;
  explanation: string;
  memoryHook?: string;
}

export interface CuratorModule {
  id: string;
  moduleIndex: number;
  title: string;
  description: string;
  objectives: string[];
  estimatedMinutes: number;
  resources: CuratorResource[];
  checkpointQuestions: CuratorCheckpointQuizQuestion[];
  flashcards: CuratorFlashcard[];
}

export interface SynthesizedPathResult {
  id: string;
  title: string;
  configSnapshot: BuilderConfig;
  domainId: string;
  subjectId: string;
  modules: CuratorModule[];
  totalResources: number;
  totalHours: number;
  auditReport: {
    totalEvaluated: number;
    passedAudit: number;
    droppedLowQuality: number;
    accessibilityViolations: number;
    averageQualityScore: number;
    completenessRatio: number;
  };
  coverageGaps: string[];
  createdAt: string;
}
