import { z } from 'zod';

// =============================================================================
// 1. Zod Schemas for Structured Reading Document Content
// =============================================================================

export const DefinitionItemSchema = z.object({
  term: z.string().min(1, 'Term is required'),
  definition: z.string().min(1, 'Definition is required'),
  context: z.string().optional(),
});

export const StepExplanationSchema = z.object({
  stepNumber: z.number().int().positive(),
  title: z.string().min(1, 'Step title is required'),
  explanation: z.string().min(1, 'Step explanation is required'),
  codeOrFormula: z.string().optional(),
});

export const ConcreteExampleSchema = z.object({
  title: z.string().min(1, 'Example title is required'),
  scenario: z.string().min(1, 'Scenario is required'),
  solutionOrExplanation: z.string().min(1, 'Solution/explanation is required'),
});

export const DiagramDescriptionSchema = z.object({
  title: z.string().min(1, 'Diagram title is required'),
  description: z.string().min(1, 'Diagram description is required'),
  diagramType: z.enum(['mermaid', 'ascii', 'text']).default('text'),
  diagramSource: z.string().optional(),
});

export const MisconceptionItemSchema = z.object({
  misconception: z.string().min(1, 'Misconception statement is required'),
  correction: z.string().min(1, 'Correction statement is required'),
  whyItMatters: z.string().optional(),
});

export const WorkedExampleSchema = z.object({
  problem: z.string().min(1, 'Problem statement is required'),
  stepByStepSolution: z.array(z.string()).min(1, 'At least one step required'),
  finalTakeaway: z.string().optional(),
});

export const SelfAssessmentQuestionSchema = z.object({
  id: z.string(),
  question: z.string().min(1, 'Question text is required'),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1, 'Answer is required'),
  explanation: z.string().min(1, 'Explanation is required'),
});

export const FurtherReadingSchema = z.object({
  title: z.string().min(1, 'Reference title is required'),
  description: z.string().min(1, 'Reference description is required'),
  url: z.string().optional(),
  isExternal: z.boolean().default(false),
});

/**
 * Complete Structured Reading Document Schema (All 16 Academic Sections)
 */
export const GeneratedReadingDocumentContentSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  introduction: z.string().min(20, 'Substantive introduction is required'),
  learningObjectives: z.array(z.string()).min(1, 'At least one learning objective is required'),
  prerequisiteConcepts: z.array(z.string()).default([]),
  detailedConceptualExplanation: z.string().min(100, 'Substantive conceptual explanation is required'),
  importantDefinitions: z.array(DefinitionItemSchema).default([]),
  stepByStepExplanations: z.array(StepExplanationSchema).default([]),
  relevantExamples: z.array(ConcreteExampleSchema).default([]),
  practicalApplications: z.array(z.string()).default([]),
  diagramsOrDescriptions: z.array(DiagramDescriptionSchema).default([]),
  commonMistakesAndMisconceptions: z.array(MisconceptionItemSchema).default([]),
  workedExamples: z.array(WorkedExampleSchema).default([]),
  keyTakeaways: z.array(z.string()).min(2, 'At least 2 key takeaways are required'),
  summary: z.string().min(30, 'Substantive summary is required'),
  selfAssessmentQuestions: z.array(SelfAssessmentQuestionSchema).min(1, 'At least one self-assessment question is required'),
  furtherReading: z.array(FurtherReadingSchema).default([]),
});

export type GeneratedReadingDocumentContent = z.infer<typeof GeneratedReadingDocumentContentSchema>;

// =============================================================================
// 2. Full Generated Reading Document Entity
// =============================================================================

