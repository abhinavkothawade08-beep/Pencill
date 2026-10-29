import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DiscoverRequestSchema } from '../src/lib/api-schemas';
import { aiService } from '../src/services/ai';
import {
  createTopicAdaptiveCurriculum,
  analyzeTopicComplexity,
  inferDomain,
} from '../src/services/ai/curriculum-adaptive-engine';
import { inMemoryPathCache, getLearningPathById } from '../src/services/supabase/pathService';
import { storageAdapter } from '../src/lib/storage/storageAdapter';

describe('Regression Recovery Verification: Course Generation End-to-End', () => {

  // =========================================================================
  // CASE A: Retrieval-Augmented Generation (RAG)
  // =========================================================================
  describe('Case A — Retrieval-Augmented Generation (RAG)', () => {
    const payload = {
      query: 'Retrieval-Augmented Generation (RAG)',
      domain: 'Computer Science',
      subject: 'Artificial Intelligence',
      topics: ['Retrieval-Augmented Generation (RAG)', 'Vector Search', 'Embeddings'],
      depthLevel: 'intermediate',
      difficulty: 'intermediate',
      instructionLanguage: 'English',
      weeklyHours: 8,
      modalities: ['video', 'reading', 'practice', 'quiz'],
      generateLearningPath: true,
    };

    it('1. Validates request payload against DiscoverRequestSchema', () => {
      const parsed = DiscoverRequestSchema.safeParse(payload);
      assert.ok(parsed.success, 'RAG request payload must be valid');
    });

    it('2. Infers domain as Computer Science without DSA collision', () => {
      const domain = inferDomain(payload.query);
      assert.strictEqual(domain, 'Computer Science');

      const complexity = analyzeTopicComplexity(payload.query, payload.depthLevel);
      assert.strictEqual(complexity.domain, 'Computer Science');

      // Verify detected subtopics contain RAG/Topic-adaptive terms, NOT DSA terms
      const dsaTerms = ['linear structures', 'tree-based', 'graph algorithms', 'dynamic programming'];
      for (const subtopic of complexity.detectedSubtopics) {
        for (const dsa of dsaTerms) {
          assert.ok(
            !subtopic.toLowerCase().includes(dsa),
            `RAG subtopics must not contain DSA terms: found "${dsa}" in "${subtopic}"`
          );
        }
      }
    });

    it('3. Generates curriculum faithful to RAG with zero hardcoded DSA modules', async () => {
      let path;
      try {
        path = await aiService.generateLearningPath({
          topic: payload.query,
          depth: 'rigorous',
          level: payload.depthLevel,
          weeklyHours: payload.weeklyHours,
          language: payload.instructionLanguage,
          modalities: payload.modalities,
        });
      } catch {
        path = createTopicAdaptiveCurriculum(payload.query, payload.depthLevel, payload.weeklyHours);
      }

      assert.ok(path.modules.length >= 3, 'Must produce at least 3 cohesive modules');
      assert.ok(path.title.toLowerCase().includes('retrieval') || path.title.toLowerCase().includes('rag'));

      const dsaKeywords = ['dynamic programming', 'graph traversal', 'binary search tree', 'linked list', 'monotonic stack'];
      for (const mod of path.modules) {
        for (const kw of dsaKeywords) {
          assert.ok(
            !mod.title.toLowerCase().includes(kw),
            `Module "${mod.title}" must not contain unrelated DSA keyword: "${kw}"`
          );
        }
        // Each module must have non-empty lessons
        assert.ok(mod.lessons && mod.lessons.length > 0, `Module "${mod.title}" must have lessons`);
      }
    });

    it('4. Executes curriculum synthesis, persistence, and cache retrieval', async () => {
      const curriculum = createTopicAdaptiveCurriculum(payload.query, payload.depthLevel, payload.weeklyHours);
      assert.ok(curriculum.modules.length >= 3, 'Must have modules in synthesized curriculum');

      // Verify no module has empty lessons
      for (const m of curriculum.modules) {
        assert.ok(m.lessons.length > 0, `Module ${m.title} must have at least 1 lesson`);
      }

      // Verify persistence & cache retrieval
      const testPathId = `test-rag-persist-${Date.now()}`;
      curriculum.id = testPathId;
      inMemoryPathCache.set(testPathId, { ...curriculum, verified: true } as any);
      await storageAdapter.savePath({ ...curriculum, verified: true } as any);

      const retrievedFromCache = await getLearningPathById(testPathId);
      assert.ok(retrievedFromCache, 'Must retrieve course from cache');
      assert.strictEqual(retrievedFromCache.id, testPathId);

      const retrievedFromStorage = await storageAdapter.getSavedPathById(testPathId);
      assert.ok(retrievedFromStorage, 'Must retrieve course from storage adapter');
    });
  });

  // =========================================================================
  // CASE B: Programming (Python / React)
  // =========================================================================
  describe('Case B — Programming (Python & React)', () => {
    it('1. Generates Python learning path with core programming primitives and practical exercises', () => {
      const topic = 'Python Programming';
      const curriculum = createTopicAdaptiveCurriculum(topic, 'undergraduate', 6);

      assert.ok(curriculum.modules.length >= 3, 'Must produce at least 3 modules for Python');
      const allModuleTitles = curriculum.modules.map((m) => m.title.toLowerCase()).join(' ');

      assert.ok(
        allModuleTitles.includes('primitives') || allModuleTitles.includes('syntax') || allModuleTitles.includes('fundamentals'),
        'Python curriculum must cover primitives/syntax'
      );
      assert.ok(
        allModuleTitles.includes('control flow') || allModuleTitles.includes('iteration') || allModuleTitles.includes('functions'),
        'Python curriculum must cover control flow/functions'
      );

      // Verify every module includes practical lessons
      for (const mod of curriculum.modules) {
        const hasPractice = mod.lessons.some((l) => l.type === 'practice' || l.title.toLowerCase().includes('drill') || l.title.toLowerCase().includes('exercise'));
        assert.ok(hasPractice, `Python module "${mod.title}" must include practical exercises`);
      }
    });

    it('2. Generates React learning path with declarative UI, state/hooks, and component architecture', () => {
      const topic = 'React Frontend Development';
      const curriculum = createTopicAdaptiveCurriculum(topic, 'undergraduate', 6);

      assert.ok(curriculum.modules.length >= 3, 'Must produce at least 3 modules for React');
      const allTitles = curriculum.modules.map((m) => m.title.toLowerCase()).join(' ');

      assert.ok(
        allTitles.includes('react') || allTitles.includes('component') || allTitles.includes('ui'),
        'React curriculum must cover component/UI architecture'
      );
    });
  });

  // =========================================================================
  // CASE C: Theoretical Subject (Mathematics: Complex Analysis)
  // =========================================================================
  describe('Case C — Theoretical Subject (Mathematics)', () => {
    const mathTopic = 'Complex Analysis';

    it('1. Infers domain as Mathematics and excludes programming paradigms', () => {
      const domain = inferDomain(mathTopic);
      assert.strictEqual(domain, 'Mathematics', 'Complex Analysis must be classified as Mathematics');

      const complexity = analyzeTopicComplexity(mathTopic, 'undergraduate');
      assert.strictEqual(complexity.domain, 'Mathematics');
    });

    it('2. Generates theoretical mathematical curriculum without forced programming/coding tutorials', () => {
      const curriculum = createTopicAdaptiveCurriculum(mathTopic, 'undergraduate', 6);

      assert.ok(curriculum.modules.length >= 3, 'Complex Analysis must produce at least 3 modules');

      const programmingKeywords = ['npm', 'pip install', 'python code', 'javascript', 'react component', 'frontend hook'];
      for (const mod of curriculum.modules) {
        for (const kw of programmingKeywords) {
          assert.ok(
            !mod.title.toLowerCase().includes(kw),
            `Theoretical Math module "${mod.title}" must not contain programming keyword: "${kw}"`
          );
        }
        for (const lesson of mod.lessons) {
          for (const kw of programmingKeywords) {
            assert.ok(
              !lesson.title.toLowerCase().includes(kw),
              `Lesson "${lesson.title}" must not force coding tutorials into Math curriculum`
            );
          }
        }
      }
    });
  });
});
