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

export interface SpacedCardRecord {
  id: string;
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  concept: string;
  prompt: string;
  solution: string;
  cardType: 'flashcard' | 'formula' | 'quiz_revisit' | 'concept';
  stability: number; // in days
  difficulty: number; // 1-10
  repetitions: number;
  lapses: number;
  lastRating?: number;
  dueDate: string; // ISO
  lastReviewedAt?: string;
  createdAt: string;
}

export interface DiscussionRecord {
  id: string;
  userId?: string | null;
  authorName: string;
  authorAvatar?: string;
  courseId?: string;
  lessonId?: string;
  domain: string;
  title: string;
  content: string;
  tags: string[];
  upvotes: number;
  upvoterUserIds?: string[];
  replyCount: number;
  isSolved: boolean;
  isReported?: boolean;
  reportReason?: string;
  replies?: Array<{
    id: string;
    userId?: string | null;
    authorName: string;
    authorAvatar?: string;
    content: string;
    upvotes: number;
    upvoterUserIds?: string[];
    isAcceptedAnswer?: boolean;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt?: string;
}

export function isMockOrSeedDiscussion(record: any): boolean {
  if (!record) return true;
  const id = String(record.id || '').toLowerCase();
  const author = String(record.authorName || '').toLowerCase().trim();
  const title = String(record.title || '').toLowerCase().trim();

  // 1. Synthetic ID patterns
  if (
    id.startsWith('disc-seed') ||
    id.startsWith('mock-') ||
    id.includes('seed-') ||
    id === 'seed' ||
    id.startsWith('demo-')
  ) {
    return true;
  }

  // 2. Known mock / placeholder author names
  const mockAuthors = [
    'aarav sharma',
    'priya nair',
    'dr. elena rostova',
    'rohan verma',
    'ananya iyer',
    'demo scholar',
    'test dummy',
    'fake user',
    'placeholder',
    'john doe',
    'jane doe',
  ];
  if (mockAuthors.includes(author)) {
    return true;
  }

  // 3. Known mock questions / sample titles
  if (
    title.includes('schrödinger equation') ||
    title.includes('schrodinger equation') ||
    title.includes('graph neural networks pruning') ||
    title.includes('sample discussion') ||
    title.includes('mock question') ||
    title.includes('placeholder discussion')
  ) {
    return true;
  }

  return false;
}

export interface LearnerCredentialRecord {
  id: string;
  userId?: string | null;
  courseId: string;
  courseTitle: string;
  domain: string;
  credentialType: 'course_certificate' | 'skill_badge' | 'checkpoint_honors';
  title: string;
  verificationHash: string;
  scorePercentage: number;
  criteriaMet: string[];
  issuedAt: string;
}

const DB_BASE_NAME = 'pencill_user_db';
const DB_VERSION = 2;

class StorageAdapter {
  private activeUserScope: string = 'guest';
  private memoryStore: Map<string, any> = new Map();
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private currentDb: IDBDatabase | null = null;
  private isBrowser: boolean = typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

  constructor() {
    if (this.isBrowser) {
      // Purge old un-scoped legacy database so previous accounts do not leak
      try {
        window.indexedDB.deleteDatabase('pencill_learning_db');
      } catch {}
      this.initDB();
    }
  }

  public getDbName(): string {
    const scope = this.activeUserScope ? this.activeUserScope.trim() : 'guest';
    return `${DB_BASE_NAME}_${scope}`;
  }

  public setUserScope(userId: string | null): void {
    const nextScope = userId && userId.trim() ? userId.trim() : 'guest';
    if (this.activeUserScope === nextScope && this.dbPromise !== null) return;

    this.activeUserScope = nextScope;
    if (this.currentDb) {
      try {
        this.currentDb.close();
      } catch {}
      this.currentDb = null;
    }
    this.dbPromise = null;

    if (this.isBrowser) {
      this.initDB();
    }
  }

  public getActiveUserScope(): string {
    return this.activeUserScope;
  }

  private initDB(): Promise<IDBDatabase | null> {
    if (!this.isBrowser) return Promise.resolve(null);
    if (this.dbPromise) return this.dbPromise;

    const dbName = this.getDbName();
    this.dbPromise = new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(dbName, DB_VERSION);

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
          // Version 2 object stores
          if (!db.objectStoreNames.contains('spacedCards')) {
            db.createObjectStore('spacedCards', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('discussions')) {
            db.createObjectStore('discussions', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('credentials')) {
            db.createObjectStore('credentials', { keyPath: 'id' });
          }
        };

        req.onsuccess = () => {
          this.currentDb = req.result;
          resolve(req.result);
        };
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
      return this.memoryStore.get(`${this.activeUserScope}:${storeName}:${key}`) ?? null;
    }
    return new Promise((resolve) => {
      try {
        const req = store.get(key);
        req.onsuccess = () => resolve((req.result?.value ?? req.result) ?? null);
        req.onerror = () => resolve(this.memoryStore.get(`${this.activeUserScope}:${storeName}:${key}`) ?? null);
      } catch {
        resolve(this.memoryStore.get(`${this.activeUserScope}:${storeName}:${key}`) ?? null);
      }
    });
  }

