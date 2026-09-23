import React from 'react';
import type { Metadata } from 'next';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import { isFeedMode, type FeedMode } from '@caribbean/social';
import { buildRankedFeed } from '../../../lib/feed/ranking';
import { hydratePostsEngagement } from '../../../lib/feed/hydrate-posts';
import { fetchTrendingSignalsAction } from '../../../lib/explore/actions';
import FeedsTimelineClient from '../../../components/feed/feeds-timeline-client';

export const dynamic = 'force-dynamic';

interface FeedsTabRouteProps {
  params: Promise<{ tab: string }>;
  searchParams?: Promise<{ cursor?: string }>;
}

export async function generateMetadata({ params }: FeedsTabRouteProps): Promise<Metadata> {
  const { tab } = await params;
  const capitalized = tab.charAt(0).toUpperCase() + tab.slice(1).replace(/-/g, ' ');
  return {
    title: `${capitalized} Feed — TUKUBI Content Timelines`,
    description: `Browse the dedicated ${capitalized} timeline on TUKUBI.`,
  };
}

export default async function FeedsTabRoute(props: FeedsTabRouteProps) {
  const { tab } = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : {};
  const cursor = typeof searchParams.cursor === 'string' ? searchParams.cursor : undefined;

  let normalizedMode = typeof tab === 'string' ? tab.toLowerCase().replace(/-/g, '_') : 'following';
  if (normalizedMode === 'foryou') normalizedMode = 'for_you';
  const activeMode: FeedMode = isFeedMode(normalizedMode) ? (normalizedMode as FeedMode) : 'following';

  const [user, supabase] = await Promise.all([
    getCurrentUser(),
    createSupabaseServerClient(),
  ]);

  let livePosts: any[] = [];
  let nextCursor: string | undefined = undefined;
  let friendsCount = 0;
  let followingCount = 0;
  let trendingTopics: Array<{ tag: string; post_count?: number }> = [];
  let suggestedCreators: any[] = [];

  if (supabase) {
    const viewerId = user?.id || '00000000-0000-0000-0000-000000000000';

    const [postsRes, friendsRes, followsRes, trendingSignals, creatorsRes] = await Promise.all([
      buildRankedFeed(viewerId, activeMode, supabase, cursor, { skipCache: true }),
      user
        ? supabase
            .from('friendships')
            .select('id', { count: 'exact', head: true })
            .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
            .eq('status', 'accepted')
        : Promise.resolve({ count: 0 }),
      user
        ? supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id)
        : Promise.resolve({ data: [] }),
      fetchTrendingSignalsAction(),
      supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url, is_verified, origin_country_iso')
        .eq('account_type', 'creator')
        .limit(6),
    ]);

    friendsCount = friendsRes.count || 0;
    followingCount = followsRes.data?.length || 0;
    suggestedCreators = creatorsRes.data || [];

    trendingTopics = (trendingSignals || []).map((s) => ({
      tag: s.entity_label.replace(/^#/, ''),
      post_count: s.post_count_last_24h,
    }));

    const rawPosts = postsRes.data || [];
    nextCursor = postsRes.nextCursor;

    livePosts = await hydratePostsEngagement(rawPosts, supabase, {
      currentUserId: user?.id,
    });
  }

  return (
    <FeedsTimelineClient
      user={
        user
          ? {
              id: user.id,
              displayName: user.displayName || `@${user.username}`,
              username: user.username,
              avatarUrl: user.avatarUrl,
            }
          : null
      }
      activeMode={activeMode}
      initialPosts={livePosts}
      nextCursor={nextCursor}
      friendsCount={friendsCount}
      followingCount={followingCount}
      trendingTopics={trendingTopics}
      suggestedCreators={suggestedCreators}
    />
  );
}
