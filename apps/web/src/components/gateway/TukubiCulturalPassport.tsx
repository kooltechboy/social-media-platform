'use client';

import React from 'react';
import { ShieldCheck, Sparkles, Globe, QrCode } from 'lucide-react';

interface TukubiCulturalPassportProps {
  displayName?: string;
  username?: string;
  originCountryName?: string;
  originCountryIso?: string;
  originFlag?: string;
  diasporaCountryName?: string;
  diasporaFlag?: string;
  accountType?: string;
  interestsCount?: number;
}

export function TukubiCulturalPassport({
  displayName = 'Caribbean Member',
  username = 'member',
  originCountryName = 'Caribbean',
  originCountryIso = 'CAR',
  originFlag = '🌴',
  diasporaCountryName = 'Global Diaspora',
  diasporaFlag = '🌎',
  accountType = 'Member',
  interestsCount = 0,
}: TukubiCulturalPassportProps) {
  return (
    <div className="relative w-full max-w-sm mx-auto select-none group perspective-1000">
      {/* Outer ambient glow halo */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral opacity-70 blur-xl group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />

      {/* Holographic metallic glass passport card */}
      <div className="relative rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#121E36]/90 via-[#0B1528]/95 to-[#060D1A]/95 backdrop-blur-3xl border border-white/20 shadow-2xl text-white overflow-hidden">
        {/* Holographic Light Sweep overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none opacity-50" />
        <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-brand-caribbeanSea/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-40 h-40 rounded-full bg-brand-sunriseCoral/20 blur-3xl pointer-events-none" />

        {/* Top Passport Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-caribbeanSea to-brand-goldenHour p-[1px]">
              <div className="w-full h-full bg-[#080D18] rounded-lg flex items-center justify-center">
                <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-tr from-brand-caribbeanSea to-brand-goldenHour">
                  T
                </span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black tracking-widest text-brand-caribbeanSea uppercase">
                TUKUBI CULTURAL PASSPORT
              </p>
              <p className="text-[9px] text-brand-sandstone/50 font-medium tracking-wider">
                DIGITAL IDENTITY & DIASPORA CITIZEN
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold">
            <span>{originFlag}</span>
            <span className="text-brand-goldenHour">{originCountryIso}</span>
          </div>
        </div>

        {/* Middle Card: Avatar + NFC Chip + Identity Info */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar frame */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral p-[1.5px] shadow-lg">
              <div className="w-full h-full rounded-2xl bg-[#090F1E] flex items-center justify-center text-xl font-black text-white">
                {displayName.charAt(0)}
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 text-base shadow-sm">
              {originFlag}
            </span>
          </div>

          {/* User details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-sm text-white truncate tracking-tight">
                {displayName}
              </h3>
              <ShieldCheck className="w-3.5 h-3.5 text-brand-caribbeanSea flex-shrink-0" />
            </div>
            <p className="text-xs font-semibold text-brand-caribbeanSea truncate">
              @{username}
            </p>
            <p className="text-[10px] text-brand-sandstone/70 font-medium mt-0.5">
              Role: <span className="text-brand-goldenHour">{accountType}</span>
            </p>
          </div>

          {/* Holographic NFC Smart Chip Graphic */}
          <div className="w-9 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-[1px] shadow-inner opacity-90 flex-shrink-0">
            <div className="w-full h-full bg-amber-900/60 rounded-md border border-amber-300/40 grid grid-cols-2 gap-[1px] p-0.5">
              <div className="border-r border-b border-amber-300/50 rounded-tl" />
              <div className="border-b border-amber-300/50 rounded-tr" />
              <div className="border-r border-amber-300/50 rounded-bl" />
              <div className="rounded-br" />
            </div>
          </div>
        </div>

        {/* Geographic Roots Corridor */}
        <div className="bg-[#070E1C]/80 border border-white/10 rounded-2xl p-2.5 mb-4 flex items-center justify-between text-xs">
          <div>
            <p className="text-[9px] font-bold text-brand-sandstone/50 uppercase tracking-wider">
              Island Heritage
            </p>
            <p className="font-bold text-white flex items-center gap-1 mt-0.5 text-[11px]">
              <span>{originFlag}</span>
              <span>{originCountryName}</span>
            </p>
          </div>

          <div className="h-6 w-[1px] bg-white/10" />

          <div>
            <p className="text-[9px] font-bold text-brand-sandstone/50 uppercase tracking-wider">
              Current Diaspora Hub
            </p>
            <p className="font-bold text-white flex items-center gap-1 mt-0.5 text-[11px]">
              <span>{diasporaFlag}</span>
              <span>{diasporaCountryName}</span>
            </p>
          </div>
        </div>

        {/* Bottom Passport Details & Hologram Hash */}
        <div className="flex items-end justify-between border-t border-white/10 pt-3">
          <div className="space-y-0.5">
            <p className="text-[9px] text-brand-sandstone/40 font-mono tracking-wider uppercase">
              PASSPORT NO: TKB-{originCountryIso}-{(username.length * 104729).toString().slice(0, 6)}
            </p>
            <p className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Multi-Currency Active • {interestsCount} Cultural Streams
            </p>
          </div>

          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/70">
            <QrCode className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
