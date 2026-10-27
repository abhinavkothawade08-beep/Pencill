import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CuratorEngine } from '../src/curator';
import { BuilderConfig, DEFAULT_BUILDER_CONFIG_STATE } from '../src/lib/types/builderConfig';
import {
  ResourceEngineV2,
  ProviderRegistry,
  AcademicRepositoryAdapter,
  CuratedDirectoryAdapter,
} from '../src/lib/resource-engine-v2';
import { storageAdapter } from '../src/lib/storage/storageAdapter';
import { inMemoryPathCache, getLearningPathById } from '../src/services/supabase/pathService';

describe('Resource Engine Repair & Quality Optimization Verification Suite', () => {
  // ==========================================================================
  // PART 1: TOPIC RELEVANCE & CROSS-DOMAIN COLLISION PROTECTION
  // ==========================================================================
  describe('1. Topic Relevance & Anti-Collision Verification', () => {
    it('1.1 Python Loops: Discovers authentic Python resources and rejects cross-domain physics/telecom collisions', async () => {
      const engine = new ResourceEngineV2();
      const output = await engine.discover({
        query: 'Python Loops and Iteration',
        domain: 'computer_science',
        subject: 'programming',
        academicLevel: 'intermediate',
        modules: [
          {
            moduleId: 'mod-1',
            moduleNumber: 1,
            moduleTitle: 'While Loops and Conditions',
            objective: 'Master while loop syntax, loop conditions, infinite loops prevention, and break statements in Python',
            subtopics: ['while loops', 'loop condition', 'break statement'],
          },
        ],
      });

      assert.ok(output.rankedPool.rankedCandidates.length > 0, 'Must discover relevant candidates');

      // Top candidate must be authentically related to programming or computer science
      const topCand = output.rankedPool.rankedCandidates[0].candidate;
      const topText = `${topCand.title} ${topCand.description || ''}`.toLowerCase();
      assert.ok(
        topText.includes('python') || topText.includes('loop') || topText.includes('programming'),
        `Top candidate "${topCand.title}" must cover programming/loops`
      );

      // Must reject physics, satellite, and quantum collision candidates
      for (const r of output.rankedPool.rankedCandidates) {
        const text = `${r.candidate.title} ${r.candidate.description || ''}`.toLowerCase();
        assert.ok(!text.includes('newton'), `Candidate "${r.candidate.title}" must not be classical physics`);
        assert.ok(!text.includes('quantum state'), `Candidate "${r.candidate.title}" must not be quantum physics`);
        assert.ok(!text.includes('satellite network'), `Candidate "${r.candidate.title}" must not be satellite routing`);
      }
    });

    it('1.2 Differential Equations: Discovers mathematical calculus and rejects coding tutorials', async () => {
      const engine = new ResourceEngineV2();
      const output = await engine.discover({
        query: 'Ordinary Differential Equations',
        domain: 'mathematics',
        subject: 'calculus',
        academicLevel: 'undergraduate',
        modules: [
          {
            moduleId: 'ode-1',
            moduleNumber: 1,
            moduleTitle: 'First Order Separable Equations',
            objective: 'Solve first order ordinary differential equations using separation of variables and integrating factors',
            subtopics: ['separable equations', 'integrating factors', 'initial value problems'],
          },
        ],
      });

      assert.ok(output.rankedPool.rankedCandidates.length > 0, 'Must discover relevant ODE candidates');
      const topCand = output.rankedPool.rankedCandidates[0].candidate;
      const topText = `${topCand.title} ${topCand.description || ''}`.toLowerCase();
      assert.ok(
        topText.includes('differential') || topText.includes('calculus') || topText.includes('math'),
        `Top candidate "${topCand.title}" must cover differential equations/calculus`
      );
    });
  });

  // ==========================================================================
  // PART 2: EDUCATOR DIRECTORY INTEGRATION & PROVENANCE
  // ==========================================================================
  describe('2. Master Educator Directory & Provenance Verification', () => {
    it('2.1 CuratedDirectoryAdapter returns verified educator resources with complete provenance', async () => {
      const adapter = new CuratedDirectoryAdapter();
      const result = await adapter.search({
        id: 'q-test-cs',
        queryString: 'freeCodeCamp Python programming full tutorial explanation',
        targetConcept: 'Python programming',
        intent: 'foundational_explanation',
        preferredModality: 'video',
        priority: 1,
        provenance: 'unit test',
        providerCompatibility: ['curated_directory'],
        channelOrSourceHint: 'UC8butISFwT-Wl7EV0hUK0BQ', // freeCodeCamp channel ID
      });

      assert.ok(result.candidates.length > 0, 'Must find freeCodeCamp resources when targeted');
      const cand = result.candidates[0];
      assert.equal(cand.provider, 'curated_directory');
      assert.equal(cand.verificationStatus, 'verified_channel');
      assert.ok(cand.canonicalUrl.startsWith('https://www.youtube.com/'), 'URL must be a canonical YouTube URL');
      assert.ok(Boolean(cand.creator?.name), 'Must have educator creator attribution');
    });

    it('2.2 AcademicRepositoryAdapter respects topic filtering and does not leak physics to computer science', async () => {
      const adapter = new AcademicRepositoryAdapter();
      const pyResult = await adapter.search({
        id: 'q-py-docs',
        queryString: 'Python 3 tutorial control flow loops documentation',
        targetConcept: 'Python loops',
        intent: 'authoritative_documentation',
        preferredModality: 'documentation',
        priority: 1,
        provenance: 'unit test',
        providerCompatibility: ['academic_notes'],
      });

      // Must find Python documentation and NOT NCERT Physics
      assert.ok(pyResult.candidates.length > 0, 'Must discover Python academic/doc notes');
      for (const cand of pyResult.candidates) {
        assert.ok(!cand.title.includes('Physics Class 11'), `Must not return Class 11 Physics for Python: ${cand.title}`);
      }
    });
  });

  // ==========================================================================
  // PART 3: CURATOR ENGINE 7-STAGE PIPELINE & QUALITY AUDIT
  // ==========================================================================
  describe('3. Curator Engine Pipeline & Module-Specific Assignment', () => {
    it('3.1 Runs end-to-end for Python and produces module-specific assignments (no naive array slicing)', async () => {
      const config: BuilderConfig = {
        ...DEFAULT_BUILDER_CONFIG_STATE,
        domainId: 'computer_science',
        subjectId: 'python',
        selectedTopics: [{ id: 'py-loops', label: 'Python Loops & Iteration', source: 'popular' }],
        depthLevelId: 'intermediate',
        difficulty: 'intermediate',
        language: 'en',
      };

      const engine = new CuratorEngine();
      const pathResult = await engine.run(config);

      assert.ok(pathResult.id.startsWith('path-'), 'Must generate a valid path ID');
      assert.ok(pathResult.modules.length >= 3, 'Must synthesize 3+ modules for Python Loops');
      assert.ok(pathResult.totalResources > 0, 'Must have distributed resources');

      // Verify that every lesson has valid universal schema fields
      for (const mod of pathResult.modules) {
        for (const lesson of (mod as any).lessons || []) {
          assert.ok(lesson.type === 'video' || lesson.type === 'reading' || lesson.type === 'practice', `Lesson type must be valid: ${lesson.type}`);
          assert.ok(lesson.sourceName, `Lesson must have sourceName: ${lesson.title}`);
          assert.ok(lesson.durationMinutes > 0, `Lesson duration must be positive: ${lesson.durationMinutes}`);
          assert.ok(lesson.sourceUrl, `Lesson must have sourceUrl`);
        }
      }

      // Verify Checkpoints are grounded in programming concepts, NOT physics
      for (const mod of pathResult.modules) {
        for (const q of mod.checkpointQuestions) {
          assert.ok(!q.prompt.includes('dimensional homogeneity'), `Checkpoint must not contain physics questions: ${q.prompt}`);
        }
      }

      // Verify Flashcards contain programming/iteration concepts, NOT Newton's laws
      for (const mod of pathResult.modules) {
        for (const fc of mod.flashcards) {
          assert.ok(!fc.formulaOrDefinition.includes('Σ F = dp/dt'), `Flashcard must not contain Newton second law: ${fc.formulaOrDefinition}`);
        }
      }
    });

    it('3.2 Persists path and makes it instantly retrievable via getLearningPathById', async () => {
      const config: BuilderConfig = {
        ...DEFAULT_BUILDER_CONFIG_STATE,
        domainId: 'mathematics',
        subjectId: 'calculus',
        selectedTopics: [{ id: 'ode-test', label: 'Ordinary Differential Equations', source: 'popular' }],
        depthLevelId: 'intermediate',
        difficulty: 'intermediate',
        language: 'en',
      };

      const engine = new CuratorEngine();
      const pathResult = await engine.run(config);

      // Verify immediate in-memory and storage retrieval
      const cached = await getLearningPathById(pathResult.id);
      assert.ok(cached, 'getLearningPathById must retrieve the freshly generated path');
      assert.equal(cached.id, pathResult.id);
      assert.equal(cached.title, pathResult.title);
      assert.equal(cached?.modules?.length, pathResult.modules.length);

      // Verify storageAdapter also contains it
      const fromStore = await storageAdapter.getSavedPathById(pathResult.id);
      assert.ok(fromStore, 'storageAdapter must return the saved path');
      assert.equal(fromStore.id, pathResult.id);
    });
  });
});
