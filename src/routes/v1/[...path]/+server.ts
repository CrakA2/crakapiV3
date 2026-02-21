import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

const V1_TO_V3_MAP: Record<string, string> = {
  'account': '/v3/account',
  'hs': '/v3/hs',
  'wl': '/v3/wl',
  'kd': '/v3/kd',
  'rr': '/v3/mmr',
  'lb': '/v3/leaderboard',
  'lbr': '/v3/radiant',
  'all': '/v3/all',
};

export const GET: RequestHandler = async ({ url, fetch }) => {
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  console.warn(`[DEPRECATED] V1 route called: ${url.pathname}`);

  if (pathParts.length < 2) {
    throw error(404, 'Not found');
  }

  const v1Endpoint = pathParts[1];
  const v3Base = V1_TO_V3_MAP[v1Endpoint];

  if (!v3Base) {
    throw error(404, `Unknown v1 endpoint: ${v1Endpoint}`);
  }

  const remainingPath = pathParts.slice(2).join('/');
  const v3Path = `${v3Base}/${remainingPath}`;
  const v3Url = new URL(v3Path, url.origin);

  for (const [key, value] of url.searchParams.entries()) {
    if (key === 'fs' && value === 'json') {
      v3Url.searchParams.set('format', 'json');
    } else {
      v3Url.searchParams.set(key, value);
    }
  }

  try {
    const response = await fetch(v3Url.toString());
    const contentType = response.headers.get('content-type') || 'text/plain';
    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'X-Deprecated': 'true',
        'X-New-Endpoint': v3Url.pathname,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw error(500, message);
  }
};
