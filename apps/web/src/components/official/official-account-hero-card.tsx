'use client';

import React from 'react';
import Link from 'next/link';
import { BadgeCheck, Shield, Sparkles, MapPin, Globe, CheckCircle, Radio } from 'lucide-react';
import OfficialBadge from './official-badge';
import UserAvatar from '../user-avatar';

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
  bio = '🌴 The Caribbean Connected.\nConnecting Caribbean people, culture, creators, businesses & the global diaspora.\n🌎 Born in the Caribbean. Built for the World.',
  postsCount = 0,
  followersCount = 0,
  followingCount = 0,
  isOperator = false,
}: OfficialAccountHeroCardProps) {
  return (
    <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-[#090D1C] group transition-all duration-300 hover:border-white/25">
      {/* Dynamic Aerospace Multilayer Backdrop */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/95 via-[#0D253A]/90 to-[#1A102F]/95 backdrop-blur-3xl" />
        {/* Radiance Highlights */}
        <div className="absolute -top-32 -left-32 w-[450px] h-[450px] bg-brand-caribbeanSea/25 rounded-full blur-[110px] animate-subtlePulse" />
        <div className="absolute -bottom-32 -right-32 w-[450px] h-[450px] bg-brand-sunriseCoral/20 rounded-full blur-[110px]" />
        {/* High-definition top specular light reflection line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>

      {/* Hero Card Content */}
      <div className="relative z-10 p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center sm:items-start gap-4 sm:gap-5">
          {/* Avatar TU with Gradient Ring & Online Dot */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-brand-sunriseCoral via-brand-goldenHour to-brand-caribbeanSea p-[2px] shadow-2xl shadow-brand-caribbeanSea/20">
              <div className="w-full h-full rounded-2xl bg-[#0A1024] flex items-center justify-center text-xl sm:text-2xl font-black text-brand-sandstone tracking-wider">
                {avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  'TU'
                )}
              </div>
            </div>
            {/* Live Online Pulse Beacon */}
            <span
              title="Official Platform Network Active"
              className="absolute -bottom-1 -right-1 flex h-4 w-4"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 ring-2 ring-[#0A1024] shadow-[0_0_12px_rgba(16,185,129,0.9)]" />
            </span>
          </div>

          {/* Profile Identity Details */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-1.5">
                {displayName}
              </h2>
              <BadgeCheck
                className="w-5 h-5 text-brand-caribbeanSea fill-brand-caribbeanSea/20 drop-shadow-[0_0_8px_rgba(0,180,216,0.6)]"
                aria-label="Verified Platform Identity"
              />
              <OfficialBadge size="sm" showLabel={true} label="Official TUKUBI" />
            </div>

            <p className="text-xs sm:text-sm font-semibold text-white/60 tracking-tight">
              @{username}
            </p>

            <div className="text-xs text-brand-sandstone/85 leading-relaxed font-medium pt-0.5 space-y-0.5">
              <p className="text-brand-caribbeanSea font-bold tracking-tight">The Caribbean Connected.</p>
              <p className="text-[11px] text-white/70 font-medium">
                🌴 Born in the Caribbean. &nbsp;|&nbsp; 🌎 Built for the World.
              </p>
            </div>
          </div>
        </div>

        {/* Telemetry Stats & Official Status Box */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-black/40 backdrop-blur-2xl border border-white/12 px-5 py-3.5 rounded-2xl shrink-0 w-full md:w-auto justify-between sm:justify-start shadow-xl shadow-black/40">
          <div className="flex items-center gap-4 sm:gap-6 text-center">
            <div>
              <div className="text-base sm:text-lg font-black text-white tracking-tight">{postsCount}</div>
              <div className="text-[9px] uppercase font-extrabold text-white/45 tracking-widest">Posts</div>
            </div>

            <div className="h-6 w-px bg-white/10" />

            <div>
              <div className="text-base sm:text-lg font-black text-white tracking-tight">{followersCount}</div>
              <div className="text-[9px] uppercase font-extrabold text-white/45 tracking-widest">Followers</div>
            </div>

            <div className="h-6 w-px bg-white/10" />

            <div>
              <div className="text-base sm:text-lg font-black text-white tracking-tight">{followingCount}</div>
              <div className="text-[9px] uppercase font-extrabold text-white/45 tracking-widest">Following</div>
            </div>
          </div>

          <div className="h-6 w-px bg-white/10 hidden sm:block" />

          {/* Official Account Shield Indicator */}
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 bg-amber-500/15 px-3 py-1.5 rounded-xl border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <Shield className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            <span>Official Platform</span>
          </div>

          {isOperator && (
            <Link
              href="/admin/official-accounts"
              className="bg-gradient-to-r from-brand-caribbeanSea to-[#38BDF8] hover:brightness-110 text-slate-950 text-[11px] font-black px-4 py-1.5 rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-1.5 ml-auto sm:ml-2 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950/30" />
              Studio
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

