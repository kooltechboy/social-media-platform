import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import ShortsFeedViewer from '../../components/shorts/shorts-feed-viewer';
import type { ShortItem } from '../../components/shorts/short-card';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'TUKUBI Shorts — Caribbean Short-Form Video',
  description: 'Discover vibrant Caribbean culture, music, carnival, comedy, and island life in full-screen vertical video.',
};

export default async function ShortsPage({
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

  let dynamicShorts: ShortItem[] = [];

  // Sanitize URL-derived values before they reach PostgREST filter strings.
  const ALLOWED_CATEGORIES = new Set(['culture', 'music', 'food', 'comedy', 'island_life', 'travel']);
  const safeCategory =
    selectedCategory && ALLOWED_CATEGORIES.has(selectedCategory) ? selectedCategory : null;
  const safeCountry = selectedCountry
    ? selectedCountry.replace(/[^a-zA-Z0-9 &.'-]/g, '').slice(0, 60).trim() || null
    : null;

  const ENHANCED_SELECT = `
        id, title, storage_path, thumbnail_path, duration_seconds, view_count, likes_count,
        comments_count, audio_track, sound_id, location_tag, country_id, category, captions,
        created_at, page_id, creator_id,
        profiles(id, display_name, username, avatar_url, is_verified),
        businesses:page_id(id, name, slug, avatar_url, is_verified)
      `;
  // Legacy shape (pre-migration 00110) — identical to the proven /reels query.
  const LEGACY_SELECT =
    'id, title, storage_path, duration_seconds, view_count, likes_count, comments_count, audio_track, sound_id, location_tag, country_id, captions, created_at, creator_id, profiles(id, display_name, username, avatar_url)';

  if (supabase) {
    let followingIds: string[] | null = null;
    if (currentTab === 'following' && user) {
      const { data: followRows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      followingIds = (followRows || []).map((f) => f.following_id);
    }

    const buildQuery = (enhanced: boolean) => {
      const selectColumns: string = enhanced ? ENHANCED_SELECT : LEGACY_SELECT;
      // Builder typed loosely: supabase-js select-string inference explodes on dynamic column lists (TS2590).
      let query: any = supabase
        .from('videos')
        .select(selectColumns)
        .in('video_kind', enhanced ? ['short', 'reel'] : ['reel'])
        .eq('visibility', 'public')
        .limit(40);

      if (enhanced) {
        query = query.eq('moderation_status', 'approved');
      }

      // Feed Tabs Filtering — each tab is backed by real data, never fabricated.
      if (currentTab === 'following') {
        if (followingIds && followingIds.length > 0) {
          query = query.in('creator_id', followingIds).order('created_at', { ascending: false });
        } else {
          query = query.eq('creator_id', '00000000-0000-0000-0000-000000000000'); // deterministic empty
        }
      } else if (currentTab === 'trending') {
        // Measurable popularity: real likes, then real views.
        query = query
          .order('likes_count', { ascending: false })
          .order('view_count', { ascending: false });
      } else if (currentTab === 'caribbean') {
        if (safeCountry) {
          query = query
            .or(`location_tag.ilike.%${safeCountry}%,title.ilike.%${safeCountry}%`)
            .order('created_at', { ascending: false });
        } else {
          query = query.not('location_tag', 'is', null).order('created_at', { ascending: false });
        }
      } else {
        // 'for_you' default tab — deterministic recency until ranking signals mature.
        query = query.order('created_at', { ascending: false });
      }

      if (safeCategory) {
        query = enhanced
          ? query.eq('category', safeCategory)
          : query.ilike('title', `%${safeCategory}%`);
      }
      return query;
    };

    let { data: dbVideos, error: feedError } = await buildQuery(true);
    if (feedError) {
      console.warn('[ShortsPage] Enhanced feed query failed, falling back to legacy shape:', feedError.message);
      ({ data: dbVideos } = await buildQuery(false));
    }

    const validVideos = (dbVideos || []).filter(
      (v: any) => typeof v.storage_path === 'string' && v.storage_path.trim().length > 0
    );

    if (validVideos.length > 0) {
      let likedShortIds = new Set<string>();
      if (user) {
        const videoIds: string[] = validVideos.map((v: any) => v.id);
        const { data: likedRows } = await supabase
          .from('video_views')
          .select('video_id')
          .eq('viewer_id', user.id)
          .eq('completed', true)
          .in('video_id', videoIds);

        likedShortIds = new Set((likedRows || []).map((r) => r.video_id));
      }

      const gradients = [
        'from-purple-900/60 via-slate-900 to-[#110D17]',
        'from-amber-900/60 via-slate-900 to-[#110D17]',
        'from-sky-900/60 via-slate-900 to-[#110D17]',
        'from-rose-900/60 via-slate-900 to-[#110D17]',
        'from-emerald-900/60 via-slate-900 to-[#110D17]',
      ];

      dynamicShorts = validVideos.map((v: any, index: number) => {
        const p = v.profiles;
        const b = v.businesses;
        const durationSecs = v.duration_seconds || 30;

        // Determine creator attribution: Page takes precedence if page_id is populated
        const creatorName = b?.name || p?.display_name || (p?.username ? `@${p.username}` : 'Caribbean Creator');
        const handle = (b?.slug || p?.username || '').replace(/^@+/, '');
        const avatarUrl = b?.avatar_url || p?.avatar_url || null;
        const isVerified = b?.is_verified || p?.is_verified || false;

        return {
          id: v.id,
          title: v.title,
          creatorId: v.creator_id || p?.id,
          creator: creatorName,
          handle,
          avatarUrl,
          isVerified,
          pageId: b?.id || null,
          pageName: b?.name || null,
          pageSlug: b?.slug || null,
          views: `${(v.view_count || 0).toLocaleString()} views`,
          likes: String(v.likes_count || 0),
          comments: String(v.comments_count || 0),
          sound: v.audio_track || 'Original Caribbean Audio',
          soundId: v.sound_id || undefined,
          location: v.location_tag || '',
          category: v.category || 'culture',
          duration: `${Math.floor(durationSecs / 60)}:${String(durationSecs % 60).padStart(2, '0')}`,
          gradient: gradients[index % gradients.length],
          videoUrl: v.storage_path,
          thumbnailUrl: v.thumbnail_path || undefined,
          initialLiked: likedShortIds.has(v.id),
          captions: v.captions && Object.keys(v.captions).length > 0 ? v.captions : undefined,
        };
      });
    }
  }

  const allShorts = dynamicShorts;

  // If specific activeId requested via deep link (?id=...), reorder to place it first
  if (activeId) {
    const targetIdx = allShorts.findIndex((s) => s.id === activeId);
    if (targetIdx > 0) {
      const [target] = allShorts.splice(targetIdx, 1);
      allShorts.unshift(target);
    }
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-black">
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center p-20 bg-black">
            <div className="w-8 h-8 border-2 border-brand-caribbeanSea border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <ShortsFeedViewer
          initialShorts={allShorts}
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
