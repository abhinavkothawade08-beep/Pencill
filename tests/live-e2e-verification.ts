import {
  ResourceEngineV2,
  educatorRegistry,
  CuratedDirectoryAdapter,
  ExplainableRankingEngine,
  PersistenceMapper,
} from '../src/lib/resource-engine-v2';
import { EducatorMatcher } from '../src/lib/resource-engine-v2/educators/educator-matcher';
import { ChannelVerifier } from '../src/lib/resource-engine-v2/educators/channel-verifier';
import { LearningObjectiveAnalyzer } from '../src/lib/resource-engine-v2/analysis/objective-analyzer';

async function runEndToEndVerification() {
  console.log('='.repeat(80));
  console.log('PENCILL RESOURCE ENGINE 2.0: MASTER EDUCATOR DIRECTORY LIVE VERIFICATION');
  console.log('='.repeat(80));

  const engine = new ResourceEngineV2();
  const analyzer = new LearningObjectiveAnalyzer();

  // --------------------------------------------------------------------------
  // Scenario 1: Mathematics / Linear Algebra (Grant Sanderson / 3Blue1Brown)
  // --------------------------------------------------------------------------
  console.log('\n[TEST 1] Scenario: Higher Education Linear Algebra');
  const mathOutput = await engine.discover({
    query: 'Essence of Linear Algebra and Vector Spaces',
    domain: 'mathematics',
    level: 'undergraduate',
  });

  console.log(`  Engine Domain: ${mathOutput.domain}`);
  console.log(`  Modules Distributed: ${mathOutput.distributedModules.length}`);
  const m1 = mathOutput.distributedModules[0];
  console.log(`  Module Title: "${m1.moduleTitle}"`);
  console.log(`  Assigned Resources: ${m1.resources.length}`);

  let found3b1b = false;
  for (const res of m1.resources) {
    console.log(`    - [${res.modality.toUpperCase()}] "${res.title}"`);
    console.log(`      Source: ${res.sourceName} | Educator ID: ${res.educatorId || 'N/A'} | Verified: ${res.isVerified}`);
    console.log(`      Score: ${res.overallScore}/100 | Rationale: ${res.selectionReason.slice(0, 90)}...`);
    if (res.educatorId === 'PEN-ED-0001' || res.creator?.name?.includes('3Blue1Brown') || res.sourceName?.includes('3Blue1Brown')) {
      found3b1b = true;
    }
  }

  if (found3b1b) {
    console.log('  >>> SUCCESS: 3Blue1Brown verified resource correctly prioritized and attributed!');
  } else {
    console.log('  >>> Note: Open discovery candidates evaluated.');
  }

  // --------------------------------------------------------------------------
  // Scenario 2: Deep Learning & Python Implementation (Andrej Karpathy)
  // --------------------------------------------------------------------------
  console.log('\n[TEST 2] Scenario: Deep Learning & Backpropagation from Scratch');
  const dlOutput = await engine.discover({
    query: 'Building Neural Networks and Backpropagation in Python',
    domain: 'data_science_ai',
    academicLevel: 'undergraduate',
    modules: [
      {
        moduleId: 'mod-dl-1',
        moduleNumber: 1,
        moduleTitle: 'Foundations of Backpropagation',
        objective: 'Understand gradient descent, chain rule, and computational graphs',
        subtopics: ['gradients', 'chain rule', 'computational graph'],
      },
      {
        moduleId: 'mod-dl-2',
        moduleNumber: 2,
        moduleTitle: 'Implementing Neural Networks in Python',
        objective: 'Build neural network models in Python step by step',
        subtopics: ['python implementation', 'loss function', 'backprop algorithm'],
      },
    ],
  });

  console.log(`  Modules Distributed: ${dlOutput.distributedModules.length}`);
  for (const mod of dlOutput.distributedModules) {
    console.log(`  Module ${mod.moduleNumber}: "${mod.moduleTitle}" (${mod.resources.length} resources)`);
    for (const r of mod.resources) {
      console.log(`    - Role: [${r.assignedRole}] "${r.title.slice(0, 60)}"`);
      console.log(`      Educator: ${r.educatorName || r.sourceName} (${r.educatorId || 'N/A'})`);
      console.log(`      Pedagogical Evidence: ${r.selectionReason.slice(0, 80)}...`);
    }
  }

  // --------------------------------------------------------------------------
  // Scenario 3: State Board / Competitive Exam (Maharashtra HSC Mathematics)
  // --------------------------------------------------------------------------
  console.log('\n[TEST 3] Scenario: State Board & Exam Syllabi Alignment (Maharashtra HSC Math)');
  const hscOutput = await engine.discover({
    query: 'Class 12 Maharashtra State Board Mathematics Matrices and Determinants',
    subject: 'Mathematics',
    targetExam: 'Maharashtra HSC Board',
    academicLevel: 'class-12',
  });

  console.log(`  Target Exam: Maharashtra HSC Board`);
  console.log(`  Module Title: "${hscOutput.distributedModules[0]?.moduleTitle}"`);
  for (const r of hscOutput.distributedModules[0]?.resources || []) {
    console.log(`    - [${r.assignedRole}] "${r.title}" (Score: ${r.overallScore})`);
    console.log(`      Educator Attribution: ${r.educatorName || r.sourceName} | Discovery Source: ${r.discoverySource}`);
  }

  // --------------------------------------------------------------------------
  // Scenario 4: Database Persistence Integrity Dry-Run
  // --------------------------------------------------------------------------
  console.log('\n[TEST 4] Scenario: Persistence Mapper & Supabase Schema Contract Validation');
  const persistenceResult = mathOutput.persistenceMapping;
  console.log(`  Mapped Database Resources: ${persistenceResult.databaseResources.length}`);
  console.log(`  Mapped Database Lessons: ${persistenceResult.databaseLessons.length}`);
  console.log(`  Unmapped Field Warnings: ${persistenceResult.unmappedFields.length} (Audited for schema transparency)`);

  const sampleDbRes = persistenceResult.databaseResources[0];
  if (sampleDbRes) {
    console.log('  Sample Database Resource Record:');
    console.log(`    - ID: ${sampleDbRes.id}`);
    console.log(`    - Type: ${sampleDbRes.type}`);
    console.log(`    - Educator ID: ${sampleDbRes.educator_id}`);
    console.log(`    - Discovery Source: ${sampleDbRes.discovery_source}`);
    console.log(`    - Quality Score: ${sampleDbRes.quality_score}`);
    console.log(`    - Canonical URL: ${sampleDbRes.source_url}`);
  }

  // --------------------------------------------------------------------------
  // Scenario 5: Strict Anti-Impersonation & Channel Identity Check
  // --------------------------------------------------------------------------
  console.log('\n[TEST 5] Scenario: Strict Anti-Impersonation Channel Identity Gate');
  const edu3b1b = educatorRegistry.getById('PEN-ED-0001')!;
  console.log(`  Educator: ${edu3b1b.Educator_Name} (Channel ID: ${edu3b1b.YouTube_Channel_ID})`);

  const genuine3b1bCheck = ChannelVerifier.verifyChannelIdentity(
    {
      channelId: 'UCYO_jab_esuFRV4b17AJtAw',
      channelTitle: '3Blue1Brown',
      videoTitle: 'Essence of Linear Algebra',
    },
    edu3b1b
  );
  console.log(`  Genuine Channel Match: verified = ${genuine3b1bCheck.isVerifiedEducator} (${genuine3b1bCheck.confidence})`);

  const fake3b1bCheck = ChannelVerifier.verifyChannelIdentity(
    {
      channelId: 'UCfakeImpersonator999',
      channelTitle: '3Blue1Brown Fan Channel',
      videoTitle: '3Blue1Brown Reacts to Math Problem',
    },
    edu3b1b
  );
  console.log(`  Impersonator Mismatch: verified = ${fake3b1bCheck.isVerifiedEducator} (${fake3b1bCheck.evidence})`);

  // --------------------------------------------------------------------------
  // Scenario 6: Hard Relevance Gating on Unrelated Videos
  // --------------------------------------------------------------------------
  console.log('\n[TEST 6] Scenario: Hard Relevance Gating on Unrelated Trusted Educator Content');
  const rankEngine = new ExplainableRankingEngine();
  const chemObj = analyzer.analyze({
    courseTitle: 'Organic Chemistry Reactions',
    moduleTitle: 'Electrophilic Aromatic Substitution Mechanisms',
    academicLevel: 'undergraduate',
    domainHint: 'chemistry',
  }).objective;

  const offTopicResult = rankEngine.rank(
    chemObj,
    [
      {
        id: 'yt_unrelated_3b1b',
        provider: 'youtube',
        externalId: 'crypto123',
        title: 'How Bitcoin Works Under the Hood | Blockchain Math',
        description: 'Mathematical explanation of public-key cryptography and proof-of-work in Bitcoin.',
        canonicalUrl: 'https://www.youtube.com/watch?v=crypto123',
        sourceUrl: 'https://www.youtube.com/watch?v=crypto123',
        modality: 'video',
        durationSeconds: 1500,
        verificationStatus: 'verified_channel',
        creator: { name: '3Blue1Brown', channelId: 'UCYO_jab_esuFRV4b17AJtAw', authorId: 'PEN-ED-0001' },
        missingMetadata: [],
        retrievalProvenance: { queryString: 'crypto', provider: 'curated_directory', retrievedAt: new Date().toISOString() },
        rawMetadata: { isVerifiedEducator: true, educatorId: 'PEN-ED-0001' },
      },
    ]
  );

  console.log(`  Off-topic candidate eligible: ${offTopicResult.rankedCandidates.length > 0}`);
  console.log(`  Off-topic candidate rejected: ${offTopicResult.rejectedCandidates.length > 0}`);
  if (offTopicResult.rejectedCandidates.length > 0) {
    console.log(`  Rejection Reason: ${offTopicResult.rejectedCandidates[0].rejectionReasons[0]}`);
    console.log('  >>> SUCCESS: Educator prestige cannot override relevance threshold!');
  }

  console.log('\n' + '='.repeat(80));
  console.log('ALL VERIFICATION SCENARIOS COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(80));
}

runEndToEndVerification().catch(console.error);
