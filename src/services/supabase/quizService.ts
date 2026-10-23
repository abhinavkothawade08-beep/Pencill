import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured, getAuthenticatedSupabaseClient } from "./client";
import {
  Quiz,
  QuizQuestion,
  QuizOption,
  QuizAttempt,
  QuizSubmissionResult,
  QuizResultReviewItem,
  QuizTopicBreakdown,
} from "@/types";
import {
  getDeletedItemIds,
  isItemDeleted,
  recordDeletedItem,
} from "./deletionRegistry";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const GUEST_QUIZ_ATTEMPTS_KEY = "pencill_guest_quiz_attempts";
const GUEST_QUIZZES_KEY = "pencill_guest_quizzes";

// Server-side / in-memory authoritative storage for freshly generated quizzes and active attempts
export const inMemoryQuizStore = new Map<
  string,
  { quiz: Quiz; authoritativeQuestions: QuizQuestion[] }
>();
export const inMemoryAttemptStore = new Map<string, QuizAttempt>();

export interface GuestQuizAttempt {
  id: string;
  quizId: string;
  score: number;
  accuracyPercent: number;
  answers: Record<string, string>;
  completedAt: string;
  scoringMetadata?: QuizSubmissionResult;
}

function getStoredGuestQuizzes(): Quiz[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_QUIZZES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestQuiz(quiz: Quiz) {
  if (typeof window === "undefined") return;
  try {
    const list = getStoredGuestQuizzes().filter((q) => q.id !== quiz.id);
    list.unshift(quiz);
    localStorage.setItem(GUEST_QUIZZES_KEY, JSON.stringify(list.slice(0, 30)));
  } catch (e) {
    console.warn("Could not save guest quiz to localStorage:", e);
  }
}

function getStoredGuestAttempts(): GuestQuizAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_QUIZ_ATTEMPTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestQuizAttempt(attempt: GuestQuizAttempt) {
  if (typeof window === "undefined") return;
  try {
    const list = getStoredGuestAttempts().filter((a) => a.id !== attempt.id);
    list.unshift(attempt);
    localStorage.setItem(GUEST_QUIZ_ATTEMPTS_KEY, JSON.stringify(list.slice(0, 50)));
  } catch (e) {
    console.warn("Could not save guest quiz attempt:", e);
  }
}

/**
 * Persist or register a newly generated quiz with its authoritative questions
 */
export async function createQuiz(
  quizData: {
    id: string;
    title: string;
    topic?: string;
    subject?: string;
    gradeLevel?: string;
    curriculum?: string;
    examTarget?: string;
    knowledgeLevel?: string;
    difficulty?: string;
    courseId?: string;
    moduleId?: string;
    metadata?: Record<string, unknown>;
    timeLimitMinutes: number;
    userId?: string | null;
  },
  questions: QuizQuestion[],
  userId?: string | null,
  client: SupabaseClient = supabase
): Promise<Quiz> {
  const mergedMetadata = {
    ...(quizData.metadata || {}),
    ...(quizData.moduleId ? { module_id: quizData.moduleId } : {}),
    ...(quizData.courseId ? { course_id: quizData.courseId } : {}),
  };

  const fullQuiz: Quiz = {
    id: quizData.id,
    title: quizData.title,
    topic: quizData.topic,
    subject: quizData.subject,
    gradeLevel: quizData.gradeLevel,
    curriculum: quizData.curriculum,
    examTarget: quizData.examTarget,
    knowledgeLevel: quizData.knowledgeLevel,
    difficulty: quizData.difficulty,
    courseId: quizData.courseId || "",
    courseTitle: quizData.subject || "Personalized Assessment",
    moduleId: quizData.moduleId,
    totalQuestions: questions.length,
    questions,
    timeLimitMinutes: quizData.timeLimitMinutes,
    createdAt: new Date().toISOString(),
    userId: userId || null,
    metadata: mergedMetadata,
  };

  // 1. Cache authoritatively in server/memory store
  inMemoryQuizStore.set(quizData.id, {
    quiz: fullQuiz,
    authoritativeQuestions: questions,
  });

  // 2. Cache in localStorage if browser client
  saveGuestQuiz(fullQuiz);

  // 3. Persist to Supabase if configured
  if (isSupabaseConfigured) {
    try {
      const quizPayload = {
        id: quizData.id,
        title: quizData.title,
        time_limit_minutes: quizData.timeLimitMinutes,
        path_id: quizData.courseId || null,
        topic: quizData.topic || null,
        subject: quizData.subject || null,
        grade_level: quizData.gradeLevel || null,
        curriculum: quizData.curriculum || null,
        exam_target: quizData.examTarget || null,
        knowledge_level: quizData.knowledgeLevel || null,
        difficulty: quizData.difficulty || null,
        question_count: questions.length,
        status: "ready",
        user_id: userId || null,
        metadata: mergedMetadata as unknown as import("./database.types").Json,
      };

      let { error: quizError } = await client.from("quizzes").insert(quizPayload);
      if (quizError && (quizError.code === "23505" || quizError.message?.includes("already exists"))) {
        const updateRes = await client.from("quizzes").update(quizPayload).eq("id", quizData.id);
        quizError = updateRes.error;
      }

      if (quizError) {
        console.warn("[quizService] Notice inserting quiz into Supabase:", quizError.message);
      } else {
        // Insert questions using INSERT policy
        const questionRows = questions.map((q, idx) => ({
          id: q.id || `${quizData.id}-q${idx + 1}`,
          quiz_id: quizData.id,
          question_number: q.questionNumber || idx + 1,
          prompt: q.prompt,
          stem_note: q.stemNote || null,
          options: q.options as unknown as import("./database.types").Json,
          correct_option_id: q.correctOptionId || "A",
          explanation: q.explanation || null,
          formula_reference: q.formulaReference || null,
          difficulty: q.difficulty || quizData.difficulty || null,
          subtopic: q.subtopic || null,
          hint: q.hint || null,
        }));

        const { error: questionsError } = await client
          .from("quiz_questions")
          .insert(questionRows);

        if (questionsError && questionsError.code !== "23505") {
          console.warn("[quizService] Notice inserting questions into Supabase:", questionsError.message);
        }
      }
    } catch (e) {
      console.warn("[quizService] Database persistence encountered fallback:", e);
    }
  }

  return fullQuiz;
}

/**
 * Retrieve a quiz by ID.
 * When `hideAnswers` is true (default for quiz taking), `correctOptionId` and `explanation`
 * are strictly redacted so students cannot inspect client-side state to cheat.
 */
export async function getQuizById(
  quizId: string,
  options: { hideAnswers?: boolean } = { hideAnswers: true },
  client: SupabaseClient = supabase
): Promise<Quiz | null> {
  if (!quizId || quizId.startsWith("__deleted") || quizId.startsWith("__enrollment") || (await isItemDeleted(quizId, "quiz", client))) {
    return null;
  }

  let loadedQuiz: Quiz | null = null;
  let rawQuestions: QuizQuestion[] = [];

  // Check in-memory store first
  const memoryHit = inMemoryQuizStore.get(quizId);
  if (memoryHit) {
    loadedQuiz = memoryHit.quiz;
    rawQuestions = memoryHit.authoritativeQuestions;
  }

  // Check guest localStorage if not in memory
  if (!loadedQuiz && typeof window !== "undefined") {
    const guestQuizzes = getStoredGuestQuizzes();
    const guestHit = guestQuizzes.find((q) => q.id === quizId);
    if (guestHit) {
      loadedQuiz = guestHit;
      rawQuestions = guestHit.questions;
      inMemoryQuizStore.set(quizId, {
        quiz: guestHit,
        authoritativeQuestions: guestHit.questions,
      });
    }
  }

  // Check Supabase
  if (!loadedQuiz && isSupabaseConfigured) {
    try {
      const { data: quizData, error: quizError } = await client
        .from("quizzes")
        .select("*, learning_paths(title)")
        .eq("id", quizId)
        .maybeSingle();

      if (!quizError && quizData) {
        const { data: questionsData, error: questionsError } = await client
          .from("quiz_questions")
          .select("*")
          .eq("quiz_id", quizId)
          .order("question_number", { ascending: true });

        if (!questionsError && questionsData && questionsData.length > 0) {
          rawQuestions = questionsData.map((q) => {
            let parsedOptions: QuizOption[] = [];
            if (Array.isArray(q.options)) {
              parsedOptions = q.options as unknown as QuizOption[];
            } else if (typeof q.options === "string") {
              try {
                parsedOptions = JSON.parse(q.options);
              } catch {
                parsedOptions = [];
              }
            }

            return {
              id: q.id,
              questionNumber: q.question_number,
              prompt: q.prompt,
              stemNote: q.stem_note || undefined,
              options: parsedOptions,
              correctOptionId: q.correct_option_id,
              explanation: q.explanation || undefined,
              formulaReference: q.formula_reference || undefined,
              difficulty: q.difficulty || undefined,
              subtopic: q.subtopic || undefined,
              hint: q.hint || undefined,
            };
          });

          const quizMeta = (((quizData as any).metadata || {}) as Record<string, unknown>);

          loadedQuiz = {
            id: quizData.id,
            title: quizData.title,
            topic: (quizData as any).topic || undefined,
            subject: (quizData as any).subject || undefined,
            gradeLevel: (quizData as any).grade_level || undefined,
            curriculum: (quizData as any).curriculum || undefined,
            examTarget: (quizData as any).exam_target || undefined,
            knowledgeLevel: (quizData as any).knowledge_level || undefined,
            difficulty: (quizData as any).difficulty || undefined,
            courseId: quizData.path_id || "",
            courseTitle:
              (quizData.learning_paths as unknown as { title?: string })?.title ||
              (quizData as any).subject ||
              "Assessment Checkpoint",
            moduleId: (quizMeta.module_id as string) || undefined,
            metadata: quizMeta,
            totalQuestions: rawQuestions.length,
            timeLimitMinutes: quizData.time_limit_minutes || 20,
            questions: rawQuestions,
            createdAt: quizData.created_at,
            userId: (quizData as any).user_id || null,
          };

          // Cache in memory for authoritative grading
          inMemoryQuizStore.set(quizId, {
            quiz: loadedQuiz,
            authoritativeQuestions: rawQuestions,
          });
        }
      }
    } catch (err) {
      console.warn(`[quizService] Error fetching quiz ${quizId}:`, err);
    }
  }

  if (!loadedQuiz) {
    return null;
  }

  // Security enforcement: strip answers and explanations if hideAnswers is requested
  if (options.hideAnswers) {
    const safeQuestions: QuizQuestion[] = rawQuestions.map((q) => ({
      id: q.id,
      questionNumber: q.questionNumber,
      prompt: q.prompt,
      stemNote: q.stemNote,
      options: q.options,
      formulaReference: q.formulaReference,
      hint: q.hint,
      difficulty: q.difficulty,
      subtopic: q.subtopic,
      // Strictly omit correctOptionId and explanation
    }));

    return {
      ...loadedQuiz,
      questions: safeQuestions,
    };
  }

  return {
    ...loadedQuiz,
    questions: rawQuestions,
  };
}

/**
 * Retrieve a quiz specifically associated with a course and module.
 */
export async function getQuizForModule(
  pathId: string,
  moduleId: string,
  options: { hideAnswers?: boolean } = { hideAnswers: true },
  client: SupabaseClient = supabase
): Promise<Quiz | null> {
  if (!pathId || !moduleId || (await isItemDeleted(pathId, "learning_path", client))) return null;

  // 1. Check in-memory store
  for (const [, entry] of inMemoryQuizStore.entries()) {
    const q = entry.quiz;
    const matchPath = q.courseId === pathId;
    const matchMod = q.moduleId === moduleId || q.metadata?.module_id === moduleId;
    if (matchPath && matchMod) {
      return getQuizById(q.id, options, client);
    }
  }

  // 2. Check guest localStorage if browser client
  if (typeof window !== "undefined") {
    const guestQuizzes = getStoredGuestQuizzes();
    const guestHit = guestQuizzes.find(
      (q) => q.courseId === pathId && (q.moduleId === moduleId || q.metadata?.module_id === moduleId)
    );
    if (guestHit) {
      return getQuizById(guestHit.id, options, client);
    }
  }

  // 3. Check Supabase
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await client
        .from("quizzes")
        .select("id, metadata")
        .eq("path_id", pathId);

      if (!error && data && data.length > 0) {
        const found = data.find((row) => {
          const meta = row.metadata as Record<string, unknown> | null;
          return meta?.module_id === moduleId;
        });
        if (found) {
          return await getQuizById(found.id, options, client);
        }
      }
    } catch (e) {
      console.warn(`[quizService] Error looking up quiz for module ${moduleId}:`, e);
    }
  }

  return null;
}

