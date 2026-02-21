import type { RequestHandler } from '@sveltejs/kit';
import * as cache from '$lib/server/cache';
import * as henrik from '$lib/server/henrik-client';
import * as fmt from '$lib/server/formatters';
import { respond, respondError } from '$lib/server/api-utils';

async function getRadiantThreshold(region: string): Promise<number> {
  const cacheKey = cache.buildKey('radiant-threshold', region);
  
  const cached = cache.get('leaderboard', cacheKey) as number | null;
  if (cached !== null) {
    return cached;
  }

  const leaderboard = await henrik.getLeaderboard(region);
  const players = leaderboard.players || [];

  if (players.length < 500) {
    throw new Error('Not enough players in leaderboard');
  }

  const radiantRR = players[499].rr;
  cache.set('leaderboard', cacheKey, radiantRR);

  return radiantRR;
}

export const GET: RequestHandler = async ({ params, url }) => {
  const { region, puuid } = params;
  const platform = url.searchParams.get('platform') || 'pc';

  const cacheKey = cache.buildKey('radiant', region, puuid);

  try {
    const cached = cache.get('radiant', cacheKey);
    if (cached) {
      const data = cached as { rrNeeded: number | null; isRadiant: boolean; isImmortal: boolean; text: string };
      return respond(data, data.text, url);
    }

    const mmr = await cache.coalesce(
      cache.buildKey('mmr', region, puuid, platform),
      () => henrik.getMMR(region!, puuid!, platform),
      false
    );

    cache.set('mmr', cache.buildKey('mmr', region, puuid, platform), mmr);

    const currentElo = mmr.current.elo;
    const mmrFromImmortal = currentElo - 2100;

    const isImmortal = mmrFromImmortal >= 0;

    if (!isImmortal) {
      const result = { rrNeeded: null, isRadiant: false, isImmortal: false, text: 'Player is not Immortal' };
      cache.set('radiant', cacheKey, result);
      return respond(result, result.text, url);
    }

    const radiantThreshold = await getRadiantThreshold(region!);
    const rrNeeded = radiantThreshold - mmrFromImmortal;

    const isRadiant = rrNeeded <= 0;
    const text = isRadiant ? 'Player is Radiant' : `${rrNeeded}RR to Radiant`;

    const result = { rrNeeded: isRadiant ? 0 : rrNeeded, isRadiant, isImmortal: true, text };
    cache.set('radiant', cacheKey, result);

    return respond(result, text, url);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return respondError(message, 500, url);
  }
};
