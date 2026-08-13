import React from 'react';
import { 
  Home, Compass, Video, Users, MessageSquare, Bell, User, PlusCircle, 
  Search, Calendar, ShoppingBag, Bookmark, Settings, Wallet, Mic, Tv, Flame, Globe
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-white">
            <span className="bg-gradient-to-r from-sky-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent">
              CARIBBEAN ONE
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/50">
              ECOSYSTEM
            </span>
          </a>

          {/* Ask Caribbean AI Search Bar */}
          <div className="relative hidden md:flex items-center w-80">
            <Search className="absolute left-3 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Ask Caribbean... (e.g. Events in Miami)" 
              className="w-full bg-slate-900 border border-slate-700/60 rounded-full pl-9 pr-4 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-4">
          <a href="/spotpay" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-sky-400 px-3 py-1.5 rounded-full border border-sky-500/30 text-xs font-semibold transition-colors">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>SpotPay Wallet: $240.50</span>
          </a>
          <button className="p-2 text-slate-300 hover:text-white rounded-full hover:bg-slate-800 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          </button>
          <button className="p-2 text-slate-300 hover:text-white rounded-full hover:bg-slate-800">
            <MessageSquare className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-amber-500 p-0.5">
            <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-xs font-bold">
              JM
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 p-4">
        
        {/* Left Navigation Sidebar */}
        <aside className="hidden md:block col-span-1 space-y-6">
          <nav className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 space-y-1">
            <a href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-sky-600/20 text-sky-400 font-semibold text-sm">
              <Home className="w-4 h-4" /> Home
            </a>
            <a href="/explore" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white text-sm font-medium transition-colors">
              <Compass className="w-4 h-4" /> Explore & Diaspora
            </a>
            <a href="/reels" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white text-sm font-medium transition-colors">
              <Video className="w-4 h-4" /> Reels & Shorts
            </a>
            <a href="/live" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white text-sm font-medium transition-colors">
              <Tv className="w-4 h-4" /> Live Streams
            </a>
            <a href="/podcasts" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white text-sm font-medium transition-colors">
              <Mic className="w-4 h-4" /> Caribbean Podcasts
            </a>
            <a href="/communities" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white text-sm font-medium transition-colors">
              <Users className="w-4 h-4" /> Communities
            </a>
            <a href="/spotpay" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white text-sm font-medium transition-colors">
              <Wallet className="w-4 h-4 text-emerald-400" /> SpotPay Wallet
            </a>
            <a href="/events" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white text-sm font-medium transition-colors">
              <Calendar className="w-4 h-4" /> Cultural Events
            </a>
            <a href="/marketplace" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white text-sm font-medium transition-colors">
              <ShoppingBag className="w-4 h-4" /> Marketplace
            </a>
          </nav>

          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/40 border border-slate-800/80 rounded-2xl p-4 text-center">
            <h4 className="text-sm font-bold text-white mb-1">Are you a Creator or Business?</h4>
            <p className="text-xs text-slate-400 mb-3">Host podcasts, stream live, accept SpotPay, and reach 59M+ Caribbean people worldwide.</p>
            <button className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs py-2 rounded-xl transition-colors">
              Open Creator Studio
            </button>
          </div>
        </aside>

        {/* Center Feed Area */}
        <main className="col-span-1 md:col-span-2 space-y-6">
          {/* Stories Carousel */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            <div className="flex-shrink-0 w-24 h-36 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center relative cursor-pointer group hover:border-sky-500/50 transition-all">
              <div className="w-10 h-10 rounded-full bg-sky-600/30 text-sky-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <PlusCircle className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold text-slate-300">Add Story</span>
            </div>

            {[
              { name: 'Kingston Live', country: '🇯🇲', tag: 'Music' },
              { name: 'Santo Domingo', country: '🇩🇴', tag: 'Culture' },
              { name: 'Trini Soca', country: '🇹🇹', tag: 'Carnival' },
              { name: 'Brooklyn Diaspora', country: '🇺🇸', tag: 'Food' },
              { name: 'Toronto Caribana', country: '🇨🇦', tag: 'Events' }
            ].map((story, i) => (
              <div key={i} className="flex-shrink-0 w-24 h-36 rounded-xl bg-slate-800/80 border border-slate-700/50 p-2 flex flex-col justify-between relative overflow-hidden group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                <span className="text-base z-10">{story.country}</span>
                <div className="z-10">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 block w-max mb-1">
                    {story.tag}
                  </span>
                  <span className="text-[11px] font-semibold text-white leading-tight block truncate">
                    {story.name}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Post Creation Prompt Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-600/30 text-sky-400 flex items-center justify-center font-bold text-sm">
                JM
              </div>
              <textarea 
                placeholder="What's happening in your Caribbean world?"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors resize-none h-20"
              />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                <button className="hover:text-sky-400 flex items-center gap-1.5">📷 Photo/Video</button>
                <button className="hover:text-amber-400 flex items-center gap-1.5">🎙️ Podcast Episode</button>
                <button className="hover:text-emerald-400 flex items-center gap-1.5">🔴 Go Live</button>
              </div>
              <button className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-5 py-1.5 rounded-full text-xs transition-colors">
                Publish Post
              </button>
            </div>
          </div>

          {/* Multi-Feed Filter Selector */}
          <div className="flex gap-2 border-b border-slate-800/80 pb-3 overflow-x-auto text-xs font-semibold">
            {['🔥 For You', '👥 Following', '🤝 Friends', '🌴 Caribbean Wide', '📍 Local City', '💬 Communities', '⚡ Latest'].map((tab, idx) => (
              <button 
                key={idx}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                  idx === 0 
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' 
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Feed Post Card Example */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-bold flex items-center justify-center">
                  🇯🇲
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Dancehall Culture Hub <span className="text-xs font-normal text-sky-400">✓ Creator</span>
                  </h4>
                  <p className="text-xs text-slate-400">Kingston, Jamaica • 2 hours ago</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Music & Arts
              </span>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed">
              Big news for the Caribbean Diaspora in Toronto & NYC! We just dropped episode 14 of our podcast discussing the evolution of Reggae & Dancehall globally. Listen directly or support via SpotPay! 🎙️🇯🇲
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mic className="w-6 h-6 text-amber-400" />
                <div>
                  <h5 className="text-xs font-bold text-white">EP #14: Sound System Culture in 2026</h5>
                  <p className="text-[11px] text-slate-400">Length: 42 mins • Caribbean Creators Network</p>
                </div>
              </div>
              <button className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-amber-500/30 transition-colors">
                Play Episode
              </button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs font-medium text-slate-400">
              <div className="flex items-center gap-6">
                <button className="hover:text-amber-400 flex items-center gap-1.5">❤️ 1,240 Likes</button>
                <button className="hover:text-sky-400 flex items-center gap-1.5">💬 84 Comments</button>
                <button className="hover:text-emerald-400 flex items-center gap-1.5">🔄 42 Shares</button>
              </div>
              <button className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5" /> Tip SpotPay $5
              </button>
            </div>
          </div>
        </main>

        {/* Right Widgets Sidebar */}
        <aside className="hidden md:block col-span-1 space-y-6">
          {/* Trending in Caribbean */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" /> Trending in the Diaspora
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-2 hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer">
                <span className="text-[10px] font-semibold text-sky-400 block">TORONTO, CANADA</span>
                <p className="font-bold text-slate-200">#Caribana2026 Band Launch</p>
                <span className="text-[10px] text-slate-400">14.2k Posts</span>
              </div>
              <div className="p-2 hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer">
                <span className="text-[10px] font-semibold text-emerald-400 block">SANTO DOMINGO, DR</span>
                <p className="font-bold text-slate-200">#TechCaribbean Summit</p>
                <span className="text-[10px] text-slate-400">8.9k Posts</span>
              </div>
              <div className="p-2 hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer">
                <span className="text-[10px] font-semibold text-amber-400 block">MIAMI, USA</span>
                <p className="font-bold text-slate-200">#SocaFestivalMiami</p>
                <span className="text-[10px] text-slate-400">22.1k Posts</span>
              </div>
            </div>
          </div>

          {/* Upcoming Cultural Events */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" /> Featured Cultural Events
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <span className="text-[10px] font-bold text-amber-400 uppercase">THIS SATURDAY</span>
                <h5 className="font-bold text-white text-xs mt-0.5">Trinidad Carnival Preview</h5>
                <p className="text-[11px] text-slate-400">Port of Spain & Livestream</p>
                <button className="w-full mt-2 bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold py-1 rounded-lg text-[11px] transition-colors">
                  Get Tickets ($15)
                </button>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
