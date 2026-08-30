import React, { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Radio } from 'lucide-react';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import PodcastNetworkFeed, { type PodcastShowItem } from '../../../components/podcasts/podcast-network-feed';

export const dynamic = 'force-dynamic';

export default async function PodcastShowPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ t?: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  let podcast: PodcastShowItem | null = null;

  if (supabase) {
    const { data: dbPod } = await supabase
      .from('podcasts')
      .select('id, title, slug, description, is_paid, follower_count, language, cover_path, creator_id, profiles(display_name, username)')
      .eq('slug', slug)
      .maybeSingle();

    if (dbPod) {
      const { count: epCount } = await supabase
        .from('podcast_episodes')
        .select('id', { count: 'exact', head: true })
        .eq('podcast_id', dbPod.id);

      podcast = {
        id: dbPod.id,
        title: dbPod.title,
        slug: dbPod.slug,
        description: dbPod.description,
        is_paid: dbPod.is_paid,
        follower_count: dbPod.follower_count ?? 0,
        language: dbPod.language,
        cover_path: dbPod.cover_path,
        creator_id: dbPod.creator_id,
        category: 'Culture & Talk',
        episodesCount: epCount ?? 0,
        profiles: dbPod.profiles as any,
      };
    }
  }

  if (!podcast) {
    return (
      <div className="min-h-screen bg-[#090D16] text-brand-sandstone p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/podcasts"
            className="p-2 rounded-xl bg-brand-dusk border border-slate-800 text-brand-sandstone/80 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> All Podcasts
          </Link>
        </div>

        <div className="p-12 rounded-3xl bg-brand-dusk/60 border border-slate-800 text-center space-y-4 max-w-lg mx-auto my-12">
          <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
            <Radio className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white">Podcast Show Not Found</h2>
          <p className="text-xs text-brand-sandstone/70 leading-relaxed">
            The requested Caribbean podcast series does not exist or has not been published yet. Creators can produce and broadcast new podcast series directly from Creator Studio.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/podcasts"
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors"
            >
              Browse Shows
            </Link>
            <Link
              href="/creator-studio"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black transition-colors shadow-md shadow-purple-600/20"
            >
              Creator Studio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center gap-3">
        <Link
          href="/podcasts"
          className="p-2 rounded-xl bg-brand-dusk border border-slate-800 text-brand-sandstone/80 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> All Podcasts
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-brand-sandstone/60">Show /</span>
          <span className="text-xs font-bold text-brand-sandstone truncate">{podcast.title}</span>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="w-full flex items-center justify-center p-20">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <PodcastNetworkFeed
          podcasts={[podcast]}
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
