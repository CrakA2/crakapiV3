import type { ServerLoad } from '@sveltejs/kit';
import * as cache from '$lib/server/cache';
import * as henrik from '$lib/server/henrik-client';
import * as session from '$lib/server/session';

export const load: ServerLoad = async ({ params, url, setHeaders }) => {
  const { region, puuid } = params;
  const platform = url.searchParams.get('platform') || 'pc';
  const compOnly = url.searchParams.has('comp');

  const showMMR = url.searchParams.get('mmr') === 'y';
  const showWL = url.searchParams.get('wl') === 'y';
  const showStat = url.searchParams.get('stat') === 'y';
  const showRadiant = url.searchParams.get('radiant') === 'y';

  const result: {
    mmr: { rank: string; rr: number; rr_change: number } | null;
    wl: { wins: number; losses: number; draws: number; streak: string[] } | null;
    stat: { kda: string; hs: string; acs: string } | null;
    radiant: { rrNeeded: number | null; isRadiant: boolean; isImmortal: boolean } | null;
    comp: boolean;
  } = {
    mmr: null,
    wl: null,
    stat: null,
    radiant: null,
    comp: compOnly
  };

  try {
    const promises: Promise<void>[] = [];

    if (showMMR || showRadiant) {
      promises.push(
        cache.coalesce(
          cache.buildKey('mmr', region, puuid, platform),
          () => henrik.getMMR(region!, puuid!, platform),
          false
        ).then(mmr => {
          cache.set('mmr', cache.buildKey('mmr', region, puuid, platform), mmr);
          if (showMMR) {
            result.mmr = {
              rank: mmr.current.tier.name,
              rr: mmr.current.rr,
              rr_change: mmr.current.last_change
            };
          }
          if (showRadiant) {
            const currentElo = mmr.current.elo;
            const mmrFromImmortal = currentElo - 2100;
            const isImmortal = mmrFromImmortal >= 0;
            const isRadiant = false;

            if (!isImmortal) {
              result.radiant = { rrNeeded: null, isRadiant: false, isImmortal: false };
            } else {
              result.radiant = { rrNeeded: mmrFromImmortal, isRadiant, isImmortal: true };
            }
          }
        })
      );
    }

    if (showWL || showStat) {
      promises.push(
        cache.coalesce(
          cache.buildKey('matches', region, puuid, platform),
          () => henrik.getMatches(region!, puuid!, platform),
          false
        ).then(matches => {
          cache.set('matches', cache.buildKey('matches', region, puuid, platform), matches);

          const filteredMatches = compOnly ? session.filterCompetitive(matches) : matches;

          if (showWL) {
            const wl = session.calculateWinLoss(filteredMatches);
            result.wl = {
              wins: wl.wins,
              losses: wl.losses,
              draws: wl.draws,
              streak: wl.streak
            };
          }

          if (showStat) {
            const kda = session.calculateKDA(matches, compOnly);
            const hs = session.calculateHeadshotPercent(matches, compOnly);
            const acs = session.calculateACS(matches, compOnly);
            result.stat = {
              kda: kda?.text ?? 'N/A',
              hs: hs !== null ? `${hs.toFixed(1)}%` : 'N/A',
              acs: acs?.text ?? 'N/A'
            };
          }
        })
      );
    }

    await Promise.all(promises);

    if (showRadiant && result.radiant?.isImmortal && result.radiant.rrNeeded !== null) {
      try {
        const leaderboard = await cache.coalesce(
          cache.buildKey('leaderboard', region),
          () => henrik.getLeaderboard(region!),
          false
        );
        cache.set('leaderboard', cache.buildKey('leaderboard', region), leaderboard);

        if (leaderboard.players?.length >= 500) {
          const threshold = leaderboard.players[499].rr;
          const needed = threshold - result.radiant.rrNeeded;
          result.radiant.rrNeeded = needed;
          result.radiant.isRadiant = needed <= 0;
        }
      } catch {
        // Leaderboard fetch failed, keep raw RR value
      }
    }

    return { region, data: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { region, data: result, error: message };
  }
};
