import { supabase, isSupabaseConfigured } from "./client";
import { Bookmark } from "@/types";
import { getDeletedItemIds } from "./deletionRegistry";

export async function getUserBookmarks(userId: string): Promise<Bookmark[]> {
  if (!isSupabaseConfigured || !userId) {
    return [];
  }

  const [deletedPathIds, deletedQuizIds] = await Promise.all([
    getDeletedItemIds("learning_path"),
    getDeletedItemIds("quiz"),
  ]);

  const { data, error } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Error fetching bookmarks from Supabase:", error);
    return [];
  }

  return data
    .filter((b) => {
      if (b.path_id && deletedPathIds.has(b.path_id)) return false;
      if (b.resource_id && (deletedQuizIds.has(b.resource_id) || deletedPathIds.has(b.resource_id))) return false;
      return true;
    })
    .map((b) => ({
    id: b.id,
    resourceId: b.resource_id || undefined,
    pathId: b.path_id || undefined,
    title: b.title,
    type: b.type as Bookmark["type"],
    source: b.source,
    description: b.description || "",
    category: b.category as Bookmark["category"],
    notes: b.notes || undefined,
    savedAt: new Date(b.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));
}

export async function addBookmark(
  bookmark: Omit<Bookmark, "id" | "savedAt">,
  userId: string
): Promise<string | null> {
  if (!isSupabaseConfigured || !userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .insert({
      user_id: userId,
      resource_id: bookmark.resourceId || null,
      path_id: bookmark.pathId || null,
      title: bookmark.title,
      type: bookmark.type,
      source: bookmark.source,
      description: bookmark.description || null,
      category: bookmark.category,
      notes: bookmark.notes || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Error adding bookmark to Supabase:", error);
    return null;
  }

  return data.id;
}

export async function removeBookmark(
  bookmarkId: string,
  userId: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) {
    return false;
  }

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", bookmarkId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error removing bookmark from Supabase:", error);
    return false;
  }

  return true;
}

export async function getBookmarkForResource(
  userId: string,
  resourceId: string
): Promise<Bookmark | null> {
  if (!isSupabaseConfigured || !userId) {
    return null;
  }
  const { data, error } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", userId)
    .eq("resource_id", resourceId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    resourceId: data.resource_id || undefined,
    pathId: data.path_id || undefined,
    title: data.title,
    type: data.type as Bookmark["type"],
    source: data.source,
    description: data.description || "",
    category: data.category as Bookmark["category"],
    notes: data.notes || undefined,
    savedAt: new Date(data.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  };
}
