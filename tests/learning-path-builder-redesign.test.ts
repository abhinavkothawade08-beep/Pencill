import { test, describe } from 'node:test';
import assert from 'node:assert';
import { LearnerGoalInputSchema, LearnerGoalInput } from '../src/lib/resource-engine/types';
import { estimateBlueprint } from '../src/lib/curriculum/blueprintEstimator';
import { DEFAULT_BUILDER_CONFIG_STATE, BuilderConfig } from '../src/lib/types/builderConfig';
import { planIntelligentCurriculum } from '../src/lib/curriculum-intelligence/syllabus-planner';

describe('Learning Path Builder Redesign: Step 1 (Goal & Domain)', () => {
  test('Step 1 payload produces valid LearnerGoalInputSchema with minimal essential fields', () => {
    // Mimics the simplified Step 1 + default Step 2 payload
    const minimalPayload = {
      topic: 'Differential Equations',
      title: 'Differential Equations',
      domain: 'science-mathematics',
      topics: ['Differential Equations'],
      subtopics: ['First Order ODEs', 'Laplace Transforms', 'Fourier Series'],
      learningGoal: 'understand_concepts' as const,
      level: 'intermediate' as const,
      depth: 'comprehensive' as const,
      learningStyle: 'theory_focused' as const,
      weeklyStudyHours: 5,
      targetWeeks: 5,
    };

    const parsed = LearnerGoalInputSchema.safeParse(minimalPayload);
    assert.strictEqual(parsed.success, true, 'Minimal Step 1 + 2 payload must parse successfully');
    if (parsed.success) {
      assert.strictEqual(parsed.data.topic, 'Differential Equations');
      assert.strictEqual(parsed.data.subtopics?.length, 3);
      assert.strictEqual(parsed.data.learningGoal, 'understand_concepts');
    }
  });

  test('Rejects invalid input when topic is missing or too short', () => {
    const invalidPayload = {
      topic: 'A', // Too short (< 2 chars)
    };

    const parsed = LearnerGoalInputSchema.safeParse(invalidPayload);
    assert.strictEqual(parsed.success, false, 'Must reject topic shorter than 2 characters');
  });
});

describe('Learning Path Builder Redesign: Step 2 (Personalization & Defaults)', () => {
  test('Knowledge Level, Depth, and Approach properly map to pedagogical parameters', () => {
    // Beginner + Quick Overview + Practical-Focused
    const beginnerPracticalConfig: BuilderConfig = {
      ...DEFAULT_BUILDER_CONFIG_STATE,
      title: 'React 18 Development',
      difficulty: 'beginner',
      depthLevelId: 'foundation',
      teachingStyle: 'practice_first',
      weeklyHours: 10,
    };

    const estimate = estimateBlueprint(beginnerPracticalConfig);
    assert.ok(estimate.estimatedTotalHours > 0);
    assert.ok(estimate.progressionPhases.length >= 2);
    // Weekly hours 10 should yield faster completion weeks than 2 hours
    assert.ok(estimate.estimatedWeeks <= 6, '10h/week should yield compact completion weeks');
  });

  test('Custom study hours adapt timeline without error', () => {
    const customHours = [2, 5, 10, 15];

    for (const hours of customHours) {
      const config: BuilderConfig = {
        ...DEFAULT_BUILDER_CONFIG_STATE,
        weeklyHours: hours,
      };
      const est = estimateBlueprint(config);
      assert.ok(est.estimatedTotalHours > 0, `Total hours must be positive for ${hours}h/wk`);
      assert.ok(est.estimatedWeeks >= 1, `Weeks must be at least 1 for ${hours}h/wk`);
    }
  });

  test('Intelligent AI Defaults adapt for Theory (DiffEq) vs Practical (React)', () => {
    const mathConfig: BuilderConfig = {
      ...DEFAULT_BUILDER_CONFIG_STATE,
      title: 'Ordinary Differential Equations',
      domainId: 'science-mathematics',
      selectedTopics: [{ id: 't1', label: 'Ordinary Differential Equations', source: 'taxonomy', complexity: 4 }],
      teachingStyle: 'theory_first',
    };

    const reactConfig: BuilderConfig = {
      ...DEFAULT_BUILDER_CONFIG_STATE,
      title: 'React & Next.js Full Stack',
      domainId: 'engineering-technology',
      selectedTopics: [{ id: 't2', label: 'React & Next.js Full Stack', source: 'taxonomy', complexity: 3 }],
      teachingStyle: 'practice_first',
    };

    const mathEstimate = estimateBlueprint(mathConfig);
    const reactEstimate = estimateBlueprint(reactConfig);

    assert.ok(mathEstimate.progressionPhases.length >= 3);
    assert.ok(reactEstimate.progressionPhases.length >= 3);
    // Math topic with higher complexity should require rigorous or balanced estimated hours
    assert.ok(mathEstimate.estimatedTotalHours >= 20);
  });
});

