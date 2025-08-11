/**
 * Utility for loading community data from remote (GitHub Pages or API)
 * with lightweight local caching as a placeholder until the GraphQL API is live.
 */
export async function loadCommunityData() {
  try {
    const debugMode = import.meta.env.WXT_DEBUG_MODE === 'true';
    const base = (import.meta.env.PUBLIC_PAGES_BASE_URL as string) || 'https://jonshaffer.github.io/wgu-extension';
    const unifiedUrl = `${base}/data/unified-community-data.json`;

    if (debugMode) {
      console.log('Community Data Remote Fetch:');
      console.log('- Base URL:', base);
      console.log('- Unified URL:', unifiedUrl);
    }

    const unifiedData = await fetchWithCache(unifiedUrl, 'unified-community-data', 24 * 60 * 60 * 1000);
    return { unifiedData };
    
  } catch (error) {
    console.warn('Failed to load unified community data remotely:', error);
    return { unifiedData: { discordServers: [], communities: {}, reddit: {}, wguConnect: {} } } as any;
  }
}

// Simple localStorage-based cache with TTL
async function fetchWithCache<T = any>(url: string, key: string, ttlMs: number): Promise<T> {
  try {
    const raw = localStorage.getItem(`cache:${key}`);
    if (raw) {
      const { ts, data } = JSON.parse(raw);
      if (Date.now() - ts < ttlMs) return data as T;
    }
  } catch {}

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  const data = await res.json();
  try { localStorage.setItem(`cache:${key}`, JSON.stringify({ ts: Date.now(), data })); } catch {}
  return data as T;
}
