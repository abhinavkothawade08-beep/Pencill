import { z } from 'zod';

export const DiscoverRequestSchema = z.object({
  query: z.string().nullable().optional(),
  goal: z.string().nullable().optional(),
  domain: z.string().nullable().optional(),
  subject: z.string().nullable().optional(),
  topics: z.array(z.string()).nullable().optional(),
  targetExam: z.union([z.string(), z.record(z.string(), z.any())]).nullable().optional(),
  depthLevel: z.string().nullable().optional(),
  customDepthLevel: z.string().nullable().optional(),
  difficulty: z.string().nullable().optional(),
  instructionLanguage: z.string().nullable().optional(),
  explanationLanguage: z.string().nullable().optional(),
  resourceLanguage: z.string().nullable().optional(),
  quizLanguage: z.string().nullable().optional(),
  bilingualExplanations: z.boolean().nullable().optional(),
  preserveTechnicalTerms: z.boolean().nullable().optional(),
  pacingStrategy: z.string().nullable().optional(),
  targetCompletionDate: z.string().nullable().optional(),
  advancedPreferences: z.record(z.string(), z.any()).nullable().optional(),
  level: z.string().nullable().optional().default('class-11'),
  language: z.string().nullable().optional().default('English'),
  weeklyHours: z.preprocess(
    (val) => (val === null || val === undefined || val === '' ? 6 : val),
    z.coerce.number().min(1).max(60).default(6)
  ),
  generateLearningPath: z.boolean().default(true),
  modalities: z
    .union([z.array(z.string()), z.record(z.string(), z.boolean())])
    .nullable()
    .optional(),
  limit: z.coerce.number().min(1).max(50).default(12),
  providers: z.array(z.enum(['google', 'youtube', 'web', 'practice', 'quiz'])).nullable().optional(),
  resourceTypes: z.array(z.any()).nullable().optional(),
  minQualityScore: z.coerce.number().min(0).max(100).nullable().optional(),
  enableAiEvaluation: z.boolean().default(true),
  saveToDatabase: z.boolean().default(false),
  timeoutMs: z.coerce.number().default(20000),
  sequenceType: z.enum([
    'learning_path',
    'step_by_step_tutorial',
    'chronological_research',
    'storytelling',
    'news_coverage',
    'general_interest_playlist'
  ]).nullable().optional(),
  contentType: z.enum([
    'educational',
    'current_news',
    'documentary',
    'entertainment'
  ]).nullable().optional(),
}).refine(
  (data) => {
    const hasQuery = Boolean(data.query && data.query.trim().length > 0);
    const hasGoal = Boolean(data.goal && data.goal.trim().length > 0);
    const hasSubject = Boolean(data.subject && data.subject.trim().length > 0);
    const hasTopics = Boolean(
      data.topics &&
      Array.isArray(data.topics) &&
      data.topics.some((t) => typeof t === 'string' && t.trim().length > 0)
    );
    return hasQuery || hasGoal || hasSubject || hasTopics;
  },
  {
    message: 'Either "query", "goal", "subject", or "topics" must be provided as a non-empty value.',
    path: ['query'],
  }
);

export const QuizGenerateRequestSchema = z.object({
  topic: z.string().trim().min(1, 'Topic parameter is required and cannot be empty'),
  subject: z.string().trim().optional(),
  gradeLevel: z.string().trim().optional(),
  curriculum: z.string().trim().optional(),
  examTarget: z.string().trim().optional(),
  examContext: z.string().trim().optional(),
  knowledgeLevel: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed', 'beginner', 'intermediate', 'advanced', 'competitive']).default('medium'),
  questionCount: z.coerce.number().min(1).max(20).default(5),
  questionFormat: z.enum(['single_choice', 'multiple_choice', 'true_false', 'mixed']).default('single_choice'),
  timeLimitMinutes: z.coerce.number().min(1).max(120).optional(),
  includeExplanations: z.boolean().default(true),
  learningObjectives: z.string().trim().optional(),
  courseId: z.string().trim().optional(),
  moduleId: z.string().trim().optional(),
  timeoutMs: z.coerce.number().default(30000),
});

export const QuizStartAttemptRequestSchema = z.object({
  quizId: z.string().trim().min(1, 'Quiz ID is required'),
  timeLimitMinutes: z.coerce.number().min(1).max(180).optional(),
  resumeAttemptId: z.string().trim().optional(),
});

export const QuizSubmitRequestSchema = z.object({
  attemptId: z.string().trim().min(1, 'Attempt ID is required'),
  quizId: z.string().trim().min(1, 'Quiz ID is required'),
  answers: z.record(z.string(), z.string()).default({}),
  flaggedQuestions: z.array(z.coerce.number()).default([]),
  timeSpentSeconds: z.coerce.number().min(0).default(0),
});

export const DeleteCourseParamsSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, 'Course ID is required and cannot be empty')
    .max(128, 'Course ID cannot exceed 128 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Course ID can only contain alphanumeric characters, hyphens, and underscores'),
});

export const DeleteCourseQuerySchema = z.object({
  soft: z
    .enum(['true', 'false', '1', '0'])
    .optional()
    .transform((val) => val === 'true' || val === '1'),
});

export const DeleteQuizParamsSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, 'Quiz ID is required and cannot be empty')
    .max(128, 'Quiz ID cannot exceed 128 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Quiz ID can only contain alphanumeric characters, hyphens, and underscores'),
});

export const BatchDeleteQuizzesSchema = z.object({
  quizIds: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Quiz ID cannot be empty')
        .max(128, 'Quiz ID cannot exceed 128 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Quiz ID can only contain alphanumeric characters, hyphens, and underscores')
    )
    .min(1, 'At least one quiz ID must be provided')
    .max(100, 'Cannot delete more than 100 quizzes in a single request'),
});

export const BatchDeleteCoursesSchema = z.object({
  courseIds: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Course ID cannot be empty')
        .max(128, 'Course ID cannot exceed 128 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Course ID can only contain alphanumeric characters, hyphens, and underscores')
    )
    .min(1, 'At least one course ID must be provided')
    .max(100, 'Cannot delete more than 100 courses in a single request'),
  softDelete: z.boolean().optional().default(false),
});



