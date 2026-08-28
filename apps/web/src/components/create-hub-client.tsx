'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Film,
  Tv,
  Mic,
  Calendar,
  ShoppingBag,
  Store,
  Users,
  Megaphone,
  Briefcase,
  Landmark,
  HeartHandshake,
  Sparkles,
  ArrowRight,
  Plus,
  Compass,
  CheckCircle2,
  Clock,
  Layers,
  Music,
} from 'lucide-react';
import UniversalComposer, { type ComposerMode } from './universal-composer';

interface CreateHubClientProps {
  user: {
    id: string;
    displayName: string;
    username?: string;
    avatarUrl?: string;
  } | null;
}

interface CreateTool {
  id: string;
  title: string;
  description: string;
  category: 'social' | 'commerce' | 'community' | 'media';
  icon: React.ReactNode;
  mode?: ComposerMode;
  directHref?: string;
  badge?: string;
  color: string;
}

const CREATE_TOOLS: CreateTool[] = [
  {
    id: 'post',
    title: 'Post & Story Update',
    description: 'Share stories, dialect notes, photos, and cultural discussions with the global diaspora.',
    category: 'social',
    icon: <FileText className="w-6 h-6 text-brand-caribbeanSea" />,
    mode: 'text',
    color: 'from-brand-caribbeanSea/20 to-sky-950/40 border-brand-caribbeanSea/30',
  },
  {
    id: 'reel',
    title: 'Reel / Short Video',
    description: 'Upload short-form vertical video tagged with trending Caribbean Sounds and rhythm stems.',
    category: 'media',
    icon: <Film className="w-6 h-6 text-rose-400" />,
    mode: 'reel',
    directHref: '/reels',
    badge: 'POPULAR',
    color: 'from-rose-500/20 to-rose-950/40 border-rose-500/30',
  },
  {
    id: 'live',
    title: 'Broadcast Live Stream',
    description: 'Stream live concerts, talks, carnival fetes, and panel sessions with SpotPay virtual gifting.',
    category: 'media',
    icon: <Tv className="w-6 h-6 text-red-500" />,
    mode: 'live',
    directHref: '/live',
    badge: 'LIVE INGEST',
    color: 'from-red-500/20 to-red-950/40 border-red-500/30',
  },
  {
    id: 'podcast',
    title: 'Podcast Episode',
    description: 'Publish audio episodes, AI transcriptions, and syndicate across Apple & Spotify RSS feeds.',
    category: 'media',
    icon: <Mic className="w-6 h-6 text-purple-400" />,
    directHref: '/podcasts',
    color: 'from-purple-500/20 to-purple-950/40 border-purple-500/30',
  },
  {
    id: 'sound',
    title: 'Caribbean Sound / Rhythm Stem',
    description: 'Explore official soca riddims, dancehall stems, and publish original Caribbean audio tracks.',
    category: 'media',
    icon: <Music className="w-6 h-6 text-rose-400" />,
    directHref: '/sounds',
    badge: 'NEW',
    color: 'from-rose-500/20 to-amber-950/40 border-rose-500/30',
  },
  {
    id: 'event',
    title: 'Cultural Event & Fete',
    description: 'Publish carnival, concert, conference, or festival ticketed events with SpotPay escrow.',
    category: 'commerce',
    icon: <Calendar className="w-6 h-6 text-yellow-400" />,
    mode: 'event',
    directHref: '/events',
    badge: 'TICKETING',
    color: 'from-yellow-500/20 to-yellow-950/40 border-yellow-500/30',
  },
  {
    id: 'product',
    title: 'Sell Product / Asset',
    description: 'List coffee, artisan craft, apparel, rum, or digital audio stems on Caribbean Marketplace.',
    category: 'commerce',
    icon: <ShoppingBag className="w-6 h-6 text-orange-400" />,
    mode: 'product',
    directHref: '/marketplace',
    color: 'from-orange-500/20 to-orange-950/40 border-orange-500/30',
  },
  {
    id: 'business',
    title: 'Business Storefront Page',
    description: 'Launch a verified Caribbean business page with custom branding, catalog, and checkout.',
    category: 'commerce',
    icon: <Store className="w-6 h-6 text-brand-sunriseCoral" />,
    directHref: '/pages/create?type=business',
    badge: 'VERIFIED',
    color: 'from-brand-sunriseCoral/20 to-emerald-950/40 border-brand-sunriseCoral/30',
  },
  {
    id: 'community',
    title: 'Diaspora Guild / Hub',
    description: 'Create a local city network, alumni association, or cultural interest group.',
    category: 'community',
    icon: <Users className="w-6 h-6 text-cyan-400" />,
    directHref: '/communities',
    color: 'from-cyan-500/20 to-cyan-950/40 border-cyan-500/30',
  },
  {
    id: 'ad',
    title: 'Sponsored Promotion',
    description: 'Promote your track, brand, or event targeted by island nation and diaspora city.',
    category: 'commerce',
    icon: <Megaphone className="w-6 h-6 text-indigo-400" />,
    directHref: '/creator-studio',
    color: 'from-indigo-500/20 to-indigo-950/40 border-indigo-500/30',
  },
  {
    id: 'job',
    title: 'Caribbean Job & Gig',
    description: 'Post tech, remote, creative, tourism, or skilled trade opportunities.',
    category: 'commerce',
    icon: <Briefcase className="w-6 h-6 text-teal-400" />,
    directHref: '/marketplace',
    color: 'from-teal-500/20 to-teal-950/40 border-teal-500/30',
  },
  {
    id: 'government',
    title: 'Civic & Public Notice',
    description: 'Verified public sector notices, tourism campaigns, and civic emergency announcements.',
    category: 'community',
    icon: <Landmark className="w-6 h-6 text-brand-goldenHour" />,
    mode: 'alert',
    directHref: '/pages/create?type=government',
    badge: 'CIVIC ONLY',
    color: 'from-brand-goldenHour/20 to-amber-950/40 border-brand-goldenHour/30',
  },
  {
    id: 'fundraiser',
    title: 'Community Fundraiser',
    description: 'Launch verified relief, cultural heritage preservation, or scholarship campaigns.',
    category: 'community',
    icon: <HeartHandshake className="w-6 h-6 text-pink-400" />,
    mode: 'fundraiser',
    color: 'from-pink-500/20 to-pink-950/40 border-pink-500/30',
  },
];

