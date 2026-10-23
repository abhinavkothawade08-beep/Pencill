import { supabase, isSupabaseConfigured } from "./client";
import { UserProfile } from "@/types";

const DEFAULT_AVATAR = "/avatars/default-avatar.svg";

export async function getProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("Error fetching user profile from Supabase:", error);
    }
    return null;
  }

  return {
    name: data.name,
    grade: data.grade || "Scholar",
    avatarUrl: data.avatar_url || DEFAULT_AVATAR,
    targetExam: data.target_exam || "Curriculum Track",
    tier: data.tier || "Pro Path",
    streakDays: data.streak_days || 0,
  };
}

export async function ensureProfile(user: {
  id: string;
  email?: string;
  user_metadata?: { name?: string; full_name?: string; avatar_url?: string };
}): Promise<UserProfile> {
  const candidateName =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Scholar";
  const candidateAvatar = user.user_metadata?.avatar_url || DEFAULT_AVATAR;

  const defaultProfile: UserProfile = {
    name: candidateName,
    grade: "Scholar",
    avatarUrl: candidateAvatar,
    targetExam: "Curriculum Track",
    tier: "Pro Path",
    streakDays: 1,
  };

  if (!isSupabaseConfigured || !user.id) {
    return defaultProfile;
  }

  // 1. Try fetching existing profile
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return {
      name: existing.name,
      grade: existing.grade || "Scholar",
      avatarUrl: existing.avatar_url || candidateAvatar,
      targetExam: existing.target_exam || "Curriculum Track",
      tier: existing.tier || "Pro Path",
      streakDays: existing.streak_days || 0,
    };
  }

  // 2. If missing, insert new profile
  const { data: inserted, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      name: candidateName,
      avatar_url: candidateAvatar,
      tier: "Pro Path",
      streak_days: 1,
    })
    .select()
    .single();

  if (error || !inserted) {
    return defaultProfile;
  }

  return {
    name: inserted.name,
    grade: inserted.grade || "Scholar",
    avatarUrl: inserted.avatar_url || candidateAvatar,
    targetExam: inserted.target_exam || "Curriculum Track",
    tier: inserted.tier || "Pro Path",
    streakDays: inserted.streak_days || 1,
  };
}

export async function updateProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) {
    return false;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      name: updates.name,
      grade: updates.grade,
      avatar_url: updates.avatarUrl,
      target_exam: updates.targetExam,
      tier: updates.tier,
      streak_days: updates.streakDays,
    })
    .eq("id", userId);

  if (error) {
    console.error("Error updating profile in Supabase:", error);
    return false;
  }

  return true;
}
