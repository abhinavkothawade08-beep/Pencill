import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  DEFAULT_BUILDER_CONFIG_STATE,
  toLegacyLearningPathConfig,
  BuilderConfig,
} from '../src/lib/types/builderConfig';
import { LearnerGoalInputSchema } from '../src/lib/resource-engine/types';
import { analyzeLearningGoal } from '../src/lib/resource-engine/analyzer';
import { planCurriculum } from '../src/lib/resource-engine/planner';
import { resourceEngine } from '../src/lib/resource-engine';
import { estimateBlueprint } from '../src/lib/curriculum/blueprintEstimator';

describe('Universal Learning Path Builder 2.0: Core Architecture & Configuration', () => {
  it('1. BuilderConfig contains all 20+ required fields with valid defaults', () => {
    const cfg = DEFAULT_BUILDER_CONFIG_STATE;

    // Title & Taxonomy
    assert.ok(cfg.title, 'Must have a default learning path title');
    assert.strictEqual(cfg.domainId, 'school-education');
    assert.ok(cfg.selectedTopics.length > 0, 'Must have initial topic');
    assert.ok(Array.isArray(cfg.subtopics), 'Must have subtopics array');

    // Objectives, Prerequisites & Exclusions
    assert.ok(Array.isArray(cfg.learningObjectives), 'Must have learning objectives array');
    assert.ok(cfg.learningObjectives.length >= 2, 'Must have initial learning objectives');
    assert.ok(Array.isArray(cfg.prerequisites), 'Must have prerequisites array');
    assert.ok(Array.isArray(cfg.knownConcepts), 'Must have known concepts array');
    assert.ok(Array.isArray(cfg.difficultConcepts), 'Must have difficult concepts array');
    assert.ok(Array.isArray(cfg.excludedTopics), 'Must have excluded topics array');

    // Teaching Style & Custom Mix
    assert.strictEqual(cfg.teachingStyle, 'balanced');
    assert.ok(cfg.customTeachingMix, 'Must have custom teaching mix definition');
    const mixTotal =
      cfg.customTeachingMix.theory +
      cfg.customTeachingMix.workedExamples +
      cfg.customTeachingMix.practicalExercises +
      cfg.customTeachingMix.projects;
    assert.strictEqual(mixTotal, 100, 'Custom teaching mix must normalize to exactly 100%');

    // Difficulty & Preferences
    assert.strictEqual(cfg.difficulty, 'intermediate');
    assert.strictEqual(cfg.difficultyPreference, 'moderate');

    // Granular Languages
    assert.ok(cfg.languageSettings, 'Must have granular language settings');
    assert.strictEqual(cfg.languageSettings.explanationLanguage, 'English');
    assert.strictEqual(cfg.languageSettings.videoLanguage, 'English');
    assert.strictEqual(cfg.languageSettings.readingLanguage, 'English');
    assert.strictEqual(cfg.languageSettings.quizLanguage, 'English');

    // Preferences: Video, Reading, Educators, Repositories
    assert.ok(cfg.videoPreferences, 'Must have video preferences');
    assert.ok(cfg.readingPreferences, 'Must have reading preferences');
    assert.ok(cfg.assessmentPreferences, 'Must have assessment preferences');
    assert.strictEqual(cfg.assessmentPreferences.questionsPerQuiz, 5);
    assert.ok(cfg.educatorPreferences, 'Must have educator preferences');
    assert.ok(cfg.repositoryPreferences, 'Must have repository preferences');
    assert.ok(cfg.repositoryPreferences.preferredRepositories.length > 0);

    // Schedule Settings
    assert.ok(cfg.scheduleSettings, 'Must have schedule settings');
    assert.strictEqual(cfg.scheduleSettings.studyDaysPerWeek, 5);
    assert.strictEqual(cfg.scheduleSettings.sessionMinutes, 45);
  });

  it('2. toLegacyLearningPathConfig translates complete BuilderConfig to backend format', () => {
    const customConfig: BuilderConfig = {
      ...DEFAULT_BUILDER_CONFIG_STATE,
      title: 'Advanced Vector Search Systems',
      teachingStyle: 'practice_first',
      languageSettings: {
        explanationLanguage: 'Hinglish',
        videoLanguage: 'Hindi',
        readingLanguage: 'English',
        quizLanguage: 'English',
      },
      repositoryPreferences: {
        preferredRepositories: ['MIT OCW', 'NPTEL'],
        excludedRepositories: ['General Web'],
        officialOnly: true,
        openAccessOnly: true,
        sourceStrategy: 'official_first',
      },
    };

    const legacy = toLegacyLearningPathConfig(customConfig, 'Engineering & Technology', 'Computer Science');
    assert.strictEqual(legacy.domainName, 'Engineering & Technology');
    assert.strictEqual(legacy.instructionLanguage, 'Hinglish');
    assert.strictEqual(legacy.explanationLanguage, 'Hinglish');
    assert.strictEqual(legacy.resourceLanguage, 'Hindi');
    assert.strictEqual(legacy.quizLanguage, 'English');
    assert.ok(legacy.advancedPreferences.preferredSources.includes('MIT OCW'));
    assert.ok(legacy.advancedPreferences.preferredSources.includes('NPTEL'));
  });

  it('3. LearnerGoalInputSchema validates all Builder 2.0 configuration parameters', () => {
    const validBuilder2Payload = {
      topic: 'Reinforcement Learning from Human Feedback',
      title: 'RLHF & Alignment for LLMs',
      domain: 'ai_and_data',
      subject: 'Machine Learning',
      topics: ['PPO Algorithm', 'Direct Preference Optimization', 'Reward Modeling'],
      subtopics: ['Bradley-Terry preference model', 'KL divergence penalty'],
      learningObjectives: [
        { id: 'lo-1', text: 'Derive Bradley-Terry preference probability formulas', successCriteria: 'Derivation verified' },
        { id: 'lo-2', text: 'Implement a reward model training loop with pairwise ranking loss' },
      ],
      prerequisites: ['PyTorch tensors', 'Transformer self-attention', 'Policy gradient theorem'],
      knownConcepts: ['Cross-entropy loss', 'Basic backpropagation'],
      difficultConcepts: ['KL penalty clipping in PPO'],
      excludedTopics: ['Old Q-learning', 'Gridworld heuristics'],
      teachingStyle: 'practice_first',
      customTeachingMix: {
        theory: 30,
        workedExamples: 30,
        practicalExercises: 30,
        projects: 10,
      },
      difficultyPreference: 'challenging',
      level: 'advanced',
      weeklyStudyHours: 12,
      targetWeeks: 6,
      language: 'English',
      explanationLanguage: 'English',
      videoLanguage: 'English',
      readingLanguage: 'English',
      quizLanguage: 'English',
      preferredEducators: ['3blue1brown', 'statquest', 'andrej-karpathy'],
      preferredRepositories: ['arXiv', 'Stanford Online', 'Official Docs'],
      readingDepth: 'rigorous',
      questionsPerQuiz: 6,
      requireCaptions: true,
      modalities: {
        video: true,
        reading: true,
        practice: true,
        quizzes: true,
        flashcards: false,
        projects: true,
      },
      curriculumBlueprintOverrides: [
        { moduleIndex: 0, title: 'Mathematical Foundations of Human Feedback' },
      ],
    };

    const parsed = LearnerGoalInputSchema.safeParse(validBuilder2Payload);
    assert.ok(parsed.success, `Schema validation should succeed: ${JSON.stringify(parsed.error?.format())}`);
    assert.strictEqual(parsed.data.title, 'RLHF & Alignment for LLMs');
    assert.strictEqual(parsed.data.teachingStyle, 'practice_first');
    assert.strictEqual(parsed.data.difficultyPreference, 'challenging');
    assert.strictEqual(parsed.data.questionsPerQuiz, 6);
    assert.strictEqual(parsed.data.requireCaptions, true);
    assert.strictEqual(parsed.data.learningObjectives?.length, 2);
    assert.strictEqual(parsed.data.curriculumBlueprintOverrides?.length, 1);
  });

  it('4. analyzer.ts integrates teachingStyle, prerequisites, and learning objectives', () => {
    const analysis = analyzeLearningGoal({
      topic: 'Quantum Computing and Shor Algorithm',
      domain: 'science-mathematics',
      teachingStyle: 'theory_first',
      prerequisites: ['Linear Algebra & Complex Vector Spaces', 'Dirac Bra-Ket Notation'],
      learningObjectives: [
        { text: 'Derive Quantum Fourier Transform matrices and phase estimation bounds' },
      ],
    });

    assert.strictEqual(analysis.learningStyle, 'theory_focused');
    assert.ok(
      analysis.prerequisites.includes('Linear Algebra & Complex Vector Spaces'),
      'User prerequisites must be merged into analysis'
    );
    assert.ok(
      analysis.coreConcepts.some((c) => c.includes('fourier') || c.includes('quantum')),
      'Objective terms must enrich core concepts'
    );
  });

  it('5. planner.ts honors custom course titles and curriculum blueprint overrides', async () => {
    const input = LearnerGoalInputSchema.parse({
      topic: 'Python Concurrency',
      title: 'Mastering Modern Python Asyncio & Threading',
      level: 'advanced',
      curriculumBlueprintOverrides: [
        { moduleIndex: 0, title: 'Unit 1: Async Event Loops & Coroutine Internals' },
      ],
    });
    const plan = await planCurriculum(
      input,
      {
        primaryTopic: 'Python Concurrency',
        detectedDomain: 'computer_science',
        normalizedLevel: 'advanced',
        learningStyle: 'balanced',
        coreConcepts: ['asyncio', 'threading', 'multiprocessing', 'event loop'],
        prerequisites: ['Python basics'],
        pedagogicalStrategy: {
          videoEmphasis: 'practical_coding',
          readingEmphasis: 'official_docs',
          practiceEmphasis: 'code_challenges',
        },
      }
    );

    assert.strictEqual(
      plan.courseTitle,
      'Mastering Modern Python Asyncio & Threading',
      'Course title must match custom title'
    );
    assert.strictEqual(
      plan.modules[0].title,
      'Unit 1: Async Event Loops & Coroutine Internals',
      'Module 0 title must be overridden as requested'
    );
  });

  it('6. estimateBlueprint adapts to Builder 2.0 configuration and detects compressed schedules', () => {
    const cfg: BuilderConfig = {
      ...DEFAULT_BUILDER_CONFIG_STATE,
      weeklyHours: 8,
      difficulty: 'advanced',
    };

    const estimate = estimateBlueprint(cfg);
    assert.ok(estimate.estimatedTotalHours > 20, 'Estimated hours must reflect advanced rigor');
    assert.ok(estimate.moduleRange[0] >= 3, 'Must produce cohesive module range');

    // Tight deadline test
    const inTenDays = new Date();
    inTenDays.setDate(inTenDays.getDate() + 10);
    const tightCfg: BuilderConfig = {
      ...cfg,
      deadline: inTenDays.toISOString().split('T')[0],
      weeklyHours: 4,
    };
    const tightEstimate = estimateBlueprint(tightCfg);
    assert.strictEqual(tightEstimate.feasibilityState.isFeasible, false);
    assert.ok(tightEstimate.feasibilityState.status === 'tight' || tightEstimate.feasibilityState.status === 'impossible');
  });

  it('7. End-to-End course synthesis with full Builder 2.0 configuration', async () => {
    const input: any = {
      topic: 'Differential Equations',
      title: 'Rigorous Ordinary Differential Equations with Analytical Proofs',
      teachingStyle: 'theory_first',
      difficultyPreference: 'challenging',
      level: 'intermediate',
      weeklyStudyHours: 8,
      targetWeeks: 4,
      language: 'English',
      learningObjectives: [
        { text: 'Solve first and second order linear homogeneous and non-homogeneous equations' },
        { text: 'Apply Laplace transforms to solve initial-value differential problems' },
      ],
      prerequisites: ['Single-variable calculus derivatives and integrals'],
      preferredRepositories: ['MIT OCW', 'OpenStax', 'Khan Academy'],
      questionsPerQuiz: 5,
    };

    const result = await resourceEngine.execute(input);

    // 1. Verify Course Metadata
    assert.ok(result.courseId, 'Course ID must be generated');
    assert.strictEqual(result.title, 'Rigorous Ordinary Differential Equations with Analytical Proofs');
    assert.ok(result.curriculum.modules.length >= 3, 'Must have at least 3 modules');

    // 2. Verify Zero Duplicate Videos across modules
    const allVideoUrls = new Set<string>();
    for (const assign of result.assignments) {
      for (const v of assign.videos) {
        const url = v.canonicalUrl || v.url || '';
        assert.ok(url.length > 0, 'Resource URL must not be empty');
        assert.ok(!allVideoUrls.has(url), `Duplicate video URL detected: ${url}`);
        allVideoUrls.add(url);
      }
    }

    // 3. Verify Formative Checkpoint Quizzes
    assert.ok(result.quizzes && result.quizzes.length >= 3, 'Must generate quizzes for all modules');
    for (const quiz of result.quizzes) {
      assert.ok(quiz.questions.length >= 4, 'Quiz must contain at least 4 questions');
      for (const q of quiz.questions) {
        assert.strictEqual(q.options.length, 4, 'Every question must have 4 options');
        const hasValidKey =
          (q.correctOptionId && ['A', 'B', 'C', 'D'].includes(q.correctOptionId)) ||
          (typeof (q as any).correctOptionIndex === 'number' && (q as any).correctOptionIndex >= 0 && (q as any).correctOptionIndex <= 3);
        assert.ok(hasValidKey, `Valid answer key expected (A-D or 0-3), got ${q.correctOptionId}`);
        assert.ok((q.explanation || '').length > 10, 'Pedagogical explanation must be substantive');
      }
    }

    // 4. Verify Quality Gates & Coverage Audit
    assert.ok(result.coverage, 'Coverage audit must be present');
    assert.strictEqual(result.coverage.isComplete, true, 'Coverage should be marked complete');
    assert.ok(result.coverage.overallCoveragePercent >= 80, 'Coverage score must be high');

    // 5. Verify Telemetry contains all 11 stages
    assert.strictEqual(result.telemetry.stages.length, 11, 'Must record telemetry for all 11 stages');
    const allDone = result.telemetry.stages.every((s) => s.status === 'completed');
    assert.strictEqual(allDone, true, 'All 11 stages should be completed');
  });
});
