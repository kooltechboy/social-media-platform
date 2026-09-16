import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  LifeBuoy,
  Sparkles,
  Compass,
  PlusCircle,
  Video,
  Tv,
  Mic,
  Users,
  MessageSquare,
  Radio,
  ShoppingBag,
  Calendar,
  Building2,
  Wallet,
  Settings,
  Shield,
  AlertTriangle,
  Zap,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import HelpSearch from '../../components/help/help-search';
import AskTukubiPanel from '../../components/help/ask-tukubi-panel';
import WhatsNewBanner from '../../components/help/whats-new-banner';
import { HELP_ARTICLES } from '../../lib/help/articles-data';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'TUKUBI Help Center — Support, Guides & Platform Knowledge',
  description: 'Find answers, tutorials, and practical support for using all features of the TUKUBI Caribbean platform.',
};

const CATEGORIES = [
  { slug: 'getting-started', title: 'Getting Started', desc: 'Account setup, home feed, navigation, and identity.', icon: Sparkles, color: '#FF7A59', count: 5 },
  { slug: 'explore', title: 'Explore TUKUBI', desc: 'Caribbean discovery, interactive map, vibes, and diaspora hubs.', icon: Compass, color: '#38BDF8', count: 4 },
  { slug: 'create', title: 'Create & Publish', desc: 'Posts, photos, videos, Moments stories, and camera tools.', icon: PlusCircle, color: '#FF7A59', count: 3 },
  { slug: 'reels-video', title: 'Reels & Video', desc: 'Vertical video creation, discovery, and Caribbean sounds.', icon: Video, color: '#EC4899', count: 3 },
  { slug: 'live', title: 'Live Streaming', desc: 'Broadcasting live video, chat, and stream discovery.', icon: Tv, color: '#EF4444', count: 2 },
  { slug: 'podcasts', title: 'Podcasts', desc: 'Caribbean podcast network, in-browser listening, and RSS.', icon: Mic, color: '#A855F7', count: 1 },
  { slug: 'communities', title: 'Communities', desc: 'Diaspora hubs, public/private groups, and discussions.', icon: Users, color: '#22D3EE', count: 1 },
  { slug: 'messaging', title: 'Messaging', desc: 'Direct messages, voice notes, media, and group chats.', icon: MessageSquare, color: '#94A3B8', count: 3 },
  { slug: 'creators', title: 'Creators', desc: 'Creator Hub, Creator Studio, monetization, and brand deals.', icon: Radio, color: '#F59E0B', count: 4 },
  { slug: 'marketplace', title: 'Marketplace', desc: 'Buying and selling authentic Caribbean goods and services.', icon: ShoppingBag, color: '#F97316', count: 3 },
  { slug: 'events', title: 'Cultural Events', desc: 'Finding, RSVPing, and creating island fetes and events.', icon: Calendar, color: '#EAB308', count: 1 },
  { slug: 'pages-stores', title: 'Pages & Stores', desc: 'Business pages, brand presence, and custom storefronts.', icon: Building2, color: '#FF7A59', count: 1 },
  { slug: 'financial-center', title: 'Financial Center', desc: 'Double-entry ledger, balances, and creator payouts.', icon: Wallet, color: '#22C55E', count: 2 },
  { slug: 'profile-settings', title: 'Profile & Settings', desc: 'Profile editing, notifications, and preferences.', icon: Settings, color: '#94A3B8', count: 1 },
  { slug: 'privacy-security', title: 'Privacy & Security', desc: 'Two-factor auth, blocking, muting, and reporting.', icon: Shield, color: '#3B82F6', count: 1 },
  { slug: 'troubleshooting', title: 'Troubleshooting', desc: 'Common issues, error fixes, and account recovery.', icon: AlertTriangle, color: '#EF4444', count: 1 },
  { slug: 'whats-new', title: 'What\'s New', desc: 'Recent platform launches, feature releases, and updates.', icon: Zap, color: '#38BDF8', count: 1 },
];

