import React from 'react';
import type { Metadata } from 'next';
import { Mic, Radio, Globe } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import PodcastNetworkFeed, { type PodcastShowItem } from '../../components/podcasts/podcast-network-feed';
import RightRail from '../../components/right-rail';
import PodcastsRail from '../../components/rails/podcasts-rail';
import {
  CARIBBEAN_PODCAST_CATEGORIES,
  CARIBBEAN_PODCAST_TERRITORIES,
} from '@caribbean/podcasts';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'TUKUBI Podcasts — Caribbean Voices, Culture & Audio/Video Shows',
  description: 'Stream original Caribbean podcasts, video talk series, music documentaries, and dialect stories with RSS syndication.',
  openGraph: {
    title: 'TUKUBI Podcasts — Caribbean Audio & Video Network',
    description: 'Stream original Caribbean podcasts, video talk series, and dialect stories.',
    url: 'https://tukubi.com/podcasts',
    siteName: 'TUKUBI',
  },
};

export default async function PodcastsPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; territory?: string; q?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeCategory = resolvedParams.category || 'All Shows';
  const activeTerritory = resolvedParams.territory || 'ALL';
  const queryText = resolvedParams.q || '';

  const [user, supabase] = await Promise.all([getCurrentUser(), createSupabaseServerClient()]);

  let podcasts: PodcastShowItem[] = [];

  if (supabase) {
    let query = supabase
      .from('podcasts')
      .select(`
        id, title, subtitle, slug, description, is_paid, follower_count, language,
        category, subcategory, country, island_territory, cover_path, creator_id,
        profiles:profiles!podcasts_creator_id_fkey(display_name, username),
        podcast_episodes(
          id, title, subtitle, audio_path, video_path, duration_seconds,
          show_notes, transcript, chapters, published_at, season_number,
          episode_number, is_subscriber_only, episode_type
        )
      `)
      .order('follower_count', { ascending: false })
      .limit(30);

    if (queryText) {
      query = query.or(`title.ilike.%${queryText}%,description.ilike.%${queryText}%`);
    } else if (activeCategory !== 'All Shows') {
      query = query.eq('category', activeCategory);
    }

    if (activeTerritory !== 'ALL') {
      query = query.or(`island_territory.eq.${activeTerritory},country_iso.eq.${activeTerritory}`);
    }

    const { data } = await query;
    if (data && data.length > 0) {
      podcasts = data.map((d: any) => {
        const episodes = (d.podcast_episodes || []) as any[];
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

        let videoUrl: string | null = null;
        if (activeEp?.video_path) {
          if (activeEp.video_path.startsWith('http')) {
            videoUrl = activeEp.video_path;
          } else {
            const { data: pubData } = supabase.storage
              .from('podcast-video')
              .getPublicUrl(activeEp.video_path);
            videoUrl = pubData?.publicUrl || null;
          }
        }

        let coverUrl: string | null = null;
        if (d.cover_path) {
          if (d.cover_path.startsWith('http')) {
            coverUrl = d.cover_path;
          } else {
            const { data: pubData } = supabase.storage
              .from('post-media')
              .getPublicUrl(d.cover_path);
            coverUrl = pubData?.publicUrl;
          }
        }

        const mappedEpisodes = episodes.map((ep: any) => {
          let epAudioUrl: string | undefined = undefined;
          if (ep.audio_path && ep.audio_path !== 'draft_pending_upload') {
            if (ep.audio_path.startsWith('http')) {
              epAudioUrl = ep.audio_path;
            } else {
              epAudioUrl = supabase.storage.from('podcast-audio').getPublicUrl(ep.audio_path).data?.publicUrl;
            }
          }

          let epVideoUrl: string | null = null;
          if (ep.video_path) {
            if (ep.video_path.startsWith('http')) {
              epVideoUrl = ep.video_path;
            } else {
              epVideoUrl = supabase.storage.from('podcast-video').getPublicUrl(ep.video_path).data?.publicUrl || null;
            }
          }

          return {
            id: ep.id,
            title: ep.title,
            season_number: ep.season_number,
            episode_number: ep.episode_number,
            duration_seconds: ep.duration_seconds,
            audio_path: ep.audio_path,
            video_path: ep.video_path,
            audioUrl: epAudioUrl,
            videoUrl: epVideoUrl,
            show_notes: ep.show_notes,
            transcript: ep.transcript,
            chapters: ep.chapters,
            published_at: ep.published_at,
            is_subscriber_only: ep.is_subscriber_only,
          };
        });

        return {
          id: d.id,
          title: d.title,
          subtitle: d.subtitle,
          slug: d.slug,
          description: d.description,
          is_paid: d.is_paid,
          follower_count: d.follower_count || 0,
          language: d.language,
          cover_path: coverUrl || d.cover_path,
          creator_id: d.creator_id,
          category: d.category || (activeCategory !== 'All Shows' ? activeCategory : 'Caribbean Voice'),
          subcategory: d.subcategory,
          country: d.country,
          island_territory: d.island_territory,
          episodesCount: episodes.length,
          podcast_episodes: mappedEpisodes,
          audioUrl: audioUrl,
          videoUrl: videoUrl,
          latestEpisodeTitle: activeEp?.title,
          chapters: activeEp?.chapters || [],
          transcript: activeEp?.transcript || undefined,
          profiles: d.profiles,
        };
      });
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start w-full">
      <div className="flex-1 min-w-0 space-y-8 w-full max-w-[820px] xl:max-w-[860px] mx-auto lg:mx-0 animate-fadeIn">
        {/* Top Header */}
        <div className="surface-header rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-purple-500/30 shadow-xl">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-purple-500 animate-ping" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white flex items-center gap-3">
                <Mic className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400" /> Caribbean Podcast Network
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-brand-sandstone/80 mt-1 leading-relaxed">
              Authentic Caribbean audio storytelling, video talks, AI transcripts, and persistent cross-device listening.
            </p>
          </div>

          {user ? (
            <Link
              href="/creator-studio?tab=podcasts"
              className="bg-purple-600 hover:bg-purple-500 text-white font-black px-6 py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-600/30 self-start md:self-auto min-h-[44px]"
            >
              <Radio className="w-4 h-4" /> Host Your Podcast
            </Link>
          ) : (
            <Link
              href="/login?redirect=/podcasts"
              className="bg-purple-600/20 text-purple-300 border border-purple-500/40 font-black px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-purple-600/30 transition-all self-start md:self-auto min-h-[44px]"
            >
              Sign in to Host
            </Link>
          )}
        </div>

        {/* Filter Rails: Categories & Island Territories */}
        <div className="space-y-3">
          {/* Categories Filter Rail */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {['All Shows', ...CARIBBEAN_PODCAST_CATEGORIES].map((cat) => {
              const isActive = cat === activeCategory;
              const queryParams = new URLSearchParams();
              if (cat !== 'All Shows') queryParams.set('category', cat);
              if (activeTerritory !== 'ALL') queryParams.set('territory', activeTerritory);
              if (queryText) queryParams.set('q', queryText);
              const href = queryParams.toString() ? `/podcasts?${queryParams.toString()}` : '/podcasts';

              return (
                <Link
                  key={cat}
                  href={href}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[38px] flex items-center ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-black'
                      : 'bg-white/5 text-brand-sandstone/80 hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {cat}
                </Link>
              );
            })}
          </div>

          {/* Territory Rail */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CARIBBEAN_PODCAST_TERRITORIES.map((t) => {
              const isActive = t.iso === activeTerritory;
              const queryParams = new URLSearchParams();
              if (activeCategory !== 'All Shows') queryParams.set('category', activeCategory);
              if (t.iso !== 'ALL') queryParams.set('territory', t.iso);
              if (queryText) queryParams.set('q', queryText);
              const href = queryParams.toString() ? `/podcasts?${queryParams.toString()}` : '/podcasts';

              return (
                <Link
                  key={t.iso}
                  href={href}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 min-h-[36px] ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-black'
                      : 'bg-white/5 text-brand-sandstone/80 hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <span>{t.flag}</span>
                  <span>{t.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Podcast Deck & Shows Feed */}
        <PodcastNetworkFeed podcasts={podcasts} user={user} />
      </div>

      <RightRail ariaLabel="Podcasts Sidebar">
        <PodcastsRail />
      </RightRail>
    </div>
  );
}
