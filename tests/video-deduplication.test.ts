import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractYouTubeVideoId,
  extractTimestampFromUrl,
  parseTimestampToSeconds,
  extractVideoChapters,
  formatYouTubeTimestampUrl,
  canonicalizeUrl,
} from '@/lib/resource-engine-v2/utils/url-utils';
import { DeduplicationEngine } from '../.backup_engine_v1/core/deduplication-engine';
import { SearchPlanner } from '../.backup_engine_v1/core/search-planner';
import { YouTubeProvider } from '../.backup_engine_v1/providers/youtubeProvider';
import { distributeResourcesToCourse } from '@/lib/resource-engine-v2';
import { repairCourseVideoDuplicates } from '@/services/supabase/pathService';
import { EngineResource } from '../.backup_engine_v1/types';
import { LearningPath } from '@/types';

function makeVideo(overrides: Partial<EngineResource>): EngineResource {
  const rawId = overrides.id || `yt_${Math.random().toString(36).substring(2, 11)}`;
  const cleanId = rawId.replace(/^yt_/, '').padEnd(11, '0').slice(0, 11);
  const pubDate = overrides.publishedAt || (typeof overrides.metadata?.publishedAt === 'string' ? overrides.metadata.publishedAt : undefined) || '2025-06-15T12:00:00Z';

  return {
    id: rawId,
    title: overrides.title || 'Technical Lecture Tutorial',
    description: overrides.description || 'In-depth lecture and practical implementation.',
    type: overrides.type || 'video_lecture',
    canonicalUrl: overrides.canonicalUrl || `https://www.youtube.com/watch?v=${cleanId}`,
    sourceUrl: overrides.sourceUrl || `https://www.youtube.com/watch?v=${cleanId}`,
    sourceName: overrides.sourceName || 'FreeCodeCamp',
    provider: 'youtube',
    authorOrChannel: overrides.authorOrChannel || 'FreeCodeCamp',
    durationMinutes: overrides.durationMinutes ?? 45,
    difficulty: overrides.difficulty || 'intermediate',
    language: 'en',
    score: overrides.score || {
      overall: 88,
      relevance: 90,
      educationalValue: 88,
      structureCompleteness: 85,
      freshness: 90,
    },
    tags: overrides.tags || ['programming'],
    metadata: {
      videoId: cleanId,
      definition: 'hd',
      hasCaptions: true,
      isEmbeddable: true,
      publishedAt: pubDate,
      ...overrides.metadata,
    },
    discoveredAt: new Date().toISOString(),
    publishedAt: pubDate,
    ...overrides,
  };
}

