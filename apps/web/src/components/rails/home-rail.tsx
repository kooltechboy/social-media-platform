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
}

export default function HomeRail({
  suggestedPeople = [],
  trendingTopics = [],
  upcomingEvents = [],
  marketplaceItems = [],
  activeLiveStream = null,
}: HomeRailProps) {
  const displayTrends = trendingTopics;

  return (
    <div className="space-y-5">
      {/* 1. Live Broadcast Callout (if active) */}
      {activeLiveStream && (
        <div className="glass rounded-3xl p-4 border border-rose-500/30 bg-rose-500/5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] uppercase tracking-wider animate-pulse">
              <Tv className="w-3 h-3" /> Live Now
            </span>
            {activeLiveStream.peak_viewers !== undefined && (
              <span className="text-[11px] font-bold text-rose-300">
                {activeLiveStream.peak_viewers} watching
              </span>
            )}
          </div>
          <div>
            <h4 className="text-xs font-black text-white line-clamp-1">
              {activeLiveStream.title}
            </h4>
            {activeLiveStream.creator_name && (
              <p className="text-[11px] text-brand-sandstone/70 truncate mt-0.5">
                by {activeLiveStream.creator_name}
              </p>
            )}
          </div>
          <Link
            href={`/live?id=${activeLiveStream.id}`}
            className="w-full flex items-center justify-center py-2 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs transition-colors shadow-sm"
          >
            Watch Broadcast
          </Link>
        </div>
      )}

      {/* 2. People You May Know */}
      {suggestedPeople.length > 0 && (
        <section aria-label="People You May Know" className="glass rounded-3xl p-4 sm:p-5 space-y-3.5 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-caribbeanSea" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                People You May Know
              </h3>
            </div>
            <Link
              href="/people"
              className="text-[11px] font-bold text-brand-caribbeanSea hover:underline"
            >
              See All
            </Link>
          </div>

          <div className="space-y-3 pt-0.5">
            {suggestedPeople.slice(0, 4).map((person) => (
              <div key={person.id} className="flex items-center justify-between gap-3 group">
                <Link
                  href={`/profile/${person.username}`}
                  className="flex items-center gap-2.5 min-w-0 flex-1"
                >
                  <UserAvatar
                    src={person.avatar_url}
                    name={person.display_name}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate group-hover:text-brand-caribbeanSea transition-colors flex items-center gap-1">
                      <span>{person.display_name}</span>
                      {person.is_verified && (
                        <CheckCircle className="w-3 h-3 text-brand-caribbeanSea shrink-0" />
                      )}
                    </p>
                    <p className="text-[10px] text-brand-sandstone/60 truncate">
                      @{person.username}
                      {person.origin_country_iso && ` • ${person.origin_country_iso}`}
                    </p>
                  </div>
                </Link>

                <div className="shrink-0">
                  <FollowButton
                    targetUserId={person.id}
                    isFollowing={!!person.is_following}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Trending Caribbean Topics */}
      <section aria-label="Trending Caribbean Topics" className="glass rounded-3xl p-4 sm:p-5 space-y-3 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-goldenHour" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Trending Topics
            </h3>
          </div>
          <Link
            href="/explore"
            className="text-[11px] font-bold text-brand-goldenHour hover:underline flex items-center gap-0.5"
          >
            Explore <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {displayTrends.length === 0 ? (
          <p className="text-xs text-brand-sandstone/60 py-2">
            Trending topics will appear here as the TUKUBI community grows.
          </p>
        ) : (
          <div className="space-y-2 pt-0.5">
            {displayTrends.slice(0, 5).map((trend, idx) => (
              <Link
                key={trend.tag}
                href={`/explore?q=${encodeURIComponent('#' + trend.tag)}`}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <div className="min-w-0">
                  <span className="text-[10px] text-brand-sandstone/50 font-bold">
                    #{idx + 1} Trending
                  </span>
                  <p className="text-xs font-black text-white group-hover:text-brand-goldenHour transition-colors truncate">
                    #{trend.tag}
                  </p>
                </div>
                {trend.post_count !== undefined && (
                  <span className="text-[10px] font-bold text-brand-sandstone/60 shrink-0">
                    {trend.post_count} posts
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 4. Upcoming Cultural Events Spotlight */}
      {upcomingEvents.length > 0 && (
        <section aria-label="Upcoming Cultural Events" className="glass rounded-3xl p-4 sm:p-5 space-y-3 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Upcoming Events
              </h3>
            </div>
            <Link
              href="/events"
              className="text-[11px] font-bold text-amber-400 hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="space-y-2 pt-0.5">
            {upcomingEvents.slice(0, 3).map((event) => {
              const dateStr = new Date(event.start_time).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
              return (
                <Link
                  key={event.id}
                  href={`/events`}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors block group"
                >
                  <p className="text-xs font-black text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                    {event.title}
                  </p>
                  <p className="text-[10px] text-brand-sandstone/60 truncate mt-0.5">
                    {dateStr} {event.location_name ? `• ${event.location_name}` : ''}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Marketplace Highlights */}
      {marketplaceItems.length > 0 && (
        <section aria-label="Marketplace Highlights" className="glass rounded-3xl p-4 sm:p-5 space-y-3 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-brand-sunriseCoral" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Market Highlights
              </h3>
            </div>
            <Link
              href="/marketplace"
              className="text-[11px] font-bold text-brand-sunriseCoral hover:underline"
            >
              Shop All
            </Link>
          </div>

          <div className="space-y-2 pt-0.5">
            {marketplaceItems.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                href={`/marketplace/${item.id}`}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors block group"
              >
                <p className="text-xs font-black text-white line-clamp-1 group-hover:text-brand-sunriseCoral transition-colors">
                  {item.title}
                </p>
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span className="font-extrabold text-brand-sunriseCoral">
                    ${(item.price_minor / 100).toFixed(2)} {item.currency}
                  </span>
                  {item.seller_name && (
                    <span className="text-brand-sandstone/60 truncate max-w-[120px]">
                      {item.seller_name}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 6. Caribbean Diaspora Connected Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-caribbeanSea/10 via-brand-sunsetPurple/20 to-brand-sunriseCoral/10 border border-white/10 text-center space-y-1.5">
        <p className="text-xs font-black text-brand-sandstone flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" /> The Caribbean Connected
        </p>
        <p className="text-[11px] text-brand-sandstone/70 leading-relaxed">
          From the Greater &amp; Lesser Antilles to London, Miami, Montreal &amp; New York.
        </p>
      </div>
    </div>
  );
}
