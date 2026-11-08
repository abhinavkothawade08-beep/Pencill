import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractCanonicalVideoId,
  canonicalizeWatchUrl,
  buildPlaylistCoverageMap,
  isExactVideoInPlaylist,
  isTopicCoveredByPlaylist,
  deduplicateModuleVideosAgainstPlaylist,
  selectBestPlaylist,
  sanitizeModuleLessonsAgainstPlaylist,
} from '../src/lib/resource-engine/playlist-deduplication';
import {
  distributeAndSequenceModuleResources,
  calculateDynamicResourceLimits,
} from '../src/lib/resource-engine/distributor';
import { validateCurriculumCoverage } from '../src/lib/resource-engine/coverage-validator';
import { repairCourseVideoDuplicates } from '../src/services/supabase/pathService';
import {
  ModulePlan,
  ScoredResource,
  PlaylistResource,
  PlaylistItem,
  SyllabusSubtopic,
  GeneratedStudyNote,
  GeneratedQuiz,
  CurriculumPlan,
  ModuleResourceAssignment,
} from '../src/lib/resource-engine/types';
import { LearningPath, Lesson } from '../src/types';

function createMockVideo(params: {
  id: string;
  title: string;
  url: string;
  externalId: string;
  combinedScore?: number;
  matchedObjectives?: string[];
  isUserCreated?: boolean;
}): ScoredResource {
  return {
    id: params.id,
    title: params.title,
    providerId: 'youtube_data_api',
    canonicalUrl: params.url,
    url: params.url,
    externalId: params.externalId,
    authorOrChannel: 'Academic Faculty',
    durationMinutes: 30,
    durationSeconds: 1800,
    isEmbeddable: true,
    isVerifiedEducator: true,
    discoverySource: 'master_educator_directory',
    description: params.title,
    modality: 'lecture',
    relevanceScore: params.combinedScore || 85,
    pedagogicalScore: params.combinedScore || 85,
    combinedScore: params.combinedScore || 85,
    qualityScore: params.combinedScore || 85,
    passedRelevanceGate: true,
    matchedObjectives: params.matchedObjectives || [],
    isUserCreated: params.isUserCreated,
    scoringFactors: { relevanceScore: 85, pedagogicalScore: 85, qualityMultiplier: 1, freshnessScore: 85 },
  } as unknown as ScoredResource;
}

function createMockReading(params: {
  id: string;
  title: string;
  url: string;
  matchedObjectives?: string[];
}): ScoredResource {
  return {
    id: params.id,
    title: params.title,
    providerId: 'reading_directory',
    canonicalUrl: params.url,
    url: params.url,
    externalId: params.id,
    authorOrChannel: 'Open University Press',
    durationMinutes: 20,
    durationSeconds: 1200,
    isEmbeddable: false,
    isVerifiedEducator: true,
    discoverySource: 'official_docs',
    description: params.title,
    modality: 'monograph',
    relevanceScore: 90,
    pedagogicalScore: 90,
    combinedScore: 90,
    qualityScore: 90,
    passedRelevanceGate: true,
    matchedObjectives: params.matchedObjectives || [],
    scoringFactors: { relevanceScore: 90, pedagogicalScore: 90, qualityMultiplier: 1, freshnessScore: 90 },
  } as unknown as ScoredResource;
}

