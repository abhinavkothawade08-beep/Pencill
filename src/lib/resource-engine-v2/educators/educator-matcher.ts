import {
  EducatorMatchContext,
  EducatorMatchResult,
  EducatorMatchScoreBreakdown,
  MasterEducatorRecord,
} from './types';
import { EducatorRegistry, educatorRegistry } from './educator-registry';
import { tokenize, stemWord } from '../utils/text-utils';
import { clampScore } from '../utils/scoring-utils';
import { canonicalizeUrl } from '../utils/url-utils';
import { EngineResource, ResourceDifficulty } from '../types/legacy-contracts';

export interface MatcherWeights {
  subjectRelevance: number; // default 0.25
  topicSpecialization: number; // default 0.25
  examinationAlignment: number; // default 0.20
  curriculumLevelMatch: number; // default 0.15
  languageCompatibility: number; // default 0.10
  credibilityAndVerification: number; // default 0.05
}

export const DEFAULT_MATCHER_WEIGHTS: MatcherWeights = {
  subjectRelevance: 0.25,
  topicSpecialization: 0.25,
  examinationAlignment: 0.20,
  curriculumLevelMatch: 0.15,
  languageCompatibility: 0.10,
  credibilityAndVerification: 0.05,
};

export class EducatorMatcher {
  private registry: EducatorRegistry;
  private weights: MatcherWeights;

  constructor(registry?: EducatorRegistry, customWeights?: Partial<MatcherWeights>) {
    this.registry = registry || educatorRegistry;
    this.weights = { ...DEFAULT_MATCHER_WEIGHTS, ...customWeights };
  }

