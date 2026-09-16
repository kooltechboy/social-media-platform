import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, Sparkles, ChevronRight } from 'lucide-react';
import { getArticlesByCategory, HELP_ARTICLES } from '../../../lib/help/articles-data';

export const dynamic = 'force-dynamic';

const CATEGORY_META: Record<string, { title: string; description: string; color: string }> = {
  'getting-started': {
    title: 'Getting Started',
    description: 'Learn the essentials of TUKUBI: account registration, profile setup, home feeds, and member relationships.',
    color: '#FF7A59',
  },
  'explore': {
    title: 'Explore TUKUBI',
    description: 'Discover Caribbean cultural geography, explore the interactive map, find vibes, and connect with diaspora city hubs.',
    color: '#38BDF8',
  },
  'create': {
    title: 'Create & Publish',
    description: 'Master the Universal Composer: post updates, upload photos, record video moments, and run interactive polls.',
    color: '#FF7A59',
  },
  'reels-video': {
    title: 'Reels & Video',
    description: 'Produce and discover vertical short-form video with authentic Caribbean sounds and regional cultural tags.',
    color: '#EC4899',
  },
  'live': {
    title: 'Live Streaming',
    description: 'Broadcast live to global audiences, manage realtime interactive chat, and earn live gifts.',
    color: '#EF4444',
  },
  'podcasts': {
    title: 'Podcasts',
    description: 'Listen to Caribbean stories and discussions, or host your own podcast show with public RSS distribution.',
    color: '#A855F7',
  },
  'communities': {
    title: 'Communities & Diaspora Hubs',
    description: 'Find and join Caribbean diaspora hubs, participate in island discussions, and build regional networks.',
    color: '#22D3EE',
  },
  'messaging': {
    title: 'Messaging',
    description: 'Connect privately with members, send voice notes and media, and organize group discussions.',
    color: '#94A3B8',
  },
  'creators': {
    title: 'Creators & Monetization',
    description: 'Grow your creative enterprise with Creator Hub, Creator Studio tools, fan subscriptions, and brand briefs.',
    color: '#F59E0B',
  },
  'marketplace': {
    title: 'Marketplace & Commerce',
    description: 'Buy and sell authentic Caribbean fashion, spices, craft goods, and services with escrow payment safety.',
    color: '#F97316',
  },
  'events': {
    title: 'Cultural Events',
    description: 'Discover regional carnivals, concerts, fetes, and community galas across the Caribbean and diaspora.',
    color: '#EAB308',
  },
  'pages-stores': {
    title: 'Pages & Stores',
    description: 'Create business and official brand pages, configure custom storefronts, and manage your commercial presence.',
    color: '#FF7A59',
  },
  'financial-center': {
    title: 'Financial Center',
    description: 'Understand the double-entry accounting ledger, balance tracking, and compliant creator payout rails.',
    color: '#22C55E',
  },
  'profile-settings': {
    title: 'Profile & Settings',
    description: 'Personalize your cultural identity, manage notification preferences, and customize your app experience.',
    color: '#94A3B8',
  },
  'privacy-security': {
    title: 'Privacy & Security',
    description: 'Safeguard your account, manage two-factor authentication, mute or block accounts, and report violations.',
    color: '#3B82F6',
  },
  'troubleshooting': {
    title: 'Troubleshooting & Support',
    description: 'Find quick solutions for login errors, media upload issues, and platform support contacts.',
    color: '#EF4444',
  },
  'whats-new': {
    title: 'What\'s New',
    description: 'Track the latest feature releases, performance improvements, and platform upgrades across TUKUBI.',
    color: '#38BDF8',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const meta = CATEGORY_META[category] || { title: category.replace(/-/g, ' ') };
  return {
    title: `${meta.title} Guides — TUKUBI Learn Center`,
    description: meta.description || `Guides and tutorials for ${meta.title} on TUKUBI.`,
  };
}

export default async function LearnCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const meta = CATEGORY_META[category];
  const articles = getArticlesByCategory(category);

  if (!meta && articles.length === 0) {
    notFound();
  }

  const title = meta?.title || category.replace(/-/g, ' ');
  const description = meta?.description || `Explore all official TUKUBI guides for ${title}.`;

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-brand-sandstone/60">
        <Link href="/learn" className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Learn Center
        </Link>
        <ChevronRight className="w-3 h-3 text-white/20" />
        <span className="text-white font-semibold">{title}</span>
      </nav>

      {/* Category Header */}
      <div className="surface-header p-6 sm:p-8 rounded-3xl border border-white/10 space-y-3 bg-gradient-to-r from-slate-900/90 to-purple-950/20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-caribbeanSea/15 border border-brand-caribbeanSea/30 text-brand-caribbeanSea text-xs font-black uppercase tracking-wider">
          Learning Category
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">{title}</h1>
        <p className="text-sm sm:text-base text-brand-sandstone/80 max-w-2xl leading-relaxed">
          {description}
        </p>
      </div>

      {/* Articles Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            Available Guides ({articles.length})
          </h2>
          <Link href="/help" className="text-xs text-brand-caribbeanSea hover:underline">
            Visit Help Center →
          </Link>
        </div>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((art, idx) => (
              <Link
                key={art.slug}
                href={`/help/${art.slug}`}
                className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-caribbeanSea/40 hover:bg-white/10 transition-all flex flex-col justify-between group space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-brand-sandstone/50 uppercase">
                      Guide #{idx + 1}
                    </span>
                    {art.featureSlug && (
                      <span className="text-[10px] font-mono text-brand-caribbeanSea/80">
                        /{art.featureSlug}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-brand-caribbeanSea transition-colors">
                    {art.title}
                  </h3>
                  <p className="text-xs text-brand-sandstone/70 leading-relaxed line-clamp-2">
                    {art.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-brand-caribbeanSea pt-2 border-t border-white/5">
                  Read Full Guide <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-brand-sandstone/40 mx-auto" />
            <p className="text-sm font-bold text-white">Guides being curated for this category</p>
            <p className="text-xs text-brand-sandstone/60">
              Check back shortly or explore other categories in the Learn Center.
            </p>
            <Link
              href="/learn"
              className="inline-block text-xs font-bold text-brand-caribbeanSea hover:underline pt-2"
            >
              Browse All Categories →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
