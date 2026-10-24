import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  QualityScoringEngine,
  SequenceGenerator,
  ValidationEngine,
  DeduplicationEngine,
  canonicalizeUrl,
  extractCanonicalVideoKey,
  EngineResource,
} from '../src/lib/resource-engine-v2';

describe('Video Pipeline: Quality Scoring, Relevance, Deduplication & Sequencing', () => {
  const qualityEngine = new QualityScoringEngine();
  const sequenceGenerator = new SequenceGenerator();
  const validationEngine = new ValidationEngine();
  const deduplicationEngine = new DeduplicationEngine();

  // Test fixture factory for clean, controlled test videos
  function createTestVideo(overrides: Partial<EngineResource>): EngineResource {
    const rawId = overrides.id || `yt_${Math.random().toString(36).substring(2, 11)}`;
    const cleanId = rawId.replace(/^yt_/, '').padEnd(11, '0').slice(0, 11);
    return {
      id: rawId,
      title: overrides.title || 'Introduction to Rotational Kinematics',
      description:
        overrides.description ||
        '00:00 Intro 02:30 Angular Velocity 05:00 Solved Examples. Comprehensive lecture covering fundamentals.',
      type: overrides.type || 'video_lecture',
      canonicalUrl: overrides.canonicalUrl || `https://www.youtube.com/watch?v=${cleanId}`,
      sourceUrl: overrides.sourceUrl || `https://www.youtube.com/watch?v=${cleanId}`,
      sourceName: overrides.sourceName || 'MIT OpenCourseWare',
      provider: 'youtube',
      authorOrChannel: overrides.authorOrChannel || 'MIT OpenCourseWare',
      durationMinutes: overrides.durationMinutes || 25,
      difficulty: overrides.difficulty || 'intermediate',
      language: 'en',
      score: overrides.score || {
        overall: 85,
        relevance: 90,
        educationalValue: 88,
        structureCompleteness: 80,
        freshness: 80,
      },
      tags: overrides.tags || ['physics', 'rotational motion', 'kinematics'],
      metadata: overrides.metadata || {
        definition: 'hd',
        hasCaptions: true,
        isEmbeddable: true,
      },
      discoveredAt: new Date().toISOString(),
      ...overrides,
    };
  }

  // Verification 1: Videos appear in a logical learning sequence
  test('1. Videos appear in a logical learning sequence (Foundations -> Theory -> Demonstrations -> Advanced Synthesis)', async () => {
    const vDemo = createTestVideo({
      id: 'v_demo',
      title: 'Rotational Motion Experiment & Solved Problems',
      description: 'Hands-on lab demonstration and 5 solved archetype problems in angular momentum.',
    });
    const vAdvanced = createTestVideo({
      id: 'v_advanced',
      title: 'Advanced Non-Inertial Frames & Rigid Body Gyroscopes Derivations',
      description: 'Challenging Olympiad level synthesis of precessing gyroscopes and tensor mechanics.',
    });
    const vIntro = createTestVideo({
      id: 'v_intro',
      title: 'Introduction to Rotational Motion & Basic Definitions',
      description: 'What is angular velocity? Core intuition and fundamental axioms.',
    });
    const vCore = createTestVideo({
      id: 'v_core',
      title: 'Torque and Newton Second Law for Rotation Theory',
      description: 'Formal mathematical formulation of rotational dynamics and moment of inertia.',
    });

    // Provide shuffled candidates
    const scoredList = qualityEngine.filterAndScoreBatch(
      [vDemo, vAdvanced, vIntro, vCore],
      'Rotational Motion',
      'educational'
    );

    const playlist = await sequenceGenerator.generateSequence(
      'Rotational Motion',
      scoredList,
      { sequenceType: 'learning_path' }
    );

    assert.ok(playlist.items.length >= 3, 'Should sequence available candidates');
    assert.strictEqual(playlist.items[0].roleInSequence, 'foundation', 'First video must be Foundation');
    assert.strictEqual(playlist.items[0].resource.id, 'v_intro', 'Introductory video must be first in sequence');
    
    // Core theory before Demonstration
    const coreIndex = playlist.items.findIndex((it) => it.roleInSequence === 'core_concept');
    const demoIndex = playlist.items.findIndex((it) => it.roleInSequence === 'practical_demonstration');
    const advancedIndex = playlist.items.findIndex((it) => it.roleInSequence === 'advanced_synthesis' || it.roleInSequence === 'deep_dive');

    if (coreIndex !== -1 && demoIndex !== -1) {
      assert.ok(coreIndex < demoIndex, 'Core theory must precede practical demonstration');
    }
    if (demoIndex !== -1 && advancedIndex !== -1) {
      assert.ok(demoIndex < advancedIndex, 'Practical demonstration must precede advanced capstone synthesis');
    }

    assert.ok(playlist.items[0].positionReason.includes('Position 1'), 'Every item must have a position justification');
  });

  // Verification 2: Chronological ordering works when requested
  test('2. Chronological ordering sequences historical milestones by event date rather than upload date', async () => {
    const vWWI = createTestVideo({
      id: 'v_ww1',
      title: 'World War 1 Origins and the Outbreak of 1914 in the 20th Century',
      description: 'Documentary analyzing the events of 1914 leading to the Great War in 20th century history.',
      tags: ['history', '20th century', 'timeline', 'world war 1'],
      publishedAt: '2024-01-15T00:00:00Z', // Recent upload date
    });
    const vColdWar = createTestVideo({
      id: 'v_coldwar',
      title: 'The Cold War and the Space Race 1969',
      description: 'Apollo 11 and geopolitics of 1969 20th century history.',
      tags: ['history', '20th century', 'timeline', 'cold war'],
      publishedAt: '2018-05-10T00:00:00Z', // Older upload date
    });
    const vWWII = createTestVideo({
      id: 'v_ww2',
      title: 'World War 2: The Fall of Berlin 1945 in 20th Century History',
      description: 'Historical archive footage of the conclusion of World War 2 in 1945.',
      tags: ['history', '20th century', 'timeline', 'world war 2'],
      publishedAt: '2022-09-01T00:00:00Z',
    });

    const candidates = qualityEngine.filterAndScoreBatch(
      [vColdWar, vWWI, vWWII],
      '20th Century History Timeline',
      'documentary'
    );

    const chronological = await sequenceGenerator.generateSequence(
      '20th Century History Timeline',
      candidates,
      { sequenceType: 'chronological_research' }
    );

    assert.strictEqual(chronological.items.length, 3);
    assert.strictEqual(chronological.items[0].resource.id, 'v_ww1', '1914 event must be first');
    assert.strictEqual(chronological.items[1].resource.id, 'v_ww2', '1945 event must be second');
    assert.strictEqual(chronological.items[2].resource.id, 'v_coldwar', '1969 event must be third');
    assert.strictEqual(chronological.items[0].eventDate, '1914');
    assert.strictEqual(chronological.items[2].eventDate, '1969');
  });

  // Verification 3: Irrelevant videos are rejected
  test('3. Irrelevant videos failing topical alignment or quality threshold are rejected', () => {
    const vRelevant = createTestVideo({
      id: 'v_rel',
      title: 'Newton Laws of Motion and Friction Dynamics',
      description: 'Physics lecture on free body diagrams and friction forces.',
    });
    const vUnrelated = createTestVideo({
      id: 'v_unrel',
      title: 'Best Chocolate Cake Baking Recipe in 10 Minutes',
      description: 'Delicious chocolate frosting and vanilla cream recipe.',
      tags: ['cooking', 'baking', 'cake'],
    });

    const evaluated = qualityEngine.filterAndScoreBatch(
      [vRelevant, vUnrelated],
      'Newton Laws of Motion',
      'educational',
      55
    );

    const ids = evaluated.map((e) => e.resource.id);
    assert.ok(ids.includes('v_rel'), 'Relevant video must be retained');
    assert.ok(!ids.includes('v_unrel'), 'Irrelevant video must be filtered out');
  });

  // Verification 4: Duplicate videos are removed across URL forms and providers
  test('4. Duplicate video IDs and canonical URLs across providers are removed', () => {
    const v1 = createTestVideo({
      id: 'yt_dQw4w9WgXcQ',
      title: 'Calculus 1: Limits and Continuity',
      canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share&si=abc1234',
    });
    // Duplicate representation via short URL
    const v2 = createTestVideo({
      id: 'google_result_99',
      title: 'Calculus 1: Limits and Continuity (HD Lecture)',
      canonicalUrl: 'https://youtu.be/dQw4w9WgXcQ',
      sourceUrl: 'https://youtu.be/dQw4w9WgXcQ',
    });
    // Duplicate representation via embed URL
    const v3 = createTestVideo({
      id: 'internal_embed_1',
      title: 'Limits and Continuity Calculus',
      canonicalUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      sourceUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    });
    const vDifferent = createTestVideo({
      id: 'yt_diff1234567',
      title: 'Calculus 2: Integral Techniques',
      canonicalUrl: 'https://www.youtube.com/watch?v=diff1234567',
      sourceUrl: 'https://www.youtube.com/watch?v=diff1234567',
    });

    const deduplicated = deduplicationEngine.deduplicate([v1, v2, v3, vDifferent]);
    assert.strictEqual(deduplicated.length, 2, 'Should deduplicate 3 duplicates down to 1 plus distinct video');
    assert.strictEqual(
      deduplicated[0].canonicalUrl,
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'Canonical URL must be normalized'
    );
  });

  // Verification 5: Repetitive content is minimized
  test('5. Redundant duplicate content from the same publisher is minimized', () => {
    const vOriginal = createTestVideo({
      id: 'v_orig',
      authorOrChannel: 'Khan Academy',
      title: 'Introduction to Organic Chemistry Nomenclature',
      description: 'Learn how to name alkanes and functional groups in organic chemistry.',
    });
    const vDuplicate = createTestVideo({
      id: 'v_dup',
      authorOrChannel: 'Khan Academy',
      title: 'Introduction to Organic Chemistry Nomenclature Basics',
      description: 'Learn how to name alkanes and functional groups in organic chemistry basics.',
    });
    const vPractice = createTestVideo({
      id: 'v_practice',
      authorOrChannel: 'Khan Academy',
      title: 'Organic Chemistry Nomenclature Practice Problems and Solved Exercises',
      description: 'Worked problem solutions for IUPAC naming rules.',
    });

    const deduped = deduplicationEngine.deduplicate([vOriginal, vDuplicate, vPractice]);
    assert.strictEqual(deduped.length, 2, 'Redundant clone must be pruned while practice problems video is preserved');
  });

  // Verification 6: Missing metadata is handled safely with explicit uncertainty
  test('6. Missing metadata is handled safely without fabricating statistics or viewing claims', () => {
    const vSparse = createTestVideo({
      id: 'v_sparse',
      title: 'Quantum Field Theory Notes',
      description: '', // Missing description
      authorOrChannel: 'Independent Creator',
      metadata: {}, // Missing HD, captions, and duration metadata
      durationMinutes: 0,
    });

    const score = qualityEngine.evaluateResource(vSparse, 'Quantum Field Theory', 'educational');
    assert.ok(score.evidence.uncertaintyReasons.length > 0, 'Must record explicit uncertainty reasons');
    assert.strictEqual(score.evidence.evidenceConfidence, 'low', 'Confidence should be marked low');
    assert.strictEqual(score.evidence.hasCaptionsOrTranscript, false);
    assert.strictEqual(score.evidence.hasHighDefinition, false);
    assert.ok(!score.explanation.includes('I have watched'), 'Must never claim to have watched the video');
  });

  // Verification 7: Non-embeddable or unplayable videos are rejected
  test('7. Unplayable and non-embeddable videos are safely rejected', () => {
    const vBlocked = createTestVideo({
      id: 'v_blocked',
      title: 'Restricted Calculus Lecture',
      metadata: { isEmbeddable: false },
    });

    const validation = validationEngine.validate(vBlocked);
    assert.strictEqual(validation.isValid, false, 'Non-embeddable video must fail validation');
    assert.ok(
      validation.errors.some((e) => e.includes('disabled on third-party sites')),
      'Error message must state embeddability failure'
    );
  });

  // Verification 8: Incomplete topic coverage is identified
  test('8. Coverage gaps are honestly identified when candidates are missing', async () => {
    // Only one advanced video provided, no foundational videos
    const vAdvancedOnly = createTestVideo({
      id: 'v_adv',
      title: 'Advanced Capstone Synthesis and Non-Linear Derivations in Differential Topology',
      description: 'High-rigor derivations for graduate students studying differential topology.',
      tags: ['mathematics', 'differential topology', 'topology'],
    });

    const candidates = qualityEngine.filterAndScoreBatch(
      [vAdvancedOnly],
      'Differential Topology',
      'educational'
    );

    const playlist = await sequenceGenerator.generateSequence(
      'Differential Topology',
      candidates,
      { sequenceType: 'learning_path' }
    );

    assert.ok(playlist.coverageGaps.length > 0, 'Must report missing foundational concept gap');
    assert.ok(
      playlist.coverageGaps.some((gap) => gap.includes('foundation video missing') || gap.includes('exposition missing')),
      'Must identify specific missing prerequisite'
    );
  });

  // Verification 9: Output schema conforms strictly to SequencedPlaylistResult
  test('9. Sequenced output matches full typed schema contracts', async () => {
    const v1 = createTestVideo({
      id: 'v_sch1',
      title: 'Introduction to Linear Algebra and Vector Spaces',
      description: '00:00 Intro 05:00 Vector axioms 12:00 Basis and dimension.',
    });
    const v2 = createTestVideo({
      id: 'v_sch2',
      title: 'Linear Transformations and Matrix Representation',
      description: 'Formal proofs and mapping between vector spaces.',
    });

    const candidates = qualityEngine.filterAndScoreBatch(
      [v1, v2],
      'Linear Algebra',
      'educational'
    );

    const playlist = await sequenceGenerator.generateSequence('Linear Algebra', candidates);
    const validated = validationEngine.validateSequencedPlaylist(playlist);

    assert.strictEqual(typeof validated.topic, 'string');
    assert.strictEqual(validated.sequenceType, 'learning_path');
    assert.strictEqual(validated.contentType, 'educational');
    assert.ok(Array.isArray(validated.items));
    assert.ok(validated.items.length > 0);

    const firstItem = validated.items[0];
    assert.strictEqual(typeof firstItem.sequenceNumber, 'number');
    assert.ok(firstItem.roleInSequence);
    assert.ok(firstItem.positionReason);
    assert.ok(firstItem.selectionReason);
    assert.strictEqual(typeof firstItem.qualityScore.overall, 'number');
    assert.strictEqual(typeof firstItem.qualityScore.topicRelevance, 'number');
    assert.strictEqual(typeof firstItem.qualityScore.contentDepth, 'number');
    assert.strictEqual(typeof firstItem.qualityScore.publisherCredibility, 'number');
    assert.strictEqual(typeof firstItem.qualityScore.educationalValue, 'number');
    assert.strictEqual(typeof firstItem.qualityScore.audioVisualQuality, 'number');
    assert.strictEqual(typeof firstItem.qualityScore.recency, 'number');
    assert.ok(firstItem.qualityScore.evidence);
    assert.ok(validated.validationSummary.isValid);
  });

  // Verification 10: Adaptive quality scoring per content type
  test('10. Quality scoring dynamically adapts weights to content type', () => {
    const vNews = createTestVideo({
      id: 'v_news',
      title: 'James Webb Space Telescope Discovers Early Galaxies',
      description: 'Breaking astronomical updates published yesterday.',
      publishedAt: new Date().toISOString(), // fresh today
    });

    const scoreEducational = qualityEngine.evaluateResource(vNews, 'Space Telescope Discovery', 'educational');
    const scoreNews = qualityEngine.evaluateResource(vNews, 'Space Telescope Discovery', 'current_news');

    // In current_news, recency is weighted at 25% vs 5% in educational
    assert.strictEqual(scoreNews.weightsUsed.recency, 0.25);
    assert.strictEqual(scoreEducational.weightsUsed.recency, 0.05);
  });
});
