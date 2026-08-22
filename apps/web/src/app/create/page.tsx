import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Image as ImageIcon,
  Video,
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
  Newspaper,
  HeartHandshake,
  MapPin,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import UniversalComposer from '../../components/universal-composer';
import { getCurrentUser } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';

interface CreateCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  color: string;
}

const CREATE_CATEGORIES: CreateCategory[] = [
  {
    id: 'post',
    title: '📝 Post & Update',
    description: 'Share stories, polls, thoughts, and dialect conversations with the diaspora.',
    icon: <FileText className="w-6 h-6 text-sky-400" />,
    href: '#composer',
    color: 'from-sky-500/20 to-sky-950/40 border-sky-500/30',
  },
  {
    id: 'reel',
    title: '🎬 Reel / Short',
    description: 'Upload short-form vertical video tagged with trending Caribbean Sounds.',
    icon: <Film className="w-6 h-6 text-rose-400" />,
    href: '/reels',
    badge: 'POPULAR',
    color: 'from-rose-500/20 to-rose-950/40 border-rose-500/30',
  },
  {
    id: 'live',
    title: '🔴 Broadcast Live',
    description: 'Stream live concerts, talks, fetes, and sessions with SpotPay virtual gifts.',
    icon: <Tv className="w-6 h-6 text-red-500" />,
    href: '/live',
    badge: 'LIVE INGEST',
    color: 'from-red-500/20 to-red-950/40 border-red-500/30',
  },
  {
    id: 'podcast',
    title: '🎙 Host Podcast',
    description: 'Publish audio episodes, AI transcripts, and syndicated iTunes RSS feeds.',
    icon: <Mic className="w-6 h-6 text-purple-400" />,
    href: '/podcasts',
    color: 'from-purple-500/20 to-purple-950/40 border-purple-500/30',
  },
  {
    id: 'event',
    title: '📅 Cultural Event & Fete',
    description: 'Create festival, concert, conference, or carnival ticketed events.',
    icon: <Calendar className="w-6 h-6 text-yellow-400" />,
    href: '/events',
    color: 'from-yellow-500/20 to-yellow-950/40 border-yellow-500/30',
  },
  {
    id: 'product',
    title: '🛍 Sell Product / Asset',
    description: 'List artisan crafts, coffee, rum, apparel, or digital audio stems on Marketplace.',
    icon: <ShoppingBag className="w-6 h-6 text-orange-400" />,
    href: '/marketplace',
    color: 'from-orange-500/20 to-orange-950/40 border-orange-500/30',
  },
  {
    id: 'business',
    title: '🏪 Business Storefront Page',
    description: 'Launch a verified Caribbean business page with custom branding, catalog, and checkout.',
    icon: <Store className="w-6 h-6 text-emerald-400" />,
    href: '/pages/create?type=business',
    badge: 'VERIFIED',
    color: 'from-emerald-500/20 to-emerald-950/40 border-emerald-500/30',
  },
  {
    id: 'community',
    title: '👥 Diaspora Hub / Community',
    description: 'Create a local city network or cultural guild (e.g. Jamaicans in Toronto).',
    icon: <Users className="w-6 h-6 text-cyan-400" />,
    href: '/communities',
    color: 'from-cyan-500/20 to-cyan-950/40 border-cyan-500/30',
  },
  {
    id: 'ad',
    title: '📢 Sponsored Promotion',
    description: 'Promote your brand, music, or event targeted by island nation and diaspora city.',
    icon: <Megaphone className="w-6 h-6 text-indigo-400" />,
    href: '/creator-studio',
    color: 'from-indigo-500/20 to-indigo-950/40 border-indigo-500/30',
  },
  {
    id: 'job',
    title: '💼 Caribbean Job & Gig',
    description: 'Post tech, remote, tourism, construction, or creative opportunities.',
    icon: <Briefcase className="w-6 h-6 text-teal-400" />,
    href: '/marketplace',
    color: 'from-teal-500/20 to-teal-950/40 border-teal-500/30',
  },
  {
    id: 'government',
    title: '🏛 Civic / Public Notice',
    description: 'Verified public sector notices, tourism campaigns, and civic announcements.',
    icon: <Landmark className="w-6 h-6 text-amber-400" />,
    href: '/pages/create?type=government',
    badge: 'GOV ONLY',
    color: 'from-amber-500/20 to-amber-950/40 border-amber-500/30',
  },
  {
    id: 'fundraiser',
    title: '💰 Community Fundraiser',
    description: 'Launch verified cultural preservation, relief, or scholarship campaigns on SpotPay.',
    icon: <HeartHandshake className="w-6 h-6 text-pink-400" />,
    href: '#composer',
    color: 'from-pink-500/20 to-pink-950/40 border-pink-500/30',
  },
];

export default async function CreateHubPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-4 md:p-6 max-w-6xl mx-auto space-y-10">
      {/* Top Header */}
      <div className="border-b border-slate-800 pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-sky-400" />
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Caribbean One Creation Hub
          </h1>
        </div>
        <p className="text-xs md:text-sm text-slate-400 max-w-2xl">
          One unified identity with infinite capabilities. Create social content, broadcast live streams, launch business pages, host events, or sell across the global Caribbean diaspora.
        </p>
      </div>

      {/* Primary Universal Post Composer Container */}
      <section id="composer" className="space-y-3">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
          Quick Publish to Feed
        </h2>
        <UniversalComposer
          displayName={user?.displayName ?? 'Caribbean Citizen'}
          avatarInitials={(user?.displayName ?? 'CO').slice(0, 2).toUpperCase()}
        />
      </section>

      {/* Creation Categories Grid */}
      <section className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
            All Ecosystem Creation Tools
          </h2>
          <span className="text-xs text-slate-500">12 Categories Available</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CREATE_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              className={`bg-gradient-to-br ${cat.color} bg-slate-900/80 border rounded-3xl p-5 flex flex-col justify-between hover:scale-[1.02] transition-all shadow-xl group`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-md">
                    {cat.icon}
                  </div>
                  {cat.badge && (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-950/80 text-white border border-slate-700">
                      {cat.badge}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-black text-sm text-white group-hover:text-sky-300 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-2 flex items-center justify-between text-xs font-bold text-sky-400 border-t border-slate-800/60">
                <span>Start Creating</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