  /**
   * Derives a structured EducatorMatchContext from general query/course/module parameters.
   */
  static deriveContext(params: {
    query?: string;
    courseTitle?: string;
    moduleTitle?: string;
    moduleObjective?: string;
    moduleObjectives?: string[];
    level?: string;
    academicLevel?: string;
    targetExam?: string;
    examination?: string;
    subject?: string;
    country?: string;
    curriculum?: string;
    language?: string;
    preferredLanguage?: string;
    domain?: string;
    specificTopic?: string;
    subtopics?: string[];
    requiredDepth?: 'foundation' | 'intermediate' | 'rigorous' | 'exam-prep';
    desiredResourceType?: 'full_course' | 'youtube_playlist' | 'video_lecture' | 'all' | string;
  }): EducatorMatchContext {
    const rawText = `${params.query || ''} ${params.courseTitle || ''} ${params.moduleTitle || ''}`.trim();
    const lower = rawText.toLowerCase();

    // Detect Examination
    let examination = params.examination || params.targetExam;
    if (!examination) {
      if (lower.includes('jee advanced') || lower.includes('iit jee')) examination = 'JEE Advanced';
      else if (lower.includes('jee main') || lower.includes('jee')) examination = 'JEE Main';
      else if (lower.includes('neet-ug') || lower.includes('neet')) examination = 'NEET-UG';
      else if (lower.includes('upsc') || lower.includes('civil services')) examination = 'UPSC Civil Services';
      else if (lower.includes('ssc cgl') || lower.includes('ssc')) examination = 'SSC CGL';
      else if (lower.includes('mht cet') || lower.includes('mht-cet')) examination = 'MHT-CET';
      else if (lower.includes('hsc') || lower.includes('maharashtra board')) examination = 'Maharashtra HSC Board';
      else if (lower.includes('cbse class 12') || lower.includes('class 12 board')) examination = 'CBSE Class 12';
      else if (lower.includes('gate da') || lower.includes('gate cs') || lower.includes('gate')) examination = 'GATE';
      else if (lower.includes('cat') && (lower.includes('mba') || lower.includes('percentile') || lower.includes('exam'))) examination = 'CAT';
      else if (lower.includes('gre')) examination = 'GRE';
      else if (lower.includes('gmat')) examination = 'GMAT Focus';
      else if (lower.includes('ielts')) examination = 'IELTS';
      else if (lower.includes('jlpt')) examination = 'JLPT';
      else if (lower.includes('ccna')) examination = 'Cisco CCNA';
      else if (lower.includes('security+') || lower.includes('comptia')) examination = 'CompTIA Security+';
      else if (lower.includes('aws certified') || lower.includes('aws solutions architect')) examination = 'AWS Certifications';
      else if (lower.includes('clat')) examination = 'CLAT';
    }

    // Detect Curriculum / State / Regional Board
    let curriculum: string | undefined = params.curriculum;
    let country = params.country || 'India';
    if (lower.includes('maharashtra') || lower.includes('hsc') || lower.includes('ssc board') || lower.includes('mht-cet') || lower.includes('mht cet')) {
      curriculum = 'Maharashtra State Board';
      country = 'India';
    } else if (lower.includes('cbse') || lower.includes('ncert')) {
      curriculum = 'CBSE';
      country = 'India';
    } else if (lower.includes('icse') || lower.includes('isc')) {
      curriculum = 'ICSE/ISC';
      country = 'India';
    } else if (lower.includes('ib') || lower.includes('international baccalaureate')) {
      curriculum = 'IB';
      country = 'Global';
    } else if (lower.includes('cambridge') || lower.includes('igcse') || lower.includes('a-level')) {
      curriculum = 'Cambridge International';
      country = 'Global';
    } else if (lower.includes('usmle') || lower.includes('sat') || lower.includes('ap examination') || lower.includes('ap calculus')) {
      country = 'United States';
    }

    // Detect Language preference
    let preferredLanguage = params.preferredLanguage || params.language || 'English';
    if (lower.includes('marathi') || (curriculum === 'Maharashtra State Board' && lower.includes('marathi'))) {
      preferredLanguage = 'Marathi';
    } else if (lower.includes('hindi') || lower.includes('hinglish')) {
      preferredLanguage = 'Hindi';
    }

    // Detect Subject
    let subject = params.subject || params.domain;
    if (!subject) {
      if (lower.includes('math') || lower.includes('calculus') || lower.includes('algebra') || lower.includes('geometry') || lower.includes('trigonometry')) {
        subject = 'Mathematics';
      } else if (lower.includes('physic') || lower.includes('mechanic') || lower.includes('optics') || lower.includes('thermodynamic')) {
        subject = 'Physics';
      } else if (lower.includes('chemistry') || lower.includes('organic') || lower.includes('inorganic')) {
        subject = 'Chemistry';
      } else if (lower.includes('biology') || lower.includes('botany') || lower.includes('zoology')) {
        subject = 'Biology';
      } else if (lower.includes('python')) {
        subject = 'Python';
      } else if (lower.includes('java') || lower.includes('c++') || lower.includes('javascript') || lower.includes('programming') || lower.includes('web development') || lower.includes('software')) {
        subject = 'Programming and Software Development';
      } else if (lower.includes('machine learning') || lower.includes('deep learning') || lower.includes('neural') || lower.includes('artificial intelligence') || lower.includes('ai') || lower.includes('transformer') || lower.includes('llm')) {
        subject = 'AI and Emerging Technologies';
      } else if (lower.includes('economy') || lower.includes('finance') || lower.includes('accounting') || lower.includes('valuation')) {
        subject = 'Business and Finance';
      } else if (lower.includes('law') || lower.includes('constitution') || lower.includes('legal')) {
        subject = 'Law & Legal Studies';
      }
    }

    let desiredResourceType: 'full_course' | 'youtube_playlist' | 'video_lecture' | 'all' = 'all';
    if (params.desiredResourceType) {
      const lowerType = params.desiredResourceType.toLowerCase();
      if (lowerType.includes('course')) desiredResourceType = 'full_course';
      else if (lowerType.includes('playlist')) desiredResourceType = 'youtube_playlist';
      else if (lowerType.includes('video') || lowerType.includes('lecture')) desiredResourceType = 'video_lecture';
    }

    const moduleObjectives = params.moduleObjectives || (params.moduleObjective ? [params.moduleObjective] : undefined);
    const academicLevel = params.academicLevel || params.level;

    return {
      courseTitle: params.courseTitle || params.query || '',
      moduleTitle: params.moduleTitle,
      moduleObjectives,
      subject,
      specificTopic: params.specificTopic || params.query || params.courseTitle,
      subtopics: params.subtopics,
      academicLevel,
      examination,
      country,
      curriculum,
      preferredLanguage,
      requiredDepth: params.requiredDepth,
      desiredResourceType,
    };
  }

