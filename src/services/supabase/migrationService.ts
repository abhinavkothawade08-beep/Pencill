import { supabase, isSupabaseConfigured } from "./client";

export interface MigrationSummary {
  progressCount: number;
  notesCount: number;
  quizAttemptsCount: number;
  enrollmentsCount: number;
}

export async function migrateGuestDataToUser(userId: string): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    progressCount: 0,
    notesCount: 0,
    quizAttemptsCount: 0,
    enrollmentsCount: 0,
  };

  if (!isSupabaseConfigured || !userId || typeof window === "undefined") {
    return summary;
  }

  // 1. Migrate Progress Records in batch
  try {
    const rawProgress = localStorage.getItem("pencill_guest_progress");
    if (rawProgress) {
      const lessonIds: string[] = JSON.parse(rawProgress);
      if (Array.isArray(lessonIds) && lessonIds.length > 0) {
        const progressRows = lessonIds.map((lessonId) => ({
          user_id: userId,
          lesson_id: lessonId,
          is_completed: true,
          completed_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from("progress_records")
          .upsert(progressRows, { onConflict: "user_id,lesson_id" });

        if (!error) {
          summary.progressCount = lessonIds.length;
          localStorage.removeItem("pencill_guest_progress");
        }
      }
    }
  } catch (err) {
    console.warn("Guest progress migration encountered an error:", err);
  }

  // 2. Migrate Guest Notes in batch
  try {
    const noteKeys = Object.keys(localStorage).filter((k) => k.startsWith("pencill_notes_"));
    const allNoteRows: Array<{
      user_id: string;
      lesson_id: string;
      path_id: string | null;
      timestamp_marker: string;
      seconds_marker: number;
      content: string;
    }> = [];

    for (const key of noteKeys) {
      const lessonId = key.replace("pencill_notes_", "");
      const rawNotes = localStorage.getItem(key);
      if (rawNotes) {
        const notesList: Array<{
          content: string;
          timestampMarker?: string;
          secondsMarker?: number;
          pathId?: string;
        }> = JSON.parse(rawNotes);

        if (Array.isArray(notesList)) {
          for (const note of notesList) {
            allNoteRows.push({
              user_id: userId,
              lesson_id: lessonId,
              path_id: note.pathId || null,
              timestamp_marker: note.timestampMarker || "00:00",
              seconds_marker: note.secondsMarker || 0,
              content: note.content,
            });
          }
        }
      }
    }

    if (allNoteRows.length > 0) {
      const { error } = await supabase.from("user_notes").insert(allNoteRows);
      if (!error) {
        summary.notesCount = allNoteRows.length;
        noteKeys.forEach((k) => localStorage.removeItem(k));
      }
    }
  } catch (err) {
    console.warn("Guest notes migration encountered an error:", err);
  }

  // 3. Migrate Guest Quiz Attempts in batch
  try {
    const rawAttempts = localStorage.getItem("pencill_guest_quiz_attempts");
    if (rawAttempts) {
      const attemptsList: Array<{
        quizId: string;
        score: number;
        accuracyPercent: number;
        answers: Record<string, string>;
      }> = JSON.parse(rawAttempts);

      if (Array.isArray(attemptsList) && attemptsList.length > 0) {
        const attemptRows = attemptsList.map((att) => ({
          user_id: userId,
          quiz_id: att.quizId,
          score: att.score,
          accuracy_percent: att.accuracyPercent,
          answers: att.answers,
        }));

        const { error } = await supabase.from("quiz_attempts").insert(attemptRows);
        if (!error) {
          summary.quizAttemptsCount = attemptsList.length;
          localStorage.removeItem("pencill_guest_quiz_attempts");
        }
      }
    }
  } catch (err) {
    console.warn("Guest quiz attempts migration encountered an error:", err);
  }

  // 4. Migrate Guest Course Enrollments in batch
  try {
    const rawEnrollments = localStorage.getItem("pencill_guest_enrollments");
    if (rawEnrollments) {
      const courseIds: string[] = JSON.parse(rawEnrollments);
      if (Array.isArray(courseIds) && courseIds.length > 0) {
        const { enrollUserInCourse } = await import("./enrollmentService");
        for (const cid of courseIds) {
          await enrollUserInCourse(userId, cid);
        }
        summary.enrollmentsCount = courseIds.length;
        localStorage.removeItem("pencill_guest_enrollments");
      }
    }
  } catch (err) {
    console.warn("Guest enrollments migration encountered an error:", err);
  }

  return summary;
}
