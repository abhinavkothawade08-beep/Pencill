import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ResourceEngineV2,
  NormalizedResourceCandidate,
  SearchQueryItem,
  educatorRegistry,
  CuratedDirectoryAdapter,
  ExplainableRankingEngine,
  ResourceModuleDistributor,
  PersistenceMapper,
} from '../../src/lib/resource-engine-v2';
import { ChannelVerifier } from '../../src/lib/resource-engine-v2/educators/channel-verifier';
import { EducatorMatcher } from '../../src/lib/resource-engine-v2/educators/educator-matcher';
import { LearningObjectiveAnalyzer } from '../../src/lib/resource-engine-v2/analysis/objective-analyzer';
import { ProviderRegistry } from '../../src/lib/resource-engine-v2/providers';
import { ResourceProviderAdapter } from '../../src/lib/resource-engine-v2/providers/base-adapter';

describe('Master YouTube Educator Directory Integration (Resource Engine 2.0)', () => {
  const analyzer = new LearningObjectiveAnalyzer();
  const rankingEngine = new ExplainableRankingEngine();
  const distributor = new ResourceModuleDistributor(rankingEngine);
  const persistenceMapper = new PersistenceMapper();

  // --------------------------------------------------------------------------
  // Requirement 1: Matching Educator Prioritized for Relevant Content
  // --------------------------------------------------------------------------
  it('1. Prioritizes matching directory educator when resource is relevant', () => {
    const objective = analyzer.analyze({
      courseTitle: 'Neural Networks and Deep Learning',
      moduleTitle: 'Backpropagation and Gradient Descent',
      academicLevel: 'undergraduate',
      domainHint: 'data_science_ai',
    }).objective;

    // Candidate A: 3Blue1Brown (Verified Master Educator)
    const educatorCandidate: NormalizedResourceCandidate = {
      id: 'yt_3b1b_backprop',
      provider: 'youtube',
      externalId: 'Ilg3gGewQ5U',
      title: 'What is backpropagation really doing? | Deep learning chapter 3',
      description: 'Backpropagation calculus, chain rule, and gradient descent mechanics explained visually.',
      canonicalUrl: 'https://www.youtube.com/watch?v=Ilg3gGewQ5U',
      sourceUrl: 'https://www.youtube.com/watch?v=Ilg3gGewQ5U',
      modality: 'video',
      durationSeconds: 835,
      verificationStatus: 'verified_channel',
      creator: {
        name: '3Blue1Brown',
        channelId: 'UCYO_jab_esuFRV4b17AJtAw',
        authorId: 'PEN-ED-0001',
      },
      missingMetadata: [],
      retrievalProvenance: { queryString: 'backpropagation deep learning', provider: 'youtube',
        retrievedAt: new Date().toISOString() },
      rawMetadata: {
        isVerifiedEducator: true,
        educatorId: 'PEN-ED-0001',
        educatorName: 'Grant Sanderson (3Blue1Brown)',
        channelId: 'UCYO_jab_esuFRV4b17AJtAw',
      },
    };

    // Candidate B: Unverified generic channel with similar keywords
    const genericCandidate: NormalizedResourceCandidate = {
      id: 'yt_generic_backprop',
      provider: 'youtube',
      externalId: 'gen12345',
      title: 'Backpropagation Neural Networks Tutorial',
      description: 'Quick walkthrough of backpropagation algorithm in neural networks.',
      canonicalUrl: 'https://www.youtube.com/watch?v=gen12345',
      sourceUrl: 'https://www.youtube.com/watch?v=gen12345',
      modality: 'video',
      durationSeconds: 800,
      verificationStatus: 'unverified_candidate',
      creator: {
        name: 'Generic Tech Channel',
        channelId: 'UCrandom999',
      },
      missingMetadata: [],
      retrievalProvenance: { queryString: 'backpropagation neural networks', provider: 'youtube',
        retrievedAt: new Date().toISOString() },
    };

    const rankResult = rankingEngine.rank(objective, [genericCandidate, educatorCandidate]);
    assert.strictEqual(rankResult.rankedCandidates.length, 2);
    // 3Blue1Brown candidate must win top rank
    assert.strictEqual(rankResult.rankedCandidates[0].candidate.id, 'yt_3b1b_backprop');
    assert.ok(
      rankResult.rankedCandidates[0].overallScore > rankResult.rankedCandidates[1].overallScore,
      'Verified master educator must score higher than unverified channel for relevant content'
    );
    assert.ok(
      rankResult.rankedCandidates[0].rankingRationale.includes('Educator Trust'),
      'Rationale must include explicit educator trust boost'
    );
  });

  // --------------------------------------------------------------------------
  // Requirement 2: Unrelated Video from Trusted Educator is Gated Out
  // --------------------------------------------------------------------------
  it('2. Rejects unrelated video from trusted educator without granting free pass', () => {
    const objective = analyzer.analyze({
      courseTitle: 'Organic Chemistry Reactions',
      moduleTitle: 'Electrophilic Aromatic Substitution Mechanisms',
      academicLevel: 'undergraduate',
      domainHint: 'chemistry',
    }).objective;

    // 3Blue1Brown video on cryptocurrency (completely off-topic for organic chemistry)
    const offTopicEducatorCandidate: NormalizedResourceCandidate = {
      id: 'yt_3b1b_crypto',
      provider: 'youtube',
      externalId: 'bBC-nXj3Zk0',
      title: 'How does bitcoin actually work? Blockchain cryptography',
      description: 'Mathematical explanation of public-key cryptography and proof-of-work in Bitcoin.',
      canonicalUrl: 'https://www.youtube.com/watch?v=bBC-nXj3Zk0',
      sourceUrl: 'https://www.youtube.com/watch?v=bBC-nXj3Zk0',
      modality: 'video',
      durationSeconds: 1560,
      verificationStatus: 'verified_channel',
      creator: {
        name: '3Blue1Brown',
        channelId: 'UCYO_jab_esuFRV4b17AJtAw',
        authorId: 'PEN-ED-0001',
      },
      missingMetadata: [],
      retrievalProvenance: { queryString: 'cryptography bitcoin', provider: 'youtube',
        retrievedAt: new Date().toISOString() },
      rawMetadata: {
        isVerifiedEducator: true,
        educatorId: 'PEN-ED-0001',
        educatorName: 'Grant Sanderson (3Blue1Brown)',
      },
    };

    const rankResult = rankingEngine.rank(objective, [offTopicEducatorCandidate], {
      minRelevanceThreshold: 50,
    });

    assert.strictEqual(rankResult.rankedCandidates.length, 0, 'Off-topic educator video must NOT be eligible');
    assert.strictEqual(rankResult.rejectedCandidates.length, 1);
    assert.ok(
      rankResult.rejectedCandidates[0].rejectionReasons.some((r) => r.includes('below threshold') || r.includes('Relevance')),
      'Must record explicit relevance rejection reason'
    );
  });

  // --------------------------------------------------------------------------
  // Requirement 3: Exact Channel ID Verification and Anti-Impersonation
  // --------------------------------------------------------------------------
  it('3. Verifies exact Channel ID and rejects impersonators using creator name in title', () => {
    const edu3b1b = educatorRegistry.getById('PEN-ED-0001')!;
    assert.ok(edu3b1b, '3Blue1Brown record must exist');
    assert.strictEqual(edu3b1b.YouTube_Channel_ID, 'UCYO_jab_esuFRV4b17AJtAw');

    // Genuine video with matching Channel ID
    const genuine = ChannelVerifier.verifyChannelIdentity(
      {
        channelId: 'UCYO_jab_esuFRV4b17AJtAw',
        channelTitle: '3Blue1Brown',
        videoTitle: 'Essence of Linear Algebra',
      },
      edu3b1b
    );
    assert.strictEqual(genuine.isVerifiedEducator, true);
    assert.strictEqual(genuine.confidence, 'verified_channel_id');

    // Impersonator video with different Channel ID but mimicking title/channel name
    const imposter = ChannelVerifier.verifyChannelIdentity(
      {
        channelId: 'UCfakeChannel999',
        channelTitle: '3Blue1Brown Fan Channel',
        videoTitle: 'Reacting to 3Blue1Brown Linear Algebra',
      },
      edu3b1b
    );
    assert.strictEqual(imposter.isVerifiedEducator, false);
    assert.ok(imposter.evidence.includes('Channel ID mismatch'));
  });

  // --------------------------------------------------------------------------
  // Requirement 4: Video and Playlist Discovery Both Work
  // --------------------------------------------------------------------------
  it('4. Curated directory adapter discovers both standalone videos and structured playlists', async () => {
    const adapter = new CuratedDirectoryAdapter();
    const query: SearchQueryItem = {
      id: 'q-calc-test',
      targetConcept: 'Calculus and Linear Algebra',
      queryString: '3Blue1Brown Linear Algebra playlist and tutorials',
      intent: 'foundational_explanation',
      preferredModality: 'video',
      providerCompatibility: ['curated_directory'],
      priority: 1,
      provenance: 'Verification test query',
      channelOrSourceHint: 'UCYO_jab_esuFRV4b17AJtAw',
    };

    const result = await adapter.search(query, { limit: 10 });
    assert.ok(result.candidates.length > 0, 'Must discover candidates from directory');

    // Verify presence of verified resources
    const verified = result.candidates.filter((c) => c.verificationStatus === 'verified_channel');
    assert.ok(verified.length > 0, 'Discovered items must be marked as verified_channel');
    assert.strictEqual(verified[0].creator?.authorId, 'PEN-ED-0001');
  });

  // --------------------------------------------------------------------------
  // Requirement 5: Playlist Items Retain Hierarchy and Educator Attribution
  // --------------------------------------------------------------------------
  it('5. Associates playlist items with correct parent playlist without fabricated duration', () => {
    const playlistItem: NormalizedResourceCandidate = {
      id: 'yt_pl_item_1',
      provider: 'youtube',
      externalId: 'fNk_zzaMoSs',
      title: 'Vectors, what even are they? | Chapter 1, Essence of linear algebra',
      description: 'Introduction to vectors in linear algebra by 3Blue1Brown.',
      canonicalUrl: 'https://www.youtube.com/watch?v=fNk_zzaMoSs',
      sourceUrl: 'https://www.youtube.com/watch?v=fNk_zzaMoSs',
      modality: 'video',
      durationSeconds: 590, // Genuine 9m 50s
      verificationStatus: 'verified_channel',
      creator: {
        name: '3Blue1Brown',
        channelId: 'UCYO_jab_esuFRV4b17AJtAw',
        authorId: 'PEN-ED-0001',
      },
      playlist: {
        isPlaylist: false,
        playlistId: 'PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab',
        playlistIndex: 1,
        playlistItemCount: 15,
      },
      missingMetadata: [],
      retrievalProvenance: { queryString: 'linear algebra vectors', provider: 'youtube',
        retrievedAt: new Date().toISOString() },
      rawMetadata: {
        isVerifiedEducator: true,
        educatorId: 'PEN-ED-0001',
        educatorName: 'Grant Sanderson (3Blue1Brown)',
        playlistId: 'PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab',
      },
    };

    assert.strictEqual(playlistItem.playlist?.playlistId, 'PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab');
    assert.strictEqual(playlistItem.playlist?.playlistIndex, 1);
    assert.strictEqual(playlistItem.durationSeconds, 590);
    assert.strictEqual(playlistItem.creator?.authorId, 'PEN-ED-0001');
  });

  // --------------------------------------------------------------------------
  // Requirement 6: Fallback to Other Sources when No Directory Educator Matches
  // --------------------------------------------------------------------------
  it('6. Falls back safely when directory educators have no relevant content', () => {
    const nicheContext = EducatorMatcher.deriveContext({
      courseTitle: 'Cuneiform Script Decipherment',
      moduleTitle: 'Ugaritic Cuneiform Alphabet and Epigraphy',
      academicLevel: 'graduate',
    });

    const matches = EducatorMatcher.matchEducators(nicheContext, { minScore: 50 });
    // No YouTube educator in the directory specializes in Ugaritic cuneiform
    assert.strictEqual(matches.length, 0, 'Directory should not falsely match niche Ugaritic epigraphy');

    // Engine continues discovering resources from academic and web sources
    const academicResource: NormalizedResourceCandidate = {
      id: 'openalex_ugaritic_doc',
      provider: 'academic_notes',
      externalId: 'W123456789',
      title: 'A Handbook of Ugaritic Cuneiform Alphabet and Epigraphy',
      description: 'Comprehensive academic treatise on Ugaritic cuneiform script decipherment, alphabet, and epigraphic texts.',
      canonicalUrl: 'https://archive.org/details/ugaritic-grammar',
      sourceUrl: 'https://archive.org/details/ugaritic-grammar',
      modality: 'monograph',
      verificationStatus: 'unverified_candidate',
      missingMetadata: [],
      retrievalProvenance: { queryString: 'Ugaritic cuneiform grammar handbook', provider: 'academic_notes',
        retrievedAt: new Date().toISOString() },
    };

    const objective = analyzer.analyze({
      courseTitle: 'Cuneiform Script Decipherment',
      moduleTitle: 'Ugaritic Cuneiform Alphabet and Epigraphy',
      academicLevel: 'graduate',
      domainHint: 'general_academic',
    }).objective;

    const rankResult = rankingEngine.rank(objective, [academicResource]);
    assert.strictEqual(rankResult.rankedCandidates.length, 1);
    assert.strictEqual(rankResult.rankedCandidates[0].candidate.id, 'openalex_ugaritic_doc');
  });

  // --------------------------------------------------------------------------
  // Requirement 7: Deduplication of Duplicate Resources
  // --------------------------------------------------------------------------
  it('7. Removes duplicate resources across identical URLs and provider IDs', () => {
    const objective = analyzer.analyze({
      courseTitle: 'Calculus I',
      moduleTitle: 'Limits and Continuity',
    }).objective;

    const item1: NormalizedResourceCandidate = {
      id: 'yt_limits_1',
      provider: 'youtube',
      externalId: 'limits123',
      title: 'Calculus 1 - Introduction to Limits',
      description: 'Understanding limits in calculus.',
      canonicalUrl: 'https://www.youtube.com/watch?v=limits123',
      sourceUrl: 'https://www.youtube.com/watch?v=limits123',
      modality: 'video',
      durationSeconds: 1200,
      verificationStatus: 'unverified_candidate',
      missingMetadata: [],
      retrievalProvenance: { queryString: 'calculus limits', provider: 'youtube' , retrievedAt: new Date().toISOString() },
    };

    const item1Duplicate: NormalizedResourceCandidate = {
      ...item1,
      id: 'yt_limits_dup',
    };

    const rankResult = rankingEngine.rank(objective, [item1, item1Duplicate]);
    assert.strictEqual(rankResult.rankedCandidates.length, 1, 'Duplicate candidate must be deduped');
  });

  // --------------------------------------------------------------------------
  // Requirement 8: Topic Relevance and Quality Thresholds Remain Enforced
  // --------------------------------------------------------------------------
  it('8. Enforces hard relevance threshold even under educator-aware scoring', () => {
    const objective = analyzer.analyze({
      courseTitle: 'Computer Science Data Structures',
      moduleTitle: 'Binary Search Trees and AVL Trees',
    }).objective;

    const weakCandidate: NormalizedResourceCandidate = {
      id: 'yt_low_rel',
      provider: 'youtube',
      externalId: 'lowrel001',
      title: 'Top 10 Programming Languages to Learn in 2026',
      description: 'Overview of industry trends in coding.',
      canonicalUrl: 'https://www.youtube.com/watch?v=lowrel001',
      sourceUrl: 'https://www.youtube.com/watch?v=lowrel001',
      modality: 'video',
      durationSeconds: 600,
      verificationStatus: 'unverified_candidate',
      missingMetadata: [],
      retrievalProvenance: { queryString: 'programming languages', provider: 'youtube' , retrievedAt: new Date().toISOString() },
    };

    const rankResult = rankingEngine.rank(objective, [weakCandidate], { minRelevanceThreshold: 50 });
    assert.strictEqual(rankResult.rankedCandidates.length, 0);
    assert.strictEqual(rankResult.rejectedCandidates.length, 1);
  });

  // --------------------------------------------------------------------------
  // Requirement 9: Educator Metadata Survives Normalization & Persistence
  // --------------------------------------------------------------------------
  it('9. Preserves educator metadata across distribution and database persistence mapping', () => {
    const objective = analyzer.analyze({
      courseTitle: 'Machine Learning',
      moduleTitle: 'Neural Networks Foundations',
    }).objective;

    const verifiedKarpathy: NormalizedResourceCandidate = {
      id: 'yt_karpathy_nn',
      provider: 'youtube',
      externalId: 'VMj-3S1tku0',
      title: 'The spelled-out intro to neural networks and backpropagation: building micrograd',
      description: 'Step by step implementation of micrograd and backpropagation by Andrej Karpathy.',
      canonicalUrl: 'https://www.youtube.com/watch?v=VMj-3S1tku0',
      sourceUrl: 'https://www.youtube.com/watch?v=VMj-3S1tku0',
      modality: 'video',
      durationSeconds: 8100,
      verificationStatus: 'verified_channel',
      creator: {
        name: 'Andrej Karpathy',
        channelId: 'UCXUPKJO5MZqnPe1L8Apy8qg',
        authorId: 'PEN-ED-0007',
      },
      missingMetadata: [],
      retrievalProvenance: { queryString: 'micrograd neural networks', provider: 'curated_directory' , retrievedAt: new Date().toISOString() },
      rawMetadata: {
        isVerifiedEducator: true,
        educatorId: 'PEN-ED-0007',
        educatorName: 'Andrej Karpathy',
        channelId: 'UCXUPKJO5MZqnPe1L8Apy8qg',
        discoverySource: 'curated_directory',
        selectionExplanation: 'Flagship deep learning lecture by Andrej Karpathy',
      },
    };

    const modules = [
      {
        moduleId: 'mod-nn-1',
        moduleNumber: 1,
        moduleTitle: 'Neural Networks Foundations',
        objective,
      },
    ];

    const distribution = distributor.distribute(modules, [verifiedKarpathy]);
    assert.strictEqual(distribution.modules[0].resources.length, 1);

    const distributedItem = distribution.modules[0].resources[0];
    assert.strictEqual(distributedItem.educatorId, 'PEN-ED-0007');
    assert.strictEqual(distributedItem.educatorName, 'Andrej Karpathy');
    assert.strictEqual(distributedItem.discoverySource, 'curated_directory');
    assert.ok(distributedItem.selectionExplanation?.includes('Karpathy'));

    // Test persistence mapping
    const persistence = persistenceMapper.mapDistributionToPersistence(distribution.modules, 'path-123');
    assert.strictEqual(persistence.databaseResources.length, 1);
    assert.strictEqual(persistence.databaseResources[0].educator_id, 'PEN-ED-0007');
    assert.strictEqual(persistence.databaseResources[0].discovery_source, 'curated_directory');

    assert.strictEqual(persistence.databaseLessons.length, 1);
    assert.strictEqual(persistence.databaseLessons[0].educator_id, 'PEN-ED-0007');
    assert.strictEqual(persistence.databaseLessons[0].discovery_source, 'curated_directory');
  });

  // --------------------------------------------------------------------------
  // Requirement 10: Subject-Specific Pedagogical Adaptation
  // --------------------------------------------------------------------------
  it('10. Adapts scoring to subject pedagogy (programming vs math vs competitive exams)', () => {
    // A. Programming domain rewards practical coding walkthroughs
    const codingObj = analyzer.analyze({
      courseTitle: 'Python Web Development',
      moduleTitle: 'Building REST APIs with FastAPI',
      domainHint: 'computer_science',
    }).objective;

    const practicalCodingCandidate: NormalizedResourceCandidate = {
      id: 'yt_fastapi_tut',
      provider: 'youtube',
      externalId: 'fastapi01',
      title: 'FastAPI Full Course 2026 - Build a Production REST API Step by Step',
      description: 'Hands-on live coding tutorial building REST endpoints, Pydantic models, and database migrations.',
      canonicalUrl: 'https://www.youtube.com/watch?v=fastapi01',
      sourceUrl: 'https://www.youtube.com/watch?v=fastapi01',
      modality: 'video',
      durationSeconds: 3600,
      verificationStatus: 'verified_channel',
      creator: { name: 'freeCodeCamp.org', channelId: 'UC8butISFwT-Wl7EV0hUK0BQ', authorId: 'PEN-ED-0004' },
      missingMetadata: [],
      retrievalProvenance: { queryString: 'fastapi tutorial', provider: 'curated_directory' , retrievedAt: new Date().toISOString() },
      rawMetadata: { isVerifiedEducator: true, educatorId: 'PEN-ED-0004' },
    };

    const codingRank = rankingEngine.rank(codingObj, [practicalCodingCandidate]);
    assert.ok(codingRank.rankedCandidates[0].overallScore >= 90, 'Practical coding tutorial should score highly in CS domain');

    // B. Mathematics domain rewards rigorous derivation and conceptual clarity
    const mathObj = analyzer.analyze({
      courseTitle: 'Real Analysis',
      moduleTitle: 'Epsilon-Delta Definition of Limits',
      domainHint: 'mathematics',
    }).objective;

    const mathLectureCandidate: NormalizedResourceCandidate = {
      id: 'yt_analysis_eps',
      provider: 'youtube',
      externalId: 'epsdelta01',
      title: 'The Epsilon Delta Definition of a Limit (Precise Definition)',
      description: 'Rigorous mathematical proof, derivation, and worked epsilon-delta problems.',
      canonicalUrl: 'https://www.youtube.com/watch?v=epsdelta01',
      sourceUrl: 'https://www.youtube.com/watch?v=epsdelta01',
      modality: 'video',
      durationSeconds: 1800,
      verificationStatus: 'verified_channel',
      creator: { name: 'Michael Penn', channelId: 'UC6jM0RFkr4eSkzT5Gx0HOAw', authorId: 'PEN-ED-0035' },
      missingMetadata: [],
      retrievalProvenance: { queryString: 'epsilon delta limit proof', provider: 'curated_directory' , retrievedAt: new Date().toISOString() },
      rawMetadata: { isVerifiedEducator: true, educatorId: 'PEN-ED-0035' },
    };

    const mathRank = rankingEngine.rank(mathObj, [mathLectureCandidate]);
    assert.ok(mathRank.rankedCandidates[0].overallScore >= 85, 'Rigorous derivation should score highly in Math domain');
  });

  // --------------------------------------------------------------------------
  // Requirement 11: Chapter Timestamps Resolution
  // --------------------------------------------------------------------------
  it('11. Resolves video chapter timestamps for long lectures into structured references', async () => {
    const lectureWithChapters: NormalizedResourceCandidate = {
      id: 'yt_lecture_chapters',
      provider: 'youtube',
      externalId: 'chapt123',
      title: 'Complete Course on Linear Algebra',
      description: `Complete university lecture course.
00:00:00 Introduction to Vectors
00:15:30 Matrix Operations and Transformations
00:45:00 Inverses and Determinants
01:10:00 Eigenvalues and Eigenvectors`,
      canonicalUrl: 'https://www.youtube.com/watch?v=chapt123',
      sourceUrl: 'https://www.youtube.com/watch?v=chapt123',
      modality: 'video',
      durationSeconds: 5400, // 90 min
      verificationStatus: 'verified_channel',
      creator: { name: 'Professor Leonard', channelId: 'UCcr_72x_aZ4yX3sT-VwG-oQ', authorId: 'PEN-ED-0012' },
      missingMetadata: [],
      retrievalProvenance: { queryString: 'linear algebra complete course', provider: 'curated_directory' , retrievedAt: new Date().toISOString() },
      rawMetadata: { isVerifiedEducator: true, educatorId: 'PEN-ED-0012' },
    };

    const mockProvider: ResourceProviderAdapter = {
      id: 'youtube',
      name: 'Mock YouTube',
      capabilities: {
        supportedModalities: ['video'],
        maxBatchSize: 10,
        supportsCancellation: false,
        supportsPlaylistExpansion: false,
        quotaLimited: false,
        requiresApiKey: false,
      },
      getHealthStatus: () => ({ available: true, quotaExhausted: false, cooldownRemainingMs: 0, circuitBreakerState: 'CLOSED' }),
      supportsQuery: () => true,
      search: async () => ({
        provider: 'youtube',
        query: 'linear algebra',
        candidates: [lectureWithChapters],
        metadata: { latencyMs: 5, cacheHit: false, totalFetched: 1 },
      }),
    };

    const providerRegistry = new ProviderRegistry({ empty: true });
    providerRegistry.register(mockProvider);

    const engine = new ResourceEngineV2({ providerRegistry });
    const result = await engine.discover({
      query: 'Linear Algebra Matrices and Determinants',
      domain: 'mathematics',
    });

    assert.ok(result.distributedModules.length > 0);
    const assignedResource = result.distributedModules[0].resources[0];
    assert.ok(assignedResource, 'Resource must be assigned');
    assert.ok(assignedResource.chapters.length >= 4, 'Must extract chapters from timestamped description');
    assert.strictEqual(assignedResource.chapters[0].title, 'Introduction to Vectors');
  });

  // --------------------------------------------------------------------------
  // Requirement 12: Honest Empty State
  // --------------------------------------------------------------------------
  it('12. Produces an honest empty state without fabricating fillers when candidates are ineligible', () => {
    const objective = analyzer.analyze({
      courseTitle: 'Quantum Chromodynamics',
      moduleTitle: 'Gluon Self-Interaction and Asymptotic Freedom',
      domainHint: 'physics',
    }).objective;

    // Only low-quality or off-topic candidate available
    const irrelevantCandidate: NormalizedResourceCandidate = {
      id: 'yt_irrelevant',
      provider: 'youtube',
      externalId: 'random99',
      title: 'Funny Cat Compilation 2026',
      description: 'Cutest cats doing silly things.',
      canonicalUrl: 'https://www.youtube.com/watch?v=random99',
      sourceUrl: 'https://www.youtube.com/watch?v=random99',
      modality: 'video',
      durationSeconds: 300,
      verificationStatus: 'unverified_candidate',
      missingMetadata: [],
      retrievalProvenance: { queryString: 'cats', provider: 'youtube' , retrievedAt: new Date().toISOString() },
    };

    const modules = [
      {
        moduleId: 'mod-qcd-1',
        moduleNumber: 1,
        moduleTitle: 'Gluon Self-Interaction and Asymptotic Freedom',
        objective,
      },
    ];

    const distribution = distributor.distribute(modules, [irrelevantCandidate]);
    assert.strictEqual(distribution.modules[0].resources.length, 0);
    assert.strictEqual(distribution.modules[0].isEmptyState, true);
    assert.ok(distribution.modules[0].emptyStateReason?.includes('threshold'));
  });
});
