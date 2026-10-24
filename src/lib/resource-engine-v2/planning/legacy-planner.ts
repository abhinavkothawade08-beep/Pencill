import { ParsedQuery, SearchPlan, SearchPlanItem, SearchOptions, EngineResourceType } from '../types/legacy-contracts';
import { DEFAULT_ENGINE_CONFIG } from '../config';
import { EducatorMatcher, educatorMatcher } from '../educators/educator-matcher';
import { inferLearningIntent } from '../evaluation/duration-manager';

export class SearchPlanner {
  createPlan(parsed: ParsedQuery, options?: SearchOptions): SearchPlan {
    const queries: SearchPlanItem[] = [];
    const hasExamInTopic = Boolean(parsed.examContext && parsed.topic.toLowerCase().includes(parsed.examContext.toLowerCase()));
    const examPrefix = parsed.examContext && !hasExamInTopic ? `${parsed.examContext} ` : '';

    const hasSubjectInTopic = Boolean(parsed.subject && parsed.topic.toLowerCase().includes(parsed.subject.toLowerCase()));
    const subjectPrefix = parsed.subject && !hasSubjectInTopic ? `${parsed.subject} ` : '';

    const allowYouTube =
      !options?.providers ||
      options.providers.includes('youtube');

    const allowGoogle =
      !options?.providers ||
      options.providers.includes('google') ||
      options.providers.includes('web') ||
      options.providers.includes('practice');

    const allowNotes =
      !options?.providers ||
      options.providers.includes('notes' as any) ||
      options.providers.includes('academic_notes' as any) ||
      options.providers.includes('web');

    const allowQuiz = !options?.providers || options.providers.includes('quiz');

    // 1. YouTube Discovery via YouTube Data API v3 & Master Educator Directory
    if (allowYouTube) {
      const ytLimit = DEFAULT_ENGINE_CONFIG.youTubeResultsLimit;
      const lowerTopic = parsed.topic.toLowerCase();
      const isBroad =
        lowerTopic.includes('programming') ||
        lowerTopic.includes('python') ||
        lowerTopic.includes('javascript') ||
        lowerTopic.includes('typescript') ||
        lowerTopic.includes('machine learning') ||
        lowerTopic.includes('data structure') ||
        lowerTopic.includes('algorithm') ||
        lowerTopic.includes('deep learning') ||
        lowerTopic.includes('calculus') ||
        lowerTopic.includes('web development') ||
        lowerTopic.includes('full stack') ||
        lowerTopic.includes('large language model') ||
        lowerTopic.includes('llm') ||
        lowerTopic.includes('database');

      const isExamOrAcademic =
        isBroad ||
        Boolean(parsed.examContext) ||
        lowerTopic.includes('jee') ||
        lowerTopic.includes('neet') ||
        lowerTopic.includes('cbse') ||
        lowerTopic.includes('chemistry') ||
        lowerTopic.includes('physics') ||
        lowerTopic.includes('biology') ||
        lowerTopic.includes('haloalkane') ||
        lowerTopic.includes('haloarene') ||
        lowerTopic.includes('organic');

      // Stage 2: Match top educators from Master Educator Directory
      const eduContext = EducatorMatcher.deriveContext({
        query: parsed.rawQuery || parsed.topic,
        courseTitle: parsed.topic,
        level: parsed.targetLevel,
        targetExam: parsed.examContext,
        language: parsed.language,
        domain: parsed.domain || parsed.subject,
      });

      const matchedEducators = educatorMatcher.matchEducators(eduContext, { limit: 3 });

      // Plan queries targeted to matched educators
      for (const mResult of matchedEducators) {
        const edu = mResult.educator;
        const channelId = edu.YouTube_Channel_ID && edu.YouTube_Channel_ID.trim().length > 0 ? edu.YouTube_Channel_ID.trim() : undefined;
        const channelPrefix = channelId ? '' : `"${edu.YouTube_Channel_Name}" `;

        if (edu.Complete_Course_Available === 'Yes' || isExamOrAcademic) {
          // Complete playlist from verified educator
          queries.push({
            provider: 'youtube',
            query: `${channelPrefix}${parsed.topic} playlist`.trim(),
            targetTypes: ['youtube_playlist'],
            maxResults: 3,
            filters: {
              channelId,
              targetEducator: edu,
              discoverySource: 'curated_directory',
            },
          });

          // Comprehensive one-shot lecture from verified educator
          queries.push({
            provider: 'youtube',
            query: `${channelPrefix}${parsed.topic} one shot`.trim(),
            targetTypes: ['full_course', 'video_lecture'],
            maxResults: 3,
            filters: {
              channelId,
              targetEducator: edu,
              discoverySource: 'curated_directory',
            },
          });
        }

        queries.push({
          provider: 'youtube',
          query: `${channelPrefix}${examPrefix}${parsed.topic}`.trim(),
          targetTypes: ['video_lecture', 'youtube_playlist'],
          maxResults: 3,
          filters: {
            channelId,
            targetEducator: edu,
            discoverySource: 'curated_directory',
          },
        });
      }

      if (isExamOrAcademic) {
        // High-priority full-course / one-shot search for comprehensive primary coverage
        queries.push({
          provider: 'youtube',
          query: `${examPrefix}${parsed.topic} one shot lecture`.trim(),
          targetTypes: ['full_course', 'video_lecture'],
          maxResults: 4,
          filters: { discoverySource: 'fallback_search' },
        });
        // Targeted complete course / chapter playlist search
        queries.push({
          provider: 'youtube',
          query: `${examPrefix}${parsed.topic} complete playlist`.trim(),
          targetTypes: ['youtube_playlist'],
          maxResults: 4,
          filters: { discoverySource: 'fallback_search' },
        });
      }

      // Primary video lecture & playlist search
      queries.push({
        provider: 'youtube',
        query: `${examPrefix}${subjectPrefix}${parsed.topic} complete lecture`.trim(),
        targetTypes: ['video_lecture', 'youtube_playlist'],
        maxResults: ytLimit,
        filters: { discoverySource: 'fallback_search' },
      });

      // Targeted explanation, revision or problem-solving video search
      const ytSecondaryModifier =
        parsed.intent === 'problem_solving' || parsed.intent === 'exam_prep'
          ? 'problem solving questions'
          : parsed.intent === 'revision'
          ? 'one shot revision'
          : 'concepts explanation';

      queries.push({
        provider: 'youtube',
        query: `${examPrefix}${parsed.topic} ${ytSecondaryModifier}`.trim(),
        targetTypes: ['video_lecture'],
        maxResults: Math.max(2, Math.floor(ytLimit / 2)),
        filters: { discoverySource: 'fallback_search' },
      });
    }

    // 2. Google Web Discovery via Google Programmable Search
    if (allowGoogle) {
      const webLimit = DEFAULT_ENGINE_CONFIG.googleWebResultsLimit;

      // Clean, targeted query for study notes & textbooks
      queries.push({
        provider: 'google',
        query: `${parsed.topic} lecture notes`.trim(),
        targetTypes: ['study_notes', 'pdf_lecture_notes', 'lecture_handout', 'reading_material', 'textbook'],
        maxResults: webLimit,
      });

      // Targeted query for official documentation / educational articles
      queries.push({
        provider: 'google',
        query: `${subjectPrefix}${parsed.topic} documentation guide summary`.trim(),
        targetTypes: ['official_documentation', 'article', 'reference_guide', 'educational_web_page'],
        maxResults: Math.max(2, Math.floor(webLimit / 2)),
      });

      // High-yield practice, PYQ, or problem-solving web search
      const webPracticeModifier = parsed.examContext
        ? 'previous year questions PYQ practice'
        : 'practice questions problems exercises';

      queries.push({
        provider: 'google',
        query: `${examPrefix}${parsed.topic} ${webPracticeModifier}`.trim(),
        targetTypes: ['practice_questions', 'pyq', 'question_bank'],
        maxResults: Math.max(3, Math.floor(webLimit / 2)),
      });
    }

    // 3. Open Academic Notes Discovery (arXiv, Wikimedia, OpenAlex, University Repositories)
    if (allowNotes) {
      queries.push({
        provider: 'notes',
        query: `${parsed.topic} lecture notes`.trim(),
        targetTypes: ['study_notes', 'pdf_lecture_notes', 'lecture_handout', 'reading_material', 'reference_guide', 'research_paper'],
        maxResults: 6,
      });
    }

    // 4. Formative Assessment / Quiz (handled by QuizProvider)
    if (allowQuiz) {
      queries.push({
        provider: 'quiz',
        query: `${examPrefix}${parsed.topic}`.trim(),
        targetTypes: ['ai_quiz'],
        maxResults: 1,
      });
    }

    return {
      originalQuery: parsed.rawQuery,
      parsedQuery: parsed,
      queries,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Plans granular, lesson-specific search queries for discovering notes, lecture handouts, and documentation
   */
  createLessonNotesPlan(
    lessonTitle: string,
    topic: string,
    domain?: string,
    examContext?: string
  ): SearchPlanItem[] {
    const cleanLesson = lessonTitle
      .replace(/^\d+(\.\d+)?\s*[-:]?\s*/, '') // Remove prefixes like "1.1 " or "2.4 "
      .replace(/\(.*?\)/g, '') // Remove parenthetical notes
      .trim();

    const items: SearchPlanItem[] = [];

    // Query 1: Lesson-specific study notes & lecture notes
    items.push({
      provider: 'notes',
      query: `${cleanLesson} lecture notes`.trim(),
      targetTypes: ['study_notes', 'pdf_lecture_notes', 'lecture_handout'],
      maxResults: 4,
    });

    // Query 2: Direct concept reference monograph or research paper
    items.push({
      provider: 'notes',
      query: `${cleanLesson} ${topic}`.trim(),
      targetTypes: ['reading_material', 'reference_guide', 'research_paper', 'official_documentation'],
      maxResults: 3,
    });

    const isSchoolOrExam =
      (domain && /school|cbse|ncert/i.test(domain)) ||
      (examContext && /cbse|ncert|jee|neet/i.test(examContext));

    if (isSchoolOrExam) {
      items.push({
        provider: 'notes',
        query: `${cleanLesson} NCERT official textbook notes`.trim(),
        targetTypes: ['textbook', 'study_notes', 'reference_guide'],
        maxResults: 3,
      });
    }

    // Query 3: Google web search if Google provider is enabled
    items.push({
      provider: 'google',
      query: `${cleanLesson} ${topic} lecture notes pdf`.trim(),
      targetTypes: ['pdf_lecture_notes', 'study_notes', 'official_documentation'],
      maxResults: 4,
    });

    return items;
  }

  /**
   * Module-specific search planning: derives targeted queries scoped to a course module
   */
  /**
   * Module-specific search planning: derives targeted queries scoped to a course module,
   * its learning objectives, and core key concepts.
   */
  createModulePlan(
    moduleTitle: string,
    moduleObjective: string,
    courseTopic: string,
    options?: {
      examContext?: string;
      domain?: string;
      difficulty?: string;
      keyConcepts?: string[];
    }
  ): SearchPlanItem[] {
    const cleanMod = moduleTitle
      .replace(/^(module\s*\d+[:.-]?\s*)/i, '')
      .replace(/^\d+(\.\d+)?\s*[-:]?\s*/, '')
      .replace(/\(.*?\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const items: SearchPlanItem[] = [];
    const cleanTopic = courseTopic.trim();
    const hasExam = options?.examContext && (
      cleanMod.toLowerCase().includes(options.examContext.toLowerCase()) ||
      cleanTopic.toLowerCase().includes(options.examContext.toLowerCase())
    );
    const examPrefix = options?.examContext && !hasExam ? `${options.examContext} ` : '';

    // Smart query 1: Module topic + Core concept video
    const modWords = cleanMod.split(' ').filter((w) => w.length > 2);
    const focalConcept = modWords.slice(0, 4).join(' ');
    const needsTopicContext = !cleanMod.toLowerCase().includes(cleanTopic.toLowerCase());
    const baseContext = needsTopicContext ? ` ${cleanTopic.split(' ').slice(0, 2).join(' ')}` : '';

    items.push({
      provider: 'youtube',
      query: `${examPrefix}${focalConcept}${baseContext} lecture`.trim(),
      targetTypes: ['video_lecture'],
      maxResults: 3,
    });

    // Smart query 2: Key concept query if provided
    if (options?.keyConcepts && options.keyConcepts.length > 0) {
      const topConcept = options.keyConcepts[0];
      items.push({
        provider: 'youtube',
        query: `${examPrefix}${topConcept} ${cleanTopic} tutorial`.trim(),
        targetTypes: ['video_lecture'],
        maxResults: 3,
      });
    }

    // 2. Module-level study notes & textbook chapter
    items.push({
      provider: 'notes',
      query: `${cleanMod} ${cleanTopic} notes`.trim(),
      targetTypes: ['study_notes', 'pdf_lecture_notes', 'reading_material', 'reference_guide'],
      maxResults: 4,
    });

    // 3. Module-level practice problems & PYQs
    items.push({
      provider: 'google',
      query: `${examPrefix}${cleanMod} practice problems questions`.trim(),
      targetTypes: ['practice_questions', 'pyq'],
      maxResults: 3,
    });

    return items;
  }

  /**
   * Plans targeted video queries specifically for module lessons using lesson titles,
   * key concepts, module objectives, and difficulty calibration.
   */
  createModuleVideoPlan(params: {
    moduleTitle: string;
    moduleObjective?: string;
    moduleDescription?: string;
    courseTopic: string;
    domain?: string;
    difficulty?: string;
    subtopics?: string[];
    keySubtopics?: string[];
    lessons?: Array<{ title: string; type: string; keyConcepts?: string[] }>;
  }): string[] {
    const { moduleTitle, moduleObjective, moduleDescription, courseTopic, domain, difficulty, subtopics, keySubtopics, lessons } = params;
    const cleanMod = moduleTitle
      .replace(/^(module\s*\d+[:.-]?\s*)/i, '')
      .replace(/^\d+(\.\d+)?\s*[-:]?\s*/, '')
      .replace(/\(.*?\)/g, '')
      .replace(/[&|:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const cleanTopic = courseTopic
      .replace(/[&|:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const isBeginner = (difficulty || '').toLowerCase().includes('beginner');
    const isAdvanced = (difficulty || '').toLowerCase().includes('advanced') || (difficulty || '').toLowerCase().includes('undergraduate');
    const levelModifier = isBeginner ? 'tutorial fundamentals' : isAdvanced ? 'deep dive lecture' : 'lecture';

    const queries: string[] = [];

    // Infer learning objective intent to selectively tune practical queries
    const learningIntent = inferLearningIntent({
      topic: cleanTopic,
      moduleTitle: cleanMod,
      moduleObjective,
      moduleDescription,
      difficulty,
      subtopics: [...(subtopics || []), ...(keySubtopics || [])],
      lessons,
    });

    // 1. Primary module focal concept query
    const modWords = cleanMod.split(' ').filter((w) => w.length > 2);
    const focalMod = modWords.slice(0, 4).join(' ');
    const needsTopicContext = !cleanMod.toLowerCase().includes(cleanTopic.toLowerCase());
    const topicAnchor = needsTopicContext ? ` ${cleanTopic.split(' ').slice(0, 2).join(' ')}` : '';
    queries.push(`${focalMod}${topicAnchor} ${levelModifier}`.trim());

    // 1b. Selective practical and hands-on query generation based on objective intent
    const isMlOrAi = /\b(machine\s+learning|deep\s+learning|neural|model|lora|peft|transformer|llm|diffusion|nlp|cv|data\s+science)\b/i.test(`${cleanTopic} ${cleanMod}`);

    if (learningIntent === 'practical_project') {
      queries.push(`${focalMod} complete tutorial with practical examples`.trim());
      queries.push(`Build ${focalMod} project step by step`.trim());
      queries.push(`${focalMod} project tutorial with complete implementation`.trim());
      queries.push(`${focalMod} real-world project tutorial`.trim());
    } else if (learningIntent === 'hands_on_tutorial') {
      queries.push(`${focalMod} hands-on tutorial ${isBeginner ? 'for beginners' : ''}`.trim());
      queries.push(`${focalMod} complete tutorial with practical examples`.trim());
      if (isMlOrAi) {
        queries.push(`Train and evaluate ${focalMod} practical example`.trim());
      }
    } else if (learningIntent === 'concept_quick') {
      queries.push(`${focalMod} practical tutorial coding examples`.trim());
    } else if (learningIntent === 'comprehensive_course') {
      queries.push(`${focalMod} full course with projects`.trim());
      queries.push(`${focalMod} comprehensive tutorial with exercises`.trim());
    }

    // 2. Specific lesson queries with key concepts
    const videoLessons = (lessons || []).filter((l) => l.type === 'video');
    for (const les of videoLessons) {
      const cleanLesson = les.title
        .replace(/^(lesson\s*\d+[:.-]?\s*)/i, '')
        .replace(/^\d+(\.\d+)?\s*[-:]?\s*/, '')
        .replace(/:\s*Lecture.*$/i, '')
        .replace(/\(.*?\)/g, '')
        .replace(/[&|:]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const lessonWords = cleanLesson.split(' ').filter((w) => w.length > 2).slice(0, 4).join(' ');
      if (lessonWords && lessonWords.length >= 4) {
        queries.push(`${lessonWords} ${cleanTopic.split(' ').slice(0, 2).join(' ')}`.trim());
      }

      // 3. Key concept query if lesson contains explicit key concepts
      if (les.keyConcepts && les.keyConcepts.length > 0) {
        const primaryConcept = les.keyConcepts[0]
          .replace(/[&|:]/g, ' ')
          .trim();
        if (primaryConcept.length >= 3) {
          queries.push(`${primaryConcept} ${focalMod.split(' ').slice(0, 2).join(' ')} tutorial`.trim());
        }
        if (les.keyConcepts.length > 1) {
          const secondaryConcept = les.keyConcepts[1].trim();
          if (secondaryConcept.length >= 3) {
            queries.push(`${secondaryConcept} ${cleanTopic.split(' ').slice(0, 2).join(' ')}`.trim());
          }
        }
      }
    }

    // 4. Subtopics-grounded queries
    const activeSubtopics = [
      ...(Array.isArray(subtopics) ? subtopics : []),
      ...(Array.isArray(keySubtopics) ? keySubtopics : []),
    ].filter((s): s is string => typeof s === 'string' && s.trim().length > 2);

    for (const sub of activeSubtopics.slice(0, 3)) {
      const cleanSub = sub
        .replace(/^(subtopic\s*\d+[:.-]?\s*)/i, '')
        .replace(/[&|:;]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (cleanSub.length >= 3) {
        queries.push(`${cleanSub} ${focalMod.split(' ').slice(0, 2).join(' ')} ${levelModifier}`.trim());
      }
    }

    // 5. Objective-grounded concept query if objective highlights a key method/algorithm
    if (moduleObjective && moduleObjective.trim().length > 10) {
      const objectiveText = moduleObjective
        .replace(/^(achieve|master|understand|learn|explore)\s+(conceptual\s+)?(mastery|capability\s+in\s+)?/i, '')
        .replace(/\(.*?\)/g, '')
        .replace(/[.,:;&]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const objWords = objectiveText.split(' ').filter((w) => w.length > 3 && !['within', 'course', 'module', 'learning'].includes(w.toLowerCase()));
      if (objWords.length >= 2) {
        queries.push(`${objWords.slice(0, 3).join(' ')} ${focalMod.split(' ').slice(0, 2).join(' ')}`.trim());
      }
    }

    // 6. Description-grounded query if provided
    if (moduleDescription && moduleDescription.trim().length > 15) {
      const descWords = moduleDescription
        .replace(/[.,:;()&]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 4 && !['course', 'module', 'learning', 'concepts', 'covers', 'student', 'understand'].includes(w.toLowerCase()));
      if (descWords.length >= 3) {
        queries.push(`${descWords.slice(0, 3).join(' ')} ${topicAnchor.trim()} tutorial`.trim());
      }
    }

    // Filter out purely generic queries matching only courseTopic + level
    const genericCourseQuery = `${cleanTopic} ${levelModifier}`.toLowerCase();
    const genericCourseLecture = `${cleanTopic} lecture`.toLowerCase();

    // Return unique, trimmed queries (up to 8 high-yield queries)
    const unique = Array.from(new Set(queries.map((q) => q.replace(/\s+/g, ' ').trim()).filter((q) => {
      const lq = q.toLowerCase();
      return lq.length > 0 && lq !== genericCourseQuery && lq !== genericCourseLecture;
    })));

    return unique.slice(0, 8);
  }

  /**
   * Plans practice-specific queries for problem sets, PYQs, and question banks
   */
  createPracticePlan(
    topic: string,
    options?: { examContext?: string; difficulty?: string }
  ): SearchPlanItem[] {
    const cleanTopic = topic.trim();
    const hasExam = options?.examContext && cleanTopic.toLowerCase().includes(options.examContext.toLowerCase());
    const examPrefix = options?.examContext && !hasExam ? `${options.examContext} ` : '';

    return [
      {
        provider: 'google',
        query: `${examPrefix}${cleanTopic} previous year questions pyq solved`.trim(),
        targetTypes: ['pyq', 'practice_questions'],
        maxResults: 5,
      },
      {
        provider: 'google',
        query: `${examPrefix}${cleanTopic} practice problem set exercises with solutions`.trim(),
        targetTypes: ['practice_questions', 'question_bank'],
        maxResults: 5,
      },
      {
        provider: 'notes',
        query: `${cleanTopic} practice problems exercises`.trim(),
        targetTypes: ['practice_questions'],
        maxResults: 4,
      },
      {
        provider: 'quiz',
        query: `${examPrefix}${cleanTopic}`.trim(),
        targetTypes: ['ai_quiz'],
        maxResults: 1,
      },
    ];
  }
}

export { SearchPlanner as LegacySearchPlanner };

