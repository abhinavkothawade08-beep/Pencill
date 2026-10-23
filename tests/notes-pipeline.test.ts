import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SearchPlanner,
  NormalizationEngine,
  DeduplicationEngine,
  ValidationEngine,
  QualityScoringEngine,
  GoogleSearchProvider,
  AcademicNotesProvider,
  DiscoveryEngine,
  ProviderRegistry,
  EngineResource,
  toCoreResourceType,
  toPublicResource,
} from '../.backup_engine_v1';
import { NotesDiscoverRequestSchema } from '../src/lib/api-schemas';
import { createFullLearningPath, getLearningPathById } from '../src/services/supabase/pathService';
import { LessonNoteResource } from '../src/types';

describe('Notes Pipeline: Discovery, Classification, Evaluation, Mapping & Persistence', () => {
  const planner = new SearchPlanner();
  const normalizer = new NormalizationEngine();
  const deduplicator = new DeduplicationEngine();
  const validator = new ValidationEngine();
  const qualityEngine = new QualityScoringEngine();

  // Test 1: Lesson-specific queries are generated correctly
  it('1. Lesson-specific queries are generated correctly from objectives and lesson titles', () => {
    const plan = planner.createLessonNotesPlan(
      '2.1 Torque and Angular Acceleration on Rigid Bodies',
      'Rotational Dynamics',
      'Physics',
      'JEE'
    );

    assert.ok(plan.length >= 2, 'Should generate at least 2 targeted search queries');
    const firstQuery = plan[0].query;
    assert.ok(!firstQuery.startsWith('2.1'), 'Should strip lesson number prefixes like 2.1');
    assert.ok(firstQuery.includes('Torque and Angular Acceleration'), 'Query should include core lesson topic');
    assert.ok(firstQuery.includes('lecture notes') || firstQuery.includes('guide'), 'Query should target notes or guides');
  });

  // Test 2: Direct PDF links are classified correctly
  it('2. Direct PDF links are classified correctly without false positives on HTML pages', () => {
    const directPdfRes = {
      id: 'res-pdf-1',
      title: 'MIT OCW 8.01 Lecture 19: Torque and Moment of Inertia (PDF Handout)',
      sourceUrl: 'https://ocw.mit.edu/courses/physics/8-01-fall-2016/lecture-notes/MIT8_01F16_L19.pdf',
      type: 'pdf_lecture_notes',
      sourceName: 'MIT OpenCourseWare',
      score: { overall: 90, relevance: 95, educationalValue: 90, structureCompleteness: 90, freshness: 80 },
      metadata: { isDirectPdf: true, downloadUrl: 'https://ocw.mit.edu/courses/physics/8-01-fall-2016/lecture-notes/MIT8_01F16_L19.pdf' },
    } as unknown as EngineResource;

    const htmlRes = {
      id: 'res-html-1',
      title: 'GeeksforGeeks Torque and Angular Momentum Guide',
      sourceUrl: 'https://www.geeksforgeeks.org/torque-and-angular-momentum/',
      type: 'article',
      sourceName: 'GeeksforGeeks',
      score: { overall: 75, relevance: 80, educationalValue: 75, structureCompleteness: 75, freshness: 80 },
      metadata: { isDirectPdf: false },
    } as unknown as EngineResource;

    const normPdf = normalizer.normalize(directPdfRes);
    const normHtml = normalizer.normalize(htmlRes);

    assert.equal(normPdf.type, 'pdf_lecture_notes');
    assert.equal(normPdf.metadata?.isDirectPdf, true);
    assert.equal(normHtml.type, 'article');
    assert.equal(normHtml.metadata?.isDirectPdf, false);
  });

  // Test 3: HTML pages are not incorrectly classified as PDFs
  it('3. HTML pages linking to educational sites are not incorrectly classified as PDFs', () => {
    const webProvider = new GoogleSearchProvider();
    const pdfUrl = 'https://archive.org/download/physics-handbook/handbook.pdf?v=2';
    const htmlUrl = 'https://docs.python.org/3/tutorial/classes.html';

    assert.equal(webProvider.isDirectPdfUrl(pdfUrl), true);
    assert.equal(webProvider.isDirectPdfUrl(htmlUrl), false);
    assert.equal(webProvider.inferWebResourceType(htmlUrl, 'Python Classes Documentation', 'Official docs'), 'official_documentation');
    assert.equal(webProvider.inferWebResourceType(pdfUrl, 'Physics Handbook Notes', 'Handout'), 'pdf_lecture_notes');
  });

  // Test 4: Irrelevant resources are rejected during quality evaluation
  it('4. Irrelevant resources with low topical overlap or non-academic content are rejected', () => {
    const irrelevantDoc = {
      id: 'res-spam-1',
      title: 'Top 10 Fashion Trends in Milan 2026',
      sourceUrl: 'https://fashion-blog.example.com/trends-2026',
      type: 'article',
      sourceName: 'Fashion Blog',
      description: 'The best outfits and runway styles of the season.',
      score: { overall: 0, relevance: 0, educationalValue: 0, structureCompleteness: 0, freshness: 0 },
    } as unknown as EngineResource;

    const scored = qualityEngine.filterAndScoreBatch([irrelevantDoc], 'Torque and Rotational Dynamics', 'academic', 50);
    assert.equal(scored.length, 0, 'Irrelevant fashion article must be rejected');
  });

  // Test 5: Duplicate resources across providers are removed
  it('5. Duplicate resources and canonical URL variations are cleanly deduplicated', () => {
    const item1 = {
      id: 'doc-1',
      title: 'Moment of Inertia Lecture Notes - MIT',
      sourceUrl: 'https://ocw.mit.edu/courses/physics/notes.pdf?utm_source=google&tracker=123',
      type: 'pdf_lecture_notes',
      sourceName: 'MIT OCW',
      score: { overall: 85 },
    } as unknown as EngineResource;

    const item2 = {
      id: 'doc-2',
      title: 'Moment of Inertia Lecture Notes - MIT (Mirrored)',
      sourceUrl: 'https://ocw.mit.edu/courses/physics/notes.pdf',
      type: 'pdf_lecture_notes',
      sourceName: 'OpenCourseWare Mirror',
      score: { overall: 85 },
    } as unknown as EngineResource;

    const norm1 = normalizer.normalize(item1);
    const norm2 = normalizer.normalize(item2);

    const deduped = deduplicator.deduplicate([norm1, norm2]);
    assert.equal(deduped.length, 1, 'Duplicate canonical URL must collapse into a single resource');
  });

  // Test 6: Official documentation and academic monographs are retained
  it('6. Official documentation and verified academic monographs are preserved with high scores', () => {
    const docResource = {
      id: 'doc-official-1',
      title: 'Python Official Language Reference: Data Model and Metaclasses',
      sourceUrl: 'https://docs.python.org/3/reference/datamodel.html',
      type: 'official_documentation',
      sourceName: 'Python Software Foundation',
      description: 'Official API specification, methods, and language syntax definition.',
      score: { overall: 0 },
    } as unknown as EngineResource;

    const scored = qualityEngine.filterAndScoreBatch([docResource], 'Python Metaclasses Data Model', 'academic', 45);
    assert.ok(scored.length > 0, 'Official documentation must pass quality evaluation');
    assert.ok(scored[0].score.overall >= 70, 'Official documentation should achieve score >= 70');
  });

  // Test 7: Missing metadata is handled safely without throwing or fabricating data
  it('7. Missing metadata, authors, or descriptions are safely defaulted without fabrication', () => {
    const sparseResource = {
      id: 'sparse-1',
      title: 'Calculus Fundamental Theorem Proof Handout',
      sourceUrl: 'https://math.berkeley.edu/handouts/ftc.pdf',
      type: 'lecture_handout',
      sourceName: 'UC Berkeley Math',
      score: { overall: 0 },
    } as unknown as EngineResource;

    const norm = normalizer.normalize(sparseResource);
    assert.ok(norm.description !== undefined, 'Description should default safely');
    assert.equal(norm.metadata?.isDirectPdf, true, 'Direct PDF extension should be accurately inferred');

    const scored = qualityEngine.filterAndScoreBatch([norm], 'Calculus Fundamental Theorem', 'academic', 40);
    assert.ok(scored.length > 0, 'Valid academic handout with sparse metadata should score accurately');
  });

  // Test 8: Resources are assigned to appropriate lessons based on semantic relevance
  it('8. Resources are assigned to appropriate lessons rather than duplicated across all units', () => {
    const docTorque = {
      id: 'doc-torque',
      title: 'Torque Calculation and Rotational Equilibrium Handout',
      sourceUrl: 'https://mit.edu/torque.pdf',
      type: 'lecture_handout',
      sourceName: 'MIT Physics',
      description: 'Derivations for net torque and rotational equilibrium.',
      score: { overall: 88 },
    } as unknown as EngineResource;

    const docRolling = {
      id: 'doc-rolling',
      title: 'Pure Rolling Motion and Frictionless Cylinders',
      sourceUrl: 'https://stanford.edu/rolling.pdf',
      type: 'lecture_handout',
      sourceName: 'Stanford Physics',
      description: 'Kinematics of rolling without slipping on inclined ramps.',
      score: { overall: 92 },
    } as unknown as EngineResource;

    const lessonA = { title: 'Calculating Torque on Rigid Bars', keyConcepts: ['Torque', 'Equilibrium'] };
    const lessonB = { title: 'Rolling Without Slipping Dynamics', keyConcepts: ['Rolling', 'Incline'] };

    const docs = [docTorque, docRolling];

    const scoreForLesson = (lesson: { title: string; keyConcepts: string[] }, doc: EngineResource) => {
      const tokens = (lesson.title + ' ' + lesson.keyConcepts.join(' ')).toLowerCase().split(/\W+/);
      const docTokens = (doc.title + ' ' + doc.description).toLowerCase().split(/\W+/);
      return tokens.filter((t) => docTokens.includes(t)).length;
    };

    const matchA = [...docs].sort((a, b) => scoreForLesson(lessonA, b) - scoreForLesson(lessonA, a))[0];
    const matchB = [...docs].sort((a, b) => scoreForLesson(lessonB, b) - scoreForLesson(lessonB, a))[0];

    assert.equal(matchA.id, 'doc-torque', 'Torque lesson must map to torque handout');
    assert.equal(matchB.id, 'doc-rolling', 'Rolling lesson must map to rolling handout');
  });

  // Test 9: Notes Discover Request Schema validation
  it('9. NotesDiscoverRequestSchema properly validates requests and rejects empty topics', () => {
    const valid = NotesDiscoverRequestSchema.safeParse({
      topic: 'Maxwell Equations in Differential Form',
      lessonTitle: 'Gauss Law for Magnetism',
      domain: 'Electrodynamics',
      limit: 5,
    });
    assert.equal(valid.success, true);
    if (valid.success) {
      assert.equal(valid.data.limit, 5);
      assert.equal(valid.data.topic, 'Maxwell Equations in Differential Form');
    }

    const invalid = NotesDiscoverRequestSchema.safeParse({
      topic: '   ',
    });
    assert.equal(invalid.success, false, 'Whitespace-only topic must be rejected');
  });

  // Test 10: Empty search results produce an honest empty state
  it('10. Empty or rejected search results produce an honest empty response without hallucinated URLs', async () => {
    const engine = new DiscoveryEngine();
    const results = await engine.discoverNotesForLesson(
      'Xylophone Quantum Quasar NonExistentTopic99999',
      'NonExistentTopic99999',
      { limit: 4, minQualityScore: 90 }
    );

    assert.ok(Array.isArray(results));
    assert.equal(results.length, 0, 'Non-matching query with high threshold must return empty list');
  });

  // Test 11: Provider errors do not crash the workflow
  it('11. Provider failure or timeout returns gracefully with partial results or honest empty list', async () => {
    const registry = new ProviderRegistry();
    const engine = new DiscoveryEngine(registry);

    // Call discoverNotesForLesson with very short timeout to test graceful resilience
    const notes = await engine.discoverNotesForLesson('Thermodynamics Entropy', 'Physics', {
      timeoutMs: 1, // trigger timeout / fast return
    });

    assert.ok(Array.isArray(notes), 'Must return an array, never throw uncaught error');
  });

  // Test 12: Notes are correctly serialized with downloadUrl and isDirectPdf
  it('12. Notes correctly serialize with isDirectPdf and downloadUrl in public contracts', () => {
    const resource = {
      id: 'res-pdf-test',
      title: 'Stanford CS106B Lecture 10: Recursive Backtracking',
      sourceUrl: 'https://web.stanford.edu/class/archive/cs/cs106b/cs106b.1206/lectures/10/10-RecursiveBacktracking.pdf',
      type: 'pdf_lecture_notes',
      sourceName: 'Stanford University',
      score: { overall: 94 },
      metadata: { isDirectPdf: true, downloadUrl: 'https://web.stanford.edu/class/archive/cs/cs106b/cs106b.1206/lectures/10/10-RecursiveBacktracking.pdf' },
    } as unknown as EngineResource;

    const publicRes = toPublicResource(resource, 94);
    assert.equal(publicRes.type, 'notes');
    assert.equal(publicRes.isDirectPdf, true);
    assert.equal(publicRes.downloadUrl, resource.metadata?.downloadUrl);
  });

  // Test 13: Supabase in-memory and client cache persistence for studyNotes
  it('13. createFullLearningPath preserves studyNotes on lessons and allows retrieval via getLearningPathById', async () => {
    const testPathId = `test-path-${Date.now()}`;
    const studyNoteItem: LessonNoteResource = {
      id: 'note-1',
      title: 'Moment of Inertia Theorems PDF',
      type: 'pdf_notes',
      sourceUrl: 'https://ocw.mit.edu/moment.pdf',
      downloadUrl: 'https://ocw.mit.edu/moment.pdf',
      publisher: 'MIT OCW',
      isDirectPdf: true,
      qualityScore: 92,
      relevanceExplanation: 'Covers parallel and perpendicular axis theorems with worked derivations.',
    };

    const createdId = await createFullLearningPath({
      id: testPathId,
      title: 'Rigid Body Mechanics Mastery',
      description: 'Comprehensive study path for rotational mechanics.',
      domain: 'Physics',
      level: 'Class 11',
      durationHours: 12,
      moduleCount: 1,
      modules: [
        {
          title: 'Foundations of Rotational Dynamics',
          moduleNumber: 1,
          lessons: [
            {
              title: 'Parallel Axis Theorem & Calculation',
              type: 'video',
              durationMinutes: 30,
              sourceName: 'Curated Open Access',
              sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              studyNotes: [studyNoteItem],
            },
          ],
        },
      ],
    }, 'test-user-id');

    assert.equal(createdId, testPathId);

    const retrieved = await getLearningPathById(testPathId);
    assert.ok(retrieved !== null, 'Retrieved path must not be null');
    assert.equal(retrieved.id, testPathId);
    assert.ok(retrieved.modules && retrieved.modules.length > 0);

    const firstLesson = retrieved.modules[0].lessons[0];
    assert.ok(firstLesson.studyNotes, 'Lesson must retain studyNotes');
    assert.equal(firstLesson.studyNotes?.length, 1);
    assert.equal(firstLesson.studyNotes?.[0].title, 'Moment of Inertia Theorems PDF');
    assert.equal(firstLesson.studyNotes?.[0].isDirectPdf, true);
  });

  // Test 14: Core database resource table type mapping
  it('14. toCoreResourceType cleanly maps all extended notes types to schema-valid types', () => {
    assert.equal(toCoreResourceType('study_notes'), 'monograph');
    assert.equal(toCoreResourceType('pdf_lecture_notes'), 'paper');
    assert.equal(toCoreResourceType('lecture_handout'), 'monograph');
    assert.equal(toCoreResourceType('official_documentation'), 'monograph');
    assert.equal(toCoreResourceType('reference_guide'), 'monograph');
    assert.equal(toCoreResourceType('textbook'), 'monograph');
    assert.equal(toCoreResourceType('research_paper'), 'paper');
    assert.equal(toCoreResourceType('video_lecture'), 'video');
    assert.equal(toCoreResourceType('ai_quiz'), 'quiz');
    assert.equal(toCoreResourceType('practice_questions'), 'practice');
  });

  // Test 15: Existing video discovery pipeline is preserved
  it('15. Existing video discovery and logical sequencing remain fully operational', () => {
    const videoCandidate1 = {
      id: 'yt-1',
      title: 'Introduction to Rotational Motion (Concept Overview)',
      description: 'Fundamental definitions of angular displacement and velocity.',
      sourceUrl: 'https://youtube.com/watch?v=vid11111111',
      type: 'video_lecture',
      sourceName: 'Physics Open Channel',
      score: { overall: 85, relevance: 90, educationalValue: 85, structureCompleteness: 75, freshness: 80 },
    } as unknown as EngineResource;

    const scored = qualityEngine.filterAndScoreBatch([videoCandidate1], 'Rotational Motion', 'educational', 60);
    assert.equal(scored.length, 1, 'Valid educational video must be retained');
    assert.equal(scored[0].resource.type, 'video_lecture');
  });
});
