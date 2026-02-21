import type { RequestHandler } from '@sveltejs/kit';
import * as cache from '$lib/server/cache';
import * as henrik from '$lib/server/henrik-client';
import { calculateWinLoss, filterCompetitive } from '$lib/server/session';
import { respond, respondError } from '$lib/server/api-utils';

export const GET: RequestHandler = async ({ params, url }) => {
  const { region, puuid } = params;
  const platform = url.searchParams.get('platform') || 'pc';
  const modeParam = url.searchParams.get('mode');
  const modes = modeParam ? modeParam.split(',') : undefined;
  const compOnly = url.searchParams.has('comp');

  const cacheKey = cache.buildKey('wl', region, puuid, platform, modeParam || 'all', compOnly ? 'comp' : 'all');

  try {
    const cached = cache.get('wl', cacheKey);
    if (cached) {
      return respond(cached, (cached as any).text, url);
    }

    const matches = await cache.coalesce(
      cache.buildKey('matches', region, puuid, platform),
      () => henrik.getMatches(region!, puuid!, platform),
      false
    );

    cache.set('matches', cache.buildKey('matches', region, puuid, platform), matches);

    const filteredMatches = compOnly ? filterCompetitive(matches) : matches;
    const result = calculateWinLoss(filteredMatches, modes);

    cache.set('wl', cacheKey, result);

    return respond(result, result.text, url);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return respondError(message, 500, url);
  }
};
