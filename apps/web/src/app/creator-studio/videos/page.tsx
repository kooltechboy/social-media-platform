import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Video, ArrowLeft, Plus, Eye, Calendar, Sparkles } from 'lucide-react';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

interface VideoRow {
  id: string;
  title: string;
  video_kind: string;
  view_count: number;
  created_at: string;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function CreatorStudioVideosPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/login');

  const { data } = await supabase
    .from('videos')
    .select('id, title, video_kind, view_count, created_at')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false });

  const videos = (data ?? []) as VideoRow[];

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/creator-studio"
            className="p-2 rounded-xl bg-brand-dusk border border-slate-800 hover:text-white transition-colors text-xs flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Studio
          </Link>
          <h1 className="text-xl md:text-2xl font-black text-brand-sandstone flex items-center gap-2.5">
            <Video className="w-6 h-6 text-brand-caribbeanSea" /> Creator Videos &amp; Shorts
          </h1>
        </div>

        <Link
          href="/create"
          className="bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> New Video Post
        </Link>
      </div>

      {videos.length === 0 ? (
        <div className="bg-brand-dusk/60 border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <Video className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-brand-sandstone">No videos published yet</h3>
          <p className="text-xs text-brand-sandstone/60 max-w-sm mx-auto">
            Upload short-form clips, cultural documentaries, or fete highlights to engage Caribbean audiences.
          </p>
          <Link
            href="/create"
            className="inline-block bg-brand-caribbeanSea text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs mt-2"
          >
            Publish First Video
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-brand-dusk/80 border border-slate-800 rounded-2xl p-4 space-y-3 hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-twilight text-brand-caribbeanSea border border-slate-800 uppercase">
                  {video.video_kind}
                </span>
                <h4 className="text-sm font-bold text-brand-sandstone mt-2 line-clamp-2">{video.title}</h4>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-brand-sandstone/60">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-brand-goldenHour" /> {video.view_count.toLocaleString()} views
                </span>
                <span className="text-[11px] text-brand-sandstone/40">{relativeTime(video.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