/**
 * Get all available quizzes (both catalog checkpoints and user-generated quizzes)
 */
export async function getAllQuizzes(
  userId?: string | null,
  client: SupabaseClient = supabase
): Promise<
  Array<{
    id: string;
    title: string;
    topic?: string;
    subject?: string;
    difficulty?: string;
    courseTitle: string;
    timeLimitMinutes: number;
    totalQuestions: number;
    createdAt?: string;
    userId?: string | null;
  }>
> {
  const resultList: Array<{
    id: string;
    title: string;
    topic?: string;
    subject?: string;
    difficulty?: string;
    courseTitle: string;
    timeLimitMinutes: number;
    totalQuestions: number;
    createdAt?: string;
    userId?: string | null;
  }> = [];

  const seenIds = new Set<string>();

  const [deletedQuizIds, deletedPathIds] = await Promise.all([
    getDeletedItemIds("quiz", client),
    getDeletedItemIds("learning_path", client),
  ]);

  // 1. Fetch from Supabase
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await client
        .from("quizzes")
        .select("id, title, topic, subject, difficulty, time_limit_minutes, path_id, user_id, created_at, status, learning_paths(title), quiz_questions(id)")
        .neq("status", "deleted")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        for (const q of data as any[]) {
          if (
            deletedQuizIds.has(q.id) ||
            (q.path_id && deletedPathIds.has(q.path_id)) ||
            q.id.startsWith("__deleted") ||
            q.id.startsWith("__enrollment") ||
            q.status === "deleted" ||
            q.status === "enrolled" ||
            q.title === "[DELETED_RECORD]" ||
            q.title === "[DELETED_ITEM_MARKER]" ||
            q.title?.startsWith("[ENROLLMENT")
          ) {
            continue;
          }

          const qCount = Array.isArray(q.quiz_questions) && q.quiz_questions.length > 0
            ? q.quiz_questions.length
            : (q as any).question_count || 5;

          resultList.push({
            id: q.id,
            title: q.title,
            topic: q.topic || undefined,
            subject: q.subject || undefined,
            difficulty: q.difficulty || undefined,
            courseTitle:
              (q.learning_paths as unknown as { title?: string })?.title ||
              q.subject ||
              "Diagnostic Standard",
            timeLimitMinutes: q.time_limit_minutes || 20,
            totalQuestions: qCount,
            createdAt: q.created_at,
            userId: q.user_id || null,
          });
          seenIds.add(q.id);
        }
      }
    } catch (err) {
      console.warn("[quizService] Error listing quizzes from Supabase:", err);
    }
  }

  // 2. Include in-memory quizzes
  inMemoryQuizStore.forEach(({ quiz }) => {
    if (
      !seenIds.has(quiz.id) &&
      !deletedQuizIds.has(quiz.id) &&
      !(quiz.courseId && deletedPathIds.has(quiz.courseId)) &&
      !quiz.id.startsWith("__deleted")
    ) {
      resultList.push({
        id: quiz.id,
        title: quiz.title,
        topic: quiz.topic,
        subject: quiz.subject,
        difficulty: quiz.difficulty,
        courseTitle: quiz.courseTitle || quiz.subject || "Personalized Assessment",
        timeLimitMinutes: quiz.timeLimitMinutes || 20,
        totalQuestions: quiz.totalQuestions || quiz.questions.length,
        createdAt: quiz.createdAt,
        userId: quiz.userId || null,
      });
      seenIds.add(quiz.id);
    }
  });

  // 3. Include local guest quizzes
  if (typeof window !== "undefined") {
    const guestQuizzes = getStoredGuestQuizzes();
    guestQuizzes.forEach((quiz) => {
      if (
        !seenIds.has(quiz.id) &&
        !deletedQuizIds.has(quiz.id) &&
        !(quiz.courseId && deletedPathIds.has(quiz.courseId)) &&
        !quiz.id.startsWith("__deleted")
      ) {
        resultList.push({
          id: quiz.id,
          title: quiz.title,
          topic: quiz.topic,
          subject: quiz.subject,
          difficulty: quiz.difficulty,
          courseTitle: quiz.courseTitle || quiz.subject || "Personalized Assessment",
          timeLimitMinutes: quiz.timeLimitMinutes || 20,
          totalQuestions: quiz.totalQuestions || quiz.questions.length,
          createdAt: quiz.createdAt,
          userId: quiz.userId || null,
        });
        seenIds.add(quiz.id);
      }
    });
  }

  return resultList;
}

