'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Palette,
  Store,
  Building2,
  Mic,
  Users,
  ShoppingBag,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Globe,
  Radio,
  Lock,
  AtSign,
  Mail,
} from 'lucide-react';
import { CARIBBEAN_TERRITORIES } from '../../lib/constants/caribbean-territories';
import { TukubiCulturalPassport } from './TukubiCulturalPassport';

export function InteractiveOnboardingPreview() {
  const [activePreviewStep, setActivePreviewStep] = useState(1);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-brand-caribbeanSea/15 text-brand-caribbeanSea border border-brand-caribbeanSea/30 inline-block mb-1">
            Progressive Onboarding Architecture
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            How You Enter Tukubi
          </h3>
          <p className="text-xs text-brand-sandstone/60">
            A 5-step identity onboarding system designed to calibrate your personal cultural network.
          </p>
        </div>

        <Link
          href="/signup"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-[#060A12] shadow-lg shadow-brand-caribbeanSea/20 hover:opacity-95 transition-all self-start sm:self-auto"
        >
          <span>Start Onboarding</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Step Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {[
          { num: 1, title: '1. Intent' },
          { num: 2, title: '2. Your Caribbean' },
          { num: 3, title: '3. Identity & Passport' },
          { num: 4, title: '4. Cultural Vibes' },
          { num: 5, title: '5. Launch & Passport' },
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setActivePreviewStep(s.num)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activePreviewStep === s.num
                ? 'bg-gradient-to-r from-brand-caribbeanSea to-brand-goldenHour text-[#060A12] shadow-md shadow-brand-caribbeanSea/20'
                : 'bg-white/5 text-brand-sandstone/70 hover:bg-white/10 hover:text-white border border-white/5'
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Horizontal 5-Step Card Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* Screen 1: What brings you */}
        <div
          onClick={() => setActivePreviewStep(1)}
          className={`rounded-3xl p-4 border transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[340px] ${
            activePreviewStep === 1
              ? 'bg-[#0B1528] border-brand-caribbeanSea shadow-2xl ring-1 ring-brand-caribbeanSea/40'
              : 'bg-[#080D18]/80 border-white/10 opacity-70 hover:opacity-100 hover:border-white/20'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-brand-caribbeanSea uppercase tracking-wider">Step 1</span>
              <div className="w-2 h-2 rounded-full bg-brand-caribbeanSea" />
            </div>
            <h4 className="text-base font-extrabold text-white">
              What brings you to Tukubi?
            </h4>
            <p className="text-[10px] text-brand-sandstone/60 mb-3">
              Calibrate your platform account type.
            </p>

            <div className="space-y-1.5 text-xs">
              {[
                { icon: <User className="w-3.5 h-3.5 text-brand-caribbeanSea" />, label: 'Personal', active: true },
                { icon: <Palette className="w-3.5 h-3.5 text-brand-sunriseCoral" />, label: 'Creator' },
                { icon: <Store className="w-3.5 h-3.5 text-brand-goldenHour" />, label: 'Business' },
                { icon: <Building2 className="w-3.5 h-3.5 text-cyan-400" />, label: 'Organization' },
                { icon: <Mic className="w-3.5 h-3.5 text-purple-400" />, label: 'Media / Podcast' },
                { icon: <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />, label: 'Seller' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] font-semibold ${
                    item.active
                      ? 'bg-brand-caribbeanSea/20 border-brand-caribbeanSea text-white'
                      : 'bg-white/5 border-white/5 text-brand-sandstone/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full py-2 rounded-xl text-center font-bold text-[11px] bg-brand-caribbeanSea text-slate-950 mt-3">
            Continue →
          </div>
        </div>

        {/* Screen 2: Your Caribbean */}
        <div
          onClick={() => setActivePreviewStep(2)}
          className={`rounded-3xl p-4 border transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[340px] ${
            activePreviewStep === 2
              ? 'bg-[#0B1528] border-brand-goldenHour shadow-2xl ring-1 ring-brand-goldenHour/40'
              : 'bg-[#080D18]/80 border-white/10 opacity-70 hover:opacity-100 hover:border-white/20'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-brand-goldenHour uppercase tracking-wider">Step 2</span>
              <div className="w-2 h-2 rounded-full bg-brand-goldenHour" />
            </div>
            <h4 className="font-extrabold text-sm text-white leading-tight mb-1">
              Where is your Caribbean connection?
            </h4>
            <p className="text-[10px] text-brand-sandstone/60 mb-3">
              All 30+ sovereign states & territories.
            </p>

            {/* Mini map preview */}
            <div className="p-2.5 rounded-2xl bg-[#060A12] border border-white/10 text-center mb-3">
              <span className="text-3xl block">🇩🇴</span>
              <span className="text-xs font-bold text-white block mt-1">Dominican Republic</span>
              <span className="text-[10px] text-brand-goldenHour block">Santo Domingo Hub</span>
            </div>

            <div className="space-y-1.5">
              <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-[11px] text-brand-sandstone/70">
                <span className="text-[9px] text-brand-sandstone/40 block">Where do you live now?</span>
                <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                  🇺🇸 United States (Miami, FL)
                </span>
              </div>
            </div>
          </div>

          <div className="w-full py-2 rounded-xl text-center font-bold text-[11px] bg-brand-goldenHour text-slate-950 mt-3">
            Continue →
          </div>
        </div>

        {/* Screen 3: Tell us about yourself */}
        <div
          onClick={() => setActivePreviewStep(3)}
          className={`rounded-3xl p-4 border transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[340px] ${
            activePreviewStep === 3
              ? 'bg-[#0B1528] border-brand-sunriseCoral shadow-2xl ring-1 ring-brand-sunriseCoral/40'
              : 'bg-[#080D18]/80 border-white/10 opacity-70 hover:opacity-100 hover:border-white/20'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-brand-sunriseCoral uppercase tracking-wider">Step 3</span>
              <div className="w-2 h-2 rounded-full bg-brand-sunriseCoral" />
            </div>
            <h4 className="font-extrabold text-sm text-white leading-tight mb-1">
              Tell us about yourself
            </h4>
            <p className="text-[10px] text-brand-sandstone/60 mb-3">
              Live debounced @username check.
            </p>

            {/* Avatar bubble */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral p-[1px] mx-auto mb-3">
              <div className="w-full h-full rounded-2xl bg-[#090D16] flex items-center justify-center text-sm font-bold text-white">
                D
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="p-1.5 rounded-lg bg-[#060A12] border border-white/10 text-[10px]">
                <span className="text-brand-sandstone/40 block">Name:</span>
                <span className="font-semibold text-white">Daniel Williams</span>
              </div>
              <div className="p-1.5 rounded-lg bg-[#060A12] border border-emerald-500/40 text-[10px] flex items-center justify-between">
                <span className="font-semibold text-emerald-400">@danieljwilliams</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="w-full py-2 rounded-xl text-center font-bold text-[11px] bg-brand-sunriseCoral text-slate-950 mt-3">
            Continue →
          </div>
        </div>

        {/* Screen 4: What are you interested in */}
        <div
          onClick={() => setActivePreviewStep(4)}
          className={`rounded-3xl p-4 border transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[340px] ${
            activePreviewStep === 4
              ? 'bg-[#0B1528] border-cyan-400 shadow-2xl ring-1 ring-cyan-400/40'
              : 'bg-[#080D18]/80 border-white/10 opacity-70 hover:opacity-100 hover:border-white/20'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Step 4</span>
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
            </div>
            <h4 className="font-extrabold text-sm text-white leading-tight mb-1">
              What are you interested in?
            </h4>
            <p className="text-[10px] text-brand-sandstone/60 mb-2">
              High signal cultural feeds.
            </p>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: '🎵 Music', active: true },
                { label: '🍛 Food', active: true },
                { label: '🎭 Carnival', active: true },
                { label: '💻 Tech', active: true },
                { label: '💰 SpotPay', active: false },
                { label: '🏝️ Travel', active: false },
              ].map((pill, idx) => (
                <div
                  key={idx}
                  className={`p-1.5 rounded-lg border text-[10px] font-semibold text-center truncate ${
                    pill.active
                      ? 'bg-cyan-500/20 border-cyan-400 text-white'
                      : 'bg-white/5 border-white/5 text-brand-sandstone/50'
                  }`}
                >
                  {pill.label}
                </div>
              ))}
            </div>
          </div>

          <div className="w-full py-2 rounded-xl text-center font-bold text-[11px] bg-cyan-400 text-slate-950 mt-3">
            Continue →
          </div>
        </div>

        {/* Screen 5: Ready & Passport */}
        <div
          onClick={() => setActivePreviewStep(5)}
          className={`rounded-3xl p-4 border transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[340px] ${
            activePreviewStep === 5
              ? 'bg-[#0B1528] border-emerald-400 shadow-2xl ring-1 ring-emerald-400/40'
              : 'bg-[#080D18]/80 border-white/10 opacity-70 hover:opacity-100 hover:border-white/20'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Step 5</span>
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <h4 className="font-extrabold text-sm text-white leading-tight mb-1">
              Your Caribbean is Ready!
            </h4>
            <p className="text-[10px] text-brand-sandstone/60 mb-2">
              Tukubi Cultural Passport Issued.
            </p>

            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-700/20 border border-emerald-500/40 text-center space-y-1 my-2">
              <Sparkles className="w-5 h-5 text-brand-goldenHour mx-auto" />
              <p className="text-xs font-bold text-white">Passport Activated</p>
              <p className="text-[9px] text-emerald-300">SpotPay & Feed Seeded</p>
            </div>
          </div>

          <Link
            href="/signup"
            className="w-full py-2 rounded-xl text-center font-bold text-[11px] bg-gradient-to-r from-emerald-400 to-brand-caribbeanSea text-slate-950 mt-3 block"
          >
            Join Tukubi Now →
          </Link>
        </div>
      </div>
    </div>
  );
}
