'use client';

import React from 'react';
import { Globe, Radio, Sparkles } from 'lucide-react';

interface DiasporaCityCard {
  city: string;
  country: string;
  flag: string;
  activeCount: string;
  bgGradient: string;
  tag: string;
}

const CITIES: DiasporaCityCard[] = [
  {
    city: 'Kingston',
    country: 'Jamaica',
    flag: '🇯🇲',
    activeCount: '2.9M Active',
    bgGradient: 'from-[#0B1E17] to-[#040D0A]',
    tag: 'Dub & Sound Capital',
  },
  {
    city: 'Santo Domingo',
    country: 'Dominican Republic',
    flag: '🇩🇴',
    activeCount: '10.8M Active',
    bgGradient: 'from-[#1E0F15] to-[#0D0509]',
    tag: 'Bachata & Tech Hub',
  },
  {
    city: 'Port of Spain',
    country: 'Trinidad & Tobago',
    flag: '🇹🇹',
    activeCount: '1.5M Active',
    bgGradient: 'from-[#201509] to-[#0E0904]',
    tag: 'Carnival & Steelpan',
  },
  {
    city: 'Bridgetown',
    country: 'Barbados',
    flag: '🇧🇧',
    activeCount: '280k Active',
    bgGradient: 'from-[#0A1A2E] to-[#040C16]',
    tag: 'Fintech & Culinary',
  },
  {
    city: 'Miami',
    country: 'United States',
    flag: '🇺🇸',
    activeCount: '1.8M Diaspora',
    bgGradient: 'from-[#1C0D26] to-[#0C0512]',
    tag: 'Diaspora Gateway',
  },
  {
    city: 'Toronto',
    country: 'Canada',
    flag: '🇨🇦',
    activeCount: '890k Diaspora',
    bgGradient: 'from-[#1F0E13] to-[#0E0608]',
    tag: 'Caribana Hub',
  },
  {
    city: 'London',
    country: 'United Kingdom',
    flag: '🇬🇧',
    activeCount: '1.2M Diaspora',
    bgGradient: 'from-[#0E1A29] to-[#050C14]',
    tag: 'Notting Hill Hub',
  },
];

export function ShowcaseDiasporaCities() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Globe className="w-5 h-5 text-brand-caribbeanSea" />
            A Community Without Borders
          </h3>
          <p className="text-xs text-brand-sandstone/60 mt-0.5">
            Connecting the islands directly to major global diaspora cultural capitals.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 sm:gap-3">
        {CITIES.map((c) => (
          <div
            key={c.city}
            className={`rounded-2xl p-3.5 border border-white/10 bg-gradient-to-b ${c.bgGradient} hover:border-brand-goldenHour/40 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-xl flex flex-col justify-between min-h-[130px] group cursor-pointer`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{c.flag}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div className="space-y-0.5 mt-2">
              <h4 className="font-extrabold text-sm text-white truncate group-hover:text-brand-goldenHour transition-colors">
                {c.city}
              </h4>
              <p className="text-[10px] text-brand-sandstone/60 truncate font-medium">
                {c.country}
              </p>
              <p className="text-[9px] text-brand-caribbeanSea font-bold pt-1">
                {c.activeCount}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
