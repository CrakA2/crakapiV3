import { describe, it, expect } from 'vitest';
import {
  formatRadiantRR,
  formatLeaderboardRank,
  formatWinLoss,
  formatMMR,
  regionToName,
} from '$lib/server/formatters';
import type { Account, MMRData, WinLossResult } from '$lib/types';

describe('formatRadiantRR', () => {
  it('returns a message when the player is radiant', () => {
    expect(formatRadiantRR(0, true, true)).toBe('Player is Radiant');
  });

  it('returns a message when the player is not immortal', () => {
    expect(formatRadiantRR(null, false, false)).toBe('Player is not Immortal');
  });

  it('returns unable to calculate when rrNeeded is null but immortal', () => {
    expect(formatRadiantRR(null, false, true)).toBe('Unable to calculate');
  });

  it('formats rr needed to radiant', () => {
    expect(formatRadiantRR(150, false, true)).toBe('150RR to Radiant');
  });
});

describe('formatLeaderboardRank', () => {
  it('returns not on leaderboard for null', () => {
    expect(formatLeaderboardRank(null)).toBe('Not on leaderboard');
  });

  it('formats the rank with thousands separator', () => {
    expect(formatLeaderboardRank(1234)).toBe('Rank #1,234');
  });
});

describe('formatWinLoss', () => {
  it('includes draws only when present', () => {
    const withDraws: WinLossResult = { wins: 5, losses: 2, draws: 1, streak: ['W', 'L', 'D'], text: '' };
    const noDraws: WinLossResult = { wins: 5, losses: 2, draws: 0, streak: ['W', 'L'], text: '' };
    expect(formatWinLoss(withDraws)).toBe('W5 L2 D1 (WLD)');
    expect(formatWinLoss(noDraws)).toBe('W5 L2 (WL)');
  });
});

describe('formatMMR', () => {
  it('formats positive change with a plus sign', () => {
    const mmr: MMRData = {
      current: {
        tier: { id: 24, name: 'Immortal 3', short: 'I3' },
        rr: 120,
        last_change: 15,
      },
    } as unknown as MMRData;
    expect(formatMMR(mmr)).toBe('Immortal 3 - 120RR (+15)');
  });

  it('formats negative change without an extra sign', () => {
    const mmr: MMRData = {
      current: {
        tier: { id: 24, name: 'Immortal 3', short: 'I3' },
        rr: 120,
        last_change: -10,
      },
    } as unknown as MMRData;
    expect(formatMMR(mmr)).toBe('Immortal 3 - 120RR (-10)');
  });
});

describe('regionToName', () => {
  it('maps known regions to full names', () => {
    expect(regionToName('na')).toBe('North America');
    expect(regionToName('EU')).toBe('Europe');
    expect(regionToName('ap')).toBe('Asia-Pacific');
    expect(regionToName('kr')).toBe('Korea');
    expect(regionToName('latam')).toBe('Latin America');
    expect(regionToName('br')).toBe('Brazil');
  });

  it('falls back to uppercase for unknown regions', () => {
    expect(regionToName('xx')).toBe('XX');
  });
});
