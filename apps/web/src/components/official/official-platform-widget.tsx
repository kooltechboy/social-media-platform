'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Sparkles, ArrowRight, Globe } from 'lucide-react';
import OfficialBadge from './official-badge';
import TukubiImage from '../ui/tukubi-image';

export interface OfficialPlatformWidgetProps {
  displayName?: string;
  username?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
  isOperator?: boolean;
}

export default function OfficialPlatformWidget({
  displayName = 'TUKUBI',
  username = 'tukubi',
  avatarUrl = null,
  bio,
  postsCount = 0,
  followersCount = 0,
  followingCount = 0,
  isOperator = false,
}: OfficialPlatformWidgetProps) {
  return (
    <div
      className="glass-aerospace rounded-3xl p-5 md:p-6 space-y-4 shadow-xl border border-white/14 relative overflow-hidden group transition-all duration-300 hover:border-brand-caribbeanSea/40"
      aria-label="Official TUKUBI Platform"
    >
      {/* Dynamic Specular Edge Reflection & Radiance */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-brand-caribbeanSea/15 rounded-full blur-2xl pointer-events-none" />

      {/* Header with Platform Identity & Verified Pulse */}
      <div className="flex items-center gap-3.5 relative z-10">
        <Link
          href={`/profile/${username}`}
          className="relative shrink-0 block group/avatar focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-caribbeanSea rounded-2xl"
          aria-label={`View ${displayName}'s official platform profile`}
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-brand-sunriseCoral via-brand-goldenHour to-brand-caribbeanSea p-[2px] shadow-lg shadow-brand-caribbeanSea/20 transition-transform duration-200 group-hover/avatar:scale-105">
            <div className="w-full h-full rounded-[14px] bg-[#0A1024] flex items-center justify-center overflow-hidden font-black text-brand-sandstone">
              {avatarUrl ? (
                <TukubiImage
                  src={avatarUrl}
                  alt={displayName}
                  fill
                  sizes="52px"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="bg-gradient-to-br from-brand-sandstone to-brand-sandstone/60 bg-clip-text text-transparent text-base">
                  {(displayName || username).slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Live Online Pulse */}
          <span
            title="Official Network Active"
            className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-[#0A1024]" />
          </span>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/profile/${username}`}
              className="text-base font-black text-white tracking-tight hover:text-brand-caribbeanSea transition-colors truncate"
            >
              {displayName}
            </Link>
            <OfficialBadge size="xs" showLabel={true} label="Official" />
          </div>
          <p className="text-xs font-semibold text-white/60 truncate">@{username}</p>
          <p className="text-[11px] text-brand-caribbeanSea font-bold tracking-tight">The Caribbean Connected</p>
        </div>
      </div>

      {/* Cultural Motto & Platform Description */}
      <div className="text-xs text-white/75 leading-relaxed bg-black/25 border border-white/8 rounded-2xl p-3 space-y-1">
        <p className="font-semibold text-brand-goldenHour flex items-center gap-1.5">
          <span>🌴</span> Born in the Caribbean. Built for the World.
        </p>
        <p className="text-white/65 text-[11px] leading-normal">
          {bio || 'Unifying Caribbean culture, creators, businesses, and the global diaspora in one digital ecosystem.'}
        </p>
      </div>

      {/* Platform Telemetry Metrics */}
      <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/10 text-center">
        <div>
          <div className="text-sm md:text-base font-black text-white tracking-tight">
            {postsCount.toLocaleString()}
          </div>
          <div className="text-[9px] uppercase font-extrabold text-white/50 tracking-wider">
            Posts
          </div>
        </div>
        <div className="border-x border-white/10">
          <div className="text-sm md:text-base font-black text-white tracking-tight">
            {followersCount.toLocaleString()}
          </div>
          <div className="text-[9px] uppercase font-extrabold text-white/50 tracking-wider">
            Followers
          </div>
        </div>
        <div>
          <div className="text-sm md:text-base font-black text-white tracking-tight">
            {followingCount.toLocaleString()}
          </div>
          <div className="text-[9px] uppercase font-extrabold text-white/50 tracking-wider">
            Following
          </div>
        </div>
      </div>

      {/* Action Strip: Authorized Operator Studio Access OR Public Profile Link */}
      <div className="pt-1 flex flex-col gap-2">
        {/* AUTHORIZED OPERATORS ONLY: Strict database-verified Studio access */}
        {isOperator && (
          <Link
            href="/admin/official-accounts"
            className="w-full bg-gradient-to-r from-brand-caribbeanSea via-[#38BDF8] to-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/25 active:scale-98 min-h-[42px]"
          >
            <Sparkles className="w-4 h-4 fill-slate-950/40" />
            <span>Official Publishing Studio</span>
          </Link>
        )}

        <Link
          href={`/profile/${username}`}
          className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-2 px-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 border border-white/10 transition-colors min-h-[38px]"
        >
          <span>View Official Profile</span>
          <ArrowRight className="w-3.5 h-3.5 text-white/60" />
        </Link>
      </div>
    </div>
  );
}
