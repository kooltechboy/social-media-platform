import React, { Suspense } from 'react';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import ReelsFeedViewer, { type ReelItem } from '../../components/reels/reels-feed-viewer';

export const dynamic = 'force-dynamic';

const SHOWCASE_REELS: ReelItem[] = [
  {
    id: 'reel-1',
    title: 'Carnival Road March 2026 Sneak Peek! Costume fitting and pure energy on the avenue 🎭✨',
    creator: 'Maya Chen',
    handle: 'mayasoca',
    views: '84.2K',
    likes: '14.5K',
    comments: '1,240',
    sound: 'Machel Montano • Soca Anthem 2026',
    soundId: 'sound-soca-01',
    location: 'Port of Spain, Trinidad 🇹🇹',
    duration: '0:45',
    gradient: 'from-purple-900/60 via-slate-900 to-[#090D16]',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-caribbean-tropical-beach-with-turquoise-water-41221-large.mp4',
  },
  {
    id: 'reel-2',
    title: 'Secret jerk chicken recipe from Portland, Jamaica. Firewood and pimento wood smoking all morning 🇯🇲🍗',
    creator: 'Chef Andre Black',
    handle: 'andrejerk',
    views: '112.0K',
    likes: '22.8K',
    comments: '2,890',
    sound: 'Bob Marley • Roots Rock Reggae',
    soundId: 'sound-reggae-05',
    location: 'Portland, Jamaica 🇯🇲',
    duration: '0:58',
    gradient: 'from-amber-900/60 via-slate-900 to-[#090D16]',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-top-aerial-shot-of-seashore-with-rocks-and-turquoise-water-41487-large.mp4',
  },
  {
    id: 'reel-3',
    title: 'Sunset bachata session on the Malecón in Santo Domingo with the local academy 🇩🇴💃',
    creator: 'Lucia & Mateo',
    handle: 'luciamateo',
    views: '96.3K',
    likes: '18.1K',
    comments: '940',
    sound: 'Juan Luis Guerra • Bachata Rosa',
    soundId: 'sound-bachata-04',
    location: 'Santo Domingo, Dominican Rep. 🇩🇴',
    duration: '0:35',
    gradient: 'from-sky-900/60 via-slate-900 to-[#090D16]',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-with-sun-rays-41617-large.mp4',
  },
];

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
      .select('id, title, storage_path, duration_seconds, view_count, created_at, profiles(id, display_name, username)')
      .eq('video_kind', 'reel')
      .order('created_at', { ascending: false })
      .limit(20);

    if (dbVideos && dbVideos.length > 0) {
      dynamicReels = dbVideos.map((v: any, index: number) => {
        const p = v.profiles;
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
          views: `${v.view_count || 1} views`,
          likes: '1.2K',
          comments: '48',
          sound: 'Original Caribbean Audio',
          location: 'Caribbean & Diaspora 🌴',
          duration: `0:${v.duration_seconds < 10 ? '0' : ''}${v.duration_seconds || 30}`,
          gradient: gradients[index % gradients.length],
          videoUrl: v.storage_path,
        };
      });
    }
  }

  const allReels = [...dynamicReels, ...SHOWCASE_REELS];

  // If specific activeId requested, reorder to place it first
  if (activeId) {
    const targetIdx = allReels.findIndex((r) => r.id === activeId);
    if (targetIdx > 0) {
      const [target] = allReels.splice(targetIdx, 1);
      allReels.unshift(target);
    }
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone flex flex-col items-center justify-start p-4 gap-6 max-w-5xl mx-auto">
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
