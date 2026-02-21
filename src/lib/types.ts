export interface HenrikResponse<T> {
  status: number;
  data: T;
  errors?: HenrikError[];
}

export interface HenrikError {
  code: number;
  message: string;
  status: number;
}

export interface Account {
  puuid: string;
  region: string;
  name: string;
  tag: string;
  card?: string;
  account_level?: number;
}

// Henrik v4 MMR structure
export interface MMRData {
  account: {
    puuid: string;
    name: string;
    tag: string;
  };
  peak?: {
    season: {
      id: string;
      short: string;
    };
    ranking_schema: string;
    tier: {
      id: number;
      name: string;
    };
  };
  current: {
    tier: {
      id: number;
      name: string;
    };
    rr: number;
    last_change: number;
    elo: number;
    leaderboard_placement: number | null;
  };
  seasonal?: Array<{
    season: {
      id: string;
      short: string;
    };
    wins: number;
    games: number;
    end_tier: {
      id: number;
      name: string;
    };
    ranking_schema: string;
    leaderboard_placement: number | null;
  }>;
}

// Raw Henrik API v3 Match structure
export interface HenrikMatch {
  metadata: HenrikMatchMetadata;
  players: HenrikMatchPlayers;
  teams: HenrikMatchTeams;
}

export interface HenrikMatchMetadata {
  map: string;
  game_version: string;
  game_length: number;
  game_start: number;
  game_start_patched: string;
  rounds_played: number;
  mode: string;
  mode_id?: string;
  queue?: string;
  season_id?: string;
  platform: string;
  matchid: string;
  premier_info?: {
    tournament_id: string | null;
    matchup_id: string | null;
  };
}

export interface HenrikMatchPlayers {
  all_players?: HenrikPlayer[];
  red?: HenrikPlayer[];
  blue?: HenrikPlayer[];
}

export interface HenrikPlayer {
  puuid: string;
  name: string;
  tag: string;
  team: 'Red' | 'Blue';
  character?: string;
  stats: {
    kills: number;
    deaths: number;
    assists: number;
    score: number;
    bodyshots: number;
    headshots: number;
    legshots: number;
  };
}

export interface HenrikMatchTeams {
  red: number | null;
  blue: number | null;
}

// Simplified internal match structure for session calculations
export interface Match {
  metadata: MatchMetadata;
  stats: MatchStats;
  teams: MatchTeams;
}

export interface MatchMetadata {
  match_id: string;
  mode: string;
  map: string;
  game_start: number;
  game_start_patched: string;
  queue?: string;
}

export interface MatchStats {
  team: 'Red' | 'Blue';
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  shots?: {
    head: number;
    body: number;
    leg: number;
  };
}

export interface MatchTeams {
  red: number | null;
  blue: number | null;
}

export interface LeaderboardPlayer {
  puuid: string;
  name: string;
  tag: string;
  leaderboard_rank: number;
  tier: number;
  rr: number;
  wins: number;
  card?: string;
  title?: string;
  is_banned?: boolean;
  is_anonymized?: boolean;
}

export interface LeaderboardData {
  updated_at?: string;
  thresholds?: Array<{
    tier: {
      id: number;
      name: string;
    };
    start_index: number;
    threshold: number;
  }>;
  players: LeaderboardPlayer[];
}

export interface WinLossResult {
  wins: number;
  losses: number;
  draws: number;
  streak: string[];
  text: string;
}

export interface PlayerAllData {
  name: string;
  tag: string;
  puuid: string;
  region: string;
  rank: string;
  rr: number;
  rr_change: number;
  wins: number;
  losses: number;
  draws: number;
  streak: string[];
  kda: string;
  headshot_percent: string;
  acs: string;
  comp: boolean;
  leaderboard_rank: number | null;
  radiant_rr: string | null;
}

export type Region = 'na' | 'eu' | 'ap' | 'kr' | 'latam' | 'br';
export type Platform = 'pc' | 'console';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isText: boolean;
}
