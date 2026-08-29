import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildKey, get, set, coalesce, clear } from '$lib/server/cache';

describe('buildKey', () => {
  it('joins type and parts with colons', () => {
    expect(buildKey('leaderboard', 'na', 'pc')).toBe('leaderboard:na:pc');
  });

  it('filters out undefined parts', () => {
    expect(buildKey('mmr', 'name', undefined, 'tag')).toBe('mmr:name:tag');
  });
});

describe('get/set round-trip', () => {
  beforeEach(() => clear());

  it('stores and retrieves a value', () => {
    const fixture = { foo: 'bar', n: 42 };
    set('mmr', 'k1', fixture);
    expect(get('mmr', 'k1')).toEqual(fixture);
  });

  it('returns null for a missing key', () => {
    expect(get('mmr', 'missing')).toBeNull();
  });

  it('stores text values', () => {
    set('account', 'k2', 'plain text', true);
    expect(get('account', 'k2')).toBe('plain text');
  });
});

describe('coalesce', () => {
  it('de-duplicates concurrent identical calls into a single fetcher invocation', async () => {
    let count = 0;
    const fetcher = vi.fn(async () => {
      count++;
      return 'value';
    });

    const [a, b] = await Promise.all([coalesce('dup', fetcher), coalesce('dup', fetcher)]);

    expect(a).toBe('value');
    expect(b).toBe('value');
    expect(count).toBe(1);
  });

  it('allows distinct keys to invoke separate fetchers', async () => {
    let count = 0;
    const fetcher = async () => {
      count++;
      return count;
    };

    const [a, b] = await Promise.all([coalesce('k-a', fetcher), coalesce('k-b', fetcher)]);

    expect(a).toBe(1);
    expect(b).toBe(2);
    expect(count).toBe(2);
  });
});
