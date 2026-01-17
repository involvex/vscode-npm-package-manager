interface CacheEntry<T> {
  data: T;
  expires: number;
}

export class RegistryCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  constructor(private ttlMinutes: number = 30) {}

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry || Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.ttlMinutes * 60 * 1000,
    });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.expires) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}
