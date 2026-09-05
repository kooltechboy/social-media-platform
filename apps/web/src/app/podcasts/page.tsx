import React from 'react';
import { Mic, Radio } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import PodcastNetworkFeed from '../../components/podcasts/podcast-network-feed';

export const dynamic = 'force-dynamic';

interface Podcast {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  is_paid: boolean;
  follower_count: number;
  language: string | null;
  cover_path: string | null;
  creator_id: string;
  profiles: { display_name: string; username: string } | null;
  podcast_episodes: Array<{ id: string }>;
  category?: string;
  episodesCount?: number;
}

const PODCAST_CATEGORIES = [
  'All Shows',
  'Culture & History',
  'Music & Sound Systems',
  'Business & Tech',
  'Food & Culinary',
  'Diaspora Life',
];

export default async function PodcastsPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; q?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeCategory = resolvedParams.category || 'All Shows';
  const queryText = resolvedParams.q || '';

  const [user, supabase] = await Promise.all([getCurrentUser(), createSupabaseServerClient()]);

  let podcasts: Podcast[] = [];
  let followingSet = new Set<string>();

  if (supabase) {
    let query = supabase
      .from('podcasts')
      .select('id, title, slug, description, is_paid, follower_count, language, cover_path, creator_id, profiles:profiles!podcasts_creator_id_fkey(display_name, username), podcast_episodes(id)')
      .order('follower_count', { ascending: false })
      .limit(24);

    if (queryText) {
      query = query.or(`title.ilike.%${queryText}%,description.ilike.%${queryText}%`);
    } else if (activeCategory === 'Music & Sound Systems') {
      query = query.or('title.ilike.%music%,title.ilike.%reggae%,title.ilike.%sound%,title.ilike.%soca%');
    } else if (activeCategory === 'Business & Tech') {
      query = query.or('title.ilike.%tech%,title.ilike.%business%,title.ilike.%startup%');
    } else if (activeCategory === 'Food & Culinary') {
      query = query.or('title.ilike.%food%,title.ilike.%culinary%,title.ilike.%recipe%');
    } else if (activeCategory === 'Culture & History') {
      query = query.or('title.ilike.%culture%,title.ilike.%history%,title.ilike.%roots%');
    }

    const { data } = await query;
    if (data && data.length > 0) {
      podcasts = data as unknown as Podcast[];
    }
  }

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="surface-header rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-purple-500/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-purple-500 animate-ping" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white flex items-center gap-3">
              <Mic className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400" /> Caribbean Podcast Network
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-brand-sandstone/80 mt-1 leading-relaxed">
            Audio &amp; video podcasts, AI transcripts, and iTunes-compliant RSS feeds.
          </p>
        </div>

        {user ? (
          <Link
            href="/creator-studio"
            className="bg-purple-600 hover:bg-purple-500 text-white font-black px-6 py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-600/30 self-start md:self-auto min-h-[44px]"
          >
            <Radio className="w-4 h-4" /> Host Your Podcast
          </Link>
        ) : (
          <Link
            href="/login"
            className="bg-purple-600/20 text-purple-300 border border-purple-500/40 font-black px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-purple-600/30 transition-all self-start md:self-auto min-h-[44px]"
          >
            Sign in to Host
          </Link>
        )}
      </div>

      {/* Categories Filter Rail */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {PODCAST_CATEGORIES.map((cat) => {
          const isActive = cat === activeCategory;
          return (
            <Link
              key={cat}
              href={cat === 'All Shows' ? '/podcasts' : `/podcasts?category=${encodeURIComponent(cat)}`}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[38px] flex items-center ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-black'
                  : 'bg-white/5 text-brand-sandstone/80 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              {cat}
            </Link>
          );
        })}
      </div>

      {/* Podcasts Grid with Live Audio Player */}
      <PodcastNetworkFeed
        podcasts={podcasts as any}
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
    </div>
  );
}
