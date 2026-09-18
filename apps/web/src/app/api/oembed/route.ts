import { NextRequest, NextResponse } from 'next/server';

export interface OEmbedResponse {
  type: 'rich';
  version: '1.0';
  title: string;
  author_name: string;
  author_url: string;
  provider_name: 'TUKUBI';
  provider_url: string;
  cache_age: number;
  html: string;
  width: number;
  height: number;
}

export async function GET(request: Request | NextRequest) {
  const parsedUrl = new URL(request.url);
  const searchParams = parsedUrl.searchParams;
  const targetUrl = searchParams.get('url');
  const format = searchParams.get('format') || 'json';
  const maxWidthParam = searchParams.get('maxwidth');
  const maxHeightParam = searchParams.get('maxheight');

  if (!targetUrl) {
    return NextResponse.json({ error: 'url parameter is required' }, { status: 400 });
  }

  if (format !== 'json') {
    return NextResponse.json({ error: 'Unsupported format. Only json is supported.' }, { status: 501 });
  }

  let parsedTargetUrl: URL;
  try {
    parsedTargetUrl = new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid URL provided' }, { status: 400 });
  }

  const pathname = parsedTargetUrl.pathname;
  // Match supported paths: /post/:id, /moments/:id, /marketplace/:id, /spaces/:id
  const match = pathname.match(/^\/(post|moments|marketplace|spaces)\/([a-zA-Z0-9_-]+)/);

  if (!match) {
    return NextResponse.json(
      { error: 'URL is not a supported TUKUBI embeddable resource' },
      { status: 404 }
    );
  }

  const [, resourceType, resourceId] = match;

  // Compute dimensions
  let width = 550;
  let height = 420;

  if (maxWidthParam) {
    const parsedWidth = parseInt(maxWidthParam, 10);
    if (!isNaN(parsedWidth) && parsedWidth > 0) {
      width = Math.min(Math.max(parsedWidth, 280), 800);
    }
  }

  if (maxHeightParam) {
    const parsedHeight = parseInt(maxHeightParam, 10);
    if (!isNaN(parsedHeight) && parsedHeight > 0) {
      height = Math.min(Math.max(parsedHeight, 320), 900);
    }
  }

  const allowedHostnames = ['tukubi.caribbean', 'tukubi.com', 'localhost', '127.0.0.1'];
  const isAllowedHost = allowedHostnames.some(
    (h) => parsedTargetUrl.hostname === h || parsedTargetUrl.hostname.endsWith(`.${h}`)
  );
  const baseUrl = isAllowedHost
    ? parsedTargetUrl.origin
    : (process.env.NEXT_PUBLIC_APP_URL || 'https://tukubi.com').replace(/\/$/, '');
  const embedSrc = `${baseUrl}/embed/${resourceType}/${resourceId}`;

  const titles: Record<string, string> = {
    post: 'TUKUBI Post — Caribbean Voices',
    moments: 'TUKUBI Moment — Island Vibes',
    marketplace: 'TUKUBI Marketplace Product — Verified Artisan',
    spaces: 'TUKUBI Sound Lounge — Live Caribbean Audio Room',
  };

  const title = titles[resourceType] || 'TUKUBI Embed';

  const html = `<iframe src="${embedSrc}" width="${width}" height="${height}" frameborder="0" scrolling="no" allow="autoplay; clipboard-write; encrypted-media" sandbox="allow-scripts allow-same-origin allow-popups" title="${title}" style="border: 1px solid #2A1B38; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.4); max-width: 100%;"></iframe>`;

  const oembedData: OEmbedResponse = {
    type: 'rich',
    version: '1.0',
    title,
    author_name: 'Tukubi Creator',
    author_url: `${baseUrl}/profile/creator`,
    provider_name: 'TUKUBI',
    provider_url: baseUrl,
    cache_age: 86400,
    html,
    width,
    height,
  };

  return NextResponse.json(oembedData, {
    headers: {
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
