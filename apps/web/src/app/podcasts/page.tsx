import React from 'react';
import { Mic, Play, Radio, Rss, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import FollowPodcastButton from '../../components/follow-podcast-button';

export const dynamic = 'force-dynamic';

interface Podcast {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  is_paid: boolean;
  follower_count: number;
  language: string | null;
  cover_path: string | null;
  creator_id: string;
  profiles: { display_name: string; username: string } | null;
  podcast_episodes: Array<{ id: string }>;
}

interface FollowRow {
  podcast_id: string;
}

export default async function PodcastsPage() {
  const [user, supabase] = await Promise.all([getCurrentUser(), createSupabaseServerClient()]);

  let podcasts: Podcast[] = [];
  let followingSet = new Set<string>();

  if (supabase) {
    const { data } = await supabase
      .from('podcasts')
      .select('id, title, slug, description, is_paid, follower_count, language, cover_path, creator_id, profiles(display_name, username), podcast_episodes(id)')
      .order('follower_count', { ascending: false })
      .limit(24);
    podcasts = (data ?? []) as unknown as Podcast[];

    if (user && podcasts.length > 0) {
      const { data: follows } = await supabase
        .from('podcast_followers')
        .select('podcast_id')
        .eq('profile_id', user.id)
        .in('podcast_id', podcasts.map((p) => p.id));
      for (const f of (follows ?? []) as FollowRow[]) {
        followingSet.add(f.podcast_id);
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-4 md:p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Mic className="w-8 h-8 text-amber-400" /> Caribbean Podcast Network
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Audio & video podcast publishing with AI transcripts, chapters, and RSS distribution.
          </p>
        </div>
        {user ? (
          <Link
            href="/creator-studio"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors"
          >
            <Radio className="w-4 h-4" /> Host Your Podcast
          </Link>
        ) : (
          <Link
            href="/login"
            className="bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
          >
            Sign in to Host
          </Link>
        )}
      </div>

      {podcasts.length === 0 ? (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <Mic className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">No podcasts yet.</p>
          <p className="text-xs text-slate-500 mt-1">Caribbean creators will host their podcasts here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {podcasts.map((podcast) => {
            const episodeCount = podcast.podcast_episodes?.length ?? 0;
            return (
              <article
                key={podcast.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-amber-500/40 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl">
                      🎙️
                    </div>
                    <div className="flex items-center gap-2">
                      {podcast.is_paid && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Premium
                        </span>
                      )}
                      <a
                        href={`/api/v1/podcasts/${podcast.id}/rss`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="RSS Feed"
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-500/30 flex items-center gap-1 hover:bg-amber-500/10 transition-colors"
                      >
                        <Rss className="w-3 h-3" /> RSS
                      </a>
                    </div>
                  </div>
                  <h3 className="font-bold text-base text-white leading-snug">{podcast.title}</h3>
                  <p className="text-xs text-slate-400">
                    {podcast.profiles?.display_name ?? 'Creator'} ·{' '}
                    {episodeCount} episode{episodeCount !== 1 ? 's' : ''}
                  </p>
                  {podcast.description && (
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{podcast.description}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400">
                    {podcast.follower_count.toLocaleString()} follower{podcast.follower_count !== 1 ? 's' : ''}
                  </span>
                  <FollowPodcastButton
                    podcastId={podcast.id}
                    isFollowing={followingSet.has(podcast.id)}
                    isAuthenticated={!!user}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
