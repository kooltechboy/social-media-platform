import React, { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mic, Rss, Lock, Headphones, Radio } from 'lucide-react';
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
      podcast = {
        id: dbPod.id,
        title: dbPod.title,
        slug: dbPod.slug,
        description: dbPod.description,
        is_paid: dbPod.is_paid,
        follower_count: dbPod.follower_count,
        language: dbPod.language,
        cover_path: dbPod.cover_path,
        creator_id: dbPod.creator_id,
        category: 'Culture & Talk',
        episodesCount: 12,
        profiles: dbPod.profiles as any,
      };
    }
  }

  // Fallback showcase if not in DB yet
  if (!podcast) {
    podcast = {
      id: `pod-${slug}`,
      title: slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      slug,
      description: 'Exclusive episodes, stories, and interviews from across the Caribbean and Diaspora.',
      is_paid: false,
      follower_count: 8450,
      language: 'English',
      cover_path: null,
      creator_id: 'creator-showcase',
      category: 'Culture & Society',
      episodesCount: 18,
      profiles: { display_name: 'Caribbean Network Host', username: 'caribbeannetwork' },
    };
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
