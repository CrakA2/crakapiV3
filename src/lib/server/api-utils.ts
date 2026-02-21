import { json, type RequestHandler } from '@sveltejs/kit';
import * as cache from '$lib/server/cache';
import * as henrik from '$lib/server/henrik-client';
import * as fmt from '$lib/server/formatters';
import * as session from '$lib/server/session';

function shouldReturnJson(url: URL): boolean {
  return url.searchParams.get('format') === 'json';
}

function respond(data: unknown, text: string, url: URL) {
  if (shouldReturnJson(url)) {
    return json(data);
  }
  return new Response(text, {
    headers: { 'Content-Type': 'text/plain' },
  });
}

export function respondError(message: string, status = 500, url: URL) {
  if (shouldReturnJson(url)) {
    return json({ error: message }, { status });
  }
  return new Response(fmt.formatError(message), {
    status,
    headers: { 'Content-Type': 'text/plain' },
  });
}

export { shouldReturnJson, respond };
