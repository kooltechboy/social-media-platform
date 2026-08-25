'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Globe,
  Compass,
  ShieldCheck,
  Users,
  Video,
  Store,
  ArrowRight,
  Play,
  UserPlus,
  Lock,
} from 'lucide-react';
import { LanguageDropdown } from './LanguageDropdown';
import { SignInForm } from './SignInForm';
import { ShowcaseMoments } from './ShowcaseMoments';
import { ShowcaseDiasporaCities } from './ShowcaseDiasporaCities';
import { InteractiveOnboardingPreview } from './InteractiveOnboardingPreview';

export function AntiliaMasterGateway() {
  return (
    <div
      className="min-h-screen w-full bg-[#081020] text-brand-sandstone relative overflow-x-hidden select-none"
      style={{
        backgroundImage:
          'radial-gradient(circle at 50% 0%, rgba(0, 180, 216, 0.12) 0%, transparent 60%), radial-gradient(circle, rgba(0, 180, 216, 0.08) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 32px 32px',
      }}
    >
      {/* ── Top Atmospheric Caribbean Horizon Aura ── */}
      <div className="fixed top-0 left-0 right-0 h-[380px] bg-gradient-to-b from-[#00B4D8]/20 via-[#FFB347]/12 to-transparent pointer-events-none" />

      {/* ── 5 Atmospheric Glow Orbs (Turquoise, Sunrise Gold, Coral, Emerald, Purple) ── */}
      <div className="fixed -top-24 -left-24 w-[900px] h-[650px] rounded-full bg-[#00B4D8]/22 blur-[180px] pointer-events-none" />
      <div className="fixed -top-20 -right-24 w-[800px] h-[600px] rounded-full bg-[#FFB347]/20 blur-[190px] pointer-events-none" />
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[850px] h-[550px] rounded-full bg-[#FF7A59]/15 blur-[200px] pointer-events-none" />
      <div className="fixed -bottom-24 -left-20 w-[700px] h-[650px] rounded-full bg-[#8B5CF6]/20 blur-[190px] pointer-events-none" />
      <div className="fixed -bottom-20 -right-20 w-[650px] h-[600px] rounded-full bg-[#10B981]/18 blur-[180px] pointer-events-none" />

      {/* ── 1. Top Navigation Bar ── */}
      <header className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between border-b border-white/10 bg-[#081020]/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral p-[1.5px] shadow-xl shadow-brand-caribbeanSea/30">
            <div className="w-full h-full bg-[#0A1428] rounded-2xl flex items-center justify-center">
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-tr from-brand-caribbeanSea to-brand-goldenHour text-xl">
                A
              </span>
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-serif">
              ANTILIA
            </span>
            <span className="block text-[9px] uppercase font-extrabold tracking-[0.25em] text-brand-caribbeanSea">
              Global Caribbean Network
            </span>
          </div>
        </div>

        {/* Center Desktop Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-brand-sandstone/80">
          <Link href="/explore" className="hover:text-brand-caribbeanSea transition-colors">
            Explore
          </Link>
          <Link href="/map" className="hover:text-brand-caribbeanSea transition-colors">
            Caribbean Map
          </Link>
          <Link href="/live" className="hover:text-brand-caribbeanSea transition-colors">
            Live Shows
          </Link>
          <Link href="/podcasts" className="hover:text-brand-caribbeanSea transition-colors">
            Podcasts
          </Link>
          <Link href="/spotpay" className="hover:text-brand-caribbeanSea transition-colors">
            SpotPay
          </Link>
        </nav>

        {/* Right Top Actions */}
        <div className="flex items-center gap-3">
          <LanguageDropdown />

          <Link
            href="/signup"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-[#060A12] hover:opacity-95 transition-all shadow-lg shadow-brand-caribbeanSea/25 active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Join Antilia</span>
          </Link>
        </div>
      </header>

      {/* ── 2. Master Hero Showcase ── */}
      <section className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 lg:pt-14 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Brand & Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-caribbeanSea/15 border border-brand-caribbeanSea/35 text-brand-caribbeanSea text-xs font-bold uppercase tracking-wider backdrop-blur-xl shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" />
              <span>One Caribbean. One Community. One Digital Home.</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Your Caribbean.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral">
                  Connected.
                </span>{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-goldenHour via-brand-sunriseCoral to-pink-500">
                  Empowered.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-brand-sandstone/90 font-normal leading-relaxed max-w-xl">
                The Caribbean and its global diaspora united in one platform to connect with family & culture, create content, discover commerce, and thrive.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/signup"
                className="px-6 py-3.5 rounded-2xl font-black text-sm tracking-wide bg-gradient-to-r from-brand-sunriseCoral via-brand-goldenHour to-brand-caribbeanSea text-[#060A12] shadow-xl shadow-brand-sunriseCoral/25 hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </Link>

              <Link
                href="/explore"
                className="px-6 py-3.5 rounded-2xl font-bold text-sm text-white bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-xl transition-all flex items-center gap-2 active:scale-[0.98] shadow-sm"
              >
                <Play className="w-4 h-4 text-brand-caribbeanSea fill-current" />
                <span>Explore First</span>
              </Link>
            </div>

            {/* 4 Glass Metric Pills */}
            <div className="pt-6 border-t border-white/10">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/[0.07] border border-white/15 backdrop-blur-xl border-t-brand-caribbeanSea/40 shadow-lg">
                  <div className="flex items-center gap-1.5 text-brand-caribbeanSea mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-lg font-black text-white">59M+</span>
                  </div>
                  <p className="text-[11px] text-brand-sandstone/70 font-medium leading-tight">
                    Caribbean People & Diaspora
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.07] border border-white/15 backdrop-blur-xl border-t-brand-goldenHour/40 shadow-lg">
                  <div className="flex items-center gap-1.5 text-brand-goldenHour mb-1">
                    <Globe className="w-4 h-4" />
                    <span className="text-lg font-black text-white">200+</span>
                  </div>
                  <p className="text-[11px] text-brand-sandstone/70 font-medium leading-tight">
                    Countries Connected
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.07] border border-white/15 backdrop-blur-xl border-t-brand-sunriseCoral/40 shadow-lg">
                  <div className="flex items-center gap-1.5 text-brand-sunriseCoral mb-1">
                    <Video className="w-4 h-4" />
                    <span className="text-lg font-black text-white">10K+</span>
                  </div>
                  <p className="text-[11px] text-brand-sandstone/70 font-medium leading-tight">
                    Live & On-Demand Shows
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.07] border border-white/15 backdrop-blur-xl border-t-emerald-400/40 shadow-lg">
                  <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                    <Store className="w-4 h-4" />
                    <span className="text-lg font-black text-white">50K+</span>
                  </div>
                  <p className="text-[11px] text-brand-sandstone/70 font-medium leading-tight">
                    Businesses & Creators
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Auth Container with Ambient Caribbean Glow */}
          <div className="lg:col-span-5 relative">
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-brand-caribbeanSea/25 via-brand-goldenHour/15 to-brand-sunriseCoral/20 blur-3xl rounded-[40px] pointer-events-none" />
              <div className="relative z-10 w-full max-w-md mx-auto">
                <SignInForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Section: The Caribbean in Every Moment ── */}
      <section className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-white/10">
        <ShowcaseMoments />
      </section>

      {/* ── 4. Section: A Community Without Borders (Diaspora Hubs) ── */}
      <section className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-white/10">
        <ShowcaseDiasporaCities />
      </section>

      {/* ── 5. Section: Interactive 5-Step Onboarding Architecture Gallery ── */}
      <section className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-white/10">
        <InteractiveOnboardingPreview />
      </section>

      {/* ── 6. Master Footer ── */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-white/10 bg-[#081020]/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-brand-sandstone/60">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white font-serif">ANTILIA</span>
          <span>•</span>
          <span>&copy; {new Date().getFullYear()} Antilia Global Ecosystem. All rights reserved.</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
          <Link href="/privacy" className="hover:text-brand-caribbeanSea transition-colors">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-brand-caribbeanSea transition-colors">
            Terms of Service
          </Link>
          <span>•</span>
          <Link href="/settings/security" className="hover:text-brand-caribbeanSea transition-colors">
            Security
          </Link>
          <span>•</span>
          <Link href="/explore" className="hover:text-brand-goldenHour transition-colors font-semibold">
            Explore Platform
          </Link>
        </div>
      </footer>
    </div>
  );
}