  private async idbPut<T extends object>(storeName: string, record: T): Promise<void> {
    const key = (record as any).key || (record as any).id || (record as any).pathId;
    this.memoryStore.set(`${this.activeUserScope}:${storeName}:${key}`, record);
    const store = await this.getStore(storeName, 'readwrite');
    if (!store) return;
    return new Promise((resolve) => {
      try {
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  private async idbDelete(storeName: string, key: IDBValidKey): Promise<void> {
    this.memoryStore.delete(`${this.activeUserScope}:${storeName}:${key}`);
    const store = await this.getStore(storeName, 'readwrite');
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
      const prefix = `${this.activeUserScope}:${storeName}:`;
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

  async clearCurrentUserData(): Promise<void> {
    const prefix = `${this.activeUserScope}:`;
    for (const k of Array.from(this.memoryStore.keys())) {
      if (k.startsWith(prefix)) {
        this.memoryStore.delete(k);
      }
    }
    if (!this.isBrowser) return;
    const db = await this.initDB();
    if (db) {
      const storeNames = Array.from(db.objectStoreNames);
      for (const s of storeNames) {
        await this.idbClear(s);
      }
    }
  }

  async idbClear(storeName: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    if (!store) return;
    return new Promise((resolve) => {
      try {
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
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
      id: 'local-scholar-guest',
      name: 'Pencill Scholar',
      email: 'scholar@pencill.app',
      grade: 'Self-Paced Learner',
      tier: 'Standard',
      avatarUrl: '/avatars/default-avatar.svg',
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

  async getAppState<T>(key: string): Promise<T | null> {
    const record = await this.idbGet<any>('appState', key);
    return record?.value ?? record ?? null;
  }

  async saveAppState<T>(key: string, value: T): Promise<void> {
    await this.idbPut('appState', { key, value });
  }

  // --------------------------------------------------------------------------
  // Generated Reading Materials (Offline / In-Memory Fallback)
  // --------------------------------------------------------------------------
  async saveReadingMaterial(material: any): Promise<void> {
    if (!material?.id) return;
    this.memoryStore.set(`reading:${material.id}`, material);
    if (material.lessonId) {
      this.memoryStore.set(`reading:lesson:${material.lessonId}`, material);
    }
    await this.idbPut('appState', { key: `reading_${material.id}`, value: material });
    if (material.lessonId) {
      await this.idbPut('appState', { key: `reading_lesson_${material.lessonId}`, value: material });
    }
  }

  async getReadingMaterialById(id: string): Promise<any | null> {
    if (!id) return null;
    const mem = this.memoryStore.get(`reading:${id}`);
    if (mem) return mem;
    const wrapped = await this.idbGet<{ key: string; value: any }>('appState', `reading_${id}`);
    return wrapped ? wrapped.value : null;
  }

  async getReadingMaterialByLesson(lessonId: string): Promise<any | null> {
    if (!lessonId) return null;
    const mem = this.memoryStore.get(`reading:lesson:${lessonId}`);
    if (mem) return mem;
    const wrapped = await this.idbGet<{ key: string; value: any }>('appState', `reading_lesson_${lessonId}`);
    return wrapped ? wrapped.value : null;
  }

  // --------------------------------------------------------------------------
  // Spaced Repetition Flashcards & Memory Science
  // --------------------------------------------------------------------------
  async getSpacedCards(): Promise<SpacedCardRecord[]> {
    return this.idbGetAll<SpacedCardRecord>('spacedCards');
  }

  async saveSpacedCard(card: SpacedCardRecord): Promise<void> {
    await this.idbPut('spacedCards', card);
  }

  async saveSpacedCards(cards: SpacedCardRecord[]): Promise<void> {
    for (const card of cards) {
      await this.idbPut('spacedCards', card);
    }
  }

  async updateSpacedCard(id: string, updates: Partial<SpacedCardRecord>): Promise<SpacedCardRecord | null> {
    const existing = await this.idbGet<SpacedCardRecord>('spacedCards', id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    await this.idbPut('spacedCards', updated);
    return updated;
  }

  // --------------------------------------------------------------------------
  // Community Discussions & Collaborative Threads
  // --------------------------------------------------------------------------
  async getDiscussions(): Promise<DiscussionRecord[]> {
    const all = await this.idbGetAll<DiscussionRecord>('discussions');
    const genuine: DiscussionRecord[] = [];
    const purgeIds: string[] = [];

    for (const d of all) {
      if (isMockOrSeedDiscussion(d)) {
        purgeIds.push(d.id);
      } else {
        // Sanitize replies within genuine discussions as well
        if (d.replies && Array.isArray(d.replies)) {
          d.replies = d.replies.filter((r) => {
            const rId = String(r.id || '').toLowerCase();
            const rAuthor = String(r.authorName || '').toLowerCase().trim();
            if (rId.startsWith('rep-seed') || rId.startsWith('mock-')) return false;
            const mockAuthors = ['aarav sharma', 'priya nair', 'dr. elena rostova', 'rohan verma', 'ananya iyer', 'demo scholar'];
            return !mockAuthors.includes(rAuthor);
          });
          d.replyCount = d.replies.length;
        }
        genuine.push(d);
      }
    }

    // Proactively purge mock records from IndexedDB so they never resurface
    if (purgeIds.length > 0) {
      for (const purgeId of purgeIds) {
        try {
          await this.idbDelete('discussions', purgeId);
        } catch {
          // ignore cleanup errors
        }
      }
    }

    // Purge any legacy localStorage keys if in browser
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('pencill_seed_discussions');
        localStorage.removeItem('pencill_mock_discussions');
      } catch {}
    }

    return genuine;
  }

  async purgeMockDiscussions(): Promise<number> {
    const all = await this.idbGetAll<DiscussionRecord>('discussions');
    let purgedCount = 0;
    for (const d of all) {
      if (isMockOrSeedDiscussion(d)) {
        await this.idbDelete('discussions', d.id);
        purgedCount++;
      }
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('pencill_seed_discussions');
        localStorage.removeItem('pencill_mock_discussions');
      } catch {}
    }
    return purgedCount;
  }

  async saveDiscussion(disc: DiscussionRecord): Promise<void> {
    await this.idbPut('discussions', disc);
  }

  async updateDiscussion(id: string, updates: Partial<DiscussionRecord>): Promise<DiscussionRecord | null> {
    const existing = await this.idbGet<DiscussionRecord>('discussions', id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await this.idbPut('discussions', updated);
    return updated;
  }

  async deleteDiscussion(id: string): Promise<void> {
    await this.idbDelete('discussions', id);
  }

  async toggleDiscussionUpvote(id: string, userId: string): Promise<DiscussionRecord | null> {
    const existing = await this.idbGet<DiscussionRecord>('discussions', id);
    if (!existing) return null;
    const upvoters = new Set(existing.upvoterUserIds || []);
    let upvotes = existing.upvotes || 0;
    if (upvoters.has(userId)) {
      upvoters.delete(userId);
      upvotes = Math.max(0, upvotes - 1);
    } else {
      upvoters.add(userId);
      upvotes += 1;
    }
    const updated = {
      ...existing,
      upvotes,
      upvoterUserIds: Array.from(upvoters),
    };
    await this.idbPut('discussions', updated);
    return updated;
  }

  async addDiscussionReply(
    discussionId: string,
    reply: {
      id: string;
      userId?: string | null;
      authorName: string;
      authorAvatar?: string;
      content: string;
      upvotes: number;
      upvoterUserIds?: string[];
      isAcceptedAnswer?: boolean;
      createdAt: string;
    }
  ): Promise<DiscussionRecord | null> {
    const existing = await this.idbGet<DiscussionRecord>('discussions', discussionId);
    if (!existing) return null;
    const replies = existing.replies || [];
    replies.push(reply);
    const updated: DiscussionRecord = {
      ...existing,
      replyCount: replies.length,
      replies,
    };
    await this.idbPut('discussions', updated);
    return updated;
  }

  async toggleReplyUpvote(discussionId: string, replyId: string, userId: string): Promise<DiscussionRecord | null> {
    const existing = await this.idbGet<DiscussionRecord>('discussions', discussionId);
    if (!existing || !existing.replies) return null;
    const updatedReplies = existing.replies.map((rep) => {
      if (rep.id !== replyId) return rep;
      const upvoters = new Set(rep.upvoterUserIds || []);
      let upvotes = rep.upvotes || 0;
      if (upvoters.has(userId)) {
        upvoters.delete(userId);
        upvotes = Math.max(0, upvotes - 1);
      } else {
        upvoters.add(userId);
        upvotes += 1;
      }
      return {
        ...rep,
        upvotes,
        upvoterUserIds: Array.from(upvoters),
      };
    });
    const updated = { ...existing, replies: updatedReplies };
    await this.idbPut('discussions', updated);
    return updated;
  }

  async deleteDiscussionReply(discussionId: string, replyId: string): Promise<DiscussionRecord | null> {
    const existing = await this.idbGet<DiscussionRecord>('discussions', discussionId);
    if (!existing || !existing.replies) return null;
    const updatedReplies = existing.replies.filter((r) => r.id !== replyId);
    const updated = {
      ...existing,
      replyCount: updatedReplies.length,
      replies: updatedReplies,
    };
    await this.idbPut('discussions', updated);
    return updated;
  }

  async reportDiscussion(id: string, reason: string): Promise<void> {
    const existing = await this.idbGet<DiscussionRecord>('discussions', id);
    if (!existing) return;
    const updated: DiscussionRecord = {
      ...existing,
      isReported: true,
      reportReason: reason,
    };
    await this.idbPut('discussions', updated);
  }

  // --------------------------------------------------------------------------
  // Verified Learner Credentials & Skill Badges
  // --------------------------------------------------------------------------
  async getCredentials(): Promise<LearnerCredentialRecord[]> {
    return this.idbGetAll<LearnerCredentialRecord>('credentials');
  }

  async saveCredential(cred: LearnerCredentialRecord): Promise<void> {
    await this.idbPut('credentials', cred);
  }
}

export const storageAdapter = new StorageAdapter();
