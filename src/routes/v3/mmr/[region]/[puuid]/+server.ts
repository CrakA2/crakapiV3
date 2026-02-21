import type { RequestHandler } from '@sveltejs/kit';
import * as cache from '$lib/server/cache';
import * as henrik from '$lib/server/henrik-client';
import * as fmt from '$lib/server/formatters';
import { respond, respondError } from '$lib/server/api-utils';

export const GET: RequestHandler = async ({ params, url }) => {
  const { region, puuid } = params;
  const platform = url.searchParams.get('platform') || 'pc';

  const cacheKey = cache.buildKey('mmr', region, puuid, platform);

  try {
    const cached = cache.get('mmr', cacheKey);
    if (cached) {
      return respond(cached, fmt.formatMMR(cached as any), url);
    }

    const mmr = await cache.coalesce(
      cacheKey,
      () => henrik.getMMR(region!, puuid!, platform),
      false
    );

    cache.set('mmr', cacheKey, mmr);

    return respond(mmr, fmt.formatMMR(mmr), url);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return respondError(message, 500, url);
  }
};
