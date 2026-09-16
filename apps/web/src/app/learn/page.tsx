import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  Radio,
  ShoppingBag,
  Compass,
  Video,
  LifeBuoy,
  BookOpen,
  Award,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import HelpSearch from '../../components/help/help-search';
import { HELP_ARTICLES } from '../../lib/help/articles-data';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'TUKUBI Learn — Master the Caribbean Digital Platform',
  description: 'Guided learning paths, tutorials, and masterclasses to become a power user, creator, or merchant on TUKUBI.',
};

const LEARNING_TRACKS = [
  {
    id: 'member-onboarding',
    title: 'New Member Fast Track',
    badge: 'Foundation',
    badgeColor: 'text-brand-caribbeanSea bg-brand-caribbeanSea/15 border-brand-caribbeanSea/30',
    description: 'Master the basics of TUKUBI: set up your profile, navigate the four feed streams, and connect with fellow Caribbean members.',
    modules: [
      { title: 'What is TUKUBI? The Caribbean Connected', slug: 'what-is-tukubi' },
      { title: 'Creating and Setting Up Your TUKUBI Account', slug: 'creating-your-account' },
      { title: 'Setting Up Your Profile & Cultural Identity', slug: 'setting-up-your-profile' },
      { title: 'Understanding Your 4 Home Feed Streams', slug: 'understanding-your-home-feed' },
      { title: 'Members vs Friends vs Following Explained', slug: 'members-friends-following' },
    ],
    ctaHref: '/help/what-is-tukubi',
    ctaLabel: 'Start Member Track',
  },
  {
    id: 'creator-academy',
    title: 'Caribbean Creator Academy',
    badge: 'Creator Economy',
    badgeColor: 'text-brand-goldenHour bg-brand-goldenHour/15 border-brand-goldenHour/30',
    description: 'Learn how to produce high-impact Caribbean content, build your diaspora audience, publish reels, and earn recurring revenue.',
    modules: [
      { title: 'Creating & Publishing Your First Caribbean Reel', slug: 'creating-and-publishing-a-reel' },
      { title: 'Using Caribbean Sounds in Your Videos', slug: 'caribbean-sounds-in-reels' },
      { title: 'Going Live on TUKUBI: Broadcaster Playbook', slug: 'going-live-on-tukubi' },
      { title: 'TUKUBI Podcasts: Host & Publish Audio Shows', slug: 'tukubi-podcasts-guide' },
      { title: 'Creator Hub vs Creator Studio: How to Use Both', slug: 'creator-hub-vs-creator-studio' },
      { title: 'Fan Subscriptions & Direct Tipping Setup', slug: 'creator-monetization-and-subscriptions' },
    ],
    ctaHref: '/help/creator-hub-overview',
    ctaLabel: 'Start Creator Track',
  },
  {
    id: 'merchant-commerce',
    title: 'Caribbean Merchant & Commerce',
    badge: 'Commerce & Business',
    badgeColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    description: 'Grow your Caribbean business online: list products, manage customer orders, and configure secure ledger payouts.',
    modules: [
      { title: 'Browsing & Buying on TUKUBI Marketplace', slug: 'browsing-and-buying-on-marketplace' },
      { title: 'Selling on TUKUBI Marketplace: Seller Setup', slug: 'selling-on-tukubi-marketplace' },
      { title: 'Managing Orders, Shipping & Customer Service', slug: 'managing-orders-and-payments' },
      { title: 'Financial Center: Double-Entry Ledger Overview', slug: 'financial-center-overview' },
      { title: 'Managing Payment Methods & Creator Payouts', slug: 'understanding-transactions-and-payouts' },
    ],
    ctaHref: '/help/selling-on-tukubi-marketplace',
    ctaLabel: 'Start Merchant Track',
  },
  {
    id: 'diaspora-discovery',
    title: 'Cultural Discovery & Diaspora Life',
    badge: 'Culture & Diaspora',
    badgeColor: 'text-purple-400 bg-purple-500/15 border-purple-500/30',
    description: 'Connect with Caribbean heritage worldwide: explore geospatial island maps, discover vibes, and join local diaspora communities.',
    modules: [
      { title: 'How Explore Works: Discovery, Vibes & Geography', slug: 'how-explore-works' },
      { title: 'Exploring with the Interactive Caribbean Map', slug: 'using-the-caribbean-map' },
      { title: 'Discovering Content by Caribbean Vibe', slug: 'explore-by-vibe' },
      { title: 'Connecting Across Global Diaspora Hubs', slug: 'global-diaspora-hubs' },
      { title: 'Finding, Joining & Participating in Communities', slug: 'joining-and-participating-in-communities' },
    ],
    ctaHref: '/help/how-explore-works',
    ctaLabel: 'Start Discovery Track',
  },
];

