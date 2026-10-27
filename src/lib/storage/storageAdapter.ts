/**
 * Pencill Storage Adapter
 * 
 * Versioned IndexedDB persistence layer with in-memory fallback for SSR and test environments.
 * Unified storage for drafts, savedPaths, recents, notifications, bookmarks, progress, and user taxonomy.
 * 
 * Ground Rule: Single source of persistence — zero scattered localStorage calls in UI components.
 */

export interface StorageNotification {
  id: string;
  type: 'draft_saved' | 'path_built' | 'feasibility_warning' | 'resource_gap' | 'info';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  link?: string;
}

export interface StorageRecentItem {
  id: string;
  type: 'topic' | 'course' | 'search';
  label: string;
  domainId?: string;
  subjectId?: string;
  timestamp: string;
}

export interface StorageBookmark {
  id: string;
  type: 'path' | 'module' | 'resource';
  title: string;
  pathId: string;
  moduleId?: string;
  resourceId?: string;
  url?: string;
  source?: string;
  createdAt: string;
}

export interface StorageProgress {
  pathId: string;
  completedLessonIds: string[];
  quizScores: Record<string, { score: number; total: number; date: string }>;
  flashcardState: Record<string, { known: boolean; reviewCount: number; nextReview: string }>;
  hoursLogged: number;
  lastAccessed: string;
}

export interface StorageUserProfile {
  id: string;
  name: string;
  email: string;
  grade: string;
  tier: string;
  avatarUrl: string;
}

const DB_NAME = 'pencill_learning_db';
const DB_VERSION = 1;

class StorageAdapter {
  private memoryStore: Map<string, any> = new Map();
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private isBrowser: boolean = typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

  constructor() {
    if (this.isBrowser) {
      this.initDB();
    }
  }

