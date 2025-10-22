/**
 * Simple caching wrapper for GraphQL requests
 */

const cache = new Map<string, { data: any; timestamp: number }>();

/**
 * Create a cached version of a function
 * @param fn The function to cache
 * @param ttl Time to live in milliseconds
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  ttl: number
): T {
  return (async (...args: Parameters<T>) => {
    const key = JSON.stringify({ fn: fn.name, args });
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    
    const data = await fn(...args);
    cache.set(key, { data, timestamp: Date.now() });
    
    return data;
  }) as T;
}

/**
 * Clear the cache
 */
export function clearCache() {
  cache.clear();
}