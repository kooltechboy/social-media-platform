import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(body), {
        status: init?.status ?? 200,
        headers: { 'content-type': 'application/json', ...init?.headers },
      }),
  },
}));

describe('Universal oEmbed 1.0 Protocol Suite', () => {
  beforeEach(() => vi.resetModules());

  it('returns 400 when url parameter is missing', async () => {
    const { GET } = await import('../../apps/web/src/app/api/oembed/route');
    const req = new Request('http://localhost:3000/api/oembed');
    const res = await GET(req as never);
    expect(res.status).toBe(400);

    const body = (await res.json()) as { error: string };
    expect(body.error).toContain('url parameter is required');
  });

  it('returns 501 when format is not json', async () => {
    const { GET } = await import('../../apps/web/src/app/api/oembed/route');
    const req = new Request(
      'http://localhost:3000/api/oembed?url=https://tukubi.caribbean/post/123&format=xml'
    );
    const res = await GET(req as never);
    expect(res.status).toBe(501);

    const body = (await res.json()) as { error: string };
    expect(body.error).toContain('Unsupported format');
  });

  it('returns 404 for unsupported URL schemes or non-embeddable routes', async () => {
    const { GET } = await import('../../apps/web/src/app/api/oembed/route');
    const req = new Request(
      'http://localhost:3000/api/oembed?url=https://tukubi.caribbean/settings/privacy'
    );
    const res = await GET(req as never);
    expect(res.status).toBe(404);
  });

  it('generates rich oEmbed 1.0 response for post URLs', async () => {
    const { GET } = await import('../../apps/web/src/app/api/oembed/route');
    const req = new Request(
      'http://localhost:3000/api/oembed?url=https://tukubi.caribbean/post/post_abc123'
    );
    const res = await GET(req as never);
    expect(res.status).toBe(200);

    const data = (await res.json()) as {
      version: string;
      type: string;
      provider_name: string;
      provider_url: string;
      width: number;
      height: number;
      html: string;
    };
    expect(data.version).toBe('1.0');
    expect(data.type).toBe('rich');
    expect(data.provider_name).toBe('TUKUBI');
    expect(data.provider_url).toBe('https://tukubi.caribbean');
    expect(data.width).toBe(550);
    expect(data.height).toBe(420);
    expect(data.html).toContain('<iframe');
    expect(data.html).toContain('/embed/post/post_abc123');
    expect(data.html).toContain('sandbox="allow-scripts allow-same-origin allow-popups"');
  });

  it('respects and clamps maxwidth and maxheight constraints', async () => {
    const { GET } = await import('../../apps/web/src/app/api/oembed/route');
    const req = new Request(
      'http://localhost:3000/api/oembed?url=https://tukubi.caribbean/spaces/lng_789&maxwidth=600&maxheight=500'
    );
    const res = await GET(req as never);
    expect(res.status).toBe(200);

    const data = (await res.json()) as {
      width: number;
      height: number;
      html: string;
    };
    expect(data.width).toBe(600);
    expect(data.height).toBe(500);
    expect(data.html).toContain('width="600"');
    expect(data.html).toContain('height="500"');
  });
});
