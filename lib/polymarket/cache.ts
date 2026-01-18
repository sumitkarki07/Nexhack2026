/**
 * Enhanced in-memory cache with TTL, single-flight dedupe, and stale-while-revalidate
 * Reduces API calls and improves performance for Polymarket API responses
 */

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  expiresAt: number;
  staleAt: number; // When data becomes stale but still usable
}

type CacheStatus = 'HIT' | 'MISS' | 'STALE';

interface CacheResult<T> {
  data: T | null;
  status: CacheStatus;
  fetchedAt: number | null;
}

// In-flight request tracking for single-flight dedupe
const inFlightRequests = new Map<string, Promise<unknown>>();

class EnhancedCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize = 500;

  /**
   * Get cached data with status information
   */
  getWithStatus<T>(key: string): CacheResult<T> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return { data: null, status: 'MISS', fetchedAt: null };
    }

    const now = Date.now();

    // Data is completely expired
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return { data: null, status: 'MISS', fetchedAt: null };
    }

    // Data is stale but still usable
    if (now > entry.staleAt) {
      return { data: entry.data, status: 'STALE', fetchedAt: entry.fetchedAt };
    }

    // Data is fresh
    return { data: entry.data, status: 'HIT', fetchedAt: entry.fetchedAt };
  }

  /**
   * Simple get (returns null if expired)
   */
  get<T>(key: string): T | null {
    const result = this.getWithStatus<T>(key);
    // Return stale data as well for backward compatibility
    return result.data;
  }

  /**
   * Set cache entry with TTL and stale time
   * @param staleTtlMs - Time until data becomes stale (can still be returned)
   * @param expireTtlMs - Time until data is completely removed (default: staleTtlMs * 3)
   */
  set<T>(key: string, data: T, staleTtlMs: number, expireTtlMs?: number): void {
    // Clean up expired entries if cache is getting large
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    const now = Date.now();
    this.cache.set(key, {
      data,
      fetchedAt: now,
      staleAt: now + staleTtlMs,
      expiresAt: now + (expireTtlMs ?? staleTtlMs * 3),
    });
  }

  /**
   * Delete a specific key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    inFlightRequests.clear();
    console.log('[Cache] Cleared all entries');
  }

  /**
   * Clear entries matching a pattern
   */
  clearPattern(pattern: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`[Cache] Cleared ${keysToDelete.length} entries matching "${pattern}"`);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));

    // If still too large, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].fetchedAt - b[1].fetchedAt);
      const toRemove = entries.slice(0, Math.floor(this.maxSize / 4));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
export const apiCache = new EnhancedCache();

// Cache TTL values (in milliseconds)
// Stale times - data is considered stale after this but still usable
export const CACHE_TTL = {
  MARKETS_LIST: 30 * 1000,      // 30 seconds - fresh data for listing
  MARKETS_ALL: 2 * 60 * 1000,   // 2 minutes - full dataset cache (unused in fast path)
  MARKETS_ALL_COUNT: 5 * 60 * 1000, // 5 minutes - total count cache
  MARKET_DETAIL: 15 * 1000,     // 15 seconds - single market
  PRICE_HISTORY: 60 * 1000,     // 1 minute - history data
  ORDERBOOK: 5 * 1000,          // 5 seconds - very fresh
  CURRENT_PRICE: 5 * 1000,      // 5 seconds
  TAGS: 10 * 60 * 1000,         // 10 minutes - stable
  CLOB_ENRICHMENT: 10 * 1000,   // 10 seconds - CLOB data refresh
};

/**
 * Generate cache keys from parts
 */
export function cacheKey(...parts: (string | number | undefined | null)[]): string {
  return parts
    .filter(p => p !== undefined && p !== null && p !== '')
    .map(p => String(p).toLowerCase().trim())
    .join(':');
}

/**
 * Single-flight dedupe: ensures only one request is in-flight for a given key
 * Multiple callers waiting for the same data will receive the same Promise
 */
export async function singleFlight<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // Check if request is already in-flight
  const existingRequest = inFlightRequests.get(key);
  if (existingRequest) {
    console.log(`[SingleFlight] Awaiting existing request for: ${key}`);
    return existingRequest as Promise<T>;
  }

  // Start new request
  console.log(`[SingleFlight] Starting new request for: ${key}`);
  const promise = fetcher()
    .finally(() => {
      // Clean up in-flight tracking when done
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, promise);
  return promise;
}

/**
 * Stale-while-revalidate pattern:
 * - Returns stale data immediately if available
 * - Triggers background refresh
 * - Callers get fast response with reasonably fresh data
 */
export async function staleWhileRevalidate<T>(
  key: string,
  fetcher: () => Promise<T>,
  staleTtlMs: number = CACHE_TTL.MARKETS_LIST
): Promise<{ data: T; status: CacheStatus; fetchedAt: number }> {
  const cached = apiCache.getWithStatus<T>(key);

  // Fresh cache hit - return immediately
  if (cached.status === 'HIT' && cached.data !== null) {
    return {
      data: cached.data,
      status: 'HIT',
      fetchedAt: cached.fetchedAt!,
    };
  }

  // Stale data available - return immediately and refresh in background
  if (cached.status === 'STALE' && cached.data !== null) {
    // Trigger background refresh (don't await)
    singleFlight(key, async () => {
      try {
        const freshData = await fetcher();
        apiCache.set(key, freshData, staleTtlMs);
        console.log(`[SWR] Background refresh completed for: ${key}`);
        return freshData;
      } catch (error) {
        console.error(`[SWR] Background refresh failed for ${key}:`, error);
        throw error;
      }
    }).catch(() => {
      // Silently handle background refresh errors
    });

    return {
      data: cached.data,
      status: 'STALE',
      fetchedAt: cached.fetchedAt!,
    };
  }

  // Cache miss - fetch synchronously with single-flight
  const startTime = Date.now();
  const data = await singleFlight(key, fetcher);
  apiCache.set(key, data, staleTtlMs);
  
  return {
    data,
    status: 'MISS',
    fetchedAt: startTime,
  };
}

/**
 * Simple p-limit implementation for concurrency control
 * Limits concurrent async operations without external dependencies
 */
export function createPLimit(concurrency: number) {
  const queue: Array<{
    fn: () => Promise<unknown>;
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
  }> = [];
  let activeCount = 0;

  const next = () => {
    if (activeCount >= concurrency || queue.length === 0) {
      return;
    }

    const { fn, resolve, reject } = queue.shift()!;
    activeCount++;

    fn()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        activeCount--;
        next();
      });
  };

  return <T>(fn: () => Promise<T>): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      queue.push({
        fn: fn as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      next();
    });
  };
}

// Pre-created limiters for common use cases
export const clobLimiter = createPLimit(5); // Limit CLOB API to 5 concurrent requests
export const gammaLimiter = createPLimit(3); // Limit Gamma API to 3 concurrent requests