export interface GeneratedReadingDocument {
  id: string;
  courseId: string;
  moduleId: string;
  lessonId: string;
  userId?: string | null;
  title: string;
  content: GeneratedReadingDocumentContent;
  contentFormat: 'structured_json' | 'markdown';
  language: string;
  academicLevel: string;
  learningObjectives: string[];
  generationModel: string;
  generationStatus: 'generating' | 'completed' | 'failed';
  contentHash?: string;
  sourceMetadata: {
    provider: string;
    generatedAt: string;
    sourceProvenance: 'pencill_academic_engine';
    isExternalVerified?: boolean;
    readingDurationMinutes?: number;
    tokenUsage?: {
      promptTokens?: number;
      candidatesTokens?: number;
      totalTokens?: number;
    };
    [key: string]: unknown;
  };
  tokenUsage?: {
    promptTokens?: number;
    candidatesTokens?: number;
    totalTokens?: number;
  };
  readingDurationMinutes: number;
  generatedAt: string;
  updatedAt: string;
}

// =============================================================================
// 3. Engine Inputs & Requests
// =============================================================================

export interface LessonReadingContext {
  courseId: string;
  courseTitle: string;
  courseDomain: string;
  moduleId: string;
  moduleTitle: string;
  lessonId: string;
  lessonTitle: string;
  learningObjectives: string[];
  academicLevel?: string;
  proficiencyLevel?: string;
  language?: string;
  previousLessonContext?: {
    id: string;
    title: string;
  };
  nextLessonContext?: {
    id: string;
    title: string;
  };
  requiredDepth?: 'foundational' | 'standard' | 'rigorous' | 'advanced';
  expectedReadingDurationMinutes?: number;
}

export const ClientLessonContextSchema = z.object({
  courseTitle: z.string().optional(),
  courseDomain: z.string().optional(),
  moduleTitle: z.string().optional(),
  lessonTitle: z.string().optional(),
  learningObjectives: z.array(z.string()).optional(),
  academicLevel: z.string().optional(),
  expectedReadingDurationMinutes: z.number().optional(),
  previousLessonTitle: z.string().optional(),
  nextLessonTitle: z.string().optional(),
  summaryPoints: z.array(z.string()).optional(),
});

export type ClientLessonContext = z.infer<typeof ClientLessonContextSchema>;

export const GenerateReadingRequestSchema = z.object({
  courseId: z.string().min(1, 'courseId is required'),
  lessonId: z.string().min(1, 'lessonId is required'),
  moduleId: z.string().optional(),
  userRequest: z.boolean().optional().default(true),
  forceRegenerate: z.boolean().optional().default(false),
  academicLevel: z.string().optional(),
  proficiencyLevel: z.string().optional(),
  language: z.string().optional(),
  clientContext: ClientLessonContextSchema.optional(),
});

export type GenerateReadingRequest = {
  courseId: string;
  lessonId: string;
  moduleId?: string;
  userRequest?: boolean;
  forceRegenerate?: boolean;
  academicLevel?: string;
  proficiencyLevel?: string;
  language?: string;
  clientContext?: ClientLessonContext;
};

export const RegenerateReadingRequestSchema = z.object({
  documentId: z.string().min(1, 'documentId is required'),
  courseId: z.string().optional(),
  lessonId: z.string().optional(),
  reason: z.string().optional(),
});

export type RegenerateReadingRequest = z.infer<typeof RegenerateReadingRequestSchema>;

// =============================================================================
// 4. Evaluation & Diagnostic Types
// =============================================================================

export type ReadingMaterialStatus =
  | 'verified_present'
  | 'previously_generated'
  | 'missing'
  | 'insufficient'
  | 'broken_link';

export interface ReadingEvaluationResult {
  hasReadingMaterial: boolean;
  status: ReadingMaterialStatus;
  isExternalVerified: boolean;
  externalUrl?: string;
  sourceName?: string;
  isAccessible: boolean;
  document?: GeneratedReadingDocument | null;
  canGenerate: boolean;
  message: string;
}

export interface RelevanceValidationResult {
  isValid: boolean;
  reasons: string[];
  matchedKeywordCount: number;
  unrelatedTopicDetected?: boolean;
}
