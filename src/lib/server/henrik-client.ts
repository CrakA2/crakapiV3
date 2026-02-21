import { env } from '$env/dynamic/private';
import { setServers, setDefaultResultOrder, resolve4 } from 'node:dns';
import type { 
  Account, 
  MMRData, 
  Match, 
  HenrikMatch,
  HenrikPlayer,
  HenrikTeam,
  LeaderboardData,
  HenrikResponse 
} from '$lib/types';

setServers(['1.1.1.1', '1.0.0.1']);
setDefaultResultOrder('ipv4first');

const API_HOST = 'api.henrikdev.xyz';
const BASE_URL = `https://${API_HOST}/valorant`;

function getApiKey(): string {
  const key = env.HENRIK_KEY;
  if (!key) {
    throw new Error('HENRIK_KEY environment variable not set');
  }
  return key;
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const apiKey = getApiKey();
  const url = `${BASE_URL}${endpoint}`;
  
  await new Promise<void>((resolve, reject) => {
    resolve4(API_HOST, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const response = await fetch(url, {
    headers: {
      'Authorization': apiKey,
      'Host': API_HOST,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API error: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText) as HenrikResponse<never>;
      if (errorJson.errors?.length) {
        errorMessage = errorJson.errors[0].message;
      }
    } catch {
      if (errorText) errorMessage = errorText;
    }
    throw new Error(errorMessage);
  }

  const json = await response.json() as HenrikResponse<T>;
  return json.data;
}

/**
 * Transform Henrik API v4 match to internal Match format
 * Extracts player stats for the target puuid
 */
function transformMatch(match: HenrikMatch, puuid: string): Match | null {
  // v4 API has players as a flat array
  const players = match.players;
  
  const player = players.find((p: HenrikPlayer) => p.puuid === puuid);
  
  if (!player) {
    return null;
  }

  // Parse ISO timestamp to Unix timestamp (seconds)
  const startedAt = new Date(match.metadata.started_at).getTime() / 1000;
  
  // Find team scores from teams array
  const redTeam = match.teams?.find((t: HenrikTeam) => t.team_id === 'Red');
  const blueTeam = match.teams?.find((t: HenrikTeam) => t.team_id === 'Blue');
  
  // Calculate rounds played (won + lost for either team)
  const roundsPlayed = redTeam ? redTeam.rounds.won + redTeam.rounds.lost : 
                        blueTeam ? blueTeam.rounds.won + blueTeam.rounds.lost : undefined;

  return {
    metadata: {
      match_id: match.metadata.match_id,
      mode: match.metadata.queue?.id || 'unknown',
      map: match.metadata.map?.name || 'Unknown',
      game_start: startedAt,
      game_start_patched: match.metadata.started_at,
      queue: match.metadata.queue?.id,
      rounds_played: roundsPlayed,
    },
    stats: {
      team: player.team_id,
      kills: player.stats.kills,
      deaths: player.stats.deaths,
      assists: player.stats.assists,
      score: player.stats.score,
      shots: {
        head: player.stats.headshots,
        body: player.stats.bodyshots,
        leg: player.stats.legshots,
      },
    },
    teams: {
      red: redTeam?.rounds?.won ?? null,
      blue: blueTeam?.rounds?.won ?? null,
    },
  };
}

export async function getAccount(name: string, tag: string): Promise<Account> {
  return fetchApi<Account>(`/v2/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
}

export async function getMMR(region: string, puuid: string, platform = 'pc'): Promise<MMRData> {
  return fetchApi<MMRData>(`/v3/by-puuid/mmr/${region}/${platform}/${puuid}`);
}

export async function getMatches(region: string, puuid: string, platform = 'pc'): Promise<Match[]> {
  const henrikMatches = await fetchApi<HenrikMatch[]>(`/v4/by-puuid/matches/${region}/${platform}/${puuid}`);
  
  if (!Array.isArray(henrikMatches) || henrikMatches.length === 0) {
    return [];
  }
  
  const matches: Match[] = [];
  for (const henrikMatch of henrikMatches) {
    if (!henrikMatch?.metadata || !henrikMatch?.players) {
      continue;
    }
    const match = transformMatch(henrikMatch, puuid);
    if (match) {
      matches.push(match);
    }
  }
  
  return matches;
}

export async function getLeaderboard(region: string, platform = 'pc'): Promise<LeaderboardData> {
  return fetchApi<LeaderboardData>(`/v3/leaderboard/${region}/${platform}`);
}

export async function getLeaderboardByPuuid(
  region: string, 
  puuid: string, 
  platform = 'pc'
): Promise<LeaderboardData> {
  return fetchApi<LeaderboardData>(
    `/v3/leaderboard/${region}/${platform}?puuid=${encodeURIComponent(puuid)}`
  );
}
