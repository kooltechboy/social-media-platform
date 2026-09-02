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
import OfficialAccountHeroCard from '../components/official/official-account-hero-card';
import { fetchActiveStoriesAction } from '../lib/social/actions';

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const supabase = await createSupabaseServerClient();
  const { stories: liveStories } = await fetchActiveStoriesAction();

  let livePosts: FeedPostData[] = [];
  let officialProfile: any = null;
  let officialCounts: any = null;

  if (supabase) {
    const [postsRes, liveRes, officialProfileRes, officialCountsRes] = await Promise.all([
      supabase
        .from('posts')
        .select('id, author_id, content, created_at, media_urls, cultural_tags, likes_count, comments_count, shares_count, profiles:profiles!posts_author_id_fkey(display_name, username, avatar_url, is_verified)')
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('livestreams')
        .select('id, title, peak_viewers, profiles(display_name)')
        .eq('state', 'live')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url, bio, is_verified')
        .ilike('username', 'tukubi')
        .maybeSingle(),
      supabase
        .from('profile_counts')
        .select('followers_count, following_count, posts_count')
        .eq('profile_id', 'ff1e8b1f-7796-4424-b341-3b39e1c993bd')
        .maybeSingle(),
    ]);

    let data = postsRes.data;
    if (!data && postsRes.error) {
      const fallbackPosts = await supabase
        .from('posts')
        .select('id, author_id, content, created_at, media_urls, cultural_tags, likes_count, comments_count, shares_count, profiles(display_name, username, avatar_url, is_verified)')
        .order('created_at', { ascending: false })
        .limit(30);
      data = fallbackPosts.data;
    }

    const activeLiveStream = liveRes.data;
    officialProfile = officialProfileRes.data;
    officialCounts = officialCountsRes.data;

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
        const isPostOfficial = profile?.username?.toLowerCase() === 'tukubi' || profile?.is_verified || false;
        return {
          id: p.id,
          authorId: p.author_id,
          author: profile?.display_name || 'Caribbean Member',
          handle: profile?.username || 'member',
          avatarUrl: profile?.avatar_url || (profile?.username?.toLowerCase() === 'tukubi' ? '/brand/tukubi-emblem.png' : null),
          verified: profile?.is_verified ?? false,
          isOfficial: isPostOfficial,
          isPinned: isPostOfficial,
          officialContentType: isPostOfficial ? 'welcome' : undefined,
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

    // Guarantee Authoritative Official Launch Post if not already in live feed
    const hasOfficialPost = livePosts.some((p) => p.handle?.toLowerCase() === 'tukubi' || p.id === 'd23f3e75-0dfa-47c6-8df9-2c0fa299d7ff');
    if (!hasOfficialPost) {
      const officialLaunchPost: FeedPostData = {
        id: 'd23f3e75-0dfa-47c6-8df9-2c0fa299d7ff',
        authorId: officialProfile?.id || 'ff1e8b1f-7796-4424-b341-3b39e1c993bd',
        author: officialProfile?.display_name || 'TUKUBI',
        handle: officialProfile?.username || 'tukubi',
        avatarUrl: officialProfile?.avatar_url || '/brand/tukubi-emblem.png',
        verified: true,
        isOfficial: true,
        isPinned: true,
        officialContentType: 'welcome',
        location: 'Tukubi Network 🌴',
        time: 'Inaugural Launch',
        content: `🌴 Welcome to TUKUBI — The Caribbean Connected.\n\nConnecting Caribbean people, culture, creators, businesses & the global diaspora in one unified digital ecosystem.\n\n🌎 Born in the Caribbean. Built for the World.\n\nJoin conversations across the islands, explore live audio/video broadcasts, discover local creators, support Caribbean merchants, and build the future of our digital heritage together. ☀️🌊🎶`,
        mediaUrls: [],
        culturalTags: ['caribbean', 'tukubiofficial', 'welcome', 'diaspora', 'culture'],
        likes: officialCounts?.likes_received_count || 0,
        reposts: 0,
        comments: 0,
        isUserLiked: false,
        category: 'caribbean',
      };
      livePosts = [officialLaunchPost, ...livePosts];
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
        {/* OFFICIAL TUKUBI PLATFORM IDENTITY SPOTLIGHT HERO CARD     */}
        {/* ────────────────────────────────────────────────────────── */}
        <OfficialAccountHeroCard
          displayName={officialProfile?.display_name || 'TUKUBI'}
          username={officialProfile?.username || 'tukubi'}
          avatarUrl={officialProfile?.avatar_url}
          bio={officialProfile?.bio}
          postsCount={officialCounts?.posts_count ?? 0}
          followersCount={officialCounts?.followers_count ?? 0}
          followingCount={officialCounts?.following_count ?? 0}
          isOperator={user?.username?.toLowerCase() === 'tukubi' || user?.isOfficial}
        />

        {/* ────────────────────────────────────────────────────────── */}
        {/* P0: PRIMARY UNIVERSAL INLINE COMPOSER                      */}
        {/* ────────────────────────────────────────────────────────── */}
        <section aria-label="Create Post" className="space-y-4">
          <UniversalComposer
            displayName={user.displayName || `@${user.username}`}
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



