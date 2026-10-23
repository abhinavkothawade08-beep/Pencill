import {
  AnalysisResult,
  AnalysisResultSchema,
  AnalyzedObjective,
  ModuleContextInput,
  ModuleContextInputSchema,
} from '../types';
import { detectEducationalDomain } from './domain-detector';
import { extractConcepts } from './concept-extractor';
import { classifyCognitiveIntent, classifyLearningIntentProfile } from './intent-classifier';

/**
 * Learning Objective Analyzer (Stage 1 of Resource Engine 2.0)
 * 
 * Transforms raw course and module input into a validated, structured AnalyzedObjective.
 * Operates purely offline, deterministically, and with zero external API dependencies.
 */
export class LearningObjectiveAnalyzer {
  /**
   * Analyzes the context of a module and returns a structured AnalysisResult.
   */
  public analyze(rawInput: ModuleContextInput): AnalysisResult {
    // 1. Validate raw input contract
    const input = ModuleContextInputSchema.parse(rawInput);

    const missingInformation: string[] = [];
    const warnings: string[] = [];
    const evidenceNotes: string[] = [];

    // Track missing info
    if (!input.moduleDescription || input.moduleDescription.trim().length === 0) {
      missingInformation.push('No module description provided; analysis relies on title and course context.');
    } else if (input.moduleDescription.trim().length < 25) {
      missingInformation.push('Module description is minimal (< 25 characters); subtopic inference may be partial.');
    }

    if (!input.academicLevel) {
      missingInformation.push('No academic level specified.');
    }

    if (!input.subject && !input.domainHint) {
      missingInformation.push('No explicit subject or domain specified by user.');
    }

    // 2. Detect Educational Domain
    const domainResult = detectEducationalDomain({
      subject: input.subject,
      domainHint: input.domainHint,
      courseTitle: input.courseTitle,
      moduleTitle: input.moduleTitle,
      moduleDescription: input.moduleDescription,
      targetExam: input.targetExam,
    });
    evidenceNotes.push(`Domain: ${domainResult.domain} (${domainResult.provenance}) - ${domainResult.rationale}`);

    if (domainResult.domainExclusions.length > 0) {
      warnings.push(
        `Cross-domain collision guard active for "${domainResult.domain}": excluding [${domainResult.domainExclusions.slice(0, 4).join(', ')}]`
      );
    }

    // 3. Extract Concepts and Outcomes
    const conceptResult = extractConcepts({
      moduleTitle: input.moduleTitle,
      moduleDescription: input.moduleDescription,
      courseTitle: input.courseTitle,
      lessonTitles: input.lessonTitles,
    });
    evidenceNotes.push(
      `Extracted ${conceptResult.primaryConcepts.length} primary concepts and ${conceptResult.supportingConcepts.length} supporting concepts`
    );

    // 4. Classify Cognitive Intent & Practical Learning-Intent Profile
    const intentResult = classifyCognitiveIntent({
      moduleTitle: input.moduleTitle,
      moduleDescription: input.moduleDescription,
      domain: domainResult.domain,
      targetExam: input.targetExam,
      learnerDifficulty: input.learnerDifficulty,
      academicLevel: input.academicLevel,
    });
    evidenceNotes.push(`Cognitive Intent: ${intentResult.cognitiveIntent} (${intentResult.provenance}) - ${intentResult.rationale}`);

    const intentProfile = classifyLearningIntentProfile({
      moduleTitle: input.moduleTitle,
      moduleDescription: input.moduleDescription,
      domain: domainResult.domain,
      targetExam: input.targetExam,
      learnerDifficulty: input.learnerDifficulty,
      academicLevel: input.academicLevel,
    });
    evidenceNotes.push(`Intent Profile: ${intentProfile.primaryCategory} (practical: ${intentProfile.practicalEmphasis}) - [${intentProfile.relevantCategories.join(', ')}]`);

    // 5. Build Negative Constraints (Domain Exclusions + Baseline Noise Filters)
    const baseNegativeTerms = ['reaction', 'vlog', 'shorts', 'unboxing', 'prank'];
    const negativeConstraints = Array.from(
      new Set([...baseNegativeTerms, ...domainResult.domainExclusions])
    );

    // 6. Assemble Prerequisites and Expected Skills
    const prerequisites: string[] = [];
    if (input.academicLevel === 'advanced' || input.academicLevel === 'undergraduate-advanced') {
      prerequisites.push(`Foundational understanding of ${domainResult.domain.replace('_', ' ')}`);
    }

    // 7. Calculate Aggregated Confidence
    const overallConfidence = Number(
      (
        domainResult.confidence * 0.35 +
        conceptResult.confidence * 0.4 +
        intentResult.confidence * 0.25
      ).toFixed(2)
    );

    const analyzedObjective: AnalyzedObjective = {
      rawTitle: input.moduleTitle,
      rawDescription: input.moduleDescription || '',
      subject: input.subject,
      learningGoal: input.learningGoal,
      academicLevel: input.academicLevel,
      targetExam: input.targetExam,
      preferredLanguage: input.preferredLanguage,

      domain: domainResult.domain,
      domainProvenance: domainResult.provenance,

      cognitiveIntent: intentResult.cognitiveIntent,
      intentProvenance: intentResult.provenance,
      intentProfile,

      primaryConcepts: conceptResult.primaryConcepts,
      supportingConcepts: conceptResult.supportingConcepts,
      explicitOutcomes: conceptResult.explicitOutcomes,
      expectedSkills: conceptResult.expectedSkills,
      prerequisites,

      negativeConstraints,
      domainExclusions: domainResult.domainExclusions,
      evidenceNotes,
    };

    const analysisResult: AnalysisResult = {
      objective: analyzedObjective,
      confidence: {
        domainConfidence: Number(domainResult.confidence.toFixed(2)),
        intentConfidence: Number(intentResult.confidence.toFixed(2)),
        conceptsConfidence: Number(conceptResult.confidence.toFixed(2)),
        overallConfidence,
      },
      missingInformation,
      warnings,
      evidence: {
        domainRationale: domainResult.rationale,
        intentRationale: intentResult.rationale,
        extractedTokens: conceptResult.extractedFrom.rawTokens,
        compoundPhrases: conceptResult.extractedFrom.compoundPhrases,
      },
    };

    // Guarantee full schema compliance
    return AnalysisResultSchema.parse(analysisResult);
  }
}
