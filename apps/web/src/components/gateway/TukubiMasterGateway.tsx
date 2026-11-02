'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../auth-provider';
import { sanitizeRedirectUrl } from '../../lib/auth/redirect-utils';
import {
  UserPlus,
  ShieldCheck,
  Music,
  MapPin,
  Palmtree,
} from 'lucide-react';
import { LanguageDropdown } from './LanguageDropdown';
import { SignInForm } from './SignInForm';
import { TukubiLogo } from '../brand/tukubi-logo';
import { CaribbeanAtmosphere } from './CaribbeanAtmosphere';
import { useTranslation } from '@caribbean/localization';

export function TukubiMasterGateway() {
  const { isAuthenticated, loading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      const rawNext = searchParams.get('next') || searchParams.get('redirect');
      const safeNext = sanitizeRedirectUrl(rawNext);
      router.replace(safeNext);
    }
  }, [isAuthenticated, loading, router, searchParams]);

  return (
    <div className="min-h-screen w-full bg-[#050B14] text-slate-100 relative flex flex-col justify-between selection:bg-[#00C2A8]/30 overflow-x-hidden">
      {/* ── 1. Caribbean Atmosphere (Atmospheric Canvas, Constellation Archipelago, Wave Ribbons) ── */}
      <CaribbeanAtmosphere />

      {/* ── 2. Top Navigation Bar (Floating Glassmorphic Container) ── */}
      <header className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="w-full px-5 py-3 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-cyan-400/20 shadow-lg shadow-black/40 flex items-center justify-between">
          {/* Left Brand Lockup matching the mockup */}
          <Link href="/" className="inline-flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C2A8] rounded-xl group">
            <TukubiLogo variant="symbol" size="sm" href={null} priority />
            <div className="h-6 w-[1px] bg-white/20 hidden sm:block" />
            <div className="flex flex-col leading-tight text-left">
              <span className="font-display text-lg sm:text-xl font-extrabold text-white tracking-wider group-hover:text-cyan-200 transition-colors">
                TUKUBI
              </span>
              <span className="hidden sm:inline text-[10.5px] font-medium text-slate-300">
                The Caribbean Connected.
              </span>
            </div>
          </Link>

          {/* Right Top Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            <LanguageDropdown />

            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-gradient-to-r from-[#00C2A8] via-[#00D2B8] to-[#00E5C9] text-[#06101E] hover:brightness-110 transition-all shadow-[0_0_20px_rgba(0,194,168,0.4)] active:scale-95"
            >
              <UserPlus className="w-4 h-4 stroke-[2.2]" />
              <span>{t('gateway.create_account') || 'Create your account'}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── 3. Main Hero & Authentication Gateway ── */}
      <main className="relative z-20 flex-1 flex items-center justify-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Brand & Value Proposition */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            {/* Palm Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0A1728]/85 border border-cyan-400/35 text-white text-xs sm:text-sm font-medium shadow-lg shadow-black/40 backdrop-blur-md">
              <Palmtree className="w-4 h-4 text-[#00E5C9]" />
              <span>Born in the Caribbean. Built for the World.</span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="font-serif text-4xl sm:text-5xl xl:text-6xl font-bold text-white tracking-tight leading-[1.08]">
                The Caribbean<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5C9] via-[#00C2A8] to-[#38BDF8]">
                  Connected.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-lg mx-auto lg:mx-0 font-normal">
                Connect with Caribbean people, culture, music, businesses, and creators across the islands and the global diaspora.
              </p>
            </div>

            {/* 3 Value Markers */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-5 text-xs sm:text-sm text-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-[#00E5C9] shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium">30+ Islands & Territories</span>
              </div>

              <span className="hidden sm:inline w-[1px] h-4 bg-white/20" />

              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-[#00E5C9] shrink-0">
                  <Music className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium">Authentic Stems & Sounds</span>
              </div>

              <span className="hidden sm:inline w-[1px] h-4 bg-white/20" />

              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-[#00E5C9] shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium">Sovereign Privacy</span>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Auth Card (SignInForm) */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md">
              {/* Radial Cyan Glow behind the card */}
              <div className="absolute -inset-4 bg-gradient-to-br from-[#00C2A8]/20 via-[#0EA5E9]/15 to-[#8B5CF6]/10 blur-2xl rounded-[40px] pointer-events-none" />
              <div className="relative z-10 w-full">
                <SignInForm />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── 4. Clean Legal & Safety Footer (Floating Glassmorphic Container) ── */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 pt-2">
        <div className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-cyan-400/15 shadow-lg shadow-black/40 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <TukubiLogo variant="symbol" size="xs" href="/" />
            <span className="font-bold text-white tracking-wide">TUKUBI</span>
            <span className="text-white/30">|</span>
            <span>&copy; {new Date().getFullYear()} TUKUBI. The Caribbean Connected. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px] text-slate-300">
            <Link href="/privacy" className="hover:text-[#00E5C9] transition-colors">
              Privacy Policy
            </Link>
            <span className="text-white/20">•</span>
            <Link href="/terms" className="hover:text-[#00E5C9] transition-colors">
              Terms of Service
            </Link>
            <span className="text-white/20">•</span>
            <Link href="/safety" className="hover:text-[#00E5C9] transition-colors">
              Safety
            </Link>
            <span className="text-white/20">•</span>
            <Link href="/help" className="hover:text-[#00E5C9] transition-colors">
              Help Center
            </Link>
            <span className="text-white/20">•</span>
            <Link href="/learn" className="hover:text-[#00E5C9] transition-colors">
              Learn More
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
