interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface CacheConfig {
  defaultTtlMs?: number; // Default: 15 minutes (900,000ms)
  maxEntries?: number;   // Default: 300
}

/**
 * In-memory provider cache with TTL expiration and LRU-style size bounding.
 */
export class InMemoryCache<T> {
  private readonly defaultTtlMs: number;
  private readonly maxEntries: number;
  private readonly store: Map<string, CacheEntry<T>> = new Map();

  constructor(config: CacheConfig = {}) {
    this.defaultTtlMs = config.defaultTtlMs ?? 15 * 60 * 1000;
    this.maxEntries = config.maxEntries ?? 300;
  }

  public get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    // Refresh position for LRU
    this.store.delete(key);
    this.store.set(key, entry);

    return entry.value;
  }

  public set(key: string, value: T, ttlMs?: number): void {
    if (this.store.size >= this.maxEntries) {
      // Evict oldest entry
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) {
        this.store.delete(oldestKey);
      }
    }

    const ttl = ttlMs ?? this.defaultTtlMs;
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  public delete(key: string): boolean {
    return this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
  }

  public size(): number {
    return this.store.size;
  }

  /**
   * Generates a stable deterministic cache key from query parameters.
   */
  public static createKey(provider: string, params: Record<string, unknown>): string {
    const sortedKeys = Object.keys(params).sort();
    const parts = sortedKeys.map((k) => {
      const val = params[k];
      return `${k}=${Array.isArray(val) ? val.slice().sort().join(',') : String(val ?? '')}`;
    });
    return `${provider}:${parts.join('&')}`.toLowerCase();
  }
}
