import { z } from 'zod';

/**
 * Cognitive Intent classifies the pedagogical mode required for a learning unit.
 * Different intents require fundamentally different resource modalities, durations, and search styles.
 */
export const CognitiveIntentSchema = z.enum([
  'conceptual_foundations',      // Core definitions, mental models, basic axioms (5-15 min)
  'in_depth_conceptual',         // Rigorous theory, mathematical proofs, derivations (15-35 min)
  'worked_examples',             // Step-by-step problem solving, math/science exercises
  'practical_demonstration',     // Lab experiments, visual physical demos, simulations
  'coding_walkthrough',          // Code-along, live programming, hands-on syntax
  'project_implementation',      // End-to-end project building, system design, capstone
  'exam_practice',               // Past papers, marking schemes, exam-specific strategy
  'authoritative_documentation', // Official specs, API references, formal standards
]);
export type CognitiveIntent = z.infer<typeof CognitiveIntentSchema>;

/**
 * Educational Domain represents the broad academic/professional discipline.
 * Used for domain-specific vocabulary weighting, anti-collision guards, and search scoping.
 */
export const EducationalDomainSchema = z.enum([
  'mathematics',
  'physics',
  'chemistry',
  'biology',
  'computer_science',
  'data_science_ai',
  'engineering',
  'economics_commerce',
  'humanities_social_sciences',
  'law',
  'medical_health',
  'languages_linguistics',
  'vocational_applied_skills',
  'general_academic',
]);
export type EducationalDomain = z.infer<typeof EducationalDomainSchema>;

/**
 * Tracks the provenance of information to avoid treating inferred facts as user-provided data.
 */
export const EvidenceStatusSchema = z.enum([
  'user_provided',    // Explicitly supplied by the user in prompt/input
  'inferred_high',    // Inferred with strong lexical, domain, or contextual signals
  'inferred_medium',  // Inferred with moderate heuristic support
  'fallback_default', // Default fallback value when signals are absent or ambiguous
]);
export type EvidenceStatus = z.infer<typeof EvidenceStatusSchema>;

/**
 * The 6 Canonical Practical Learning Resource Categories.
 * Dynamically supported according to the learner's topic and learning objectives.
 */
export const ResourceCategorySchema = z.enum([
  'conceptual_explanation',      // 1. Conceptual Explanation
  'practical_tutorial',          // 2. Practical Tutorial / Hands-on Implementation
  'guided_exercise',             // 3. Guided Exercise / Problem Solving
  'project_based',               // 4. Project-Based Learning
  'real_world_application',      // 5. Real-World Application / Case Study
  'advanced_optimization',       // 6. Advanced Implementation / Optimization
]);
export type ResourceCategory = z.infer<typeof ResourceCategorySchema>;

/**
 * Degree of practical hands-on emphasis required for the topic.
 */
export const PracticalEmphasisSchema = z.enum([
  'none',      // Pure theoretical or historical topic; zero forced code
  'moderate',  // Theory accompanied by worked derivations and step-by-step numericals
  'high',      // Balanced conceptual foundations and hands-on skill development
  'primary',   // Practical construction, live coding, or project implementation is the primary objective
]);
export type PracticalEmphasis = z.infer<typeof PracticalEmphasisSchema>;

/**
 * Category-specific target mix configuration.
 */
export const CategoryTargetMixSchema = z.object({
  category: ResourceCategorySchema,
  minCount: z.number().int().nonnegative().default(0),
  preferredCount: z.number().int().positive().default(1),
  priority: z.number().int().min(1).max(5).default(1),
  rationale: z.string().default(''),
});
export type CategoryTargetMix = z.infer<typeof CategoryTargetMixSchema>;

/**
 * Learning-Intent Profile determining which resource categories are appropriate
 * dynamically for a topic, without forcing every category onto every topic.
 */
export const LearningIntentProfileSchema = z.object({
  primaryCategory: ResourceCategorySchema,
  relevantCategories: z.array(ResourceCategorySchema).min(1),
  practicalEmphasis: PracticalEmphasisSchema,
  categoryMix: z.array(CategoryTargetMixSchema).default([]),
  technicalEnvironment: z.array(z.string()).default([]), // Tools, languages, simulators, apparatus
  intentRationale: z.string().default(''),
});
export type LearningIntentProfile = z.infer<typeof LearningIntentProfileSchema>;

/**
 * Quantitative confidence indicators for the objective analysis.
 */
export const ConfidenceScoreSchema = z.object({
  domainConfidence: z.number().min(0).max(1),
  intentConfidence: z.number().min(0).max(1),
  conceptsConfidence: z.number().min(0).max(1),
  overallConfidence: z.number().min(0).max(1),
});
export type ConfidenceScore = z.infer<typeof ConfidenceScoreSchema>;

/**
 * Input contract for the Learning Objective Analyzer.
 * Captures all raw context available at module discovery time.
 */
export const ModuleContextInputSchema = z.object({
  moduleTitle: z.string().min(1, 'Module title is required'),
  moduleDescription: z.string().optional(),
  courseTitle: z.string().optional(),
  learningGoal: z.string().optional(),
  subject: z.string().optional(),
  lessonTitles: z.array(z.string()).optional(),
  academicLevel: z.string().optional(),
  targetExam: z.string().optional(),
  preferredLanguage: z.string().optional(),
  learnerDifficulty: z.enum(['beginner', 'elementary', 'intermediate', 'advanced', 'expert']).optional(),
  domainHint: z.string().optional(),
});
export type ModuleContextInput = z.infer<typeof ModuleContextInputSchema>;

/**
 * The structured result of analyzing a module's learning objective.
 * Fully typed and runtime-validated.
 */
export const AnalyzedObjectiveSchema = z.object({
  // Preserved original user inputs
  rawTitle: z.string(),
  rawDescription: z.string().default(''),
  subject: z.string().optional(),
  learningGoal: z.string().optional(),
  academicLevel: z.string().optional(),
  targetExam: z.string().optional(),
  preferredLanguage: z.string().optional(),

  // Domain classification
  domain: EducationalDomainSchema,
  domainProvenance: EvidenceStatusSchema,

  // Cognitive intent classification
  cognitiveIntent: CognitiveIntentSchema,
  intentProvenance: EvidenceStatusSchema,
  intentProfile: LearningIntentProfileSchema.optional(),

  // Concept decomposition
  primaryConcepts: z.array(z.string()).min(1, 'At least one primary concept is required'),
  supportingConcepts: z.array(z.string()).default([]),
  explicitOutcomes: z.array(z.string()).default([]),
  expectedSkills: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),

  // Negative constraints & anti-collision guards
  negativeConstraints: z.array(z.string()).default([]),
  domainExclusions: z.array(z.string()).default([]),

  // Evidence and provenance notes
  evidenceNotes: z.array(z.string()).default([]),
});
export type AnalyzedObjective = z.infer<typeof AnalyzedObjectiveSchema>;

/**
 * The complete output of the LearningObjectiveAnalyzer.
 * Contains the analyzed objective along with confidence scores, warnings, and missing info flags.
 */
export const AnalysisResultSchema = z.object({
  objective: AnalyzedObjectiveSchema,
  confidence: ConfidenceScoreSchema,
  missingInformation: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  evidence: z.record(z.string(), z.unknown()).optional(),
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