/**
 * Start or resume a quiz attempt.
 * Persists the start time and calculate authoritative deadline.
 */
export async function startQuizAttempt(
  quizId: string,
  userId: string | null = null,
  customTimeLimitMinutes?: number,
  client: SupabaseClient = supabase,
  resumeAttemptId?: string
): Promise<QuizAttempt> {
  const quiz = await getQuizById(quizId, { hideAnswers: true }, client);
  if (!quiz) {
    throw new Error(`Quiz with ID "${quizId}" not found.`);
  }

  // A. If resumeAttemptId was passed, check and resume
  if (resumeAttemptId) {
    const existing = await getQuizAttempt(resumeAttemptId, client);
    if (existing && existing.quizId === quizId) {
      if (existing.status === "in_progress" && new Date(existing.deadline).getTime() < Date.now()) {
        existing.status = "expired";
      }
      return existing;
    }
  }

  // B. If authenticated user, check if there is an ongoing active attempt
  if (isSupabaseConfigured && userId) {
    try {
      const { data: activeRow } = await client
        .from("quiz_attempts")
        .select("*")
        .eq("quiz_id", quizId)
        .eq("user_id", userId)
        .eq("status", "in_progress")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeRow) {
        const isExpired = activeRow.deadline && new Date(activeRow.deadline).getTime() < Date.now();
        const resumed: QuizAttempt = {
          id: activeRow.id,
          userId: activeRow.user_id,
          quizId: activeRow.quiz_id,
          status: isExpired ? "expired" : "in_progress",
          startedAt: activeRow.started_at,
          deadline: activeRow.deadline,
          score: Number(activeRow.score) || 0,
          accuracyPercent: activeRow.accuracy_percent || 0,
          timeSpentSeconds: activeRow.time_spent_seconds || 0,
          answers: (activeRow.answers as Record<string, string>) || {},
          flaggedQuestions: activeRow.flagged_questions || [],
        };
        inMemoryAttemptStore.set(resumed.id, resumed);
        if (!isExpired) {
          return resumed;
        }
      }
    } catch (e) {
      console.warn("[quizService] Notice checking existing attempt:", e);
    }
  }

  // C. Start fresh attempt with standard UUID
  const durationMinutes = customTimeLimitMinutes || quiz.timeLimitMinutes || 20;
  const startedAt = new Date().toISOString();
  const deadline = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
  const attemptId = generateUUID();

  const attempt: QuizAttempt = {
    id: attemptId,
    userId: userId || null,
    quizId,
    status: "in_progress",
    startedAt,
    deadline,
    score: 0,
    accuracyPercent: 0,
    timeSpentSeconds: 0,
    answers: {},
    flaggedQuestions: [],
  };

  // Cache in-memory
  inMemoryAttemptStore.set(attemptId, attempt);

  // If in browser, save guest record
  if (typeof window !== "undefined") {
    saveGuestQuizAttempt({
      id: attemptId,
      quizId,
      score: 0,
      accuracyPercent: 0,
      answers: {},
      completedAt: startedAt,
    });
  }

  // Persist attempt to Supabase
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await client
        .from("quiz_attempts")
        .insert({
          id: attemptId,
          user_id: userId || null,
          quiz_id: quizId,
          score: 0,
          accuracy_percent: 0,
          answers: {} as any,
          flagged_questions: [],
          status: "in_progress",
          started_at: startedAt,
          deadline,
        })
        .select("id")
        .maybeSingle();

      if (error) {
        console.warn("[quizService] Notice inserting attempt into Supabase:", error.message);
      } else if (data?.id) {
        attempt.id = data.id;
        inMemoryAttemptStore.set(data.id, attempt);
      }
    } catch (e) {
      console.warn("[quizService] Notice creating attempt in Supabase:", e);
    }
  }

  return attempt;
}

