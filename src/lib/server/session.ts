import type { Match, WinLossResult } from '$lib/types';

const EXCLUDED_MODES = ['Deathmatch', 'Custom', 'Team Deathmatch', 'deathmatch', 'custom'];
const SESSION_GAP_MS = 3 * 60 * 60 * 1000; // 3 hours

function isCompetitive(match: Match): boolean {
  const queue = match.metadata.queue?.toLowerCase();
  const mode = match.metadata.mode?.toLowerCase();
  return queue === 'competitive' || mode === 'competitive';
}

export function filterCompetitive(matches: Match[]): Match[] {
  return matches.filter(isCompetitive);
}

function isExcludedMode(mode: string): boolean {
  return EXCLUDED_MODES.includes(mode);
}

export function calculateWinLoss(matches: Match[], compOnly = false): WinLossResult {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  const streak: string[] = [];

  // Filter matches: exclude deathmatch/custom, optionally filter to comp only
  const relevantMatches = matches.filter(m => {
    if (isExcludedMode(m.metadata.mode)) return false;
    if (compOnly && !isCompetitive(m)) return false;
    return true;
  });

  // Walk through matches newest to oldest
  // Stop when gap between matches exceeds 3 hours
  for (let i = 0; i < relevantMatches.length; i++) {
    const match = relevantMatches[i];
    const gameStart = match.metadata.game_start * 1000;

    // Check gap to previous (older) match
    if (i < relevantMatches.length - 1) {
      const prevStart = relevantMatches[i + 1].metadata.game_start * 1000;
      const gap = gameStart - prevStart;
      if (gap > SESSION_GAP_MS) {
        break;
      }
    }

    const playerTeam = match.stats.team;
    const redScore = match.teams.red;
    const blueScore = match.teams.blue;

    if (redScore === null || blueScore === null) continue;

    let result: 'W' | 'L' | 'D';
    if (redScore > blueScore) {
      result = playerTeam === 'Red' ? 'W' : 'L';
    } else if (blueScore > redScore) {
      result = playerTeam === 'Blue' ? 'W' : 'L';
    } else {
      result = 'D';
    }

    if (result === 'W') wins++;
    else if (result === 'L') losses++;
    else draws++;

    streak.push(result);
  }

  // Streak is in reverse order (oldest to newest), flip it
  const orderedStreak = streak.reverse();

  let text = `W${wins} L${losses}`;
  if (draws > 0) text += ` D${draws}`;
  text += ` (${orderedStreak.join('')})`;

  return {
    wins,
    losses,
    draws,
    streak: orderedStreak,
    text,
  };
}

export function calculateKDA(matches: Match[], compOnly = false): { kills: number; deaths: number; assists: number; text: string } | null {
  const searchMatches = compOnly ? filterCompetitive(matches) : matches;
  if (searchMatches.length === 0) {
    return null;
  }

  const stats = searchMatches[0].stats;
  return {
    kills: stats.kills,
    deaths: stats.deaths,
    assists: stats.assists,
    text: `${stats.kills}/${stats.deaths}/${stats.assists}`,
  };
}

export function calculateHeadshotPercent(matches: Match[], compOnly = false): number | null {
  const searchMatches = compOnly ? filterCompetitive(matches) : matches;
  if (searchMatches.length === 0 || !searchMatches[0].stats.shots) {
    return null;
  }

  const shots = searchMatches[0].stats.shots;
  const total = shots.head + shots.body + shots.leg;
  
  if (total === 0) {
    return 0;
  }

  return (shots.head / total) * 100;
}

export function calculateACS(matches: Match[], compOnly = false): { acs: number; text: string } | null {
  const searchMatches = compOnly ? filterCompetitive(matches) : matches;
  if (searchMatches.length === 0) {
    return null;
  }

  const match = searchMatches[0];
  const stats = match.stats;
  const roundsPlayed = match.metadata.rounds_played;
  
  // ACS = total combat score / rounds played
  const acs = roundsPlayed ? Math.round(stats.score / roundsPlayed) : stats.score;
  
  return {
    acs,
    text: `${acs}`,
  };
}

export function calculateMMRToRadiant(currentElo: number): { 
  rrNeeded: number | null; 
  isRadiant: boolean; 
  isImmortal: boolean 
} {
  const mmrFromImmortal = currentElo - 2100;

  if (mmrFromImmortal < 0) {
    return {
      rrNeeded: null,
      isRadiant: false,
      isImmortal: false,
    };
  }

  return {
    rrNeeded: mmrFromImmortal,
    isRadiant: false,
    isImmortal: true,
  };
}