describe('Global Video Deduplication & Module-Specific Sourcing Pipeline', () => {
  const deduplicationEngine = new DeduplicationEngine();

  // ==========================================================================
  // 1. YouTube URL Normalization & Video ID Extraction
  // ==========================================================================
  describe('1. YouTube URL Normalization & Video ID Extraction', () => {
    const canonicalVideoId = 'dQw4w9WgXcQ';
    const testCases: { format: string; url: string; expectedId: string }[] = [
      { format: 'Standard watch URL', url: `https://www.youtube.com/watch?v=${canonicalVideoId}`, expectedId: canonicalVideoId },
      { format: 'Standard watch URL with extra params', url: `https://www.youtube.com/watch?v=${canonicalVideoId}&feature=emb_rel_end&ab_channel=Artist`, expectedId: canonicalVideoId },
      { format: 'Shortened youtu.be URL', url: `https://youtu.be/${canonicalVideoId}`, expectedId: canonicalVideoId },
      { format: 'Shortened youtu.be URL with timestamp', url: `https://youtu.be/${canonicalVideoId}?t=120`, expectedId: canonicalVideoId },
      { format: 'Embed URL', url: `https://www.youtube.com/embed/${canonicalVideoId}`, expectedId: canonicalVideoId },
      { format: 'Shorts URL', url: `https://www.youtube.com/shorts/${canonicalVideoId}`, expectedId: canonicalVideoId },
      { format: 'Live stream URL', url: `https://www.youtube.com/live/${canonicalVideoId}`, expectedId: canonicalVideoId },
      { format: 'Old /v/ URL', url: `https://www.youtube.com/v/${canonicalVideoId}`, expectedId: canonicalVideoId },
      { format: 'Music YouTube URL', url: `https://music.youtube.com/watch?v=${canonicalVideoId}`, expectedId: canonicalVideoId },
      { format: 'Mobile m.youtube.com URL', url: `https://m.youtube.com/watch?v=${canonicalVideoId}`, expectedId: canonicalVideoId },
      { format: 'URL without scheme', url: `youtube.com/watch?v=${canonicalVideoId}`, expectedId: canonicalVideoId },
      { format: 'Direct 11-char video ID', url: canonicalVideoId, expectedId: canonicalVideoId },
    ];

    for (const tc of testCases) {
      test(`Extracts canonical video ID from ${tc.format}`, () => {
        const extracted = extractYouTubeVideoId(tc.url);
        assert.strictEqual(extracted, tc.expectedId, `Failed to extract from ${tc.url}`);
      });
    }

    test('DeduplicationEngine detects duplicate videos across different URL formats', () => {
      const v1 = makeVideo({
        id: 'v_standard',
        canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Deep Learning Specialization - Lesson 1',
        score: { overall: 90, relevance: 92, educationalValue: 90, structureCompleteness: 90, freshness: 90 },
      });

      const v2 = makeVideo({
        id: 'v_shortened',
        canonicalUrl: 'https://youtu.be/dQw4w9WgXcQ?t=15s',
        title: 'Deep Learning Specialization - Lesson 1',
        score: { overall: 85, relevance: 88, educationalValue: 85, structureCompleteness: 85, freshness: 85 },
      });

      const v3 = makeVideo({
        id: 'v_embed',
        canonicalUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        title: 'Deep Learning Specialization - Lesson 1',
        score: { overall: 80, relevance: 80, educationalValue: 80, structureCompleteness: 80, freshness: 80 },
      });

      const vDistinct = makeVideo({
        id: 'v_distinct',
        canonicalUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        title: 'Attention Mechanism in Depth',
        score: { overall: 92, relevance: 94, educationalValue: 92, structureCompleteness: 90, freshness: 90 },
      });

      const deduplicated = deduplicationEngine.deduplicate([v1, v2, v3, vDistinct]);
      assert.strictEqual(deduplicated.length, 2, 'Must collapse 3 different URL formats of dQw4w9WgXcQ into 1');
      assert.strictEqual(deduplicated[0].canonicalUrl, v1.canonicalUrl, 'Must keep higher-scoring canonical video');
      assert.strictEqual(deduplicated[1].canonicalUrl, vDistinct.canonicalUrl, 'Must preserve distinct video');
    });
  });

  // ==========================================================================
  // 2. Module-Specific Dynamic Query Generation
  // ==========================================================================
  describe('2. Module-Specific Dynamic Query Generation', () => {
    const searchPlanner = new SearchPlanner();

    test('Generates distinct, topic-focused queries for each module instead of reusing generic course query', () => {
      const courseTopic = 'Next.js 14 Full Stack Development';

      const planMod1 = searchPlanner.createModuleVideoPlan({
        courseTopic,
        domain: 'Computer Science',
        moduleTitle: 'App Router & Server Components',
        moduleDescription: 'Learn React Server Components, client components, and layout streaming architecture.',
        subtopics: ['Server Components', 'Layouts', 'Streaming SSR', 'Suspense'],
        difficulty: 'intermediate',
      });

      const planMod2 = searchPlanner.createModuleVideoPlan({
        courseTopic,
        domain: 'Computer Science',
        moduleTitle: 'Server Actions & Mutations',
        moduleDescription: 'Implement forms, useActionState, optimistic updates, and database mutations with Server Actions.',
        subtopics: ['Server Actions', 'Form Action', 'Optimistic UI', 'Revalidation'],
        difficulty: 'intermediate',
      });

      const queriesMod1 = planMod1.map((q) => q.toLowerCase());
      const queriesMod2 = planMod2.map((q) => q.toLowerCase());

      // Queries must be different and specific to their modules
      assert.notDeepStrictEqual(queriesMod1, queriesMod2, 'Module 1 and Module 2 must have distinct queries');

      const mod1HasSpecificKeywords = queriesMod1.some(
        (q) => q.includes('server component') || q.includes('app router') || q.includes('layout')
      );
      assert.ok(mod1HasSpecificKeywords, `Module 1 queries must include module subtopics: ${queriesMod1.join(', ')}`);

      const mod2HasSpecificKeywords = queriesMod2.some(
        (q) => q.includes('server action') || q.includes('mutation') || q.includes('optimistic')
      );
      assert.ok(mod2HasSpecificKeywords, `Module 2 queries must include module subtopics: ${queriesMod2.join(', ')}`);

      // No query should be just the generic course topic without module context
      for (const q of queriesMod1) {
        assert.notStrictEqual(q, courseTopic.toLowerCase(), 'Must not emit bare course query');
      }
      for (const q of queriesMod2) {
        assert.notStrictEqual(q, courseTopic.toLowerCase(), 'Must not emit bare course query');
      }
    });
  });

  // ==========================================================================
  // 3. Global Video Deduplication Across Course Modules
  // ==========================================================================
  describe('3. Global Video Deduplication Across Modules', () => {
    test('Ensures different modules receive distinct videos, evaluating next-best candidate on collision', () => {
      const videoA = makeVideo({
        id: 'yt_video_AAA',
        canonicalUrl: 'https://www.youtube.com/watch?v=AAAAAAAAAAA',
        title: 'Modern Web Architecture: Fundamentals and State Management',
        description: 'Comprehensive guide covering HTML, CSS, React components, and Zustand state.',
        score: { overall: 94, relevance: 95, educationalValue: 92, structureCompleteness: 90, freshness: 90 },
      });

      const videoB = makeVideo({
        id: 'yt_video_BBB',
        canonicalUrl: 'https://www.youtube.com/watch?v=BBBBBBBBBBB',
        title: 'Advanced State Management: Redux Toolkit & Zustand',
        description: 'Deep dive into state machines, atomic state, Redux Toolkit and Zustand.',
        score: { overall: 91, relevance: 94, educationalValue: 90, structureCompleteness: 88, freshness: 90 },
      });

      const videoC = makeVideo({
        id: 'yt_video_CCC',
        canonicalUrl: 'https://www.youtube.com/watch?v=CCCCCCCCCCC',
        title: 'Next.js Routing and API Architecture',
        description: 'Server side routes, dynamic params, and nested layout architecture.',
        score: { overall: 89, relevance: 92, educationalValue: 88, structureCompleteness: 86, freshness: 90 },
      });

      // Same video as A but with different URL format
      const videoAShort = makeVideo({
        id: 'yt_video_AAA_short',
        canonicalUrl: 'https://youtu.be/AAAAAAAAAAA?feature=shared',
        title: 'Modern Web Architecture: Fundamentals and State Management',
        score: { overall: 93, relevance: 94, educationalValue: 92, structureCompleteness: 90, freshness: 90 },
      });

      const curriculum = {
        title: 'Full Stack Web Engineering',
        domain: 'Computer Science',
        level: 'Intermediate',
        durationHours: 15,
        moduleCount: 3,
        modules: [
          {
            moduleNumber: 1,
            title: 'Frontend Fundamentals & Components',
            objective: 'Build reusable component hierarchies',
            estimatedHours: 5,
            lessons: [{ title: 'Component Hierarchies', type: 'video' as const, estimatedMinutes: 40, keyConcepts: ['Components', 'Props', 'Rendering'] }],
          },
          {
            moduleNumber: 2,
            title: 'Global State Management',
            objective: 'Master state libraries and stores',
            estimatedHours: 5,
            lessons: [{ title: 'Store Architecture', type: 'video' as const, estimatedMinutes: 40, keyConcepts: ['State Management', 'Redux', 'Zustand'] }],
          },
          {
            moduleNumber: 3,
            title: 'Routing & Server APIs',
            objective: 'Implement server routing and API handlers',
            estimatedHours: 5,
            lessons: [{ title: 'Server Routing', type: 'video' as const, estimatedMinutes: 40, keyConcepts: ['Routing', 'API Architecture'] }],
          },
        ],
      };

      const distributed = distributeResourcesToCourse(curriculum, [
        videoA,
        videoAShort, // duplicate of videoA in different format
        videoB,
        videoC,
      ]);

      const mod1Video = distributed.modules[0].lessons[0];
      const mod2Video = distributed.modules[1].lessons[0];
      const mod3Video = distributed.modules[2].lessons[0];

      const id1 = extractYouTubeVideoId(mod1Video.sourceUrl || '');
      const id2 = extractYouTubeVideoId(mod2Video.sourceUrl || '');
      const id3 = extractYouTubeVideoId(mod3Video.sourceUrl || '');

      assert.ok(id1 && id2 && id3, 'All modules must have assigned video IDs');
      assert.notStrictEqual(id1, id2, 'Module 1 and Module 2 must not have identical video IDs');
      assert.notStrictEqual(id2, id3, 'Module 2 and Module 3 must not have identical video IDs');
      assert.notStrictEqual(id1, id3, 'Module 1 and Module 3 must not have identical video IDs');

      // Mod 1 should get videoA, Mod 2 should get videoB (next best), Mod 3 should get videoC
      assert.strictEqual(id1, 'AAAAAAAAAAA');
      assert.strictEqual(id2, 'BBBBBBBBBBB');
      assert.strictEqual(id3, 'CCCCCCCCCCC');
    });
  });

  // ==========================================================================
  // 4. Chapter & Timestamp References for Comprehensive Lectures
  // ==========================================================================
  describe('4. Chapter & Timestamp References for Comprehensive Lectures', () => {
    test('Assigns timestamped chapter URLs to modules when a comprehensive lecture includes chapter timestamps', () => {
      const comprehensiveLecture = makeVideo({
        id: 'yt_comp_python_chapters',
        canonicalUrl: 'https://www.youtube.com/watch?v=compPython0',
        title: 'Python Complete Masterclass: From Beginner to Advanced',
        description: `00:00 - Introduction & Setup
15:30 - Variables, Primitives & Memory Models
45:00 - Control Flow, Conditionals and Loops
1:30:00 - Data Structures: Lists, Dictionaries and Sets
2:15:00 - Functions, Scopes and Closures`,
        type: 'full_course',
        durationMinutes: 240,
        score: { overall: 96, relevance: 98, educationalValue: 96, structureCompleteness: 95, freshness: 92 },
        metadata: { isFullCourse: true },
      });

      const curriculum = {
        title: 'Python Mastery',
        domain: 'Computer Science',
        level: 'Beginner',
        durationHours: 8,
        moduleCount: 3,
        modules: [
          {
            moduleNumber: 1,
            title: 'Variables, Primitives & Memory',
            objective: 'Understand primitive data types and memory allocations',
            estimatedHours: 2,
            lessons: [{ title: 'Variables and Primitives', type: 'video' as const, estimatedMinutes: 30, keyConcepts: ['Variables', 'Primitives', 'Memory'] }],
          },
          {
            moduleNumber: 2,
            title: 'Control Flow & Conditionals',
            objective: 'Master branching and loop constructs',
            estimatedHours: 3,
            lessons: [{ title: 'Control Flow and Loops', type: 'video' as const, estimatedMinutes: 45, keyConcepts: ['Control Flow', 'Conditionals', 'Loops'] }],
          },
          {
            moduleNumber: 3,
            title: 'Data Structures & Collections',
            objective: 'Master lists, dictionaries, and sets',
            estimatedHours: 3,
            lessons: [{ title: 'Lists and Dictionaries', type: 'video' as const, estimatedMinutes: 45, keyConcepts: ['Data Structures', 'Lists', 'Dictionaries', 'Sets'] }],
          },
        ],
      };

      const distributed = distributeResourcesToCourse(curriculum, [comprehensiveLecture]);

      const mod1Video = distributed.modules[0].lessons[0];
      const mod2Video = distributed.modules[1].lessons[0];
      const mod3Video = distributed.modules[2].lessons[0];

      assert.ok(mod1Video.sourceUrl?.includes('t=930s'), `Module 1 must link to chapter at 15:30 (930s), got: ${mod1Video.sourceUrl}`);
      assert.ok(mod2Video.sourceUrl?.includes('t=2700s'), `Module 2 must link to chapter at 45:00 (2700s), got: ${mod2Video.sourceUrl}`);
      assert.ok(mod3Video.sourceUrl?.includes('t=5400s'), `Module 3 must link to chapter at 1:30:00 (5400s), got: ${mod3Video.sourceUrl}`);

      assert.ok(mod1Video.selectionReason?.includes('Variables, Primitives'));
      assert.ok(mod2Video.selectionReason?.includes('Control Flow, Conditionals and Loops'));
      assert.ok(mod3Video.selectionReason?.includes('Data Structures: Lists, Dictionaries and Sets'));
    });
  });

  // ==========================================================================
  // 5. Provider Exclusion Filtering & Cache Isolation
  // ==========================================================================
  describe('5. Provider Exclusion Filtering', () => {
    test('YouTubeProvider rejects candidate videos matching excludeVideoIds and excludeUrls', async () => {
      const provider = new YouTubeProvider();
      const verifiedList = provider.isAvailable();
      assert.ok(verifiedList, 'Verified educator directory should be available');

      // Search for Calculus without exclusion
      const baselineResults = await provider.search('Calculus', { limit: 5 });
      assert.ok(baselineResults.length > 0, 'Baseline search must return results');

      const firstVideo = baselineResults[0];
      const excludedVidId = extractYouTubeVideoId(firstVideo.canonicalUrl || firstVideo.sourceUrl) || firstVideo.externalId;
      assert.ok(excludedVidId, 'First result must have a valid video ID');

      // Search again with excluded video ID
      const filteredResults = await provider.search('Calculus', {
        limit: 5,
        excludeVideoIds: new Set([excludedVidId!]),
      });

      for (const res of filteredResults) {
        const vidId = extractYouTubeVideoId(res.canonicalUrl || res.sourceUrl) || res.externalId;
        assert.notStrictEqual(vidId, excludedVidId, `Excluded video ID ${excludedVidId} must not be returned`);
      }
    });
  });

  // ==========================================================================
  // 6. Course-Level Repair & Persistence Across Refreshes
  // ==========================================================================
  describe('6. Course-Level Repair & Persistence', () => {
    test('repairCourseVideoDuplicates repairs stale duplicate videos across modules without data loss', () => {
      const staleCourse: LearningPath = {
        id: 'course-calc-101',
        title: 'Calculus and Analysis',
        description: 'Comprehensive undergraduate calculus course.',
        domain: 'Mathematics',
        level: 'Intermediate',
        durationHours: 20,
        moduleCount: 3,
        verified: true,
        enrolledCount: 42,
        averageCompletion: '35%',
        isPublished: true,
        modules: [
          {
            id: 'mod-1',
            pathId: 'course-calc-101',
            title: 'Limits and Continuity',
            moduleNumber: 1,
            orderIndex: 0,
            status: 'completed',
            totalResources: 1,
            completedResources: 1,
            lessons: [
              {
                id: 'les-1-1',
                moduleId: 'mod-1',
                title: 'Epsilon-Delta Definition of Limits',
                type: 'video',
                durationMinutes: 45,
                sourceName: 'MIT OpenCourseWare',
                sourceUrl: 'https://www.youtube.com/watch?v=calcMaster0',
                orderIndex: 0,
                chapters: [],
                formulae: [],
                summaryPoints: ['Definition of limit'],
                studyNotes: [],
              },
            ],
          },
          {
            id: 'mod-2',
            pathId: 'course-calc-101',
            title: 'Derivatives & Rates of Change',
            moduleNumber: 2,
            orderIndex: 1,
            status: 'in_progress',
            totalResources: 1,
            completedResources: 0,
            lessons: [
              {
                id: 'les-2-1',
                moduleId: 'mod-2',
                title: 'Chain Rule and Implicit Differentiation',
                type: 'video',
                durationMinutes: 45,
                sourceName: 'MIT OpenCourseWare',
                // Stale duplicate pointing to exact same video as Module 1
                sourceUrl: 'https://www.youtube.com/watch?v=calcMaster0',
                orderIndex: 0,
                chapters: [],
                formulae: [],
                summaryPoints: ['Chain rule formulation'],
                studyNotes: [],
              },
            ],
          },
        ],
      };

      const { path: repairedCourse, repaired } = repairCourseVideoDuplicates(staleCourse);

      assert.strictEqual(repaired, true, 'Course must be flagged as repaired');
      assert.strictEqual(repairedCourse.modules!.length, 2, 'Modules structure must be preserved');
      assert.strictEqual(repairedCourse.enrolledCount, 42, 'Enrollment count must be intact');
      assert.strictEqual(repairedCourse.modules![0].status, 'completed', 'Module progress status must be intact');
      assert.strictEqual(repairedCourse.modules![0].lessons[0].id, 'les-1-1', 'Lesson ID must be intact');
      assert.strictEqual(repairedCourse.modules![1].lessons[0].id, 'les-2-1', 'Lesson ID must be intact');

      const url1 = repairedCourse.modules![0].lessons[0].sourceUrl;
      const url2 = repairedCourse.modules![1].lessons[0].sourceUrl;

      assert.notStrictEqual(url1, url2, 'Module 1 and Module 2 must no longer have identical raw URLs');
      const time2 = url2?.match(/[?&]t=(\d+)s/);
      assert.ok(time2 || url2 !== url1, 'Module 2 must receive a distinct offset timestamp or distinct video');
    });
  });
});
