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
  Heart,
  Repeat,
  MessageCircle,
  Share2,
  Wallet,
  Play,
  Calendar,
  CheckCircle,
  ArrowUpRight,
} from 'lucide-react';
import { createSupabaseServerClient, getCurrentUser } from '../lib/supabase/server';
import PostComposer from '../components/post-composer';
import CaribbeanNowSidebar from '../components/caribbean-now-sidebar';

export const dynamic = 'force-dynamic';

interface FeedPost {
  id: string;
  content: string | null;
  created_at: string;
  profiles: { display_name: string; username: string } | null;
}

const CURATED_CARIBBEAN_POSTS = [
  {
    id: 'curated-1',
    author: 'Karene Reid',
    handle: 'karenereid',
    verified: true,
    location: 'Kingston, Jamaica 🇯🇲',
    time: '12m ago',
    content:
      'The energy in Kingston tonight is unmatched! Sound system culture alive and vibrant. Big up to everyone streaming in from London, Brooklyn, and Toronto on Caribbean One! 🇯🇲🔊✨',
    likes: 428,
    reposts: 89,
    comments: 34,
    tag: '#KingstonVibes',
  },
  {
    id: 'curated-2',
    author: 'Carlos Santana-Mendez',
    handle: 'carlos_rd',
    verified: true,
    location: 'Santo Domingo, Dominican Rep. 🇩🇴',
    time: '45m ago',
    content:
      'Excited to launch our Caribbean Tech Founders Circle right here on Caribbean One. If you are building software, fintech, or media across the islands or the diaspora, let’s connect! 🇩🇴🚀',
    likes: 312,
    reposts: 64,
    comments: 28,
    tag: '#CaribTech',
  },
  {
    id: 'curated-3',
    author: 'Aaliyah Baptiste',
    handle: 'aaliyah_soca',
    verified: true,
    location: 'Port of Spain, Trinidad 🇹🇹',
    time: '2h ago',
    content:
      'Carnival 2026 band launch tickets officially live on SpotPay! Instant checkout, zero foreign exchange hassle. See you on the road! 🇹🇹🎭✨',
    likes: 892,
    reposts: 145,
    comments: 72,
    tag: '#CarnivalTT',
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

  let posts: FeedPost[] = [];
  if (supabase) {
    const { data } = await supabase
      .from('posts')
      .select('id, content, created_at, profiles(display_name, username)')
      .order('created_at', { ascending: false })
      .limit(25);
    posts = (data ?? []) as unknown as FeedPost[];
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Main Stream (Col 8) */}
      <div className="lg:col-span-8 space-y-8">
        {/* Caribbean Moments Cinema Rail */}
        <section aria-label="Caribbean Moments" className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Moments &amp; Stories
            </h2>
            <span className="text-[11px] font-bold text-sky-400">Island &amp; Diaspora</span>
          </div>

          <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x px-1">
            {/* Add Story Button */}
            <div className="snap-start flex-shrink-0 w-28 h-44 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center relative cursor-pointer group hover:border-sky-500/50 transition-all shadow-md">
              <div className="w-12 h-12 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-inner">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-200">Your Moment</span>
              <span className="text-[10px] text-slate-500">Post update</span>
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
                className="snap-start flex-shrink-0 w-28 h-44 rounded-3xl bg-slate-900 border border-slate-800/80 overflow-hidden relative group cursor-pointer hover:border-sky-400/50 transition-all shadow-md"
              >
                <div className={`absolute inset-0 bg-gradient-to-t ${story.grad}`} />
                <div className="absolute top-2.5 left-2.5">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-950/80 text-white backdrop-blur-md border border-slate-700/50">
                    {story.loc}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 space-y-0.5">
                  <span className="text-[10px] font-bold text-sky-400 block">{story.tag}</span>
                  <p className="text-xs font-black text-white leading-tight block truncate">{story.name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Post Publisher or Sign In Banner */}
        <section aria-label="Create Post">
          {user ? (
            <PostComposer displayName={user.displayName} />
          ) : (
            <div className="bg-gradient-to-r from-sky-950/80 via-slate-900 to-emerald-950/60 rounded-3xl p-6 border border-sky-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-sky-400" /> Welcome to Caribbean One
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  The digital home of 59M+ Caribbean people, creators, and the global diaspora.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="bg-white hover:bg-slate-200 text-slate-950 font-black px-5 py-2 rounded-2xl text-xs transition-all shadow-md"
                >
                  Join the Diaspora
                </Link>
                <Link
                  href="/explore"
                  className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2 rounded-2xl text-xs border border-slate-700 transition-all"
                >
                  Explore First
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
                <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">Live Now: Kingston Dub Session</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                  1.4K WATCHING
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Broadcasting live from Trenchtown • Hosted by Zion Sound</p>
            </div>
          </div>
          <Link
            href="/live"
            className="bg-red-500 hover:bg-red-400 text-white font-extrabold px-4 py-2 rounded-2xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-red-500/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Watch Live
          </Link>
        </section>

        {/* Feed Tab Navigation */}
        <section aria-label="Timeline" className="space-y-5">
          <div className="flex gap-4 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none" role="tablist">
            {[
              { label: 'Caribbean Now', active: true },
              { label: 'For You', active: false },
              { label: 'Diaspora Hubs', active: false },
              { label: 'Creators & Music', active: false },
            ].map((tab, idx) => (
              <button
                key={idx}
                role="tab"
                aria-selected={tab.active}
                className={`pb-2 whitespace-nowrap text-xs font-black transition-all relative focus-visible:outline-none ${
                  tab.active ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
                {tab.active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Feed Post List */}
          <div className="space-y-4">
            {/* Live Database Posts if present */}
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-5 shadow-lg space-y-3 hover:border-slate-700/80 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black text-xs shadow-md">
                      {(post.profiles?.display_name ?? 'CO').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-sm text-white">{post.profiles?.display_name ?? 'Caribbean Member'}</h4>
                        <span className="text-xs text-slate-500">@{post.profiles?.username ?? 'member'}</span>
                      </div>
                      <time className="text-[11px] text-slate-400">{relativeTime(post.created_at)}</time>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">
                  {post.content}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-slate-400 text-xs">
                  <button className="flex items-center gap-1.5 hover:text-rose-400 transition-colors">
                    <Heart className="w-4 h-4" /> <span>0</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
                    <Repeat className="w-4 h-4" /> <span>0</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-sky-400 transition-colors">
                    <MessageCircle className="w-4 h-4" /> <span>Reply</span>
                  </button>
                  <Link href="/spotpay" className="flex items-center gap-1 text-emerald-400 font-bold hover:underline">
                    <Wallet className="w-3.5 h-3.5" /> Tip SpotPay
                  </Link>
                </div>
              </article>
            ))}

            {/* Curated Authentic Caribbean Feed Posts */}
            {CURATED_CARIBBEAN_POSTS.map((post) => (
              <article
                key={post.id}
                className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-5 shadow-lg space-y-3 hover:border-slate-700/80 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 via-rose-500 to-sky-500 flex items-center justify-center text-white font-black text-xs shadow-md">
                      {post.author.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-sm text-white">{post.author}</h4>
                        {post.verified && <CheckCircle className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20" />}
                        <span className="text-xs text-slate-500">@{post.handle}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{post.location}</span>
                        <span>•</span>
                        <span>{post.time}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
                    {post.tag}
                  </span>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  {post.content}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-slate-400 text-xs">
                  <button className="flex items-center gap-1.5 hover:text-rose-400 transition-colors">
                    <Heart className="w-4 h-4 text-rose-500" /> <span className="font-bold text-slate-300">{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
                    <Repeat className="w-4 h-4 text-emerald-400" /> <span className="font-bold text-slate-300">{post.reposts}</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-sky-400 transition-colors">
                    <MessageCircle className="w-4 h-4 text-sky-400" /> <span className="font-bold text-slate-300">{post.comments}</span>
                  </button>
                  <Link
                    href="/spotpay"
                    className="flex items-center gap-1 text-emerald-400 font-extrabold hover:text-emerald-300 transition-colors bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20"
                  >
                    <Wallet className="w-3.5 h-3.5" /> Tip Creator
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* Right Column: Caribbean Now & Diaspora Pulse (Col 4) */}
      <div className="lg:col-span-4">
        <CaribbeanNowSidebar />
      </div>
    </div>
  );
}
