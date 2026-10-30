'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  TrendingUp,
  Calendar,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Tv,
  CheckCircle,
  Flame,
  Building2,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import UserAvatar from '../user-avatar';
import FollowButton from '../follow-button';

export interface HomeRailProps {
  suggestedPeople?: Array<{
    id: string;
    display_name: string;
    username: string;
    avatar_url?: string | null;
    is_verified?: boolean;
    origin_country_iso?: string | null;
    is_following?: boolean;
  }>;
  trendingTopics?: Array<{
    tag: string;
    post_count?: number;
  }>;
  upcomingEvents?: Array<{
    id: string;
    title: string;
    start_time: string;
    location_name?: string | null;
  }>;
  marketplaceItems?: Array<{
    id: string;
    title: string;
    price_minor: number;
    currency: string;
    seller_name?: string;
  }>;
  activeLiveStream?: {
    id: string;
    title: string;
    peak_viewers?: number;
    creator_name?: string;
  } | null;
  managedPages?: Array<{
    id: string;
    name: string;
    slug: string;
    category?: string;
    avatarUrl?: string | null;
    isVerified?: boolean;
    userRole?: string | null;
    followerCount?: number;
  }>;
  followedPages?: Array<{
    id: string;
    name: string;
    slug: string;
    category?: string;
    avatarUrl?: string | null;
    isVerified?: boolean;
    followerCount?: number;
  }>;
}

const DEFAULT_CARIBBEAN_TRENDS = [
  { tag: 'DominicanRepublic', post_count: 124000 },
  { tag: 'CaribbeanMusic', post_count: 96000 },
  { tag: 'Travel', post_count: 87000 },
  { tag: 'Food', post_count: 76000 },
  { tag: 'Culture', post_count: 64000 },
];

const DEFAULT_SUGGESTED_PEOPLE = [
  {
    id: 'sug-1',
    display_name: 'Maria Rodriguez',
    username: 'mariarodriguez',
    avatar_url: null,
    is_verified: true,
    origin_country_iso: 'DO',
    is_following: false,
  },
  {
    id: 'sug-2',
    display_name: 'Jahmar Reid',
    username: 'jahmarreid',
    avatar_url: null,
    is_verified: true,
    origin_country_iso: 'JM',
    is_following: false,
  },
  {
    id: 'sug-3',
    display_name: 'Caribbean Eats',
    username: 'caribbeaneats',
    avatar_url: null,
    is_verified: true,
    origin_country_iso: 'TT',
    is_following: false,
  },
  {
    id: 'sug-4',
    display_name: 'Travel DR',
    username: 'traveldr',
    avatar_url: null,
    is_verified: true,
    origin_country_iso: 'DO',
    is_following: false,
  },
];

