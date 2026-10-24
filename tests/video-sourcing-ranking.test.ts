import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  QualityScoringEngine,
  LegacySearchPlanner as SearchPlanner,
  YouTubeProvider,
  LegacyRankingEngine as RankingEngine,
  calculateFreshnessScore,
  canonicalizeUrl,
  extractYouTubeVideoId,
  type EngineResource,
  distributeResourcesToCourse,
} from '../src/lib/resource-engine-v2';

describe('Video Sourcing & Quality Ranking System', () => {
  const qualityEngine = new QualityScoringEngine();
  const searchPlanner = new SearchPlanner();
  const rankingEngine = new RankingEngine();

  function makeVideo(overrides: Partial<EngineResource>): EngineResource {
    const rawId = overrides.id || `yt_${Math.random().toString(36).substring(2, 11)}`;
    const cleanId = rawId.replace(/^yt_/, '').padEnd(11, '0').slice(0, 11);
    const pubDate = overrides.publishedAt || (typeof overrides.metadata?.publishedAt === 'string' ? overrides.metadata.publishedAt : undefined) || '2025-06-15T12:00:00Z';
    const freshness = calculateFreshnessScore(pubDate);

    return {
      id: rawId,
      title: overrides.title || 'Modern Neural Network Architectures',
      description: overrides.description || 'Detailed technical breakdown with mathematical derivations and PyTorch code.',
      type: 'video_lecture',
      canonicalUrl: overrides.canonicalUrl || `https://www.youtube.com/watch?v=${cleanId}`,
      sourceUrl: overrides.sourceUrl || `https://www.youtube.com/watch?v=${cleanId}`,
      sourceName: overrides.sourceName || 'Stanford Online',
      provider: 'youtube',
      authorOrChannel: overrides.authorOrChannel || 'Stanford Online',
      durationMinutes: overrides.durationMinutes || 35,
      difficulty: overrides.difficulty || 'intermediate',
      language: 'en',
      score: overrides.score || {
        overall: 88,
        relevance: 90,
        educationalValue: 88,
        structureCompleteness: 85,
        freshness,
      },
      tags: overrides.tags || ['machine learning', 'neural networks'],
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

  // --------------------------------------------------------------------------
  // Requirement 1: Topic Accuracy (Emerging & Classical Disciplines)
  // --------------------------------------------------------------------------
  test('1. Topic Accuracy: Matches specific module topic and learning objectives while rejecting off-topic candidates', () => {
    // Emerging AI topic: Diffusion Models
    const vDiffusionExact = makeVideo({
      id: 'v_diff_exact',
      title: 'Diffusion Models: DDPM and Denoising Score Matching Explained',
      description: 'Mathematical derivation of forward Gaussian diffusion and reverse denoising U-Net.',
      tags: ['diffusion', 'ddpm', 'denoising'],
    });

    const vDiffusionLooselyRelated = makeVideo({
      id: 'v_diff_loose',
      title: 'Introduction to Artificial Intelligence and Modern Computers',
      description: 'Overview of computer hardware and general software terminology.',
      tags: ['ai', 'computers', 'hardware'],
    });

    const vCooking = makeVideo({
      id: 'v_cook',
      title: 'How to Bake Sourdough Bread from Scratch',
      description: 'Flour, water, yeast, and fermentation tutorial.',
      tags: ['cooking', 'baking'],
    });

    const scored = qualityEngine.filterAndScoreBatch(
      [vDiffusionExact, vDiffusionLooselyRelated, vCooking],
      'Diffusion Models & Latent Denoising Mechanics',
      'educational',
      50
    );

    const acceptedIds = scored.map((s) => s.resource.id);
    assert.ok(acceptedIds.includes('v_diff_exact'), 'Exact Diffusion Models video must be accepted');
    assert.ok(!acceptedIds.includes('v_diff_loose'), 'Generic loose AI overview must be rejected');
    assert.ok(!acceptedIds.includes('v_cook'), 'Unrelated cooking video must be strictly rejected');

    const exactScore = scored.find((s) => s.resource.id === 'v_diff_exact')!;
    assert.ok(exactScore.score.topicRelevance >= 85, `Topic relevance must be high (>=85), got ${exactScore.score.topicRelevance}`);
  });

  test('2. Topic Accuracy: Emerging topic (PEFT / LoRA / QLoRA) is accurately scored with domain subtopic recognition', () => {
    const vLoRA = makeVideo({
      id: 'v_lora',
      title: 'Parameter-Efficient Fine-Tuning: LoRA and QLoRA in PyTorch',
      description: 'Understanding low-rank matrix decomposition, rank parameter r, and 4-bit NormalFloat quantization.',
      tags: ['LoRA', 'PEFT', 'QLoRA'],
    });

    const evaluated = qualityEngine.evaluateResource(
      vLoRA,
      'Parameter-Efficient Fine-Tuning (PEFT, LoRA & QLoRA)',
      'educational'
    );

    assert.ok(evaluated.topicRelevance >= 85, `LoRA video must score high relevance (>=85), got ${evaluated.topicRelevance}`);
    assert.ok(evaluated.overall >= 80, `Overall score must be >= 80, got ${evaluated.overall}`);
  });

  // --------------------------------------------------------------------------
  // Requirement 2 & 5: Latest Videos & Quality Ranking
  // --------------------------------------------------------------------------
  test('3. Quality Ranking: Prioritizes recent high-quality video over older video when both accurately cover the topic', () => {
    // Both videos have strong topic relevance and high educational value
    const vRecent = makeVideo({
      id: 'v_recent_2025',
      title: 'Modern Deep Learning & Transformer Attention Walkthrough',
      description: 'Comprehensive 2025 lecture on self-attention mechanics, RoPE embeddings, and KV-cache optimization.',
      authorOrChannel: 'Stanford Online',
      publishedAt: '2025-08-10T00:00:00Z',
      score: { overall: 90, relevance: 92, educationalValue: 90, structureCompleteness: 88, freshness: 95 },
      metadata: { publishedAt: '2025-08-10T00:00:00Z' },
    });

    const vOlder = makeVideo({
      id: 'v_older_2015',
      title: 'Deep Learning & Transformer Foundations Seminar',
      description: 'Comprehensive historical seminar on early attention architectures.',
      authorOrChannel: 'Stanford Online',
      publishedAt: '2015-05-12T00:00:00Z',
      score: { overall: 88, relevance: 92, educationalValue: 90, structureCompleteness: 88, freshness: 58 },
      metadata: { publishedAt: '2015-05-12T00:00:00Z' },
    });

    const ranked = rankingEngine.rank([vOlder, vRecent], 5);

    assert.strictEqual(ranked.length, 2);
    assert.strictEqual(
      ranked[0].resource.id,
      'v_recent_2025',
      'Recent 2025 video must be ranked #1 ahead of 2015 older video when both cover the topic'
    );
    assert.strictEqual(ranked[1].resource.id, 'v_older_2015');
  });

  test('4. Accuracy Over Recency: Does NOT prioritize a recent video if it is inaccurate or less relevant', () => {
    // Older video is an exact match from an authoritative university
    const vOlderAuthoritative = makeVideo({
      id: 'v_older_exact',
      title: 'Rigorous Derivation of Angular Momentum and Gyroscopic Precession',
      description: 'Complete physics derivations of torque, inertia tensors, and precession rates.',
      authorOrChannel: 'MIT OpenCourseWare',
      publishedAt: '2014-04-10T00:00:00Z',
      score: { overall: 88, relevance: 95, educationalValue: 92, structureCompleteness: 90, freshness: 58 },
      metadata: { publishedAt: '2014-04-10T00:00:00Z' },
    });

    // Recent video is only loosely related with lower relevance
    const vRecentLooselyRelated = makeVideo({
      id: 'v_recent_loose',
      title: 'General Science and Everyday Physical Objects',
      description: 'Casual talk published yesterday mentioning spinning tops and bikes.',
      authorOrChannel: 'Casual Science Vlogs',
      publishedAt: '2026-10-01T00:00:00Z',
      score: { overall: 65, relevance: 48, educationalValue: 50, structureCompleteness: 50, freshness: 98 },
      metadata: { publishedAt: '2026-10-01T00:00:00Z' },
    });

    const ranked = rankingEngine.rank([vRecentLooselyRelated, vOlderAuthoritative], 5);

    assert.strictEqual(
      ranked[0].resource.id,
      'v_older_exact',
      'Accurate older video must beat loosely related recent video (Accuracy over recency)'
    );
  });

  // --------------------------------------------------------------------------
  // Requirement 3: Smart Search Queries
  // --------------------------------------------------------------------------
  test('5. Smart Search: Generates specific queries using module topic, key concepts, and learning objectives', () => {
    const queries = searchPlanner.createModuleVideoPlan({
      moduleTitle: 'Module 3: Parameter-Efficient Fine-Tuning (PEFT, LoRA & QLoRA)',
      moduleObjective: 'Master low-rank adaptation decomposition, alpha scaling factor, and memory-efficient fine-tuning with 4-bit NormalFloat quantization',
      courseTopic: 'Fine Tuning of AI Models',
      difficulty: 'Advanced',
      lessons: [
        {
          title: 'LoRA Matrix Decomposition & Rank Scaling',
          type: 'video',
          keyConcepts: ['LoRA', 'low-rank matrices', 'rank parameter r', 'alpha scaling'],
        },
      ],
    });

    assert.ok(queries.length >= 2, 'Must generate multiple targeted queries');
    // Must contain specific technical concepts rather than just course title alone
    const combined = queries.join(' ').toLowerCase();
    assert.ok(
      combined.includes('lora') || combined.includes('peft') || combined.includes('decomposition'),
      'Queries must include module specific concepts (LoRA/PEFT/decomposition)'
    );
    assert.ok(
      !queries.some((q) => q === 'Fine Tuning of AI Models lecture'),
      'Must NOT search solely by overall course title alone'
    );
  });

  // --------------------------------------------------------------------------
  // Requirement 4: Verified Sources & Metadata Integrity
  // --------------------------------------------------------------------------
  test('6. Verified Sources: Validates canonical YouTube URLs, 11-char IDs, and valid publication dates', () => {
    const validVideo = makeVideo({
      id: 'yt_abc12345678',
      canonicalUrl: 'https://www.youtube.com/watch?v=abc12345678',
      publishedAt: '2024-03-15T10:00:00Z',
      metadata: { isEmbeddable: true, definition: 'hd', hasCaptions: true },
    });

    assert.strictEqual(extractYouTubeVideoId(validVideo.canonicalUrl), 'abc12345678');
    assert.strictEqual(validVideo.canonicalUrl, 'https://www.youtube.com/watch?v=abc12345678');
    assert.ok(!validVideo.canonicalUrl.includes('results?search_query='), 'Must never use search URL');
    assert.ok(!isNaN(new Date(validVideo.publishedAt!).getTime()), 'Must have valid date timestamp');
  });

  test('7. Verified Sources: Missing publication date receives neutral baseline and uncertainty flag without beating fresh videos', () => {
    const vWithoutDate = makeVideo({
      id: 'v_no_date',
      title: 'Calculus 1: Limits and Continuity',
      publishedAt: undefined,
      metadata: { publishedAt: undefined },
    });

    const evaluated = qualityEngine.evaluateResource(vWithoutDate, 'Calculus Limits', 'educational');
    assert.ok(evaluated.recency <= 55, `Missing date must receive conservative score (<=55), got ${evaluated.recency}`);

    const vFresh = makeVideo({
      id: 'v_fresh_date',
      title: 'Calculus 1: Limits and Continuity',
      publishedAt: '2025-09-01T00:00:00Z',
      metadata: { publishedAt: '2025-09-01T00:00:00Z' },
    });

    const evaluatedFresh = qualityEngine.evaluateResource(vFresh, 'Calculus Limits', 'educational');
    assert.ok(evaluatedFresh.recency >= 90, `Fresh 2025 date must receive high recency (>=90), got ${evaluatedFresh.recency}`);
    assert.ok(evaluatedFresh.recency > evaluated.recency, 'Verified recent video must outscore video with missing date');
  });

  // --------------------------------------------------------------------------
  // Requirement 6: Fallback Behavior
  // --------------------------------------------------------------------------
  test('8. Fallback: Recommends best relevant older video when no recent video exists', () => {
    // Only an older video exists for an archetype derivation
    const vOlderAuthoritative = makeVideo({
      id: 'v_mit_classic',
      title: 'MIT 8.01 Classical Mechanics: Rotational Kinematics & Angular Acceleration',
      description: 'Foundational lecture by Prof Walter Lewin explaining rotational vectors.',
      authorOrChannel: 'MIT OpenCourseWare',
      publishedAt: '2011-09-15T00:00:00Z',
      score: { overall: 85, relevance: 95, educationalValue: 92, structureCompleteness: 90, freshness: 58 },
    });

    const curriculum = {
      title: 'Physics: Rotational Dynamics',
      domain: 'Physics',
      level: 'Class 11',
      durationHours: 10,
      moduleCount: 1,
      modules: [
        {
          moduleNumber: 1,
          title: 'Rotational Kinematics',
          objective: 'Master angular velocity, acceleration, and rotational vectors',
          estimatedHours: 5,
          lessons: [
            {
              title: 'Angular Velocity and Acceleration',
              type: 'video' as const,
              estimatedMinutes: 45,
              keyConcepts: ['Angular Velocity', 'Rotational Kinematics'],
            },
          ],
        },
      ],
    };

    const distributed = distributeResourcesToCourse(curriculum, [vOlderAuthoritative]);
    const assignedLesson = distributed.modules[0].lessons[0];

    assert.ok(assignedLesson.sourceUrl, 'Fallback older video must be assigned successfully');
    assert.strictEqual(assignedLesson.sourceUrl, vOlderAuthoritative.canonicalUrl);
    assert.strictEqual(assignedLesson.sourceName, 'MIT OpenCourseWare');
  });

  test('9. Honest Empty State: Maintains empty state when no verified video meets relevance threshold', () => {
    // Only completely unrelated videos provided
    const vIrrelevant = makeVideo({
      id: 'v_unrelated_baking',
      title: 'Best Chocolate Cake Recipe in 10 Minutes',
      description: 'Baking and frosting tutorial.',
      tags: ['cooking'],
      score: { overall: 30, relevance: 15, educationalValue: 20, structureCompleteness: 20, freshness: 80 },
    });

    const curriculum = {
      title: 'Quantum Field Theory',
      domain: 'Physics',
      level: 'Graduate',
      durationHours: 10,
      moduleCount: 1,
      modules: [
        {
          moduleNumber: 1,
          title: 'Path Integrals in Quantum Field Theory',
          objective: 'Master functional integrals and action quantization',
          estimatedHours: 5,
          lessons: [
            {
              title: 'Functional Quantization of Scalar Fields',
              type: 'video' as const,
              estimatedMinutes: 50,
              keyConcepts: ['Path Integrals', 'Scalar Fields'],
            },
          ],
        },
      ],
    };

    const distributed = distributeResourcesToCourse(curriculum, [vIrrelevant]);
    const assignedLesson = distributed.modules[0].lessons[0];

    assert.strictEqual(assignedLesson.sourceUrl, undefined, 'Must not assign irrelevant video to lesson');
    assert.ok(assignedLesson.selectionReason?.includes('threshold'), 'Selection reason must report threshold failure');
  });

  // --------------------------------------------------------------------------
  // Requirement 7: Module Distribution Integrity
  // --------------------------------------------------------------------------
  test('10. Module Distribution: Dispatches videos to appropriate module lessons without cross-module leakage', () => {
    const vModule1 = makeVideo({
      id: 'v_mod1',
      title: 'Python Primitives, Variables and Types',
      description: 'Understanding integers, floats, strings, and booleans in Python.',
      score: { overall: 88, relevance: 92, educationalValue: 88, structureCompleteness: 85, freshness: 92 },
      metadata: { moduleNumber: 1, moduleId: 'mod-1' },
    });

    const vModule2 = makeVideo({
      id: 'v_mod2',
      title: 'Python Control Flow: Loops, Conditionals and Iteration',
      description: 'Mastering if-else statements, for loops, and while loops in Python.',
      score: { overall: 88, relevance: 92, educationalValue: 88, structureCompleteness: 85, freshness: 92 },
      metadata: { moduleNumber: 2, moduleId: 'mod-2' },
    });

    const curriculum = {
      title: 'Python Programming Course',
      domain: 'Computer Science',
      level: 'Beginner',
      durationHours: 10,
      moduleCount: 2,
      modules: [
        {
          id: 'mod-1',
          moduleNumber: 1,
          title: 'Python Primitives & Syntax',
          objective: 'Learn data types and variables',
          estimatedHours: 5,
          lessons: [
            {
              title: 'Variables and Basic Data Types',
              type: 'video' as const,
              estimatedMinutes: 20,
              keyConcepts: ['Variables', 'Types', 'Strings'],
            },
          ],
        },
        {
          id: 'mod-2',
          moduleNumber: 2,
          title: 'Control Flow & Logic',
          objective: 'Master branching and loops',
          estimatedHours: 5,
          lessons: [
            {
              title: 'If-Else Statements & Loops',
              type: 'video' as const,
              estimatedMinutes: 25,
              keyConcepts: ['Loops', 'If-Else', 'Conditionals'],
            },
          ],
        },
      ],
    };

    const distributed = distributeResourcesToCourse(curriculum, [vModule2, vModule1]); // provide in reverse order

    const lesson1 = distributed.modules[0].lessons[0];
    const lesson2 = distributed.modules[1].lessons[0];

    assert.strictEqual(lesson1.sourceUrl, vModule1.canonicalUrl, 'Module 1 must receive primitives video');
    assert.strictEqual(lesson2.sourceUrl, vModule2.canonicalUrl, 'Module 2 must receive control flow video');
  });
});
