import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  VERIFIED_LEARNING_RESOURCES,
  MASTER_EDUCATOR_DIRECTORY,
} from '../src/lib/resource-engine-v2/educators/master-dataset';
import {
  YouTubeProvider,
  findVerifiedDirectoryResources,
  AcademicNotesProvider,
  ValidationEngine,
} from '../src/lib/resource-engine-v2';
import {
  extractYouTubeVideoId,
  extractYouTubePlaylistId,
  canonicalizeUrl,
} from '../src/lib/resource-engine-v2/utils/url-utils';
import { repairCourseVideoDuplicates } from '../src/services/supabase/pathService';
import { createQuiz, getQuizById } from '../src/services/supabase/quizService';
import { QuizGenerateRequestSchema } from '../src/lib/api-schemas';
import { LearningPath, QuizQuestion } from '../src/types';

describe('Critical Regressions Audit & Verification Suite', () => {
  // ==========================================================================
  // PART 1: VIDEO & PLAYLIST NAVIGATION
  // ==========================================================================
  describe('1. Video & Playlist Navigation & Exact Sourcing', () => {
    test('1.1. Verified Learning Resources (RES-001 - RES-012) must store exact video/playlist canonical URLs, never channel pages', () => {
      assert.equal(VERIFIED_LEARNING_RESOURCES.length, 12, 'Must have 12 verified flagship resources');

      for (const res of VERIFIED_LEARNING_RESOURCES) {
        const url = res.Resource_URL;
        assert.ok(url.startsWith('https://www.youtube.com/'), `Resource ${res.Resource_ID} must start with YouTube domain: ${url}`);

        // Must never redirect to generic channel pages
        assert.ok(
          !url.includes('@3blue1brown/playlists'),
          `Resource ${res.Resource_ID} must not point to generic channel playlist page`
        );
        assert.ok(
          !url.includes('@abdul_bari/videos'),
          `Resource ${res.Resource_ID} must not point to generic channel videos page`
        );
        assert.ok(
          !url.includes('search?query='),
          `Resource ${res.Resource_ID} must not point to channel search page`
        );

        // Must be an exact video or playlist destination URL
        const vidId = extractYouTubeVideoId(url);
        const listId = extractYouTubePlaylistId(url);
        assert.ok(
          Boolean(vidId || listId),
          `Resource ${res.Resource_ID} (${res.Resource_Title}) must contain a valid videoId or playlistId. Got URL: ${url}`
        );

        // Match exact ID with metadata
        if (res.Resource_Type.toLowerCase().includes('playlist')) {
          assert.ok(listId, `Resource ${res.Resource_ID} is a playlist and must extract playlistId. Got: ${listId}`);
          assert.equal(listId, res.YouTube_Video_ID_or_Playlist_ID);
        } else {
          assert.ok(vidId || listId, `Resource ${res.Resource_ID} must have videoId or playlistId`);
        }
      }
    });

    test('1.2. findVerifiedDirectoryResources constructs canonical destination URLs and exact metadata', () => {
      const results = findVerifiedDirectoryResources('Linear Algebra');
      assert.ok(results.length > 0, 'Must match Linear Algebra flagship resource');

      const linearAlg = results.find((r) => r.id === 'dir_RES-001');
      assert.ok(linearAlg, 'Must find RES-001');
      assert.equal(
        linearAlg.canonicalUrl,
        'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab'
      );
      assert.equal(
        linearAlg.sourceUrl,
        'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab'
      );
      assert.equal(linearAlg.metadata?.playlistId, 'PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab');
      assert.equal(linearAlg.metadata?.videoId, undefined);
    });

    test('1.3. ValidationEngine rejects generic YouTube channel URLs and accepts exact video/playlist URLs', () => {
      const validator = new ValidationEngine();

      const invalidChannelResource: any = {
        id: 'bad-channel-url',
        title: 'Complete Git and GitHub Tutorial',
        canonicalUrl: 'https://www.youtube.com/@freecodecamp/videos',
        sourceUrl: 'https://www.youtube.com/@freecodecamp/videos',
        type: 'video_lecture',
        provider: 'youtube',
        durationMinutes: 45,
        score: { overall: 85, relevance: 85, educationalValue: 85, structureCompleteness: 85, freshness: 85 },
      };

      const invalidValidation = validator.validate(invalidChannelResource);
      assert.equal(invalidValidation.isValid, false, 'Generic channel URL must be rejected');
      assert.ok(
        invalidValidation.errors.some((e) => e.includes('generic channel')),
        'Error must state that URL is a generic channel or search URL'
      );

      const validVideoResource: any = {
        id: 'good-video-url',
        title: 'Git Crash Course for Beginners',
        canonicalUrl: 'https://www.youtube.com/watch?v=k9WqpQp8KSQ',
        sourceUrl: 'https://www.youtube.com/watch?v=k9WqpQp8KSQ',
        type: 'video_lecture',
        provider: 'youtube',
        durationMinutes: 68,
        score: { overall: 90, relevance: 90, educationalValue: 90, structureCompleteness: 90, freshness: 90 },
      };

      const validValidation = validator.validate(validVideoResource);
      assert.equal(validValidation.isValid, true, 'Exact video destination URL must be valid');
    });

    test('1.4. repairCourseVideoDuplicates preserves exact canonical destination URLs for replacement resources', () => {
      const mockCourse: LearningPath = {
        id: 'test-course-dup',
        title: 'Computer Science and Algorithms',
        description: 'Core CS subjects',
        domain: 'Computer Science',
        level: 'Undergraduate',
        durationHours: 10,
        moduleCount: 2,
        verified: true,
        modules: [
          {
            id: 'mod-1',
            pathId: 'test-course-dup',
            title: 'Module 1: Design and Analysis of Algorithms',
            moduleNumber: 1,
            orderIndex: 0,
            status: 'in_progress',
            totalResources: 1,
            completedResources: 0,
            lessons: [
              {
                id: 'les-1',
                moduleId: 'mod-1',
                title: 'Introduction to Algorithms',
                type: 'video',
                durationMinutes: 60,
                sourceName: 'Abdul Bari',
                sourceUrl: 'https://www.youtube.com/watch?v=0IAPZzGSbME',
                orderIndex: 0,
              },
            ],
          },
          {
            id: 'mod-2',
            pathId: 'test-course-dup',
            title: 'Module 2: Advanced Algorithm Design',
            moduleNumber: 2,
            orderIndex: 1,
            status: 'locked',
            totalResources: 1,
            completedResources: 0,
            lessons: [
              {
                id: 'les-2',
                moduleId: 'mod-2',
                title: 'Dynamic Programming & Divide and Conquer',
                type: 'video',
                durationMinutes: 60,
                sourceName: 'Abdul Bari',
                sourceUrl: 'https://www.youtube.com/watch?v=0IAPZzGSbME', // Duplicate!
                orderIndex: 0,
              },
            ],
          },
        ],
      };

      const { path: repairedCourse, repaired } = repairCourseVideoDuplicates(mockCourse);
      assert.ok(repaired, 'Duplicate video across modules must be detected and repaired');

      const mod2Lesson = repairedCourse.modules![1].lessons[0];
      assert.ok(mod2Lesson.sourceUrl, 'Repaired lesson must have a valid sourceUrl');
      assert.ok(
        !mod2Lesson.sourceUrl.includes('/videos') && !mod2Lesson.sourceUrl.includes('/playlists'),
        `Repaired sourceUrl must not be a generic channel URL. Got: ${mod2Lesson.sourceUrl}`
      );
      assert.ok(
        mod2Lesson.sourceUrl.includes('playlist?list=') || mod2Lesson.sourceUrl.includes('watch?v='),
        `Repaired sourceUrl must be a canonical video or playlist link: ${mod2Lesson.sourceUrl}`
      );
    });
  });

  // ==========================================================================
  // PART 2: READING MATERIAL SOURCING
  // ==========================================================================
  describe('2. Reading Material Sourcing, NCERT & Official Documentation', () => {
    test('2.1. AcademicNotesProvider discovers official NCERT textbook materials for Class 12 Chemistry / Physics', async () => {
      const provider = new AcademicNotesProvider();
      const results = await provider.search('Haloalkanes and Haloarenes NCERT Class 12 Chemistry', { timeoutMs: 1500 });

      assert.ok(results.length > 0, 'Must discover study notes or reading materials');
      const ncertMatch = results.find((r) => r.sourceName.includes('NCERT') || r.title.includes('NCERT'));
      assert.ok(ncertMatch, 'Must return an official NCERT textbook resource');
      assert.equal(ncertMatch.canonicalUrl, 'https://ncert.nic.in/textbook.php?lech1=1-10');
      assert.equal(ncertMatch.type, 'textbook');
      assert.equal(ncertMatch.score.overall, 95);
    });

    test('2.2. AcademicNotesProvider discovers official documentation for developer technologies', async () => {
      const provider = new AcademicNotesProvider();
      const results = await provider.search('Python list comprehension and data structures documentation', { timeoutMs: 1500 });

      assert.ok(results.length > 0, 'Must discover developer notes');
      const docMatch = results.find((r) => r.sourceName.includes('Python') || r.title.includes('Python'));
      assert.ok(docMatch, 'Must return official Python documentation');
      assert.equal(docMatch.canonicalUrl, 'https://docs.python.org/3/tutorial/index.html');
      assert.equal(docMatch.type, 'official_documentation');
    });

    test('2.3. Reading materials store valid, real URLs with no fake links or placeholder dummy text', async () => {
      const provider = new AcademicNotesProvider();
      const results = await provider.search('Linear Algebra Matrices and Determinants', { timeoutMs: 1500 });

      assert.ok(results.length > 0, 'Must return resources');
      for (const res of results) {
        assert.ok(res.canonicalUrl.startsWith('http'), `Canonical URL must be a valid http link: ${res.canonicalUrl}`);
        assert.ok(res.sourceUrl.startsWith('http'), `Source URL must be a valid http link: ${res.sourceUrl}`);
        assert.ok(res.title.trim().length > 3, `Resource title must not be empty: ${res.title}`);
        assert.ok(res.sourceName.trim().length > 2, `Source name must not be empty: ${res.sourceName}`);
        assert.ok(!res.title.includes('Fake') && !res.title.includes('Placeholder'), 'Must not generate fake links');
      }
    });
  });

  // ==========================================================================
  // PART 3: QUIZ GENERATION, PERSISTENCE & API INTEGRATION
  // ==========================================================================
  describe('3. Quiz Generation, Persistence, Schema & Retrieval', () => {
    test('3.1. QuizGenerateRequestSchema accepts optional courseId and moduleId', () => {
      const parsed = QuizGenerateRequestSchema.parse({
        topic: 'Vectors and Three Dimensional Geometry',
        courseId: 'course-12345',
        moduleId: 'mod-1',
        difficulty: 'medium',
        questionCount: 5,
      });

      assert.equal(parsed.topic, 'Vectors and Three Dimensional Geometry');
      assert.equal(parsed.courseId, 'course-12345');
      assert.equal(parsed.moduleId, 'mod-1');
    });

    test('3.2. createQuiz persists quiz and authoritative questions in in-memory store and Supabase client', async () => {
      const sampleQuestions: QuizQuestion[] = [
        {
          id: 'test-q1',
          questionNumber: 1,
          prompt: 'What is the dot product of two perpendicular non-zero vectors?',
          options: [
            { id: 'A', text: '0' },
            { id: 'B', text: '1' },
            { id: 'C', text: '-1' },
            { id: 'D', text: 'Undefined' },
          ],
          correctOptionId: 'A',
          explanation: 'The dot product A . B = |A||B| cos(90°) = 0.',
          difficulty: 'medium',
          subtopic: 'Vector Algebra',
        },
      ];

      const created = await createQuiz(
        {
          id: 'test-quiz-audit-001',
          title: 'Vector Algebra Diagnostic Assessment',
          topic: 'Vector Algebra',
          subject: 'Mathematics',
          courseId: 'course-math-101',
          moduleId: 'mod-vectors-1',
          timeLimitMinutes: 10,
        },
        sampleQuestions,
        null
      );

      assert.equal(created.id, 'test-quiz-audit-001');
      assert.equal(created.courseId, 'course-math-101');
      assert.equal(created.moduleId, 'mod-vectors-1');
      assert.equal(created.questions.length, 1);

      // Verify retrieval with hideAnswers: true
      const retrievedTaking = await getQuizById('test-quiz-audit-001', { hideAnswers: true });
      assert.ok(retrievedTaking, 'Quiz must be retrievable by ID');
      assert.equal(retrievedTaking.questions[0].correctOptionId, undefined, 'Answers must be redacted when taking quiz');
      assert.equal(retrievedTaking.questions[0].explanation, undefined, 'Explanations must be redacted when taking quiz');

      // Verify retrieval with hideAnswers: false
      const retrievedFull = await getQuizById('test-quiz-audit-001', { hideAnswers: false });
      assert.ok(retrievedFull, 'Full quiz must be retrievable');
      assert.equal(retrievedFull.questions[0].correctOptionId, 'A', 'Correct answer must be present for scoring');
      assert.ok(retrievedFull.questions[0].explanation?.includes('dot product'));
    });
  });
});
