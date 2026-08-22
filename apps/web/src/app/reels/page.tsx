import React from 'react';
import { Video, Music, Heart, MessageCircle, Share2 } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';

interface VideoRow {
  id: string;
  title: string;
  video_kind: 'reel' | 'long_form' | 'podcast_video';
  storage_path: string;
  duration_seconds: number;
  thumbnail_path: string | null;
  view_count: number;
  created_at: string;
  creator_id: string;
  profiles: { display_name: string; username: string } | null;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default async function ReelsPage() {
  const [user, supabase] = await Promise.all([getCurrentUser(), createSupabaseServerClient()]);

  let reels: VideoRow[] = [];
  if (supabase) {
    const { data } = await supabase
      .from('videos')
      .select('id, title, video_kind, storage_path, duration_seconds, thumbnail_path, view_count, created_at, creator_id, profiles(display_name, username)')
      .eq('video_kind', 'reel')
      .eq('visibility', 'public')
      .order('view_count', { ascending: false })
      .limit(20);
    reels = (data ?? []) as unknown as VideoRow[];
  }

  const featured = reels[0] ?? null;

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col items-center justify-start p-4 gap-4">
      <div className="w-full max-w-md space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-black text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-sky-400" /> Caribbean Reels
          </h1>
          {user ? (
            <Link
              href="/creator-studio"
              className="text-xs font-bold text-sky-400 hover:underline"
            >
              + Upload Reel
            </Link>
          ) : (
            <Link href="/login" className="text-xs font-semibold text-slate-400 hover:text-white">
              Sign in
            </Link>
          )}
        </div>

        {reels.length === 0 ? (
          <div className="bg-slate-900 border border-dashed border-slate-800 rounded-3xl overflow-hidden h-[680px] flex flex-col items-center justify-center gap-4">
            <Video className="w-12 h-12 text-slate-700" />
            <p className="text-sm text-slate-500 text-center px-8">
              No reels published yet. Caribbean creators will post short videos here.
            </p>
            {user && (
              <Link
                href="/creator-studio"
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-5 py-2 rounded-full text-xs transition-colors"
              >
                Upload the First Reel
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Featured reel player */}
            <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative h-[680px] flex flex-col justify-between p-5">
              {/* Simulated player background */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-900/30" />

              {/* Top bar */}
              <div className="flex items-center justify-between z-10 relative">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-950/80 text-sky-400 border border-sky-500/30 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5" /> {reels.length} Reel{reels.length !== 1 ? 's' : ''}
                </span>
                {featured && (
                  <span className="text-xs text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded-full">
                    {featured.view_count.toLocaleString()} views
                  </span>
                )}
              </div>

              {/* Center content — storage path placeholder until CDN is wired */}
              {featured && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-3 px-6">
                    <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto">
                      <Video className="w-8 h-8 text-slate-500" />
                    </div>
                    <p className="text-xs text-slate-500">Video playback requires CDN wiring</p>
                  </div>
                </div>
              )}

              {/* Right actions */}
              {featured && (
                <div className="absolute right-4 bottom-28 flex flex-col items-center gap-5 z-10">
                  <button
                    aria-label="Like reel"
                    className="flex flex-col items-center gap-1 text-slate-200 hover:text-red-400 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-full bg-slate-950/80 border border-slate-800 flex items-center justify-center">
                      <Heart className="w-5 h-5" />
                    </div>
                  </button>
                  <button
                    aria-label="Comment on reel"
                    className="flex flex-col items-center gap-1 text-slate-200 hover:text-sky-400 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-full bg-slate-950/80 border border-slate-800 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                  </button>
                  <button
                    aria-label="Share reel"
                    className="flex flex-col items-center gap-1 text-slate-200 hover:text-emerald-400 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-full bg-slate-950/80 border border-slate-800 flex items-center justify-center">
                      <Share2 className="w-5 h-5" />
                    </div>
                  </button>
                </div>
              )}

              {/* Bottom info */}
              {featured && (
                <div className="z-10 relative space-y-2 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${featured.profiles?.username ?? ''}`}
                      className="text-sm font-bold text-white hover:underline"
                    >
                      @{featured.profiles?.username ?? 'creator'}
                    </Link>
                    <span className="text-xs font-semibold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">
                      Follow
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-snug">{featured.title}</p>
                  <p className="text-[11px] text-slate-500">
                    {formatDuration(featured.duration_seconds)}
                  </p>
                </div>
              )}
            </div>

            {/* Reel list below */}
            {reels.length > 1 && (
              <div className="grid grid-cols-3 gap-2">
                {reels.slice(1).map((reel) => (
                  <div
                    key={reel.id}
                    className="aspect-[9/16] bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-sky-500/40 transition-all p-2"
                  >
                    <Video className="w-5 h-5 text-slate-600" />
                    <p className="text-[10px] text-slate-500 text-center truncate w-full px-1">{reel.title}</p>
                    <p className="text-[10px] text-slate-600">{reel.view_count.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
