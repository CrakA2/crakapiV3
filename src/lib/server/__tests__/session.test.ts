import { describe, it, expect } from 'vitest';
import {
  getRadiantThresholdRR,
  calculateWinLoss,
  calculateKDA,
  calculateHeadshotPercent,
  calculateACS,
  calculateMMRToRadiant,
} from '$lib/server/session';
import type { LeaderboardPlayer, Match } from '$lib/types';

const RADIANT = 27;

function makePlayer(rank: number, tier: number, rr: number): LeaderboardPlayer {
  return {
    puuid: `puuid-${rank}`,
    name: `name-${rank}`,
    tag: 'tag',
    leaderboard_rank: rank,
    tier,
    rr,
    wins: 10,
  };
}

describe('getRadiantThresholdRR', () => {
  it('returns null for an empty array', () => {
    expect(getRadiantThresholdRR([])).toBeNull();
  });

  it('returns the RR of the lowest-ranked radiant (last tier-27 player)', () => {
    const players = [
      makePlayer(1, RADIANT, 900),
      makePlayer(2, RADIANT, 850),
      makePlayer(3, RADIANT, 800),
      makePlayer(4, RADIANT, 750),
      makePlayer(5, RADIANT, 700),
    ];
    expect(getRadiantThresholdRR(players)).toBe(700);
  });

  it('returns the radiant cutoff (rank 300 rr) when rank 500 is NOT radiant', () => {
    const players: LeaderboardPlayer[] = [];
    for (let rank = 1; rank <= 300; rank++) {
      players.push(makePlayer(rank, RADIANT, 1000 - rank));
    }
    for (let rank = 301; rank <= 500; rank++) {
      players.push(makePlayer(rank, 26, 500 - rank));
    }
    const result = getRadiantThresholdRR(players);
    expect(result).toBe(players[299].rr);
    expect(result).not.toBe(players[499].rr);
  });

  it('returns null when no radiant present and length < 500', () => {
    const players = Array.from({ length: 10 }, (_, i) => makePlayer(i + 1, 26, 100 - i));
    expect(getRadiantThresholdRR(players)).toBeNull();
  });

  it('falls back to players[499].rr when no radiant present and length >= 500', () => {
    const players = Array.from({ length: 500 }, (_, i) => makePlayer(i + 1, 26, 1000 - i));
    expect(getRadiantThresholdRR(players)).toBe(players[499].rr);
  });
});

function match(overrides: Partial<Match> = {}): Match {
  return {
    metadata: {
      match_id: 'm1',
      mode: 'competitive',
      map: 'Ascent',
      game_start: 1_000_000,
      game_start_patched: '2024-01-01',
      queue: 'competitive',
      rounds_played: 20,
    },
    stats: {
      team: 'Red',
      kills: 10,
      deaths: 5,
      assists: 3,
      score: 250,
      shots: { head: 50, body: 30, leg: 20 },
    },
    teams: { red: 13, blue: 5 },
    ...overrides,
  };
}

