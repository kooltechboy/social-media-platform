'use client';

import React from 'react';
import Link from 'next/link';
import {
  Radio,
  BarChart3,
  DollarSign,
  Film,
  Tv,
  Users,
  Settings,
  PlusCircle,
  ChevronRight,
  Sparkles,
  Megaphone,
} from 'lucide-react';

export default function CreatorStudioRail() {
  const STUDIO_LINKS = [
    { href: '/creator-studio', label: 'Studio Dashboard', icon: Radio },
    { href: '/creator-studio/videos', label: 'Videos & Reels Library', icon: Film },
    { href: '/live', label: 'Live Broadcast Center', icon: Tv },
    { href: '/creator-studio/monetization', label: 'Monetization & Tips', icon: DollarSign },
    { href: '/creator-studio/repurpose', label: 'Content Repurposing', icon: Sparkles },
    { href: '/creator-hub', label: 'Creator Hub Overview', icon: Users },
    { href: '/ads', label: 'Ads & Campaigns', icon: Megaphone },
  ];

  return (
    <div className="space-y-5">
      {/* 1. Quick Upload Action */}
      <div className="glass rounded-3xl p-5 border border-brand-goldenHour/30 bg-gradient-to-br from-brand-goldenHour/10 to-brand-sunsetPurple/20 space-y-3 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-goldenHour to-brand-sunriseCoral flex items-center justify-center text-slate-950 font-black shadow-md">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Creator Studio</h3>
            <p className="text-[10px] text-brand-sandstone/60">
              Media &amp; Monetization suite
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Manage your media library, stream live, track audience insights, and collect fan payouts.
        </p>
        <Link
          href="/create"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-brand-goldenHour hover:brightness-110 text-slate-950 font-black text-xs transition-all shadow-md"
        >
          <PlusCircle className="w-4 h-4 text-slate-950" />
          <span>Upload Media</span>
        </Link>
      </div>

      {/* 2. Studio Navigation Links */}
      <section aria-label="Studio Modules" className="glass rounded-3xl p-4 sm:p-5 space-y-2 border border-white/10">
        <h4 className="text-xs font-black text-white uppercase tracking-wider">
          Studio Modules
        </h4>
        <nav className="space-y-1 pt-1">
          {STUDIO_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 text-brand-goldenHour shrink-0" />
                  <span className="truncate">{link.label}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
              </Link>
            );
          })}
        </nav>
      </section>

      {/* 3. Creator Payout Policy Guarantee */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1 text-center">
        <p className="text-xs font-black text-brand-caribbeanSea">Ledger Guaranteed Payouts</p>
        <p className="text-[10px] text-brand-sandstone/70">
          All creator earnings and tips are secured with double-entry idempotency and direct Caribbean settlement.
        </p>
      </div>
    </div>
  );
}
