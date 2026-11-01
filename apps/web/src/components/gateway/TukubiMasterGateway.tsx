'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../auth-provider';
import { sanitizeRedirectUrl } from '../../lib/auth/redirect-utils';
import {
  Sparkles,
  UserPlus,
  ShieldCheck,
  Music,
  Compass,
} from 'lucide-react';
import { LanguageDropdown } from './LanguageDropdown';
import { SignInForm } from './SignInForm';
import { TukubiLogo } from '../brand/tukubi-logo';
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
    <div className="min-h-screen w-full bg-[#070D1A] text-brand-sandstone relative flex flex-col justify-between selection:bg-brand-caribbeanSea/30 overflow-x-hidden">
      {/* ── Background Atmospheric Scrims & Glows ── */}
      <div className="fixed top-0 left-0 right-0 h-[380px] bg-gradient-to-b from-[#0EA5E9]/12 via-[#F4AE45]/6 to-transparent pointer-events-none z-0" />
      <div className="fixed -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-[#0EA5E9]/15 blur-[160px] pointer-events-none z-0" />
      <div className="fixed -bottom-32 -right-32 w-[600px] h-[600px] rounded-full bg-[#8B5CF6]/12 blur-[160px] pointer-events-none z-0" />

      {/* ── 1. Top Navigation Bar ── */}
      <header className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between border-b border-white/10 glass rounded-b-2xl mt-0">
        <TukubiLogo variant="horizontal" size="sm" href="/" priority />

        {/* Right Top Actions */}
        <div className="flex items-center gap-3">
          <LanguageDropdown />

          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-caribbeanTeal to-brand-caribbeanSea text-[#060A12] hover:opacity-95 transition-all shadow-lg shadow-brand-caribbeanSea/30 active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{t('gateway.create_account')}</span>
          </Link>
        </div>
      </header>

      {/* ── 2. Focused Authentication Gateway (Facebook/Instagram Style) ── */}
      <main className="relative z-20 flex-1 flex items-center justify-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Brand & Value Proposition */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0B1B3B]/85 border border-brand-caribbeanTeal/30 text-brand-porcelain text-xs font-semibold tracking-[0.04em] backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-brand-caribbeanTeal" />
              <span>Born in the Caribbean. Built for the World.</span>
            </div>

            <div className="space-y-3">
              <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl font-extrabold text-white tracking-[-0.025em] leading-[1.08]">
                The Caribbean<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-caribbeanTeal via-brand-caribbeanSea to-violet-400">
                  Connected.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-brand-mist leading-relaxed max-w-lg mx-auto lg:mx-0">
                Connect with Caribbean people, culture, music, businesses, and creators across the islands and the global diaspora.
              </p>
            </div>

            {/* Value Markers */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 text-xs text-brand-sandstone/80">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-brand-caribbeanSea" />
                <span>30+ Islands & Territories</span>
              </div>
              <span className="hidden sm:inline text-white/20">•</span>
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-brand-caribbeanTeal" />
                <span>Authentic Stems & Sounds</span>
              </div>
              <span className="hidden sm:inline text-white/20">•</span>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Sovereign Privacy</span>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Auth Card (SignInForm) */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md">
              <div className="absolute -inset-4 bg-gradient-to-br from-brand-caribbeanTeal/20 via-brand-caribbeanSea/15 to-violet-600/10 blur-2xl rounded-[40px] pointer-events-none" />
              <div className="relative z-10 w-full">
                <SignInForm />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── 3. Clean Legal & Safety Footer ── */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-white/10 glass rounded-t-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-brand-sandstone/70">
        <div className="flex items-center gap-3">
          <TukubiLogo variant="symbol" size="xs" href="/" />
          <span className="font-bold text-white font-display">TUKUBI</span>
          <span>•</span>
          <span>&copy; {new Date().getFullYear()} TUKUBI. The Caribbean Connected. All rights reserved.</span>
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
          <Link href="/safety" className="hover:text-brand-caribbeanSea transition-colors">
            Safety
          </Link>
          <span>•</span>
          <Link href="/help" className="hover:text-brand-caribbeanSea transition-colors">
            Help Center
          </Link>
          <span>•</span>
          <Link href="/learn" className="hover:text-brand-caribbeanSea transition-colors">
            Learn More
          </Link>
        </div>
      </footer>
    </div>
  );
}
