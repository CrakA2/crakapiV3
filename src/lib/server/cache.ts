import { LRUCache } from 'lru-cache';

type CacheValue = {
  data: unknown;
  isText: boolean;
};

type PendingRequest = Promise<CacheValue>;

const caches = {
  mmr: new LRUCache<string, CacheValue>({
    max: 2000,
    ttl: 60_000,
  }),
  account: new LRUCache<string, CacheValue>({
    max: 1000,
    ttl: 300_000,
  }),
  wl: new LRUCache<string, CacheValue>({
    max: 500,
    ttl: 120_000,
  }),
  matches: new LRUCache<string, CacheValue>({
    max: 200,
    ttl: 600_000,
  }),
  leaderboard: new LRUCache<string, CacheValue>({
    max: 20,
    ttl: 1800_000,
  }),
  hs: new LRUCache<string, CacheValue>({
    max: 500,
    ttl: 120_000,
  }),
  radiant: new LRUCache<string, CacheValue>({
    max: 500,
    ttl: 180_000,
  }),
  acs: new LRUCache<string, CacheValue>({
    max: 500,
    ttl: 120_000,
  }),
};

const pendingRequests = new Map<string, PendingRequest>();

export type CacheType = keyof typeof caches;

export function buildKey(type: string, ...parts: (string | undefined)[]): string {
  return [type, ...parts.filter(Boolean)].join(':');
}

export function get<T>(cacheType: CacheType, key: string): T | null {
  const cache = caches[cacheType];
  const entry = cache.get(key);
  if (entry) {
    return entry.data as T;
  }
  return null;
}

export function set(cacheType: CacheType, key: string, data: unknown, isText = false): void {
  const cache = caches[cacheType];
  cache.set(key, { data, isText });
}

export function getStats(): Record<CacheType, { size: number; max: number }> {
  const stats: Record<string, { size: number; max: number }> = {};
  for (const [name, cache] of Object.entries(caches)) {
    stats[name] = {
      size: cache.size,
      max: cache.max,
    };
  }
  return stats as Record<CacheType, { size: number; max: number }>;
}

export async function coalesce<T>(
  key: string,
  fetcher: () => Promise<T>,
  isText = false
): Promise<T> {
  const pending = pendingRequests.get(key);
  if (pending) {
    const result = await pending;
    return result.data as T;
  }

  const promise = (async (): Promise<CacheValue> => {
    try {
      const data = await fetcher();
      return { data, isText };
    } finally {
      pendingRequests.delete(key);
    }
  })();

  pendingRequests.set(key, promise);

  const result = await promise;
  return result.data as T;
}

export function clear(cacheType?: CacheType): void {
  if (cacheType) {
    caches[cacheType].clear();
  } else {
    for (const cache of Object.values(caches)) {
      cache.clear();
    }
  }
}
