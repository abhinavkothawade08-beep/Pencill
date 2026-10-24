import fs from 'fs';
import path from 'path';
import {
  YouTubeProvider,
  educatorRegistry,
  EducatorMatcher,
  DiscoveryEngine,
  DeduplicationEngine,
  QualityScoringEngine,
  ChannelVerifier,
} from '../src/lib/resource-engine-v2';

// Populate environment from .env.local
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (match) {
      process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }
}

async function runLiveVerification() {
  console.log('================================================================');
  console.log('  TEST 1: LIVE YOUTUBE RESOURCE DISCOVERY');
  console.log('================================================================');

  const yt = new YouTubeProvider();
  const apiKey = (yt as any).getApiKey();
  console.log('API Key configured:', !!apiKey, 'Masked preview:', apiKey ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}` : 'NONE');

  // Check 1: Python educators
  const pyCtx = EducatorMatcher.deriveContext({
    courseTitle: 'Complete Python Programming Course',
    desiredResourceType: 'full_course',
  });
  const matchedEducators = EducatorMatcher.matchEducators(pyCtx, { limit: 5 });
  console.log(`\nMatched ${matchedEducators.length} Python educators from Master Directory:`);
  matchedEducators.forEach((m, idx) => {
    console.log(`  [${idx + 1}] ${m.educator.Educator_ID}: ${m.educator.Educator_Name}`);
    console.log(`      Channel: "${m.educator.YouTube_Channel_Name}" | Channel ID: ${m.educator.YouTube_Channel_ID || '(none)'}`);
    console.log(`      Score: ${m.score.totalScore} | Complete Course: ${m.educator.Complete_Course_Available}`);
    console.log(`      Reasons: ${m.matchingReasons.join('; ')}`);
  });

  // Check 2: Live Search execution
  console.log('\nExecuting YouTubeProvider.search("Complete Python Programming Course")...');
  const t0 = Date.now();
  const results = await yt.search('Complete Python Programming Course', {
    limit: 5,
    targetTypes: ['full_course', 'youtube_playlist'],
  });
  const elapsed = Date.now() - t0;
  console.log(`Search completed in ${elapsed}ms. Returned ${results.length} resources.`);

  results.forEach((r, idx) => {
    console.log(`\n--- Result [${idx + 1}] ---`);
    console.log(`  Title:            ${r.title}`);
    console.log(`  Type:             ${r.type}`);
    console.log(`  Channel / Author: ${r.authorOrChannel} (Channel ID: ${r.channelId || 'none'})`);
    console.log(`  Canonical URL:    ${r.canonicalUrl}`);
    console.log(`  Duration:         ${r.durationMinutes} minutes`);
    console.log(`  Discovery Source: ${r.discoverySource}`);
    console.log(`  Educator Match:   ${r.educatorId ? `${r.educatorId} (${r.educatorName})` : 'None (Open Search)'}`);
    console.log(`  Verification:     ${r.verificationStatus}`);
    console.log(`  Selection Reason: ${r.selectionExplanation}`);
  });

  // Check 3: Live API vs Fallback check
  const isLive = results.some(r => r.discoverySource === 'fallback_search' || (r.discoverySource === 'curated_directory' && r.metadata?.identityConfidence));
  console.log('\nLive provider status:');
  if (apiKey) {
    console.log('  Live API Key was provided to provider.');
  }
}

runLiveVerification().catch(console.error);
