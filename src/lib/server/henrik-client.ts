import { env } from '$env/dynamic/private';
import { setServers, setDefaultResultOrder, resolve4 } from 'node:dns';
import type { 
  Account, 
  MMRData, 
  Match, 
  HenrikMatch,
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
 * Transform Henrik API match to internal Match format
 * Extracts player stats for the target puuid
 */
function transformMatch(match: HenrikMatch, puuid: string): Match | null {
  // v4 API may have players in all_players, or split between red/blue
  const allPlayers = match.players?.all_players || [
    ...(match.players?.red || []),
    ...(match.players?.blue || [])
  ];
  
  const player = allPlayers.find((p: { puuid: string }) => p.puuid === puuid);
  
  if (!player) {
    return null;
  }

  return {
    metadata: {
      match_id: match.metadata.matchid,
      mode: match.metadata.mode,
      map: match.metadata.map,
      game_start: match.metadata.game_start,
      game_start_patched: match.metadata.game_start_patched,
      queue: match.metadata.queue,
    },
    stats: {
      team: player.team,
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
    teams: match.teams,
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
  
  if (!Array.isArray(henrikMatches)) {
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