const FILTER_TABS = [
  { id: 'all', label: 'All Creation Tools' },
  { id: 'social', label: 'Social & Feed' },
  { id: 'media', label: 'Video, Live & Audio' },
  { id: 'commerce', label: 'Commerce & Events' },
  { id: 'community', label: 'Community & Civic' },
];

export default function CreateHubClient({ user }: CreateHubClientProps) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [hasDraft, setHasDraft] = useState(false);
  const [publishedPostId, setPublishedPostId] = useState<string | null>(null);
  const composerSectionRef = useRef<HTMLDivElement>(null);

  // Check for saved draft on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem('caribbean_one_composer_draft_v1');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.content || (parsed.media && parsed.media.length > 0)) {
          setHasDraft(true);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  function handleStartCreating(mode: ComposerMode = 'text') {
    if (composerSectionRef.current) {
      composerSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Trigger mode switch via custom event or click
      const modeBtn = document.querySelector(`button[data-mode="${mode}"]`) as HTMLButtonElement;
      if (modeBtn) {
        modeBtn.click();
      } else {
        const promptInput = document.querySelector('textarea, input[placeholder*="What is happening"]') as HTMLElement;
        if (promptInput) promptInput.focus();
      }
    }
  }

  const filteredTools = CREATE_TOOLS.filter((t) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'social') return t.category === 'social';
    if (activeFilter === 'media') return t.category === 'media';
    if (activeFilter === 'commerce') return t.category === 'commerce';
    if (activeFilter === 'community') return t.category === 'community';
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Action Banner */}
      <div className="bg-gradient-to-br from-brand-caribbeanSea/20 via-brand-dusk to-brand-twilight border border-brand-caribbeanSea/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-caribbeanSea/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-caribbeanSea/10 border border-brand-caribbeanSea/30 text-brand-caribbeanSea text-[11px] font-black tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Antilia Creator Engine
          </div>

          <h1 className="text-2xl md:text-4xl font-black text-brand-sandstone tracking-tight leading-tight">
            Create, Publish &amp; Monetize Across the Caribbean
          </h1>

          <p className="text-xs md:text-sm text-brand-sandstone/70 leading-relaxed">
            Publish feed posts, upload short reels with Caribbean Sounds, stream live events, launch verified business pages, or sell artisanal products with SpotPay.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleStartCreating('text')}
              className="bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral hover:from-brand-caribbeanSea hover:to-brand-sunriseCoral text-slate-950 font-black px-6 py-3 rounded-2xl text-xs md:text-sm flex items-center gap-2 transition-all shadow-lg shadow-brand-caribbeanSea/20 hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Start Creating Now
            </button>

            <Link
              href="/creator-studio"
              className="bg-brand-dusk/90 hover:bg-slate-800 text-slate-200 font-bold px-5 py-3 rounded-2xl text-xs border border-slate-700/80 flex items-center gap-2 transition-all"
            >
              <Compass className="w-4 h-4 text-brand-goldenHour" /> Creator Studio Hub
            </Link>
          </div>
        </div>
      </div>

      {/* Published Post Success Banner */}
      {publishedPostId && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>Your creation is officially published and live in the ecosystem!</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="px-3 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 transition-colors">
              View in Home Feed →
            </Link>
            <Link href="/profile" className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors">
              My Profile
            </Link>
          </div>
        </div>
      )}

      {/* Draft Resume Indicator */}
      {hasDraft && !publishedPostId && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>You have an unposted draft saved in your local workspace.</span>
          </div>
          <button
            type="button"
            onClick={() => handleStartCreating('text')}
            className="text-amber-200 underline font-bold hover:text-white"
          >
            Resume Draft →
          </button>
        </div>
      )}

      {/* Primary Creation Workspace */}
      <section ref={composerSectionRef} id="composer" className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black text-brand-sandstone/60 uppercase tracking-widest flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-caribbeanSea" />
            Active Creation Workspace
          </h2>
          <span className="text-[11px] text-brand-sandstone/40">Auto-saves to offline drafts</span>
        </div>

        <UniversalComposer
          displayName={user?.displayName ?? 'Caribbean Citizen'}
          avatarInitials={(user?.displayName ?? 'CO').slice(0, 2).toUpperCase()}
          defaultExpanded={true}
          onPostCreated={(post) => {
            if (post?.id) setPublishedPostId(post.id);
            setHasDraft(false);
          }}
        />
      </section>

      {/* Creation Tools Directory */}
      <section className="space-y-5 pt-6 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base md:text-lg font-black text-brand-sandstone">
              Ecosystem Creation Suites
            </h2>
            <p className="text-xs text-brand-sandstone/60">
              Select a specialized creation tool to start publishing immediately.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  activeFilter === tab.id
                    ? 'bg-brand-caribbeanSea text-slate-950 font-black shadow-md shadow-brand-caribbeanSea/20'
                    : 'bg-brand-dusk/70 text-brand-sandstone/60 hover:text-brand-sandstone border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => {
            const isDirectLink = !tool.mode && tool.directHref;

            if (isDirectLink && tool.directHref) {
              return (
                <Link
                  key={tool.id}
                  href={tool.directHref}
                  className={`bg-gradient-to-br ${tool.color} bg-brand-dusk/80 border rounded-3xl p-5 flex flex-col justify-between hover:scale-[1.02] hover:border-white/20 transition-all shadow-xl group`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-2xl bg-brand-twilight/80 border border-slate-800 shadow-md">
                        {tool.icon}
                      </div>
                      {tool.badge && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-brand-twilight/80 text-brand-sandstone border border-slate-700">
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-brand-sandstone group-hover:text-brand-caribbeanSea transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-2 flex items-center justify-between text-xs font-bold text-brand-caribbeanSea border-t border-slate-800/60">
                    <span>Open Suite</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            }

            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => handleStartCreating(tool.mode || 'text')}
                className={`bg-gradient-to-br ${tool.color} bg-brand-dusk/80 border rounded-3xl p-5 flex flex-col justify-between hover:scale-[1.02] hover:border-white/20 transition-all shadow-xl group text-left w-full cursor-pointer`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-brand-twilight/80 border border-slate-800 shadow-md">
                      {tool.icon}
                    </div>
                    {tool.badge && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-brand-twilight/80 text-brand-sandstone border border-slate-700">
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-brand-sandstone group-hover:text-brand-caribbeanSea transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-2 flex items-center justify-between text-xs font-bold text-brand-caribbeanSea border-t border-slate-800/60 w-full">
                  <span>Start Creating</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
