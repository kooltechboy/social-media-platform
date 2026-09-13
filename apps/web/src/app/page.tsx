import React, { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Sparkles,
} from 'lucide-react';
import {
  createSupabaseServerClient,
  getCurrentUser,
  checkIsOfficialOperator,
} from '../lib/supabase/server';
import { isFeedMode, type FeedMode } from '@caribbean/social';
import { decodeCursor, encodeCursor } from '@caribbean/database';
import UniversalComposer from '../components/universal-composer';
import FeedStream, { type FeedPostData } from '../components/feed-stream';
import TukubiLiveSidebar from '../components/caribbean-now-sidebar';
import RightRail from '../components/right-rail';
import { buildRankedFeed } from '../lib/feed/ranking';
import MomentsCinemaRail from '../components/moments/moments-cinema-rail';
import FeedNavigation from '../components/feed/feed-navigation';
import LiveBroadcastDiscovery from '../components/feed/live-broadcast-discovery';
import { fetchActiveStoriesAction } from '../lib/social/actions';
import { ErrorBoundary } from '../components/error-boundary';
import FeedSkeleton from '../components/ui/skeletons/feed-skeleton';

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

export default async function HomePage(props: { searchParams?: Promise<{ mode?: string, cursor?: string }> }) {
  const searchParams = await props.searchParams;
  const modeParam = typeof searchParams?.mode === 'string' ? searchParams.mode : undefined;
  const mode = modeParam && isFeedMode(modeParam) ? (modeParam as FeedMode) : 'for_you';
  const cursor = typeof searchParams?.cursor === 'string' ? searchParams.cursor : undefined;

  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const supabase = await createSupabaseServerClient();
  const { stories: liveStories } = await fetchActiveStoriesAction();

  let livePosts: FeedPostData[] = [];
  let officialProfile: any = null;
  let officialCounts: any = null;
  let activeLiveStream: any = null;
  let isOfficialOperator = false;
  let nextCursor: string | undefined = undefined;

  if (supabase) {
    const [postsRes, liveRes, officialProfileRes, operatorStatus] = await Promise.all([
      buildRankedFeed(user.id, mode, supabase, cursor),
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
      checkIsOfficialOperator(user.id),
    ]);

    isOfficialOperator = operatorStatus;
    activeLiveStream = liveRes.data;
    officialProfile = officialProfileRes.data;

    let data = postsRes.data;
    if (!data && postsRes.error) {
      const fallbackPosts = await supabase
        .from('posts')
        .select('id, author_id, content, created_at, media_urls, cultural_tags, likes_count, comments_count, shares_count, country_id, profiles:profiles!posts_author_id_fkey(display_name, username, avatar_url, is_verified)')
        .order('created_at', { ascending: false })
        .limit(30);
      data = fallbackPosts.data as any;
    }

    if (postsRes.nextCursor) {
      nextCursor = postsRes.nextCursor;
    } else if (data && data.length === 30) {
      const lastPost = data[data.length - 1];
      nextCursor = encodeCursor({ sortKey: lastPost.created_at, id: lastPost.id });
    }

    if (officialProfile?.id) {
      const { data: counts } = await supabase
        .from('profile_counts')
        .select('followers_count, following_count, posts_count, likes_received_count')
        .eq('profile_id', officialProfile.id)
        .maybeSingle();
      officialCounts = counts;
    }

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
          location: 'Caribbean 🌴',
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

    // Guarantee official launch post appears on home feed if not yet returned
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
        location: 'Caribbean 🌴',
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
    <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start w-full">
      {/* Main Stream — Fluid width, bounded for optimal desktop readability (65-75 chars/line) */}
      <div className="flex-1 min-w-0 space-y-6 w-full max-w-[740px] xl:max-w-[760px] mx-auto lg:mx-0">
        {/* 1. Caribbean Moments Cinema Rail */}
        <ErrorBoundary sectionName="Moments Cinema Rail">
          <MomentsCinemaRail
            initialStories={liveStories}
            currentUserId={user?.id}
            currentUserAvatar={user?.avatarUrl}
            currentUserName={user?.displayName}
          />
        </ErrorBoundary>

        {/* 2. Feed Mode Navigation Tabs (For You / Following / Caribbean / Communities) */}
        <ErrorBoundary sectionName="Feed Navigation">
          <FeedNavigation currentMode={mode} />
        </ErrorBoundary>

        {/* 3. Primary Universal Inline Composer */}
        <section aria-label="Create Post" className="space-y-4">
          <ErrorBoundary sectionName="Composer">
            <UniversalComposer
              displayName={user.displayName || `@${user.username}`}
              avatarInitials={user.username.slice(0, 2).toUpperCase()}
            />
          </ErrorBoundary>
        </section>

        {/* 4. Live Broadcast Discovery (Intelligent: Active Stream Highlight or Clean Strip) */}
        <ErrorBoundary sectionName="Live Broadcasts">
          <LiveBroadcastDiscovery activeStream={activeLiveStream} />
        </ErrorBoundary>

        {/* 5. Caribbean Feed Stream */}
        <section aria-label="Caribbean Feed Stream">
          <ErrorBoundary sectionName="Feed Stream">
            <Suspense fallback={<FeedSkeleton />}>
              <FeedStream initialPosts={combinedPosts} currentUserId={user?.id} mode={mode} nextCursor={nextCursor} />
            </Suspense>
          </ErrorBoundary>
        </section>
      </div>

      {/* Right Column: TUKUBI Live & Diaspora Pulse */}
      <RightRail ariaLabel="TUKUBI Live & Diaspora Pulse">
        <ErrorBoundary sectionName="Caribbean Sidebar">
          <TukubiLiveSidebar
            officialProfile={officialProfile}
            officialCounts={officialCounts}
            isOfficialOperator={isOfficialOperator}
          />
        </ErrorBoundary>
      </RightRail>
    </div>
  );
}



