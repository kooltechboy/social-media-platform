'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Sparkles, ArrowRight } from 'lucide-react';
import OfficialBadge from './official-badge';

export interface OfficialAccountHeroCardProps {
  displayName?: string;
  username?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
  isOperator?: boolean;
}

export default function OfficialAccountHeroCard({
  displayName = 'TUKUBI',
  username = 'tukubi',
  avatarUrl = null,
  bio,
  postsCount = 0,
  followersCount = 0,
  followingCount = 0,
  isOperator = false,
}: OfficialAccountHeroCardProps) {
  return (
    <article className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-[#090D1C] group transition-all duration-300 hover:border-brand-caribbeanSea/40">
      {/* Dynamic Caribbean Aerospace Multilayer Backdrop */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A]/95 via-[#0A1A2E]/90 to-[#180E2B]/95 backdrop-blur-3xl" />
        {/* Radiance Highlights */}
        <div className="absolute -top-24 -left-24 w-72 sm:w-96 h-72 sm:h-96 bg-brand-caribbeanSea/20 rounded-full blur-[90px] animate-subtlePulse" />
        <div className="absolute -bottom-24 -right-24 w-72 sm:w-96 h-72 sm:h-96 bg-brand-sunriseCoral/15 rounded-full blur-[90px]" />
        {/* High-definition top specular light reflection line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>

      {/* Hero Card Body */}
      <div className="relative z-10 p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">
        {/* Top Tier: Avatar + Identity + Primary Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center sm:items-start gap-3.5 sm:gap-4.5 min-w-0">
            {/* Avatar with Sunset Gradient Ring & Online Dot */}
            <Link
              href={`/profile/${username}`}
              className="relative shrink-0 block group/avatar focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-caribbeanSea rounded-2xl"
              aria-label={`View ${displayName}'s profile`}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-2xl bg-gradient-to-tr from-brand-sunriseCoral via-brand-goldenHour to-brand-caribbeanSea p-[2px] shadow-xl shadow-brand-caribbeanSea/20 transition-transform duration-200 group-hover/avatar:scale-105">
                <div className="w-full h-full rounded-[14px] bg-[#0A1024] flex items-center justify-center overflow-hidden text-lg sm:text-xl font-black text-brand-sandstone tracking-wider">
                  {avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="bg-gradient-to-br from-brand-sandstone to-brand-sandstone/60 bg-clip-text text-transparent">
                      {(displayName || username).slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Live Online Pulse Beacon */}
              <span
                title="Official Platform Network Active"
                className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 sm:h-4 sm:w-4"
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 bg-emerald-500 ring-2 ring-[#0A1024] shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              </span>
            </Link>

            {/* Profile Identity Details */}
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/profile/${username}`}
                  className="text-lg sm:text-2xl font-black text-white tracking-tight hover:text-brand-caribbeanSea transition-colors truncate"
                >
                  {displayName}
                </Link>
                <OfficialBadge size="sm" showLabel={true} label="Official TUKUBI" />
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${username}`}
                  className="text-xs sm:text-sm font-semibold text-white/60 hover:text-brand-caribbeanSea transition-colors"
                >
                  @{username}
                </Link>
                <span className="text-white/20 text-xs hidden sm:inline">•</span>
                <span className="text-[11px] sm:text-xs text-brand-caribbeanSea font-bold tracking-tight hidden sm:inline">
                  The Caribbean Connected
                </span>
              </div>

              {/* Mobile Tagline Preview */}
              <div className="text-xs text-brand-sandstone/80 leading-relaxed font-medium pt-0.5 sm:hidden space-y-0.5">
                <p className="text-brand-caribbeanSea font-bold">The Caribbean Connected.</p>
                <p className="text-[11px] text-white/70">
                  🌴 Born in the Caribbean. &nbsp;|&nbsp; 🌎 Built for the World.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons on Desktop / Top Right */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {isOperator && (
              <Link
                href="/admin/official-accounts"
                className="bg-gradient-to-r from-brand-caribbeanSea to-[#38BDF8] hover:brightness-110 text-slate-950 text-xs font-black px-3.5 py-1.5 rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-1.5 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 fill-slate-950/40" />
                <span>Studio</span>
              </Link>
            )}
            <Link
              href={`/profile/${username}`}
              className="bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
            >
              <span>View Profile</span>
              <ArrowRight className="w-3 h-3 text-white/50" />
            </Link>
          </div>
        </div>

        {/* Bio on Tablet / Desktop */}
        <div className="hidden sm:block text-xs text-brand-sandstone/80 leading-relaxed font-medium bg-white/[0.02] border border-white/5 rounded-xl px-3.5 py-2">
          {bio ? (
            <p className="whitespace-pre-line text-white/80">{bio}</p>
          ) : (
            <div className="space-y-0.5">
              <p className="text-brand-caribbeanSea font-semibold">🌴 The Caribbean Connected.</p>
              <p className="text-white/75">
                Connecting Caribbean people, culture, creators, businesses &amp; the global diaspora. 🌎 Born in the Caribbean. Built for the World.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Tier: Stats & Status Pill Bar (Never Collides or Overflows) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-black/40 backdrop-blur-2xl border border-white/10 px-4 py-2.5 rounded-2xl shadow-xl shadow-black/40">
          {/* Telemetry Stats */}
          <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-6 text-center divide-x divide-white/10 sm:divide-x-0">
            <div className="px-2 sm:px-0">
              <div className="text-base sm:text-lg font-black text-white tracking-tight leading-tight">
                {postsCount.toLocaleString()}
              </div>
              <div className="text-[9px] uppercase font-extrabold text-white/45 tracking-widest">
                Posts
              </div>
            </div>

            <div className="hidden sm:block h-6 w-px bg-white/10" />

            <div className="px-2 sm:px-0">
              <div className="text-base sm:text-lg font-black text-white tracking-tight leading-tight">
                {followersCount.toLocaleString()}
              </div>
              <div className="text-[9px] uppercase font-extrabold text-white/45 tracking-widest">
                Followers
              </div>
            </div>

            <div className="hidden sm:block h-6 w-px bg-white/10" />

            <div className="px-2 sm:px-0">
              <div className="text-base sm:text-lg font-black text-white tracking-tight leading-tight">
                {followingCount.toLocaleString()}
              </div>
              <div className="text-[9px] uppercase font-extrabold text-white/45 tracking-widest">
                Following
              </div>
            </div>
          </div>

          {/* Badges & Actions for Mobile / Right side */}
          <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t border-white/10 sm:border-t-0">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-amber-300/90 bg-amber-500/10 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-amber-500/25 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
              <Shield className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20 shrink-0" />
              <span className="truncate">Official Platform</span>
            </div>

            {/* Mobile Action Buttons */}
            <div className="flex sm:hidden items-center gap-1.5">
              {isOperator && (
                <Link
                  href="/admin/official-accounts"
                  className="bg-gradient-to-r from-brand-caribbeanSea to-[#38BDF8] text-slate-950 text-[11px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-md shadow-cyan-500/20"
                >
                  <Sparkles className="w-3 h-3 fill-slate-950/40" />
                  Studio
                </Link>
              )}
              <Link
                href={`/profile/${username}`}
                className="bg-white/10 hover:bg-white/15 text-white text-[11px] font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1 border border-white/10"
              >
                Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