describe('Playlist-Aware Resource Deduplication Engine', () => {
  const baseModulePlan: ModulePlan = {
    id: 'mod-indas-109',
    moduleNumber: 1,
    title: 'Financial Instruments: Classification and Measurement (Ind AS 109)',
    description: 'Comprehensive analysis of financial assets, amortised cost, and impairment under Ind AS 109.',
    learningObjectives: [
      {
        id: 'obj-1',
        statement: 'Understand business model assessment and SPPI contractual cash flow test',
        keyTerms: ['business model', 'SPPI', 'cash flow'],
      },
      {
        id: 'obj-2',
        statement: 'Apply Amortised Cost, FVTOCI, and FVTPL classification criteria',
        keyTerms: ['Amortised Cost', 'FVTOCI', 'FVTPL'],
      },
      {
        id: 'obj-3',
        statement: 'Model Expected Credit Loss (ECL) three-stage impairment methodology',
        keyTerms: ['Expected Credit Loss', 'ECL', 'impairment', 'credit risk'],
      },
      {
        id: 'obj-4',
        statement: 'Execute Fair Value Hedge Accounting and effectiveness testing',
        keyTerms: ['Hedge Accounting', 'Fair Value Hedge', 'hedging instrument'],
      },
    ],
    prerequisites: ['Basic accounting and Ind AS 32'],
    estimatedHours: 6,
    expectedOutcomes: ['Master classification, measurement, and impairment of financial instruments'],
    searchQueries: {
      videoQueries: ['Ind AS 109 Financial Instruments', 'Expected Credit Loss CA Final'],
      readingQueries: ['Ind AS 109 ICAI Study Material'],
    },
  };

  const sampleStudyNotes: GeneratedStudyNote[] = [
    {
      id: 'sn-indas-109',
      title: 'Ind AS 109 Classification and Measurement Monograph',
      type: 'study_notes',
      estimatedReadingMinutes: 20,
      overview: 'Rigorous conceptual foundation for debt and equity financial instruments.',
      keyConcepts: [
        { term: 'SPPI Test', explanation: 'Solely Payments of Principal and Interest test on contractual dates.' },
        { term: 'ECL Model', explanation: 'Forward-looking three-stage expected credit loss framework.' },
      ],
      commonMisconceptions: ['Equity instruments can always be reclassified'],
      keyTakeaways: ['Business model determines classification', 'ECL applies to amortised cost'],
      verificationStatus: 'verified',
    },
  ];

  const sampleQuiz: GeneratedQuiz = {
    id: 'quiz-indas-109',
    title: 'Ind AS 109 Checkpoint Quiz',
    moduleId: 'mod-indas-109',
    moduleTitle: 'Financial Instruments: Classification and Measurement',
    timeLimitMinutes: 15,
    questions: [
      {
        id: 'q-1',
        prompt: 'Which assessment determines whether a debt instrument qualifies for Amortised Cost measurement under Ind AS 109?',
        questionType: 'multiple_choice',
        options: [
          'Business model test and SPPI test',
          'Only fair value through profit or loss option',
          'Credit rating of the issuer alone',
          'Market liquidity of the instrument',
        ],
        correctOptionIndex: 0,
        explanation: 'Amortised cost requires both the Hold-to-Collect business model test and contractual cash flow characteristics (SPPI) test.',
        difficulty: 'advanced',
        questionNumber: 1,
        learningObjectiveReference: 'obj-1',
      },
    ],
  };

  // --------------------------------------------------------------------------
  // TEST 1: Exact Video Duplication Elimination (Rule A)
  // --------------------------------------------------------------------------
  test('TEST 1: Eliminates exact individual video duplicates when already included in recommended playlist sequence', () => {
    const playlistItems: PlaylistItem[] = Array.from({ length: 10 }, (_, i) => {
      const idx = (i + 1).toString().padStart(3, '0');
      return {
        title: `Lecture ${i + 1}: Ind AS 109 Part ${i + 1}`,
        videoId: `vid-${idx}`,
        videoUrl: `https://www.youtube.com/watch?v=vid-${idx}`,
        sequenceNumber: i + 1,
      };
    });

    const primaryPlaylist: PlaylistResource = {
      id: 'pl-ca-indas109',
      title: 'Complete Ind AS 109 Financial Instruments Masterclass',
      channelName: 'CA Final Financial Reporting Academy',
      channelId: 'UC_CA_ACADEMY',
      description: 'Comprehensive 10-part lecture series on Ind AS 109 classification and measurement fundamentals.',
      itemCount: 10,
      playlistUrl: 'https://www.youtube.com/playlist?list=PL_CA_INDAS109',
      url: 'https://www.youtube.com/playlist?list=PL_CA_INDAS109',
      canonicalUrl: 'https://www.youtube.com/playlist?list=PL_CA_INDAS109',
      items: playlistItems,
      topicsCovered: ['Classification', 'Measurement', 'SPPI'],
      coverageStatus: 'VERIFIED_COMPLETE',
      relevanceScore: 92,
      isCurated: true,
    };

    // Candidates: 3 exact duplicates (vid-003, vid-007, vid-009) + 2 genuine supplementary videos (vid-011, vid-012)
    const candidateVideos: ScoredResource[] = [
      createMockVideo({
        id: 'cand-1',
        title: 'Lecture 3: SPPI Test Ind AS 109',
        url: 'https://www.youtube.com/watch?v=vid-003',
        externalId: 'vid-003',
        matchedObjectives: ['obj-1'],
      }),
      createMockVideo({
        id: 'cand-2',
        title: 'Lecture 7: Debt vs Equity Reclassification',
        url: 'https://youtu.be/vid-007',
        externalId: 'vid-007',
        matchedObjectives: ['obj-2'],
      }),
      createMockVideo({
        id: 'cand-3',
        title: 'Lecture 9: De-recognition of Financial Liabilities',
        url: 'https://www.youtube.com/watch?v=vid-009',
        externalId: 'vid-009',
        matchedObjectives: ['obj-2'],
      }),
      createMockVideo({
        id: 'cand-4',
        title: 'Advanced Practical Case Study: ECL Matrix for Retail Banks',
        url: 'https://www.youtube.com/watch?v=vid-011',
        externalId: 'vid-011',
        matchedObjectives: ['obj-3'],
      }),
      createMockVideo({
        id: 'cand-5',
        title: 'Hedge Effectiveness Testing: Dollar-Offset Method Deep Dive',
        url: 'https://www.youtube.com/watch?v=vid-012',
        externalId: 'vid-012',
        matchedObjectives: ['obj-4'],
      }),
    ];

    const dedupResult = deduplicateModuleVideosAgainstPlaylist(
      candidateVideos,
      primaryPlaylist,
      baseModulePlan
    );

    // Rule A assertions
    assert.strictEqual(dedupResult.removedVideos.length, 3, 'Must remove all 3 exact video duplicates');
    const removedIds = dedupResult.removedVideos.map((v) => extractCanonicalVideoId(v.externalId || v.url));
    assert.ok(removedIds.includes('vid-003'), 'vid-003 must be in removedVideos');
    assert.ok(removedIds.includes('vid-007'), 'vid-007 must be in removedVideos');
    assert.ok(removedIds.includes('vid-009'), 'vid-009 must be in removedVideos');

    // Supplementary videos retained
    assert.strictEqual(dedupResult.supplementaryVideos.length, 2, 'Must retain the 2 supplementary videos');
    const suppIds = dedupResult.supplementaryVideos.map((v) => extractCanonicalVideoId(v.externalId || v.url));
    assert.ok(suppIds.includes('vid-011'), 'vid-011 must be preserved');
    assert.ok(suppIds.includes('vid-012'), 'vid-012 must be preserved');

    // Integration check through distributor
    const assignment = distributeAndSequenceModuleResources(
      baseModulePlan,
      candidateVideos,
      [],
      sampleStudyNotes,
      sampleQuiz,
      primaryPlaylist
    );

    assert.ok(assignment.primaryPlaylist, 'Primary playlist must be assigned to module');
    assert.strictEqual(assignment.removedDuplicateVideos?.length, 3, 'Assignment records exactly 3 removed duplicates');
    const finalVideoIds = assignment.videos.map((v) => extractCanonicalVideoId(v.externalId || v.url));
    assert.ok(!finalVideoIds.includes('vid-003'), 'vid-003 must not appear in final module videos');
    assert.ok(!finalVideoIds.includes('vid-007'), 'vid-007 must not appear in final module videos');
    assert.ok(!finalVideoIds.includes('vid-009'), 'vid-009 must not appear in final module videos');
  });

  // --------------------------------------------------------------------------
  // TEST 2: Supplementary Videos for Missing Topics (Rule C & D)
  // --------------------------------------------------------------------------
  test('TEST 2: Retains supplementary individual videos covering missing syllabus concepts and advanced subtopics', () => {
    // Playlist covers introductory subtopics 1 and 2 only
    const playlistIntro: PlaylistResource = {
      id: 'pl-intro-indas109',
      title: 'Ind AS 109 Basic Concepts and Classification',
      channelName: 'ICAI Educational Portal',
      channelId: 'UC_ICAI_PORTAL',
      description: 'Introductory lectures covering Business Model assessment and SPPI criteria.',
      itemCount: 4,
      playlistUrl: 'https://youtube.com/playlist?list=PL_INTRO',
      topicsCovered: ['Business Model', 'SPPI'],
      coverageStatus: 'PARTIALLY_VERIFIED',
      items: [
        { title: 'Overview of Financial Instruments', videoId: 'intro-01', videoUrl: 'https://youtube.com/watch?v=intro-01', sequenceNumber: 1 },
        { title: 'Business Model Assessment Rules', videoId: 'intro-02', videoUrl: 'https://youtube.com/watch?v=intro-02', sequenceNumber: 2 },
        { title: 'SPPI Test for Debt Instruments', videoId: 'intro-03', videoUrl: 'https://youtube.com/watch?v=intro-03', sequenceNumber: 3 },
        { title: 'Equity Instruments FVTOCI Election', videoId: 'intro-04', videoUrl: 'https://youtube.com/watch?v=intro-04', sequenceNumber: 4 },
      ],
      relevanceScore: 80,
      isCurated: true,
    };

    const subtopics: SyllabusSubtopic[] = [
      { id: 'sub-1', title: 'Business Model Assessment', learningObjective: 'obj-1', coverageStatus: 'Fully Covered' },
      { id: 'sub-2', title: 'SPPI Cash Flow Characteristics', learningObjective: 'obj-1', coverageStatus: 'Fully Covered' },
      { id: 'sub-3', title: 'Expected Credit Loss Model', learningObjective: 'obj-3', coverageStatus: 'Missing Resources' },
      { id: 'sub-4', title: 'Fair Value Hedge Accounting', learningObjective: 'obj-4', coverageStatus: 'Missing Resources' },
    ];

    const candidates: ScoredResource[] = [
      // Video teaching missing subtopic 3 (ECL Model)
      createMockVideo({
        id: 'cand-ecl',
        title: 'Expected Credit Loss (ECL) Model Practical Computation in Ind AS 109',
        url: 'https://www.youtube.com/watch?v=ecl-advanced',
        externalId: 'ecl-advanced',
        combinedScore: 91,
        matchedObjectives: ['obj-3'],
      }),
      // Video teaching missing subtopic 4 (Fair Value Hedge)
      createMockVideo({
        id: 'cand-hedge',
        title: 'Fair Value Hedge Accounting Comprehensive Worked Example',
        url: 'https://www.youtube.com/watch?v=hedge-worked',
        externalId: 'hedge-worked',
        combinedScore: 89,
        matchedObjectives: ['obj-4'],
      }),
      // Redundant video repeating introductory SPPI test
      createMockVideo({
        id: 'cand-sppi-dup',
        title: 'SPPI Test Explained Simply for Beginners',
        url: 'https://www.youtube.com/watch?v=sppi-redundant',
        externalId: 'sppi-redundant',
        combinedScore: 74,
        matchedObjectives: ['obj-1'],
      }),
    ];

    const result = deduplicateModuleVideosAgainstPlaylist(
      candidates,
      playlistIntro,
      baseModulePlan,
      subtopics
    );

    // Rule C & Rule D assertions: missing topics retained, redundant topic pruned
    assert.strictEqual(result.supplementaryVideos.length, 2, 'Must retain exactly the 2 videos teaching missing subtopics');
    const suppTitles = result.supplementaryVideos.map((v) => v.title);
    assert.ok(suppTitles.some((t) => t.includes('Expected Credit Loss')), 'Must retain ECL supplementary video');
    assert.ok(suppTitles.some((t) => t.includes('Fair Value Hedge')), 'Must retain Fair Value Hedge supplementary video');

    assert.strictEqual(result.removedVideos.length, 1, 'Must remove the redundant SPPI video');
    assert.ok(result.removedVideos[0].title.includes('SPPI Test Explained'), 'Redundant video was removed');
  });

  // --------------------------------------------------------------------------
  // TEST 3: Partial Syllabus Coverage (Rule C)
  // --------------------------------------------------------------------------
  test('TEST 3: Accurately identifies partial playlist coverage and selects supplementary resources to bridge the gap', () => {
    const dsaModulePlan: ModulePlan = {
      id: 'mod-trees',
      moduleNumber: 2,
      title: 'Tree Data Structures & Self-Balancing Trees',
      description: 'Binary Search Trees, tree traversals, AVL trees, and Red-Black trees.',
      learningObjectives: [
        { id: 'obj-tree-1', statement: 'Understand Binary Search Trees and tree traversals (Inorder, Preorder, Postorder)', keyTerms: ['BST', 'traversal'] },
        { id: 'obj-tree-2', statement: 'Analyze worst-case and average-case time complexity of BST operations', keyTerms: ['complexity', 'worst-case'] },
        { id: 'obj-tree-3', statement: 'Implement AVL Tree Self-Balancing and Rotations (LL, RR, LR, RL)', keyTerms: ['AVL', 'rotations', 'self-balancing'] },
        { id: 'obj-tree-4', statement: 'Implement Red-Black Tree recoloring and rotation invariants', keyTerms: ['Red-Black', 'recoloring'] },
      ],
      prerequisites: ['Arrays and Linked Lists'],
      estimatedHours: 6,
      expectedOutcomes: ['Implement balanced binary trees from scratch'],
      searchQueries: {
        videoQueries: ['Binary Search Tree lecture', 'AVL Tree rotations tutorial'],
        readingQueries: ['CLRS Chapter 12 and 13 Trees'],
      },
    };

    // Playlist covers only BST and complexity (50% coverage)
    const bstOnlyPlaylist: PlaylistResource = {
      id: 'pl-bst-basics',
      title: 'Binary Search Trees: Fundamentals and Traversals',
      channelName: 'Computer Science Lectures',
      itemCount: 3,
      playlistUrl: 'https://youtube.com/playlist?list=PL_BST',
      topicsCovered: ['BST', 'traversals', 'complexity'],
      coverageStatus: 'PARTIALLY_VERIFIED',
      items: [
        { title: 'Introduction to BST', videoId: 'bst-01', videoUrl: 'https://youtube.com/watch?v=bst-01', sequenceNumber: 1 },
        { title: 'Inorder, Preorder and Postorder Traversals', videoId: 'bst-02', videoUrl: 'https://youtube.com/watch?v=bst-02', sequenceNumber: 2 },
        { title: 'BST Search and Insertion Time Complexity', videoId: 'bst-03', videoUrl: 'https://youtube.com/watch?v=bst-03', sequenceNumber: 3 },
      ],
      relevanceScore: 78,
      isCurated: true,
    };

    const coverageMap = buildPlaylistCoverageMap(
      bstOnlyPlaylist,
      dsaModulePlan,
      'computer_science',
      'Data Structures and Algorithms'
    );

    assert.ok(coverageMap.coveragePercent <= 60, `Coverage percent should reflect partial coverage (was ${coverageMap.coveragePercent}%)`);
    assert.ok(coverageMap.coveredLearningObjectives.length > 0, 'Should cover BST objectives');
    assert.ok(coverageMap.uncoveredObjectives.length > 0, 'Should have uncovered objectives for AVL and Red-Black');

    const candidates: ScoredResource[] = [
      // Duplicate topic: BST traversals
      createMockVideo({
        id: 'v-traversal-dup',
        title: 'Tree Traversal Techniques: Inorder, Preorder, Postorder',
        url: 'https://www.youtube.com/watch?v=dup-trav',
        externalId: 'dup-trav',
        combinedScore: 82,
        matchedObjectives: ['obj-tree-1'],
      }),
      // Supplementary topic: AVL rotations
      createMockVideo({
        id: 'v-avl-rotations',
        title: 'AVL Tree Rotations Step-by-Step with Code',
        url: 'https://www.youtube.com/watch?v=avl-rot',
        externalId: 'avl-rot',
        combinedScore: 92,
        matchedObjectives: ['obj-tree-3'],
      }),
      // Supplementary topic: Red-Black trees
      createMockVideo({
        id: 'v-rb-trees',
        title: 'Red-Black Tree Properties, Rotations and Recoloring',
        url: 'https://www.youtube.com/watch?v=rb-tree',
        externalId: 'rb-tree',
        combinedScore: 90,
        matchedObjectives: ['obj-tree-4'],
      }),
    ];

    const dedup = deduplicateModuleVideosAgainstPlaylist(candidates, bstOnlyPlaylist, dsaModulePlan);

    // The duplicate traversal video must be dropped, while AVL and Red-Black are kept
    assert.strictEqual(dedup.removedVideos.length, 1, 'Duplicate traversal video must be removed');
    assert.strictEqual(dedup.supplementaryVideos.length, 2, 'AVL and Red-Black videos must be preserved');
    assert.strictEqual(dedup.removedVideos[0].id, 'v-traversal-dup');
  });

  // --------------------------------------------------------------------------
  // TEST 4: Multiple Competing Playlists Selection (Rule E)
  // --------------------------------------------------------------------------
  test('TEST 4: Selects single highest quality playlist and prevents redundant playlist recommendations (Rule E)', () => {
    const playlistComprehensive: PlaylistResource = {
      id: 'pl-mit-algorithms',
      title: 'MIT 6.006 Introduction to Algorithms - Full Lecture Series',
      channelName: 'MIT OpenCourseWare',
      channelId: 'UC_MIT_OCW',
      playlistUrl: 'https://youtube.com/playlist?list=PL_MIT_ALGO',
      topicsCovered: ['Data Structures', 'Sorting', 'Trees', 'Graphs'],
      coverageStatus: 'VERIFIED_COMPLETE',
      itemCount: 24,
      items: Array.from({ length: 24 }, (_, i) => ({
        title: `MIT 6.006 Lecture ${i + 1}`,
        videoId: `mit-algo-${i + 1}`,
        videoUrl: `https://youtube.com/watch?v=mit-algo-${i + 1}`,
        sequenceNumber: i + 1,
      })),
      relevanceScore: 95,
      isCurated: true,
    };

    const playlistFragmented: PlaylistResource = {
      id: 'pl-random-dsa',
      title: 'DSA Crash Course in 4 Videos',
      channelName: 'Unknown Coder',
      playlistUrl: 'https://youtube.com/playlist?list=PL_RANDOM',
      topicsCovered: ['Basics'],
      coverageStatus: 'PARTIALLY_VERIFIED',
      itemCount: 4,
      items: [
        { title: 'DSA Part 1', videoId: 'rnd-1', videoUrl: 'https://youtube.com/watch?v=rnd-1', sequenceNumber: 1 },
        { title: 'DSA Part 2', videoId: 'rnd-2', videoUrl: 'https://youtube.com/watch?v=rnd-2', sequenceNumber: 2 },
      ],
      relevanceScore: 55,
      isCurated: false,
    };

    const bestPlaylist = selectBestPlaylist(
      [playlistComprehensive, playlistFragmented],
      baseModulePlan,
      'computer_science',
      'Algorithms'
    );

    assert.ok(bestPlaylist, 'Must select a primary playlist');
    assert.strictEqual(bestPlaylist.id, 'pl-mit-algorithms', 'Must select MIT OpenCourseWare over fragmented playlist');
  });

  // --------------------------------------------------------------------------
  // TEST 5: Unverified / Empty Playlist Graceful Fallback (Rule F)
  // --------------------------------------------------------------------------
  test('TEST 5: Does NOT perform unsafe topic deduplication against unverified or empty playlists (Rule F)', () => {
    const unverifiedPlaylist: PlaylistResource = {
      id: 'pl-empty-unverified',
      title: 'Private or Unreachable Playlist',
      channelName: 'Some Channel',
      playlistUrl: 'https://youtube.com/playlist?list=PL_EMPTY',
      topicsCovered: [],
      coverageStatus: 'UNVERIFIED',
      itemCount: 0,
      items: [],
      relevanceScore: 50,
      isCurated: false,
    };

    const candidates: ScoredResource[] = [
      createMockVideo({
        id: 'cand-vital-1',
        title: 'Core Concepts of Financial Reporting',
        url: 'https://youtube.com/watch?v=vital-01',
        externalId: 'vital-01',
        combinedScore: 85,
        matchedObjectives: ['obj-1'],
      }),
      createMockVideo({
        id: 'cand-vital-2',
        title: 'Measurement and Accounting Standards',
        url: 'https://youtube.com/watch?v=vital-02',
        externalId: 'vital-02',
        combinedScore: 84,
        matchedObjectives: ['obj-2'],
      }),
    ];

    const result = deduplicateModuleVideosAgainstPlaylist(candidates, unverifiedPlaylist, baseModulePlan);

    // Rule F: Never remove candidate videos when playlist items cannot be verified
    assert.ok(result.coverageMap, 'Coverage map exists');
    assert.strictEqual(result.coverageMap!.verificationStatus, 'UNVERIFIED', 'Verification status must be UNVERIFIED');
    assert.strictEqual(result.removedVideos.length, 0, 'No videos may be removed when playlist is unverified');
    assert.strictEqual(result.supplementaryVideos.length, 2, 'All candidate videos must be preserved for curriculum coverage');
  });

  // --------------------------------------------------------------------------
  // TEST 6: User-Added Video Preservation (User Content Protection)
  // --------------------------------------------------------------------------
  test('TEST 6: Unconditionally preserves user-created and custom supplementary videos', () => {
    const playlist: PlaylistResource = {
      id: 'pl-verified-1',
      title: 'Verified Lecture Series',
      channelName: 'Academic Channel',
      playlistUrl: 'https://youtube.com/playlist?list=PL_VER',
      topicsCovered: ['Lecture 1'],
      coverageStatus: 'VERIFIED_COMPLETE',
      itemCount: 5,
      items: [
        { title: 'Lecture 1', videoId: 'user-clip-123', videoUrl: 'https://youtube.com/watch?v=user-clip-123', sequenceNumber: 1 },
      ],
      isCurated: true,
    };

    const coverageMap = buildPlaylistCoverageMap(playlist, baseModulePlan);

    // Individual video with matching ID but flagged as user-created
    const userVideo = createMockVideo({
      id: 'user-res-1',
      title: 'My Custom Lecture Annotation',
      url: 'https://youtube.com/watch?v=user-clip-123',
      externalId: 'user-clip-123',
      combinedScore: 70,
      isUserCreated: true,
    });

    const evalResult = isTopicCoveredByPlaylist(userVideo, coverageMap, baseModulePlan);
    assert.strictEqual(evalResult.isCovered, false, 'User created video must not be marked as covered or pruned');
    assert.ok(evalResult.reason.includes('User created resource'), 'Reason mentions user created protection');

    // Also verify sanitizeModuleLessonsAgainstPlaylist preserves user lessons
    const mockModule = {
      id: 'mod-custom-user',
      title: 'Module With Custom User Lesson',
      primaryPlaylist: playlist,
      lessons: [
        {
          id: 'les-custom-1',
          moduleId: 'mod-custom-user',
          title: 'My Custom Study Video',
          type: 'video' as const,
          sourceUrl: 'https://youtube.com/watch?v=user-clip-123',
          sourceName: 'Personal Bookmark',
          durationMinutes: 25,
          orderIndex: 0,
          isUserCreated: true,
        },
        {
          id: 'les-duplicate-auto',
          moduleId: 'mod-custom-user',
          title: 'Auto-discovered duplicate',
          type: 'video' as const,
          sourceUrl: 'https://youtube.com/watch?v=user-clip-123',
          sourceName: 'YouTube',
          durationMinutes: 25,
          orderIndex: 1,
          isUserCreated: false,
        },
      ],
    };

    const sanitized = sanitizeModuleLessonsAgainstPlaylist(mockModule);
    assert.strictEqual(sanitized.removedCount, 1, 'Only the non-user duplicate should be removed');
    assert.strictEqual(sanitized.lessons.length, 1, 'User lesson is preserved');
    assert.strictEqual(sanitized.lessons[0].id, 'les-custom-1', 'Preserved lesson is the user-created lesson');
  });

  // --------------------------------------------------------------------------
  // TEST 7: Module Regeneration Preservation & Deduplication
  // --------------------------------------------------------------------------
  test('TEST 7: Preserves user content and prunes duplicates across module regeneration and course repair', () => {
    const courseToRepair: LearningPath = {
      id: 'course-indas',
      title: 'Ind AS 109 Comprehensive Masterclass',
      description: 'Ind AS 109 Comprehensive Masterclass covering financial assets',
      domain: 'Accounting',
      level: 'Advanced',
      durationHours: 10,
      moduleCount: 1,
      verified: true,
      enrolledCount: 5,
      averageCompletion: '20%',
      modules: [
        {
          id: 'mod-1',
          pathId: 'course-indas',
          title: 'Financial Assets Classification',
          moduleNumber: 1,
          orderIndex: 0,
          status: 'in_progress',
          totalResources: 4,
          completedResources: 1,
          primaryPlaylist: {
            id: 'pl-course-indas',
            title: 'Ind AS 109 Playlist',
            channelName: 'CA Academy',
            playlistUrl: 'https://youtube.com/playlist?list=PL_TEST',
            topicsCovered: ['Assets', 'Classification'],
            coverageStatus: 'VERIFIED_COMPLETE',
            itemCount: 2,
            url: 'https://youtube.com/playlist?list=PL_TEST',
            items: [
              { title: 'Lesson 1', videoId: 'pl-vid-1', videoUrl: 'https://youtube.com/watch?v=pl-vid-1', sequenceNumber: 1 },
              { title: 'Lesson 2', videoId: 'pl-vid-2', videoUrl: 'https://youtube.com/watch?v=pl-vid-2', sequenceNumber: 2 },
            ],
            isCurated: true,
          },
          lessons: [
            // Redundant playlist row placeholder
            {
              id: 'les-pl-row',
              moduleId: 'mod-1',
              title: 'Ind AS 109 Playlist Row',
              type: 'video' as const,
              durationMinutes: 45,
              orderIndex: 0,
              sourceName: 'YouTube Playlist',
              sourceUrl: 'https://youtube.com/playlist?list=PL_TEST',
              isPlaylist: true,
            },
            // Redundant duplicate video from playlist
            {
              id: 'les-dup-vid1',
              moduleId: 'mod-1',
              title: 'Lesson 1: Business Model',
              type: 'video' as const,
              durationMinutes: 45,
              orderIndex: 1,
              sourceName: 'YouTube',
              sourceUrl: 'https://youtube.com/watch?v=pl-vid-1',
            },
            // Genuine supplementary video
            {
              id: 'les-supp-vid3',
              moduleId: 'mod-1',
              title: 'Supplementary ECL Workshop',
              type: 'video' as const,
              durationMinutes: 30,
              orderIndex: 2,
              sourceName: 'CA Insights',
              sourceUrl: 'https://youtube.com/watch?v=supp-vid-3',
            },
            // User-added video (matches playlist video ID pl-vid-2, but user added it)
            {
              id: 'les-user-vid2',
              moduleId: 'mod-1',
              title: 'My Bookmarked Lesson 2',
              type: 'video' as const,
              durationMinutes: 45,
              orderIndex: 3,
              sourceName: 'Personal Bookmark',
              sourceUrl: 'https://youtube.com/watch?v=pl-vid-2',
              isUserCreated: true,
            },
            // Monograph study note (non-video modality)
            {
              id: 'les-note-1',
              moduleId: 'mod-1',
              title: 'Study Monograph on Financial Assets',
              type: 'monograph' as const,
              durationMinutes: 20,
              orderIndex: 4,
              sourceName: 'ICAI Publications',
              sourceUrl: 'https://icai.org/indas109.pdf',
            },
          ],
        },
      ],
    };

    const repairResult = repairCourseVideoDuplicates(courseToRepair);
    assert.strictEqual(repairResult.repaired, true, 'Repair course duplicates detects and sanitizes redundant items');

    assert.ok(repairResult.path.modules && repairResult.path.modules.length > 0, 'Repaired course has modules');
    const remainingLessons = repairResult.path.modules![0].lessons || [];
    // Should have pruned les-pl-row and les-dup-vid1, but kept les-supp-vid3, les-user-vid2, and les-note-1
    assert.strictEqual(remainingLessons.length, 3, 'Exactly 3 lessons remain after sanitization');
    const ids = remainingLessons.map((l) => l.id);
    assert.ok(!ids.includes('les-pl-row'), 'Playlist placeholder row is pruned');
    assert.ok(!ids.includes('les-dup-vid1'), 'Exact playlist duplicate video is pruned');
    assert.ok(ids.includes('les-supp-vid3'), 'Supplementary video is retained');
    assert.ok(ids.includes('les-user-vid2'), 'User-created lesson is strictly preserved');
    assert.ok(ids.includes('les-note-1'), 'Reading monograph is strictly preserved');
  });

  // --------------------------------------------------------------------------
  // TEST 8: Modality Invariant & Coverage Validation
  // --------------------------------------------------------------------------
  test('TEST 8: Non-video modalities are never pruned; coverage validator recognizes primary playlists', () => {
    const playlist: PlaylistResource = {
      id: 'pl-physics-mechanics',
      title: 'MIT 8.01 Classical Mechanics',
      description: 'Complete MIT 8.01 series covering vectors, 3D kinematics, Newton laws of motion, and friction.',
      channelName: 'MIT OpenCourseWare',
      playlistUrl: 'https://youtube.com/playlist?list=PL_PHYSICS',
      topicsCovered: ['vectors', 'kinematics', 'Newton laws', 'friction'],
      coverageStatus: 'VERIFIED_COMPLETE',
      itemCount: 20,
      items: Array.from({ length: 20 }, (_, i) => ({
        title: `MIT 8.01 Lecture ${i + 1}: Kinematics and Dynamics`,
        videoId: `mit-801-${i + 1}`,
        videoUrl: `https://youtube.com/watch?v=mit-801-${i + 1}`,
        sequenceNumber: i + 1,
      })),
      isCurated: true,
    };

    const mechanicsPlan: ModulePlan = {
      id: 'mod-mechanics',
      moduleNumber: 1,
      title: 'Classical Mechanics: Newton Laws and Kinematics',
      description: 'University-level physics mechanics course.',
      learningObjectives: [
        { id: 'obj-phys-1', statement: 'Vectors and kinematics in 3D', keyTerms: ['vectors', 'kinematics'] },
        { id: 'obj-phys-2', statement: 'Newton laws of motion and friction', keyTerms: ['Newton', 'friction'] },
      ],
      prerequisites: ['Calculus I'],
      estimatedHours: 8,
      expectedOutcomes: ['Solve complex mechanics problems'],
      searchQueries: { videoQueries: ['MIT 8.01 Classical Mechanics'], readingQueries: ['MIT 8.01 Notes'] },
    };

    const readingMaterial: ScoredResource[] = [
      createMockReading({
        id: 'read-mit-ocw',
        title: 'MIT OCW 8.01 Course Notes: Kinematics and Dynamics',
        url: 'https://ocw.mit.edu/courses/8-01-notes.pdf',
        matchedObjectives: ['obj-phys-1'],
      }),
    ];

    // Distribute with 0 candidate individual videos (playlist alone covers the lecture sequence)
    const assignment = distributeAndSequenceModuleResources(
      mechanicsPlan,
      [],
      readingMaterial,
      sampleStudyNotes,
      sampleQuiz,
      playlist
    );

    // Reading material and study notes and quiz must all be present
    assert.strictEqual(assignment.readings.length, 1, 'Reading material is 100% preserved');
    assert.strictEqual(assignment.studyNotes.length, 1, 'Study note monograph is 100% preserved');
    assert.ok(assignment.quiz, 'Diagnostic quiz is 100% preserved');

    // Run curriculum coverage audit on this plan + assignment
    const curriculum: CurriculumPlan = {
      courseTitle: 'Classical Mechanics',
      description: 'Comprehensive classical mechanics curriculum',
      domain: 'natural_sciences',
      level: 'undergraduate',
      totalEstimatedHours: 8,
      pedagogicalRationale: 'Comprehensive university mechanics',
      modules: [mechanicsPlan],
    };

    const coverage = validateCurriculumCoverage(curriculum, [assignment], []);

    // Coverage validator must recognize that the primary playlist satisfies video lecture requirement
    assert.ok(
      coverage.overallCoveragePercent >= 75,
      `Coverage score must remain high with primary playlist (got ${coverage.overallCoveragePercent}%)`
    );
    assert.ok(
      !coverage.diagnosticMessages.some((m) => m.includes('CRITICAL: No video lecture assigned to module 1')),
      'Should NOT report false-positive missing video warning when a primary playlist is attached'
    );
  });
});
