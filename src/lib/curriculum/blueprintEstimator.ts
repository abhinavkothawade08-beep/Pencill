/**
 * Curriculum Blueprint Estimator
 * 
 * Provides dynamic, pedagogical, pre-generation estimates of curriculum scope,
 * module count range, hours, pacing, prerequisite hierarchy, and timeline feasibility.
 */

import { LearningPathConfig } from '../types/builder';

export interface CurriculumBlueprintEstimate {
  topicScope: string;
  domainName: string;
  moduleRange: [number, number];
  estimatedTotalHours: number;
  estimatedWeeks: number;
  pacingSummary: string;
  recommendedPrerequisites: string[];
  learningStages: Array<{
    stageNumber: number;
    title: string;
    focus: string;
    estimatedHours: number;
  }>;
  modalityCounts: Array<{
    name: string;
    countEstimate: string;
    icon: string;
    enabled: boolean;
  }>;
  scheduleFeasibility: {
    isFeasible: boolean;
    isCompressed?: boolean;
    conflictWarning?: string;
    suggestedWeeklyHours?: number;
    targetDeadlineDays?: number;
  };
  assumptions: string[];
}

/**
 * Calculates pre-generation blueprint estimates from active configuration.
 */
export function estimateCurriculumBlueprint(config: LearningPathConfig): CurriculumBlueprintEstimate {
  const combinedTopics = config.topics.length > 0
    ? config.topics.join(' · ')
    : config.subject || 'General Study';

  const tLower = combinedTopics.toLowerCase();
  const domainLower = config.domainName.toLowerCase();
  const hasExam = Boolean(config.targetExam?.name);

  // 1. Determine Scope Tier and Module Count Range
  const isNarrowTopic =
    config.topics.length === 1 &&
    (tLower.includes('decorator') ||
      tLower.includes('generator') ||
      tLower.includes('binary search') ||
      tLower.includes('gradient descent') ||
      tLower.includes('regular expression') ||
      tLower.includes('jwt') ||
      tLower.includes('recursion'));

  const isFrontierOrExamSyllabus =
    hasExam ||
    tLower.includes('jee') ||
    tLower.includes('neet') ||
    tLower.includes('upsc') ||
    tLower.includes('gate') ||
    tLower.includes('machine learning') ||
    tLower.includes('deep learning') ||
    tLower.includes('llm') ||
    tLower.includes('full stack') ||
    config.topics.length >= 3;

  let moduleRange: [number, number] = [3, 4];
  let baseHours = 20;

  if (isNarrowTopic) {
    moduleRange = [2, 3];
    baseHours = 12;
  } else if (isFrontierOrExamSyllabus) {
    moduleRange = [5, 6];
    baseHours = 38;
  } else {
    moduleRange = [3, 5];
    baseHours = 24;
  }

  // Adjust hours by depth and difficulty
  const depthMultiplier =
    config.depthLevel === 'foundation' ? 0.75 :
    config.depthLevel === 'class-11' ? 0.9 :
    config.depthLevel === 'class-12' ? 1.05 :
    config.depthLevel === 'competitive' ? 1.3 :
    config.depthLevel.includes('undergraduate') ? 1.25 :
    config.depthLevel === 'postgraduate' ? 1.4 :
    config.depthLevel === 'research' ? 1.5 : 1.0;

  const difficultyMultiplier =
    config.difficulty === 'beginner' ? 0.85 :
    config.difficulty === 'elementary' ? 0.95 :
    config.difficulty === 'intermediate' ? 1.05 :
    config.difficulty === 'advanced' ? 1.25 :
    config.difficulty === 'expert' ? 1.4 : 1.0;

  const estimatedTotalHours = Math.round(baseHours * depthMultiplier * difficultyMultiplier);
  const weeklyHours = Math.max(2, config.weeklyHours || 6);
  const estimatedWeeks = Math.max(1, Math.ceil(estimatedTotalHours / weeklyHours));

  // 2. Pacing Description
  let pacingSummary = `${estimatedWeeks} Weeks (${weeklyHours}h / week)`;
  if (config.pacingStrategy === 'sprint') {
    pacingSummary += ' · Accelerated Sprint Pace';
  } else if (config.pacingStrategy === 'intensive') {
    pacingSummary += ' · Intensive Immersion';
  } else if (config.pacingStrategy === 'casual') {
    pacingSummary += ' · Flexible Casual Pace';
  } else {
    pacingSummary += ' · Balanced Progression';
  }

  // 3. Recommended Prerequisites based on subject/domain
  const prerequisites: string[] = [];
  if (domainLower.includes('engineering') || domainLower.includes('computer')) {
    prerequisites.push('Basic Algorithmic Logic & Computational Syntax');
    if (tLower.includes('ai') || tLower.includes('learning')) {
      prerequisites.push('Linear Algebra & Matrix Operations', 'Introductory Probability');
    }
  } else if (domainLower.includes('medical') || domainLower.includes('health')) {
    prerequisites.push('Basic Human Biology & Cellular Foundations', 'Fundamental Chemistry Terminology');
  } else if (domainLower.includes('school') || domainLower.includes('science')) {
    prerequisites.push('Fundamental Algebra & Scientific Coordinate Systems');
  } else if (domainLower.includes('business') || domainLower.includes('finance')) {
    prerequisites.push('Basic Quantitative Literacy & Arithmetic', 'Introductory Accounting Principles');
  } else {
    prerequisites.push('Core Subject Literacy & Analytical Reading');
  }

  // 4. Staged Pedagogical Architecture
  const stageDuration = Math.round(estimatedTotalHours / 3);
  const learningStages = [
    {
      stageNumber: 1,
      title: 'Foundations, Axioms & Conceptual Frameworks',
      focus: 'Core definitions, structural models, and prerequisite alignment.',
      estimatedHours: stageDuration,
    },
    {
      stageNumber: 2,
      title: 'Analytical Mechanics, Core Methods & Deep Practice',
      focus: 'Step-by-step problem sets, derivations, and applied workflows.',
      estimatedHours: stageDuration,
    },
    {
      stageNumber: 3,
      title: 'Applied Synthesis, Edge Cases & Mastery Evaluation',
      focus: 'Diagnostic evaluations, multi-concept synthesis, and exam-standard checkpoints.',
      estimatedHours: estimatedTotalHours - (stageDuration * 2),
    },
  ];

  // 5. Modality breakdown
  const avgModules = Math.round((moduleRange[0] + moduleRange[1]) / 2);
  const modalityCounts = [
    {
      name: 'Curated Video Lectures',
      countEstimate: config.modalities.videos ? `${avgModules * 1}–${avgModules * 2} verified lectures` : 'Disabled',
      icon: 'smart_display',
      enabled: config.modalities.videos,
    },
    {
      name: 'Theory Notes & Monographs',
      countEstimate: config.modalities.reading ? `${avgModules * 2} reading extracts` : 'Disabled',
      icon: 'menu_book',
      enabled: config.modalities.reading,
    },
    {
      name: 'Graded Practice Problems',
      countEstimate: config.modalities.practice ? `${avgModules * 6} curated questions` : 'Disabled',
      icon: 'assignment',
      enabled: config.modalities.practice,
    },
    {
      name: 'Diagnostic Checkpoints',
      countEstimate: config.modalities.quizzes ? `${avgModules} module checkpoints` : 'Disabled',
      icon: 'quiz',
      enabled: config.modalities.quizzes,
    },
    {
      name: 'Formula Flashcards',
      countEstimate: config.modalities.flashcards ? `${avgModules * 4} memory hook cards` : 'Disabled',
      icon: 'style',
      enabled: config.modalities.flashcards,
    },
  ];

  // 6. Schedule Feasibility & Conflict Detection
  let isFeasible = true;
  let conflictWarning: string | undefined;
  let suggestedWeeklyHours: number | undefined;
  let targetDeadlineDays: number | undefined;

  if (config.targetCompletionDate) {
    const now = new Date();
    const targetDate = new Date(config.targetCompletionDate);
    const diffTime = targetDate.getTime() - now.getTime();
    targetDeadlineDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (targetDeadlineDays <= 0) {
      isFeasible = false;
      conflictWarning = 'Target date is in the past. Please select a future target deadline.';
    } else {
      const availableWeeks = Math.max(0.5, targetDeadlineDays / 7);
      const requiredWeeklyHours = Math.ceil(estimatedTotalHours / availableWeeks);

      if (requiredWeeklyHours > weeklyHours + 4) {
        isFeasible = false;
        conflictWarning = `Target date is ${targetDeadlineDays} days away (~${availableWeeks.toFixed(1)} wks). Achieving ${estimatedTotalHours} hours requires ~${requiredWeeklyHours} hrs/week vs your chosen ${weeklyHours} hrs/week.`;
        suggestedWeeklyHours = requiredWeeklyHours;
      }
    }
  }

  // 7. Important Assumptions
  const assumptions = [
    `Curriculum size will dynamically adjust to syllabus scope (${moduleRange[0]}–${moduleRange[1]} modules).`,
    `Resource Engine will filter verified materials in ${config.instructionLanguage}.`,
    hasExam
      ? `Content will strictly prioritize verified ${config.targetExam?.acronym || config.targetExam?.name} exam syllabus.`
      : 'General academic curriculum grounded in standard higher-education syllabi.',
    'Estimates reflect realistic mastery study time, including problem-solving and diagnostics.',
  ];

  return {
    topicScope: combinedTopics,
    domainName: config.domainName,
    moduleRange,
    estimatedTotalHours,
    estimatedWeeks,
    pacingSummary,
    recommendedPrerequisites: prerequisites,
    learningStages,
    modalityCounts,
    scheduleFeasibility: {
      isFeasible,
      isCompressed: !isFeasible && Boolean(conflictWarning),
      conflictWarning,
      suggestedWeeklyHours,
      targetDeadlineDays,
    },
    assumptions,
  };
}