describe('calculateWinLoss', () => {
  it('counts wins, losses, draws and builds a reversed streak', () => {
    const matches: Match[] = [
      match({ teams: { red: 13, blue: 5 }, stats: { team: 'Red', kills: 1, deaths: 1, assists: 1, score: 1 } }),
      match({ teams: { red: 5, blue: 13 }, stats: { team: 'Red', kills: 1, deaths: 1, assists: 1, score: 1 }, metadata: { ...match().metadata, game_start: 996_000 } }),
      match({ teams: { red: 10, blue: 10 }, stats: { team: 'Blue', kills: 1, deaths: 1, assists: 1, score: 1 }, metadata: { ...match().metadata, game_start: 992_000 } }),
    ];
    const result = calculateWinLoss(matches);
    expect(result).toEqual({
      wins: 1,
      losses: 1,
      draws: 1,
      streak: ['D', 'L', 'W'],
      text: 'W1 L1 D1 (DLW)',
    });
  });

  it('stops counting older matches when the gap exceeds 3 hours', () => {
    const recent = match({ teams: { red: 13, blue: 5 }, stats: { team: 'Red', kills: 1, deaths: 1, assists: 1, score: 1 } });
    const middle = match({
      teams: { red: 13, blue: 5 },
      stats: { team: 'Red', kills: 1, deaths: 1, assists: 1, score: 1 },
      metadata: { ...match().metadata, game_start: 990_000 },
    });
    const old = match({
      teams: { red: 13, blue: 5 },
      stats: { team: 'Red', kills: 1, deaths: 1, assists: 1, score: 1 },
      metadata: { ...match().metadata, game_start: 970_000 },
    });
    const result = calculateWinLoss([recent, middle, old]);
    expect(result.wins).toBe(1);
    expect(result.losses).toBe(0);
    expect(result.streak).toEqual(['W']);
  });

  it('excludes deathmatch/custom modes', () => {
    const comp = match({ teams: { red: 13, blue: 5 }, stats: { team: 'Red', kills: 1, deaths: 1, assists: 1, score: 1 } });
    const dm = match({ metadata: { ...match().metadata, mode: 'Deathmatch', queue: 'deathmatch' }, teams: { red: 13, blue: 5 }, stats: { team: 'Red', kills: 1, deaths: 1, assists: 1, score: 1 } });
    const result = calculateWinLoss([comp, dm]);
    expect(result.wins).toBe(1);
    expect(result.losses).toBe(0);
  });

  it('filters to competitive only when compOnly is true', () => {
    const comp = match({ teams: { red: 13, blue: 5 }, stats: { team: 'Red', kills: 1, deaths: 1, assists: 1, score: 1 } });
    const unrated = match({ metadata: { ...match().metadata, mode: 'unrated', queue: 'unrated' }, teams: { red: 13, blue: 5 }, stats: { team: 'Red', kills: 1, deaths: 1, assists: 1, score: 1 } });
    const result = calculateWinLoss([comp, unrated], true);
    expect(result.wins).toBe(1);
  });
});

describe('calculateKDA', () => {
  it('returns kills/deaths/assists text from the newest match', () => {
    const m = match({ stats: { team: 'Red', kills: 10, deaths: 5, assists: 3, score: 1 } });
    expect(calculateKDA([m])).toEqual({ kills: 10, deaths: 5, assists: 3, text: '10/5/3' });
  });

  it('returns null when there are no matches', () => {
    expect(calculateKDA([])).toBeNull();
  });
});

describe('calculateHeadshotPercent', () => {
  it('computes the headshot percentage', () => {
    const m = match({ stats: { team: 'Red', kills: 1, deaths: 1, assists: 1, score: 1, shots: { head: 50, body: 30, leg: 20 } } });
    expect(calculateHeadshotPercent([m])).toBe(50);
  });

  it('returns null when there are no matches', () => {
    expect(calculateHeadshotPercent([])).toBeNull();
  });
});

describe('calculateACS', () => {
  it('computes acs as score / rounds played', () => {
    const m = match({ metadata: { ...match().metadata, rounds_played: 20 }, stats: { team: 'Red', kills: 1, deaths: 1, assists: 1, score: 250 } });
    expect(calculateACS([m])).toEqual({ acs: 13, text: '13' });
  });

  it('returns null when there are no matches', () => {
    expect(calculateACS([])).toBeNull();
  });
});

describe('calculateMMRToRadiant', () => {
  it('is not immortal when elo < 2100', () => {
    expect(calculateMMRToRadiant(2000)).toEqual({ rrNeeded: null, isRadiant: false, isImmortal: false });
  });

  it('computes rrNeeded from elo - 2100 and is radiant at elo = 2100', () => {
    expect(calculateMMRToRadiant(2100)).toEqual({ rrNeeded: 0, isRadiant: true, isImmortal: true });
  });

  it('computes rrNeeded from elo - 2100 but is not radiant when elo > 2100', () => {
    expect(calculateMMRToRadiant(2200)).toEqual({ rrNeeded: 100, isRadiant: false, isImmortal: true });
  });
});