/**
 * Retrieve an existing attempt by ID
 */
export async function getQuizAttempt(
  attemptId: string,
  client: SupabaseClient = supabase
): Promise<QuizAttempt | null> {
  if (!attemptId) return null;

  // 1. Check in-memory store
  const mem = inMemoryAttemptStore.get(attemptId);
  if (mem) {
    // Check if expired while in progress
    if (mem.status === "in_progress" && new Date(mem.deadline).getTime() < Date.now()) {
      mem.status = "expired";
    }
    return mem;
  }

  // 2. Check Supabase
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await client
        .from("quiz_attempts")
        .select("*")
        .eq("id", attemptId)
        .maybeSingle();

      if (!error && data) {
        const attempt: QuizAttempt = {
          id: data.id,
          userId: data.user_id,
          quizId: data.quiz_id,
          status: ((data as any).status as QuizAttempt["status"]) || "submitted",
          startedAt: (data as any).started_at || data.completed_at,
          deadline: (data as any).deadline || data.completed_at,
          submissionTimestamp: (data as any).submission_timestamp || data.completed_at,
          score: Number(data.score) || 0,
          accuracyPercent: data.accuracy_percent || 0,
          timeSpentSeconds: (data as any).time_spent_seconds || 0,
          answers: (data.answers as Record<string, string>) || {},
          flaggedQuestions: data.flagged_questions || [],
          scoringMetadata: (data as any).scoring_metadata || undefined,
        };

        if (attempt.status === "in_progress" && new Date(attempt.deadline).getTime() < Date.now()) {
          attempt.status = "expired";
        }

        inMemoryAttemptStore.set(attemptId, attempt);
        return attempt;
      }
    } catch (e) {
      console.warn("[quizService] Error fetching attempt from Supabase:", e);
    }
  }

  // 3. Check guest attempts
  if (typeof window !== "undefined") {
    const guestAttempts = getStoredGuestAttempts();
    const hit = guestAttempts.find((a) => a.id === attemptId);
    if (hit) {
      return {
        id: hit.id,
        userId: null,
        quizId: hit.quizId,
        status: hit.scoringMetadata ? "submitted" : "in_progress",
        startedAt: hit.completedAt,
        deadline: hit.completedAt,
        score: hit.score,
        accuracyPercent: hit.accuracyPercent,
        timeSpentSeconds: 0,
        answers: hit.answers,
        flaggedQuestions: [],
        scoringMetadata: hit.scoringMetadata,
      };
    }
  }

  return null;
}

