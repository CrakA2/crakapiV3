import type { RequestHandler } from '@sveltejs/kit';
import * as cache from '$lib/server/cache';
import * as henrik from '$lib/server/henrik-client';
import * as fmt from '$lib/server/formatters';
import { respond, respondError, shouldReturnJson } from '$lib/server/api-utils';

export const GET: RequestHandler = async ({ params, url }) => {
  const { name, tag } = params;

  const cacheKey = cache.buildKey('account', name, tag);

  try {
    const cached = cache.get('account', cacheKey);
    if (cached) {
      return respond(cached, fmt.formatAccount(cached as any), url);
    }

    const account = await cache.coalesce(
      cacheKey,
      () => henrik.getAccount(name!, tag!),
      false
    );

    cache.set('account', cacheKey, account);

    return respond(account, fmt.formatAccount(account), url);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return respondError(message, 500, url);
  }
};
