import React from 'react';
import Link from 'next/link';
import {
  Plus,
  Flame,
  Globe,
  Radio,
  Tv,
  Mic,
  Users,
  Sparkles,
  Play,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { createSupabaseServerClient, getCurrentUser } from '../lib/supabase/server';
import UniversalComposer from '../components/universal-composer';
import FeedStream, { type FeedPostData } from '../components/feed-stream';
import CaribbeanNowSidebar from '../components/caribbean-now-sidebar';

export const dynamic = 'force-dynamic';

const CURATED_CARIBBEAN_POSTS: FeedPostData[] = [
  {
    id: 'curated-1',
    author: 'Karene Reid',
    handle: 'karenereid',
    verified: true,
    location: 'Kingston, Jamaica 🇯🇲',
    time: '12m ago',
    content:
      'The energy in Kingston tonight is unmatched! Sound system culture alive and vibrant. Big up to everyone streaming in from London, Brooklyn, and Toronto on Antilia! 🇯🇲🔊✨\n\n#KingstonVibes #SoundSystemCulture',
    likes: 428,
    reposts: 89,
    comments: 34,
    tag: '#KingstonVibes',
    category: 'caribbean',
  },
  {
    id: 'curated-2',
    author: 'Carlos Santana-Mendez',
    handle: 'carlos_rd',
    verified: true,
    location: 'Santo Domingo, Dominican Rep. 🇩🇴',
    time: '45m ago',
    content:
      'Excited to launch our Caribbean Tech Founders Circle right here on Antilia. If you are building software, fintech, or media across the islands or the diaspora, let’s connect! 🇩🇴🚀\n\n#CaribTech #Founders',
    likes: 312,
    reposts: 64,
    comments: 28,
    tag: '#CaribTech',
    category: 'foryou',
  },
  {
    id: 'curated-3',
    author: 'Aaliyah Baptiste',
    handle: 'aaliyah_soca',
    verified: true,
    location: 'Port of Spain, Trinidad 🇹🇹',
    time: '2h ago',
    content:
      'Carnival 2026 band launch tickets officially live on SpotPay! Instant checkout, zero foreign exchange hassle. See you on the road! 🇹🇹🎭✨\n\n#CarnivalTT #SpotPay',
    likes: 892,
    reposts: 145,
    comments: 72,
    tag: '#CarnivalTT',
    category: 'creator',
  },
  {
    id: 'curated-4',
    author: 'Marcus Garvey Guild',
    handle: 'garvey_diaspora',
    verified: true,
    location: 'Toronto / London Diaspora 🌍',
    time: '4h ago',
    content:
      'Connecting 59M+ people across 30+ island territories and global diaspora hubs. Empowering regional commerce, cultural preservation, and creative independence.',
    likes: 640,
    reposts: 112,
    comments: 53,
    tag: '#DiasporaUnite',
    category: 'diaspora',
  },
];

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function HomePage() {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  let livePosts: FeedPostData[] = [];
  if (supabase) {
    const { data } = await supabase
      .from('posts')
      .select('id, content, created_at, media_urls, cultural_tags, likes_count, comments_count, shares_count, profiles(display_name, username)')
      .order('created_at', { ascending: false })
      .limit(30);

    if (data && data.length > 0) {
      livePosts = data.map((p: any) => ({
        id: p.id,
        author: p.profiles?.display_name || 'Caribbean Member',
        handle: p.profiles?.username || 'member',
        verified: true,
        location: 'Antilia Network 🌴',
        time: relativeTime(p.created_at),
        content: p.content || '',
        mediaUrls: p.media_urls || [],
        culturalTags: p.cultural_tags || [],
        likes: p.likes_count || 0,
        reposts: p.shares_count || 0,
        comments: p.comments_count || 0,
        category: 'caribbean',
      }));
    }
  }

  // Combined feed (Live database posts prioritized, followed by curated regional highlights)
  const combinedPosts = [...livePosts, ...CURATED_CARIBBEAN_POSTS];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Main Stream (Col 8) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Caribbean Moments Cinema Rail */}
        <section aria-label="Caribbean Moments" className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black text-brand-sandstone/60 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" /> Moments &amp; Stories
            </h2>
            <span className="text-[11px] font-bold text-brand-caribbeanSea">Island &amp; Diaspora</span>
          </div>

          <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x px-1">
            {/* Add Story Button */}
            <div className="snap-start flex-shrink-0 w-28 h-44 rounded-3xl bg-brand-dusk/90 border border-slate-800 flex flex-col items-center justify-center relative cursor-pointer group hover:border-brand-caribbeanSea/50 transition-all shadow-md">
              <div className="w-12 h-12 rounded-full bg-brand-dusk text-brand-caribbeanSea flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-inner">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-200">Your Moment</span>
              <span className="text-[10px] text-brand-sandstone/40">Post update</span>
            </div>

            {/* Island Stories */}
            {[
              { name: 'Kingston Sound', loc: '🇯🇲 JA', tag: 'Live Dub', grad: 'from-amber-600/40 via-slate-900 to-slate-950' },
              { name: 'Port of Spain', loc: '🇹🇹 TT', tag: 'Soca Band', grad: 'from-red-600/40 via-slate-900 to-slate-950' },
              { name: 'Santo Domingo', loc: '🇩🇴 DR', tag: 'Bachata Night', grad: 'from-sky-600/40 via-slate-900 to-slate-950' },
              { name: 'Bridgetown Fete', loc: '🇧🇧 BB', tag: 'Crop Over', grad: 'from-yellow-600/40 via-slate-900 to-slate-950' },
              { name: 'Miami Carnival', loc: '🇺🇸 US', tag: 'Diaspora', grad: 'from-emerald-600/40 via-slate-900 to-slate-950' },
              { name: 'Toronto Carib', loc: '🇨🇦 CA', tag: 'Community', grad: 'from-purple-600/40 via-slate-900 to-slate-950' },
              { name: 'London Notting', loc: '🇬🇧 UK', tag: 'Diaspora', grad: 'from-rose-600/40 via-slate-900 to-slate-950' },
            ].map((story, i) => (
              <div
                key={i}
                className="snap-start flex-shrink-0 w-28 h-44 rounded-3xl glass overflow-hidden relative group cursor-pointer hover:border-white/20 transition-all"
              >
                <div className={`absolute inset-0 bg-gradient-to-t ${story.grad}`} />
                <div className="absolute top-2.5 left-2.5">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-twilight/80 text-brand-sandstone backdrop-blur-md border border-slate-700/50">
                    {story.loc}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 space-y-0.5">
                  <span className="text-[10px] font-bold text-brand-caribbeanSea block">{story.tag}</span>
                  <p className="text-xs font-black text-brand-sandstone leading-tight block truncate">{story.name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────── */}
        {/* P0: PRIMARY UNIVERSAL INLINE COMPOSER                      */}
        {/* ────────────────────────────────────────────────────────── */}
        <section aria-label="Create Post" className="space-y-4">
          <UniversalComposer
            displayName={user ? `@${user.username}` : 'Caribbean Diaspora Member'}
            avatarInitials={user?.username ? user.username.slice(0, 2).toUpperCase() : 'CO'}
          />

          {!user && (
            <div className="glass rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-black text-brand-sandstone flex items-center gap-2">
                  <Globe className="w-4 h-4 text-brand-caribbeanSea" /> Antilia Community Access
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Sign in or create your profile to access SpotPay wallet, direct messaging, and verified business pages.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral hover:from-brand-caribbeanSea hover:to-emerald-300 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-all shadow-md whitespace-nowrap"
                >
                  Sign In / Register
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Live Audio / Video Quick Ingest Banner */}
        <section className="bg-gradient-to-r from-red-950/40 via-slate-900 to-amber-950/30 border border-red-500/30 rounded-3xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-xs text-brand-sandstone uppercase tracking-wider">Live Now: Kingston Dub Session</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                  1.4K WATCHING
                </span>
              </div>
              <p className="text-[11px] text-brand-sandstone/60">Broadcasting live from Trenchtown • Hosted by Zion Sound</p>
            </div>
          </div>
          <Link
            href="/live"
            className="bg-red-500 hover:bg-red-400 text-brand-sandstone font-extrabold px-4 py-2 rounded-2xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-red-500/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Watch Live
          </Link>
        </section>

        {/* ────────────────────────────────────────────────────────── */}
        {/* INTERACTIVE FEED STREAM WITH LIVE LIKES, COMMENTS & TABS   */}
        {/* ────────────────────────────────────────────────────────── */}
        <section aria-label="Caribbean Feed Stream">
          <FeedStream initialPosts={combinedPosts} currentUserId={user?.id} />
        </section>
      </div>

      {/* Right Column: Caribbean Now & Diaspora Pulse (Col 4) */}
      <div className="lg:col-span-4">
        <CaribbeanNowSidebar />
      </div>
    </div>
  );
}