  /**
   * Static helper: Matches candidate educators against learning context using default registry.
   */
  static matchEducators(
    context: EducatorMatchContext,
    options?: {
      limit?: number;
      minScore?: number;
      filterVerifiedOnly?: boolean;
      customWeights?: Partial<MatcherWeights>;
    }
  ): EducatorMatchResult[] {
    const matcher = new EducatorMatcher();
    return matcher.matchEducators(context, options);
  }

  /**
   * Matches candidate educators against learning context using transparent weighted scoring.
   */
  matchEducators(
    context: EducatorMatchContext,
    options?: {
      limit?: number;
      minScore?: number;
      filterVerifiedOnly?: boolean;
      customWeights?: Partial<MatcherWeights>;
    }
  ): EducatorMatchResult[] {
    const weights = { ...this.weights, ...options?.customWeights };
    const allEducators = this.registry.getAll();
    const results: EducatorMatchResult[] = [];

    const minScore = options?.minScore ?? 45;
    const limit = options?.limit ?? 5;

    for (const educator of allEducators) {
      if (options?.filterVerifiedOnly && educator.Verification_Status !== 'VERIFIED') {
        continue;
      }
      if (educator.Active_Status !== 'Active') {
        continue;
      }

      const scoreBreakdown = this.evaluateEducator(educator, context);
      const totalScore = clampScore(
        scoreBreakdown.subjectRelevance * weights.subjectRelevance +
        scoreBreakdown.topicSpecialization * weights.topicSpecialization +
        scoreBreakdown.examinationAlignment * weights.examinationAlignment +
        scoreBreakdown.curriculumLevelMatch * weights.curriculumLevelMatch +
        scoreBreakdown.languageCompatibility * weights.languageCompatibility +
        scoreBreakdown.credibilityAndVerification * weights.credibilityAndVerification +
        scoreBreakdown.completeCourseBonus
      );

      scoreBreakdown.totalScore = totalScore;

      if (totalScore >= minScore) {
        const matchingReasons = this.generateMatchingReasons(educator, context, scoreBreakdown);
        results.push({
          educator,
          score: scoreBreakdown,
          confidence: totalScore >= 75 ? 'high' : totalScore >= 55 ? 'medium' : 'low',
          matchingReasons,
          isTopicalAuthority: scoreBreakdown.topicSpecialization >= 70,
          hasCompleteCourse: educator.Complete_Course_Available === 'Yes',
          hasStructuredPlaylist: educator.Playlist_Available === 'Yes',
        });
      }
    }

    // Sort descending by total match score
    results.sort((a, b) => b.score.totalScore - a.score.totalScore);
    return results.slice(0, limit);
  }

