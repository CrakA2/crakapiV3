import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import * as cache from '$lib/server/cache';
import * as henrik from '$lib/server/henrik-client';
import * as session from '$lib/server/session';
import type { PlayerAllData } from '$lib/types';

export const GET: RequestHandler = async ({ params, url }) => {
  const { name, tag } = params;
  const platform = url.searchParams.get('platform') || 'pc';
  const compOnly = url.searchParams.has('comp');

  const cacheKey = cache.buildKey('all', name, tag, platform, compOnly ? 'comp' : 'all');

  try {
    const cached = cache.get('account', cacheKey);
    if (cached) {
      return json(cached);
    }

    const account = await henrik.getAccount(name!, tag!);
    const { puuid, region } = account;

    const [matches, mmr] = await Promise.all([
      henrik.getMatches(region, puuid, platform),
      henrik.getMMR(region, puuid, platform),
    ]);

    const winLoss = session.calculateWinLoss(matches, compOnly);
    const kda = session.calculateKDA(matches, compOnly);
    const hsPercent = session.calculateHeadshotPercent(matches, compOnly);
    const acs = session.calculateACS(matches, compOnly);

    let leaderboardRank: number | null = null;
    try {
      const leaderboardData = await henrik.getLeaderboardByPuuid(region, puuid, platform);
      if (leaderboardData.players?.length > 0) {
        leaderboardRank = leaderboardData.players[0].leaderboard_rank;
      }
    } catch {
      // Leaderboard lookup failed, continue without it
    }

    let radiantRR: string | null = null;
    const currentElo = mmr.current.elo;
    const mmrFromImmortal = currentElo - 2100;

    if (mmrFromImmortal < 0) {
      radiantRR = 'Player is not Immortal';
    } else {
      try {
        const leaderboard = await henrik.getLeaderboard(region);
        if (leaderboard.players?.length >= 500) {
          const threshold = leaderboard.players[499].rr;
          const needed = threshold - mmrFromImmortal;
          if (needed <= 0) {
            radiantRR = leaderboardRank ? `Leaderboard #${leaderboardRank}` : 'Player is Radiant';
          } else {
            radiantRR = leaderboardRank ? `Leaderboard #${leaderboardRank} - ${needed}RR to Radiant` : `${needed}RR to Radiant`;
          }
        }
      } catch {
        radiantRR = 'Unable to calculate';
      }
    }

    const result: PlayerAllData = {
      name: account.name,
      tag: account.tag,
      puuid: account.puuid,
      region: account.region,
      rank: mmr.current.tier.name,
      rr: mmr.current.rr,
      rr_change: mmr.current.last_change,
      wins: winLoss.wins,
      losses: winLoss.losses,
      draws: winLoss.draws,
      streak: winLoss.streak,
      kda: kda?.text || 'N/A',
      headshot_percent: hsPercent !== null ? `${hsPercent.toFixed(1)}%` : 'N/A',
      acs: acs?.text || 'N/A',
      comp: compOnly,
      leaderboard_rank: leaderboardRank,
      radiant_rr: radiantRR,
    };

    cache.set('account', cacheKey, result);

    return json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: message }, { status: 500 });
  }
};
