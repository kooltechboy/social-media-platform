import { NextRequest, NextResponse } from 'next/server';
import {
  resolveContentUrl,
  normalizeUrl,
  hashUrlSync,
  assertSafeUrl,
  SsrfSecurityError,
  type ResolvedContentMetadata,
} from '@caribbean/media';
import { createServiceSupabaseClient, createSupabaseServerClient } from '../../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');
  const forceRefresh = searchParams.get('refresh') === 'true';

  return handleResolution(rawUrl, forceRefresh);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawUrl = body?.url;
    const forceRefresh = Boolean(body?.forceRefresh);

    return handleResolution(rawUrl, forceRefresh);
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body. Please provide a valid { "url": "..." } payload.' },
      { status: 400 }
    );
  }
}

async function handleResolution(rawUrl: string | null | undefined, forceRefresh: boolean) {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return NextResponse.json(
      { error: 'Parameter "url" is required.' },
      { status: 400 }
    );
  }

  const trimmed = rawUrl.trim();
  const normalized = normalizeUrl(trimmed);
  const urlHash = hashUrlSync(normalized);

  // 1. SSRF Pre-flight Validation
  try {
    await assertSafeUrl(normalized);
  } catch (err: any) {
    if (err instanceof SsrfSecurityError) {
      return NextResponse.json(
        {
          error: 'The requested URL destination is prohibited by platform security policies.',
          code: err.code,
        },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Invalid target URL format.' },
      { status: 400 }
    );
  }

  // 2. Database Cache Check (skip if forceRefresh)
  const supabase = await createSupabaseServerClient();
  if (supabase && !forceRefresh) {
    try {
      const { data: cachedRow } = await supabase
        .from('url_metadata_cache')
        .select('*')
        .eq('url_hash', urlHash)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (cachedRow) {
        const metadata: ResolvedContentMetadata = {
          url: cachedRow.raw_url,
          normalizedUrl: cachedRow.normalized_url,
          canonicalUrl: cachedRow.canonical_url || undefined,
          provider: cachedRow.provider as any,
          providerDisplayName: cachedRow.site_name || cachedRow.provider,
          contentType: cachedRow.content_type as any,
          title: cachedRow.title || '',
          description: cachedRow.description || undefined,
          thumbnailUrl: cachedRow.thumbnail_url || undefined,
          thumbnailWidth: cachedRow.thumbnail_width || undefined,
          thumbnailHeight: cachedRow.thumbnail_height || undefined,
          authorName: cachedRow.author_name || undefined,
          authorUrl: cachedRow.author_url || undefined,
          durationSeconds: cachedRow.duration_seconds || undefined,
          siteName: cachedRow.site_name || undefined,
          faviconUrl: cachedRow.favicon_url || undefined,
          embedUrl: cachedRow.embed_url || undefined,
          embedHtml: cachedRow.embed_html || undefined,
          extra: cachedRow.extra_metadata || undefined,
          status: cachedRow.status as any,
          isPlayable: cachedRow.content_type === 'video' || cachedRow.content_type === 'audio',
          resolvedAt: cachedRow.fetched_at,
        };

        return NextResponse.json(
          { success: true, metadata, cached: true },
          {
            headers: {
              'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
              'X-Tukubi-Cache': 'HIT',
            },
          }
        );
      }
    } catch {
      // If table query fails, continue to live resolution
    }
  }

  // 3. Live Resolution via ContentResolverEngine
  const startTime = Date.now();
  let metadata: ResolvedContentMetadata;
  try {
    metadata = await resolveContentUrl(normalized, { forceRefresh });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: 'Failed to resolve content metadata.',
        details: err?.message || 'Resolution error',
      },
      { status: 502 }
    );
  }

  const durationMs = Date.now() - startTime;

  // 4. Asynchronously Persist to Supabase Database Cache
  try {
    const serviceDb = await createServiceSupabaseClient();
    if (serviceDb) {
      await serviceDb
        .from('url_metadata_cache')
        .upsert(
          {
            url_hash: urlHash,
            raw_url: trimmed,
            normalized_url: normalized,
            canonical_url: metadata.canonicalUrl || null,
            provider: metadata.provider,
            content_type: metadata.contentType,
            title: metadata.title || null,
            description: metadata.description || null,
            thumbnail_url: metadata.thumbnailUrl || null,
            thumbnail_width: metadata.thumbnailWidth || null,
            thumbnail_height: metadata.thumbnailHeight || null,
            author_name: metadata.authorName || null,
            author_url: metadata.authorUrl || null,
            duration_seconds: metadata.durationSeconds || null,
            site_name: metadata.siteName || null,
            favicon_url: metadata.faviconUrl || null,
            embed_html: metadata.embedHtml || null,
            embed_url: metadata.embedUrl || null,
            extra_metadata: metadata.extra || {},
            status: metadata.status,
            http_status: metadata.httpStatus || 200,
            error_message: metadata.errorMessage || null,
            fetched_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          { onConflict: 'url_hash' }
        );
    }
  } catch {
    // Non-blocking cache persistence failure
  }

  return NextResponse.json(
    {
      success: true,
      metadata,
      cached: false,
      resolutionDurationMs: durationMs,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'X-Tukubi-Cache': 'MISS',
      },
    }
  );
}