  /**
   * Evaluates individual educator against context across all dimensions.
   */
  private evaluateEducator(
    edu: MasterEducatorRecord,
    ctx: EducatorMatchContext
  ): EducatorMatchScoreBreakdown {
    const targetText = `${ctx.courseTitle} ${ctx.moduleTitle || ''} ${ctx.specificTopic || ''} ${ctx.subject || ''} ${(ctx.subtopics || []).join(' ')}`.toLowerCase();
    const targetTokens = tokenize(targetText);

    // Extract focal topic tokens, discounting broad generic domain terms and component keywords
    const genericDomainTokens = new Set([
      'comput', 'scienc', 'engin', 'program', 'academ', 'subject', 'cours', 'tutori', 'learn', 'onlin', 'technolog',
      'data', 'variabl', 'typ', 'control', 'flow', 'concept', 'fundament', 'basic', 'intro', 'introduct', 'method', 'structur', 'analysi', 'theori', 'practic', 'review', 'solut', 'exercis', 'system'
    ]);
    const focalTokens = new Set<string>();
    const focalRawTokens = tokenize(`${ctx.courseTitle} ${ctx.moduleTitle || ''} ${ctx.specificTopic || ''} ${ctx.subject || ''}`);
    for (const t of focalRawTokens) {
      if (!genericDomainTokens.has(t)) {
        focalTokens.add(t);
      }
    }

    // 1. Subject Relevance (0 - 100)
    let subjectRelevance = 20;
    const eduSubjects = EducatorRegistry.parseTokens(edu.Subjects);
    let subjectTokenOverlap = 0;
    let focalSubjectMatch = false;
    let isPrimarySubject = false;

    for (let i = 0; i < eduSubjects.length; i++) {
      const s = eduSubjects[i];
      const sToks = tokenize(s);
      for (const tok of sToks) {
        if (targetTokens.has(tok)) subjectTokenOverlap++;
        if (focalTokens.has(tok)) {
          focalSubjectMatch = true;
          if (i <= 2) isPrimarySubject = true;
        }
      }
    }

    if (focalTokens.size > 0) {
      if (isPrimarySubject) {
        subjectRelevance = 98;
      } else if (focalSubjectMatch) {
        subjectRelevance = 90;
      } else {
        // Educator does NOT teach the focal subject (e.g. general ECE educator for a Python course)
        subjectRelevance = Math.min(30, subjectTokenOverlap * 10);
      }
    } else {
      if (subjectTokenOverlap >= 3) subjectRelevance = 95;
      else if (subjectTokenOverlap === 2) subjectRelevance = 80;
      else if (subjectTokenOverlap === 1) subjectRelevance = 65;
    }

    // Direct subject match against ctx.subject
    if (ctx.subject) {
      const normCtxSub = ctx.subject.toLowerCase().trim();
      const ctxSubTokens = tokenize(normCtxSub);
      for (const s of eduSubjects) {
        const normS = s.toLowerCase();
        if (normS.includes(normCtxSub) || normCtxSub.includes(normS)) {
          subjectRelevance = Math.max(subjectRelevance, 90);
          break;
        }
        const sToks = tokenize(s);
        for (const st of sToks) {
          if (ctxSubTokens.has(st)) {
            subjectRelevance = Math.max(subjectRelevance, 85);
          }
        }
      }
    }

    // Check primary domain alignment (modest baseline)
    const normPrimaryDomain = EducatorRegistry.normalizeToken(edu.Primary_Domain);
    const contextDomain = EducatorRegistry.normalizeToken(ctx.subject || '');
    if (contextDomain && (normPrimaryDomain.includes(contextDomain) || contextDomain.includes(normPrimaryDomain))) {
      subjectRelevance = Math.max(subjectRelevance, 60);
    }

    // 2. Specific Topic & Specialization Relevance (0 - 100)
    let topicSpecialization = 25;
    const specTokens = tokenize(`${edu.Teaching_Specialization} ${edu.Subdomain} ${edu.Research_Notes}`);
    let specOverlap = 0;
    let focalSpecOverlap = 0;

    for (const tok of specTokens) {
      if (targetTokens.has(tok)) specOverlap++;
      if (focalTokens.has(tok)) focalSpecOverlap++;
    }

    if (focalTokens.size > 0) {
      if (focalSpecOverlap >= 2) {
        topicSpecialization = 98;
      } else if (focalSpecOverlap === 1) {
        topicSpecialization = 92;
      } else if (focalSubjectMatch) {
        topicSpecialization = 75;
      } else {
        topicSpecialization = Math.min(35, 20 + specOverlap * 5);
      }
    } else {
      if (specOverlap >= 4) topicSpecialization = 98;
      else if (specOverlap >= 2) topicSpecialization = 82;
      else if (specOverlap === 1) topicSpecialization = 60;
    }

    // Exact topic keyword matching in specialization
    const rawSpecificTopic = (ctx.specificTopic || ctx.courseTitle).toLowerCase();
    if (edu.Teaching_Specialization.toLowerCase().includes(rawSpecificTopic) || edu.Subdomain.toLowerCase().includes(rawSpecificTopic)) {
      topicSpecialization = 100;
    }

    // -------------------------------------------------------------
    // Anti-leakage / Negative domain guardrails (Requirements 4, 8 & 9)
    // -------------------------------------------------------------
    const isAiTopic = targetText.includes('machine learning') || targetText.includes('deep learning') || targetText.includes('neural network') || targetText.includes('transformer') || targetText.includes('generative ai');
    const isSchoolOrAcademic = Boolean(ctx.examination || ctx.curriculum || ctx.academicLevel || (ctx.subject && ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Science'].includes(ctx.subject)));

    // Guardrail 1: School science educator shouldn't outrank AI/ML specialists for Machine Learning
    if (isAiTopic && edu.Primary_Domain === 'School Education') {
      topicSpecialization = Math.min(topicSpecialization, 20);
      subjectRelevance = Math.min(subjectRelevance, 25);
    }

    // Guardrail 2: Health/Fitness/Vocational/Trade educators must NOT match School Education or Academic Examinations
    const nonAcademicDomains = new Set([
      'Health, Wellness, and Personal Development',
      'Vocational, Trade & Practical Life Skills',
      'Art, Music, and Creative Skills'
    ]);
    if (isSchoolOrAcademic && nonAcademicDomains.has(edu.Primary_Domain)) {
      topicSpecialization = Math.min(topicSpecialization, 15);
      subjectRelevance = Math.min(subjectRelevance, 15);
    }

    // Guardrail 3: IT Hardware/Cisco CCNA educators must NOT match Machine Learning / AI
    if (isAiTopic && (edu.Subdomain.toLowerCase().includes('networking') || edu.Primary_Domain === 'Professional Certifications')) {
      topicSpecialization = Math.min(topicSpecialization, 15);
      subjectRelevance = Math.min(subjectRelevance, 15);
    }

    // Guardrail 4: Dedicated language course (e.g. Python) requires educator to explicitly teach that language
    if (targetText.includes('python') && !edu.Subjects.toLowerCase().includes('python')) {
      subjectRelevance = Math.min(subjectRelevance, 20);
      topicSpecialization = Math.min(topicSpecialization, 20);
    }

    // 3. Examination Alignment (0 - 100)
    let examinationAlignment = 50; // Neutral baseline if no examination requested
    if (ctx.examination) {
      const targetExamNorm = EducatorRegistry.normalizeToken(ctx.examination);
      const eduExams = EducatorRegistry.parseTokens(edu.Relevant_Examinations);

      let exactExamMatch = false;
      let partialExamMatch = false;

      for (const ex of eduExams) {
        if (ex === targetExamNorm || ex.includes(targetExamNorm) || targetExamNorm.includes(ex)) {
          exactExamMatch = true;
          break;
        }
        const exToks = tokenize(ex);
        const targetExToks = tokenize(targetExamNorm);
        for (const t of targetExToks) {
          if (exToks.has(t)) {
            partialExamMatch = true;
            break;
          }
        }
      }

      if (exactExamMatch) {
        examinationAlignment = 98;
      } else if (partialExamMatch) {
        examinationAlignment = 80;
      } else {
        // Penalty for mismatched exam (e.g. requesting JEE when educator teaches SAT only)
        examinationAlignment = 15;
      }
    }

    // 4. Curriculum / Regional & Academic Level Compatibility (0 - 100)
    let curriculumLevelMatch = 60;

    // Curriculum matching (e.g., Maharashtra State Board vs CBSE vs IB)
    if (ctx.curriculum) {
      const normCurriculum = ctx.curriculum.toLowerCase();
      const eduSubdomain = edu.Subdomain.toLowerCase();
      const eduSpecialization = edu.Teaching_Specialization.toLowerCase();

      if (eduSubdomain.includes(normCurriculum) || eduSpecialization.includes(normCurriculum)) {
        curriculumLevelMatch = 98;
      } else if (normCurriculum.includes('maharashtra') && (edu.Subjects.toLowerCase().includes('marathi') || edu.Primary_Language.toLowerCase().includes('marathi') || edu.Additional_Languages.toLowerCase().includes('marathi') || edu.Teaching_Specialization.toLowerCase().includes('maharashtra') || edu.Subdomain.toLowerCase().includes('maharashtra'))) {
        curriculumLevelMatch = 95;
      } else {
        curriculumLevelMatch = 30; // Different board/curriculum
      }
    }

    // Level matching (e.g., Higher Secondary vs University vs Medical)
    if (ctx.academicLevel) {
      const normLevel = ctx.academicLevel.toLowerCase();
      const eduLevel = edu.Teaching_Level.toLowerCase();
      if (
        (normLevel.includes('11') || normLevel.includes('12') || normLevel.includes('higher secondary')) &&
        (eduLevel.includes('higher secondary') || eduLevel.includes('11') || eduLevel.includes('12'))
      ) {
        curriculumLevelMatch = Math.min(100, curriculumLevelMatch + 15);
      } else if (
        (normLevel.includes('undergraduate') || normLevel.includes('college') || normLevel.includes('b.tech')) &&
        (eduLevel.includes('undergraduate') || eduLevel.includes('college'))
      ) {
        curriculumLevelMatch = Math.min(100, curriculumLevelMatch + 15);
      }
    }

    // 5. Language Compatibility (0 - 100)
    let languageCompatibility = 65; // Default English/common
    if (ctx.preferredLanguage) {
      const normPrefLang = EducatorRegistry.normalizeToken(ctx.preferredLanguage);
      const eduPrimary = EducatorRegistry.normalizeToken(edu.Primary_Language);
      const eduAdditional = EducatorRegistry.parseTokens(edu.Additional_Languages);

      if (eduPrimary === normPrefLang) {
        languageCompatibility = 100;
      } else if (eduAdditional.includes(normPrefLang) || (normPrefLang === 'hindi' && eduPrimary.includes('hinglish'))) {
        languageCompatibility = 90;
      } else if (normPrefLang === 'marathi' && (eduAdditional.includes('marathi') || eduPrimary === 'marathi')) {
        languageCompatibility = 95;
      } else if (normPrefLang === 'english' && (eduPrimary === 'english' || eduAdditional.includes('english'))) {
        languageCompatibility = 90;
      } else {
        languageCompatibility = 30; // Language barrier
      }
    }

    // 6. Credibility and Verification (0 - 100)
    let credibilityAndVerification = 80;
    if (edu.Verification_Status === 'VERIFIED') credibilityAndVerification += 15;
    if (edu.Quality_Assessment.includes('Tier 1 Exemplary')) credibilityAndVerification += 5;

    // 7. Complete Course / Structured Playlist Availability Bonus
    let completeCourseBonus = 0;
    if (ctx.desiredResourceType === 'full_course' || (ctx.courseTitle.toLowerCase().includes('course') || ctx.courseTitle.toLowerCase().includes('complete'))) {
      if (edu.Complete_Course_Available === 'Yes') {
        completeCourseBonus = 5;
      }
    }

    return {
      subjectRelevance,
      topicSpecialization,
      examinationAlignment,
      curriculumLevelMatch,
      languageCompatibility,
      credibilityAndVerification: Math.min(100, credibilityAndVerification),
      completeCourseBonus,
      totalScore: 0,
    };
  }

  /**
   * Generates explainable matching rationale for UI and debugging.
   */
  private generateMatchingReasons(
    edu: MasterEducatorRecord,
    ctx: EducatorMatchContext,
    scores: EducatorMatchScoreBreakdown
  ): string[] {
    const reasons: string[] = [];

    if (scores.examinationAlignment >= 85 && ctx.examination) {
      reasons.push(`Specialized curriculum aligned strictly with ${ctx.examination}.`);
    }

    if (scores.curriculumLevelMatch >= 85 && ctx.curriculum) {
      reasons.push(`Direct coverage of ${ctx.curriculum} syllabus.`);
    }

    if (scores.topicSpecialization >= 80) {
      reasons.push(`Demonstrated pedagogical authority in ${edu.Subdomain}.`);
    }

    if (edu.Complete_Course_Available === 'Yes') {
      reasons.push('Offers complete course / full syllabus sequence.');
    } else if (edu.Playlist_Available === 'Yes') {
      reasons.push('Maintains structured chapter playlists.');
    }

    if (scores.languageCompatibility >= 90 && ctx.preferredLanguage) {
      reasons.push(`Provides instruction in ${ctx.preferredLanguage} / ${edu.Primary_Language}.`);
    }

    if (edu.Verification_Status === 'VERIFIED') {
      reasons.push(`Verified Directory Educator (${edu.Educational_Credibility.slice(0, 80)}...).`);
    }

    return reasons;
  }
}

// Global Singleton Matcher instance
export const educatorMatcher = new EducatorMatcher();

const RAW_GENERIC_FORMAT_WORDS = [
  'complete', 'course', 'courses', 'playlist', 'playlists', 'tutorial', 'tutorials',
  'lecture', 'lectures', 'introduction', 'intro', 'basics', 'basic', 'learn', 'full',
  'series', 'class', 'classes', 'chapter', 'chapters', 'part', 'parts', 'guide',
  'masterclass', 'crash', 'bootcamp', 'one', 'shot', 'oneshot', 'solved', 'questions',
  'problems', 'sheet', 'video', 'videos', 'free', 'best', 'online', 'overview',
  'revision', 'summary', 'all', '101', 'training', 'mastery', 'programming', 'program',
  'code', 'coding', 'development', 'developer'
];

const GENERIC_FORMAT_WORDS = new Set(
  RAW_GENERIC_FORMAT_WORDS.flatMap((w) => [w.toLowerCase(), stemWord(w.toLowerCase())])
);

/**
 * Searches the curated master directory for verified flagship learning resources
 * (RES-001 through RES-012) matching the query or target educator.
 */
export function findVerifiedDirectoryResources(
  query: string,
  options?: {
    limit?: number;
    difficulty?: string;
    examContext?: string;
    educatorId?: string;
    targetEducator?: MasterEducatorRecord;
    excludeUrls?: Set<string>;
    excludeVideoIds?: Set<string>;
  }
): EngineResource[] {
  const normQ = query.toLowerCase().trim();
  const queryTokens = tokenize(normQ);
  const matched: EngineResource[] = [];
  const verifiedList = educatorRegistry.getVerifiedLearningResources();

  // Extract non-descriptor content tokens from query
  const contentQueryTokens = new Set(
    Array.from(queryTokens).filter((t) => !GENERIC_FORMAT_WORDS.has(t) && t.length > 2)
  );

  for (const vr of verifiedList) {
    const normTitle = vr.Resource_Title.toLowerCase();
    const normSub = vr.Subject.toLowerCase();
    const titleTokens = tokenize(normTitle);
    const subTokens = tokenize(normSub);

    // Filter non-descriptor content tokens from candidate
    const contentTitleTokens = new Set(
      Array.from(titleTokens).filter((t) => !GENERIC_FORMAT_WORDS.has(t) && t.length > 2)
    );
    const contentSubTokens = new Set(
      Array.from(subTokens).filter((t) => !GENERIC_FORMAT_WORDS.has(t) && t.length > 2)
    );

    let contentTitleOverlap = 0;
    for (const t of contentQueryTokens) {
      if (contentTitleTokens.has(t)) contentTitleOverlap++;
    }

    const ambiguousStems = new Set(
      ['network', 'control', 'data', 'system', 'method', 'model', 'structur', 'structure', 'flow', 'manag', 'manage', 'program', 'programming', 'code', 'coding', 'develop', 'development']
        .flatMap((w) => [w.toLowerCase(), stemWord(w.toLowerCase())])
    );
    const unambiguousSubOverlap = Array.from(contentQueryTokens).filter((t) => contentSubTokens.has(t) && !ambiguousStems.has(t)).length;
    let contentSubOverlap = 0;
    for (const t of contentQueryTokens) {
      if (contentSubTokens.has(t)) contentSubOverlap++;
    }

    const topicMatch = vr.Covered_Topics.toLowerCase()
      .split(',')
      .some((t) => {
        const cleanT = t.trim().toLowerCase();
        if (cleanT.length < 3) return false;
        const cTokens = tokenize(cleanT);
        const unamMatch = Array.from(cTokens).some((ct) => contentQueryTokens.has(ct) && !ambiguousStems.has(ct));
        return normQ.includes(cleanT) || unamMatch;
      });

    const isTargetEducator =
      Boolean(options?.educatorId && options.educatorId === vr.Educator_ID) ||
      Boolean(options?.targetEducator && options.targetEducator.Educator_ID === vr.Educator_ID);

    // Topical relevance requires actual content overlap if query has specific content keywords
    const titleMatch = contentQueryTokens.size === 0
      ? (normTitle.includes(normQ) || normQ.includes(normTitle))
      : (contentTitleOverlap >= 1 || (normTitle.includes(normQ) && contentTitleOverlap >= 1));

    const subjectMatch = contentQueryTokens.size === 0
      ? (normQ.includes(normSub) || normSub.includes(normQ))
      : (unambiguousSubOverlap >= 1 || (contentSubOverlap >= 1 && !ambiguousStems.has(Array.from(contentQueryTokens)[0])));

    // Strict topical alignment: a resource must match the query's actual topic/subject
    const isTopicallyRelevant = titleMatch || topicMatch || subjectMatch;
    const isTargetEducatorRelevant = isTargetEducator && (contentTitleOverlap >= 1 || unambiguousSubOverlap >= 1 || topicMatch);

    if (isTopicallyRelevant || isTargetEducatorRelevant) {
      const isPlaylist = vr.Resource_Type.toLowerCase().includes('playlist');
      const isFullCourse =
        vr.Resource_Type.toLowerCase().includes('course') ||
        vr.Complete_Course_Status.toLowerCase().includes('complete');

      const vid = vr.YouTube_Video_ID_or_Playlist_ID;
      let targetUrl = vr.Resource_URL;
      if (vid) {
        if (vid.startsWith('PL') || isPlaylist) {
          targetUrl = `https://www.youtube.com/playlist?list=${vid}`;
        } else if (/^[a-zA-Z0-9_-]{11}$/.test(vid)) {
          targetUrl = `https://www.youtube.com/watch?v=${vid}`;
        }
      }
      const rawUrl = targetUrl;
      const canonical = canonicalizeUrl(rawUrl);

      // Filter out excluded video IDs or URLs
      if (options?.excludeUrls && (options.excludeUrls.has(rawUrl) || options.excludeUrls.has(canonical))) {
        continue;
      }
      if (options?.excludeVideoIds && vid && options.excludeVideoIds.has(vid)) {
        continue;
      }

      const edu = educatorRegistry.getById(vr.Educator_ID);

      const res: EngineResource = {
        id: `dir_${vr.Resource_ID}`,
        title: vr.Resource_Title,
        description: `${vr.Syllabus_Coverage}. Key Topics: ${vr.Covered_Topics}`,
        type: isPlaylist ? 'youtube_playlist' : isFullCourse ? 'full_course' : 'video_lecture',
        canonicalUrl: canonical,
        sourceUrl: canonical,
        sourceName: edu ? `${edu.YouTube_Channel_Name} (Curated Directory)` : 'Curated Directory',
        provider: 'youtube',
        externalId: vr.YouTube_Video_ID_or_Playlist_ID,
        authorOrChannel: edu ? edu.YouTube_Channel_Name : 'Curated Educator',
        durationMinutes: isPlaylist ? 180 : 90,
        difficulty: (options?.difficulty as ResourceDifficulty) || 'intermediate',
        language: vr.Language || 'English',
        score: {
          overall: 96,
          relevance: 95,
          educationalValue: 95,
          structureCompleteness: isPlaylist || isFullCourse ? 98 : 90,
          freshness: 90,
          explanation: `Flagship complete resource from curated directory educator: ${edu?.Educator_Name || 'Verified Educator'}`,
        },
        tags: Array.from(new Set(['curated_directory', 'verified_resource', vr.Subject.toLowerCase(), edu?.YouTube_Channel_Name.toLowerCase() || ''])),
        examCategory: options?.examContext,
        educatorId: vr.Educator_ID,
        educatorName: edu?.Educator_Name,
        channelId: vr.YouTube_Channel_ID,
        discoverySource: 'curated_directory',
        verificationStatus: 'VERIFIED',
        isCompleteCourse: isFullCourse,
        isStructuredPlaylist: isPlaylist,
        selectionExplanation: `Flagship ${isFullCourse ? 'complete course' : isPlaylist ? 'structured playlist' : 'resource'} from curated educator directory (${edu?.Educator_Name})`,
        metadata: {
          videoId: (isPlaylist || vid?.startsWith('PL')) ? undefined : vid,
          playlistId: (isPlaylist || vid?.startsWith('PL')) ? vid : undefined,
          channelId: vr.YouTube_Channel_ID,
          educatorId: vr.Educator_ID,
          educatorName: edu?.Educator_Name,
          discoverySource: 'curated_directory',
          verificationStatus: 'VERIFIED',
          isPlaylist,
          isFullCourse,
          isComprehensive: true,
          publishedAt: vr.Publication_Date,
          identityConfidence: 'verified_channel_id',
        },
        discoveredAt: new Date().toISOString(),
        url: canonical,
        author: edu?.YouTube_Channel_Name,
        duration: isPlaylist ? '180 min' : '90 min',
        publishedAt: vr.Publication_Date,
      };

      matched.push(res);
    }
  }

  return matched;
}

