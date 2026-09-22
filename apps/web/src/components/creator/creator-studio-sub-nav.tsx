'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Radio,
  Film,
  DollarSign,
  Sparkles,
  Tv,
  Users,
  Megaphone,
  Plus,
} from 'lucide-react';

const CREATOR_TABS = [
  { href: '/creator-studio', label: 'Studio Dashboard', icon: Radio, exact: true },
  { href: '/creator-studio/videos', label: 'Videos & Reels', icon: Film },
  { href: '/creator-studio/monetization', label: 'Monetization & Tips', icon: DollarSign },
  { href: '/creator-studio/repurpose', label: 'Repurposing', icon: Sparkles },
  { href: '/live', label: 'Live Broadcasts', icon: Tv },
  { href: '/creator-hub', label: 'Creator Hub', icon: Users },
  { href: '/ads', label: 'Ads & Promotion', icon: Megaphone },
];

export default function CreatorStudioSubNav() {
  const pathname = usePathname();

  return (
    <div className="w-full bg-brand-dusk/90 border-b border-slate-800/80 backdrop-blur-md px-4 sm:px-6 py-3 mb-6 rounded-2xl">
      <div className="flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-1.5 sm:gap-2 shrink-0" aria-label="Creator Studio Navigation">
          {CREATOR_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 min-h-[38px] ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 shadow-md shadow-brand-caribbeanSea/20'
                    : 'text-brand-sandstone/70 hover:text-brand-sandstone hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        <Link
          href="/create"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-goldenHour hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shrink-0 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Upload Content</span>
          <span className="sm:hidden">Upload</span>
        </Link>
      </div>
    </div>
  );
}
