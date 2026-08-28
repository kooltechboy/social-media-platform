import React from 'react';
import { Mic, Play, Radio, Rss, ArrowLeft, Volume2, Sparkles, Headphones, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import FollowPodcastButton from '../../components/follow-podcast-button';

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

const SHOWCASE_PODCASTS: Podcast[] = [
  {
    id: 'pod-1',
    title: 'The Caribbean Tech Exchange',
    slug: 'caribbean-tech-exchange',
    description: 'Conversations with software engineers, fintech founders, and venture builders across Kingston, Miami, and San Juan.',
    is_paid: false,
    follower_count: 8420,
    language: 'English',
    cover_path: null,
    creator_id: 'creator-tech',
    category: 'Technology & Startups',
    episodesCount: 42,
    profiles: { display_name: 'Daryl Washington', username: 'darylwash' },
    podcast_episodes: [{ id: '1' }, { id: '2' }],
  },
  {
    id: 'pod-2',
    title: 'Island Roots & Reggae History',
    slug: 'island-roots-reggae-history',
    description: 'Deep dives into sound system evolution, dubplate culture, and the icons who took Caribbean music global.',
    is_paid: true,
    follower_count: 14200,
    language: 'English / Patois',
    cover_path: null,
    creator_id: 'creator-dub',
    category: 'Music & Culture',
    episodesCount: 68,
    profiles: { display_name: 'Roots Archive Kingston', username: 'rootsarchive' },
    podcast_episodes: [{ id: '3' }],
  },
  {
    id: 'pod-3',
    title: 'Soca Therapy: Carnival & Road Talks',
    slug: 'soca-therapy-carnival-road',
    description: 'Weekly breakdowns of new soca releases, band reviews, costume designers, and carnival road safety.',
    is_paid: false,
    follower_count: 19800,
    language: 'English',
    cover_path: null,
    creator_id: 'creator-soca',
    category: 'Carnival & Entertainment',
    episodesCount: 95,
    profiles: { display_name: 'Aaliyah & Friends', username: 'aaliyahsoca' },
    podcast_episodes: [{ id: '4' }],
  },
  {
    id: 'pod-4',
    title: 'Diaspora Table: Culinary Stories',
    slug: 'diaspora-table',
    description: 'From jerk pits in Portland to roti shops in Flatbush and curry houses in Toronto, exploring our diaspora recipes.',
    is_paid: false,
    follower_count: 6100,
    language: 'English / Creole',
    cover_path: null,
    creator_id: 'creator-food',
    category: 'Food & Heritage',
    episodesCount: 29,
    profiles: { display_name: 'Chef Marcus', username: 'marcuscooks' },
    podcast_episodes: [{ id: '5' }],
  },
];

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
      .select('id, title, slug, description, is_paid, follower_count, language, cover_path, creator_id, profiles(display_name, username), podcast_episodes(id)')
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

  if (podcasts.length === 0) {
    if (activeCategory === 'All Shows') {
      podcasts = SHOWCASE_PODCASTS;
    } else if (activeCategory === 'Culture & History') {
      podcasts = SHOWCASE_PODCASTS.filter((p) => p.category?.includes('Culture') || p.category?.includes('History'));
    } else if (activeCategory === 'Music & Sound Systems') {
      podcasts = SHOWCASE_PODCASTS.filter((p) => p.category?.includes('Music') || p.category?.includes('Carnival'));
    } else if (activeCategory === 'Business & Tech') {
      podcasts = SHOWCASE_PODCASTS.filter((p) => p.category?.includes('Tech') || p.category?.includes('Business'));
    } else if (activeCategory === 'Food & Culinary') {
      podcasts = SHOWCASE_PODCASTS.filter((p) => p.category?.includes('Food') || p.category?.includes('Heritage'));
    } else {
      podcasts = SHOWCASE_PODCASTS;
    }
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone p-4 md:p-6 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-purple-500 animate-ping" />
            <h1 className="text-2xl md:text-3xl font-black text-brand-sandstone flex items-center gap-3">
              <Mic className="w-8 h-8 text-purple-400" /> Caribbean Podcast Network
            </h1>
          </div>
          <p className="text-xs md:text-sm text-brand-sandstone/60 mt-1">
            Audio &amp; video podcasts, AI transcripts, and iTunes-compliant RSS feeds.
          </p>
        </div>

        {user ? (
          <Link
            href="/creator-studio"
            className="bg-purple-600 hover:bg-purple-500 text-brand-sandstone font-extrabold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 transition-all shadow-md shadow-purple-600/20 self-start md:self-auto"
          >
            <Radio className="w-4 h-4" /> Host Your Podcast
          </Link>
        ) : (
          <Link
            href="/login"
            className="bg-purple-600/20 text-purple-300 border border-purple-500/40 font-extrabold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 hover:bg-purple-600/30 transition-all self-start md:self-auto"
          >
            Sign in to Host
          </Link>
        )}
      </div>

      {/* Categories Filter Rail */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
        {PODCAST_CATEGORIES.map((cat) => {
          const isActive = cat === activeCategory;
          return (
            <Link
              key={cat}
              href={cat === 'All Shows' ? '/podcasts' : `/podcasts?category=${encodeURIComponent(cat)}`}
              className={`px-4 py-1.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-purple-600 text-brand-sandstone shadow-md shadow-purple-600/20'
                  : 'bg-brand-dusk text-brand-sandstone/60 hover:text-brand-sandstone border border-slate-800'
              }`}
            >
              {cat}
            </Link>
          );
        })}
      </div>

      {/* Podcasts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {podcasts.map((podcast) => {
          const epCount = podcast.episodesCount ?? podcast.podcast_episodes?.length ?? 12;
          return (
            <article
              key={podcast.id}
              className="bg-brand-dusk/80 border border-slate-800/90 hover:border-purple-500/50 rounded-3xl p-6 space-y-4 flex flex-col justify-between transition-all shadow-xl group"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/20">
                    🎙️
                  </div>
                  <div className="flex items-center gap-2">
                    {podcast.is_paid && (
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-brand-goldenHour/20 text-amber-300 border border-brand-goldenHour/30">
                        SpotPay Member Only
                      </span>
                    )}
                    <a
                      href={`/api/v1/podcasts/${podcast.id}/rss`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="iTunes RSS 2.0 Feed"
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-brand-dusk text-purple-300 border border-purple-500/30 flex items-center gap-1 hover:bg-purple-500/20 transition-colors"
                    >
                      <Rss className="w-3 h-3" /> iTunes RSS
                    </a>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block mb-1">
                    {podcast.category ?? 'Culture & Society'}
                  </span>
                  <h3 className="font-extrabold text-base text-brand-sandstone group-hover:text-purple-300 transition-colors leading-snug">
                    {podcast.title}
                  </h3>
                  <p className="text-xs text-brand-sandstone/60 mt-1">
                    Hosted by <strong className="text-slate-200">{podcast.profiles?.display_name ?? 'Creator'}</strong> • {epCount} Episodes
                  </p>
                </div>

                {podcast.description && (
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {podcast.description}
                  </p>
                )}
              </div>

              {/* Audio Wave Preview Bar & Follow Button */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-sandstone/60">
                  <Headphones className="w-4 h-4 text-purple-400" />
                  <span>{podcast.follower_count.toLocaleString()} Subscribers</span>
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-brand-sandstone border border-purple-500/30 transition-all flex items-center gap-1 text-xs font-bold">
                    <Play className="w-3.5 h-3.5 fill-current" /> Play Latest
                  </button>
                  <FollowPodcastButton
                    podcastId={podcast.id}
                    isFollowing={followingSet.has(podcast.id)}
                    isAuthenticated={!!user}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
