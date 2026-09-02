'use client';

import React from 'react';
import Link from 'next/link';
import { BadgeCheck, Shield, Sparkles, MapPin, Globe, CheckCircle } from 'lucide-react';
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
    <div className="relative rounded-3xl overflow-hidden border border-slate-800/90 shadow-2xl bg-[#0B132B]">
      {/* Scenic Caribbean Panorama Background */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-r from-[#0F172A] via-[#0D253A] to-[#1E1B4B] opacity-90" />
        {/* Subtle decorative tropical scenic glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-caribbeanSea/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-sunriseCoral/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Hero Card Content */}
      <div className="relative z-10 p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center sm:items-start gap-4 sm:gap-5">
          {/* Avatar TU with Gradient Ring & Online Dot */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-brand-sunriseCoral via-brand-goldenHour to-brand-caribbeanSea p-[3px] shadow-2xl">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#131F3A] to-[#1E293B] flex items-center justify-center text-xl sm:text-2xl font-black text-brand-sandstone tracking-wider">
                TU
              </div>
            </div>
            {/* Green Online Dot */}
            <span
              title="Official Account Active"
              className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-[#0B132B] shadow-[0_0_10px_rgba(16,185,129,0.8)]"
            />
          </div>

          {/* Profile Identity Details */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-brand-sandstone tracking-tight">
                {displayName}
              </h2>
              <BadgeCheck
                className="w-5 h-5 text-[#0EA5E9] fill-[#0EA5E9]/20"
                aria-label="Verified Platform Identity"
              />
              <OfficialBadge size="sm" showLabel={true} label="Official TUKUBI" />
            </div>

            <p className="text-xs sm:text-sm font-semibold text-brand-sandstone/60">
              @{username}
            </p>

            <div className="text-xs text-brand-sandstone/80 leading-relaxed font-medium pt-0.5 space-y-0.5">
              <p className="text-brand-caribbeanSea font-bold">The Caribbean Connected.</p>
              <p className="text-[11px] text-brand-sandstone/70">
                🌴 Born in the Caribbean. &nbsp;|&nbsp; 🌎 Built for the World.
              </p>
            </div>
          </div>
        </div>

        {/* Stats & Official Status Box */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 px-4 py-3 rounded-2xl shrink-0 w-full md:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-4 sm:gap-6 text-center">
            <div>
              <div className="text-base sm:text-lg font-black text-brand-sandstone">{postsCount}</div>
              <div className="text-[10px] uppercase font-bold text-brand-sandstone/50 tracking-wider">Posts</div>
            </div>

            <div className="h-6 w-px bg-slate-800" />

            <div>
              <div className="text-base sm:text-lg font-black text-brand-sandstone">{followersCount}</div>
              <div className="text-[10px] uppercase font-bold text-brand-sandstone/50 tracking-wider">Followers</div>
            </div>

            <div className="h-6 w-px bg-slate-800" />

            <div>
              <div className="text-base sm:text-lg font-black text-brand-sandstone">{followingCount}</div>
              <div className="text-[10px] uppercase font-bold text-brand-sandstone/50 tracking-wider">Following</div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* Official Account Shield Indicator */}
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30">
            <Shield className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            <span>Official Account</span>
          </div>

          {isOperator && (
            <Link
              href="/admin/official-accounts"
              className="bg-brand-caribbeanSea hover:bg-[#38BDF8] text-slate-950 text-[11px] font-black px-3.5 py-1.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 ml-auto sm:ml-2"
            >
              <Sparkles className="w-3 h-3" />
              Studio
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
