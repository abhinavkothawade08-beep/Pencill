import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeTopicComplexity,
  createTopicAdaptiveCurriculum,
  inferDomain,
} from '@/services/ai/curriculum-adaptive-engine';
import { distributeResourcesToCourse } from '@/lib/resource-engine-v2';
import { EngineResource } from '@/lib/resource-engine-v2';
import { calculateFreshnessScore } from '@/lib/resource-engine-v2/utils/scoring-utils';

describe('Acceptance Test Suite: JEE Chemistry - Haloalkanes and Haloarenes', () => {
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
      sourceName: overrides.sourceName || 'Curated Chemistry Channel',
      provider: 'youtube',
      authorOrChannel: overrides.authorOrChannel || 'Curated Chemistry Channel',
      educatorName: overrides.educatorName,
      educatorId: overrides.educatorId,
      verificationStatus: overrides.verificationStatus,
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
      tags: overrides.tags || ['chemistry', 'haloalkanes', 'jee'],
      metadata: {
        videoId: cleanId,
        publishedAt: pubDate,
        ...overrides.metadata,
      },
      discoveredAt: overrides.discoveredAt || '2026-10-18T12:00:00.000Z',
    };
  }

  // ==========================================================================
  // Test 1: Authentic Curriculum Generation for JEE Chemistry
  // ==========================================================================
  test('Generates authentic 4-module JEE Chemistry curriculum without Computer Science bleed', () => {
    const topic = 'JEE Chemistry - Haloalkanes and Haloarenes';
    const domain = inferDomain(topic);
    assert.strictEqual(domain, 'Chemistry', 'Domain must be inferred as Chemistry');

    const complexity = analyzeTopicComplexity(topic, 'Intermediate', 10);
    assert.strictEqual(complexity.complexityTier, 'intermediate_core');
    assert.strictEqual(complexity.recommendedModuleRange[0], 4);
    assert.strictEqual(complexity.recommendedModuleRange[1], 4);

    const curriculum = createTopicAdaptiveCurriculum(topic, 'Intermediate', 10);
    assert.strictEqual(curriculum.moduleCount, 4, 'Must have exactly 4 modules for Haloalkanes and Haloarenes');
    assert.strictEqual(curriculum.domain, 'Chemistry', 'Curriculum domain must be Chemistry');

    // Verify module titles represent authentic NCERT/JEE syllabus
    const moduleTitles = curriculum.modules.map((m) => m.title);
    assert.ok(moduleTitles[0].includes('Classification') || moduleTitles[0].includes('Nomenclature'), `Mod 1 Title: ${moduleTitles[0]}`);
    assert.ok(moduleTitles[1].includes('Preparation'), `Mod 2 Title: ${moduleTitles[1]}`);
    assert.ok(moduleTitles[2].includes('Substitution') || moduleTitles[2].includes('SN1') || moduleTitles[2].includes('Stereochemical'), `Mod 3 Title: ${moduleTitles[2]}`);
    assert.ok(moduleTitles[3].includes('Elimination') || moduleTitles[3].includes('Polyhalogen'), `Mod 4 Title: ${moduleTitles[3]}`);

    // Verify NO computer science terms leaked into Chemistry
    const allLessonText = curriculum.modules.flatMap((m) =>
      m.lessons.flatMap((l) => [l.title, ...(l.keyConcepts || [])])
    ).join(' ').toLowerCase();

    const csBannedWords = ['dynamic programming', 'recursion', 'binary search', 'graph', 'linear structure', 'array', 'python', 'javascript'];
    for (const banned of csBannedWords) {
      assert.ok(!allLessonText.includes(banned), `Curriculum must not contain CS word "${banned}"`);
    }
  });

  // ==========================================================================
  // Test 2: Primary One-Shot Priority & Educator Consistency
  // ==========================================================================
  test('Selects comprehensive one-shot lecture as primary source and maintains educator consistency across modules', () => {
    const curriculum = createTopicAdaptiveCurriculum('JEE Chemistry - Haloalkanes and Haloarenes', 'Intermediate', 10);

    // Primary Source: 3-hour comprehensive one-shot by verified educator
    const primaryOneShot = makeVideo({
      id: 'yt_sachin_halo_oneshot',
      title: 'Haloalkanes and Haloarenes Complete Chapter One Shot | JEE Main & Advanced Chemistry',
      description: 'Complete revision and detailed concepts of Haloalkanes and Haloarenes for JEE Mains and JEE Advanced covering classification, preparation, SN1 SN2 mechanisms, stereochemistry, elimination and polyhalogen compounds.',
      authorOrChannel: 'Sachin Rana - IIT Bombay',
      educatorName: 'Sachin Rana',
      type: 'full_course',
      durationMinutes: 185,
      score: { overall: 96, relevance: 98, educationalValue: 96, structureCompleteness: 95, freshness: 90 },
      metadata: { isOneShot: true, isFullCourse: true, isComprehensive: true },
      verificationStatus: 'verified',
    });

    // Unrelated / competing fragmented clips from other channels
    const competingClip1 = makeVideo({
      id: 'yt_other_prep',
      title: 'Preparation of Haloalkanes Quick Revision',
      authorOrChannel: 'Random Coaching Hub',
      durationMinutes: 15,
      score: { overall: 78, relevance: 82, educationalValue: 70, structureCompleteness: 65, freshness: 85 },
    });

    const competingClip2 = makeVideo({
      id: 'yt_other_sn1',
      title: 'SN1 vs SN2 Mechanism in 10 Minutes',
      authorOrChannel: 'Exam Tricks Academy',
      durationMinutes: 12,
      score: { overall: 80, relevance: 85, educationalValue: 72, structureCompleteness: 68, freshness: 88 },
    });

    const distributed = distributeResourcesToCourse(curriculum, [
      competingClip1,
      primaryOneShot,
      competingClip2,
    ]);

    // All 4 modules must be anchored to the primary comprehensive one-shot by Sachin Rana
    for (let i = 0; i < distributed.modules.length; i++) {
      const vLesson = distributed.modules[i].lessons.find((l) => l.type === 'video');
      assert.ok(vLesson, `Module ${i + 1} must contain a video lesson`);
      assert.strictEqual(
        vLesson?.sourceUrl,
        primaryOneShot.canonicalUrl,
        `Module ${i + 1} must be anchored to the primary one-shot lecture instead of competing channels`
      );
      assert.strictEqual(
        vLesson?.educatorName,
        'Sachin Rana',
        `Module ${i + 1} must preserve verified educator name`
      );
      assert.ok(
        vLesson?.selectionReason?.includes('Comprehensive full-course tutorial'),
        `Selection reason must reflect comprehensive tutorial: ${vLesson?.selectionReason}`
      );
    }
  });

  // ==========================================================================
  // Test 3: Chapter Timestamp Mapping for Comprehensive One-Shot
  // ==========================================================================
  test('Maps chapter timestamps within comprehensive one-shot to respective modules', () => {
    const curriculum = createTopicAdaptiveCurriculum('JEE Chemistry - Haloalkanes and Haloarenes', 'Intermediate', 10);

    const oneShotWithChapters = makeVideo({
      id: 'yt_halo_chapters',
      title: 'Haloalkanes & Haloarenes One Shot | Complete JEE Chemistry',
      description: `Complete JEE Chapter:
00:00 - Introduction, Classification and Nomenclature of Haloalkanes
30:00 - Methods of Preparation of Haloalkanes and Haloarenes from Alcohols and Hydrocarbons
1:15:00 - Nucleophilic Substitution Mechanisms (SN1 and SN2) and Stereochemistry
2:00:00 - Elimination Reactions, Grignard Reagent and Polyhalogen Compounds`,
      authorOrChannel: 'Mohit Tyagi',
      educatorName: 'Mohit Tyagi',
      type: 'full_course',
      durationMinutes: 160,
      score: { overall: 95, relevance: 98, educationalValue: 95, structureCompleteness: 94, freshness: 88 },
      metadata: { isOneShot: true, isFullCourse: true },
      verificationStatus: 'verified',
    });

    const distributed = distributeResourcesToCourse(curriculum, [oneShotWithChapters]);

    const mod1Video = distributed.modules[0].lessons.find((l) => l.type === 'video');
    const mod2Video = distributed.modules[1].lessons.find((l) => l.type === 'video');
    const mod3Video = distributed.modules[2].lessons.find((l) => l.type === 'video');
    const mod4Video = distributed.modules[3].lessons.find((l) => l.type === 'video');

    assert.ok(mod1Video?.sourceUrl?.includes('halo_chapte'), `Mod 1 links to primary one-shot lecture, got: ${mod1Video?.sourceUrl}`);
    assert.ok(mod2Video?.sourceUrl?.includes('t=1800s'), `Mod 2 chapter at 30:00 (1800s), got: ${mod2Video?.sourceUrl}`);
    assert.ok(mod3Video?.sourceUrl?.includes('t=4500s'), `Mod 3 chapter at 1:15:00 (4500s), got: ${mod3Video?.sourceUrl}`);
    assert.ok(mod4Video?.sourceUrl?.includes('t=7200s'), `Mod 4 chapter at 2:00:00 (7200s), got: ${mod4Video?.sourceUrl}`);

    // Verify all modules remain anchored to the same educator
    for (const mod of distributed.modules) {
      const v = mod.lessons.find((l) => l.type === 'video');
      assert.strictEqual(v?.educatorName, 'Mohit Tyagi', 'Educator must remain Mohit Tyagi across all modules');
    }
  });

  // ==========================================================================
  // Test 4: Complete Playlist Constituent Video Sequential Mapping
  // ==========================================================================
  test('Maps constituent playlist videos in sequential order maintaining single channel consistency', () => {
    const curriculum = createTopicAdaptiveCurriculum('JEE Chemistry - Haloalkanes and Haloarenes', 'Intermediate', 10);

    const playlistId = 'PL_JEE_HALOALKANES_COMPLETE';
    const primaryPlaylist = makeVideo({
      id: 'yt_halo_playlist',
      type: 'youtube_playlist',
      title: 'JEE Chemistry: Haloalkanes and Haloarenes Complete Course Series',
      description: 'Complete 4-part lecture series covering full Haloalkanes and Haloarenes NCERT syllabus for JEE.',
      authorOrChannel: 'Mohit Tyagi',
      educatorName: 'Mohit Tyagi',
      durationMinutes: 240,
      canonicalUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
      score: { overall: 96, relevance: 98, educationalValue: 96, structureCompleteness: 95, freshness: 90 },
      metadata: { isPlaylist: true, playlistId },
      verificationStatus: 'verified',
    });

    // 4 constituent videos belonging to the SAME playlist
    const lecture1 = makeVideo({
      id: 'yt_halo_lec1',
      title: 'Haloalkanes Lecture 1: Classification, Nomenclature and C-X Bond',
      authorOrChannel: 'Mohit Tyagi',
      educatorName: 'Mohit Tyagi',
      durationMinutes: 50,
      score: { overall: 94, relevance: 96, educationalValue: 94, structureCompleteness: 92, freshness: 90 },
      metadata: { playlistId },
    });

    const lecture2 = makeVideo({
      id: 'yt_halo_lec2',
      title: 'Haloalkanes Lecture 2: Methods of Preparation from Alcohols and Hydrocarbons',
      authorOrChannel: 'Mohit Tyagi',
      educatorName: 'Mohit Tyagi',
      durationMinutes: 55,
      score: { overall: 94, relevance: 96, educationalValue: 94, structureCompleteness: 92, freshness: 90 },
      metadata: { playlistId },
    });

    const lecture3 = makeVideo({
      id: 'yt_halo_lec3',
      title: 'Haloalkanes Lecture 3: Substitution Reactions SN1 and SN2 with Stereochemistry',
      authorOrChannel: 'Mohit Tyagi',
      educatorName: 'Mohit Tyagi',
      durationMinutes: 60,
      score: { overall: 95, relevance: 97, educationalValue: 95, structureCompleteness: 94, freshness: 90 },
      metadata: { playlistId },
    });

    const lecture4 = makeVideo({
      id: 'yt_halo_lec4',
      title: 'Haloalkanes Lecture 4: Elimination Reactions, Organometallics and Polyhalogen Compounds',
      authorOrChannel: 'Mohit Tyagi',
      educatorName: 'Mohit Tyagi',
      durationMinutes: 45,
      score: { overall: 93, relevance: 95, educationalValue: 93, structureCompleteness: 90, freshness: 90 },
      metadata: { playlistId },
    });

    // Random competing video from a different channel
    const randomCompetitor = makeVideo({
      id: 'yt_random_prep',
      title: 'Haloalkanes Preparation by Competitor Channel',
      authorOrChannel: 'Random Competitor Channel',
      durationMinutes: 20,
      score: { overall: 85, relevance: 88, educationalValue: 80, structureCompleteness: 75, freshness: 95 },
    });

    const distributed = distributeResourcesToCourse(curriculum, [
      randomCompetitor,
      primaryPlaylist,
      lecture1,
      lecture2,
      lecture3,
      lecture4,
    ]);

    // Verify sequential mapping of constituent lectures from the same playlist/channel
    const assignedLec1 = distributed.modules[0].lessons.find((l) => l.type === 'video');
    const assignedLec2 = distributed.modules[1].lessons.find((l) => l.type === 'video');
    const assignedLec3 = distributed.modules[2].lessons.find((l) => l.type === 'video');
    const assignedLec4 = distributed.modules[3].lessons.find((l) => l.type === 'video');

    assert.strictEqual(assignedLec1?.sourceUrl, lecture1.canonicalUrl, 'Module 1 must receive Lecture 1');
    assert.strictEqual(assignedLec2?.sourceUrl, lecture2.canonicalUrl, 'Module 2 must receive Lecture 2');
    assert.strictEqual(assignedLec3?.sourceUrl, lecture3.canonicalUrl, 'Module 3 must receive Lecture 3');
    assert.strictEqual(assignedLec4?.sourceUrl, lecture4.canonicalUrl, 'Module 4 must receive Lecture 4');

    // Ensure all 4 modules preserve the same educator without arbitrary mixing
    for (const mod of distributed.modules) {
      const v = mod.lessons.find((l) => l.type === 'video');
      assert.strictEqual(v?.educatorName, 'Mohit Tyagi', 'Educator must remain Mohit Tyagi across all modules');
    }
  });

  // ==========================================================================
  // Test 5: Intelligent Fallback & Targeted Gap Filling
  // ==========================================================================
  test('Uses supplementary video ONLY when a module represents a genuine syllabus gap missing from primary source', () => {
    const curriculum = createTopicAdaptiveCurriculum('JEE Chemistry - Haloalkanes and Haloarenes', 'Intermediate', 10);

    // Primary Tutorial covers Modules 1, 2, and 3 (Classification, Preparation, SN1/SN2)
    // but explicitly omits Polyhalogen Compounds (Module 4)
    const partialPrimary = makeVideo({
      id: 'yt_halo_partial',
      title: 'Haloalkanes and Haloarenes: Nomenclature, Synthesis and Substitution Reactions',
      description: 'In-depth coverage of classification, C-X bond, methods of preparation, and SN1 SN2 substitution mechanisms with stereochemistry.',
      type: 'full_course',
      durationMinutes: 120,
      authorOrChannel: 'Sachin Rana',
      educatorName: 'Sachin Rana',
      score: { overall: 92, relevance: 95, educationalValue: 92, structureCompleteness: 90, freshness: 88 },
      metadata: { isFullCourse: true },
      verificationStatus: 'verified',
    });

    // Targeted supplementary video specifically covering Polyhalogen Compounds
    const polyhalogenSupplementary = makeVideo({
      id: 'yt_polyhalogen_gap',
      title: 'Polyhalogen Compounds: Dichloromethane, Chloroform, Iodoform, CCl4 and Freons in JEE Chemistry',
      description: 'Comprehensive guide to polyhalogen compounds, properties, synthesis, iodoform test, and environmental effects of freons and DDT.',
      durationMinutes: 40,
      authorOrChannel: 'Arvind Arora',
      educatorName: 'Arvind Arora',
      score: { overall: 94, relevance: 96, educationalValue: 94, structureCompleteness: 92, freshness: 92 },
      verificationStatus: 'verified',
    });

    const distributed = distributeResourcesToCourse(curriculum, [
      partialPrimary,
      polyhalogenSupplementary,
    ]);

    // Modules 1..3 should remain anchored to Sachin Rana's primary tutorial
    for (let i = 0; i < 3; i++) {
      const v = distributed.modules[i].lessons.find((l) => l.type === 'video');
      assert.strictEqual(v?.sourceUrl, partialPrimary.canonicalUrl, `Module ${i + 1} must receive primary tutorial`);
      assert.strictEqual(v?.educatorName, 'Sachin Rana', `Module ${i + 1} educator must be Sachin Rana`);
    }

    // Module 4 (missing from primary) must receive the targeted supplementary video
    const mod4Video = distributed.modules[3].lessons.find((l) => l.type === 'video');
    assert.strictEqual(
      mod4Video?.sourceUrl,
      polyhalogenSupplementary.canonicalUrl,
      'Module 4 must receive the targeted supplementary video covering polyhalogen gap'
    );
    assert.strictEqual(mod4Video?.educatorName, 'Arvind Arora', 'Module 4 educator must be Arvind Arora');
    assert.ok(
      mod4Video?.selectionReason?.includes('Targeted supplementary lecture'),
      `Selection reason must indicate targeted supplementary status: ${mod4Video?.selectionReason}`
    );
  });

  // ==========================================================================
  // Test 6: Quality Over Recency & Strict Deduplication
  // ==========================================================================
  test('Prioritizes high educational quality over superficial recency and prevents non-comprehensive duplicates', () => {
    const curriculum = createTopicAdaptiveCurriculum('JEE Chemistry - Haloalkanes and Haloarenes', 'Intermediate', 10);

    // High quality older resource by verified educator (Score 95, from 2023)
    const authoritativeOlder = makeVideo({
      id: 'yt_authoritative_older',
      title: 'Haloalkanes and Haloarenes Comprehensive Masterclass for JEE',
      description: 'Complete NCERT chapter covering nomenclature, preparation, mechanisms, stereochemistry and polyhalogen compounds.',
      authorOrChannel: 'Mohit Tyagi',
      educatorName: 'Mohit Tyagi',
      durationMinutes: 180,
      score: { overall: 95, relevance: 96, educationalValue: 95, structureCompleteness: 94, freshness: 72 },
      publishedAt: '2023-01-15T00:00:00Z',
      type: 'full_course',
      metadata: { isOneShot: true, isFullCourse: true },
      verificationStatus: 'verified',
    });

    // Recent superficial video with lower substance (Score 68, from 2026)
    const recentSuperficial = makeVideo({
      id: 'yt_recent_short',
      title: 'Haloalkanes in 10 Minutes - Latest 2026 Exam Tricks',
      description: 'Quick memory hacks for exam.',
      authorOrChannel: 'Exam Hacks Channel',
      durationMinutes: 10,
      score: { overall: 68, relevance: 72, educationalValue: 62, structureCompleteness: 60, freshness: 98 },
      publishedAt: '2026-02-01T00:00:00Z',
    });

    const distributed = distributeResourcesToCourse(curriculum, [
      recentSuperficial,
      authoritativeOlder,
    ]);

    // Module 1 must choose the authoritative lecture despite older upload date
    const mod1Video = distributed.modules[0].lessons.find((l) => l.type === 'video');
    assert.strictEqual(
      mod1Video?.sourceUrl,
      authoritativeOlder.canonicalUrl,
      'Authoritative educator lecture must be chosen over superficial newer video'
    );
  });

  // ==========================================================================
  // Test 7: Preserves Learning Support (Notes, Practice Problems, and Checkpoints)
  // ==========================================================================
  test('Preserves reading notes, practice problem sets, and diagnostic quizzes alongside primary lecture', () => {
    const curriculum = createTopicAdaptiveCurriculum('JEE Chemistry - Haloalkanes and Haloarenes', 'Intermediate', 10);

    const primaryOneShot = makeVideo({
      id: 'yt_halo_full',
      title: 'Haloalkanes and Haloarenes Complete Chapter One Shot | JEE',
      description: 'Complete NCERT chapter for JEE Mains and Advanced covering classification, nomenclature, preparation methods, substitution reactions, stereochemistry, elimination and polyhalogen compounds.',
      authorOrChannel: 'Mohit Tyagi',
      educatorName: 'Mohit Tyagi',
      type: 'full_course',
      durationMinutes: 180,
      score: { overall: 95, relevance: 98, educationalValue: 95, structureCompleteness: 94, freshness: 90 },
      metadata: { isOneShot: true, isFullCourse: true },
      verificationStatus: 'verified',
    });

    const readingNote: EngineResource = {
      id: 'doc_ncert_halo',
      title: 'NCERT Class 12 Chemistry Chapter 10: Haloalkanes and Haloarenes',
      description: 'Authoritative NCERT textbook chapter covering classification, IUPAC, preparation, reactions and stereochemistry.',
      type: 'monograph',
      provider: 'archive',
      sourceName: 'NCERT National Council',
      authorOrChannel: 'NCERT',
      canonicalUrl: 'https://ncert.nic.in/textbook/pdf/lech202.pdf',
      sourceUrl: 'https://ncert.nic.in/textbook/pdf/lech202.pdf',
      durationMinutes: 60,
      difficulty: 'intermediate',
      language: 'en',
      score: { overall: 95, relevance: 98, educationalValue: 95, structureCompleteness: 96, freshness: 85 },
      tags: ['chemistry', 'haloalkanes', 'ncert'],
    };

    const practiceSet: EngineResource = {
      id: 'prac_jee_halo_pyqs',
      title: 'JEE Mains & Advanced Haloalkanes Previous Year Question Bank',
      description: '150 solved PYQ problems covering SN1, SN2 mechanisms, preparation routes, and Grignard reagent problems.',
      type: 'practice_sheet',
      provider: 'open_educational',
      canonicalUrl: 'https://pencill.app/practice/jee-haloalkanes-pyqs',
      sourceUrl: 'https://pencill.app/practice/jee-haloalkanes-pyqs',
      sourceName: 'JEE Practice Repository',
      durationMinutes: 45,
      difficulty: 'competitive',
      language: 'en',
      score: { overall: 94, relevance: 96, educationalValue: 94, structureCompleteness: 92, freshness: 90 },
      tags: ['practice', 'pyq', 'jee', 'haloalkanes'],
    };

    const diagnosticQuiz: EngineResource = {
      id: 'quiz_halo_checkpoint',
      title: 'Classification and Nomenclature Diagnostic Checkpoint',
      description: 'Formative checkpoint grounded in Haloalkanes learning objectives.',
      type: 'ai_quiz',
      provider: 'quiz',
      canonicalUrl: '/practice/quiz_halo_checkpoint',
      sourceUrl: '/practice/quiz_halo_checkpoint',
      sourceName: 'Pencill Diagnostics',
      discoveredAt: '2026-10-18T12:00:00.000Z',
      durationMinutes: 15,
      difficulty: 'intermediate',
      language: 'en',
      score: { overall: 95, relevance: 98, educationalValue: 95, structureCompleteness: 95, freshness: 92 },
      tags: ['assessment', 'quiz', 'haloalkanes'],
    };

    const distributed = distributeResourcesToCourse(curriculum, [
      primaryOneShot,
      readingNote,
      practiceSet,
      diagnosticQuiz,
    ]);

    // Verify all modalities are preserved across modules
    for (let i = 0; i < distributed.modules.length; i++) {
      const mod = distributed.modules[i];
      const videoLesson = mod.lessons.find((l) => l.type === 'video');
      const docLesson = mod.lessons.find((l) => l.type === 'monograph');
      const practiceLesson = mod.lessons.find((l) => l.type === 'practice');
      const quizLesson = mod.lessons.find((l) => l.type === 'quiz');

      assert.ok(videoLesson, `Module ${i + 1} must contain a video lesson`);
      assert.ok(docLesson, `Module ${i + 1} must contain a monograph reading lesson`);
      assert.ok(practiceLesson, `Module ${i + 1} must contain a practice lesson`);
      assert.ok(quizLesson, `Module ${i + 1} must contain a formative quiz lesson`);

      // Video must be primary source
      assert.strictEqual(videoLesson?.sourceUrl, primaryOneShot.canonicalUrl);

      // Support resources must NOT be displaced or wiped out
      assert.ok(docLesson?.sourceName, 'Monograph must have a source name');
      assert.ok(practiceLesson?.sourceName, 'Practice set must have a source name');
      assert.ok(quizLesson?.sourceName, 'Quiz must have a source name');
      assert.ok(mod.lessons[0].studyNotes && mod.lessons[0].studyNotes.length > 0, 'Companion study notes must be present');
    }
  });
});
