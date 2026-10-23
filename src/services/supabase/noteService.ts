import { supabase, isSupabaseConfigured } from "./client";

export interface UserNoteItem {
  id: string;
  lessonId: string;
  timestampMarker: string;
  content: string;
  createdAt: string;
}

const GUEST_NOTES_KEY_PREFIX = "pencill_notes_";

function getGuestNotes(lessonId: string): UserNoteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${GUEST_NOTES_KEY_PREFIX}${lessonId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestNotes(lessonId: string, notes: UserNoteItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${GUEST_NOTES_KEY_PREFIX}${lessonId}`, JSON.stringify(notes));
  } catch (e) {
    console.warn("Could not save notes to localStorage:", e);
  }
}

export async function getUserNotes(
  userId: string | null,
  lessonId: string
): Promise<UserNoteItem[]> {
  if (!userId) {
    return getGuestNotes(lessonId);
  }

  if (!isSupabaseConfigured) {
    return getGuestNotes(lessonId);
  }

  const { data, error } = await supabase
    .from("user_notes")
    .select("*")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Error fetching notes from Supabase:", error);
    return getGuestNotes(lessonId);
  }

  return data.map((n) => ({
    id: n.id,
    lessonId: n.lesson_id,
    timestampMarker: n.timestamp_marker || "00:00",
    content: n.content,
    createdAt: n.created_at,
  }));
}

export async function addNote(
  userId: string | null,
  lessonId: string,
  content: string,
  timestampMarker: string = "00:00",
  secondsMarker: number = 0,
  pathId?: string
): Promise<UserNoteItem | null> {
  if (!userId || !isSupabaseConfigured) {
    const newNote: UserNoteItem = {
      id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      lessonId,
      timestampMarker,
      content,
      createdAt: new Date().toISOString(),
    };
    const current = getGuestNotes(lessonId);
    saveGuestNotes(lessonId, [newNote, ...current]);
    return newNote;
  }

  const { data, error } = await supabase
    .from("user_notes")
    .insert({
      user_id: userId,
      lesson_id: lessonId,
      path_id: pathId || null,
      timestamp_marker: timestampMarker,
      seconds_marker: secondsMarker,
      content,
    })
    .select("id, lesson_id, timestamp_marker, content, created_at")
    .single();

  if (error || !data) {
    console.error("Error adding note to Supabase:", error);
    // Graceful fallback to guest note storage so user doesn't lose notes
    const fallbackNote: UserNoteItem = {
      id: `local-${Date.now()}`,
      lessonId,
      timestampMarker,
      content,
      createdAt: new Date().toISOString(),
    };
    saveGuestNotes(lessonId, [fallbackNote, ...getGuestNotes(lessonId)]);
    return fallbackNote;
  }

  return {
    id: data.id,
    lessonId: data.lesson_id,
    timestampMarker: data.timestamp_marker || timestampMarker,
    content: data.content,
    createdAt: data.created_at,
  };
}

export async function updateNote(
  noteId: string,
  userId: string | null,
  content: string,
  lessonId?: string
): Promise<boolean> {
  if (!userId || !isSupabaseConfigured || noteId.startsWith("local-")) {
    if (lessonId) {
      const current = getGuestNotes(lessonId);
      const updated = current.map((n) => (n.id === noteId ? { ...n, content } : n));
      saveGuestNotes(lessonId, updated);
      return true;
    }
    return true;
  }

  const { error } = await supabase
    .from("user_notes")
    .update({ content })
    .eq("id", noteId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating note in Supabase:", error);
    return false;
  }

  return true;
}

export async function deleteNote(
  noteId: string,
  userId: string | null,
  lessonId?: string
): Promise<boolean> {
  if (!userId || !isSupabaseConfigured || noteId.startsWith("local-")) {
    if (lessonId) {
      const current = getGuestNotes(lessonId);
      const filtered = current.filter((n) => n.id !== noteId);
      saveGuestNotes(lessonId, filtered);
      return true;
    }
    return true;
  }

  const { error } = await supabase
    .from("user_notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting note from Supabase:", error);
    return false;
  }

  return true;
}
