import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { buildRssFeed, validateRssFeedXml } from '@caribbean/podcasts';

export async function HEAD(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return new NextResponse(null, { status: 503 });
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  });

  const { data: podcast } = await supabase
    .from('podcasts')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (!podcast) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return new NextResponse('Service unavailable', { status: 503 });
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  });

  // Check for private tokenized subscriber feed access
  const token = req.nextUrl.searchParams.get('token');
  let allowSubscriberOnly = false;

  if (token) {
    const { data: feedToken } = await supabase
      .from('podcast_feed_tokens')
      .select('id, is_revoked, expires_at')
      .eq('podcast_id', id)
      .eq('token_hash', token)
      .maybeSingle();

    if (feedToken && !feedToken.is_revoked) {
      if (!feedToken.expires_at || new Date(feedToken.expires_at).getTime() > Date.now()) {
        allowSubscriberOnly = true;
      }
    }
  }

  const { data: podcast, error: podcastErr } = await supabase
    .from('podcasts')
    .select(`
      id, title, slug, description, subtitle, language, cover_path, category, subcategory,
      author_name, copyright, publisher, show_type, is_explicit,
      profiles:profiles!podcasts_creator_id_fkey(display_name)
    `)
    .eq('id', id)
    .maybeSingle();

  if (podcastErr || !podcast) {
    return new NextResponse('Podcast not found', { status: 404 });
  }

  let episodesQuery = supabase
    .from('podcast_episodes')
    .select(`
      id, guid, title, subtitle, audio_path, video_path, duration_seconds, show_notes,
      show_notes_html, transcript, chapters, season_number, episode_number,
      episode_type, is_explicit, artwork_url, published_at, is_subscriber_only
    `)
    .eq('podcast_id', id)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(300);

  if (!allowSubscriberOnly) {
    episodesQuery = episodesQuery.eq('is_subscriber_only', false);
  }

  const { data: episodes } = await episodesQuery;

  const pod = podcast as any;
  const eps = (episodes ?? []) as any[];

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tukubi.com';
  const podcastUrl = `${baseUrl}/podcasts/${pod.slug}`;
  const feedUrl = `${baseUrl}/api/v1/podcasts/${pod.id}/rss${token ? `?token=${encodeURIComponent(token)}` : ''}`;

  const resolvePublicAudioUrl = (path: string): string => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const { data } = supabase.storage.from('podcast-audio').getPublicUrl(path);
    return data?.publicUrl || `${baseUrl}/${path}`;
  };

  const resolvePublicVideoUrl = (path: string | null): string | null => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const { data } = supabase.storage.from('podcast-video').getPublicUrl(path);
    return data?.publicUrl || `${baseUrl}/${path}`;
  };

  const resolvePublicCoverUrl = (path: string | null): string => {
    if (!path) return `${baseUrl}/default-cover.jpg`;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const { data } = supabase.storage.from('post-media').getPublicUrl(path);
    return data?.publicUrl || `${baseUrl}/${path}`;
  };

  const rssXml = buildRssFeed({
    podcastTitle: pod.title,
    podcastDescription: pod.description ?? pod.subtitle ?? '',
    siteUrl: podcastUrl,
    feedUrl: feedUrl,
    language: pod.language ?? 'en',
    coverUrl: resolvePublicCoverUrl(pod.cover_path),
    authorName: pod.author_name || pod.profiles?.display_name || 'TUKUBI Caribbean Creator',
    category: pod.category ?? 'Society & Culture',
    subcategory: pod.subcategory ?? undefined,
    showType: pod.show_type === 'serial' ? 'serial' : 'episodic',
    isExplicit: Boolean(pod.is_explicit),
    copyright: pod.copyright ?? undefined,
    episodes: eps.map((ep) => ({
      guid: ep.guid || ep.id,
      title: ep.title,
      description: ep.show_notes_html || ep.show_notes || ep.subtitle || '',
      audioUrl: resolvePublicAudioUrl(ep.audio_path),
      videoUrl: resolvePublicVideoUrl(ep.video_path),
      durationSeconds: ep.duration_seconds,
      publishedAt: ep.published_at,
      seasonNumber: ep.season_number,
      episodeNumber: ep.episode_number,
      episodeType: ep.episode_type || 'full',
      isExplicit: Boolean(ep.is_explicit),
      artworkUrl: ep.artwork_url ? resolvePublicCoverUrl(ep.artwork_url) : undefined,
    })),
  });

  // Automated validation sanity check
  const validation = validateRssFeedXml(rssXml);
  if (!validation.valid) {
    console.warn(`[RSS Generator] Validation warnings for podcast ${id}:`, validation.errors);
  }

  return new NextResponse(rssXml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Accept-Ranges': 'bytes',
      'Cache-Control': allowSubscriberOnly
        ? 'private, no-cache, no-store'
        : 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