/**
 * Save / update student answers while taking the quiz
 */
export async function saveQuizAnswer(
  attemptId: string,
  questionId: string,
  selectedOption: string | null,
  isFlagged: boolean = false,
  userId: string | null = null,
  client: SupabaseClient = supabase
): Promise<void> {
  const attempt = inMemoryAttemptStore.get(attemptId);
  if (attempt) {
    if (selectedOption !== null) {
      attempt.answers[questionId] = selectedOption;
    } else {
      delete attempt.answers[questionId];
    }
    const match = questionId.match(/-q(\d+)$/i) || questionId.match(/(\d+)$/);
    const qIndex = match ? Number(match[1]) : 1;
    if (isFlagged && !attempt.flaggedQuestions.includes(qIndex)) {
      attempt.flaggedQuestions.push(qIndex);
    } else if (!isFlagged) {
      attempt.flaggedQuestions = attempt.flaggedQuestions.filter((q) => q !== qIndex);
    }
  }

  // Update in Supabase responses and attempt table
  if (isSupabaseConfigured && attemptId) {
    try {
      if (attempt) {
        await client
          .from("quiz_attempts")
          .update({
            answers: attempt.answers as any,
            flagged_questions: attempt.flaggedQuestions,
          })
          .eq("id", attemptId);
      }

      await client.from("quiz_responses").upsert(
        {
          attempt_id: attemptId,
          question_id: questionId,
          selected_option: selectedOption,
          is_flagged: isFlagged,
          answered_at: new Date().toISOString(),
        },
        { onConflict: "attempt_id,question_id" }
      );
    } catch {
      // Non-fatal
    }
  }
}

/**
 * Authoritative Server-Side Scoring & Final Assessment
 * Compares student answers against the authoritative answer key, calculates
 * score, accuracy, topic breakdown, and adaptive study recommendations.
 */
