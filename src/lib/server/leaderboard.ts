import { building } from '$app/environment';
import * as cache from '$lib/server/cache';
import * as henrik from '$lib/server/henrik-client';
import type { LeaderboardData, Region } from '$lib/types';

const REGIONS: Region[] = ['na', 'eu', 'ap', 'kr', 'latam', 'br'];
const PLATFORMS = ['pc', 'console'];

const WARM_INTERVAL_MS = 9 * 60_000;

/**
 * Cached leaderboard accessor. The leaderboard is intentionally allowed to be
 * slightly stale (10 minute TTL, warmed in the background) since it does not
 * need to be perfectly accurate for the Radiant calculations.
 */
export async function getCachedLeaderboard(
  region: string,
  platform = 'pc'
): Promise<LeaderboardData> {
  const key = cache.buildKey('leaderboard', region, platform);

  const cached = cache.get<LeaderboardData>('leaderboard', key);
  if (cached) return cached;

  return cache.coalesce(key, async () => {
    const data = await henrik.getLeaderboard(region, platform);
    cache.set('leaderboard', key, data);
    return data;
  });
}

function warmRegion(region: Region, platform: string): Promise<void> {
  return getCachedLeaderboard(region, platform)
    .then(() => undefined)
    .catch(() => undefined);
}

/** Fire-and-forget refresh of every region/platform combination. */
export function warmLeaderboards(): void {
  for (const region of REGIONS) {
    for (const platform of PLATFORMS) {
      void warmRegion(region, platform);
    }
  }
}

let started = false;

/**
 * In PM2 cluster mode (`instances: max`) every worker is a separate process with
 * its own cache, so we only run the background warmer on a single instance to
 * avoid Nx duplicate upstream leaderboard fetches. Each worker still self-caches
 * the leaderboard on first miss via getCachedLeaderboard.
 */
function shouldRunWarmer(): boolean {
  const instanceId = process.env.NODE_APP_INSTANCE ?? process.env.pm_id;
  return instanceId === undefined || instanceId === '0';
}

/** Starts a background interval that keeps leaderboards warm. Safe to call repeatedly. */
export function startLeaderboardWarmer(intervalMs = WARM_INTERVAL_MS): void {
  if (started || building || !shouldRunWarmer()) return;
  started = true;

  warmLeaderboards();
  setInterval(warmLeaderboards, intervalMs);
}
