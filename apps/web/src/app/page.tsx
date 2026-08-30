import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Plus,
  Flame,
  Globe,
  Radio,
  Tv,
  Mic,
  Users,
  Sparkles,
  Play,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { createSupabaseServerClient, getCurrentUser } from '../lib/supabase/server';
import UniversalComposer from '../components/universal-composer';
import FeedStream, { type FeedPostData } from '../components/feed-stream';
import TukubiLiveSidebar from '../components/caribbean-now-sidebar';

export const dynamic = 'force-dynamic';

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

import MomentsCinemaRail from '../components/moments/moments-cinema-rail';
import { fetchActiveStoriesAction } from '../lib/social/actions';

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const supabase = await createSupabaseServerClient();
  const { stories: liveStories } = await fetchActiveStoriesAction();

  let livePosts: FeedPostData[] = [];
  if (supabase) {
    const [postsRes, liveRes] = await Promise.all([
      supabase
        .from('posts')
        .select('id, author_id, content, created_at, media_urls, cultural_tags, likes_count, comments_count, shares_count, profiles(display_name, username, avatar_url, is_verified)')
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('livestreams')
        .select('id, title, peak_viewers, profiles(display_name)')
        .eq('state', 'live')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const data = postsRes.data;
    const activeLiveStream = liveRes.data;

    let userLikedPostIds = new Set<string>();
    if (user && data && data.length > 0) {
      const postIds = data.map((p: any) => p.id);
      const { data: reactions } = await supabase
        .from('post_reactions')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);

      if (reactions) {
        userLikedPostIds = new Set(reactions.map((r: any) => r.post_id));
      }
    }

    if (data && data.length > 0) {
      livePosts = data.map((p: any) => {
        const rawProfile = p.profiles;
        const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
        return {
          id: p.id,
          authorId: p.author_id,
          author: profile?.display_name || 'Caribbean Member',
          handle: profile?.username || 'member',
          avatarUrl: profile?.avatar_url || null,
          verified: profile?.is_verified ?? true,
          location: 'Tukubi Network 🌴',
          time: relativeTime(p.created_at),
          content: p.content || '',
          mediaUrls: p.media_urls || [],
          culturalTags: p.cultural_tags || [],
          likes: p.likes_count || 0,
          reposts: p.shares_count || 0,
          comments: p.comments_count || 0,
          isUserLiked: userLikedPostIds.has(p.id),
          category: 'caribbean',
        };
      });
    }
  }

  const combinedPosts = livePosts;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Main Stream (Col 8) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Caribbean Moments Cinema Rail */}
        <MomentsCinemaRail
          initialStories={liveStories}
          currentUserId={user?.id}
          currentUserAvatar={user?.avatarUrl}
          currentUserName={user?.displayName}
        />

        {/* ────────────────────────────────────────────────────────── */}
        {/* P0: PRIMARY UNIVERSAL INLINE COMPOSER                      */}
        {/* ────────────────────────────────────────────────────────── */}
        <section aria-label="Create Post" className="space-y-4">
          <UniversalComposer
            displayName={`@${user.username}`}
            avatarInitials={user.username.slice(0, 2).toUpperCase()}
          />
        </section>

        {/* Live Audio / Video Quick Ingest Banner */}
        <section className="glass rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-xs text-brand-sandstone uppercase tracking-wider">
                  Caribbean Live Broadcasts
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                  REALTIME
                </span>
              </div>
              <p className="text-[11px] text-brand-sandstone/60">
                Broadcast live fete streams, dub sessions, or cultural talk shows across the diaspora.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/live/broadcast"
              className="hidden sm:inline-flex bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold px-3.5 py-2 rounded-2xl text-xs items-center gap-1.5 transition-all shadow-md shadow-red-600/20"
            >
              🔴 Go Live
            </Link>
            <Link
              href="/live"
              className="bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/30 font-extrabold px-4 py-2 rounded-2xl text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Watch Live
            </Link>
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────── */}
        {/* INTERACTIVE FEED STREAM WITH LIVE LIKES, COMMENTS & TABS   */}
        {/* ────────────────────────────────────────────────────────── */}
        <section aria-label="Caribbean Feed Stream">
          <FeedStream initialPosts={combinedPosts} currentUserId={user?.id} />
        </section>
      </div>

      {/* Right Column: TUKUBI Live & Diaspora Pulse (Col 4) */}
      <div className="lg:col-span-4">
        <TukubiLiveSidebar />
      </div>
    </div>
  );
}