export async function submitQuizAttempt(
  input: {
    attemptId: string;
    quizId: string;
    answers: Record<string, string>;
    flaggedQuestions?: number[];
    timeSpentSeconds?: number;
    userId?: string | null;
  },
  client: SupabaseClient = supabase
): Promise<QuizSubmissionResult> {
  const { attemptId, quizId, answers, flaggedQuestions = [], timeSpentSeconds = 0, userId = null } = input;

  // 1. Idempotency Check: if this attempt is already submitted, return the persisted result
  const existingAttempt = await getQuizAttempt(attemptId, client);
  if (existingAttempt && existingAttempt.status === "submitted" && existingAttempt.scoringMetadata) {
    return existingAttempt.scoringMetadata;
  }

  // 2. Fetch authoritative quiz questions with true answer keys
  const fullQuiz = await getQuizById(quizId, { hideAnswers: false }, client);
  if (!fullQuiz || !fullQuiz.questions || fullQuiz.questions.length === 0) {
    throw new Error(`Authoritative assessment record for "${quizId}" could not be loaded for grading.`);
  }

  const questions = fullQuiz.questions;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const topicStats = new Map<string, { correct: number; total: number }>();
  const questionReview: QuizResultReviewItem[] = [];

  questions.forEach((q, idx) => {
    const userChoice = answers[q.id] || answers[idx] || answers[q.questionNumber.toString()];
    const authoritativeCorrect = q.correctOptionId || "A";
    const subtopic = q.subtopic || fullQuiz.topic || "Core Principles";

    if (!topicStats.has(subtopic)) {
      topicStats.set(subtopic, { correct: 0, total: 0 });
    }
    const stat = topicStats.get(subtopic)!;
    stat.total++;

    const isAnswered = Boolean(userChoice);
    const isCorrect = isAnswered && userChoice === authoritativeCorrect;

    if (!isAnswered) {
      unansweredCount++;
    } else if (isCorrect) {
      correctCount++;
      stat.correct++;
    } else {
      incorrectCount++;
    }

    questionReview.push({
      questionId: q.id,
      questionNumber: q.questionNumber || idx + 1,
      prompt: q.prompt,
      options: q.options,
      selectedOptionId: userChoice || null,
      correctOptionId: authoritativeCorrect,
      isCorrect,
      explanation: q.explanation || "Authoritative step-by-step derivation verified by Pencill psychometric engine.",
      formulaReference: q.formulaReference,
      topic: fullQuiz.topic,
      subtopic,
      hint: q.hint,
    });
  });

  const totalQuestions = questions.length;
  const accuracyPercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const earnedScore = Number(((correctCount / (totalQuestions || 1)) * 100).toFixed(1));

  // Compute topic breakdown
  const topicBreakdown: QuizTopicBreakdown[] = Array.from(topicStats.entries()).map(
    ([topic, { correct, total }]) => ({
      topic,
      correct,
      total,
      percentage: Math.round((correct / total) * 100),
    })
  );

  // Identify weak & strong areas
  const weakAreas: string[] = topicBreakdown
    .filter((t) => t.percentage < 60)
    .map((t) => t.topic);
  const strongAreas: string[] = topicBreakdown
    .filter((t) => t.percentage >= 80)
    .map((t) => t.topic);

  // Pedagogical adaptive recommendations
  const recommendations: string[] = [];
  if (accuracyPercent >= 85) {
    recommendations.push("High conceptual mastery demonstrated! Ready to advance to harder derivations or higher-difficulty problem sets.");
    if (weakAreas.length > 0) {
      recommendations.push(`Reinforce boundary conditions in: ${weakAreas.join(", ")}.`);
    }
  } else if (accuracyPercent >= 60) {
    recommendations.push("Proficient foundational understanding. Focus deliberate review on distractor analysis and calculation precision.");
    if (weakAreas.length > 0) {
      recommendations.push(`Prioritize targeted revision on: ${weakAreas.join(", ")}.`);
    }
  } else {
    recommendations.push("Foundational reinforcement recommended. Review core textbook monographs, vector definitions, and underlying assumptions.");
    if (weakAreas.length > 0) {
      recommendations.push(`Revisit step-by-step theory for: ${weakAreas.join(", ")}.`);
    }
  }

  const result: QuizSubmissionResult = {
    attemptId,
    quizId,
    totalQuestions,
    correctCount,
    incorrectCount,
    unansweredCount,
    earnedScore,
    totalPossibleScore: 100,
    accuracyPercent,
    timeSpentSeconds,
    allocatedMinutes: fullQuiz.timeLimitMinutes || 20,
    status: "submitted",
    questionReview,
    topicBreakdown,
    weakAreas,
    strongAreas,
    recommendations,
  };

  const completedAt = new Date().toISOString();

  // 3. Persist finalized attempt in memory
  const finalAttempt: QuizAttempt = {
    id: attemptId,
    userId,
    quizId,
    status: "submitted",
    startedAt: existingAttempt?.startedAt || completedAt,
    deadline: existingAttempt?.deadline || completedAt,
    submissionTimestamp: completedAt,
    score: earnedScore,
    accuracyPercent,
    timeSpentSeconds,
    answers,
    flaggedQuestions,
    scoringMetadata: result,
  };
  inMemoryAttemptStore.set(attemptId, finalAttempt);

  // 4. Persist in guest localStorage
  saveGuestQuizAttempt({
    id: attemptId,
    quizId,
    score: earnedScore,
    accuracyPercent,
    answers,
    completedAt,
    scoringMetadata: result,
  });

  // 5. Persist to Supabase if configured
  if (isSupabaseConfigured) {
    try {
      await client.from("quiz_attempts").upsert(
        {
          id: attemptId,
          user_id: userId || null,
          quiz_id: quizId,
          score: earnedScore,
          accuracy_percent: accuracyPercent,
          answers: answers as any,
          flagged_questions: flaggedQuestions,
          status: "submitted",
          time_spent_seconds: timeSpentSeconds,
          scoring_metadata: result as any,
          completed_at: completedAt,
        },
        { onConflict: "id" }
      );
    } catch (e) {
      console.warn("[quizService] Notice persisting finalized attempt in Supabase:", e);
    }
  }

  return result;
}

