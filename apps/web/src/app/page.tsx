import React from 'react';
import { Plus, Flame, Globe, Image as ImageIcon, Video as VideoIcon, MapPin, Sparkles } from 'lucide-react';
import { createSupabaseServerClient, getCurrentUser } from '../lib/supabase/server';

export const dynamic = 'force-dynamic';

interface FeedPost {
  id: string;
  content: string | null;
  created_at: string;
  profiles: { display_name: string; username: string } | null;
}

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
    posts = (data ?? []) as FeedPost[];
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
      <div className="lg:col-span-8 space-y-10">
        
        {/* Stories Section — Cinema Ratio */}
        <section aria-label="Stories" className="space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Moments</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x px-2">
            
            <div className="snap-start flex-shrink-0 w-28 h-44 rounded-2xl bg-slate-900 border border-slate-800/60 flex flex-col items-center justify-center relative cursor-pointer group hover:border-sky-500/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 text-sky-400 flex items-center justify-center mb-3 group-hover:bg-sky-500/10 transition-colors">
                <Plus className="w-6 h-6" aria-hidden="true" />
              </div>
              <span className="text-xs font-semibold text-slate-300">Add Story</span>
            </div>

            {[
              { name: 'Kingston Live', location: 'JA', tag: 'Music', grad: 'from-amber-900/40' },
              { name: 'Santo Domingo', location: 'DR', tag: 'Culture', grad: 'from-sky-900/40' },
              { name: 'Trini Soca', location: 'TT', tag: 'Carnival', grad: 'from-emerald-900/40' },
              { name: 'Brooklyn', location: 'US', tag: 'Diaspora', grad: 'from-rose-900/40' },
              { name: 'Toronto', location: 'CA', tag: 'Events', grad: 'from-violet-900/40' },
            ].map((story, i) => (
              <div
                key={i}
                className="snap-start flex-shrink-0 w-28 h-44 rounded-2xl bg-slate-900 overflow-hidden relative group cursor-pointer"
              >
                {/* Abstract texture placeholder for story background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${story.grad} to-slate-900 opacity-60 group-hover:opacity-100 transition-opacity`} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090D16] via-transparent to-transparent opacity-90" />
                
                <div className="absolute top-3 left-3">
                  <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#090D16]/80 text-white backdrop-blur-sm">
                    {story.location}
                  </span>
                </div>
                
                <div className="absolute bottom-3 left-3 right-3">
                  <span className="text-[10px] font-semibold text-sky-400 mb-0.5 block">
                    {story.tag}
                  </span>
                  <span className="text-xs font-bold text-white leading-tight block">
                    {story.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Minimalist Composer */}
        <section aria-label="Create Post" className="px-2">
          {user ? (
            <div className="bg-slate-900/30 rounded-3xl p-5 border border-slate-800/40 focus-within:border-sky-500/40 focus-within:bg-slate-900/60 transition-all">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-amber-500 p-0.5 flex-shrink-0">
                  <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center font-extrabold text-white text-sm">
                    {user.displayName.slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <textarea 
                    placeholder="Share what's happening in your Caribbean world..." 
                    className="w-full bg-transparent text-lg text-white placeholder-slate-500 focus:outline-none resize-none pt-2 font-medium"
                    rows={1}
                  />
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <div className="flex items-center gap-1 text-slate-400">
                      <button className="p-2 hover:text-sky-400 hover:bg-sky-500/10 rounded-full transition-colors"><ImageIcon className="w-4 h-4" /></button>
                      <button className="p-2 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-full transition-colors"><VideoIcon className="w-4 h-4" /></button>
                      <button className="p-2 hover:text-amber-400 hover:bg-amber-500/10 rounded-full transition-colors"><MapPin className="w-4 h-4" /></button>
                    </div>
                    <button className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-5 py-1.5 rounded-full text-sm transition-colors">
                      Publish
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-sky-900/20 to-emerald-900/20 rounded-3xl p-6 border border-sky-500/10 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Join the Ecosystem</h3>
                <p className="text-xs text-slate-400">Sign in to share your voice with the global Caribbean diaspora.</p>
              </div>
              <a href="/login" className="bg-white hover:bg-slate-200 text-slate-950 font-bold px-6 py-2 rounded-full text-sm transition-colors whitespace-nowrap">
                Sign In
              </a>
            </div>
          )}
        </section>

        {/* Editorial Feed Tab System */}
        <section aria-label="Timeline" className="space-y-6">
          <div className="flex gap-6 border-b border-slate-800/80 px-2 overflow-x-auto scrollbar-none" role="tablist">
            {[
              { label: 'For You', active: true },
              { label: 'Following', active: false },
              { label: 'Caribbean Wide', active: false },
              { label: 'Local City', active: false },
            ].map((tab, idx) => (
              <button
                key={idx}
                role="tab"
                aria-selected={tab.active}
                className={`pb-4 whitespace-nowrap text-sm font-semibold transition-colors relative focus-visible:outline-none ${
                  tab.active ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.label}
                {tab.active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400 rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Clean Stream Feed */}
          <div className="space-y-0 divide-y divide-slate-800/60 px-2">
            {posts.length === 0 ? (
              <div className="py-12 text-center">
                <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-300">Your feed is quiet — for now.</p>
                <p className="text-xs text-slate-500 mt-1">Follow creators, join communities, or publish the first post.</p>
              </div>
            ) : (
              posts.map((post) => (
                <article key={post.id} className="py-6 group flex gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <span className="text-xs font-bold text-slate-300">
                      {(post.profiles?.display_name ?? '??').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Post Body */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-baseline gap-2">
                      <h4 className="text-sm font-bold text-slate-100">{post.profiles?.display_name ?? 'Caribbean Member'}</h4>
                      <span className="text-xs font-medium text-slate-500">@{post.profiles?.username ?? 'member'}</span>
                      <span className="text-xs text-slate-600">·</span>
                      <time className="text-xs text-slate-500 hover:underline cursor-pointer">
                        {relativeTime(post.created_at)}
                      </time>
                    </div>
                    <p className="text-[15px] text-slate-300 leading-relaxed whitespace-pre-wrap font-body">
                      {post.content}
                    </p>
                    
                    {/* Action Bar */}
                    <div className="flex items-center gap-6 pt-2 text-slate-500">
                      <button className="flex items-center gap-1.5 text-xs font-medium hover:text-rose-400 transition-colors group/btn">
                        <span className="p-1.5 rounded-full group-hover/btn:bg-rose-500/10">❤️</span> 142
                      </button>
                      <button className="flex items-center gap-1.5 text-xs font-medium hover:text-emerald-400 transition-colors group/btn">
                        <span className="p-1.5 rounded-full group-hover/btn:bg-emerald-500/10">🔁</span> 12
                      </button>
                      <button className="flex items-center gap-1.5 text-xs font-medium hover:text-sky-400 transition-colors group/btn">
                        <span className="p-1.5 rounded-full group-hover/btn:bg-sky-500/10">💬</span> 24
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Right Sidebar — Structured & Ranked */}
      <aside className="hidden lg:block lg:col-span-4 space-y-8" aria-label="Explore trends">
        
        {/* Ranked Trending */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-slate-200 flex items-center gap-2 px-2">
            <Flame className="w-4 h-4 text-amber-400" aria-hidden="true" />
            Trending Right Now
          </h3>
          <ol className="list-none m-0 p-0">
            {[
              { rank: '01', loc: 'TORONTO', tag: '#Caribana2026', desc: 'Band Launch announcements', posts: '14.2k' },
              { rank: '02', loc: 'MIAMI', tag: '#SocaFestival', desc: 'Weekend event preparations', posts: '22.1k' },
              { rank: '03', loc: 'SANTO DOMINGO', tag: '#TechCaribbean', desc: 'Innovation summit keynote', posts: '8.9k' },
            ].map((trend) => (
              <li key={trend.rank}>
                <a
                  href={`/explore?trending=${trend.tag.replace('#', '').toLowerCase()}`}
                  className="flex gap-4 p-3 hover:bg-slate-900/60 rounded-2xl transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  <span className="text-sm font-black text-slate-700 group-hover:text-sky-500 transition-colors mt-0.5">
                    {trend.rank}
                  </span>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">{trend.loc}</span>
                    <p className="font-bold text-slate-200 text-sm">{trend.tag}</p>
                    <p className="text-xs text-slate-400 leading-snug">{trend.desc}</p>
                    <span className="text-[10px] font-medium text-slate-500 block pt-0.5">{trend.posts} posts</span>
                  </div>
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* Featured Events */}
        <div className="space-y-4 pt-4 border-t border-slate-800/60">
          <h3 className="text-sm font-extrabold text-slate-200 flex items-center gap-2 px-2">
            <Globe className="w-4 h-4 text-sky-400" aria-hidden="true" />
            Featured Experiences
          </h3>
          <div className="px-2">
            <div className="bg-gradient-to-b from-slate-900 to-[#090D16] border border-slate-800 rounded-2xl p-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
              <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2 block">This Saturday</span>
              <h5 className="font-bold text-white text-base leading-tight mb-1">Trinidad Carnival Preview</h5>
              <p className="text-xs text-slate-400 mb-4">Port of Spain &amp; Digital Livestream</p>
              <a
                href="/events/trinidad-carnival-preview"
                className="inline-flex items-center justify-center bg-white hover:bg-slate-200 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                RSVP / Get Tickets
              </a>
            </div>
          </div>
        </div>

      </aside>
    </div>
  );
}
