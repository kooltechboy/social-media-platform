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
import CreatePodcastModal from './podcasts/create-podcast-modal';
import { getCreatorDraftsAction, type CreatorDraftItem } from '../lib/creator/draft-actions';

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
    directHref: '/reels',
    badge: 'POPULAR',
    color: 'from-rose-500/20 to-rose-950/40 border-rose-500/30',
  },
  {
    id: 'live',
    title: 'Broadcast Live Stream',
    description: 'Stream live concerts, talks, carnival fetes, and panel sessions with real-time virtual gifting.',
    category: 'media',
    icon: <Tv className="w-6 h-6 text-red-500" />,
    directHref: '/live/broadcast',
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
    description: 'Publish carnival, concert, conference, or festival ticketed events with digital escrow.',
    category: 'commerce',
    icon: <Calendar className="w-6 h-6 text-yellow-400" />,
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
  const [serverDrafts, setServerDrafts] = useState<CreatorDraftItem[]>([]);
  const [isPodcastModalOpen, setIsPodcastModalOpen] = useState(false);
  const [publishedPostId, setPublishedPostId] = useState<string | null>(null);
  const [composerMode, setComposerMode] = useState<ComposerMode>('text');
  const composerSectionRef = useRef<HTMLDivElement>(null);

  // Check for saved drafts on mount (local + server)
  useEffect(() => {
    try {
      const draft = localStorage.getItem('tukubi_composer_draft_v3') || localStorage.getItem('tukubi_composer_draft_v2');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.content || (parsed.media && parsed.media.length > 0)) {
          setHasDraft(true);
        }
      }
    } catch {
      // Ignore
    }

    if (user?.id) {
      void getCreatorDraftsAction().then((res) => {
        if (res.drafts && res.drafts.length > 0) {
          setServerDrafts(res.drafts);
        }
      });
    }
  }, [user?.id]);

  function handleStartCreating(mode: ComposerMode = 'text') {
    setComposerMode(mode);
    if (composerSectionRef.current) {
      composerSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      <div className="surface-header rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden border border-brand-caribbeanSea/30">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-caribbeanSea/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-caribbeanSea/15 border border-brand-caribbeanSea/40 text-brand-caribbeanSea text-xs font-black tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" /> Tukubi Creator Engine
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
            Create, Publish &amp; Monetize Across the Caribbean
          </h1>

          <p className="text-xs sm:text-sm text-brand-sandstone/85 leading-relaxed">
            Publish feed posts, upload short reels with Caribbean Sounds, stream live events, launch verified business pages, or sell artisanal products directly to global customers.
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleStartCreating('text')}
              className="bg-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-sunriseCoral/20 hover:scale-[1.02] active:scale-95 min-h-[44px]"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Start Creating Now
            </button>

            <Link
              href="/creator-studio"
              className="bg-white/10 hover:bg-white/15 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm border border-white/20 flex items-center justify-center gap-2 transition-all min-h-[44px]"
            >
              <Compass className="w-4 h-4 text-brand-goldenHour" /> Creator Studio Hub
            </Link>
          </div>
        </div>
      </div>

      {/* Published Post Success Banner */}
      {publishedPostId && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>Your creation is officially published and live in the ecosystem!</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link href="/" className="flex-1 sm:flex-initial text-center px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 transition-colors min-h-[38px] flex items-center justify-center">
              View in Feed →
            </Link>
            <Link href="/profile" className="flex-1 sm:flex-initial text-center px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-colors min-h-[38px] flex items-center justify-center">
              My Profile
            </Link>
          </div>
        </div>
      )}

      {/* Draft Resume Indicator (Local + Cloud Synced) */}
      {(hasDraft || serverDrafts.length > 0) && !publishedPostId && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs sm:text-sm font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span>
              {serverDrafts.length > 0
                ? `You have ${serverDrafts.length} draft${serverDrafts.length === 1 ? '' : 's'} saved across your creator devices.`
                : 'You have an unposted draft saved in your local workspace.'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {hasDraft && (
              <button
                type="button"
                onClick={() => handleStartCreating('text')}
                className="text-amber-300 underline font-black hover:text-white min-h-[38px] flex items-center cursor-pointer"
              >
                Resume Local Draft →
              </button>
            )}
            {serverDrafts.length > 0 && (
              <Link
                href="/creator-studio?tab=drafts"
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 font-black text-xs flex items-center"
              >
                Manage in Studio →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Primary Creation Workspace */}
      <section ref={composerSectionRef} id="composer" className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs sm:text-sm font-black text-brand-caribbeanSea uppercase tracking-widest flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-caribbeanSea" />
            Active Creation Workspace
          </h2>
          <span className="text-xs text-brand-sandstone/60">Auto-saves to offline drafts</span>
        </div>

        <UniversalComposer
          key={composerMode}
          initialMode={composerMode}
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
      <section className="space-y-6 pt-8 border-t border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              Ecosystem Creation Suites
            </h2>
            <p className="text-xs sm:text-sm text-brand-sandstone/70 mt-0.5">
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
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[38px] ${
                  activeFilter === tab.id
                    ? 'bg-brand-caribbeanSea text-slate-950 font-black shadow-md shadow-brand-caribbeanSea/20'
                    : 'bg-white/5 hover:bg-white/10 text-brand-sandstone/80 border border-white/10'
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
            const isDirectLink = Boolean(tool.directHref);

            if (isDirectLink && tool.directHref) {
              return (
                <Link
                  key={tool.id}
                  href={tool.directHref}
                  className="surface-card surface-card-interactive rounded-2xl p-5 flex flex-col justify-between group min-h-[190px]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-white shadow-sm">
                        {tool.icon}
                      </div>
                      {tool.badge && (
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-brand-caribbeanSea/15 text-brand-caribbeanSea border border-brand-caribbeanSea/30">
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-sm sm:text-base text-white group-hover:text-brand-caribbeanSea transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-brand-sandstone/80 mt-1 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 flex items-center justify-between text-xs font-bold text-brand-caribbeanSea border-t border-white/10">
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
                className="surface-card surface-card-interactive rounded-2xl p-5 flex flex-col justify-between group text-left w-full cursor-pointer min-h-[190px]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-white shadow-sm">
                      {tool.icon}
                    </div>
                    {tool.badge && (
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-brand-caribbeanSea/15 text-brand-caribbeanSea border border-brand-caribbeanSea/30">
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-white group-hover:text-brand-caribbeanSea transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-brand-sandstone/80 mt-1 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-3 flex items-center justify-between text-xs font-bold text-brand-caribbeanSea border-t border-white/10 w-full">
                  <span>Start Creating</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Quick Podcast Publisher Modal */}
      <CreatePodcastModal
        isOpen={isPodcastModalOpen}
        onClose={() => setIsPodcastModalOpen(false)}
        user={user}
        existingPodcasts={[]}
      />
    </div>
  );
}
