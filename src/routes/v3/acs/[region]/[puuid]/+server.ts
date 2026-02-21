import type { RequestHandler } from '@sveltejs/kit';
import * as cache from '$lib/server/cache';
import * as henrik from '$lib/server/henrik-client';
import { calculateACS } from '$lib/server/session';
import * as fmt from '$lib/server/formatters';
import { respond, respondError } from '$lib/server/api-utils';

export const GET: RequestHandler = async ({ params, url }) => {
  const { region, puuid } = params;
  const platform = url.searchParams.get('platform') || 'pc';
  const compOnly = url.searchParams.has('comp');

  const cacheKey = cache.buildKey('acs', region, puuid, platform, compOnly ? 'comp' : 'all');

  try {
    const cached = cache.get('acs', cacheKey);
    if (cached !== null) {
      const result = cached as { acs: number };
      return respond(result, fmt.formatACS(result.acs), url);
    }

    const matches = await cache.coalesce(
      cache.buildKey('matches', region, puuid, platform),
      () => henrik.getMatches(region!, puuid!, platform),
      false
    );

    cache.set('matches', cache.buildKey('matches', region, puuid, platform), matches);

    const result = calculateACS(matches, compOnly);

    if (!result) {
      return respondError('No match data available', 404, url);
    }

    cache.set('acs', cacheKey, { acs: result.acs });

    return respond({ acs: result.acs }, result.text, url);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return respondError(message, 500, url);
  }
};
