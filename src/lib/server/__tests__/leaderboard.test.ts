import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as cache from '$lib/server/cache';
import * as henrik from '$lib/server/henrik-client';
import {
  getCachedLeaderboard,
  warmLeaderboards,
  startLeaderboardWarmer,
} from '$lib/server/leaderboard';
import type { LeaderboardData, LeaderboardPlayer } from '$lib/types';

vi.mock('$lib/server/henrik-client', () => ({
  getLeaderboard: vi.fn(),
}));

const mockGetLeaderboard = vi.mocked(henrik.getLeaderboard);

function makeLeaderboard(): LeaderboardData {
  const players: LeaderboardPlayer[] = [
    { puuid: 'p1', name: 'a', tag: 't', leaderboard_rank: 1, tier: 27, rr: 900, wins: 100 },
    { puuid: 'p2', name: 'b', tag: 't', leaderboard_rank: 2, tier: 27, rr: 850, wins: 99 },
  ];
  return { players };
}

async function flush(): Promise<void> {
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 0));
  }
}

beforeEach(() => {
  cache.clear();
  mockGetLeaderboard.mockReset();
});

describe('getCachedLeaderboard', () => {
  it('calls henrik.getLeaderboard and returns the data', async () => {
    const data = makeLeaderboard();
    mockGetLeaderboard.mockResolvedValue(data);

    const result = await getCachedLeaderboard('na', 'pc');

    expect(result).toBe(data);
    expect(mockGetLeaderboard).toHaveBeenCalledTimes(1);
    expect(mockGetLeaderboard).toHaveBeenCalledWith('na', 'pc');
  });

  it('returns cached data on the second call without calling henrik again', async () => {
    const data = makeLeaderboard();
    mockGetLeaderboard.mockResolvedValue(data);

    await getCachedLeaderboard('na', 'pc');
    mockGetLeaderboard.mockClear();

    const result = await getCachedLeaderboard('na', 'pc');

    expect(result).toBe(data);
    expect(mockGetLeaderboard).not.toHaveBeenCalled();
  });
});

describe('warmLeaderboards', () => {
  it('iterates all 6 regions x 2 platforms (12 calls)', async () => {
    mockGetLeaderboard.mockResolvedValue(makeLeaderboard());

    warmLeaderboards();
    await flush();

    expect(mockGetLeaderboard).toHaveBeenCalledTimes(12);
    const keys = mockGetLeaderboard.mock.calls.map((c) => `${c[0]}:${c[1]}`);
    for (const region of ['na', 'eu', 'ap', 'kr', 'latam', 'br']) {
      expect(keys).toContain(`${region}:pc`);
      expect(keys).toContain(`${region}:console`);
    }
  });
});

describe('startLeaderboardWarmer', () => {
  it('is guarded and starts only one interval', () => {
    vi.useFakeTimers();
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');

    mockGetLeaderboard.mockResolvedValue(makeLeaderboard());

    startLeaderboardWarmer(1000);
    startLeaderboardWarmer(1000);

    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('swallows failures from warmLeaderboards', async () => {
    vi.resetModules();
    const freshLeaderboard = await import('$lib/server/leaderboard');
    vi.useFakeTimers();
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');

    mockGetLeaderboard.mockRejectedValue(new Error('boom'));

    expect(() => freshLeaderboard.startLeaderboardWarmer(1000)).not.toThrow();
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