const POPULAR_GUIDES = [
  { slug: 'what-is-tukubi', title: 'What is TUKUBI? The Caribbean Connected', tag: 'Overview' },
  { slug: 'members-friends-following', title: 'Understanding Members, Friends & Following', tag: 'Core Concept' },
  { slug: 'creating-your-first-post', title: 'Creating Your First Post on TUKUBI', tag: 'Publishing' },
  { slug: 'creating-and-publishing-a-reel', title: 'Creating and Publishing a Caribbean Reel', tag: 'Reels' },
  { slug: 'creator-hub-vs-creator-studio', title: 'Creator Hub vs. Creator Studio: Key Differences', tag: 'Creators' },
  { slug: 'financial-center-overview', title: 'Financial Center: Double-Entry Ledger Safety', tag: 'Financial' },
];

export default function HelpCenterPage() {
  return (
    <div className="space-y-12">
      {/* 1. Hero Search Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4 pt-4 sm:pt-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-caribbeanSea/15 border border-brand-caribbeanSea/30 text-brand-caribbeanSea text-xs font-black uppercase tracking-wider">
          <LifeBuoy className="w-3.5 h-3.5" /> Official TUKUBI Knowledge Base
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
          How can we help you today?
        </h1>
        <p className="text-sm sm:text-base text-brand-sandstone/75 leading-relaxed">
          Search practical guides, master TUKUBI tools, troubleshoot issues, and discover how our Caribbean platform works.
        </p>

        <div className="pt-2">
          <HelpSearch size="lg" placeholder="Search guides, tools, features, questions..." autoFocus />
        </div>
      </div>

      {/* 2. "Ask TUKUBI" AI Search Assistant */}
      <div className="max-w-3xl mx-auto">
        <AskTukubiPanel />
      </div>

      {/* 3. Popular Top Guides */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-sunriseCoral" />
            Popular Guides
          </h2>
          <span className="text-xs text-brand-sandstone/60 font-semibold">Verified Documentation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {POPULAR_GUIDES.map((g) => (
            <Link
              key={g.slug}
              href={`/help/${g.slug}`}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-caribbeanSea/40 hover:bg-white/10 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white/10 text-brand-goldenHour border border-white/10 w-fit inline-block">
                  {g.tag}
                </span>
                <p className="text-sm font-bold text-white group-hover:text-brand-caribbeanSea transition-colors">
                  {g.title}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-caribbeanSea pt-4 mt-2 border-t border-white/5">
                Read Guide <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. Browse by Category */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black text-white">Browse by Category</h2>
          <Link href="/learn" className="text-xs text-brand-caribbeanSea hover:underline font-bold">
            View All in Learn Center →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.slug}
                href={`/learn/${cat.slug}`}
                className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
                    style={{ backgroundColor: `${cat.color}20`, border: `1px solid ${cat.color}40`, color: cat.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white group-hover:text-brand-caribbeanSea transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-brand-sandstone/65 mt-1 line-clamp-2 leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-semibold text-brand-sandstone/50 pt-4 mt-3 border-t border-white/5">
                  <span>{cat.count} {cat.count === 1 ? 'guide' : 'guides'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-brand-sandstone/30 group-hover:text-white transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 5. What's New & Troubleshooting Two-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* What's New */}
        <div className="surface-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-caribbeanSea" /> What&apos;s New in TUKUBI
            </h3>
            <span className="text-[10px] font-bold text-brand-sandstone/50 uppercase">Verified Releases</span>
          </div>
          <p className="text-xs text-brand-sandstone/70">
            Recent features and updates rolled out to all Caribbean members and creators.
          </p>
          <WhatsNewBanner limit={4} />
        </div>

        {/* Troubleshooting & Security */}
        <div className="surface-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" /> Need Help or Found an Issue?
            </h3>
            <p className="text-xs text-brand-sandstone/70 leading-relaxed">
              If something isn&apos;t working as expected, or you encounter inappropriate content violating our Caribbean Community Standards, our Trust &amp; Safety team is ready to assist.
            </p>

            <div className="space-y-2 text-xs">
              <Link
                href="/help/privacy-security-and-blocking"
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all font-semibold text-white"
              >
                <span>Report Inappropriate Content or Abuse</span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-sandstone/40" />
              </Link>
              <Link
                href="/forgot-password"
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all font-semibold text-white"
              >
                <span>Reset Account Password</span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-sandstone/40" />
              </Link>
              <Link
                href="/financial-center/transactions"
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all font-semibold text-white"
              >
                <span>Financial Ledger &amp; Transaction Inquiries</span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-sandstone/40" />
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 text-center">
            <p className="text-xs text-brand-sandstone/60">
              TUKUBI Platform Support • 24/7 Security &amp; Trust Monitoring
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
