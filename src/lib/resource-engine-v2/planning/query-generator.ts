import {
  AnalyzedObjective,
  PlannerConfig,
  SearchIntent,
  SearchQueryItem,
  ResourceModality,
  QueryProviderTarget,
  DEFAULT_PLANNER_CONFIG,
} from '../types';

/**
 * Generates intent-tailored search query items from an AnalyzedObjective.
 * Avoids naive word truncation and preserves crucial curricular anchors.
 */
export class QueryGenerator {
  /**
   * Generates a raw candidate set of SearchQueryItems before deduplication.
   */
  public static generateCandidates(
    objective: AnalyzedObjective,
    config: PlannerConfig = {}
  ): SearchQueryItem[] {
    const candidates: SearchQueryItem[] = [];
    const includeExclusions = config.includeExclusionTerms ?? DEFAULT_PLANNER_CONFIG.includeExclusionTerms;
    const enableExam = config.enableExamAnchoring ?? DEFAULT_PLANNER_CONFIG.enableExamAnchoring;

    const negativeTerms = includeExclusions ? objective.negativeConstraints : [];
    const primaryTerm = objective.primaryConcepts.slice(0, 2).join(' and ');
    const supportingTerm = objective.supportingConcepts[0] || '';

    // Build Curricular Anchor (e.g. "HSC Class 12", "JEE Advanced", "Class 12")
    const curricularAnchors: string[] = [];
    if (enableExam && objective.targetExam) {
      curricularAnchors.push(objective.targetExam);
    }
    if (objective.academicLevel && !curricularAnchors.some((a) => a.toLowerCase().includes(objective.academicLevel!.toLowerCase()))) {
      if (objective.academicLevel.startsWith('class-')) {
        curricularAnchors.push(`Class ${objective.academicLevel.replace('class-', '')}`);
      } else if (objective.academicLevel === 'foundation') {
        curricularAnchors.push('Beginner');
      }
    }
    const anchorPrefix = curricularAnchors.length > 0 ? curricularAnchors.join(' ') + ' ' : '';

    // Subject Anchor
    const subjectPrefix = objective.subject ? `${objective.subject} ` : '';

    // 1. Core Foundational Query
    const foundationalQuery = cleanQueryString(
      `${anchorPrefix}${subjectPrefix}${primaryTerm} full tutorial explanation`
    );
    candidates.push({
      id: `q-foundational-${hashString(foundationalQuery)}`,
      targetConcept: primaryTerm,
      queryString: foundationalQuery,
      intent: 'foundational_explanation',
      preferredModality: 'video',
      providerCompatibility: ['youtube', 'curated_directory'],
      priority: 1,
      provenance: 'Primary foundational concept query anchored to subject and curriculum level',
      negativeTerms,
      targetExam: objective.targetExam,
      language: objective.preferredLanguage,
    });

    // 2. Intent-Profile Driven Complementary Queries (When intentProfile is available)
    if (objective.intentProfile && objective.intentProfile.categoryMix.length > 0) {
      const isCodeDomain = objective.domain === 'computer_science' || objective.domain === 'data_science_ai';
      const isPython = isCodeDomain && (objective.primaryConcepts.some((c) => /python/i.test(c)) || (objective.rawTitle && /python/i.test(objective.rawTitle)));
      const isElectronics = (objective.domain === 'engineering' || objective.domain === 'physics') &&
        objective.primaryConcepts.some((c) => /op[- ]?amp|operational\s*amplifier|circuit|transistor|breadboard|oscilloscope|bjt|mosfet/i.test(c));
      const isMath = objective.domain === 'mathematics' || (objective.domain === 'engineering' && !isElectronics && !isCodeDomain);

      for (const mix of objective.intentProfile.categoryMix) {
        if (mix.category === 'conceptual_explanation') {
          // Already seeded with primary foundational query
          continue;
        }

        if (mix.category === 'practical_tutorial') {
          let tutorialQuery = '';
          if (isPython) {
            tutorialQuery = cleanQueryString(`${primaryTerm} practical coding tutorial step by step implementation`);
          } else if (isCodeDomain) {
            tutorialQuery = cleanQueryString(`${primaryTerm} practical coding tutorial step by step implementation hands-on`);
          } else if (isElectronics) {
            tutorialQuery = cleanQueryString(`${primaryTerm} practical circuit breadboard demonstration lab experiment`);
          } else if (!isMath) {
            tutorialQuery = cleanQueryString(`${primaryTerm} practical tutorial step by step demonstration`);
          }

          if (tutorialQuery) {
            candidates.push({
              id: `q-practical-${hashString(tutorialQuery)}`,
              targetConcept: primaryTerm,
              queryString: tutorialQuery,
              intent: 'practical_tutorial',
              preferredModality: 'video',
              providerCompatibility: ['youtube', 'google'],
              priority: mix.priority,
              provenance: `Practical hands-on implementation query for ${objective.domain}`,
              negativeTerms,
              language: objective.preferredLanguage,
            });
          }
        } else if (mix.category === 'guided_exercise') {
          let exerciseQuery = '';
          if (isCodeDomain) {
            exerciseQuery = cleanQueryString(`${primaryTerm} coding exercises practice problems with solutions`);
          } else if (isMath || objective.domain === 'physics' || objective.domain === 'chemistry') {
            exerciseQuery = cleanQueryString(`${anchorPrefix}${subjectPrefix}${primaryTerm} solved problems step by step exercises`);
          } else if (isElectronics) {
            exerciseQuery = cleanQueryString(`${primaryTerm} circuit analysis problems and solutions`);
          } else {
            exerciseQuery = cleanQueryString(`${anchorPrefix}${primaryTerm} practice exercises and solutions`);
          }

          if (exerciseQuery) {
            candidates.push({
              id: `q-exercise-${hashString(exerciseQuery)}`,
              targetConcept: primaryTerm,
              queryString: exerciseQuery,
              intent: 'guided_exercise',
              preferredModality: 'video',
              providerCompatibility: ['youtube', 'curated_directory'],
              priority: mix.priority,
              provenance: 'Guided exercise and step-by-step problem solving query',
              negativeTerms,
              targetExam: objective.targetExam,
              language: objective.preferredLanguage,
            });
          }
        } else if (mix.category === 'project_based') {
          let projQuery = '';
          if (isCodeDomain) {
            projQuery = cleanQueryString(`build ${primaryTerm} project step by step from scratch`);
          } else if (isElectronics) {
            projQuery = cleanQueryString(`${primaryTerm} circuit project breadboard build`);
          } else {
            projQuery = cleanQueryString(`${primaryTerm} practical project walkthrough`);
          }

          if (projQuery) {
            candidates.push({
              id: `q-project-${hashString(projQuery)}`,
              targetConcept: primaryTerm,
              queryString: projQuery,
              intent: 'project_based',
              preferredModality: 'project',
              providerCompatibility: ['youtube', 'google'],
              priority: mix.priority,
              provenance: 'Project-based learning and end-to-end implementation query',
              negativeTerms,
              language: objective.preferredLanguage,
            });
          }
        } else if (mix.category === 'real_world_application') {
          let appQuery = '';
          if (isCodeDomain) {
            appQuery = cleanQueryString(`${primaryTerm} real world applications automation case study`);
          } else if (isMath || objective.domain === 'engineering' || isElectronics) {
            appQuery = cleanQueryString(`${primaryTerm} engineering applications real world examples`);
          } else {
            appQuery = cleanQueryString(`${primaryTerm} real world applications case study`);
          }

          if (appQuery) {
            candidates.push({
              id: `q-app-${hashString(appQuery)}`,
              targetConcept: primaryTerm,
              queryString: appQuery,
              intent: 'real_world_application',
              preferredModality: 'video',
              providerCompatibility: ['youtube'],
              priority: mix.priority,
              provenance: 'Real-world application and case study query',
              negativeTerms,
              language: objective.preferredLanguage,
            });
          }
        } else if (mix.category === 'advanced_optimization') {
          const optQuery = cleanQueryString(`${primaryTerm} advanced optimization performance complexity analysis`);
          candidates.push({
            id: `q-opt-${hashString(optQuery)}`,
            targetConcept: primaryTerm,
            queryString: optQuery,
            intent: 'advanced_optimization',
            preferredModality: 'video',
            providerCompatibility: ['youtube'],
            priority: mix.priority,
            provenance: 'Advanced implementation and optimization query',
            negativeTerms,
            language: objective.preferredLanguage,
          });
        }
      }
    } else {
      // Fallback: Legacy cognitive intent switch when intentProfile is absent
      switch (objective.cognitiveIntent) {
        case 'project_implementation': {
          const projectQuery = cleanQueryString(
            `build ${primaryTerm} ${supportingTerm} step by step project walkthrough from scratch`
          );
          candidates.push({
            id: `q-project-${hashString(projectQuery)}`,
            targetConcept: primaryTerm,
            queryString: projectQuery,
            intent: 'project_implementation',
            preferredModality: 'project',
            providerCompatibility: ['youtube', 'google'],
            priority: 1,
            provenance: 'End-to-end practical project walkthrough targeting complete implementation',
            negativeTerms,
            language: objective.preferredLanguage,
          });
          break;
        }

        case 'coding_walkthrough': {
          const langContext = objective.domain === 'data_science_ai' ? 'Python AI' : 'code implementation';
          const codingQuery = cleanQueryString(
            `${primaryTerm} ${supportingTerm} ${langContext} tutorial hands-on`
          );
          candidates.push({
            id: `q-coding-${hashString(codingQuery)}`,
            targetConcept: primaryTerm,
            queryString: codingQuery,
            intent: 'coding_walkthrough',
            preferredModality: 'video',
            providerCompatibility: ['youtube', 'google'],
            priority: 1,
            provenance: 'Practical code-along walkthrough targeting syntax and implementation',
            negativeTerms,
            language: objective.preferredLanguage,
          });
          break;
        }

        case 'worked_examples': {
          const exampleQuery = cleanQueryString(
            `${anchorPrefix}${subjectPrefix}${primaryTerm} solved problems step by step exercises`
          );
          candidates.push({
            id: `q-worked-${hashString(exampleQuery)}`,
            targetConcept: primaryTerm,
            queryString: exampleQuery,
            intent: 'worked_examples',
            preferredModality: 'video',
            providerCompatibility: ['youtube', 'curated_directory'],
            priority: 1,
            provenance: 'Step-by-step worked problem solving and exercise solutions',
            negativeTerms,
            targetExam: objective.targetExam,
            language: objective.preferredLanguage,
          });
          break;
        }

        case 'in_depth_conceptual': {
          const derivationQuery = cleanQueryString(
            `${anchorPrefix}${subjectPrefix}${primaryTerm} derivation theory in-depth lecture`
          );
          candidates.push({
            id: `q-indepth-${hashString(derivationQuery)}`,
            targetConcept: primaryTerm,
            queryString: derivationQuery,
            intent: 'in_depth_conceptual',
            preferredModality: 'video',
            providerCompatibility: ['youtube', 'academic_notes', 'curated_directory'],
            priority: 1,
            provenance: 'In-depth conceptual derivation and theoretical mechanics',
            negativeTerms,
            targetExam: objective.targetExam,
            language: objective.preferredLanguage,
          });
          break;
        }

        case 'practical_demonstration': {
          const demoQuery = cleanQueryString(
            `${primaryTerm} experiment demonstration lab visual simulation`
          );
          candidates.push({
            id: `q-demo-${hashString(demoQuery)}`,
            targetConcept: primaryTerm,
            queryString: demoQuery,
            intent: 'practical_demonstration',
            preferredModality: 'video',
            providerCompatibility: ['youtube'],
            priority: 2,
            provenance: 'Visual laboratory demonstration or experimental simulation',
            negativeTerms,
          });
          break;
        }

        case 'exam_practice': {
          const examPracticeQuery = cleanQueryString(
            `${anchorPrefix}${subjectPrefix}${primaryTerm} previous year questions PYQ solutions`
          );
          candidates.push({
            id: `q-exam-${hashString(examPracticeQuery)}`,
            targetConcept: primaryTerm,
            queryString: examPracticeQuery,
            intent: 'exam_practice',
            preferredModality: 'practice',
            providerCompatibility: ['youtube', 'google'],
            priority: 1,
            provenance: 'Targeted examination practice with previous year questions and marking schemes',
            negativeTerms,
            targetExam: objective.targetExam,
          });
          break;
        }

        default:
          break;
      }
    }

    // 3. Problem Solving / Worked Exercises Query (For legacy fallback when intentProfile is absent)
    const analyticalDomains = ['mathematics', 'physics', 'chemistry', 'economics_commerce'];
    if (!objective.intentProfile && analyticalDomains.includes(objective.domain) && objective.cognitiveIntent !== 'worked_examples') {
      const exerciseQuery = cleanQueryString(
        `${anchorPrefix}${subjectPrefix}${primaryTerm} solved problems step by step`
      );
      candidates.push({
        id: `q-exercises-${hashString(exerciseQuery)}`,
        targetConcept: primaryTerm,
        queryString: exerciseQuery,
        intent: 'worked_examples',
        preferredModality: 'video',
        providerCompatibility: ['youtube'],
        priority: 2,
        provenance: 'Supplementary worked exercise solutions for analytical domain mastery',
        negativeTerms,
        targetExam: objective.targetExam,
      });
    }

    // 4. Authoritative Reading / Monograph / Reference Query
    let readingModality: ResourceModality = 'monograph';
    let readingProviders: QueryProviderTarget[] = ['academic_notes', 'openalex', 'google'];

    let readingSuffix = 'textbook chapter notes summary';
    if (objective.domain === 'data_science_ai' || objective.domain === 'computer_science') {
      readingModality = 'documentation';
      readingProviders = ['academic_notes', 'arxiv', 'openalex', 'google'];
      readingSuffix = 'documentation official guide reference';
    } else if (objective.domain === 'economics_commerce' || objective.domain === 'mathematics' || objective.domain === 'general_academic') {
      readingProviders = ['academic_notes', 'openalex', 'arxiv', 'google'];
      readingSuffix = 'academic reading notes lecture study material';
    }

    const readingQuery = cleanQueryString(
      `${anchorPrefix}${subjectPrefix}${primaryTerm} ${readingSuffix}`
    );
    candidates.push({
      id: `q-reading-${hashString(readingQuery)}`,
      targetConcept: primaryTerm,
      queryString: readingQuery,
      intent: 'authoritative_documentation',
      preferredModality: readingModality,
      providerCompatibility: readingProviders,
      priority: 2,
      provenance: 'Authoritative text reading, monographs, and official documentation',
      negativeTerms,
      targetExam: objective.targetExam,
    });

    // 5. Targeted Examination Practice Query (If target exam is supplied and not already primary intent)
    if (objective.targetExam && objective.cognitiveIntent !== 'exam_practice') {
      const examQuery = cleanQueryString(
        `${objective.targetExam} ${subjectPrefix}${primaryTerm} previous year questions PYQ solutions`
      );
      candidates.push({
        id: `q-exam-supp-${hashString(examQuery)}`,
        targetConcept: primaryTerm,
        queryString: examQuery,
        intent: 'exam_practice',
        preferredModality: 'practice',
        providerCompatibility: ['youtube', 'google'],
        priority: 2,
        provenance: 'Targeted examination past questions aligned with learner exam goal',
        negativeTerms,
        targetExam: objective.targetExam,
      });
    }

    return candidates;
  }
}

function cleanQueryString(str: string): string {
  return str
    .replace(/\s+/g, ' ')
    .trim();
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).substring(0, 6);
}
