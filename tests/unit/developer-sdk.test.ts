import { describe, it, expect, vi } from 'vitest';
import {
  TukubiClient,
  TukubiAuthenticationError,
  TukubiNotFoundError,
  TukubiRateLimitError,
  TukubiServerError,
  TukubiValidationError,
} from '../../packages/sdk/src';

describe('TUKUBI Developer SDK Suite (@caribbean/sdk)', () => {
  it('throws TukubiAuthenticationError when apiKey is missing or empty', () => {
    expect(() => new TukubiClient({ apiKey: '' })).toThrow(TukubiAuthenticationError);
  });

  it('serializes authorization headers and query parameters correctly', async () => {
    let capturedUrl = '';
    let capturedHeaders: Record<string, string> = {};

    const mockFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = url.toString();
      capturedHeaders = (init?.headers || {}) as Record<string, string>;
      return new Response(
        JSON.stringify({
          data: [
            { id: 'p_1', content: 'Carnival vibes', culturalTags: ['soca', 'jouvert'] },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    });

    const client = new TukubiClient({
      apiKey: 'tk_live_sec_key_12345',
      baseUrl: 'https://api.tukubi.caribbean/v1',
      fetch: mockFetch as unknown as typeof fetch,
    });

    const res = await client.posts.list({ tag: 'soca', countryIso: 'TTO', limit: 10 });
    expect(res.data.length).toBe(1);
    expect(capturedUrl).toBe('https://api.tukubi.caribbean/v1/posts?tag=soca&country=TTO&limit=10');
    expect(capturedHeaders['Authorization']).toBe('Bearer tk_live_sec_key_12345');
    expect(capturedHeaders['User-Agent']).toBe('Tukubi-Developer-SDK/1.0.0');
  });

  it('retrieves single post and sound lounge resources cleanly', async () => {
    const mockFetch = vi.fn(async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes('/posts/post_999')) {
        return new Response(
          JSON.stringify({
            data: { id: 'post_999', content: 'Steelpan festival in Port of Spain' },
          }),
          { status: 200 }
        );
      }
      if (urlStr.includes('/spaces/lng_456')) {
        return new Response(
          JSON.stringify({
            data: { id: 'lng_456', title: 'Reggae Sunday Session', state: 'live' },
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });
    });

    const client = new TukubiClient({
      apiKey: 'test_key',
      fetch: mockFetch as unknown as typeof fetch,
    });

    const post = await client.posts.get('post_999');
    expect(post.id).toBe('post_999');

    const lounge = await client.lounges.get('lng_456');
    expect(lounge.id).toBe('lng_456');
    expect(lounge.state).toBe('live');
  });

  it('maps HTTP 401/403 to TukubiAuthenticationError', async () => {
    const mockFetch = vi.fn(async () => {
      return new Response(JSON.stringify({ error: 'Expired API token' }), { status: 401 });
    });

    const client = new TukubiClient({ apiKey: 'expired_key', fetch: mockFetch as unknown as typeof fetch });
    await expect(client.posts.list()).rejects.toThrow(TukubiAuthenticationError);
  });

  it('maps HTTP 404 to TukubiNotFoundError', async () => {
    const mockFetch = vi.fn(async () => {
      return new Response(JSON.stringify({ error: 'Post does not exist' }), { status: 404 });
    });

    const client = new TukubiClient({ apiKey: 'valid_key', fetch: mockFetch as unknown as typeof fetch });
    await expect(client.posts.get('missing_id')).rejects.toThrow(TukubiNotFoundError);
  });

  it('maps HTTP 429 to TukubiRateLimitError with parsed retryAfterSeconds', async () => {
    const mockFetch = vi.fn(async () => {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'retry-after': '45' },
      });
    });

    const client = new TukubiClient({ apiKey: 'valid_key', fetch: mockFetch as unknown as typeof fetch });
    try {
      await client.posts.list();
      expect.unreachable('Should have thrown TukubiRateLimitError');
    } catch (err) {
      expect(err).toBeInstanceOf(TukubiRateLimitError);
      expect((err as TukubiRateLimitError).retryAfterSeconds).toBe(45);
    }
  });

  it('maps HTTP 400 to TukubiValidationError and HTTP 500 to TukubiServerError', async () => {
    const mock400Fetch = vi.fn(async () => new Response(JSON.stringify({ error: 'Invalid country code' }), { status: 400 }));
    const client400 = new TukubiClient({ apiKey: 'key', fetch: mock400Fetch as unknown as typeof fetch });
    await expect(client400.marketplace.list()).rejects.toThrow(TukubiValidationError);

    const mock500Fetch = vi.fn(async () => new Response(JSON.stringify({ error: 'Database timeout' }), { status: 503 }));
    const client500 = new TukubiClient({ apiKey: 'key', fetch: mock500Fetch as unknown as typeof fetch });
    await expect(client500.culture.getTaxonomy()).rejects.toThrow(TukubiServerError);
  });
});
