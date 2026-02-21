import type { RequestHandler } from '@sveltejs/kit';
import * as cache from '$lib/server/cache';
import * as henrik from '$lib/server/henrik-client';
import { calculateHeadshotPercent } from '$lib/server/session';
import * as fmt from '$lib/server/formatters';
import { respond, respondError } from '$lib/server/api-utils';

export const GET: RequestHandler = async ({ params, url }) => {
  const { region, puuid } = params;
  const platform = url.searchParams.get('platform') || 'pc';
  const compOnly = url.searchParams.has('comp');

  const cacheKey = cache.buildKey('hs', region, puuid, platform, compOnly ? 'comp' : 'all');

  try {
    const cached = cache.get('hs', cacheKey);
    if (cached !== null) {
      const percent = cached as number;
      return respond({ headshot_percent: percent }, fmt.formatHeadshot(percent), url);
    }

    const matches = await cache.coalesce(
      cache.buildKey('matches', region, puuid, platform),
      () => henrik.getMatches(region!, puuid!, platform),
      false
    );

    cache.set('matches', cache.buildKey('matches', region, puuid, platform), matches);

    const percent = calculateHeadshotPercent(matches, compOnly);

    if (percent === null) {
      return respondError('No headshot data available', 404, url);
    }

    cache.set('hs', cacheKey, percent);

    return respond({ headshot_percent: percent }, fmt.formatHeadshot(percent), url);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return respondError(message, 500, url);
  }
};
