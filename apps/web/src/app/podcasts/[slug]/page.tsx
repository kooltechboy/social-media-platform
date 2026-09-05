import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Radio } from 'lucide-react';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import PodcastNetworkFeed, { type PodcastShowItem } from '../../../components/podcasts/podcast-network-feed';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { title: 'TUKUBI Caribbean Podcast' };
  }

  const { data } = await supabase
    .from('podcasts')
    .select('title, description, cover_path')
    .eq('slug', slug)
    .maybeSingle();

  if (!data) {
    return { title: 'Podcast Show Not Found — TUKUBI' };
  }

  return {
    title: `${data.title} — TUKUBI Caribbean Podcasts`,
    description: data.description || 'Stream authentic Caribbean podcasts, music documentaries, and audio stories on TUKUBI.',
    openGraph: {
      title: `${data.title} — TUKUBI`,
      description: data.description || 'Stream authentic Caribbean voices and podcasts on TUKUBI.',
      url: `https://tukubi.com/podcasts/${slug}`,
      siteName: 'TUKUBI',
      images: data.cover_path ? [{ url: data.cover_path }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${data.title} — TUKUBI`,
      description: data.description || 'Stream authentic Caribbean voices and podcasts on TUKUBI.',
    },
  };
}

export default async function PodcastShowPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ t?: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  let podcast: PodcastShowItem | null = null;

  if (supabase) {
    const { data: dbPod } = await supabase
      .from('podcasts')
      .select(`
        id,
        title,
        slug,
        description,
        is_paid,
        follower_count,
        language,
        cover_path,
        creator_id,
        profiles:profiles!podcasts_creator_id_fkey(display_name, username),
        podcast_episodes(
          id,
          title,
          audio_path,
          duration_seconds,
          show_notes,
          transcript,
          chapters,
          published_at,
          season_number,
          episode_number,
          is_subscriber_only
        )
      `)
      .eq('slug', slug)
      .maybeSingle();

    if (dbPod) {
      const episodes = (dbPod.podcast_episodes || []) as any[];
      const publishedEps = episodes
        .filter((ep) => ep.published_at !== null)
        .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

      const activeEp = publishedEps[0] || episodes[0] || null;

      let audioUrl: string | undefined = undefined;
      if (activeEp?.audio_path && activeEp.audio_path !== 'draft_pending_upload') {
        if (activeEp.audio_path.startsWith('http')) {
          audioUrl = activeEp.audio_path;
        } else {
          const { data: pubData } = supabase.storage
            .from('podcast-audio')
            .getPublicUrl(activeEp.audio_path);
          audioUrl = pubData?.publicUrl;
        }
      }

      let coverUrl: string | null = null;
      if (dbPod.cover_path) {
        if (dbPod.cover_path.startsWith('http')) {
          coverUrl = dbPod.cover_path;
        } else {
          const { data: pubData } = supabase.storage
            .from('post-media')
            .getPublicUrl(dbPod.cover_path);
          coverUrl = pubData?.publicUrl;
        }
      }

      podcast = {
        id: dbPod.id,
        title: dbPod.title,
        slug: dbPod.slug,
        description: dbPod.description,
        is_paid: dbPod.is_paid,
        follower_count: dbPod.follower_count ?? 0,
        language: dbPod.language,
        cover_path: coverUrl || dbPod.cover_path,
        creator_id: dbPod.creator_id,
        category: 'Culture & Talk',
        episodesCount: episodes.length,
        podcast_episodes: episodes.map((e) => ({ id: e.id })),
        audioUrl,
        latestEpisodeTitle: activeEp?.title,
        chapters: (activeEp?.chapters as any) || undefined,
        transcript: activeEp?.transcript || undefined,
        profiles: dbPod.profiles as any,
      };
    }
  }

  if (!podcast) {
    return (
      <div className="min-h-screen bg-transparent text-brand-sandstone p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/podcasts"
            className="p-2 rounded-xl bg-brand-dusk border border-slate-800 text-brand-sandstone/80 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> All Podcasts
          </Link>
        </div>

        <div className="p-12 rounded-3xl bg-brand-dusk/60 border border-slate-800 text-center space-y-4 max-w-lg mx-auto my-12">
          <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
            <Radio className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white">Podcast Show Not Found</h2>
          <p className="text-xs text-brand-sandstone/70 leading-relaxed">
            The requested Caribbean podcast series does not exist or has not been published yet. Creators can produce and broadcast new podcast series directly from Creator Studio.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/podcasts"
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors"
            >
              Browse Shows
            </Link>
            <Link
              href="/creator-studio"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black transition-colors shadow-md shadow-purple-600/20"
            >
              Creator Studio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center gap-3">
        <Link
          href="/podcasts"
          className="p-2 rounded-xl bg-brand-dusk border border-slate-800 text-brand-sandstone/80 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> All Podcasts
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-brand-sandstone/60">Show /</span>
          <span className="text-xs font-bold text-brand-sandstone truncate">{podcast.title}</span>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="w-full flex items-center justify-center p-20">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <PodcastNetworkFeed
          podcasts={[podcast]}
          user={
            user
              ? {
                  id: user.id,
                  displayName: user.displayName,
                  username: user.username,
                }
              : null
          }
        />
      </Suspense>
    </div>
  );
}
