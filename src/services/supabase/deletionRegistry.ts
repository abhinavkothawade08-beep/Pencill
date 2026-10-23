import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "./client";

export type DeletableItemType = "learning_path" | "quiz";

export interface DeletedRecordEntry {
  id: string;
  type: DeletableItemType;
  deletedAt: string;
  deletedBy?: string | null;
}

const LOCAL_STORAGE_KEY = "pencill_deleted_records";

// In-memory sets for microsecond-fast lookup (server runtime & client runtime)
const inMemoryDeletedPaths = new Set<string>();
const inMemoryDeletedQuizzes = new Set<string>();

let lastDatabaseSyncTime = 0;
const DB_SYNC_TTL_MS = 5000; // 5-second cache TTL for DB sync

/**
 * Load client-side persisted deletion list from localStorage (Browser runtime)
 */
function readClientLocalStorage(): DeletedRecordEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save client-side deletion entries into localStorage
 */
function writeClientLocalStorage(entries: DeletedRecordEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn("[deletionRegistry] Could not save to localStorage:", err);
  }
}

// Initialize in-memory sets from available localStorage
function initFromLocalStores() {
  const localEntries = readClientLocalStorage();
  for (const entry of localEntries) {
    if (entry.type === "learning_path") {
      inMemoryDeletedPaths.add(entry.id);
    } else if (entry.type === "quiz") {
      inMemoryDeletedQuizzes.add(entry.id);
    }
  }
}
initFromLocalStores();

/**
 * Synchronize deletion records from the authoritative Supabase database.
 * Uses the database-backed markers stored in public.quizzes with status='deleted'.
 */
export async function syncDeletedRecordsFromDatabase(
  client: SupabaseClient = supabase,
  force = false
): Promise<void> {
  const now = Date.now();
  if (!force && now - lastDatabaseSyncTime < DB_SYNC_TTL_MS) {
    return;
  }

  // First sync with local stores
  initFromLocalStores();

  if (!isSupabaseConfigured) {
    lastDatabaseSyncTime = now;
    return;
  }

  try {
    const { data, error } = await client
      .from("quizzes")
      .select("id, status, metadata")
      .eq("status", "deleted");

    if (!error && Array.isArray(data)) {
      const mergedEntries: DeletedRecordEntry[] = readClientLocalStorage();
      const existingMap = new Map<string, DeletedRecordEntry>(
        mergedEntries.map((e) => [e.id, e])
      );

      for (const row of data as any[]) {
        const rowId: string = row.id || "";
        const meta = (row.metadata || {}) as Record<string, unknown>;
        const deletedType = (meta.deletedType as DeletableItemType) || (
          rowId.includes("path") ? "learning_path" : "quiz"
        );
        const targetId = (meta.targetId as string) || (
          rowId.replace(/^__deleted__(path|quiz)__/, "")
        );

        if (targetId) {
          if (deletedType === "learning_path") {
            inMemoryDeletedPaths.add(targetId);
          } else {
            inMemoryDeletedQuizzes.add(targetId);
          }

          if (!existingMap.has(targetId)) {
            existingMap.set(targetId, {
              id: targetId,
              type: deletedType,
              deletedAt: (meta.deletedAt as string) || new Date().toISOString(),
              deletedBy: (meta.deletedBy as string) || null,
            });
          }
        }
      }

      writeClientLocalStorage(Array.from(existingMap.values()));
    }
  } catch (err) {
    console.warn("[deletionRegistry] Notice syncing deleted records from Supabase:", err);
  } finally {
    lastDatabaseSyncTime = now;
  }
}

/**
 * Record a permanent deletion for a learning path or quiz.
 * Persists to:
 * 1. In-memory Set (microsecond retrieval)
 * 2. Browser localStorage (if browser)
 * 3. Supabase PostgreSQL database (authoritative across devices and sessions)
 */
export async function recordDeletedItem(
  type: DeletableItemType,
  targetId: string,
  options?: {
    userId?: string | null;
    client?: SupabaseClient;
  }
): Promise<boolean> {
  if (!targetId) return false;

  // 1. Update in-memory set immediately
  if (type === "learning_path") {
    inMemoryDeletedPaths.add(targetId);
  } else {
    inMemoryDeletedQuizzes.add(targetId);
  }

  const newEntry: DeletedRecordEntry = {
    id: targetId,
    type,
    deletedAt: new Date().toISOString(),
    deletedBy: options?.userId || null,
  };

  // 2. Persist locally in browser
  if (typeof window !== "undefined") {
    const list = readClientLocalStorage().filter((e) => e.id !== targetId);
    list.push(newEntry);
    writeClientLocalStorage(list);
  }

  // 3. Persist authoritatively to Supabase PostgreSQL database
  if (isSupabaseConfigured) {
    const dbClient = options?.client || supabase;
    const markerRowId = `__deleted__${type === "learning_path" ? "path" : "quiz"}__${targetId}`;

    try {
      const { error } = await dbClient.from("quizzes").upsert(
        {
          id: markerRowId,
          title: "[DELETED_RECORD]",
          status: "deleted",
          time_limit_minutes: 0,
          metadata: {
            deletedType: type,
            targetId,
            deletedAt: newEntry.deletedAt,
            deletedBy: newEntry.deletedBy,
          } as unknown as import("./database.types").Json,
        },
        { onConflict: "id" }
      );

      if (error) {
        console.warn("[deletionRegistry] Notice writing deletion marker to Supabase:", error.message);
      }
    } catch (err) {
      console.warn("[deletionRegistry] Exception writing deletion marker to Supabase:", err);
    }
  }

  return true;
}

/**
 * Returns a Set of all deleted IDs for the given item type.
 */
export async function getDeletedItemIds(
  type: DeletableItemType,
  client?: SupabaseClient
): Promise<Set<string>> {
  await syncDeletedRecordsFromDatabase(client);
  return type === "learning_path" ? inMemoryDeletedPaths : inMemoryDeletedQuizzes;
}

/**
 * Synchronous check for fast client-side rendering.
 */
export function isItemDeletedSync(
  id: string,
  type?: DeletableItemType
): boolean {
  if (!id) return false;
  if (id.startsWith("__deleted")) return true;

  if (type === "learning_path") {
    return inMemoryDeletedPaths.has(id);
  }
  if (type === "quiz") {
    return inMemoryDeletedQuizzes.has(id);
  }
  return inMemoryDeletedPaths.has(id) || inMemoryDeletedQuizzes.has(id);
}

/**
 * Asynchronous authoritative check for an item's deleted status.
 */
export async function isItemDeleted(
  id: string,
  type?: DeletableItemType,
  client?: SupabaseClient
): Promise<boolean> {
  if (!id) return false;
  if (id.startsWith("__deleted")) return true;

  if (isItemDeletedSync(id, type)) {
    return true;
  }

  await syncDeletedRecordsFromDatabase(client);
  return isItemDeletedSync(id, type);
}

/**
 * Purge in-memory deletion cache for testing purposes.
 */
export function clearDeletionRegistryForTesting(): void {
  inMemoryDeletedPaths.clear();
  inMemoryDeletedQuizzes.clear();
  lastDatabaseSyncTime = 0;
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {}
  }
}
