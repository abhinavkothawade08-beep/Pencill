/**
 * Curator Engine Orchestrator
 * 
 * Manages the 5-stage curriculum synthesis pipeline:
 * STANDBY -> RUNNING -> COMPLETE | PARTIAL | FAILED
 * Provides cancel token, per-stage retry, and live telemetry updates.
 */

import { BuilderConfig } from '@/lib/types/builderConfig';
import {
  CuratorEngineState,
  CuratorTelemetry,
  StageProgressUpdate,
  SynthesizedPathResult,
} from './types';
import { runStage1Deconstruction, DeconstructionResult } from './stage1-domain-deconstruction';
import { runStage2PrerequisiteMapping, PrerequisiteMappingResult } from './stage2-prerequisite-mapping';
import { runStage3Synthesis, CurriculumSynthesisResult } from './stage3-curriculum-synthesis';
import { runStage6Checkpoints, CheckpointsResult } from './stage6-checkpoints-flashcards';
import { runStage7AssemblyAndPersistence } from './stage7-assembly-persistence';

export interface CuratorEngineListener {
  onStateChange?: (state: CuratorEngineState) => void;
  onStageUpdate?: (update: StageProgressUpdate) => void;
  onTelemetryUpdate?: (telemetry: CuratorTelemetry) => void;
}

export class CuratorEngine {
  private state: CuratorEngineState = 'STANDBY';
  private abortRequested = false;
  private telemetry: CuratorTelemetry = {
    resourcesIndexed: 0,
    modulesSynthesized: 0,
    verifiedCount: 0,
    provisionalCount: 0,
    unverifiedCount: 0,
    repoBreakdown: {},
    activeStep: 0,
    totalSteps: 5,
    elapsedMs: 0,
  };

  // Intermediate stage caches for per-stage retry
  private cachedDeconstruction?: DeconstructionResult;
  private cachedMapping?: PrerequisiteMappingResult;
  private cachedSynthesis?: CurriculumSynthesisResult;
  private cachedCheckpoints?: CheckpointsResult;

  constructor(private listeners: CuratorEngineListener = {}) {}

  getState(): CuratorEngineState {
    return this.state;
  }

  getTelemetry(): CuratorTelemetry {
    return { ...this.telemetry };
  }

  cancel(): void {
    if (this.state === 'RUNNING') {
      this.abortRequested = true;
      this.state = 'STANDBY';
      this.listeners.onStateChange?.('STANDBY');
    }
  }

  private emitStage(
    stageNumber: number,
    stageName: string,
    status: StageProgressUpdate['status'],
    durationMs: number,
    resultSummary: string,
    error?: string,
    warning?: string
  ) {
    this.telemetry.activeStep = stageNumber;
    this.listeners.onStageUpdate?.({
      stageNumber,
      stageName,
      status,
      durationMs,
      resultSummary,
      error,
      warning,
    });
    this.listeners.onTelemetryUpdate?.({ ...this.telemetry });
  }

  async run(config: BuilderConfig, userId?: string | null): Promise<SynthesizedPathResult> {
    this.state = 'RUNNING';
    this.abortRequested = false;
    this.listeners.onStateChange?.('RUNNING');
    const startTime = Date.now();

    try {
      // ----------------------------------------------------------------------
      // STAGE 1: Domain & Syllabus Deconstruction
      // ----------------------------------------------------------------------
      if (this.abortRequested) throw new Error('Synthesis cancelled by user.');
      this.emitStage(1, 'Domain & Syllabus Deconstruction', 'running', 0, 'Classifying core concepts and scope from standard curricula...');
      const s1Start = Date.now();
      this.cachedDeconstruction = await runStage1Deconstruction(config);
      const s1Duration = Date.now() - s1Start;
      this.emitStage(1, 'Domain & Syllabus Deconstruction', 'done', s1Duration, this.cachedDeconstruction.summary);

      // ----------------------------------------------------------------------
      // STAGE 2: Prerequisite Hierarchy Mapping
      // ----------------------------------------------------------------------
      if (this.abortRequested) throw new Error('Synthesis cancelled by user.');
      this.emitStage(2, 'Prerequisite Hierarchy Mapping', 'running', 0, 'Topologically sorting axioms ahead of applied synthesis...');
      const s2Start = Date.now();
      this.cachedMapping = await runStage2PrerequisiteMapping(config, this.cachedDeconstruction);
      const s2Duration = Date.now() - s2Start;
      this.emitStage(2, 'Prerequisite Hierarchy Mapping', 'done', s2Duration, this.cachedMapping.summary);

      // ----------------------------------------------------------------------
      // STAGE 3: Topic-Adaptive Curriculum Synthesis
      // ----------------------------------------------------------------------
      if (this.abortRequested) throw new Error('Synthesis cancelled by user.');
      this.emitStage(3, 'Topic-Adaptive Curriculum Synthesis', 'running', 0, 'Determining cohesive modular structure and learning objectives...');
      const s3Start = Date.now();
      this.cachedSynthesis = await runStage3Synthesis(config, this.cachedMapping);
      const s3Duration = Date.now() - s3Start;
      this.telemetry.modulesSynthesized = this.cachedSynthesis.modules.length;
      this.emitStage(3, 'Topic-Adaptive Curriculum Synthesis', 'done', s3Duration, this.cachedSynthesis.summary);

      // ----------------------------------------------------------------------
      // STAGE 4: Diagnostic Checkpoints & Flashcards
      // ----------------------------------------------------------------------
      if (this.abortRequested) throw new Error('Synthesis cancelled by user.');
      this.emitStage(4, 'Diagnostic Checkpoints & Flashcards', 'running', 0, 'Compiling objective-grounded checkpoints and formula cards...');
      const s4Start = Date.now();
      this.cachedCheckpoints = await runStage6Checkpoints(config, this.cachedSynthesis.modules);
      const s4Duration = Date.now() - s4Start;
      this.emitStage(4, 'Diagnostic Checkpoints & Flashcards', 'done', s4Duration, this.cachedCheckpoints.summary);

      // ----------------------------------------------------------------------
      // STAGE 5: Assembly & Registry Persistence
      // ----------------------------------------------------------------------
      if (this.abortRequested) throw new Error('Synthesis cancelled by user.');
      this.emitStage(5, 'Assembly & Registry Persistence', 'running', 0, 'Persisting learning path and registering learner in local store...');
      const s5Start = Date.now();
      const finalPath = await runStage7AssemblyAndPersistence(
        config,
        this.cachedCheckpoints.completedModules,
        undefined,
        userId
      );
      const s5Duration = Date.now() - s5Start;
      this.emitStage(5, 'Assembly & Registry Persistence', 'done', s5Duration, `Successfully registered "${finalPath.title}" to local course store.`);

      this.telemetry.elapsedMs = Date.now() - startTime;

      // Determine final state: PARTIAL if coverage gaps exist, otherwise COMPLETE
      if (finalPath.coverageGaps.length > 0) {
        this.state = 'PARTIAL';
      } else {
        this.state = 'COMPLETE';
      }
      this.listeners.onStateChange?.(this.state);

      return finalPath;
    } catch (err: any) {
      if (this.abortRequested) {
        this.state = 'STANDBY';
        this.listeners.onStateChange?.('STANDBY');
        throw new Error('Synthesis cancelled by user.');
      }
      this.state = 'FAILED';
      this.listeners.onStateChange?.('FAILED');
      this.emitStage(
        this.telemetry.activeStep || 1,
        'Stage Execution Error',
        'error',
        0,
        err.message || 'Stage execution failed',
        err.message
      );
      throw err;
    }
  }
}