  private initDB(): Promise<IDBDatabase | null> {
    if (!this.isBrowser) return Promise.resolve(null);
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (e: IDBVersionChangeEvent) => {
          const db = (e.target as IDBOpenDBRequest).result;
          // Version 1 object stores
          if (!db.objectStoreNames.contains('drafts')) {
            db.createObjectStore('drafts', { keyPath: 'key' });
          }
          if (!db.objectStoreNames.contains('savedPaths')) {
            db.createObjectStore('savedPaths', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('recents')) {
            db.createObjectStore('recents', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('notifications')) {
            db.createObjectStore('notifications', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('bookmarks')) {
            db.createObjectStore('bookmarks', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('progress')) {
            db.createObjectStore('progress', { keyPath: 'pathId' });
          }
          if (!db.objectStoreNames.contains('appState')) {
            db.createObjectStore('appState', { keyPath: 'key' });
          }
          if (!db.objectStoreNames.contains('userTaxonomy')) {
            db.createObjectStore('userTaxonomy', { keyPath: 'id' });
          }
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          console.warn('[StorageAdapter] IndexedDB open error, falling back to in-memory store:', req.error);
          resolve(null);
        };
      } catch (err) {
        console.warn('[StorageAdapter] IndexedDB initialization failed:', err);
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore | null> {
    const db = await this.initDB();
    if (!db) return null;
    try {
      const tx = db.transaction(storeName, mode);
      return tx.objectStore(storeName);
    } catch {
      return null;
    }
  }

  // Generic key-value helpers with memory fallback
  private async idbGet<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
    const store = await this.getStore(storeName, 'readonly');
    if (!store) {
      return this.memoryStore.get(`${storeName}:${key}`) ?? null;
    }
    return new Promise((resolve) => {
      try {
        const req = store.get(key);
        req.onsuccess = () => resolve((req.result?.value ?? req.result) ?? null);
        req.onerror = () => resolve(this.memoryStore.get(`${storeName}:${key}`) ?? null);
      } catch {
        resolve(this.memoryStore.get(`${storeName}:${key}`) ?? null);
      }
    });
  }

  private async idbPut<T extends object>(storeName: string, record: T): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    if (!store) {
      const key = (record as any).key || (record as any).id || (record as any).pathId;
      this.memoryStore.set(`${storeName}:${key}`, record);
      return;
    }
    return new Promise((resolve) => {
      try {
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => {
          const key = (record as any).key || (record as any).id || (record as any).pathId;
          this.memoryStore.set(`${storeName}:${key}`, record);
          resolve();
        };
      } catch {
        const key = (record as any).key || (record as any).id || (record as any).pathId;
        this.memoryStore.set(`${storeName}:${key}`, record);
        resolve();
      }
    });
  }

  private async idbDelete(storeName: string, key: IDBValidKey): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    this.memoryStore.delete(`${storeName}:${key}`);
    if (!store) return;
    return new Promise((resolve) => {
      try {
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  private async idbGetAll<T>(storeName: string): Promise<T[]> {
    const store = await this.getStore(storeName, 'readonly');
    if (!store) {
      const results: T[] = [];
      const prefix = `${storeName}:`;
      for (const [k, v] of this.memoryStore.entries()) {
        if (k.startsWith(prefix)) results.push(v);
      }
      return results;
    }
    return new Promise((resolve) => {
      try {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  // --------------------------------------------------------------------------
  // Draft Management
  // --------------------------------------------------------------------------
  async getDraft<T>(key: string = 'builder_config_draft'): Promise<T | null> {
    const record = await this.idbGet<{ key: string; value: T; updatedAt: string }>('drafts', key);
    return record ? ((record as any).value ?? record) : null;
  }

  async saveDraft<T>(key: string = 'builder_config_draft', data: T): Promise<void> {
    await this.idbPut('drafts', {
      key,
      value: data,
      updatedAt: new Date().toISOString(),
    });
  }

  async clearDraft(key: string = 'builder_config_draft'): Promise<void> {
    await this.idbDelete('drafts', key);
  }

  // --------------------------------------------------------------------------
  // Saved Courses / Learning Paths
  // --------------------------------------------------------------------------
  async getSavedPaths(): Promise<any[]> {
    const list = await this.idbGetAll<any>('savedPaths');
    try {
      const { isItemDeletedSync } = require('@/services/supabase/deletionRegistry');
      return list.filter((p: any) => p && p.id && !isItemDeletedSync(p.id, 'learning_path'));
    } catch {
      return list;
    }
  }

  async getSavedPathById(id: string): Promise<any | null> {
    try {
      const { isItemDeletedSync } = require('@/services/supabase/deletionRegistry');
      if (isItemDeletedSync(id, 'learning_path')) return null;
    } catch {}
    return this.idbGet('savedPaths', id);
  }

  async savePath(path: any): Promise<void> {
    if (!path.id) path.id = `path-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    path.updatedAt = new Date().toISOString();
    await this.idbPut('savedPaths', path);
  }

  async deletePath(id: string): Promise<void> {
    await this.idbDelete('savedPaths', id);
  }

  async duplicatePath(id: string): Promise<any | null> {
    const existing = await this.getSavedPathById(id);
    if (!existing) return null;
    const duplicated = {
      ...existing,
      id: `path-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: `${existing.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.savePath(duplicated);
    return duplicated;
  }

  // --------------------------------------------------------------------------
  // Recents (Topics & Searches)
  // --------------------------------------------------------------------------
  async getRecents(): Promise<StorageRecentItem[]> {
    const list = await this.idbGetAll<StorageRecentItem>('recents');
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
  }

  async addRecent(item: Omit<StorageRecentItem, 'id' | 'timestamp'>): Promise<void> {
    const id = `recent-${item.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    await this.idbPut('recents', {
      ...item,
      id,
      timestamp: new Date().toISOString(),
    });
  }

  // --------------------------------------------------------------------------
  // Notifications
  // --------------------------------------------------------------------------
  async getNotifications(): Promise<StorageNotification[]> {
    const list = await this.idbGetAll<StorageNotification>('notifications');
    if (list.length === 0) {
      // Seed initial helpful notification
      const initial: StorageNotification = {
        id: 'notif-welcome',
        type: 'info',
        title: 'Universal Learning Path Builder Ready',
        message: 'Synthesize custom curricula across 12 academic domains and 90+ standardized examinations.',
        read: false,
        timestamp: new Date().toISOString(),
      };
      await this.addNotification(initial);
      return [initial];
    }
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async addNotification(notif: Omit<StorageNotification, 'id' | 'timestamp'> & { id?: string }): Promise<StorageNotification> {
    const full: StorageNotification = {
      ...notif,
      id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    await this.idbPut('notifications', full);
    return full;
  }

  async markAllNotificationsRead(): Promise<void> {
    const list = await this.getNotifications();
    for (const notif of list) {
      if (!notif.read) {
        await this.idbPut('notifications', { ...notif, read: true });
      }
    }
  }

  // --------------------------------------------------------------------------
  // Bookmarks
  // --------------------------------------------------------------------------
  async getBookmarks(): Promise<StorageBookmark[]> {
    return this.idbGetAll('bookmarks');
  }

  async addBookmark(bmark: Omit<StorageBookmark, 'id' | 'createdAt'>): Promise<StorageBookmark> {
    const id = `bmark-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const full: StorageBookmark = {
      ...bmark,
      id,
      createdAt: new Date().toISOString(),
    };
    await this.idbPut('bookmarks', full);
    return full;
  }

  async removeBookmark(id: string): Promise<void> {
    await this.idbDelete('bookmarks', id);
  }

  async isBookmarked(pathId: string, resourceId?: string): Promise<boolean> {
    const all = await this.getBookmarks();
    return all.some((b) => b.pathId === pathId && (!resourceId || b.resourceId === resourceId));
  }

  // --------------------------------------------------------------------------
  // Progress & Study Tracking
  // --------------------------------------------------------------------------
  async getProgress(pathId: string): Promise<StorageProgress | null> {
    return this.idbGet('progress', pathId);
  }

  async getAllProgress(): Promise<StorageProgress[]> {
    return this.idbGetAll('progress');
  }

  async updateProgress(pathId: string, update: Partial<StorageProgress>): Promise<StorageProgress> {
    const existing = (await this.getProgress(pathId)) || {
      pathId,
      completedLessonIds: [],
      quizScores: {},
      flashcardState: {},
      hoursLogged: 0,
      lastAccessed: new Date().toISOString(),
    };
    const merged: StorageProgress = {
      ...existing,
      ...update,
      lastAccessed: new Date().toISOString(),
    };
    await this.idbPut('progress', merged);
    return merged;
  }

  // --------------------------------------------------------------------------
  // User Taxonomy (Custom Subjects & Topics)
  // --------------------------------------------------------------------------
  async getUserTaxonomy(): Promise<Array<{ id: string; domainId: string; type: 'subject' | 'topic'; name: string }>> {
    return this.idbGetAll('userTaxonomy');
  }

  async saveCustomTaxonomyNode(node: { id: string; domainId: string; type: 'subject' | 'topic'; name: string }): Promise<void> {
    await this.idbPut('userTaxonomy', node);
  }

  // --------------------------------------------------------------------------
  // Local Profile & Session
  // --------------------------------------------------------------------------
  async getProfile(): Promise<StorageUserProfile> {
    const saved = await this.idbGet<StorageUserProfile>('appState', 'user_profile');
    if (saved) return saved;
    const defaultProfile: StorageUserProfile = {
      id: 'local-scholar-001',
      name: 'Aanya Patel',
      email: 'aanya.patel@scholars.pencill.edu',
      grade: 'Class 11 · JEE Aspirant',
      tier: 'Pro Path',
      avatarUrl: '/avatars/aanya-patel.png',
    };
    await this.saveProfile(defaultProfile);
    return defaultProfile;
  }

  async saveProfile(profile: StorageUserProfile): Promise<void> {
    await this.idbPut('appState', { key: 'user_profile', ...profile });
  }

  async clearSession(): Promise<void> {
    await this.idbDelete('appState', 'user_session');
  }
}

export const storageAdapter = new StorageAdapter();
