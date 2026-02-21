import type { Account, MMRData, WinLossResult } from '$lib/types';

export function formatAccount(account: Account): string {
  return `${account.name}#${account.tag} (${account.region.toUpperCase()})`;
}

export function formatMMR(mmr: MMRData): string {
  const current = mmr.current;
  const rrChange = current.last_change;
  const changeStr = rrChange >= 0 ? `+${rrChange}` : `${rrChange}`;
  return `${current.tier.name} - ${current.rr}RR (${changeStr})`;
}

export function formatMMRShort(mmr: MMRData): string {
  const current = mmr.current;
  return `${current.tier.name} - ${current.rr}RR`;
}

export function formatWinLoss(result: WinLossResult): string {
  let text = `W${result.wins} L${result.losses}`;
  if (result.draws > 0) {
    text += ` D${result.draws}`;
  }
  text += ` (${result.streak.join('')})`;
  return text;
}

export function formatKDA(kills: number, deaths: number, assists: number): string {
  return `${kills}/${deaths}/${assists}`;
}

export function formatHeadshot(percent: number): string {
  return `${percent.toFixed(1)}%`;
}

export function formatACS(acs: number): string {
  return `${acs} ACS`;
}

export function formatLeaderboardRank(rank: number | null): string {
  if (rank === null) {
    return 'Not on leaderboard';
  }
  return `Rank #${rank.toLocaleString()}`;
}

export function formatRadiantRR(rrNeeded: number | null, isRadiant = false, isImmortal = true): string {
  if (isRadiant) {
    return 'Player is Radiant';
  }
  if (!isImmortal) {
    return 'Player is not Immortal';
  }
  if (rrNeeded === null) {
    return 'Unable to calculate';
  }
  return `${rrNeeded}RR to Radiant`;
}

export function formatError(message: string): string {
  return `Error: ${message}`;
}

export function regionToName(region: string): string {
  const names: Record<string, string> = {
    na: 'North America',
    eu: 'Europe',
    ap: 'Asia-Pacific',
    kr: 'Korea',
    latam: 'Latin America',
    br: 'Brazil',
  };
  return names[region.toLowerCase()] || region.toUpperCase();
}