describe('Learning Path Builder Redesign: Step 3 (Curriculum Review & Overrides)', () => {
  test('User-edited module titles and custom objectives are preserved in curriculum planner', async () => {
    const inputWithOverrides: LearnerGoalInput = LearnerGoalInputSchema.parse({
      topic: 'Quantum Mechanics',
      title: 'Quantum Mechanics: Wave Mechanics to Perturbation',
      domain: 'science-mathematics',
      level: 'advanced',
      weeklyStudyHours: 8,
      curriculumBlueprintOverrides: [
        {
          moduleIndex: 0,
          title: 'Customized Unit 1: Wave-Particle Duality & Schrödinger Formalism',
          customObjectives: ['Derive time-dependent Schrödinger equation from first principles'],
        },
        {
          moduleIndex: 1,
          title: 'Customized Unit 2: Quantum Harmonic Oscillator & Angular Momentum',
        },
      ],
      learningObjectives: [
        {
          id: 'lo-1',
          text: 'Apply Dirac bra-ket notation to Hilbert space state representations',
        },
      ],
    });

    const plan = await planIntelligentCurriculum(inputWithOverrides, { forceFallback: true });

    assert.ok(plan.modules.length >= 2);
    // Custom course title override
    assert.strictEqual(plan.courseTitle, 'Quantum Mechanics: Wave Mechanics to Perturbation');
    // Module 0 title override
    assert.strictEqual(
      plan.modules[0].title,
      'Customized Unit 1: Wave-Particle Duality & Schrödinger Formalism'
    );
    // Module 1 title override
    assert.strictEqual(
      plan.modules[1].title,
      'Customized Unit 2: Quantum Harmonic Oscillator & Angular Momentum'
    );
  });

  test('Module reordering and removal are safely handled in blueprint estimator', () => {
    const configWithOverrides: BuilderConfig = {
      ...DEFAULT_BUILDER_CONFIG_STATE,
      title: 'Organic Chemistry Foundations',
      curriculumBlueprintOverrides: [
        {
          moduleIndex: 0,
          title: 'Stereochemistry & Conformational Analysis',
        },
        {
          moduleIndex: 1,
          title: 'Removed Unit',
          isRemoved: true,
        },
        {
          moduleIndex: 5,
          title: 'Added Custom Capstone: Multi-step Organic Synthesis',
          isRemoved: false,
        },
      ],
    };

    const estimate = estimateBlueprint(configWithOverrides);
    assert.ok(estimate.progressionPhases.length > 0);
  });
});

describe('Learning Path Builder Redesign: Advanced Settings Integration', () => {
  test('Advanced settings serialize cleanly into LearnerGoalInputSchema', () => {
    const rawAdvancedPayload = {
      topic: 'Deep Learning & Transformer Architectures',
      title: 'Deep Learning & Transformer Architectures',
      domain: 'engineering-technology',
      level: 'advanced' as const,
      learningStyle: 'theory_focused' as const,
      weeklyStudyHours: 12,
      targetWeeks: 4,
      preferredEducators: ['3blue1brown', 'mitocw', 'karpathy'],
      preferredRepositories: ['MIT OpenCourseWare', 'Stanford Online', 'arXiv'],
      modalities: {
        video: true,
        reading: true,
        practice: true,
        quizzes: true,
        flashcards: false,
      },
      readingDepth: 'rigorous' as const,
      questionsPerQuiz: 10,
      requireCaptions: true,
      language: 'English',
    };

    const parsed = LearnerGoalInputSchema.safeParse(rawAdvancedPayload);
    assert.strictEqual(parsed.success, true);
    if (parsed.success) {
      const fullAdvancedPayload: LearnerGoalInput = parsed.data;
      assert.strictEqual(fullAdvancedPayload.preferredEducators?.length, 3);
      assert.strictEqual(fullAdvancedPayload.preferredRepositories?.length, 3);
      assert.strictEqual(fullAdvancedPayload.questionsPerQuiz, 10);
      assert.strictEqual(fullAdvancedPayload.readingDepth, 'rigorous');
      assert.strictEqual(fullAdvancedPayload.requireCaptions, true);
    }
  });

  test('Default preferences function seamlessly when advanced settings are untouched', () => {
    const defaultPayload = {
      topic: 'Linear Algebra',
    };

    const parsed = LearnerGoalInputSchema.safeParse(defaultPayload);
    assert.strictEqual(parsed.success, true);
    if (parsed.success) {
      assert.strictEqual(parsed.data.level, 'intermediate');
      assert.strictEqual(parsed.data.learningStyle, 'balanced');
      assert.strictEqual(parsed.data.weeklyStudyHours, 10);
      assert.strictEqual(parsed.data.depth, 'comprehensive');
    }
  });
});