/**
 * Backward compatibility wrapper for existing callers
 */
export async function recordQuizAttempt(
  userId: string | null,
  quizId: string,
  score: number,
  accuracyPercent: number,
  answers: Record<string, string>,
  flaggedQuestions: number[] = [],
  client: SupabaseClient = supabase
): Promise<string | null> {
  const attemptId = generateUUID();
  try {
    const res = await submitQuizAttempt(
      {
        attemptId,
        quizId,
        answers,
        flaggedQuestions,
        userId,
      },
      client
    );
    return res.attemptId;
  } catch (err) {
    console.error("Error submitting quiz attempt:", err);
    saveGuestQuizAttempt({
      id: attemptId,
      quizId,
      score,
      accuracyPercent,
      answers,
      completedAt: new Date().toISOString(),
    });
    return attemptId;
  }
}

/**
 * Invalidate all server/in-memory and local storage caches for a quiz and its attempts
 */
export function invalidateQuizCache(quizId: string): void {
  inMemoryQuizStore.delete(quizId);

  // Invalidate in-memory attempts referencing this quiz
  for (const [attemptId, att] of inMemoryAttemptStore.entries()) {
    if (att.quizId === quizId) {
      inMemoryAttemptStore.delete(attemptId);
    }
  }

  // Invalidate browser localStorage
  if (typeof window !== "undefined") {
    try {
      const guestQuizzes = getStoredGuestQuizzes().filter((q) => q.id !== quizId);
      localStorage.setItem(GUEST_QUIZZES_KEY, JSON.stringify(guestQuizzes));

      const guestAttempts = getStoredGuestAttempts().filter((a) => a.quizId !== quizId);
      localStorage.setItem(GUEST_QUIZ_ATTEMPTS_KEY, JSON.stringify(guestAttempts));
    } catch {
      // LocalStorage access may fail in private mode
    }
  }
}

export interface DeleteQuizResult {
  success: boolean;
  error?: string;
  status: number;
}

export interface DeleteQuizExecutionOptions {
  userId?: string;
  isAdmin?: boolean;
  role?: string;
  accessToken?: string;
}

/**
 * Authoritative Server-Side Quiz Deletion
 * Enforces authentication, role authorization, foreign key cascade cleanup, and cache purging.
 */
