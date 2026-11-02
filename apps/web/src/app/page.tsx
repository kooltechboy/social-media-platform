import React from 'react';
import {
  createSupabaseServerClient,
  getCurrentUser,
} from '../lib/supabase/server';
import { type FeedMode } from '@caribbean/social';
import { normalizeFeedMode } from '../lib/feed/feed-mode-utils';
import { encodeCursor } from '@caribbean/database';
import { buildRankedFeed } from '../lib/feed/ranking';
import { hydratePostsEngagement } from '../lib/feed/hydrate-posts';
import { fetchActiveStoriesAction } from '../lib/social/actions';
import { fetchTrendingSignalsAction } from '../lib/explore/actions';
import { fetchMyPagesAction, fetchFollowedPagesAction } from '../lib/pages/actions';
import HomeDashboard from '../components/home/home-dashboard';
import { type FeedPostData } from '../components/feed-stream';
import PublicFrontDoor from '../components/public-front-door';

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
  const rawMode = searchParams.tab || searchParams.filter || searchParams.mode;
  const cursor = typeof searchParams.cursor === 'string' ? searchParams.cursor : undefined;
  const activeMode: FeedMode = normalizeFeedMode(rawMode);

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
  let myPages: any[] = [];
  let followedPages: any[] = [];

  if (supabase) {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const nowIso = new Date().toISOString();

    const [postsRes, liveRes, reelsRes, marketRes, eventsRes, peopleRes, followsRes, friendsRes, trendingSignals, myPagesRes, followedPagesRes] =
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
        fetchMyPagesAction(),
        fetchFollowedPagesAction(10),
      ]);

    myPages = myPagesRes || [];
    followedPages = followedPagesRes || [];

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
    marketProducts = (marketRes.data || []).map((p: any) => {
      const biz = Array.isArray(p.businesses) ? p.businesses[0] : p.businesses;
      return {
        ...p,
        seller_name: biz?.name || 'Merchant',
      };
    });
    culturalEvents = eventsRes.data || [];

    const followingSet = new Set(followsRes.data?.map((f: any) => f.following_id) || []);
    const allCandidates = (peopleRes.data || []).map((p: any) => ({
      ...p,
      is_following: followingSet.has(p.id),
    }));
    const notFollowing = allCandidates.filter((p) => !p.is_following);
    suggestedPeople = notFollowing.length > 0 ? notFollowing : allCandidates;

    const rawPosts = postsRes.data || [];
    if (trendingTopics.length === 0 && rawPosts.length > 0) {
      const tagCounts = new Map<string, number>();
      for (const p of rawPosts) {
        if (Array.isArray(p.cultural_tags)) {
          for (const t of p.cultural_tags) {
            const cleanTag = String(t).replace(/^#/, '').trim();
            if (cleanTag) {
              tagCounts.set(cleanTag, (tagCounts.get(cleanTag) || 0) + 1);
            }
          }
        }
        if (p.content) {
          const matched = p.content.match(/#([a-zA-Z0-9_\u00C0-\u017F]+)/g);
          if (matched) {
            for (const tagWithHash of matched) {
              const clean = tagWithHash.slice(1).trim();
              if (clean) {
                tagCounts.set(clean, (tagCounts.get(clean) || 0) + 1);
              }
            }
          }
        }
      }
      if (tagCounts.size > 0) {
        trendingTopics = Array.from(tagCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tag, count]) => ({
            tag,
            post_count: count,
          }));
      }
    }
    if (postsRes.nextCursor) {
      nextCursor = postsRes.nextCursor;
    } else if (rawPosts.length === 30) {
      const lastPost = rawPosts[rawPosts.length - 1];
      nextCursor = encodeCursor({ sortKey: lastPost.created_at, id: lastPost.id });
    }

    livePosts = await hydratePostsEngagement(rawPosts, supabase, {
      currentUserId: user.id,
    });

    // Authoritative Official Post contract: query persistent DB record if not in top ranked set
    if (activeMode === 'for_you') {
      const hasOfficialPost = livePosts.some(
        (p) => p.handle?.toLowerCase() === 'tukubi' || p.id === 'd23f3e75-0dfa-47c6-8df9-2c0fa299d7ff'
      );
      if (!hasOfficialPost && !cursor) {
        const { data: dbOfficialPost } = await supabase
          .from('posts')
          .select(`
            id, author_id, content, created_at, media_urls, cultural_tags, likes_count, comments_count, shares_count,
            visibility, post_status, scheduled_at, is_official, official_content_type, is_pinned, link_preview,
            profiles:profiles!posts_author_id_fkey(id, display_name, username, avatar_url, is_verified, is_official)
          `)
          .eq('id', 'd23f3e75-0dfa-47c6-8df9-2c0fa299d7ff')
          .maybeSingle();

        if (dbOfficialPost) {
          const hydrated = await hydratePostsEngagement([dbOfficialPost], supabase, {
            currentUserId: user.id,
          });
          if (hydrated.length > 0) {
            livePosts = [hydrated[0], ...livePosts];
          }
        }
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
      managedPages={myPages}
      followedPages={followedPages}
    />
  );
}
