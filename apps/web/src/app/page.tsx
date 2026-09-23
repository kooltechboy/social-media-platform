import React from 'react';
import {
  createSupabaseServerClient,
  getCurrentUser,
} from '../lib/supabase/server';
import { isFeedMode, type FeedMode } from '@caribbean/social';
import { encodeCursor } from '@caribbean/database';
import { buildRankedFeed } from '../lib/feed/ranking';
import { hydratePostsEngagement } from '../lib/feed/hydrate-posts';
import { fetchActiveStoriesAction } from '../lib/social/actions';
import { fetchTrendingSignalsAction } from '../lib/explore/actions';
import PublicFrontDoor from '../components/public-front-door';
import HomeDashboard from '../components/home/home-dashboard';
import { type FeedPostData } from '../components/feed-stream';

export const dynamic = 'force-dynamic';

interface RootPageProps {
  searchParams?: Promise<{ tab?: string; filter?: string; mode?: string; cursor?: string }>;
}

export default async function RootPage(props: RootPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    return <PublicFrontDoor />;
  }

  const searchParams = props.searchParams ? await props.searchParams : {};
  const rawMode = searchParams.tab || searchParams.filter || searchParams.mode || 'for_you';
  const cursor = typeof searchParams.cursor === 'string' ? searchParams.cursor : undefined;

  let normalizedMode = typeof rawMode === 'string' ? rawMode.toLowerCase().replace(/-/g, '_') : 'for_you';
  if (normalizedMode === 'foryou') normalizedMode = 'for_you';
  const activeMode: FeedMode = isFeedMode(normalizedMode) ? (normalizedMode as FeedMode) : 'for_you';

  const supabase = await createSupabaseServerClient();
  const { stories: liveStories } = await fetchActiveStoriesAction();

  let livePosts: FeedPostData[] = [];
  let nextCursor: string | undefined = undefined;
  let activeLiveStream: any = null;
  let topReels: any[] = [];
  let marketProducts: any[] = [];
  let culturalEvents: any[] = [];
  let suggestedPeople: any[] = [];
  let trendingTopics: Array<{ tag: string; post_count?: number }> = [];
  let friendsCount = 0;
  let followingCount = 0;

  if (supabase) {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const nowIso = new Date().toISOString();

    const [postsRes, liveRes, reelsRes, marketRes, eventsRes, peopleRes, followsRes, friendsRes, trendingSignals] =
      await Promise.all([
        buildRankedFeed(user.id, activeMode, supabase, cursor, { skipCache: true }),
        supabase
          .from('livestreams')
          .select('id, title, peak_viewers, profiles(display_name)')
          .eq('state', 'live')
          .gte('started_at', sixHoursAgo)
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('videos')
          .select('id, title, duration_seconds, view_count, profiles(id, display_name, username, avatar_url)')
          .eq('video_kind', 'reel')
          .eq('visibility', 'public')
          .order('view_count', { ascending: false })
          .limit(4),
        supabase
          .from('products')
          .select('id, title, price_minor, currency, businesses(name, country_iso)')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('events')
          .select('id, title, start_time, location_name')
          .gte('start_time', nowIso)
          .order('start_time', { ascending: true })
          .limit(2),
        supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url, is_verified, origin_country_iso')
          .neq('id', user.id)
          .order('is_verified', { ascending: false })
          .limit(6),
        supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id),
        supabase
          .from('friendships')
          .select('id', { count: 'exact', head: true })
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
          .eq('status', 'accepted'),
        fetchTrendingSignalsAction(),
      ]);

    friendsCount = friendsRes.count || 0;
    followingCount = followsRes.data?.length || 0;

    trendingTopics = (trendingSignals || []).map((s) => ({
      tag: s.entity_label.replace(/^#/, ''),
      post_count: s.post_count_last_24h,
    }));

    activeLiveStream = liveRes.data
      ? {
          id: liveRes.data.id,
          title: liveRes.data.title,
          peak_viewers: liveRes.data.peak_viewers,
          creator_name: (liveRes.data.profiles as any)?.display_name,
        }
      : null;

    topReels = reelsRes.data || [];
    marketProducts = marketRes.data || [];
    culturalEvents = eventsRes.data || [];

    const followingSet = new Set(followsRes.data?.map((f: any) => f.following_id) || []);
    suggestedPeople = (peopleRes.data || []).map((p: any) => ({
      ...p,
      is_following: followingSet.has(p.id),
    }));

    const rawPosts = postsRes.data || [];
    if (postsRes.nextCursor) {
      nextCursor = postsRes.nextCursor;
    } else if (rawPosts.length === 30) {
      const lastPost = rawPosts[rawPosts.length - 1];
      nextCursor = encodeCursor({ sortKey: lastPost.created_at, id: lastPost.id });
    }

    livePosts = await hydratePostsEngagement(rawPosts, supabase, {
      currentUserId: user.id,
    });

    // Authoritative Official Post fallback for initial For You feed
    if (activeMode === 'for_you') {
      const hasOfficialPost = livePosts.some(
        (p) => p.handle?.toLowerCase() === 'tukubi' || p.id === 'd23f3e75-0dfa-47c6-8df9-2c0fa299d7ff'
      );
      if (!hasOfficialPost && !cursor) {
        const officialLaunchPost: FeedPostData = {
          id: 'd23f3e75-0dfa-47c6-8df9-2c0fa299d7ff',
          authorId: 'ff1e8b1f-7796-4424-b341-3b39e1c993bd',
          author: 'TUKUBI',
          handle: 'tukubi',
          avatarUrl: '/brand/tukubi-emblem.png',
          verified: true,
          isOfficial: true,
          isPinned: true,
          officialContentType: 'welcome',
          location: 'Tukubi Network 🌴',
          time: 'Inaugural Launch',
          content: `🌴 Welcome to TUKUBI — The Caribbean Connected.\n\nConnecting Caribbean people, culture, creators, businesses & the global diaspora in one unified digital ecosystem.\n\n🌎 Born in the Caribbean. Built for the World.\n\nJoin conversations across the islands, explore live audio/video broadcasts, discover local creators, support Caribbean merchants, and build the future of our digital heritage together. ☀️🌊🎶`,
          mediaUrls: [],
          culturalTags: ['caribbean', 'tukubiofficial', 'welcome', 'diaspora', 'culture'],
          likes: 0,
          reposts: 0,
          comments: 0,
          isUserLiked: false,
          category: 'caribbean',
        };
        livePosts = [officialLaunchPost, ...livePosts];
      }
    }
  }

  return (
    <HomeDashboard
      user={{
        id: user.id,
        displayName: user.displayName || `@${user.username}`,
        username: user.username,
        avatarUrl: user.avatarUrl,
      }}
      initialMode={activeMode}
      initialPosts={livePosts}
      nextCursor={nextCursor}
      friendsCount={friendsCount}
      followingCount={followingCount}
      liveStories={liveStories}
      activeLiveStream={activeLiveStream}
      topReels={topReels}
      marketProducts={marketProducts}
      culturalEvents={culturalEvents}
      suggestedPeople={suggestedPeople}
      trendingTopics={trendingTopics}
    />
  );
}
