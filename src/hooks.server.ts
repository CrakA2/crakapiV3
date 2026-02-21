import { building } from '$app/environment';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event, {
    filterSerializedResponseHeaders: (name) => {
      return name.toLowerCase() === 'content-type';
    },
  });

  response.headers.set('X-Powered-By', 'CrakAPI v3');
  
  return response;
};
