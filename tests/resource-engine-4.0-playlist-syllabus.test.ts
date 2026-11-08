import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ResourceEngineOrchestrator } from '../src/lib/resource-engine/orchestrator';
import { PlaylistIntelligenceSystem } from '../src/lib/resource-engine/playlist-intelligence';
import { SyllabusCoverageEngine } from '../src/lib/resource-engine/syllabus-coverage-engine';
import { ReadingMaterialProvider } from '../src/lib/resource-engine/providers/reading-provider';
import { calculateDynamicResourceLimits } from '../src/lib/resource-engine/distributor';
import { LearnerGoalInput, ModulePlan } from '../src/lib/resource-engine/types';

describe('PENCILL RESOURCE ENGINE 4.0: Intelligent Playlist Discovery & Syllabus Coverage Matrix', () => {
  const playlistSystem = PlaylistIntelligenceSystem.getInstance();
  const syllabusEngine = new SyllabusCoverageEngine();
  const readingProvider = new ReadingMaterialProvider();

  describe('1. Intelligent YouTube Playlist Discovery', () => {
    it('discovers and evaluates primary educational playlist for CA Final Financial Reporting', async () => {
      const modulePlan: ModulePlan = {
        id: 'mod-ind-as-109',
        moduleNumber: 1,
        title: 'Ind AS 109: Financial Instruments - Recognition, Measurement & ECL',
        description: 'Comprehensive coverage of Ind AS 109 financial assets, liabilities, amortised cost, FVTOCI, FVTPL, and ECL model.',
        learningObjectives: [
          {
            id: 'obj-109-1',
            statement: 'Classification and measurement of financial assets at amortised cost, FVTOCI and FVTPL',
            keyTerms: ['classification', 'measurement', 'amortised cost', 'fvtoci', 'fvtpl'],
          },
          {
            id: 'obj-109-2',
            statement: 'Expected credit loss 3-stage impairment model calculation',
            keyTerms: ['ecl', 'expected credit loss', 'impairment', '3-stage'],
          },
          {
            id: 'obj-109-3',
            statement: 'Hedge accounting and derivative accounting fundamentals',
            keyTerms: ['hedge accounting', 'derivative', 'hedged item'],
          },
        ],
        estimatedHours: 4,
        expectedOutcomes: ['Solve CA Final problems on Ind AS 109'],
        searchQueries: {
          videoQueries: ['CA Final Ind AS 109 Financial Instruments lecture'],
          readingQueries: ['ICAI Study Material Ind AS 109'],
        },
        prerequisites: ['Ind AS 1: Presentation of Financial Statements'],
      };

      const results = await playlistSystem.discoverPlaylists('CA Final Ind AS 109 Financial Instruments', {
        topic: 'CA Final Financial Reporting',
        modulePlan,
        domain: 'business_and_economics',
      });

      assert.ok(results.length > 0, 'Must discover at least one playlist evaluation result');
      const primary = results[0];
      assert.ok(primary.playlist, 'Must contain a valid playlist resource');
      assert.ok(primary.playlist.id, 'Playlist must have an authentic id');
      assert.ok(primary.playlist.playlistUrl.startsWith('https://www.youtube.com/playlist?list='), 'Playlist must have authentic canonical URL');
      assert.ok(primary.playlist.items && primary.playlist.items.length >= 3, 'Playlist must contain expanded items/lectures');
      assert.ok(primary.playlist.channelName, 'Playlist must identify the instructor / channel');
      assert.ok(primary.score >= 50, `Playlist evaluation score must be >= 50 (got ${primary.score})`);
      assert.equal(
        primary.recommendationHierarchy,
        'A_COMPLETE_PRIMARY',
        'Should recommend as complete primary playlist for well-matched syllabus'
      );
    });

    it('expands playlist items in sequence with authentic IDs and durations', async () => {
      const modulePlan: ModulePlan = {
        id: 'mod-ind-as-115',
        moduleNumber: 2,
        title: 'Ind AS 115: Revenue from Contracts with Customers',
        description: '5-step model for revenue recognition, contract costs, and transaction price allocation.',
        learningObjectives: [
          {
            id: 'obj-115-1',
            statement: 'Master the 5-step revenue recognition framework under Ind AS 115',
            keyTerms: ['5-step', 'revenue recognition', 'contracts'],
          },
          {
            id: 'obj-115-2',
            statement: 'Performance obligation identification and transaction price allocation',
            keyTerms: ['performance obligation', 'transaction price'],
          },
          {
            id: 'obj-115-3',
            statement: 'Variable consideration and contract modifications accounting',
            keyTerms: ['variable consideration', 'contract modification'],
          },
        ],
        estimatedHours: 4,
        expectedOutcomes: ['Apply Ind AS 115 5-step model to contract revenue'],
        searchQueries: {
          videoQueries: ['Ind AS 115 Revenue from Contracts with Customers lecture'],
          readingQueries: ['ICAI Ind AS 115 Study Material'],
        },
        prerequisites: [],
      };

      const results = await playlistSystem.discoverPlaylists('Ind AS 115 Revenue from Contracts', {
        topic: 'CA Final Financial Reporting',
        modulePlan,
        domain: 'business_and_economics',
      });

      assert.ok(results.length > 0, 'Must return Ind AS 115 playlist');
      const pl = results[0].playlist;
      assert.ok(pl.itemCount >= 3, 'Item count must be at least 3');
      assert.ok(pl.items && pl.items.length >= 3, 'Playlist must have expanded items');

      // Verify sequence order
      pl.items.forEach((item, idx) => {
        assert.equal(item.sequenceNumber, idx + 1, `Item sequenceNumber must match index ${idx + 1}`);
        assert.ok(item.videoId, 'Item must have valid videoId');
        assert.ok(item.videoUrl.includes(item.videoId), 'Item URL must contain videoId');
        assert.ok(item.title && item.title.length > 5, 'Item must have descriptive title');
        assert.ok((item.durationSeconds || 0) > 0, 'Item must have valid duration');
      });
    });

    it('recommends STEM and CS playlists with high syllabus coverage', async () => {
      const modulePlan: ModulePlan = {
        id: 'mod-cs-dsa',
        moduleNumber: 1,
        title: 'Graph Algorithms & Shortest Path Problems',
        description: 'Dijkstra, Bellman-Ford, Floyd-Warshall and Minimum Spanning Trees.',
        learningObjectives: [
          {
            id: 'obj-dsa-1',
            statement: 'Dijkstra shortest path algorithm implementation and complexity',
            keyTerms: ['dijkstra', 'shortest path', 'graph'],
          },
          {
            id: 'obj-dsa-2',
            statement: 'Bellman-Ford algorithm and negative cycle detection',
            keyTerms: ['bellman-ford', 'negative cycle'],
          },
          {
            id: 'obj-dsa-3',
            statement: 'Prim and Kruskal algorithms for Minimum Spanning Trees',
            keyTerms: ['prim', 'kruskal', 'minimum spanning tree'],
          },
        ],
        estimatedHours: 4,
        expectedOutcomes: ['Implement shortest path and spanning tree algorithms in code'],
        searchQueries: {
          videoQueries: ['Graph Algorithms Dijkstra Bellman-Ford tutorial'],
          readingQueries: ['Graph algorithms documentation'],
        },
        prerequisites: [],
      };

      const results = await playlistSystem.discoverPlaylists('Graph Algorithms Dijkstra Bellman-Ford', {
        topic: 'Data Structures and Algorithms',
        modulePlan,
        domain: 'computer_science',
      });

      assert.ok(results.length > 0, 'Must find CS algorithms playlist');
      assert.ok(results[0].playlist.title.toLowerCase().includes('algorithm') || results[0].playlist.title.toLowerCase().includes('graph'));
    });
  });

  describe('2. Real Syllabus Coverage Engine & Matrix', () => {
    it('decomposes CA Final modules into specific subtopics with ICAI PYQ mappings', () => {
      const modulePlan: ModulePlan = {
        id: 'mod-ind-as-109',
        moduleNumber: 1,
        title: 'Ind AS 109: Financial Instruments',
        description: 'Comprehensive coverage of classification, measurement, ECL and hedge accounting.',
        learningObjectives: [
          {
            id: 'obj-109-1',
            statement: 'Classification and measurement of financial assets at amortised cost, FVTOCI and FVTPL',
            keyTerms: ['classification', 'amortised cost'],
          },
          {
            id: 'obj-109-2',
            statement: 'Expected credit loss 3-stage impairment model calculation',
            keyTerms: ['ecl', 'expected credit loss'],
          },
          {
            id: 'obj-109-3',
            statement: 'Hedge accounting and derivative accounting fundamentals',
            keyTerms: ['hedge accounting', 'derivatives'],
          },
        ],
        estimatedHours: 4,
        expectedOutcomes: ['Master Ind AS 109'],
        searchQueries: { videoQueries: [], readingQueries: [] },
        prerequisites: [],
      };

      const subtopics = syllabusEngine.decomposeSubtopics(modulePlan, 'business_and_economics', 'CA Final Financial Reporting');
      assert.ok(subtopics.length >= 3, 'Must decompose into at least 3 distinct subtopics');

      // Verify domain-specific subtopic concepts
      const titles = subtopics.map((s) => s.title.toLowerCase()).join(' ');
      assert.ok(titles.includes('classification') || titles.includes('amortised'), 'Must contain classification subtopic');
      assert.ok(titles.includes('expected credit loss') || titles.includes('ecl'), 'Must contain ECL subtopic');
      assert.ok(titles.includes('hedge'), 'Must contain hedge accounting subtopic');

      // Verify ICAI PYQ tags exist on professional modules
      const hasPyq = subtopics.some((s) => s.pyqAvailable === true || (s.pyqAttribution && s.pyqAttribution.length > 0));
      assert.ok(hasPyq, 'CA Final subtopics must include ICAI Past Year Question (PYQ) mappings');
    });

    it('builds accurate SyllabusCoverageMatrix and detects uncovered subtopics', () => {
      const modulePlan: ModulePlan = {
        id: 'mod-ind-as-115',
        moduleNumber: 1,
        title: 'Ind AS 115: Revenue Recognition',
        description: '5-step model and contract accounting.',
        learningObjectives: [
          {
            id: 'obj-115-1',
            statement: 'Step 1 to 5 revenue recognition framework',
            keyTerms: ['step', 'revenue recognition'],
          },
          {
            id: 'obj-115-2',
            statement: 'Contract asset vs contract liability',
            keyTerms: ['contract asset', 'contract liability'],
          },
        ],
        estimatedHours: 4,
        expectedOutcomes: ['Apply Ind AS 115'],
        searchQueries: { videoQueries: [], readingQueries: [] },
        prerequisites: [],
      };

      const subtopics = syllabusEngine.decomposeSubtopics(modulePlan, 'business_and_economics', 'CA Final Financial Reporting');

      // Scored resources covering only the first subtopic
      const assignedVideos: any[] = [
        {
          id: 'v1',
          title: 'Ind AS 115 Step 1 and Step 2 Masterclass',
          canonicalUrl: 'https://youtube.com/watch?v=mock1',
          matchedObjectives: ['Step 1 to 5 revenue recognition framework'],
        },
      ];

      const assignedReadings: any[] = [
        {
          id: 'r1',
          title: 'ICAI Educational Material on Ind AS 115 5-Step Model',
          canonicalUrl: 'https://icai.org/indas115',
          matchedObjectives: ['Step 1 to 5 revenue recognition framework'],
        },
      ];

      const matrix = syllabusEngine.buildCoverageMatrix(
        modulePlan,
        subtopics,
        assignedVideos,
        assignedReadings,
        [] // empty study notes
      );

      assert.ok(matrix.subtopics.length === subtopics.length, 'Matrix must evaluate all subtopics');
      assert.ok(typeof matrix.overallCoveragePercent === 'number', 'Must compute overall coverage percentage');

      // Check gap detection
      const gaps = syllabusEngine.detectMissingSubtopics(matrix);
      assert.ok(Array.isArray(gaps), 'detectMissingSubtopics must return an array');
    });
  });

  describe('3. Dynamic Resource Scaling (No arbitrary caps)', () => {
    it('scales resource limits dynamically based on hours and level without hardcoded slice(0, 2)', () => {
      const modulePlan: ModulePlan = {
        id: 'mod-scale-test',
        moduleNumber: 1,
        title: 'Advanced Machine Learning & Deep Neural Architectures',
        description: 'Scalable training, attention mechanisms, and deep optimization.',
        learningObjectives: [
          { id: '1', statement: 'Gradient descent', keyTerms: ['gradient'] },
          { id: '2', statement: 'Backpropagation', keyTerms: ['backprop'] },
          { id: '3', statement: 'Convolutional networks', keyTerms: ['cnn'] },
          { id: '4', statement: 'Attention mechanisms', keyTerms: ['attention'] },
          { id: '5', statement: 'Transformer blocks', keyTerms: ['transformer'] },
        ],
        estimatedHours: 12,
        expectedOutcomes: ['Design and train deep networks'],
        searchQueries: { videoQueries: [], readingQueries: [] },
        prerequisites: [],
      };

      // Case 1: Standard introductory course with 3 objectives
      const simplePlan: ModulePlan = {
        ...modulePlan,
        learningObjectives: modulePlan.learningObjectives.slice(0, 2),
        estimatedHours: 3,
      };
      const introLimits = calculateDynamicResourceLimits(simplePlan, 'beginner', false);
      assert.equal(introLimits.maxVideos, 2);
      assert.equal(introLimits.maxReadings, 2);

      // Case 2: Deep rigorous course with 5 objectives and 12 hours (independent video track)
      const deepLimitsWithoutPlaylist = calculateDynamicResourceLimits(modulePlan, 'advanced', false);
      assert.ok(deepLimitsWithoutPlaylist.maxVideos >= 4, `Rigorous course should allow at least 4 videos without primary playlist (got ${deepLimitsWithoutPlaylist.maxVideos})`);
      assert.ok(deepLimitsWithoutPlaylist.maxReadings >= 3, `Rigorous course should allow at least 3 readings (got ${deepLimitsWithoutPlaylist.maxReadings})`);

      // Case 3: Deep rigorous course with primary playlist (compact individual videos to avoid clutter)
      const deepLimitsWithPlaylist = calculateDynamicResourceLimits(modulePlan, 'advanced', true);
      assert.ok(deepLimitsWithPlaylist.maxVideos <= 3, `When primary playlist is present, individual videos should be compact`);
      assert.ok(deepLimitsWithPlaylist.maxReadings >= 3, `Rigorous course should retain high reading limits`);
    });
  });

  describe('4. Professional Accounting & Authentic Reading Material', () => {
    it('discovers authentic ICAI study materials and guidance notes for CA Final topics', async () => {
      const results = await readingProvider.search('Ind AS 109 Financial Instruments ECL ICAI', {
        domain: 'business_and_economics',
        maxResults: 5,
      });

      assert.ok(results.length >= 2, `Must discover at least 2 professional accounting readings (got ${results.length})`);

      for (const res of results) {
        const url = res.url;
        assert.ok(url.startsWith('https://'), 'URL must be secure HTTPS');
        assert.ok(
          url.includes('icai.org') || url.includes('mca.gov.in') || url.includes('financial') || url.includes('accounting'),
          'URL must point to verified professional accounting or regulatory body'
        );
        assert.ok(res.title.length > 10, 'Reading must have substantive academic title');
        assert.ok(res.authorOrChannel || res.sourceRepository, 'Must provide verified author or institutional attribution');
      }
    });
  });

  describe('5. Targeted Module Gap Repair', () => {
    it('repairs missing subtopic gaps in a module without regenerating entire course', async () => {
      const orchestrator = new ResourceEngineOrchestrator();

      // First create a learning path
      const input: LearnerGoalInput = {
        topic: 'CA Final Financial Reporting',
        level: 'advanced',
        learningGoal: 'master_subject',
        learningStyle: 'balanced',
        weeklyStudyHours: 8,
        targetWeeks: 2,
        language: 'en',
        depth: 'rigorous',
      };

      const result = await orchestrator.execute(input, 'test-user-repair');
      assert.ok(result.success, 'Course generation must succeed');
      assert.ok(result.course, 'Course must be returned');
      assert.ok(result.course.modules && result.course.modules.length > 0, 'Course must have modules');

      const targetModule = result.course.modules[0];
      const initialLessonCount = targetModule.lessons ? targetModule.lessons.length : 0;

      // Run gap repair on Module 0
      const repairResult = await orchestrator.repairModuleGaps(
        result.course.title,
        result.course.domain || 'business_and_economics',
        result.course.level || 'advanced',
        {
          id: targetModule.id,
          title: targetModule.title,
          objective: targetModule.objective,
          moduleNumber: 1,
          lessons: targetModule.lessons || [],
          subtopics: (targetModule as any).subtopics,
          syllabusMatrix: (targetModule as any).syllabusMatrix,
        }
      );

      assert.ok(repairResult.updatedMatrix, 'Updated matrix must be returned');
      assert.ok(Array.isArray(repairResult.updatedLessons), 'Updated lessons must be returned');
      assert.ok(
        repairResult.updatedLessons.length >= initialLessonCount,
        'Gap repair must preserve existing lessons'
      );
    });
  });

  describe('6. Full Real-World CA Final Financial Reporting Synthesis', () => {
    it('synthesizes complete CA Final course with playlist integration, syllabus matrix, and zero regressions', async () => {
      const orchestrator = new ResourceEngineOrchestrator();
      const input: LearnerGoalInput = {
        topic: 'CA Final Financial Reporting',
        level: 'advanced',
        learningGoal: 'prepare_exam',
        learningStyle: 'balanced',
        weeklyStudyHours: 12,
        targetWeeks: 4,
        language: 'en',
        depth: 'rigorous',
      };

      const result = await orchestrator.execute(input, 'test-user-ca-final');

      // 1. Success & Architecture
      assert.equal(result.success, true, 'Synthesis must succeed');
      assert.ok(result.courseId, 'Course ID must exist');
      assert.ok(result.curriculum.modules.length >= 2, 'Must generate multiple cohesive modules');

      // 2. Module Relevance (Ind AS 109 / 115)
      const moduleTitles = result.curriculum.modules.map((m) => m.title.toLowerCase()).join(' ');
      assert.ok(
        moduleTitles.includes('ind as') || moduleTitles.includes('financial') || moduleTitles.includes('reporting'),
        'Modules must reflect CA Final Ind AS curriculum'
      );

      // 3. Primary Playlist Attachment
      const modulesWithPlaylist = result.assignments.filter((a) => a.primaryPlaylist);
      assert.ok(modulesWithPlaylist.length > 0, 'At least one module must have a verified primary playlist assigned');

      const primary = modulesWithPlaylist[0].primaryPlaylist!;
      assert.ok(primary.id, 'Primary playlist must have id');
      assert.ok(primary.items && primary.items.length >= 3, 'Primary playlist must have expanded items');

      // 4. Syllabus Matrix Population
      result.assignments.forEach((assignment, idx) => {
        assert.ok(assignment.syllabusMatrix, `Module ${idx + 1} must have a syllabusMatrix`);
        assert.ok(assignment.syllabusMatrix.subtopics.length > 0, `Module ${idx + 1} must have decomposed subtopics`);
        assert.ok(assignment.syllabusMatrix.overallCoveragePercent > 0, `Module ${idx + 1} coverage must be > 0%`);
      });

      // 5. Authentic Reading Materials
      const allReadings = result.assignments.flatMap((a) => a.readings);
      assert.ok(allReadings.length >= 2, 'Course must have authoritative reading materials');
      const icaiReading = allReadings.find((r) => {
        const urlStr = r.canonicalUrl || r.url || '';
        return urlStr.includes('icai.org') || r.title.includes('Ind AS');
      });
      assert.ok(icaiReading, 'Must include Ind AS / ICAI authoritative educational material');

      // 6. Formative Checkpoint Quizzes
      result.assignments.forEach((assignment, idx) => {
        assert.ok(assignment.quiz, `Module ${idx + 1} must have a functional quiz`);
        assert.ok(assignment.quiz.questions.length >= 4, `Module ${idx + 1} quiz must have >= 4 questions`);
        assignment.quiz.questions.forEach((q) => {
          assert.equal(q.options.length, 4, 'Quiz questions must have 4 options');
          assert.ok(q.explanation && q.explanation.length > 15, 'Quiz questions must have pedagogical explanation');
        });
      });

      // 7. Course Quality Gates
      assert.ok(result.qualityGates, 'Quality gates must be evaluated');
      assert.equal(result.qualityGates.allPassed, true, 'All quality gates must pass');
      assert.equal(result.qualityGates.resourceValidity.status, 'PASSED');
      assert.equal(result.qualityGates.assessmentValidity.status, 'PASSED');

      // 8. Persistence Verification
      assert.ok(result.course, 'Persisted course must exist');
      assert.ok(result.course.modules && result.course.modules.length > 0, 'Course must have modules');
      const persistedMod = (result.course.modules as any)[0];
      assert.ok(persistedMod.syllabusMatrix, 'Persisted module must store syllabusMatrix');
    });
  });
});
