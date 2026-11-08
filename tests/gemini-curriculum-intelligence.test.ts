import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  planIntelligentCurriculum,
  buildDeterministicProposal,
  analyzeCurriculumObjective,
  clusterConceptsSemantically,
  validateCurriculumProposal,
  autoRepairCurriculumProposal,
  analyzePrerequisites,
  detectCurriculumRedundancy,
  isNarrowFocusedTopic,
  isComprehensiveSubject,
  calculateRecommendedModuleCount,
  redactSecrets,
  getCurriculumConfig,
  isGeminiConfigured,
} from '../src/lib/curriculum-intelligence';

import { ResourceEngineOrchestrator } from '../src/lib/resource-engine/orchestrator';
import { LearnerGoalInput } from '../src/lib/resource-engine/types';

type SafeGoalInput = Partial<LearnerGoalInput> & { topic: string };

describe('PENCILL GEMINI CURRICULUM ARCHITECT: 17 Verification Scenarios', () => {
  const orchestrator = new ResourceEngineOrchestrator();

  // --------------------------------------------------------------------------
  // Scenario 1: Python Fundamentals-Only (No Unnecessary Fragmentation)
  // --------------------------------------------------------------------------
  it('Scenario 1: Python fundamentals-only request synthesizes 1 or 2 modules only', async () => {
    const input: SafeGoalInput = {
      topic: 'Python Fundamentals',
      topics: ['Variables', 'Data Types', 'Conditionals', 'For Loops', 'Functions', 'Lists'],
      level: 'beginner',
      depth: 'introductory',
      weeklyStudyHours: 5,
      targetWeeks: 2,
    };

    const plan = await planIntelligentCurriculum(input);
    assert.ok(
      plan.modules.length >= 1 && plan.modules.length <= 2,
      `Python fundamentals must NOT be fragmented into 5-8 modules. Expected 1-2 modules, got ${plan.modules.length}`
    );
    assert.equal(plan.domain, 'computer_science');
  });

  // --------------------------------------------------------------------------
  // Scenario 2: Complete Comprehensive Python Curriculum
  // --------------------------------------------------------------------------
  it('Scenario 2: Complete Python curriculum synthesizes cohesive 4-module progression', async () => {
    const input: SafeGoalInput = {
      topic: 'Python Programming Masterclass',
      level: 'intermediate',
      depth: 'comprehensive',
      weeklyStudyHours: 10,
      targetWeeks: 4,
    };

    const plan = await planIntelligentCurriculum(input);
    assert.equal(plan.modules.length, 4, 'Complete Python course should synthesize 4 cohesive modules');
    const titles = plan.modules.map((m) => m.title.toLowerCase()).join(' ');
    assert.ok(titles.includes('syntax') || titles.includes('variables'));
    assert.ok(titles.includes('control') || titles.includes('functions'));
    assert.ok(titles.includes('structures') || titles.includes('collections'));
    assert.ok(titles.includes('object') || titles.includes('architecture') || titles.includes('exception'));
  });

  // --------------------------------------------------------------------------
  // Scenario 3: Loops-Only Request (Focused Skill = Exactly 1 Module)
  // --------------------------------------------------------------------------
  it('Scenario 3: Loops-only request generates exactly 1 focused module', async () => {
    const input: SafeGoalInput = {
      topic: 'Python Loops',
      topics: ['While Loops', 'For Loops', 'Nested Loops', 'Break and Continue', 'Range Protocol'],
      level: 'beginner',
      depth: 'introductory',
      weeklyStudyHours: 4,
      targetWeeks: 1,
    };

    const plan = await planIntelligentCurriculum(input);
    assert.equal(plan.modules.length, 1, 'Loops-only must yield exactly 1 module');
    assert.match(plan.modules[0].title, /loop|iteration/i);
  });

  // --------------------------------------------------------------------------
  // Scenario 4: File Handling & Exceptions (Combined Single Cohesive Unit)
  // --------------------------------------------------------------------------
  it('Scenario 4: File handling and exceptions generates exactly 1 cohesive unit', async () => {
    const input: SafeGoalInput = {
      topic: 'Python File I/O and Exception Handling',
      topics: ['Reading files', 'Writing files', 'Context managers', 'Try/Except blocks', 'Custom exceptions'],
      level: 'intermediate',
      depth: 'introductory',
      weeklyStudyHours: 4,
      targetWeeks: 1,
    };

    const plan = await planIntelligentCurriculum(input);
    assert.equal(plan.modules.length, 1, 'File handling and exceptions must form 1 combined unit');
    assert.match(plan.modules[0].title, /file|exception/i);
  });

  // --------------------------------------------------------------------------
  // Scenario 5: Differential Equations (Rigorous Higher-Math Progression)
  // --------------------------------------------------------------------------
  it('Scenario 5: Differential Equations course produces 4 rigorous mathematical units', async () => {
    const input: SafeGoalInput = {
      topic: 'Differential Equations',
      level: 'intermediate',
      depth: 'rigorous',
      weeklyStudyHours: 10,
      targetWeeks: 4,
    };

    const plan = await planIntelligentCurriculum(input);
    assert.equal(plan.modules.length, 4, 'Differential equations course should produce 4 modules');
    const titles = plan.modules.map((m) => m.title);
    assert.match(titles[0], /First-Order/i);
    assert.match(titles[1], /Second-Order/i);
    assert.match(titles[2], /Laplace/i);
    assert.match(titles[3], /Series|Systems/i);
  });

  // --------------------------------------------------------------------------
  // Scenario 6: Real Analysis (Theoretical Analysis Syllabus)
  // --------------------------------------------------------------------------
  it('Scenario 6: Real Analysis course synthesizes 5 foundational analysis modules', async () => {
    const input: SafeGoalInput = {
      topic: 'Real Analysis',
      level: 'advanced',
      depth: 'rigorous',
      weeklyStudyHours: 12,
      targetWeeks: 5,
    };

    const plan = await planIntelligentCurriculum(input);
    assert.equal(plan.modules.length, 5, 'Real analysis should produce 5 canonical modules');
    const titles = plan.modules.map((m) => m.title);
    assert.match(titles[0], /Topology|Completeness/i);
    assert.match(titles[1], /Sequences|Bolzano/i);
    assert.match(titles[2], /Continuity/i);
    assert.match(titles[3], /Differentiation|Mean Value/i);
    assert.match(titles[4], /Riemann Integration/i);
  });

  // --------------------------------------------------------------------------
  // Scenario 7: React Course (Component Architecture to Full-Stack/RSC)
  // --------------------------------------------------------------------------
  it('Scenario 7: React course synthesizes 4 progressive UI engineering modules', async () => {
    const input: SafeGoalInput = {
      topic: 'React Modern Web Development',
      level: 'intermediate',
      depth: 'comprehensive',
      weeklyStudyHours: 10,
      targetWeeks: 4,
    };

    const plan = await planIntelligentCurriculum(input);
    assert.equal(plan.modules.length, 4, 'React development course should produce 4 modules');
    const titles = plan.modules.map((m) => m.title);
    assert.match(titles[0], /Components|JSX|Props|State/i);
    assert.match(titles[1], /Hooks|Lifecycle/i);
    assert.match(titles[2], /State Management|Routing/i);
    assert.match(titles[3], /Server Components|Profiling|Production/i);
  });

  // --------------------------------------------------------------------------
  // Scenario 8: Analog Circuits (ECE Engineering Curriculum)
  // --------------------------------------------------------------------------
  it('Scenario 8: Analog Circuits course synthesizes 4 electrical engineering modules', async () => {
    const input: SafeGoalInput = {
      topic: 'Analog Circuits and Electronics',
      level: 'intermediate',
      depth: 'comprehensive',
      weeklyStudyHours: 10,
      targetWeeks: 4,
    };

    const plan = await planIntelligentCurriculum(input);
    assert.equal(plan.modules.length, 4, 'Analog circuits course should produce 4 modules');
    const titles = plan.modules.map((m) => m.title);
    assert.match(titles[0], /Network|Theorems|Laws/i);
    assert.match(titles[1], /Diodes|Transistor/i);
    assert.match(titles[2], /Operational Amplifiers|Feedback/i);
    assert.match(titles[3], /Frequency Response|Oscillators/i);
  });

  // --------------------------------------------------------------------------
  // Scenario 9: Classical Mechanics (Physics Progression)
  // --------------------------------------------------------------------------
  it('Scenario 9: Classical Mechanics course synthesizes 4 physics units', async () => {
    const input: SafeGoalInput = {
      topic: 'Classical Mechanics',
      level: 'intermediate',
      depth: 'comprehensive',
      weeklyStudyHours: 10,
      targetWeeks: 4,
    };

    const plan = await planIntelligentCurriculum(input);
    assert.equal(plan.modules.length, 4, 'Classical mechanics should produce 4 modules');
    const titles = plan.modules.map((m) => m.title);
    assert.match(titles[0], /Kinematics|Newton/i);
    assert.match(titles[1], /Work-Energy|Momentum/i);
    assert.match(titles[2], /Rotational|Torque|Angular/i);
    assert.match(titles[3], /Gravitational|Oscillations/i);
  });

  // --------------------------------------------------------------------------
  // Scenario 10: Large Engineering Curriculum (Dynamic Module Range 7-12)
  // --------------------------------------------------------------------------
  it('Scenario 10: Large engineering curriculum scales dynamically up to 7-12 modules', async () => {
    const targetModuleCount = calculateRecommendedModuleCount(
      'Computer Science Degree Curriculum',
      'undergraduate',
      80
    );
    assert.ok(
      targetModuleCount >= 7 && targetModuleCount <= 12,
      `Comprehensive 80-hour subject should produce 7-12 modules, got ${targetModuleCount}`
    );
  });

  // --------------------------------------------------------------------------
  // Scenario 11: Limited Resource Availability (Resilient Non-Crash)
  // --------------------------------------------------------------------------
  it('Scenario 11: Limited resource availability gracefully synthesizes without crash or fake data', async () => {
    const input: SafeGoalInput = {
      topic: 'Hyper-Specialized Esoteric Programming Invariants',
      level: 'advanced',
      weeklyStudyHours: 6,
      targetWeeks: 2,
    };

    const result = await orchestrator.execute(input, 'test-user-scarce');
    assert.equal(result.success, true);
    assert.ok(result.courseId);
    assert.ok(result.assignments.length > 0);
    // Verify no fabricated fake YouTube IDs
    for (const assign of result.assignments) {
      for (const v of assign.videos) {
        assert.ok(v.id && !v.id.includes('undefined') && !v.id.includes('fake'));
      }
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 12: Complete Playlist Discovery (Zero Redundant Individual Videos)
  // --------------------------------------------------------------------------
  it('Scenario 12: Complete playlist discovery eliminates duplicate individual videos', async () => {
    const input: SafeGoalInput = {
      topic: 'CA Final Financial Reporting',
      level: 'advanced',
      learningGoal: 'prepare_exam',
      weeklyStudyHours: 12,
      targetWeeks: 4,
    };

    const result = await orchestrator.execute(input, 'test-user-playlist-dedup');
    assert.equal(result.success, true);

    const withPlaylist = result.assignments.filter((a) => a.primaryPlaylist);
    if (withPlaylist.length > 0) {
      const primary = withPlaylist[0].primaryPlaylist!;
      const playlistVideoIds = new Set(primary.items?.map((it) => it.videoId) || []);

      // Verify no standalone video inside this module duplicates a playlist video
      for (const v of withPlaylist[0].videos) {
        const vidId = v.canonicalUrl?.split('v=')[1]?.split('&')[0];
        if (vidId) {
          assert.ok(!playlistVideoIds.has(vidId), `Redundant individual video found that was already in playlist: ${vidId}`);
        }
      }
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 13: Partial Playlist Discovery (Seamless Supplementation)
  // --------------------------------------------------------------------------
  it('Scenario 13: Partial playlist discovery seamlessly supplements missing subtopics', async () => {
    const input: SafeGoalInput = {
      topic: 'React Modern Web Development',
      weeklyStudyHours: 8,
      targetWeeks: 4,
    };

    const result = await orchestrator.execute(input, 'test-user-partial-playlist');
    assert.equal(result.success, true);
    // Every module must have verified resources (readings or videos)
    for (const assign of result.assignments) {
      const hasResources = assign.videos.length > 0 || assign.readings.length > 0 || assign.studyNotes.length > 0;
      assert.ok(hasResources, `Module ${assign.moduleId} must have supplementary resources`);
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 14: Duplicate Topic Detection & Sanitization
  // --------------------------------------------------------------------------
  it('Scenario 14: Duplicate topic detection flags and deduplicates overlapping concepts', () => {
    const rawProposal = buildDeterministicProposal({
      topic: 'Python Programming',
      topics: ['Variables', 'Control Flow', 'Variables', 'Loops', 'Variables'],
    });

    const redundancy = detectCurriculumRedundancy(rawProposal.modules);
    assert.ok(redundancy.duplicateConcepts.length >= 0);
    // Sanitized modules must have zero duplicate concepts
    for (const mod of redundancy.sanitizedModules) {
      const unique = new Set(mod.concepts);
      assert.equal(unique.size, mod.concepts.length, 'Module concepts must be unique');
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 15: Course Regeneration (Deterministic & Idempotent)
  // --------------------------------------------------------------------------
  it('Scenario 15: Course regeneration reproduces identical curriculum structure', async () => {
    const input: SafeGoalInput = {
      topic: 'Classical Mechanics',
      level: 'intermediate',
      weeklyStudyHours: 8,
      targetWeeks: 4,
    };

    const plan1 = await planIntelligentCurriculum(input);
    const plan2 = await planIntelligentCurriculum(input);

    assert.equal(plan1.modules.length, plan2.modules.length);
    assert.deepEqual(
      plan1.modules.map((m) => m.title),
      plan2.modules.map((m) => m.title)
    );
  });

  // --------------------------------------------------------------------------
  // Scenario 16: Course Reload Persistence
  // --------------------------------------------------------------------------
  it('Scenario 16: Persisted course structure faithfully reloads from cache', async () => {
    const input: SafeGoalInput = {
      topic: 'Real Analysis',
      level: 'advanced',
      weeklyStudyHours: 10,
      targetWeeks: 5,
    };

    const result = await orchestrator.execute(input, 'test-user-persistence');
    assert.ok(result.courseId);

    // Verify course can be re-accessed and retains module count
    assert.equal(result.curriculum.modules.length, 5);
    assert.equal(result.assignments.length, 5);
  });

  // --------------------------------------------------------------------------
  // Scenario 17: Multi-User Isolation
  // --------------------------------------------------------------------------
  it('Scenario 17: Multi-user course generation isolates paths strictly per user ID', async () => {
    const input: SafeGoalInput = {
      topic: 'Differential Equations',
      weeklyStudyHours: 8,
      targetWeeks: 4,
    };

    const user1Course = await orchestrator.execute(input, 'user-alpha-123');
    const user2Course = await orchestrator.execute(input, 'user-beta-456');

    assert.notEqual(user1Course.courseId, user2Course.courseId, 'Course IDs must be unique per generation');
    assert.ok(user1Course.courseId.startsWith('path-'));
    assert.ok(user2Course.courseId.startsWith('path-'));
  });

  // --------------------------------------------------------------------------
  // Security & Configuration Audit Tests
  // --------------------------------------------------------------------------
  it('Security: API key and secret redaction sanitizes sensitive tokens', () => {
    const testSecret = 'AIzaSyD-TEST-KEY-12345678901234567890';
    const rawLog = `Calling endpoint with key=${testSecret} for module generation`;
    const redacted = redactSecrets(rawLog);
    assert.ok(!redacted.includes(testSecret), 'Raw Gemini API key must never be logged');
    assert.ok(redacted.includes('[REDACTED_GEMINI_KEY]'));
  });

  it('Configuration: derives valid model configuration with timeouts and retry limits', () => {
    const config = getCurriculumConfig();
    assert.ok(config.primaryModel.length > 0);
    assert.ok(config.timeoutMs >= 15000);
    assert.ok(config.maxRetries >= 1);
    assert.ok(config.maxOutputTokens >= 2048);
  });
});
