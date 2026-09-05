import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { buildRssFeed } from '@caribbean/podcasts';

export async function GET(
  _req: NextRequest,
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

  const { data: podcast, error: podcastErr } = await supabase
    .from('podcasts')
    .select('id, title, slug, description, language, cover_path, profiles:profiles!podcasts_creator_id_fkey(display_name)')
    .eq('id', id)
    .maybeSingle();

  if (podcastErr || !podcast) {
    return new NextResponse('Podcast not found', { status: 404 });
  }

  const { data: episodes } = await supabase
    .from('podcast_episodes')
    .select('id, title, audio_path, duration_seconds, show_notes, transcript, chapters, season_number, episode_number, published_at')
    .eq('podcast_id', id)
    .eq('is_subscriber_only', false)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(100);

  const pod = podcast as unknown as {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    language: string | null;
    cover_path: string | null;
    profiles: { display_name: string } | null;
  };

  const eps = (episodes ?? []) as Array<{
    id: string;
    title: string;
    audio_path: string;
    duration_seconds: number;
    show_notes: string | null;
    transcript: string | null;
    chapters: Array<{ startSeconds: number; title: string }>;
    season_number: number;
    episode_number: number;
    published_at: string;
  }>;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tukubi.com';
  const podcastUrl = `${baseUrl}/podcasts/${pod.slug}`;
  const feedUrl = `${baseUrl}/api/v1/podcasts/${pod.id}/rss`;

  const rssXml = buildRssFeed({
    podcastTitle: pod.title,
    podcastDescription: pod.description ?? '',
    siteUrl: podcastUrl,
    feedUrl: feedUrl,
    language: pod.language ?? 'en',
    coverUrl: pod.cover_path ? `${baseUrl}/${pod.cover_path}` : `${baseUrl}/default-cover.jpg`,
    episodes: eps.map((ep) => ({
      guid: ep.id,
      title: ep.title,
      description: ep.show_notes ?? '',
      audioUrl: `${baseUrl}/${ep.audio_path}`,
      durationSeconds: ep.duration_seconds,
      publishedAt: ep.published_at,
    })),
  });

  return new NextResponse(rssXml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