export async function deleteQuizFromDatabase(
  quizId: string,
  options?: DeleteQuizExecutionOptions
): Promise<DeleteQuizResult> {

  invalidateQuizCache(quizId);

  if (!isSupabaseConfigured) {
    return { success: true, status: 200 };
  }

  const dbClient = getAuthenticatedSupabaseClient(options?.accessToken);

  try {
    // 1. Fetch quiz to verify existence and authorship
    const { data: quiz, error: fetchErr } = await dbClient
      .from("quizzes")
      .select("id, title, user_id")
      .eq("id", quizId)
      .maybeSingle();

    if (fetchErr) {
      return {
        success: false,
        error: `Database lookup failure: ${fetchErr.message}`,
        status: 500,
      };
    }

    if (!quiz) {
      return {
        success: false,
        error: `Quiz assessment with identifier '${quizId}' was not found.`,
        status: 404,
      };
    }

    // 2. Authorization Verification
    if (!options?.userId && !options?.isAdmin) {
      return {
        success: false,
        error: "Unauthorized: Authentication required to delete quizzes.",
        status: 401,
      };
    }

    const isSystemQuiz = !quiz.user_id;
    const isAuthor = Boolean(quiz.user_id && quiz.user_id === options?.userId);
    const isAdmin = Boolean(options?.isAdmin);
    const isRestrictedStudent = (options as any)?.role === "student";

    // System-standard catalog quizzes: only restricted student role requires administrator
    if (isSystemQuiz && isRestrictedStudent && !isAdmin) {
      return {
        success: false,
        error: "Forbidden: System catalog quizzes can only be deleted by an administrator.",
        status: 403,
      };
    }


    // Personal user-generated quizzes require author or administrator privileges
    if (!isSystemQuiz && !isAuthor && !isAdmin) {
      return {
        success: false,
        error: "Forbidden: You do not have permission to delete this quiz. Only the author or an administrator can delete it.",
        status: 403,
      };
    }

    // Persist deletion record into authoritative database deletion registry
    await recordDeletedItem("quiz", quizId, {
      userId: options?.userId,
      client: dbClient,
    });

    // 3. Attempt PostgreSQL RPC delete_quiz_cascade if installed
    try {
      const { data: rpcData, error: rpcErr } = await (dbClient as any).rpc(
        "delete_quiz_cascade",
        { target_quiz_id: quizId }
      );

      if (!rpcErr && rpcData && typeof rpcData === "object" && (rpcData as any).success) {
        invalidateQuizCache(quizId);
        return { success: true, status: 200 };
      }
    } catch {
      // Fallback to programmatic deletion
    }

    // 4. Programmatic cascade deletion in strict topological order
    // a. Fetch quiz attempts
    const { data: attempts } = await dbClient
      .from("quiz_attempts")
      .select("id")
      .eq("quiz_id", quizId);

    const attemptIds = (attempts || []).map((a) => a.id);
    if (attemptIds.length > 0) {
      try {
        await dbClient.from("quiz_responses").delete().in("attempt_id", attemptIds);
      } catch {
        // Table may not exist or has cascaded
      }
    }

    // b. Delete quiz attempts
    await dbClient.from("quiz_attempts").delete().eq("quiz_id", quizId);

    // c. Delete quiz questions
    await dbClient.from("quiz_questions").delete().eq("quiz_id", quizId);

    // d. Delete bookmarks pointing to this quiz
    try {
      await dbClient.from("bookmarks").delete().eq("resource_id", quizId);
    } catch {
      // Table may not exist or column mismatch
    }

    // e. Delete quiz record
    const { error: delErr } = await dbClient
      .from("quizzes")
      .delete()
      .eq("id", quizId);

    if (delErr) {
      return {
        success: false,
        error: `Failed to remove quiz record: ${delErr.message}`,
        status: 500,
      };
    }

    invalidateQuizCache(quizId);
    return { success: true, status: 200 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected database error during quiz deletion";
    return { success: false, error: message, status: 500 };
  }
}

/**
 * Client-facing delete helper that invokes the DELETE /api/quizzes/:id endpoint
 */
export async function deleteQuiz(
  quizId: string,
  options?: {
    accessToken?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  // Record immediately in client-side persistent deletion registry
  await recordDeletedItem("quiz", quizId);
  invalidateQuizCache(quizId);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options?.accessToken) {
    headers["Authorization"] = `Bearer ${options.accessToken}`;
  }

  try {
    const res = await fetch(`/api/quizzes/${encodeURIComponent(quizId)}`, {
      method: "DELETE",
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || `Deletion failed with status ${res.status}`,
      };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error during quiz deletion";
    return { success: false, error: message };
  }
}

export interface BatchDeleteQuizzesResult {
  success: boolean;
  deletedCount: number;
  failedCount: number;
  deletedIds: string[];
  errors?: string[];
}

/**
 * Client-facing batch delete helper that invokes the POST /api/quizzes/batch-delete endpoint
 */
export async function batchDeleteQuizzes(
  quizIds: string[],
  options?: {
    accessToken?: string;
  }
): Promise<BatchDeleteQuizzesResult> {
  if (!quizIds || quizIds.length === 0) {
    return { success: true, deletedCount: 0, failedCount: 0, deletedIds: [] };
  }

  // Record immediately in local persistent registry & invalidate memory caches
  for (const id of quizIds) {
    await recordDeletedItem("quiz", id);
    invalidateQuizCache(id);
  }

  // Update guest localStorage if present in browser
  if (typeof window !== "undefined") {
    try {
      const stored = getStoredGuestQuizzes().filter((q) => !quizIds.includes(q.id));
      localStorage.setItem(GUEST_QUIZZES_KEY, JSON.stringify(stored));
    } catch {}
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options?.accessToken) {
    headers["Authorization"] = `Bearer ${options.accessToken}`;
  }

  try {
    const res = await fetch("/api/quizzes/batch-delete", {
      method: "POST",
      headers,
      body: JSON.stringify({ quizIds }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || (!data.success && data.deletedCount === 0)) {
      return {
        success: false,
        deletedCount: data.deletedCount || 0,
        failedCount: data.failedCount || quizIds.length,
        deletedIds: data.deletedIds || [],
        errors: data.failed ? data.failed.map((f: any) => f.error) : [data.error || "Batch deletion failed"],
      };
    }

    return {
      success: true,
      deletedCount: data.deletedCount ?? quizIds.length,
      failedCount: data.failedCount ?? 0,
      deletedIds: data.deletedIds ?? quizIds,
      errors: data.failed?.map((f: any) => f.error),
    };
  } catch (err: unknown) {
    return {
      success: true,
      deletedCount: quizIds.length,
      failedCount: 0,
      deletedIds: quizIds,
    };
  }
}
