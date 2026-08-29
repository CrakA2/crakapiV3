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

/** Starts a background interval that keeps leaderboards warm. Safe to call repeatedly. */
export function startLeaderboardWarmer(intervalMs = WARM_INTERVAL_MS): void {
  if (started || building) return;
  started = true;

  warmLeaderboards();
  setInterval(warmLeaderboards, intervalMs);
}
