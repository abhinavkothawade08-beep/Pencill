import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  LegacyQueryAnalyzer as QueryAnalyzer,
  LegacySearchPlanner as SearchPlanner,
  QualityScoringEngine,
  LegacyNormalizationEngine as NormalizationEngine,
  DeduplicationEngine,
  LegacyRankingEngine as RankingEngine,
  type EngineResource,
} from '../src/lib/resource-engine-v2';

describe('Multi-Topic Relevance & Discovery Engine Pipeline (Stages A - H)', () => {
  const queryAnalyzer = new QueryAnalyzer();
  const searchPlanner = new SearchPlanner();
  const qualityScorer = new QualityScoringEngine();
  const normalizationEngine = new NormalizationEngine();
  const deduplicationEngine = new DeduplicationEngine();
  const rankingEngine = new RankingEngine();

  describe('Stage A: Learning Objective & Query Analysis', () => {
    test('Analyzes STEM topic with target exam and difficulty extraction', () => {
      const parsed = queryAnalyzer.analyzeDeterministic('JEE Advanced Organic Chemistry Haloalkanes');
      assert.strictEqual(parsed.examContext, 'JEE');
      assert.strictEqual(parsed.subject, 'Chemistry');
      assert.strictEqual(parsed.targetLevel, 'competitive');
    });

    test('Analyzes Computer Science topic with practical implementation intent', () => {
      const parsed = queryAnalyzer.analyzeDeterministic('Fine-Tuning Large Language Models with LoRA');
      assert.strictEqual(parsed.subject, 'Computer Science');
      assert.ok(parsed.topic.toLowerCase().includes('fine-tuning') || parsed.topic.toLowerCase().includes('lora'));
    });

    test('Analyzes Mathematics topic with foundational requirements', () => {
      const parsed = queryAnalyzer.analyzeDeterministic('Calculus Limits and Derivatives for Beginners');
      assert.strictEqual(parsed.subject, 'Mathematics');
      assert.strictEqual(parsed.targetLevel, 'beginner');
    });
  });

  describe('Stage B: Search Strategy Planning', () => {
    test('Plans targeted search queries without redundant duplication', () => {
      const parsed = queryAnalyzer.analyzeDeterministic('JEE Chemistry Reaction Mechanisms');
      const plan = searchPlanner.createPlan(parsed);

      assert.ok(plan.queries.length > 0, 'Must produce targeted search queries');
      assert.ok(plan.queries.length <= 30, 'Must not flood queries beyond practical limits');
      assert.ok(plan.queries.every((q) => q.query.trim().length > 3), 'All queries must have non-empty search text');
      assert.ok(plan.queries.every((q) => ['youtube', 'google', 'web', 'practice', 'notes', 'academic_notes', 'quiz'].includes(q.provider)), 'All queries must target valid providers');
    });
  });

  describe('Stage D & E: Validation, Normalization, Relevance & Scoring', () => {
    test('Scores authentic educational resources higher than off-topic or commercial pages', () => {
      const onTopicCandidate: EngineResource = {
        id: 'res-on-topic',
        title: 'Complete Haloalkanes and Haloarenes Reaction Mechanisms - Class 12 Chemistry',
        description: 'Detailed lecture on nucleophilic substitution (SN1, SN2) and elimination in alkyl halides.',
        type: 'video_lecture',
        canonicalUrl: 'https://www.youtube.com/watch?v=haloChem1234',
        sourceUrl: 'https://www.youtube.com/watch?v=haloChem1234',
        sourceName: 'Mohit Tyagi (Curated Directory)',
        provider: 'youtube',
        durationMinutes: 45,
        difficulty: 'intermediate',
        language: 'en',
        tags: ['chemistry', 'haloalkanes', 'jee'],
        score: {
          overall: 88,
          relevance: 90,
          educationalValue: 88,
          structureCompleteness: 85,
          freshness: 80,
          explanation: '',
        },
        discoveredAt: new Date().toISOString(),
      };

      const offTopicCandidate: EngineResource = {
        id: 'res-off-topic',
        title: 'Learn JavaScript in 15 Minutes - Web Development Bootcamp',
        description: 'Beginner tutorial on JavaScript syntax, variables, and arrays for web apps.',
        type: 'video_lecture',
        canonicalUrl: 'https://www.youtube.com/watch?v=jsWeb123456',
        sourceUrl: 'https://www.youtube.com/watch?v=jsWeb123456',
        sourceName: 'Coding Fast',
        provider: 'youtube',
        durationMinutes: 15,
        difficulty: 'beginner',
        language: 'en',
        tags: ['javascript', 'web'],
        score: {
          overall: 50,
          relevance: 15,
          educationalValue: 40,
          structureCompleteness: 30,
          freshness: 80,
          explanation: '',
        },
        discoveredAt: new Date().toISOString(),
      };

      const topic = 'Haloalkanes and Haloarenes Chemistry';
      const onTopicEval = qualityScorer.evaluateResource(onTopicCandidate, topic, 'educational');
      const offTopicEval = qualityScorer.evaluateResource(offTopicCandidate, topic, 'educational');

      assert.ok(
        onTopicEval.topicRelevance > offTopicEval.topicRelevance,
        `On-topic relevance (${onTopicEval.topicRelevance}) must exceed off-topic relevance (${offTopicEval.topicRelevance})`
      );
      assert.ok(
        onTopicEval.overall > offTopicEval.overall,
        `On-topic overall (${onTopicEval.overall}) must exceed off-topic overall (${offTopicEval.overall})`
      );
      assert.ok(
        onTopicEval.topicRelevance >= 70,
        'On-topic candidate must achieve strong relevance score >= 70'
      );
    });

    test('Normalization guarantees valid schema fields and canonical URLs', () => {
      const raw = {
        id: 'raw-1',
        title: '  MIT 18.06 Linear Algebra - Lecture 1: The Geometry of Linear Equations  ',
        sourceUrl: 'https://ocw.mit.edu/courses/18-06-linear-algebra/?utm_source=test#lecture1',
        type: 'video_lecture' as const,
        sourceName: 'MIT OpenCourseWare',
        provider: 'open_educational' as const,
      };

      const normalized = normalizationEngine.normalize(raw);
      assert.strictEqual(normalized.title, 'MIT 18.06 Linear Algebra - Lecture 1: The Geometry of Linear Equations');
      assert.ok(!normalized.canonicalUrl.includes('utm_source'), 'Canonical URL must strip tracking params');
      assert.ok(normalized.canonicalUrl.startsWith('https://ocw.mit.edu/courses/18-06-linear-algebra'));
    });
  });

  describe('Stage F & G: Deduplication, Ranking & Selection', () => {
    test('Deduplicates resources sharing identical canonical URL or YouTube video ID', () => {
      const duplicates: EngineResource[] = [
        {
          id: 'v1',
          title: 'Algorithms: Merge Sort Explained',
          canonicalUrl: 'https://www.youtube.com/watch?v=mergeSort99',
          sourceUrl: 'https://www.youtube.com/watch?v=mergeSort99',
          type: 'video_lecture',
          sourceName: 'Abdul Bari',
          provider: 'youtube',
          externalId: 'mergeSort99',
          durationMinutes: 25,
          difficulty: 'intermediate',
          language: 'en',
          tags: ['algorithms', 'sorting'],
          score: { overall: 92, relevance: 90, educationalValue: 90, structureCompleteness: 90, freshness: 85, explanation: '' },
          discoveredAt: new Date().toISOString(),
        },
        {
          id: 'v2',
          title: 'Merge Sort Algorithm in 10 Minutes',
          canonicalUrl: 'https://www.youtube.com/watch?v=mergeSort99', // same video ID
          sourceUrl: 'https://youtu.be/mergeSort99',
          type: 'video_lecture',
          sourceName: 'Abdul Bari',
          provider: 'youtube',
          externalId: 'mergeSort99',
          durationMinutes: 10,
          difficulty: 'intermediate',
          language: 'en',
          tags: ['algorithms', 'sorting'],
          score: { overall: 85, relevance: 85, educationalValue: 85, structureCompleteness: 85, freshness: 80, explanation: '' },
          discoveredAt: new Date().toISOString(),
        },
      ];

      const deduped = deduplicationEngine.deduplicate(duplicates);
      assert.strictEqual(deduped.length, 1, 'Must collapse duplicate video candidates down to 1 unique entry');
      assert.strictEqual(deduped[0].id, 'v1', 'Must retain the higher-scoring instance');
    });

    test('Ranking and selection ranks candidates by weighted quality and source authority', () => {
      const candidates: EngineResource[] = [
        {
          id: 'vid-1',
          title: 'Comprehensive Video Lecture on Thermodynamics',
          type: 'video_lecture',
          canonicalUrl: 'https://www.youtube.com/watch?v=thermoVid01',
          sourceUrl: 'https://www.youtube.com/watch?v=thermoVid01',
          sourceName: 'Physics Galaxy',
          provider: 'youtube',
          durationMinutes: 60,
          difficulty: 'intermediate',
          language: 'en',
          tags: ['physics', 'thermodynamics'],
          score: { overall: 94, relevance: 92, educationalValue: 94, structureCompleteness: 90, freshness: 90, explanation: '' },
          discoveredAt: new Date().toISOString(),
        },
        {
          id: 'doc-1',
          title: 'First and Second Law of Thermodynamics - OpenStax Physics',
          type: 'monograph',
          canonicalUrl: 'https://openstax.org/books/university-physics-volume-2/thermodynamics',
          sourceUrl: 'https://openstax.org/books/university-physics-volume-2/thermodynamics',
          sourceName: 'OpenStax',
          provider: 'open_educational',
          durationMinutes: 45,
          difficulty: 'intermediate',
          language: 'en',
          tags: ['physics', 'thermodynamics'],
          score: { overall: 92, relevance: 90, educationalValue: 95, structureCompleteness: 92, freshness: 90, explanation: '' },
          discoveredAt: new Date().toISOString(),
        },
        {
          id: 'prac-1',
          title: 'Thermodynamics Practice Problem Sheet with Solutions',
          type: 'practice_sheet',
          canonicalUrl: 'https://archive.org/details/thermo-practice-problems',
          sourceUrl: 'https://archive.org/details/thermo-practice-problems',
          sourceName: 'Internet Archive',
          provider: 'archive',
          durationMinutes: 45,
          difficulty: 'intermediate',
          language: 'en',
          tags: ['physics', 'practice'],
          score: { overall: 90, relevance: 88, educationalValue: 90, structureCompleteness: 88, freshness: 85, explanation: '' },
          discoveredAt: new Date().toISOString(),
        },
      ];

      const ranked = rankingEngine.rank(candidates, 5);
      assert.strictEqual(ranked.length, 3, 'Must retain all high-quality candidates up to limit');
      assert.ok(ranked[0].finalScore >= ranked[1].finalScore, 'Must sort candidates in descending order of final score');
      assert.ok(ranked[1].finalScore >= ranked[2].finalScore, 'Must maintain descending ranking');
    });
  });
});
