'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth-provider';
import {
  Sparkles,
  UserPlus,
  Flame,
} from 'lucide-react';
import { LanguageDropdown } from './LanguageDropdown';
import { SignInForm } from './SignInForm';
import { ShowcaseMoments } from './ShowcaseMoments';
import { TukubiLogo } from '../brand/tukubi-logo';
import { useTranslation } from '@caribbean/localization';

export function TukubiMasterGateway() {
  const { isAuthenticated, loading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, loading, router]);

  return (
    <div className="min-h-screen w-full bg-transparent text-brand-sandstone relative overflow-x-hidden select-none">
      {/* ── 1. Top Navigation Bar ── */}
      <header className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between border-b border-white/10 glass rounded-b-2xl mt-0">
        <TukubiLogo variant="horizontal" size="sm" href="/" priority />

        {/* Center Desktop Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-brand-sandstone/90">
          <Link href="/explore" className="hover:text-brand-caribbeanSea transition-colors">
            {t('nav.explore')}
          </Link>
          <Link href="/map" className="hover:text-brand-caribbeanSea transition-colors">
            {t('nav.map')}
          </Link>
          <Link href="/live" className="hover:text-brand-caribbeanSea transition-colors">
            {t('nav.live_streams')}
          </Link>
          <Link href="/podcasts" className="hover:text-brand-caribbeanSea transition-colors">
            {t('nav.podcasts')}
          </Link>
          <Link href="/financial-center" className="hover:text-brand-caribbeanSea transition-colors">
            {t('nav.financial_center')}
          </Link>
        </nav>

        {/* Right Top Actions */}
        <div className="flex items-center gap-3">
          <LanguageDropdown />

          <Link
            href="/signup"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-brand-caribbeanTeal to-brand-caribbeanSea text-[#060A12] hover:opacity-95 transition-all shadow-lg shadow-brand-caribbeanSea/30 active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{t('gateway.join_tukubi')}</span>
          </Link>
        </div>
      </header>

      {/* ── 2. Master Hero Showcase ── */}
      <section className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 lg:pt-14 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Brand & Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0B1B3B]/85 border border-brand-caribbeanTeal/30 text-brand-porcelain text-xs font-semibold tracking-[0.04em] backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-brand-caribbeanTeal" />
                <span>{t('gateway.tagline')}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.10] text-brand-goldenHour text-[11px] font-semibold backdrop-blur-md">
                <Flame className="w-3.5 h-3.5 text-brand-goldenHour" />
                <span>{t('gateway.spotlight')}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl font-bold text-white tracking-[-0.025em] leading-[1.08]">
                {t('gateway.hero_title_1')}{' '}
                <span className="tk-text-gradient">
                  {t('gateway.hero_connected')}
                </span>{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-caribbeanSea to-violet-400">
                  {t('gateway.hero_empowered')}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-brand-mist leading-relaxed max-w-xl">
                {t('gateway.hero_subtitle')}
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/signup"
                className="tk-btn-primary px-6 py-3.5 rounded-xl text-sm flex items-center gap-2 min-h-[46px]"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t('gateway.create_account')}</span>
              </Link>
            </div>

            <div className="pt-6 border-t border-white/[0.08]">
              <p className="text-xs text-brand-mist leading-relaxed max-w-xl">
                Discover communities, creators, culture, and commerce as real members and businesses join the network.
              </p>
            </div>
          </div>

          {/* Right Column: Floating Auth Container */}
          <div className="lg:col-span-5 relative">
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-brand-caribbeanTeal/15 via-brand-caribbeanSea/12 to-transparent blur-3xl rounded-[40px] pointer-events-none" />
              <div className="relative z-10 w-full max-w-md mx-auto">
                <SignInForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Section: The Caribbean in Every Moment ── */}
      <section className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-white/10 glass rounded-2xl mb-8">
        <ShowcaseMoments />
      </section>

      {/* ── 4. Master Footer ── */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-white/10 glass rounded-t-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-brand-sandstone/70">
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
