import type { RequestHandler } from '@sveltejs/kit';
import * as cache from '$lib/server/cache';
import * as henrik from '$lib/server/henrik-client';
import * as fmt from '$lib/server/formatters';
import { respond, respondError } from '$lib/server/api-utils';

export const GET: RequestHandler = async ({ params, url }) => {
  const { region, puuid } = params;
  const platform = url.searchParams.get('platform') || 'pc';

  const cacheKey = cache.buildKey('leaderboard', region, puuid, platform);

  try {
    const cached = cache.get('leaderboard', cacheKey);
    if (cached !== null) {
      return respond(cached, fmt.formatLeaderboardRank(cached as number | null), url);
    }

    const leaderboardData = await cache.coalesce(
      cacheKey,
      () => henrik.getLeaderboardByPuuid(region!, puuid!, platform),
      false
    );

    const players = leaderboardData.players || [];
    let rank: number | null = null;

    if (players.length > 0) {
      rank = players[0].leaderboard_rank;
    }

    cache.set('leaderboard', cacheKey, rank);

    return respond({ rank }, fmt.formatLeaderboardRank(rank), url);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return respondError(message, 500, url);
  }
};
