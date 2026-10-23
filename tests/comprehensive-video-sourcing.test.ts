import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeTopicComplexity,
  createTopicAdaptiveCurriculum,
} from '@/services/ai/curriculum-adaptive-engine';
import { distributeResourcesToCourse } from '../.backup_engine_v1/core/module-distributor';
import { DeduplicationEngine } from '../.backup_engine_v1/core/deduplication-engine';
import { QualityScoringEngine } from '../.backup_engine_v1/core/quality-scoring';
import { EngineResource } from '../.backup_engine_v1/types';
import { calculateFreshnessScore } from '../.backup_engine_v1/utils/scoring-utils';

describe('Comprehensive Course Generation & Video Sourcing Pipeline', () => {
  const deduplicationEngine = new DeduplicationEngine();
  const qualityEngine = new QualityScoringEngine();

  function makeVideo(overrides: Partial<EngineResource>): EngineResource {
    const rawId = overrides.id || `yt_${Math.random().toString(36).substring(2, 11)}`;
    const cleanId = rawId.replace(/^yt_/, '').padEnd(11, '0').slice(0, 11);
    const pubDate = overrides.publishedAt || (typeof overrides.metadata?.publishedAt === 'string' ? overrides.metadata.publishedAt : undefined) || '2025-06-15T12:00:00Z';
    const freshness = calculateFreshnessScore(pubDate);

    return {
      id: rawId,
      title: overrides.title || 'Technical Lecture Tutorial',
      description: overrides.description || 'In-depth lecture and practical code implementation.',
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
        freshness,
      },
      tags: overrides.tags || ['python', 'programming'],
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
  // Problem 1: Intelligent Video Selection & Primary Resource Strategy
  // ==========================================================================
  describe('1. Intelligent Video Selection', () => {
    test('Prioritizes one comprehensive full-length course tutorial for broad topic (Python Programming) across modules', () => {
      const curriculum = createTopicAdaptiveCurriculum('Python Programming', 'Beginner', 10);
      assert.strictEqual(curriculum.moduleCount, 4, 'Python curriculum must contain 4 cohesive modules');

      const fullCourseTutorial = makeVideo({
        id: 'yt_py_fullcourse',
        title: 'Python Programming Full Course - 12 Hour Masterclass for Beginners',
        description: 'Complete Python course covering variables, primitives, control flow, loops, data structures, functions, and exceptions with chapters.',
        type: 'full_course',
        durationMinutes: 720,
        score: { overall: 96, relevance: 98, educationalValue: 95, structureCompleteness: 95, freshness: 92 },
        metadata: { isFullCourse: true },
      });

      const fragmentedVideo1 = makeVideo({
        id: 'yt_py_frag1',
        title: 'Python Variables & Types in 10 Minutes',
        description: 'Brief overview of python primitives.',
        durationMinutes: 10,
        score: { overall: 75, relevance: 80, educationalValue: 70, structureCompleteness: 65, freshness: 85 },
      });

      const fragmentedVideo2 = makeVideo({
        id: 'yt_py_frag2',
        title: 'Python Loops and Conditionals Tutorial',
        description: 'While loops and if statements in python.',
        durationMinutes: 15,
        score: { overall: 78, relevance: 82, educationalValue: 72, structureCompleteness: 70, freshness: 85 },
      });

      const distributed = distributeResourcesToCourse(curriculum, [
        fragmentedVideo1,
        fullCourseTutorial,
        fragmentedVideo2,
      ]);

      // Every module should be anchored to the comprehensive full course tutorial
      for (let i = 0; i < distributed.modules.length; i++) {
        const videoLesson = distributed.modules[i].lessons.find((l) => l.type === 'video');
        assert.ok(videoLesson, `Module ${i + 1} must contain a video lesson`);
        assert.strictEqual(
          videoLesson?.sourceUrl,
          fullCourseTutorial.canonicalUrl,
          `Module ${i + 1} must select the single comprehensive full course tutorial instead of fragmented clips`
        );
        assert.ok(
          videoLesson?.selectionReason?.includes('Comprehensive full-course tutorial'),
          `Selection reason must reflect comprehensive course selection: ${videoLesson?.selectionReason}`
        );
      }
    });

    test('Recommends one complete relevant playlist when single comprehensive tutorial is unavailable', () => {
      const curriculum = createTopicAdaptiveCurriculum('Python Programming', 'Beginner', 10);

      const completePlaylist = makeVideo({
        id: 'yt_py_playlist',
        title: 'Python 3 Complete Course Playlist - Zero to Hero',
        description: 'Structured series: Module 1 syntax, Module 2 control flow, Module 3 collections, Module 4 functions & OOP.',
        type: 'youtube_playlist',
        durationMinutes: 300,
        canonicalUrl: 'https://www.youtube.com/playlist?list=PL_PYTHON_COMPLETE_01',
        score: { overall: 94, relevance: 96, educationalValue: 92, structureCompleteness: 92, freshness: 90 },
        metadata: { isPlaylist: true, playlistId: 'PL_PYTHON_COMPLETE_01' },
      });

      const randomVideo = makeVideo({
        id: 'yt_py_random',
        title: 'Learn Python in 15 Minutes',
        durationMinutes: 15,
        score: { overall: 70, relevance: 75, educationalValue: 65, structureCompleteness: 60, freshness: 80 },
      });

      const distributed = distributeResourcesToCourse(curriculum, [randomVideo, completePlaylist]);

      for (let i = 0; i < distributed.modules.length; i++) {
        const videoLesson = distributed.modules[i].lessons.find((l) => l.type === 'video');
        assert.ok(videoLesson);
        assert.strictEqual(
          videoLesson?.sourceUrl,
          completePlaylist.canonicalUrl,
          `Module ${i + 1} must recommend the complete course playlist`
        );
        assert.ok(
          videoLesson?.selectionReason?.includes('Complete course playlist'),
          `Selection reason must reflect complete playlist selection: ${videoLesson?.selectionReason}`
        );
      }
    });

    test('Uses targeted supplementary individual video ONLY when primary tutorial misses specific concepts', () => {
      const curriculum = createTopicAdaptiveCurriculum('Python Programming', 'Beginner', 10);

      // Primary tutorial only covers modules 1, 2, and 3 (Syntax, Control Flow, Collections)
      // but explicitly misses File I/O & Exception Handling (Module 4)
      const partialTutorial = makeVideo({
        id: 'yt_py_partial',
        title: 'Python Programming Essentials: Syntax, Control Flow, and Built-in Collections',
        description: 'Covers primitives, loops, if-else, lists, dictionaries, tuples, and sets.',
        type: 'full_course',
        durationMinutes: 180,
        score: { overall: 90, relevance: 92, educationalValue: 90, structureCompleteness: 88, freshness: 90 },
        metadata: { isFullCourse: true },
      });

      // Supplementary video specifically covering File I/O and Exception Handling
      const targetedSupplementaryVideo = makeVideo({
        id: 'yt_py_files_exceptions',
        title: 'Python File I/O, Context Managers and Exception Handling Architecture',
        description: 'Comprehensive guide to reading files, writing files, with statement, and robust try-except error handling.',
        type: 'video_lecture',
        durationMinutes: 45,
        score: { overall: 92, relevance: 95, educationalValue: 92, structureCompleteness: 90, freshness: 95 },
      });

      const distributed = distributeResourcesToCourse(curriculum, [
        partialTutorial,
        targetedSupplementaryVideo,
      ]);

      // Modules 1..3 should receive the partial primary tutorial
      for (let i = 0; i < 3; i++) {
        const vLesson = distributed.modules[i].lessons.find((l) => l.type === 'video');
        assert.strictEqual(vLesson?.sourceUrl, partialTutorial.canonicalUrl, `Module ${i + 1} should receive primary tutorial`);
      }

      // Module 4 (missing from primary) must receive the targeted supplementary video
      const mod4Video = distributed.modules[3].lessons.find((l) => l.type === 'video');
      assert.strictEqual(
        mod4Video?.sourceUrl,
        targetedSupplementaryVideo.canonicalUrl,
        'Module 4 must receive the targeted supplementary video covering missing file I/O & exceptions concepts'
      );
      assert.ok(
        mod4Video?.selectionReason?.includes('Targeted supplementary lecture'),
        'Selection reason must indicate targeted supplementary status'
      );
    });
  });

  // ==========================================================================
  // Problem 2: Concept Coverage Verification
  // ==========================================================================
  describe('2. Concept Coverage Verification', () => {
    test('Verifies video concept alignment and rejects high-scoring video with generic keyword overlap only', () => {
      const curriculum = {
        title: 'Machine Learning Course',
        domain: 'Computer Science',
        level: 'Intermediate',
        durationHours: 12,
        moduleCount: 1,
        modules: [
          {
            moduleNumber: 1,
            title: 'Support Vector Machines & Kernel Methods',
            objective: 'Master maximum margin hyperplanes, Lagrangian duals, and Mercer kernels',
            estimatedHours: 6,
            lessons: [
              {
                title: 'Maximum Margin Hyperplanes & SVM Derivations',
                type: 'video' as const,
                estimatedMinutes: 45,
                keyConcepts: ['Support Vectors', 'Margin Optimization', 'Lagrangian Dual', 'Mercer Kernels'],
              },
            ],
          },
        ],
      };

      // Video mentions "Machine Learning" in title, but content is about baking or random web tech
      const genericMismatchVideo = makeVideo({
        id: 'yt_generic_ml',
        title: 'Machine Learning Everyday Tools and Web Browsing',
        description: 'Talking about using smart tools on computers without any math, algorithms or SVMs.',
        score: { overall: 85, relevance: 40, educationalValue: 50, structureCompleteness: 50, freshness: 95 },
      });

      const exactSVMVideo = makeVideo({
        id: 'yt_exact_svm',
        title: 'Support Vector Machines: Maximum Margin and Kernel Trick Derivation',
        description: 'Mathematical derivation of SVM optimization, support vectors, Lagrangian dual problem, and kernel methods.',
        score: { overall: 90, relevance: 96, educationalValue: 92, structureCompleteness: 90, freshness: 90 },
      });

      const distributed = distributeResourcesToCourse(curriculum, [genericMismatchVideo, exactSVMVideo]);
      const assigned = distributed.modules[0].lessons[0];

      assert.strictEqual(
        assigned.sourceUrl,
        exactSVMVideo.canonicalUrl,
        'Must select video covering exact syllabus concepts (SVM & Margins) over generic keyword match'
      );
    });
  });

  // ==========================================================================
  // Problem 3: Topic-Based Module Generation Without Over-Segmentation
  // ==========================================================================
  describe('3. Topic-Based Module Generation', () => {
    test('Narrowly focused topics generate 2-3 cohesive modules avoiding arbitrary over-segmentation', () => {
      const narrowTopics = [
        'Python Decorators',
        'Gradient Descent Optimization',
        'Binary Search Trees',
        'Docker Compose Workflows',
        'React Hooks in Depth',
      ];

      for (const topic of narrowTopics) {
        const analysis = analyzeTopicComplexity(topic, 'Intermediate', 6);
        assert.strictEqual(
          analysis.complexityTier,
          'narrow_focused',
          `Topic "${topic}" should be classified as narrow_focused`
        );
        assert.deepStrictEqual(
          analysis.recommendedModuleRange,
          [2, 3],
          `Topic "${topic}" must recommend 2-3 cohesive modules`
        );

        const curriculum = createTopicAdaptiveCurriculum(topic, 'Intermediate', 6);
        assert.ok(
          curriculum.moduleCount !== undefined && curriculum.moduleCount >= 2 && curriculum.moduleCount <= 3,
          `Generated curriculum for "${topic}" must have 2 or 3 modules, got ${curriculum.moduleCount}`
        );
      }
    });

    test('Foundational programming topics (Python Programming) generate 4 cohesive modules', () => {
      const analysis = analyzeTopicComplexity('Python Programming', 'Beginner', 10);
      assert.strictEqual(analysis.complexityTier, 'foundational_compact');
      assert.deepStrictEqual(analysis.recommendedModuleRange, [3, 4]);

      const curriculum = createTopicAdaptiveCurriculum('Python Programming', 'Beginner', 10);
      assert.strictEqual(curriculum.moduleCount, 4, 'Python Programming must generate 4 cohesive modules');
    });

    test('Comprehensive frontier topics (Machine Learning & LLM Study) generate 5 cohesive modules', () => {
      const mlCurriculum = createTopicAdaptiveCurriculum('Machine Learning', 'Undergraduate', 20);
      assert.strictEqual(mlCurriculum.moduleCount, 5, 'Machine Learning must generate 5 cohesive modules');

      const llmCurriculum = createTopicAdaptiveCurriculum('Large Language Models Study', 'Advanced', 25);
      assert.strictEqual(llmCurriculum.moduleCount, 5, 'LLM Study must generate 5 cohesive modules');
    });
  });

  // ==========================================================================
  // Problem 4: Duplicate Content Prevention
  // ==========================================================================
  describe('4. Duplicate Content Prevention', () => {
    test('Prunes duplicates by Video ID, Canonical URL, Playlist ID, and cross-channel title overlap', () => {
      const vOriginal = makeVideo({
        id: 'yt_abc12345678',
        canonicalUrl: 'https://www.youtube.com/watch?v=abc12345678',
        title: 'Deep Learning with PyTorch: Full Course Tutorial',
        authorOrChannel: 'FreeCodeCamp',
        score: { overall: 92, relevance: 95, educationalValue: 90, structureCompleteness: 90, freshness: 90 },
      });

      // 1. Same Video ID with different tracking URL
      const vSameId = makeVideo({
        id: 'yt_abc12345678',
        canonicalUrl: 'https://www.youtube.com/watch?v=abc12345678&feature=share&utm_source=twitter',
        title: 'Deep Learning with PyTorch: Full Course Tutorial',
        authorOrChannel: 'FreeCodeCamp',
        score: { overall: 85, relevance: 90, educationalValue: 85, structureCompleteness: 85, freshness: 90 },
      });

      // 2. Exact same playlist ID
      const playlist1 = makeVideo({
        id: 'yt_play_1',
        type: 'youtube_playlist',
        canonicalUrl: 'https://www.youtube.com/playlist?list=PL_PYTORCH_DEEP_LEARNING_01',
        title: 'PyTorch Deep Learning Playlist',
        score: { overall: 90, relevance: 92, educationalValue: 90, structureCompleteness: 88, freshness: 88 },
        metadata: { isPlaylist: true, playlistId: 'PL_PYTORCH_DEEP_LEARNING_01' },
      });

      const playlistDuplicate = makeVideo({
        id: 'yt_play_2',
        type: 'youtube_playlist',
        canonicalUrl: 'https://www.youtube.com/playlist?list=PL_PYTORCH_DEEP_LEARNING_01&si=tracking123',
        title: 'PyTorch Deep Learning Playlist - Complete Series',
        score: { overall: 80, relevance: 85, educationalValue: 80, structureCompleteness: 80, freshness: 85 },
        metadata: { isPlaylist: true, playlistId: 'PL_PYTORCH_DEEP_LEARNING_01' },
      });

      // 3. Different channel re-upload / identical full course
      const vReupload = makeVideo({
        id: 'yt_reupload_01',
        canonicalUrl: 'https://www.youtube.com/watch?v=reupload_010',
        title: 'Deep Learning with PyTorch: Full Course Masterclass',
        authorOrChannel: 'PyTorch Enthusiast Copy',
        score: { overall: 75, relevance: 88, educationalValue: 75, structureCompleteness: 75, freshness: 80 },
        metadata: { isFullCourse: true },
      });

      const unique = deduplicationEngine.deduplicate([
        vOriginal,
        vSameId,
        playlist1,
        playlistDuplicate,
        vReupload,
      ]);

      assert.strictEqual(unique.length, 2, 'Must prune all duplicates and leave only 1 unique video and 1 unique playlist');
      assert.strictEqual(unique[0].id, vOriginal.id, 'Must preserve higher scoring original video');
      assert.strictEqual(unique[1].metadata?.playlistId, 'PL_PYTORCH_DEEP_LEARNING_01');
    });
  });

  // ==========================================================================
  // Problem 5: Module-Resource Alignment
  // ==========================================================================
  describe('5. Module-Resource Alignment', () => {
    test('Ensures every module video matches its specific concepts without cross-module leakage', () => {
      const vSyntax = makeVideo({
        id: 'v_syntax',
        title: 'Python Syntax, Variables & Primitive Types',
        description: 'Integers, floats, strings, boolean values, type casting in Python.',
        score: { overall: 88, relevance: 92, educationalValue: 88, structureCompleteness: 85, freshness: 90 },
      });

      const vControlFlow = makeVideo({
        id: 'v_control_flow',
        title: 'Python Control Flow: Conditionals, Loops & Iteration Protocols',
        description: 'if-elif-else branching, while loops, for loops, break and continue.',
        score: { overall: 88, relevance: 92, educationalValue: 88, structureCompleteness: 85, freshness: 90 },
      });

      const curriculum = {
        title: 'Python Programming Course',
        domain: 'Computer Science',
        level: 'Beginner',
        durationHours: 6,
        moduleCount: 2,
        modules: [
          {
            moduleNumber: 1,
            title: 'Python Syntax & Primitives',
            objective: 'Understand primitive types and variables',
            estimatedHours: 3,
            lessons: [
              {
                title: 'Variables and Primitive Types',
                type: 'video' as const,
                estimatedMinutes: 25,
                keyConcepts: ['Variables', 'Primitive Types', 'Strings'],
              },
            ],
          },
          {
            moduleNumber: 2,
            title: 'Control Flow & Logic',
            objective: 'Master conditionals and loops',
            estimatedHours: 3,
            lessons: [
              {
                title: 'Branching and Iteration',
                type: 'video' as const,
                estimatedMinutes: 25,
                keyConcepts: ['Conditionals', 'Loops', 'Iteration'],
              },
            ],
          },
        ],
      };

      // Pass in reverse order to ensure selection is based on affinity, not array order
      const distributed = distributeResourcesToCourse(curriculum, [vControlFlow, vSyntax]);

      const mod1Video = distributed.modules[0].lessons[0];
      const mod2Video = distributed.modules[1].lessons[0];

      assert.strictEqual(mod1Video.sourceUrl, vSyntax.canonicalUrl, 'Module 1 must receive syntax video');
      assert.strictEqual(mod2Video.sourceUrl, vControlFlow.canonicalUrl, 'Module 2 must receive control flow video');
    });
  });

  // ==========================================================================
  // Problem 6: Smart Fallback (Smallest Complementary Combination)
  // ==========================================================================
  describe('6. Smart Fallback', () => {
    test('Selects the smallest complementary combination when no single resource covers the entire syllabus', () => {
      // 3-module curriculum
      const curriculum = {
        title: 'Machine Learning Deep Dive',
        domain: 'Computer Science',
        level: 'Intermediate',
        durationHours: 15,
        moduleCount: 3,
        modules: [
          {
            moduleNumber: 1,
            title: 'Linear Models & Gradient Descent',
            objective: 'Master linear regression and optimization',
            estimatedHours: 5,
            lessons: [
              {
                title: 'Gradient Descent & Cost Functions',
                type: 'video' as const,
                estimatedMinutes: 30,
                keyConcepts: ['Gradient Descent', 'Cost Functions', 'Linear Models'],
              },
            ],
          },
          {
            moduleNumber: 2,
            title: 'Decision Trees & Random Forests',
            objective: 'Master tree-based algorithms and bagging',
            estimatedHours: 5,
            lessons: [
              {
                title: 'Random Forest Ensembles',
                type: 'video' as const,
                estimatedMinutes: 35,
                keyConcepts: ['Decision Trees', 'Random Forests', 'Ensembles'],
              },
            ],
          },
          {
            moduleNumber: 3,
            title: 'Neural Networks & Backpropagation',
            objective: 'Master feedforward networks and autograd',
            estimatedHours: 5,
            lessons: [
              {
                title: 'Multi-Layer Perceptrons & Backprop',
                type: 'video' as const,
                estimatedMinutes: 40,
                keyConcepts: ['Neural Networks', 'Backpropagation', 'Activation Functions'],
              },
            ],
          },
        ],
      };

      // Candidate 1: 2-module series covering Linear Models (Mod 1) and Trees (Mod 2)
      const seriesTreesAndLinear = makeVideo({
        id: 'yt_series_part1_2',
        type: 'youtube_playlist',
        title: 'ML Series Part 1: Linear Models, Gradient Descent & Decision Trees',
        description: 'Detailed lessons covering gradient descent, linear cost functions, decision trees, and random forests.',
        durationMinutes: 120,
        score: { overall: 90, relevance: 92, educationalValue: 90, structureCompleteness: 88, freshness: 88 },
        metadata: { isPlaylist: true },
      });

      // Candidate 2: Individual video covering Neural Networks (Mod 3)
      const videoNN = makeVideo({
        id: 'yt_nn_backprop',
        title: 'Neural Networks & Backpropagation from Scratch',
        description: 'Complete mathematical walkthrough of multi-layer perceptrons, forward propagation, and backprop gradients.',
        durationMinutes: 45,
        score: { overall: 94, relevance: 96, educationalValue: 94, structureCompleteness: 92, freshness: 92 },
      });

      // Candidate 3: Redundant single video for Linear Models with lower score
      const redundantLinear = makeVideo({
        id: 'yt_redundant_linear',
        title: 'Intro to Linear Regression in 10 mins',
        durationMinutes: 10,
        score: { overall: 65, relevance: 70, educationalValue: 60, structureCompleteness: 60, freshness: 75 },
      });

      const distributed = distributeResourcesToCourse(curriculum, [
        redundantLinear,
        seriesTreesAndLinear,
        videoNN,
      ]);

      const mod1Video = distributed.modules[0].lessons[0];
      const mod2Video = distributed.modules[1].lessons[0];
      const mod3Video = distributed.modules[2].lessons[0];

      // Smallest complementary combination: series (covers mod 1 & 2) + NN video (covers mod 3)
      assert.strictEqual(mod1Video.sourceUrl, seriesTreesAndLinear.canonicalUrl, 'Module 1 covered by series');
      assert.strictEqual(mod2Video.sourceUrl, seriesTreesAndLinear.canonicalUrl, 'Module 2 covered by series');
      assert.strictEqual(mod3Video.sourceUrl, videoNN.canonicalUrl, 'Module 3 covered by NN video');
      assert.notStrictEqual(mod1Video.sourceUrl, redundantLinear.canonicalUrl, 'Redundant low-quality video must not be selected');
    });

    test('Gracefully maintains honest empty state when no external video meets the quality/relevance threshold', () => {
      const curriculum = {
        title: 'Advanced Quantum Electrodynamics',
        domain: 'Physics',
        level: 'Graduate',
        durationHours: 10,
        moduleCount: 1,
        modules: [
          {
            moduleNumber: 1,
            title: 'Renormalization Group Flows in QED',
            objective: 'Derive beta function and running coupling constants',
            estimatedHours: 5,
            lessons: [
              {
                title: 'Callan-Symanzik Equations & Renormalization',
                type: 'video' as const,
                estimatedMinutes: 50,
                keyConcepts: ['Callan-Symanzik', 'Renormalization Group', 'Beta Function'],
              },
            ],
          },
        ],
      };

      // Completely off-topic video
      const offTopicVideo = makeVideo({
        id: 'yt_offtopic_pasta',
        title: 'How to Make Authentic Italian Pasta Carbonara',
        description: 'Cooking recipe for homemade pasta with eggs, pecorino and guanciale.',
        score: { overall: 30, relevance: 10, educationalValue: 20, structureCompleteness: 20, freshness: 80 },
      });

      const distributed = distributeResourcesToCourse(curriculum, [offTopicVideo]);
      const assigned = distributed.modules[0].lessons[0];

      assert.strictEqual(assigned.sourceUrl, undefined, 'Must not assign off-topic video');
      assert.strictEqual(assigned.thumbnailUrl, undefined, 'Must not fabricate thumbnail');
      assert.ok(
        assigned.selectionReason?.includes('threshold'),
        'Selection reason must report honest threshold rejection'
      );
    });
  });
});
