import {
  LearnerGoalInput,
  LearnerGoalInputSchema,
  EngineExecutionResult,
  ResourceEngineTelemetry,
  EngineTelemetryStage,
  ModuleResourceAssignment,
  ScoredResource,
  NormalizedResource,
} from './types';
import { analyzeLearningGoal } from './analyzer';
import { planCurriculum } from './planner';
import { educatorIntelligence } from './educator-intelligence';
import { YouTubeProvider } from './providers/youtube-provider';
import { ReadingMaterialProvider } from './providers/reading-provider';
import { normalizeCandidateResource } from './normalizer';
import { validateResource, deduplicateResources } from './validator';
import { scoreResource } from './scorer';
import { generateModuleStudyNotes } from './study-notes-generator';
import { generateModuleQuiz } from './quiz-generator';
import { distributeAndSequenceModuleResources } from './distributor';
import { validateCurriculumCoverage } from './coverage-validator';
import { persistEngineCourse } from './persistence';

export interface OrchestratorListeners {
  onStageChange?: (stage: EngineTelemetryStage) => void;
  onTelemetryUpdate?: (telemetry: ResourceEngineTelemetry) => void;
}

export class ResourceEngineOrchestrator {
  private abortRequested = false;
  private youtubeProvider: YouTubeProvider;
  private readingProvider: ReadingMaterialProvider;

  constructor() {
    this.youtubeProvider = new YouTubeProvider();
    this.readingProvider = new ReadingMaterialProvider();
  }

  public cancel(): void {
    this.abortRequested = true;
  }

