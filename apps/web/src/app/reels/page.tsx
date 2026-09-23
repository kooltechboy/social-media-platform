import React, { Suspense } from 'react';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import ReelsFeedViewer, { type ReelItem } from '../../components/reels/reels-feed-viewer';

export const dynamic = 'force-dynamic';

export default async function ReelsPage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string; tab?: string; category?: string; country?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeId = resolvedParams.id;
  const currentTab = resolvedParams.tab || 'for_you';
  const selectedCategory = resolvedParams.category;
  const selectedCountry = resolvedParams.country;

  const [user, supabase] = await Promise.all([
    getCurrentUser(),
    createSupabaseServerClient(),
  ]);

  let dynamicReels: ReelItem[] = [];

  if (supabase) {
    let query = supabase
      .from('videos')
      .select('id, title, storage_path, duration_seconds, view_count, likes_count, comments_count, audio_track, sound_id, location_tag, country_id, captions, created_at, profiles(id, display_name, username, avatar_url)')
      .eq('video_kind', 'reel')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(30);

    if (currentTab === 'following' && user) {
      const { data: followRows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = (followRows || []).map((f) => f.following_id);
      if (followingIds.length > 0) {
        query = query.in('creator_id', followingIds);
      } else {
        query = query.eq('creator_id', '00000000-0000-0000-0000-000000000000'); // empty result
      }
    } else if (currentTab === 'caribbean') {
      if (selectedCountry) {
        query = query.or(`location_tag.ilike.%${selectedCountry}%,title.ilike.%${selectedCountry}%`);
      } else {
        query = query.not('location_tag', 'is', null);
      }
    } else if (currentTab === 'communities' && user) {
      const { data: memberRows } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('profile_id', user.id);

      const communityIds = (memberRows || []).map((m) => m.community_id);
      if (communityIds.length > 0) {
        query = query.or(`location_tag.ilike.%community%,title.ilike.%community%`);
      }
    }

    if (selectedCategory) {
      query = query.ilike('title', `%${selectedCategory}%`);
    }

    const { data: dbVideos } = await query;

    const validVideos = (dbVideos || []).filter(
      (v: any) => typeof v.storage_path === 'string' && v.storage_path.trim().length > 0
    );

    if (validVideos.length > 0) {
      // Check which reels are liked by the current authenticated user
      let likedReelIds = new Set<string>();
      if (user) {
        const videoIds = validVideos.map((v) => v.id);
        const { data: likedRows } = await supabase
          .from('video_views')
          .select('video_id')
          .eq('viewer_id', user.id)
          .eq('completed', true)
          .in('video_id', videoIds);

        likedReelIds = new Set((likedRows || []).map((r) => r.video_id));
      }

      dynamicReels = validVideos.map((v: any, index: number) => {
        const p = v.profiles;
        const durationSecs = v.duration_seconds || 30;
        const gradients = [
          'from-purple-900/60 via-slate-900 to-[#110D17]',
          'from-amber-900/60 via-slate-900 to-[#110D17]',
          'from-sky-900/60 via-slate-900 to-[#110D17]',
          'from-rose-900/60 via-slate-900 to-[#110D17]',
        ];
        return {
          id: v.id,
          title: v.title,
          creatorId: p?.id,
          creator: p?.display_name || (p?.username ? `@${p.username}` : 'Creator'),
          handle: p?.username || '',
          views: `${(v.view_count || 0).toLocaleString()} views`,
          likes: String(v.likes_count || 0),
          comments: String(v.comments_count || 0),
          sound: v.audio_track || 'Original Caribbean Audio',
          soundId: v.sound_id || undefined,
          location: v.location_tag || '',
          duration: `${Math.floor(durationSecs / 60)}:${String(durationSecs % 60).padStart(2, '0')}`,
          gradient: gradients[index % gradients.length],
          videoUrl: v.storage_path,
          initialLiked: likedReelIds.has(v.id),
          captions: v.captions && Object.keys(v.captions).length > 0 ? v.captions : undefined,
        };
      });
    }
  }

  const allReels = dynamicReels;

  // If specific activeId requested, reorder to place it first
  if (activeId) {
    const targetIdx = allReels.findIndex((r) => r.id === activeId);
    if (targetIdx > 0) {
      const [target] = allReels.splice(targetIdx, 1);
      allReels.unshift(target);
    }
  }

  return (
    <div className="h-[100dvh] overflow-hidden">
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center p-20 bg-black">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <ReelsFeedViewer
          initialReels={allReels}
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
