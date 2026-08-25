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
  Flame,
} from 'lucide-react';
import { LanguageDropdown } from './LanguageDropdown';
import { SignInForm } from './SignInForm';
import { ShowcaseMoments } from './ShowcaseMoments';
import { ShowcaseDiasporaCities } from './ShowcaseDiasporaCities';
import { InteractiveOnboardingPreview } from './InteractiveOnboardingPreview';

export function AntiliaMasterGateway() {
  return (
    <div className="min-h-screen w-full bg-[#081020] text-brand-sandstone relative overflow-x-hidden select-none">
      {/* ── 1. High-Resolution Grenada Carnival / Spicemas Photographic Layer ── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Authentic Caribbean Carnival Mas Imagery */}
        <div
          className="absolute inset-0 bg-cover bg-center sm:bg-[center_top] bg-no-repeat transition-all duration-1000 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1551972251-12070d63502a?auto=format&fit=crop&w=2600&q=92')`,
          }}
        />

        {/* Sophisticated Multi-Stop Caribbean Atmospheric Gradient Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(135deg, rgba(8, 16, 32, 0.88) 0%, rgba(8, 16, 32, 0.72) 45%, rgba(13, 24, 48, 0.85) 100%),
              radial-gradient(circle at 75% 30%, rgba(255, 122, 89, 0.28) 0%, transparent 60%),
              radial-gradient(circle at 20% 20%, rgba(0, 180, 216, 0.32) 0%, transparent 55%),
              linear-gradient(to bottom, rgba(8, 16, 32, 0.4) 0%, rgba(8, 16, 32, 0.95) 90%, #081020 100%)
            `,
          }}
        />

        {/* Subtle Tech Dot Grid Overlay */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(0, 180, 216, 0.15) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* ── 2. Top Navigation Bar ── */}
      <header className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between border-b border-white/10 bg-[#081020]/75 backdrop-blur-2xl">
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
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-brand-sandstone/85">
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

      {/* ── 3. Master Hero Showcase ── */}
      <section className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 lg:pt-14 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Brand & Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-caribbeanSea/20 border border-brand-caribbeanSea/40 text-brand-caribbeanSea text-xs font-bold uppercase tracking-wider backdrop-blur-xl shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" />
                <span>One Caribbean. One Community. One Digital Home.</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-sunriseCoral/20 border border-brand-sunriseCoral/35 text-brand-sunriseCoral text-[11px] font-bold backdrop-blur-xl">
                <span>🇬🇩</span>
                <span>Grenada Spicemas Atmosphere</span>
              </div>
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

              <p className="text-base sm:text-lg text-brand-sandstone/95 font-medium leading-relaxed max-w-xl drop-shadow-sm">
                The Caribbean and its global diaspora united in one platform to connect with family & culture, create content, discover commerce, and thrive.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/signup"
                className="px-6 py-3.5 rounded-2xl font-black text-sm tracking-wide bg-gradient-to-r from-brand-sunriseCoral via-brand-goldenHour to-brand-caribbeanSea text-[#060A12] shadow-xl shadow-brand-sunriseCoral/30 hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </Link>

              <Link
                href="/explore"
                className="px-6 py-3.5 rounded-2xl font-bold text-sm text-white bg-white/15 hover:bg-white/20 border border-white/25 backdrop-blur-xl transition-all flex items-center gap-2 active:scale-[0.98] shadow-md"
              >
                <Play className="w-4 h-4 text-brand-caribbeanSea fill-current" />
                <span>Explore First</span>
              </Link>
            </div>

            {/* 4 Glass Metric Pills */}
            <div className="pt-6 border-t border-white/15">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#0C1527]/80 border border-white/15 backdrop-blur-2xl border-t-brand-caribbeanSea/50 shadow-xl">
                  <div className="flex items-center gap-1.5 text-brand-caribbeanSea mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-lg font-black text-white">59M+</span>
                  </div>
                  <p className="text-[11px] text-brand-sandstone/80 font-medium leading-tight">
                    Caribbean People & Diaspora
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0C1527]/80 border border-white/15 backdrop-blur-2xl border-t-brand-goldenHour/50 shadow-xl">
                  <div className="flex items-center gap-1.5 text-brand-goldenHour mb-1">
                    <Globe className="w-4 h-4" />
                    <span className="text-lg font-black text-white">200+</span>
                  </div>
                  <p className="text-[11px] text-brand-sandstone/80 font-medium leading-tight">
                    Countries Connected
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0C1527]/80 border border-white/15 backdrop-blur-2xl border-t-brand-sunriseCoral/50 shadow-xl">
                  <div className="flex items-center gap-1.5 text-brand-sunriseCoral mb-1">
                    <Video className="w-4 h-4" />
                    <span className="text-lg font-black text-white">10K+</span>
                  </div>
                  <p className="text-[11px] text-brand-sandstone/80 font-medium leading-tight">
                    Live & On-Demand Shows
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0C1527]/80 border border-white/15 backdrop-blur-2xl border-t-emerald-400/50 shadow-xl">
                  <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                    <Store className="w-4 h-4" />
                    <span className="text-lg font-black text-white">50K+</span>
                  </div>
                  <p className="text-[11px] text-brand-sandstone/80 font-medium leading-tight">
                    Businesses & Creators
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Auth Container with Ambient Caribbean Glow */}
          <div className="lg:col-span-5 relative">
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-brand-caribbeanSea/30 via-brand-goldenHour/20 to-brand-sunriseCoral/25 blur-3xl rounded-[40px] pointer-events-none" />
              <div className="relative z-10 w-full max-w-md mx-auto">
                <SignInForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Section: The Caribbean in Every Moment ── */}
      <section className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-white/10 bg-[#081020]/60 backdrop-blur-md">
        <ShowcaseMoments />
      </section>

      {/* ── 5. Section: A Community Without Borders (Diaspora Hubs) ── */}
      <section className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-white/10 bg-[#081020]/60 backdrop-blur-md">
        <ShowcaseDiasporaCities />
      </section>

      {/* ── 6. Section: Interactive 5-Step Onboarding Architecture Gallery ── */}
      <section className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-white/10 bg-[#081020]/60 backdrop-blur-md">
        <InteractiveOnboardingPreview />
      </section>

      {/* ── 7. Master Footer ── */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-white/10 bg-[#081020]/90 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-brand-sandstone/60">
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
