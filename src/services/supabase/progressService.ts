import { supabase, isSupabaseConfigured } from "./client";
import { ProgressMetrics } from "@/types";

const GUEST_PROGRESS_KEY = "pencill_guest_progress";

function getGuestCompletedLessons(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addGuestCompletedLesson(lessonId: string) {
  if (typeof window === "undefined") return;
  try {
    const current = getGuestCompletedLessons();
    if (!current.includes(lessonId)) {
      localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify([...current, lessonId]));
    }
  } catch (e) {
    console.warn("Could not save guest progress:", e);
  }
}

function formatRelativeTime(isoString?: string): string {
  if (!isoString) return "Recently";
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

function createEmptyMomentum(): ProgressMetrics["weeklyMomentum"] {
  return [
    { day: "Mon", hours: 0, goalHours: 2.0 },
    { day: "Tue", hours: 0, goalHours: 2.0 },
    { day: "Wed", hours: 0, goalHours: 2.0 },
    { day: "Thu", hours: 0, goalHours: 2.0 },
    { day: "Fri", hours: 0, goalHours: 2.0 },
    { day: "Sat", hours: 0, goalHours: 2.0 },
    { day: "Sun", hours: 0, goalHours: 2.0 },
  ];
}

export async function getUserProgress(userId: string | null): Promise<ProgressMetrics> {
  const emptyMomentum = createEmptyMomentum();

  if (!userId || !isSupabaseConfigured) {
    const completed = getGuestCompletedLessons();
    const guestHours = Math.round((completed.length * 0.4) * 10) / 10;
    return {
      overallPercent: completed.length > 0 ? Math.min(100, Math.round((completed.length / 8) * 100)) : 0,
      totalHoursInvested: guestHours,
      hoursChangeVsLastWeek: 0,
      clearedModules: completed.length > 0 ? Math.floor(completed.length / 3) : 0,
      totalModules: Math.max(1, Math.floor(completed.length / 3) + 1),
      quizAccuracy: 0,
      quizAccuracyTier: "No Diagnostics Taken",
      quizzesTaken: 0,
      streakDays: completed.length > 0 ? 1 : 0,
      longestStreakDays: completed.length > 0 ? 1 : 0,
      weeklyMomentum: emptyMomentum,
      topicMastery: [],
      recentActivity: completed.slice(-4).reverse().map((id, idx) => ({
        id: `guest-${id}`,
        title: `Lesson Unit (${id})`,
        type: "video" as const,
        courseTitle: "Academic Track",
        timestamp: "Recently",
        timeSpent: "25m",
      })),
    };
  }

  // Fetch real progress records joined with lessons and paths
  const [recordsRes, attemptsRes, profileRes] = await Promise.all([
    supabase
      .from("progress_records")
      .select("*, lessons(title, type), learning_paths(title, domain)")
      .eq("user_id", userId),
    supabase
      .from("quiz_attempts")
      .select("*")
      .eq("user_id", userId),
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  const records = recordsRes.data || [];
  const attempts = attemptsRes.data || [];
  const profile = profileRes.data;

  const completedRecords = records.filter((r) => r.is_completed);
  const completedCount = completedRecords.length;
  const totalSeconds = records.reduce((acc, curr) => acc + (curr.time_spent_seconds || 0), 0);
  const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

  // Real quiz accuracy computation
  const quizAccuracy = attempts.length > 0
    ? Math.round(attempts.reduce((acc, curr) => acc + (curr.accuracy_percent || 0), 0) / attempts.length)
    : 0;

  const quizAccuracyTier = attempts.length === 0
    ? "No Diagnostics Taken"
    : quizAccuracy >= 85
    ? "Tier 1 Bracket · Mastered"
    : quizAccuracy >= 70
    ? "Tier 2 Bracket · Proficient"
    : "Foundational Practice";

  // Compute domain/topic mastery dynamically from completed lessons
  const domainCounts = new Map<string, number>();
  completedRecords.forEach((r) => {
    const domain = (r.learning_paths as unknown as { domain?: string })?.domain || "Foundational Studies";
    domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
  });

  const topicMastery = Array.from(domainCounts.entries()).map(([name, count]) => {
    const percentage = Math.min(100, Math.round((count / Math.max(count, 4)) * 100));
    return {
      name,
      percentage,
      level: percentage >= 80 ? "Mastery" : percentage >= 50 ? "Proficient" : "In Progress",
    };
  });

  // Calculate day-of-week momentum from actual progress records
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daySeconds = new Map<string, number>();
  dayNames.forEach((d) => daySeconds.set(d, 0));

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  records.forEach((r) => {
    const accessedTime = new Date(r.last_accessed_at).getTime();
    if (accessedTime >= oneWeekAgo) {
      const day = dayNames[new Date(r.last_accessed_at).getDay()];
      daySeconds.set(day, (daySeconds.get(day) || 0) + (r.time_spent_seconds || 1500));
    }
  });

  const weeklyMomentum: ProgressMetrics["weeklyMomentum"] = [
    { day: "Mon", hours: Math.round(((daySeconds.get("Mon") || 0) / 3600) * 10) / 10, goalHours: 2.0 },
    { day: "Tue", hours: Math.round(((daySeconds.get("Tue") || 0) / 3600) * 10) / 10, goalHours: 2.0 },
    { day: "Wed", hours: Math.round(((daySeconds.get("Wed") || 0) / 3600) * 10) / 10, goalHours: 2.0 },
    { day: "Thu", hours: Math.round(((daySeconds.get("Thu") || 0) / 3600) * 10) / 10, goalHours: 2.0 },
    { day: "Fri", hours: Math.round(((daySeconds.get("Fri") || 0) / 3600) * 10) / 10, goalHours: 2.0 },
    { day: "Sat", hours: Math.round(((daySeconds.get("Sat") || 0) / 3600) * 10) / 10, goalHours: 2.0 },
    { day: "Sun", hours: Math.round(((daySeconds.get("Sun") || 0) / 3600) * 10) / 10, goalHours: 2.0 },
  ];

  // Recent activity stream from real user actions
  const recentActivity = records.length > 0
    ? records
        .slice()
        .sort((a, b) => new Date(b.last_accessed_at).getTime() - new Date(a.last_accessed_at).getTime())
        .slice(0, 6)
        .map((r) => {
          const lData = r.lessons as unknown as { title?: string; type?: string } | null;
          const pData = r.learning_paths as unknown as { title?: string } | null;
          return {
            id: r.id,
            title: lData?.title || `Lesson Unit (${r.lesson_id})`,
            type: (lData?.type as any) || "video",
            courseTitle: pData?.title || "Academic Track",
            timestamp: formatRelativeTime(r.last_accessed_at),
            timeSpent: `${Math.max(5, Math.round((r.time_spent_seconds || 1500) / 60))}m`,
          };
        })
    : [];

  const distinctModules = new Set(completedRecords.map((r) => r.module_id).filter(Boolean));

  return {
    overallPercent: records.length > 0 ? Math.min(100, Math.round((completedCount / Math.max(records.length, 1)) * 100)) : 0,
    totalHoursInvested: totalHours,
    hoursChangeVsLastWeek: 0,
    clearedModules: distinctModules.size,
    totalModules: Math.max(distinctModules.size, 1),
    quizAccuracy,
    quizAccuracyTier,
    quizzesTaken: attempts.length,
    streakDays: profile?.streak_days || 0,
    longestStreakDays: profile?.longest_streak_days || 0,
    weeklyMomentum,
    topicMastery,
    recentActivity,
  };
}

export async function markLessonComplete(
  userId: string | null,
  lessonId: string,
  pathId?: string,
  moduleId?: string
): Promise<boolean> {
  if (!userId || !isSupabaseConfigured) {
    addGuestCompletedLesson(lessonId);
    return true;
  }

  const { error } = await supabase.from("progress_records").upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      path_id: pathId || null,
      module_id: moduleId || null,
      is_completed: true,
      completed_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" }
  );

  if (error) {
    console.error("Error updating progress in Supabase:", error);
    addGuestCompletedLesson(lessonId);
    return false;
  }

  return true;
}

export async function getCompletedLessonIds(
  userId: string | null,
  pathId?: string
): Promise<string[]> {
  if (!userId || !isSupabaseConfigured) {
    return getGuestCompletedLessons();
  }

  let query = supabase
    .from("progress_records")
    .select("lesson_id")
    .eq("user_id", userId)
    .eq("is_completed", true);

  if (pathId) {
    query = query.eq("path_id", pathId);
  }

  const { data, error } = await query;
  if (error || !data) {
    if (error) console.error("Error getting completed lessons:", error);
    return getGuestCompletedLessons();
  }

  return data.map((r) => r.lesson_id);
}

export async function logStudySession(
  userId: string | null,
  lessonId: string,
  secondsSpent: number,
  pathId?: string
): Promise<boolean> {
  if (!userId || !isSupabaseConfigured) {
    return true;
  }

  const { data: existing } = await supabase
    .from("progress_records")
    .select("time_spent_seconds")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const currentSeconds = existing?.time_spent_seconds || 0;

  const { error } = await supabase.from("progress_records").upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      path_id: pathId || null,
      time_spent_seconds: currentSeconds + secondsSpent,
      last_accessed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" }
  );

  if (error) {
    console.error("Error logging study session:", error);
    return false;
  }

  return true;
}
