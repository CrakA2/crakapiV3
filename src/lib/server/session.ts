import type { Match, WinLossResult } from '$lib/types';

const EXCLUDED_MODES = ['Deathmatch', 'Custom', 'Team Deathmatch', 'deathmatch', 'custom'];
const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000;
const FIRST_MATCH_THRESHOLD_MS = 6 * 60 * 60 * 1000;

function isCompetitive(match: Match): boolean {
  const queue = match.metadata.queue?.toLowerCase();
  const mode = match.metadata.mode?.toLowerCase();
  return queue === 'competitive' || mode === 'competitive';
}

export function filterCompetitive(matches: Match[]): Match[] {
  return matches.filter(isCompetitive);
}

export function calculateWinLoss(matches: Match[], modeFilters?: string[]): WinLossResult {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  const streak: string[] = [];
  const modeSet = modeFilters ? new Set(modeFilters.map(m => m.toLowerCase())) : null;

  const now = new Date();

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    
    // game_start is Unix timestamp in seconds, convert to milliseconds
    const startedAt = new Date(match.metadata.game_start * 1000);
    
    if (i === 0 && now.getTime() - startedAt.getTime() > FIRST_MATCH_THRESHOLD_MS) {
      break;
    }

    if (modeSet && match.metadata.mode && !modeSet.has(match.metadata.mode.toLowerCase())) {
      continue;
    }

    if (i < matches.length - 1) {
      const prevStartedAt = new Date(matches[i + 1].metadata.game_start * 1000);
      const timeDiff = startedAt.getTime() - prevStartedAt.getTime();
      if (timeDiff > SESSION_TIMEOUT_MS) {
        break;
      }
    }

    if (EXCLUDED_MODES.includes(match.metadata.mode)) {
      continue;
    }

    const playerTeam = match.stats.team;
    const redScore = match.teams.red;
    const blueScore = match.teams.blue;

    if (redScore === null || blueScore === null) {
      continue;
    }

    let winningTeam: 'Red' | 'Blue' | 'Draw';
    if (redScore > blueScore) {
      winningTeam = 'Red';
    } else if (blueScore > redScore) {
      winningTeam = 'Blue';
    } else {
      winningTeam = 'Draw';
    }

    if (winningTeam === 'Draw') {
      draws++;
      streak.push('D');
    } else if (winningTeam === playerTeam) {
      wins++;
      streak.push('W');
    } else {
      losses++;
      streak.push('L');
    }
  }

  const reversedStreak = streak.reverse();

  let text = `W${wins} L${losses}`;
  if (draws > 0) {
    text += ` D${draws}`;
  }
  text += ` (${reversedStreak.join('')})`;

  return {
    wins,
    losses,
    draws,
    streak: reversedStreak,
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