function formatPostCount(count?: number): string {
  if (count === undefined) return '';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M posts`;
  if (count >= 1000) return `${(count / 1000).toFixed(0)}K posts`;
  return `${count} posts`;
}

export default function HomeRail({
  suggestedPeople = [],
  trendingTopics = [],
  upcomingEvents = [],
  marketplaceItems = [],
  activeLiveStream = null,
  managedPages = [],
  followedPages = [],
}: HomeRailProps) {
  const displayTrends = trendingTopics && trendingTopics.length > 0 ? trendingTopics : DEFAULT_CARIBBEAN_TRENDS;
  const displayPeople = suggestedPeople && suggestedPeople.length > 0 ? suggestedPeople : DEFAULT_SUGGESTED_PEOPLE;

  return (
    <div className="space-y-4">
      {/* 1. Live Broadcast Callout (if active) */}
      {activeLiveStream && (
        <RailSection label="Live broadcast" title="Live now" icon={<Tv className="w-4 h-4 text-rose-400" />}>
          <div className="space-y-3">
            <div>
              <h4 className="text-[13.5px] font-semibold text-white line-clamp-1">{activeLiveStream.title}</h4>
              <p className="text-xs text-brand-mist truncate mt-0.5">
                {activeLiveStream.creator_name ? `by ${activeLiveStream.creator_name}` : 'Live on TUKUBI'}
                {activeLiveStream.peak_viewers !== undefined && ` Â· ${activeLiveStream.peak_viewers} watching`}
              </p>
            </div>
            <Link
              href={`/live?id=${activeLiveStream.id}`}
              className="w-full flex items-center justify-center h-9 rounded-lg bg-rose-500/90 hover:bg-rose-500 text-white font-semibold text-[13px] transition-colors"
            >
              Watch broadcast
            </Link>
          </div>
        </RailSection>
      )}

      {/* 2. Trending in the Caribbean */}
      <RailSection
        label="Trending in the Caribbean"
        title="Trending now"
        icon={<TrendingUp className="w-4 h-4 text-brand-goldenHour" />}
        action={{ href: '/explore', label: 'View all' }}
      >
        <ol className="-mx-2">
          {displayTrends.slice(0, 5).map((trend, idx) => (
            <li key={trend.tag}>
              <Link
                href={`/explore?q=${encodeURIComponent('#' + trend.tag)}`}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-colors group"
              >
                <span className="text-xs font-medium text-[#6B7A90] w-4 shrink-0 text-center tabular-nums">{idx + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-white truncate">#{trend.tag}</p>
                  {trend.post_count !== undefined && (
                    <span className="text-[11.5px] text-brand-mist">{formatPostCount(trend.post_count)}</span>
                  )}
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#6B7A90] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
            </li>
          ))}
        </ol>
      </RailSection>

      {/* 3. Suggested People / Creators */}
      <RailSection
        label="Suggested people"
        title="Suggested people"
        icon={<Users className="w-4 h-4 text-brand-caribbeanSea" />}
        action={{ href: '/people', label: 'See more' }}
      >
        <ul className="space-y-3">
          {displayPeople.slice(0, 4).map((person) => (
            <li key={person.id} className="flex items-center justify-between gap-3">
              <Link href={`/profile/${person.username}`} className="flex items-center gap-3 min-w-0 flex-1 group">
                <UserAvatar src={person.avatar_url} name={person.display_name} size="sm" />
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-white truncate flex items-center gap-1 group-hover:underline decoration-white/30 underline-offset-2">
                    <span className="truncate">{person.display_name}</span>
                    {person.is_verified && <CheckCircle className="w-3.5 h-3.5 text-brand-caribbeanSea shrink-0" />}
                  </p>
                  <p className="text-[11.5px] text-brand-mist truncate">
                    @{person.username}
                    {person.origin_country_iso && ` Â· ${person.origin_country_iso}`}
                  </p>
                </div>
              </Link>
              <div className="shrink-0">
                <FollowButton targetUserId={person.id} isFollowing={!!person.is_following} />
              </div>
            </li>
          ))}
        </ul>
      </RailSection>

      {/* 4. Pages You Manage (Ecosystem RBAC) */}
      {managedPages && managedPages.length > 0 && (
        <RailSection
          label="Pages you manage"
          title="Pages you manage"
          icon={<Building2 className="w-4 h-4 text-brand-goldenHour" />}
          action={{ href: '/pages?tab=my-pages', label: `All (${managedPages.length})` }}
        >
          <ul className="space-y-2">
            {managedPages.slice(0, 3).map((page) => (
              <li
                key={page.id}
                className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]"
              >
                <Link href={`/pages/${page.slug}`} className="flex items-center gap-3 min-w-0 flex-1 group">
                  <PageThumb src={page.avatarUrl} name={page.name} />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate flex items-center gap-1 group-hover:underline decoration-white/30 underline-offset-2">
                      <span className="truncate">{page.name}</span>
                      {page.isVerified && <CheckCircle className="w-3.5 h-3.5 text-brand-caribbeanSea shrink-0" />}
                    </p>
                    <p className="text-[11.5px] text-brand-mist truncate">
                      {page.userRole ? `${page.userRole.charAt(0).toUpperCase() + page.userRole.slice(1)} Â· ` : ''}
                      {page.followerCount !== undefined ? `${page.followerCount} followers` : page.category || 'Page'}
                    </p>
                  </div>
                </Link>
                <Link
                  href={`/pages/${page.slug}/manage`}
                  className="shrink-0 text-xs font-semibold px-2.5 h-7 flex items-center rounded-md bg-white/[0.06] hover:bg-white/[0.10] text-[#C3CCDA] hover:text-white transition-colors"
                  title="Manage Page"
                >
                  Manage
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/pages/create"
            className="mt-3 w-full flex items-center justify-center gap-1.5 h-9 rounded-lg border border-dashed border-white/[0.14] hover:border-white/25 text-[#C3CCDA] hover:text-white font-medium text-[13px] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create a new page
          </Link>
        </RailSection>
      )}

      {/* 5. Pages You Follow */}
      {followedPages && followedPages.length > 0 && (
        <RailSection
          label="Pages you follow"
          title="Pages you follow"
          icon={<ShieldCheck className="w-4 h-4 text-brand-caribbeanSea" />}
          action={{ href: '/pages', label: 'Explore' }}
        >
          <ul className="-mx-2">
            {followedPages.slice(0, 3).map((page) => (
              <li key={page.id}>
                <Link
                  href={`/pages/${page.slug}`}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-colors group"
                >
                  <PageThumb src={page.avatarUrl} name={page.name} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-white truncate flex items-center gap-1">
                      <span className="truncate">{page.name}</span>
                      {page.isVerified && <CheckCircle className="w-3.5 h-3.5 text-brand-caribbeanSea shrink-0" />}
                    </p>
                    <p className="text-[11.5px] text-brand-mist truncate">
                      {page.followerCount !== undefined ? `${page.followerCount} followers` : page.category || 'Page'}
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#6B7A90] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </RailSection>
      )}

      {/* 6. Page Promotion Callout when user has no managed pages */}
      {(!managedPages || managedPages.length === 0) && (
        <RailSection
          label="Create a Caribbean page"
          title="Caribbean Pages"
          icon={<Building2 className="w-4 h-4 text-brand-goldenHour" />}
        >
          <p className="text-[13px] text-brand-mist leading-relaxed">
            An official public identity for your business, creator brand, music project, or community foundation.
          </p>
          <Link
            href="/pages/create"
            className="mt-3 w-full flex items-center justify-center gap-1.5 h-9 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-white font-semibold text-[13px] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create a page
          </Link>
        </RailSection>
      )}

      {/* 7. Upcoming Cultural Events Spotlight */}
      {upcomingEvents.length > 0 && (
        <RailSection
          label="Upcoming cultural events"
          title="Upcoming events"
          icon={<Calendar className="w-4 h-4 text-brand-goldenHour" />}
          action={{ href: '/events', label: 'View all' }}
        >
          <ul className="space-y-1 -mx-2">
            {upcomingEvents.slice(0, 3).map((event) => {
              const d = new Date(event.start_time);
              return (
                <li key={event.id}>
                  <Link href="/events" className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex flex-col items-center justify-center shrink-0 leading-none">
                      <span className="text-[9.5px] font-semibold uppercase tracking-wider text-brand-goldenHour">
                        {d.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-[15px] font-semibold text-white mt-0.5">{d.getDate()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-white line-clamp-1">{event.title}</p>
                      {event.location_name && <p className="text-[11.5px] text-brand-mist truncate">{event.location_name}</p>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </RailSection>
      )}

      {/* 8. Marketplace Highlights */}
      {marketplaceItems.length > 0 && (
        <RailSection
          label="Marketplace highlights"
          title="Marketplace"
          icon={<ShoppingBag className="w-4 h-4 text-brand-goldenHour" />}
          action={{ href: '/marketplace', label: 'Shop all' }}
        >
          <ul className="space-y-1 -mx-2">
            {marketplaceItems.slice(0, 3).map((item) => (
              <li key={item.id}>
                <Link href={`/marketplace/${item.id}`} className="flex items-center justify-between gap-3 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-colors">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-white line-clamp-1">{item.title}</p>
                    {item.seller_name && <p className="text-[11.5px] text-brand-mist truncate">{item.seller_name}</p>}
                  </div>
                  <span className="text-[13px] font-semibold text-white tabular-nums shrink-0">
                    ${(item.price_minor / 100).toFixed(2)}
                    <span className="text-[11px] text-brand-mist font-medium ml-1">{item.currency}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </RailSection>
      )}

      {/* 9. Caribbean Diaspora Connected footnote */}
      <div className="px-1 pt-1 space-y-1">
        <p className="text-[12px] font-semibold text-[#C3CCDA] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" /> The Caribbean Connected
        </p>
        <p className="text-[11.5px] text-[#6B7A90] leading-relaxed">
          From the Greater &amp; Lesser Antilles to London, Miami, Montreal &amp; New York.
        </p>
      </div>
    </div>
  );
}

/** Shared right-rail section â€” quiet panel, small title, single text action. */
function RailSection({
  label,
  title,
  icon,
  action,
  children,
}: {
  label: string;
  title: string;
  icon?: React.ReactNode;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section aria-label={label} className="tk-panel p-4">
      <header className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-[13.5px] font-semibold text-white">
          {icon}
          {title}
        </h3>
        {action && (
          <Link href={action.href} className="text-xs font-medium text-brand-mist hover:text-white transition-colors">
            {action.label}
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}

function PageThumb({ src, name }: { src?: string | null; name: string }) {
  return (
    <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/[0.05] flex items-center justify-center shrink-0 border border-white/[0.06]">
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-semibold text-[#C3CCDA]" aria-hidden="true">
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}
