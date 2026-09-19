import React from 'react';
import { redirect } from 'next/navigation';
import {
  createSupabaseServerClient,
  getCurrentUser,
} from '../../lib/supabase/server';
import { buildRankedFeed } from '../../lib/feed/ranking';
import { hydratePostsEngagement } from '../../lib/feed/hydrate-posts';
import { fetchActiveStoriesAction } from '../../lib/social/actions';
import HomeDashboard from '../../components/home/home-dashboard';
import { type FeedPostData } from '../../components/feed-stream';

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

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?next=/home');
  }

  const supabase = await createSupabaseServerClient();
  const { stories: liveStories } = await fetchActiveStoriesAction();

  let livePosts: FeedPostData[] = [];
  let activeLiveStream: any = null;
  let topReels: any[] = [];
  let marketProducts: any[] = [];
  let culturalEvents: any[] = [];
  let suggestedPeople: any[] = [];

  if (supabase) {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const nowIso = new Date().toISOString();

    const [postsRes, liveRes, reelsRes, marketRes, eventsRes, peopleRes, followsRes] =
      await Promise.all([
        buildRankedFeed(user.id, 'for_you', supabase),
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
      ]);

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
    livePosts = await hydratePostsEngagement(rawPosts, supabase, {
      currentUserId: user.id,
    });
  }

  return (
    <HomeDashboard
      user={{
        id: user.id,
        displayName: user.displayName || `@${user.username}`,
        username: user.username,
        avatarUrl: user.avatarUrl,
      }}
      liveStories={liveStories}
      activeLiveStream={activeLiveStream}
      topReels={topReels}
      marketProducts={marketProducts}
      culturalEvents={culturalEvents}
      recentPosts={livePosts}
      suggestedPeople={suggestedPeople}
    />
  );
}
