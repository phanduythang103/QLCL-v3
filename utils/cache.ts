/**
 * Client-side caching utility for static/rarely-changing data
 * Reduces API calls and improves load time for reference data
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

// Cache storage
const cache = new Map<string, CacheEntry<any>>();

// Default TTL: 5 minutes for static data
const DEFAULT_TTL = 5 * 60 * 1000;

// Longer TTL for very static data like danh mục
const STATIC_DATA_TTL = 15 * 60 * 1000;

/**
 * Fetch data with caching support
 * @param key Unique cache key
 * @param fetcher Function that fetches the data
 * @param ttl Time-to-live in milliseconds (default: 5 minutes)
 */
export async function cachedFetch<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl: number = DEFAULT_TTL
): Promise<T> {
    const cached = cache.get(key);
    
    // Return cached data if valid
    if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.data;
    }
    
    // Fetch fresh data
    const data = await fetcher();
    cache.set(key, { data, timestamp: Date.now() });
    return data;
}

/**
 * Invalidate specific cache entry
 */
export function invalidateCache(key: string): void {
    cache.delete(key);
}

/**
 * Invalidate all cache entries matching a prefix
 */
export function invalidateCacheByPrefix(prefix: string): void {
    for (const key of cache.keys()) {
        if (key.startsWith(prefix)) {
            cache.delete(key);
        }
    }
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
    cache.clear();
}

/**
 * Get cache status for debugging
 */
export function getCacheStatus(): { key: string; age: number; expired: boolean }[] {
    const now = Date.now();
    return Array.from(cache.entries()).map(([key, entry]) => ({
        key,
        age: Math.round((now - entry.timestamp) / 1000),
        expired: now - entry.timestamp > DEFAULT_TTL
    }));
}

// Predefined cache keys for consistency
export const CACHE_KEYS = {
    DM_DON_VI: 'dm_don_vi',
    DM_CAP_BAC: 'dm_cap_bac',
    DM_CHUC_VU: 'dm_chuc_vu',
    DM_VAI_TRO_QLCL: 'dm_vai_tro_qlcl',
    CO_QUAN_BAN_HANH: 'co_quan_ban_hanh',
    DATA_83: 'data_83',
    USERS: 'users',
} as const;

// Export TTL constants for use in API files
export { DEFAULT_TTL, STATIC_DATA_TTL };
