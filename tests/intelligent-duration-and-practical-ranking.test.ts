import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseIsoDurationToMinutes,
  inferLearningIntent,
  calculateDurationSuitability,
  extractPracticalLearningSignals,
  QualityScoringEngine,
  RankingEngine,
  SearchPlanner,
  DEFAULT_ENGINE_CONFIG,
  DEFAULT_DURATION_PREFERENCES,
  EngineResource,
} from '../.backup_engine_v1';
import { distributeResourcesToCourse } from '../.backup_engine_v1/core/module-distributor';
import { createTopicAdaptiveCurriculum } from '@/services/ai/curriculum-adaptive-engine';

describe('Intelligent Duration Preferences, Practical Video Discovery & Ranking Pipeline', () => {
  const qualityEngine = new QualityScoringEngine();
  const rankingEngine = new RankingEngine();
  const searchPlanner = new SearchPlanner();

  function makeVideo(overrides: Partial<EngineResource>): EngineResource {
    const rawId = overrides.id || `yt_${Math.random().toString(36).substring(2, 11)}`;
    const cleanId = rawId.replace(/^yt_/, '').padEnd(11, '0').slice(0, 11);
    const pubDate = overrides.publishedAt || '2025-06-15T12:00:00Z';

    return {
      id: rawId,
      title: overrides.title || 'Technical Lecture Tutorial',
      description: overrides.description || 'Hands-on lecture and practical implementation with code walkthrough.',
      type: overrides.type || 'video_lecture',
      canonicalUrl: overrides.canonicalUrl || `https://www.youtube.com/watch?v=${cleanId}`,
      sourceUrl: overrides.sourceUrl || `https://www.youtube.com/watch?v=${cleanId}`,
      sourceName: overrides.sourceName || 'FreeCodeCamp',
      provider: 'youtube',
      authorOrChannel: overrides.authorOrChannel || 'FreeCodeCamp',
      durationMinutes: overrides.durationMinutes ?? 45,
      difficulty: overrides.difficulty || 'intermediate',
      language: 'en',
      score: overrides.score || {
        overall: 88,
        relevance: 90,
        educationalValue: 88,
        structureCompleteness: 85,
        freshness: 85,
      },
      tags: overrides.tags || ['programming', 'tutorial'],
      metadata: {
        videoId: cleanId,
        definition: 'hd',
        hasCaptions: true,
        isEmbeddable: true,
        publishedAt: pubDate,
        ...overrides.metadata,
      },
      discoveredAt: new Date().toISOString(),
      publishedAt: pubDate,
      ...overrides,
    };
  }

  // ==========================================================================
  // Test 1: ISO 8601 Duration Parsing
  // ==========================================================================
  describe('1. ISO 8601 Duration Parsing', () => {
    test('Parses standard hours, minutes, and seconds strings correctly', () => {
      assert.strictEqual(parseIsoDurationToMinutes('PT8M30S'), 9, 'PT8M30S should round to 9 minutes');
      assert.strictEqual(parseIsoDurationToMinutes('PT45M'), 45, 'PT45M should be 45 minutes');
      assert.strictEqual(parseIsoDurationToMinutes('PT1H20M'), 80, 'PT1H20M should be 80 minutes');
      assert.strictEqual(parseIsoDurationToMinutes('PT2H15M30S'), 136, 'PT2H15M30S should round to 136 minutes');
      assert.strictEqual(parseIsoDurationToMinutes('P1DT2H'), 1560, 'P1DT2H should be 1560 minutes');
      assert.strictEqual(parseIsoDurationToMinutes('PT30S'), 1, 'PT30S should round to 1 minute');
      assert.strictEqual(parseIsoDurationToMinutes('PT0S'), 1, 'PT0S should return 1 minute');
    });

    test('Safely handles missing, empty, or malformed strings without throwing', () => {
      assert.strictEqual(parseIsoDurationToMinutes(undefined), 20, 'undefined duration should fallback to 20 min');
      assert.strictEqual(parseIsoDurationToMinutes(''), 20, 'empty string should fallback to 20 min');
      assert.strictEqual(parseIsoDurationToMinutes('invalid-iso'), 20, 'malformed string should fallback to 20 min');
      assert.strictEqual(parseIsoDurationToMinutes('NOT_AN_ISO_DURATION'), 20, 'arbitrary string should fallback to 20 min');
    });
  });

  // ==========================================================================
  // Test 2: Duration Preference Selection Based on Learning Objectives
  // ==========================================================================
  describe('2. Duration Preference Selection', () => {
    test('Selects concept_quick (5-15 min) for narrow syntax and isolated methods', () => {
      const intent = inferLearningIntent({
        topic: 'Python String Methods',
        moduleTitle: 'Module 1: String Methods and Slicing',
        moduleObjective: 'Learn Python string methods like split, join, strip, and format',
      });
      assert.strictEqual(intent, 'concept_quick', 'Isolated string methods should infer concept_quick');
      const pref = DEFAULT_DURATION_PREFERENCES[intent];
      assert.strictEqual(pref.targetMinMinutes, 5);
      assert.strictEqual(pref.targetMaxMinutes, 15);
    });

    test('Selects practical_project (30-120 min) for building applications', () => {
      const intent = inferLearningIntent({
        topic: 'Full Stack Web Development',
        moduleTitle: 'Module 4: Build a Full-Stack E-Commerce Application',
        moduleObjective: 'Build and deploy a complete full-stack web application with React and Node.js from scratch',
      });
      assert.strictEqual(intent, 'practical_project', 'Project build objective should infer practical_project');
      const pref = DEFAULT_DURATION_PREFERENCES[intent];
      assert.strictEqual(pref.targetMinMinutes, 30);
      assert.strictEqual(pref.targetMaxMinutes, 120);
    });

    test('Selects hands_on_tutorial (20-60 min) for practical skill implementation', () => {
      const intent = inferLearningIntent({
        topic: 'Machine Learning',
        moduleTitle: 'Model Evaluation and Hyperparameter Tuning',
        moduleObjective: 'Hands-on coding tutorial: train and evaluate a model with cross-validation and scikit-learn',
      });
      assert.strictEqual(intent, 'hands_on_tutorial', 'Hands-on tutorial should infer hands_on_tutorial');
      const pref = DEFAULT_DURATION_PREFERENCES[intent];
      assert.strictEqual(pref.targetMinMinutes, 20);
      assert.strictEqual(pref.targetMaxMinutes, 60);
    });

    test('Selects comprehensive_course (60-240+ min) for multi-lesson course masterclasses', () => {
      const intent = inferLearningIntent({
        topic: 'Python Programming',
        moduleTitle: 'Complete Python Course - One Shot Masterclass',
        moduleObjective: 'Comprehensive coverage of entire Python syllabus from syntax to object-oriented programming',
      });
      assert.strictEqual(intent, 'comprehensive_course', 'One-shot full course should infer comprehensive_course');
      const pref = DEFAULT_DURATION_PREFERENCES[intent];
      assert.strictEqual(pref.targetMinMinutes, 60);
      assert.strictEqual(pref.targetMaxMinutes, 240);
    });
  });

  // ==========================================================================
  // Test 3: Duration Suitability Scoring Curve
  // ==========================================================================
  describe('3. Duration Suitability Scoring Curve', () => {
    test('Calculates peak suitability in sweet spot and smoothly penalizes extremes', () => {
      // For practical project (30–120 min target, min: 20, max: 240)
      const projectOptimal = calculateDurationSuitability(60, 'practical_project');
      const projectTooBrief = calculateDurationSuitability(8, 'practical_project');
      const projectAcceptable = calculateDurationSuitability(25, 'practical_project');
      const projectLong = calculateDurationSuitability(150, 'practical_project');

      assert.ok(projectOptimal >= 95, `Optimal project duration should score >= 95, got ${projectOptimal}`);
      assert.ok(projectTooBrief < 60, `8 min for a complete project should score < 60, got ${projectTooBrief}`);
      assert.ok(projectOptimal > projectTooBrief, '60 min project tutorial must score higher than 8 min teaser');
      assert.ok(projectAcceptable >= 75, `25 min project should be acceptable (>=75), got ${projectAcceptable}`);
      assert.ok(projectLong >= 80, `150 min comprehensive project should remain useful (>=80), got ${projectLong}`);

      // For narrow concept (5–15 min target)
      const quickOptimal = calculateDurationSuitability(10, 'concept_quick');
      const quickBloated = calculateDurationSuitability(180, 'concept_quick');
      assert.ok(quickOptimal >= 95, `10 min for quick concept should score >= 95, got ${quickOptimal}`);
      assert.ok(quickBloated < 60, `3-hour video for a 10-minute quick concept should be discounted, got ${quickBloated}`);
    });
  });

  // ==========================================================================
  // Test 4: Practical Learning Signals Extraction
  // ==========================================================================
  describe('4. Practical Learning Signals', () => {
    test('Extracts authentic signals for projects, coding walkthroughs, and step-by-step implementations', () => {
      const signals = extractPracticalLearningSignals(
        'Build a Full-Stack React App: Complete Implementation Step-by-Step with GitHub Repo',
        'In this hands-on tutorial, we build a real-world web application from scratch with exercises and live coding.'
      );

      assert.strictEqual(signals.hasProject, true, 'Should detect project signal');
      assert.strictEqual(signals.hasCodeWalkthrough, true, 'Should detect code walkthrough');
      assert.strictEqual(signals.hasHandsOn, true, 'Should detect hands-on');
      assert.strictEqual(signals.hasStepByStep, true, 'Should detect step-by-step');
      assert.strictEqual(signals.hasExercises, true, 'Should detect exercises');
      assert.strictEqual(signals.hasRealWorld, true, 'Should detect real-world');
      assert.strictEqual(signals.hasCompleteImplementation, true, 'Should detect complete implementation');
      assert.ok(signals.signalScore >= 80, `Practical signal score should be >= 80, got ${signals.signalScore}`);
    });

    test('Gives neutral baseline to purely theoretical lecture without practical signals', () => {
      const theoreticalSignals = extractPracticalLearningSignals(
        'Theoretical Axioms and Historical Overview of Mathematical Logic',
        'Discussion of foundational proofs and historical philosophy.'
      );

      assert.strictEqual(theoreticalSignals.hasProject, false);
      assert.strictEqual(theoreticalSignals.hasCodeWalkthrough, false);
      assert.strictEqual(theoreticalSignals.signalScore <= 50, true);
    });
  });

  // ==========================================================================
  // Scenario A: Python String Methods (Short but relevant video accepted)
  // ==========================================================================
  describe('5. Scenario A: Python String Methods', () => {
    test('A concise, highly relevant 10-minute tutorial ranks above an unnecessarily long course', () => {
      const vConciseMethods = makeVideo({
        id: 'v_py_strings_10m',
        title: 'Python String Methods: split, join, strip, and format with Examples',
        description: 'Targeted tutorial demonstrating all key Python string methods with practical coding snippets.',
        durationMinutes: 10,
        score: { overall: 88, relevance: 96, educationalValue: 90, structureCompleteness: 85, freshness: 90 },
      });

      const vBloatedFullCourse = makeVideo({
        id: 'v_py_full_course_10h',
        title: 'Python Complete Course for Absolute Beginners - 10 Hours',
        description: 'Full course covering installation, variables, control flow, functions, OOP, and data science.',
        durationMinutes: 600,
        score: { overall: 80, relevance: 70, educationalValue: 85, structureCompleteness: 90, freshness: 85 },
      });

      const scored = qualityEngine.filterAndScoreBatch(
        [vBloatedFullCourse, vConciseMethods],
        'Python String Methods',
        'educational',
        50,
        { intent: 'concept_quick', objective: 'Learn Python string methods with practical examples' }
      );

      assert.strictEqual(scored[0].resource.id, 'v_py_strings_10m', 'Concise string methods tutorial must rank #1');
      assert.ok(
        scored[0].score.overall > scored[1].score.overall,
        'Concise relevant tutorial should score higher than bloated 10-hour course for a narrow topic'
      );
    });
  });

  // ==========================================================================
  // Scenario B: Build a Full-Stack Application (Hands-on project preferred over brief intro)
  // ==========================================================================
  describe('6. Scenario B: Build a Full-Stack Application', () => {
    test('Detailed, hands-on project tutorial (60 min) receives preference over brief intro (8 min)', () => {
      const vProjectDetailed = makeVideo({
        id: 'v_fullstack_project_60m',
        title: 'Build a Full-Stack App with React, Node.js and PostgreSQL - Complete Step-by-Step Project',
        description: 'Hands-on practical project tutorial building an authentic production-ready application with code walkthrough.',
        durationMinutes: 60,
        score: { overall: 92, relevance: 94, educationalValue: 92, structureCompleteness: 90, freshness: 90 },
      });

      const vBriefIntro = makeVideo({
        id: 'v_fullstack_intro_8m',
        title: 'What is Full-Stack Web Development? Full Stack Overview in 8 Minutes',
        description: 'Quick introductory summary explaining what frontend and backend mean.',
        durationMinutes: 8,
        score: { overall: 75, relevance: 80, educationalValue: 70, structureCompleteness: 60, freshness: 95 },
      });

      const scored = qualityEngine.filterAndScoreBatch(
        [vBriefIntro, vProjectDetailed],
        'Build a Full-Stack Web Application',
        'educational',
        50,
        { intent: 'practical_project', objective: 'Build a full-stack application step by step' }
      );

      assert.strictEqual(scored[0].resource.id, 'v_fullstack_project_60m', '60-min hands-on project tutorial must rank #1');
      assert.ok(
        scored[0].score.overall > scored[1].score.overall,
        'Hands-on project tutorial must comfortably beat superficial 8-min introductory talk'
      );
    });
  });

  // ==========================================================================
  // Scenario C: Machine Learning Practical Projects
  // ==========================================================================
  describe('7. Scenario C: Learn Machine Learning Through Practical Projects', () => {
    test('Relevant implementation-focused resource ranks above superficial overview', () => {
      const vPracticalMl = makeVideo({
        id: 'v_ml_project_45m',
        title: 'End-to-End Machine Learning Project: Train, Evaluate and Deploy Scikit-Learn Models',
        description: 'Complete hands-on implementation with feature engineering, model training, cross-validation, and metrics.',
        durationMinutes: 45,
        score: { overall: 90, relevance: 95, educationalValue: 92, structureCompleteness: 88, freshness: 90 },
      });

      const vSuperficialOverview = makeVideo({
        id: 'v_ml_overview_7m',
        title: 'Machine Learning Explained Simply in 7 Minutes',
        description: 'High-level conceptual overview explaining what artificial intelligence is.',
        durationMinutes: 7,
        score: { overall: 72, relevance: 78, educationalValue: 68, structureCompleteness: 55, freshness: 92 },
      });

      const ranked = rankingEngine.rank([vSuperficialOverview, vPracticalMl], 5);

      assert.strictEqual(ranked[0].resource.id, 'v_ml_project_45m', 'Implementation project must rank #1 over superficial overview');
      assert.ok(
        ranked[0].finalScore > ranked[1].finalScore,
        '45-minute practical implementation must have higher final score than 7-minute overview'
      );
    });
  });

  // ==========================================================================
  // Scenario D: Fallback Behavior (Broad subject where no long-form is available)
  // ==========================================================================
  describe('8. Scenario D: Fallback Behavior', () => {
    test('Returns useful shorter alternatives instead of failing or accepting irrelevant long videos', () => {
      const vShortRelevant = makeVideo({
        id: 'v_short_relevant',
        title: 'Quantum Teleportation Protocol Explained: Circuits & Entanglement',
        description: 'Targeted mathematical breakdown of the 3-qubit teleportation protocol and Bell state measurements.',
        durationMinutes: 18,
        score: { overall: 84, relevance: 92, educationalValue: 85, structureCompleteness: 80, freshness: 85 },
      });

      const vIrrelevantLong = makeVideo({
        id: 'v_irrelevant_long',
        title: 'Complete 3-Hour History of the Industrial Revolution and Steam Engines',
        description: 'Documentary covering factories, metallurgy, and steam engines in the 18th century.',
        durationMinutes: 180,
        score: { overall: 40, relevance: 15, educationalValue: 65, structureCompleteness: 80, freshness: 70 },
      });

      const scored = qualityEngine.filterAndScoreBatch(
        [vIrrelevantLong, vShortRelevant],
        'Quantum Teleportation Protocol',
        'educational',
        50
      );

      const acceptedIds = scored.map((s) => s.resource.id);
      assert.ok(acceptedIds.includes('v_short_relevant'), 'Useful 18-minute video must be accepted as fallback');
      assert.ok(!acceptedIds.includes('v_irrelevant_long'), '3-hour irrelevant video must be strictly rejected');
    });
  });

  // ==========================================================================
  // Scenario E: Long but Irrelevant Video Rejection
  // ==========================================================================
  describe('9. Scenario E: Long but Irrelevant Video Rejection', () => {
    test('A 90-minute video with misleading keywords and poor relevance does NOT outrank a relevant 20-min tutorial', () => {
      const vRelevant20m = makeVideo({
        id: 'v_rel_20m',
        title: 'Building REST APIs with Express and TypeScript - Practical Walkthrough',
        description: 'Step-by-step coding demonstration setting up routes, controllers, and validation in Express.',
        durationMinutes: 22,
        score: { overall: 88, relevance: 94, educationalValue: 88, structureCompleteness: 85, freshness: 90 },
      });

      const vMisleadingLong = makeVideo({
        id: 'v_misleading_90m',
        title: 'Everything You Need to Know About Computers, Software, and Digital Technology - 90 Min',
        description: 'A very general talk discussing computer history, monitors, keyboards, and mentioning the word Express once.',
        durationMinutes: 90,
        score: { overall: 52, relevance: 25, educationalValue: 55, structureCompleteness: 70, freshness: 75 },
      });

      const ranked = rankingEngine.rank([vMisleadingLong, vRelevant20m], 5);

      assert.strictEqual(
        ranked[0].resource.id,
        'v_rel_20m',
        'Relevant 22-min tutorial must outrank 90-min loosely related video'
      );
      assert.ok(
        ranked[0].finalScore > ranked[1].finalScore + 15,
        'Relevance penalty must keep misleading long video far below authentic tutorial'
      );
    });
  });

  // ==========================================================================
  // Scenario F: Missing or Malformed Duration Metadata
  // ==========================================================================
  describe('10. Scenario F: Missing or Malformed Duration Metadata', () => {
    test('Handles missing, zero, and malformed duration safely without crashing', () => {
      const vMissingDuration = makeVideo({
        id: 'v_missing_dur',
        title: 'Calculus: Derivatives and Tangent Lines',
        durationMinutes: 0,
        score: { overall: 82, relevance: 88, educationalValue: 82, structureCompleteness: 78, freshness: 85 },
      });

      const vMalformedIso = makeVideo({
        id: 'v_malformed_iso',
        title: 'Calculus: Chain Rule Derivations',
        durationMinutes: parseIsoDurationToMinutes('CORRUPT_TIMESTAMP_DATA'),
        score: { overall: 85, relevance: 90, educationalValue: 85, structureCompleteness: 80, freshness: 85 },
      });

      assert.doesNotThrow(() => {
        qualityEngine.evaluateResource(vMissingDuration, 'Calculus Derivatives');
      }, 'Evaluating resource with zero duration must not throw');

      assert.doesNotThrow(() => {
        qualityEngine.evaluateResource(vMalformedIso, 'Calculus Chain Rule');
      }, 'Evaluating resource with malformed duration must not throw');

      assert.strictEqual(vMalformedIso.durationMinutes, 20, 'Malformed ISO duration must fallback to 20 minutes');
    });
  });

  // ==========================================================================
  // Test 11: Module Search Query Planning with Practical Modifiers
  // ==========================================================================
  describe('11. Module Search Query Planning with Practical Modifiers', () => {
    test('Generates practical and project queries when module objective calls for building', () => {
      const queries = searchPlanner.createModuleVideoPlan({
        moduleTitle: 'Module 3: Full-Stack Project Implementation',
        moduleObjective: 'Build a practical Python web application step by step with complete database integration',
        courseTopic: 'Python Programming',
        difficulty: 'Intermediate',
        lessons: [
          {
            title: 'Build Python Web App',
            type: 'video',
            keyConcepts: ['Flask', 'SQLAlchemy', 'Routing'],
          },
        ],
      });

      const combined = queries.join(' ').toLowerCase();
      assert.ok(
        combined.includes('practical') || combined.includes('project') || combined.includes('step by step'),
        'Queries for project module must contain practical or project search patterns'
      );
      assert.ok(queries.length >= 2, 'Should generate multiple high-yield queries');
    });
  });

  // ==========================================================================
  // Test 12: Balanced Resource Mix Across Module Lessons
  // ==========================================================================
  describe('12. Balanced Resource Mix Across Module Lessons', () => {
    test('Module with theory and project lessons receives complementary resources', () => {
      const curriculum = {
        title: 'Web Application Development',
        domain: 'Computer Science',
        level: 'Intermediate',
        durationHours: 10,
        moduleCount: 1,
        modules: [
          {
            moduleNumber: 1,
            title: 'Express REST APIs',
            objective: 'Understand REST principles and build a practical API project',
            estimatedHours: 5,
            lessons: [
              {
                title: 'REST Architecture & HTTP Foundations',
                type: 'video' as const,
                estimatedMinutes: 20,
                keyConcepts: ['REST', 'HTTP', 'Middleware'],
              },
              {
                title: 'Build Express API Project Hands-On',
                type: 'video' as const,
                estimatedMinutes: 45,
                keyConcepts: ['Express', 'Routes', 'Project Implementation'],
              },
            ],
          },
        ],
      };

      const vTheory = makeVideo({
        id: 'v_rest_theory',
        title: 'REST API Architecture and HTTP Methods Explained',
        description: 'Detailed explanation of REST constraints, statelessness, and headers.',
        durationMinutes: 20,
        score: { overall: 88, relevance: 92, educationalValue: 88, structureCompleteness: 85, freshness: 85 },
      });

      const vProject = makeVideo({
        id: 'v_rest_project',
        title: 'Build a Complete REST API Project in Express - Hands-On Code Walkthrough',
        description: 'Step-by-step project implementation building a production-ready API.',
        durationMinutes: 50,
        score: { overall: 90, relevance: 94, educationalValue: 90, structureCompleteness: 90, freshness: 88 },
      });

      const distributed = distributeResourcesToCourse(curriculum, [vTheory, vProject]);
      const lessons = distributed.modules[0].lessons;

      assert.strictEqual(lessons.length, 2);
      // Both lessons should receive distinct, complementary videos matching their specific lesson roles
      assert.notStrictEqual(
        lessons[0].sourceUrl,
        lessons[1].sourceUrl,
        'Different lessons within the module must receive complementary distinct videos'
      );
    });
  });

  // ==========================================================================
  // Test 13: Preservation of Module Granularity & Curriculum Stability
  // ==========================================================================
  describe('13. Preservation of Module Granularity & Architecture Stability', () => {
    test('Curriculum engine preserves accurate cohesive module ranges', () => {
      const narrowCurriculum = createTopicAdaptiveCurriculum('Python Decorators', 'Intermediate', 5);
      const narrowCount = narrowCurriculum.moduleCount || 0;
      assert.ok(
        narrowCount >= 2 && narrowCount <= 3,
        `Narrow concept must generate 2-3 modules, got ${narrowCount}`
      );

      const foundationalCurriculum = createTopicAdaptiveCurriculum('Python Programming', 'Beginner', 10);
      assert.strictEqual(foundationalCurriculum.moduleCount, 4, 'Foundational programming must generate 4 modules');

      const broadCurriculum = createTopicAdaptiveCurriculum('Machine Learning & LLM Study', 'Advanced', 25);
      const broadCount = broadCurriculum.moduleCount || 0;
      assert.ok(
        broadCount >= 5 && broadCount <= 6,
        `Broad frontier topic must generate 5-6 modules, got ${broadCount}`
      );
    });
  });
});