  public async execute(
    rawInput: unknown,
    userId?: string | null,
    listeners: OrchestratorListeners = {}
  ): Promise<EngineExecutionResult> {
    this.abortRequested = false;
    const validatedInput = LearnerGoalInputSchema.parse(rawInput);
    const startTime = Date.now();
    const generationId = `gen-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;

    const stageNames = [
      'Objective Analysis & Domain Deconstruction',
      'Curriculum Planning & Module Synthesis',
      'Educator Intelligence Matching',
      'Multi-Query Video & Reading Discovery',
      'Resource Normalization & Integrity Validation',
      'Pedagogical Scoring & Collision Gating',
      'Grounded Study Notes Compilation',
      'Formative Assessment Quiz Generation',
      'Resource Distribution & Lesson Sequencing',
      'Curriculum Coverage Audit',
      'Relational Course Persistence & Enrollment',
    ];

    const telemetry: ResourceEngineTelemetry = {
      generationId,
      startedAt: startTime,
      currentStage: 1,
      stages: stageNames.map((name, idx) => ({
        stage: idx + 1,
        name,
        status: 'pending',
      })),
      apiMetrics: {
        youtubeCalls: 0,
        youtubeQuotaExhausted: false,
        geminiCalls: 0,
        cacheHits: 0,
      },
      counts: {
        candidatesDiscovered: 0,
        candidatesRejected: 0,
        verifiedEducatorMatches: 0,
        resourcesAssigned: 0,
      },
      errors: [],
    };

    const emitStage = (
      stageIdx: number,
      status: EngineTelemetryStage['status'],
      summary?: string,
      error?: string
    ) => {
      const stage = telemetry.stages[stageIdx];
      stage.status = status;
      if (status === 'running') stage.startedAt = Date.now();
      if (status === 'completed' || status === 'failed') {
        stage.completedAt = Date.now();
        stage.durationMs = stage.startedAt ? stage.completedAt - stage.startedAt : 0;
      }
      if (summary) stage.summary = summary;
      if (error) stage.error = error;
      telemetry.currentStage = stageIdx + 1;
      listeners.onStageChange?.({ ...stage });
      listeners.onTelemetryUpdate?.({ ...telemetry });
    };

    const diagnostics: string[] = [];

    try {
      // ----------------------------------------------------------------------
      // STAGE 1: Objective & Domain Analysis
      // ----------------------------------------------------------------------
      this.checkAbort();
      emitStage(0, 'running');
      const analyzed = analyzeLearningGoal(validatedInput);
      emitStage(0, 'completed', `Detected domain: ${analyzed.detectedDomain} (${analyzed.normalizedLevel} level, ${analyzed.learningStyle} style).`);

      // ----------------------------------------------------------------------
      // STAGE 2: Curriculum Planning
      // ----------------------------------------------------------------------
      this.checkAbort();
      emitStage(1, 'running');
      telemetry.apiMetrics.geminiCalls++;
      const plan = await planCurriculum(validatedInput, analyzed);
      emitStage(1, 'completed', `Synthesized ${plan.modules.length} cohesive modules covering ${plan.totalEstimatedHours}h study.`);

      // ----------------------------------------------------------------------
      // STAGE 3: Educator Intelligence Matching
      // ----------------------------------------------------------------------
      this.checkAbort();
      emitStage(2, 'running');
      const matchedEducators = educatorIntelligence.matchEducatorsForObjective(
        validatedInput.topic,
        analyzed.detectedDomain,
        5
      );
      telemetry.counts.verifiedEducatorMatches = matchedEducators.length;
      emitStage(
        2,
        'completed',
        `Matched ${matchedEducators.length} verified educators from Master Directory (${matchedEducators.map((e) => e.channelName).slice(0, 3).join(', ')}).`
      );

      // ----------------------------------------------------------------------
      // STAGES 4, 5, 6: Discovery, Normalization, Scoring across modules
      // ----------------------------------------------------------------------
      this.checkAbort();
      emitStage(3, 'running');

      const allDiscoveredVideos: ScoredResource[] = [];
      const allDiscoveredReadings: ScoredResource[] = [];

      for (const mod of plan.modules) {
        // 4A. Video Discovery
        for (const vQuery of mod.searchQueries.videoQueries) {
          telemetry.apiMetrics.youtubeCalls++;
          const rawVideos = await this.youtubeProvider.search(vQuery, {
            maxResults: 4,
            domain: analyzed.detectedDomain,
            matchedEducators,
          });

          telemetry.counts.candidatesDiscovered += rawVideos.length;

          for (const raw of rawVideos) {
            const normalized = normalizeCandidateResource(raw);
            const val = validateResource(normalized);
            if (val.valid) {
              const scored = scoreResource(normalized, mod, analyzed.detectedDomain, validatedInput.topic);
              if (scored.passedRelevanceGate) {
                allDiscoveredVideos.push(scored);
              } else {
                telemetry.counts.candidatesRejected++;
              }
            }
          }
        }

        // 4B. Reading Discovery
        for (const rQuery of mod.searchQueries.readingQueries) {
          const rawReadings = await this.readingProvider.search(rQuery, {
            maxResults: 3,
            domain: analyzed.detectedDomain,
          });

          telemetry.counts.candidatesDiscovered += rawReadings.length;

          for (const raw of rawReadings) {
            const normalized = normalizeCandidateResource(raw);
            const val = validateResource(normalized);
            if (val.valid) {
              const scored = scoreResource(normalized, mod, analyzed.detectedDomain, validatedInput.topic);
              if (scored.passedRelevanceGate) {
                allDiscoveredReadings.push(scored);
              } else {
                telemetry.counts.candidatesRejected++;
              }
            }
          }
        }
      }

      const quotaStatus = this.youtubeProvider.getQuotaStatus();
      if (quotaStatus.isQuotaExhausted) {
        telemetry.apiMetrics.youtubeQuotaExhausted = true;
        diagnostics.push('YouTube API daily quota exhausted: Verified educator channel repository fallback used.');
      }

      emitStage(
        3,
        'completed',
        `Discovered ${telemetry.counts.candidatesDiscovered} resources (${telemetry.counts.candidatesRejected} rejected by objective gating).`
      );

      emitStage(4, 'running');
      const uniqueVideos = deduplicateResources(allDiscoveredVideos);
      const uniqueReadings = deduplicateResources(allDiscoveredReadings);
      emitStage(4, 'completed', `Validated ${uniqueVideos.length} unique videos and ${uniqueReadings.length} reading materials.`);

      emitStage(5, 'running');
      emitStage(5, 'completed', `Objective scoring complete. Zero cross-domain collisions allowed.`);

      // ----------------------------------------------------------------------
      // STAGES 7, 8, 9: Study Notes, Quizzes, Distribution per module
      // ----------------------------------------------------------------------
      this.checkAbort();
      emitStage(6, 'running');
      const assignments: ModuleResourceAssignment[] = await Promise.all(
        plan.modules.map(async (mod) => {
          // Videos & readings for this module
          const modVideos = uniqueVideos.filter(
            (v) =>
              v.matchedObjectives.length > 0 ||
              v.title.toLowerCase().includes(mod.title.toLowerCase().split(' ')[0] || '')
          );
          const modReadings = uniqueReadings.filter(
            (r) =>
              r.matchedObjectives.length > 0 ||
              r.title.toLowerCase().includes(mod.title.toLowerCase().split(' ')[0] || '')
          );

          // Fallback to top candidates if filter is too narrow
          const finalModVideos = modVideos.length > 0 ? modVideos : uniqueVideos.slice(0, 2);
          const finalModReadings = modReadings.length > 0 ? modReadings : uniqueReadings.slice(0, 2);

          // 7. Study Notes Generation
          telemetry.apiMetrics.geminiCalls++;
          const studyNotes = await generateModuleStudyNotes(
            mod,
            analyzed.detectedDomain,
            finalModReadings,
            validatedInput.topic
          );

          // 8. Quiz Generation
          telemetry.apiMetrics.geminiCalls++;
          const quiz = await generateModuleQuiz(
            mod,
            analyzed.detectedDomain,
            studyNotes,
            validatedInput.topic
          );

          // 9. Distribution
          const assignment = distributeAndSequenceModuleResources(
            mod,
            finalModVideos,
            finalModReadings,
            studyNotes,
            quiz
          );

          telemetry.counts.resourcesAssigned +=
            assignment.videos.length + assignment.readings.length + assignment.studyNotes.length;
          return assignment;
        })
      );

      emitStage(6, 'completed', `Generated ${assignments.length} grounded study note monographs.`);

      emitStage(7, 'running');
      emitStage(7, 'completed', `Generated formative diagnostic quizzes for all ${assignments.length} modules.`);

      emitStage(8, 'running');
      emitStage(8, 'completed', `Sequenced lessons logically (Lecture -> Practice -> Reading -> Notes -> Quiz).`);

      // ----------------------------------------------------------------------
      // STAGE 10: Coverage Validation
      // ----------------------------------------------------------------------
      this.checkAbort();
      emitStage(9, 'running');
      const coverage = validateCurriculumCoverage(plan, assignments, diagnostics);
      emitStage(
        9,
        'completed',
        `Curriculum coverage audit: ${coverage.overallCoveragePercent}% complete (${coverage.totalVideos} videos, ${coverage.totalReadings} readings, ${coverage.totalNotes} notes, ${coverage.totalQuizzes} quizzes).`
      );

      // ----------------------------------------------------------------------
      // STAGE 11: Persistence & Verification
      // ----------------------------------------------------------------------
      this.checkAbort();
      emitStage(10, 'running');
      const persistenceResult = await persistEngineCourse(
        validatedInput,
        plan,
        assignments,
        userId
      );

      emitStage(
        10,
        'completed',
        `Saved course "${plan.courseTitle}" (ID: ${persistenceResult.courseId}). Verification: ${persistenceResult.verificationPassed ? 'PASSED' : 'FALLBACK'}.`
      );

      telemetry.totalDurationMs = Date.now() - startTime;
      listeners.onTelemetryUpdate?.({ ...telemetry });

      return {
        success: true,
        courseId: persistenceResult.courseId,
        title: plan.courseTitle,
        curriculum: plan,
        assignments,
        coverage,
        telemetry,
        diagnostics: coverage.diagnosticMessages,
        course: persistenceResult.course,
      };
    } catch (err: any) {
      if (this.abortRequested) {
        emitStage(telemetry.currentStage - 1, 'failed', 'Synthesis cancelled by user.');
        throw new Error('Synthesis cancelled by user.');
      }

      const activeIdx = Math.max(0, telemetry.currentStage - 1);
      emitStage(activeIdx, 'failed', err.message || 'Stage execution failed', err.message);
      telemetry.errors.push({
        stage: stageNames[activeIdx] || 'General',
        message: err.message || 'Unknown execution error',
        isRecoverable: false,
      });

      throw err;
    }
  }

  private checkAbort() {
    if (this.abortRequested) {
      throw new Error('Synthesis cancelled by user.');
    }
  }
}

export const resourceEngine = new ResourceEngineOrchestrator();
