import React, { Suspense } from 'react';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import ReelsFeedViewer, { type ReelItem } from '../../components/reels/reels-feed-viewer';

export const dynamic = 'force-dynamic';

export default async function ReelsPage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeId = resolvedParams.id;

  const [user, supabase] = await Promise.all([
    getCurrentUser(),
    createSupabaseServerClient(),
  ]);

  let dynamicReels: ReelItem[] = [];

  if (supabase) {
    const { data: dbVideos } = await supabase
      .from('videos')
      .select('id, title, storage_path, duration_seconds, view_count, likes_count, comments_count, audio_track, location_tag, created_at, profiles(id, display_name, username)')
      .eq('video_kind', 'reel')
      .order('created_at', { ascending: false })
      .limit(20);

    if (dbVideos && dbVideos.length > 0) {
      dynamicReels = dbVideos.map((v: any, index: number) => {
        const p = v.profiles;
        const durationSecs = v.duration_seconds || 30;
        const gradients = [
          'from-purple-900/60 via-slate-900 to-[#090D16]',
          'from-amber-900/60 via-slate-900 to-[#090D16]',
          'from-sky-900/60 via-slate-900 to-[#090D16]',
          'from-rose-900/60 via-slate-900 to-[#090D16]',
        ];
        return {
          id: v.id,
          title: v.title,
          creatorId: p?.id,
          creator: p?.display_name || 'Caribbean Creator',
          handle: p?.username || 'creator',
          views: `${(v.view_count || 0).toLocaleString()} views`,
          likes: String(v.likes_count || 0),
          comments: String(v.comments_count || 0),
          sound: v.audio_track || 'Original Caribbean Audio',
          location: v.location_tag || 'Caribbean & Diaspora 🌴',
          duration: `${Math.floor(durationSecs / 60)}:${String(durationSecs % 60).padStart(2, '0')}`,
          gradient: gradients[index % gradients.length],
          videoUrl: v.storage_path,
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
    <div className="min-h-screen bg-transparent text-brand-sandstone flex flex-col items-center justify-start p-4 gap-6 max-w-5xl mx-auto">
      <Suspense
        fallback={
          <div className="w-full flex items-center justify-center p-20">
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