export default function LearnCenterPage() {
  return (
    <div className="space-y-12">
      {/* 1. Hero */}
      <div className="surface-header p-6 sm:p-10 rounded-3xl border border-white/15 bg-gradient-to-r from-slate-900/90 via-purple-950/40 to-slate-900/90 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5" /> TUKUBI Educational Ecosystem
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Learn TUKUBI
          </h1>
          <p className="text-sm sm:text-base text-brand-sandstone/80 leading-relaxed">
            Curated learning paths, masterclasses, and practical walkthroughs designed to help every Caribbean member, creator, and merchant succeed.
          </p>
        </div>

        <div className="w-full md:w-80">
          <HelpSearch placeholder="Search all learning guides..." />
        </div>
      </div>

      {/* 2. Structured Learning Tracks */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            Structured Learning Tracks
          </h2>
          <p className="text-xs sm:text-sm text-brand-sandstone/70 mt-1">
            Follow sequential guides curated to take you from foundational basics to expert mastery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {LEARNING_TRACKS.map((track) => (
            <div
              key={track.id}
              className="surface-card rounded-3xl p-6 sm:p-8 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${track.badgeColor}`}>
                    {track.badge}
                  </span>
                  <span className="text-[11px] font-semibold text-brand-sandstone/50">
                    {track.modules.length} Modules
                  </span>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white">{track.title}</h3>
                  <p className="text-xs sm:text-sm text-brand-sandstone/70 mt-1.5 leading-relaxed">
                    {track.description}
                  </p>
                </div>

                {/* Module Checklist */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  {track.modules.map((mod, idx) => (
                    <Link
                      key={mod.slug}
                      href={`/help/${mod.slug}`}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-white/5 text-xs text-brand-sandstone/85 hover:text-white transition-all group"
                    >
                      <span className="w-5 h-5 rounded-full bg-white/10 text-brand-sandstone/60 font-bold flex items-center justify-center text-[10px] flex-shrink-0 group-hover:bg-brand-caribbeanSea/20 group-hover:text-brand-caribbeanSea transition-colors">
                        {idx + 1}
                      </span>
                      <span className="flex-1 font-medium group-hover:underline line-clamp-1">{mod.title}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-brand-sandstone/30 group-hover:text-white transition-colors flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={track.ctaHref}
                  className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
                >
                  {track.ctaLabel} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Caribbean Creator Masterclasses */}
      <div className="surface-card rounded-3xl p-6 sm:p-8 md:p-10 border border-white/10 space-y-6">
        <div className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-brand-goldenHour flex items-center gap-2">
            <Award className="w-4 h-4" /> Masterclass Strategies
          </span>
          <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white">
            Caribbean Digital Excellence
          </h3>
          <p className="text-xs md:text-sm text-brand-sandstone/70">
            Professional insights on island copyright, diaspora monetization, and low-latency production.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Link
            href="/help/caribbean-sounds-in-reels"
            className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/15 transition-all space-y-3 block"
          >
            <span className="text-3xl">🌴</span>
            <h4 className="text-sm font-bold text-white">Caribbean IP &amp; Sound Rights</h4>
            <p className="text-xs text-brand-sandstone/70 leading-relaxed">
              How Soca, Dancehall, Kompa, and regional folklore recordings are tagged and distributed globally.
            </p>
            <span className="text-xs text-brand-caribbeanSea font-bold inline-flex items-center gap-1">
              Read Masterclass →
            </span>
          </Link>

          <Link
            href="/help/creator-monetization-and-subscriptions"
            className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/15 transition-all space-y-3 block"
          >
            <span className="text-3xl">💡</span>
            <h4 className="text-sm font-bold text-white">Diaspora Membership Tiers</h4>
            <p className="text-xs text-brand-sandstone/70 leading-relaxed">
              Structuring fan subscriptions for diaspora audiences in NYC, Toronto, Miami, and London.
            </p>
            <span className="text-xs text-brand-caribbeanSea font-bold inline-flex items-center gap-1">
              Read Masterclass →
            </span>
          </Link>

          <Link
            href="/help/going-live-on-tukubi"
            className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/15 transition-all space-y-3 block"
          >
            <span className="text-3xl">🎙️</span>
            <h4 className="text-sm font-bold text-white">Low-Bandwidth Mobile Streaming</h4>
            <p className="text-xs text-brand-sandstone/70 leading-relaxed">
              Broadcasting reliably across varied island cellular networks without quality drops.
            </p>
            <span className="text-xs text-brand-caribbeanSea font-bold inline-flex items-center gap-1">
              Read Masterclass →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
