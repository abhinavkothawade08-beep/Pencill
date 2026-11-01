import {
  CurriculumPlan,
  ModuleResourceAssignment,
  LearnerGoalInput,
} from './types';
import {
  createFullLearningPath,
  getLearningPathById,
  inMemoryPathCache,
  CreateFullLearningPathInput,
  DiscoveredResourcePayload,
} from '@/services/supabase/pathService';
import { createQuiz } from '@/services/supabase/quizService';
import { enrollUserInCourse } from '@/services/supabase/enrollmentService';
import { QuizQuestion, LessonNoteResource } from '@/types';

export interface PersistenceResult {
  courseId: string;
  isPersisted: boolean;
  isEnrolled: boolean;
  totalModules: number;
  totalLessons: number;
  verificationPassed: boolean;
  course?: import('@/types').LearningPath;
  quizzes?: import('@/types').Quiz[];
}

export async function persistEngineCourse(
  input: LearnerGoalInput,
  plan: CurriculumPlan,
  assignments: ModuleResourceAssignment[],
  userId?: string | null
): Promise<PersistenceResult> {
  const topicSlug = input.topic
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 24);

  const courseId = `path-${topicSlug}-${Date.now().toString(36)}`;

  const optionLetters = ['A', 'B', 'C', 'D'] as const;
  const discoveredResourcesToPersist: DiscoveredResourcePayload[] = [];
  const quizzesToPersist: Array<{
    payload: {
      id: string;
      title: string;
      topic: string;
      subject: string;
      difficulty: string;
      courseId: string;
      moduleId: string;
      timeLimitMinutes: number;
      userId: string | null;
    };
    questions: QuizQuestion[];
  }> = [];

  const modulesForPath: CreateFullLearningPathInput['modules'] = [];
  let totalLessonsCounter = 0;

  for (let mIdx = 0; mIdx < assignments.length; mIdx++) {
    const assign = assignments[mIdx];
    const modId = `mod-${courseId}-${mIdx + 1}`;
    const lessonsForModule: CreateFullLearningPathInput['modules'][0]['lessons'] = [];
    let lessonOrderIndex = 0;

    // 1. Prepare Formative Quiz if present
    let savedQuizId: string | undefined;
    let moduleQuizQuestions: QuizQuestion[] = [];
    if (assign.quiz && assign.quiz.questions.length > 0) {
      savedQuizId = `quiz-${modId}`;
      moduleQuizQuestions = assign.quiz.questions.map((q, qIdx) => ({
        id: `qq-${savedQuizId}-${qIdx + 1}`,
        questionNumber: qIdx + 1,
        prompt: q.prompt,
        options: q.options.map((optText, oIdx) => ({
          id: optionLetters[oIdx] || `opt-${oIdx + 1}`,
          text: optText,
        })),
        correctOptionId: optionLetters[q.correctOptionIndex] || 'A',
        explanation: q.explanation,
        difficulty: q.difficulty,
        topic: input.topic,
        subtopic: assign.moduleTitle,
        questionType: 'single_choice',
      }));

      quizzesToPersist.push({
        payload: {
          id: savedQuizId,
          title: `${assign.moduleTitle}: Module Checkpoint Quiz`,
          topic: input.topic,
          subject: plan.domain,
          difficulty: input.level || 'intermediate',
          courseId,
          moduleId: modId,
          timeLimitMinutes: assign.quiz.timeLimitMinutes || 15,
          userId: userId || null,
        },
        questions: moduleQuizQuestions,
      });
    }

    // 2. Video Lessons
    for (const v of assign.videos) {
      lessonOrderIndex++;
      totalLessonsCounter++;
      const lesId = `les-${modId}-${lessonOrderIndex}`;

      lessonsForModule.push({
        id: lesId,
        title: v.title,
        type: 'video',
        durationMinutes: v.durationMinutes,
        sourceName: v.authorOrChannel,
        sourceUrl: v.canonicalUrl,
        orderIndex: lessonOrderIndex,
        summaryPoints: [v.description.slice(0, 200)],
        thumbnailUrl: v.thumbnailUrl,
        educatorId: v.educatorId,
        educatorName: v.authorOrChannel,
        channelId: v.channelId,
        discoverySource: v.discoverySource,
        verificationStatus: v.isVerifiedEducator ? 'VERIFIED' : 'OPEN_DISCOVERY',
        selectionExplanation: `Recommended for ${assign.moduleTitle} objectives with quality score ${v.qualityScore}/100.`,
      });

      discoveredResourcesToPersist.push({
        id: v.id,
        title: v.title,
        type: 'video',
        sourceName: v.authorOrChannel,
        sourceUrl: v.canonicalUrl,
        durationMinutes: v.durationMinutes,
        description: v.description,
        externalId: v.externalId,
        qualityScore: v.combinedScore,
        educatorId: v.educatorId,
        educatorName: v.authorOrChannel,
        channelId: v.channelId,
        discoverySource: v.discoverySource,
      });
    }

    // 3. Reading Material Lessons
    for (const r of assign.readings) {
      lessonOrderIndex++;
      totalLessonsCounter++;
      const lesId = `les-${modId}-${lessonOrderIndex}`;

      const readingType = r.modality === 'paper' ? 'paper' : r.modality === 'practice' ? 'practice' : 'monograph';

      lessonsForModule.push({
        id: lesId,
        title: r.title,
        type: readingType,
        durationMinutes: r.durationMinutes,
        sourceName: r.authorOrChannel,
        sourceUrl: r.canonicalUrl,
        orderIndex: lessonOrderIndex,
        summaryPoints: [r.description.slice(0, 200)],
        discoverySource: r.discoverySource,
        verificationStatus: 'VERIFIED',
        selectionExplanation: `Authoritative reading material for ${assign.moduleTitle}.`,
      });

      discoveredResourcesToPersist.push({
        id: r.id,
        title: r.title,
        type: readingType,
        sourceName: r.authorOrChannel,
        sourceUrl: r.canonicalUrl,
        durationMinutes: r.durationMinutes,
        description: r.description,
        externalId: r.externalId,
        qualityScore: r.combinedScore,
        discoverySource: r.discoverySource,
      });
    }

    // 4. Study Notes Lesson
    if (assign.studyNotes.length > 0) {
      lessonOrderIndex++;
      totalLessonsCounter++;
      const lesId = `les-${modId}-${lessonOrderIndex}`;
      const note = assign.studyNotes[0];

      const noteResources: LessonNoteResource[] = [
        {
          id: note.id,
          title: note.title,
          type: 'study_notes',
          url: note.canonicalUrl,
          sourceName: note.authorOrInstitution,
          description: note.overview,
          publisher: 'Pencill Academic Engine',
          qualityScore: 98,
        },
      ];

      lessonsForModule.push({
        id: lesId,
        title: `${assign.moduleTitle}: In-Depth Study Notes & Handout`,
        type: 'monograph',
        durationMinutes: note.estimatedReadingMinutes,
        sourceName: note.authorOrInstitution || 'Pencill Academic Engine',
        sourceUrl: `/courses/${courseId}`,
        orderIndex: lessonOrderIndex,
        summaryPoints: note.keyTakeaways,
        studyNotes: noteResources,
        discoverySource: 'official_docs',
        verificationStatus: 'VERIFIED',
      });
    }

    // 5. Formative Assessment Quiz Lesson
    if (savedQuizId) {
      lessonOrderIndex++;
      totalLessonsCounter++;
      const lesId = `les-${modId}-${lessonOrderIndex}`;

      lessonsForModule.push({
        id: lesId,
        title: `${assign.moduleTitle}: Formative Checkpoint Quiz`,
        type: 'quiz',
        durationMinutes: 15,
        sourceName: 'Pencill Interactive Assessment',
        sourceUrl: `/practice/${savedQuizId}`,
        orderIndex: lessonOrderIndex,
        summaryPoints: [`Formative evaluation of ${assign.moduleTitle} learning objectives.`],
        discoverySource: 'curated_directory',
        verificationStatus: 'VERIFIED',
      });
    }

    modulesForPath.push({
      id: modId,
      title: assign.moduleTitle,
      moduleNumber: mIdx + 1,
      orderIndex: mIdx,
      status: mIdx === 0 ? 'in_progress' : 'locked',
      totalResources: lessonsForModule.length,
      objective: assign.moduleTitle,
      checkpointQuestions: moduleQuizQuestions,
      lessons: lessonsForModule,
    });
  }

  const fullPathInput: CreateFullLearningPathInput = {
    id: courseId,
    title: plan.courseTitle,
    description: plan.description,
    domain: plan.domain,
    level: plan.level,
    durationHours: plan.totalEstimatedHours,
    moduleCount: modulesForPath.length,
    tags: [plan.domain, input.topic, plan.level],
    syllabusNote: plan.pedagogicalRationale,
    modules: modulesForPath,
  };

  // 1. Create full learning path in Supabase / Local storage
  await createFullLearningPath(fullPathInput, userId || '', discoveredResourcesToPersist);

  // 2. Persist Formative Quizzes in Supabase / Local storage (after learning_path exists)
  const createdQuizzes: import('@/types').Quiz[] = [];
  for (const qItem of quizzesToPersist) {
    try {
      const saved = await createQuiz(qItem.payload, qItem.questions, userId || null);
      createdQuizzes.push(saved);
    } catch (err) {
      console.warn(`[Persistence] Quiz persistence warning for ${qItem.payload.id}:`, err);
    }
  }

  // 3. Automatically enroll user in the course
  let isEnrolled = false;
  try {
    await enrollUserInCourse(userId || null, courseId);
    isEnrolled = true;
  } catch (enrollErr) {
    console.warn(`[Persistence] Automatic enrollment notice:`, enrollErr);
  }

  // 4. Verify persistence
  const reloaded = await getLearningPathById(courseId);
  const verificationPassed = Boolean(reloaded && reloaded.id === courseId && reloaded.modules && reloaded.modules.length > 0);

  return {
    courseId,
    isPersisted: true,
    isEnrolled,
    totalModules: modulesForPath.length,
    totalLessons: totalLessonsCounter,
    verificationPassed,
    course: reloaded || inMemoryPathCache.get(courseId) || undefined,
    quizzes: createdQuizzes,
  };
}
