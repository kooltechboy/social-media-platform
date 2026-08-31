'use client';

import React from 'react';
import Link from 'next/link';
import { CaribbeanMapCanvas } from './CaribbeanMapCanvas';
import { RotatingTaglines } from './RotatingTaglines';
import { Sparkles, Globe, Compass, ShieldCheck } from 'lucide-react';
import { TukubiLogo } from '../brand/tukubi-logo';

interface GatewayShellProps {
  children: React.ReactNode;
  activeIslandIso?: string;
}

export function GatewayShell({ children, activeIslandIso }: GatewayShellProps) {
  return (
    <div
      className="min-h-screen w-full flex flex-col lg:flex-row bg-[#081020] text-brand-sandstone relative overflow-hidden selection:bg-[#FF7A59]/30"
      style={{
        backgroundImage:
          'radial-gradient(circle at 50% 0%, rgba(0, 180, 216, 0.12) 0%, transparent 60%), radial-gradient(circle, rgba(0, 180, 216, 0.08) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 32px 32px',
      }}
    >
      {/* ── Top Atmospheric Horizon Glow ── */}
      <div className="fixed top-0 left-0 right-0 h-[320px] bg-gradient-to-b from-[#00B4D8]/18 via-[#FFB347]/10 to-transparent pointer-events-none z-0" />
      <div className="fixed -top-20 -left-20 w-[800px] h-[550px] rounded-full bg-[#00B4D8]/20 blur-[180px] pointer-events-none z-0" />
      <div className="fixed -bottom-20 -right-20 w-[700px] h-[550px] rounded-full bg-[#FF7A59]/15 blur-[180px] pointer-events-none z-0" />

      {/* ── LEFT PANEL: Desktop Brand, Story & Glowing Caribbean Map ── */}
      <div className="hidden lg:flex lg:flex-1 relative flex-col justify-between p-10 xl:p-14 overflow-hidden border-r border-white/10 select-none z-10">
        {/* Full Interactive Background Map */}
        <CaribbeanMapCanvas highlightIso={activeIslandIso} />

        {/* Top Header Wordmark & Trust Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <TukubiLogo variant="horizontal" size="md" href="/" priority />

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-xs font-semibold text-brand-sandstone/90 shadow-lg">
            <ShieldCheck className="w-4 h-4 text-brand-caribbeanSea" />
            <span>NASA-Grade Infrastructure</span>
          </div>
        </div>

        {/* Bottom Hero Pitch & Tagline */}
        <div className="relative z-10 max-w-xl space-y-5">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-caribbeanSea/10 border border-brand-caribbeanSea/30 text-brand-caribbeanSea text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" />
              <span>The Caribbean Connected.</span>
            </div>

            <h2 className="text-4xl xl:text-5xl font-black text-white tracking-tight leading-[1.12]">
              One Caribbean.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral">
                One Community.
              </span>{' '}
              One Digital Home.
            </h2>

            <p className="text-sm xl:text-base text-brand-sandstone/80 font-normal leading-relaxed">
              Connect with your people, culture, creators, businesses, music, and opportunities—wherever you are in the world.
            </p>
          </div>

          {/* Rotating Taglines */}
          <RotatingTaglines />

          {/* Diaspora Global Hubs Ticker */}
          <div className="pt-4 border-t border-white/10">
            <p className="text-[11px] font-bold text-brand-goldenHour/90 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-brand-caribbeanSea" />
              Live Cultural Signals & Diaspora Network
            </p>
            <div className="overflow-hidden whitespace-nowrap">
              <p className="text-xs text-brand-sandstone/60 font-medium tracking-widest uppercase animate-pulse">
                KINGSTON • SANTO DOMINGO • PORT OF SPAIN • BRIDGETOWN • HAVANA • SAN JUAN • NASSAU • MIAMI • TORONTO • LONDON • AMSTERDAM • NEW YORK • PARIS • ROTTERDAM • PANAMA
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Auth Card Surface ── */}
      <div className="flex-1 lg:max-w-[560px] xl:max-w-[620px] flex items-center justify-center p-4 sm:p-8 lg:p-12 relative z-10">
        {/* Subtle mobile background styling */}
        <div className="absolute inset-0 lg:hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-[#060A12] via-[#090F1C] to-[#060A12]" />
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-brand-caribbeanSea/10 blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-brand-sunriseCoral/10 blur-[100px]" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Top Brand Wordmark */}
          <div className="lg:hidden text-center mb-6 flex justify-center">
            <TukubiLogo variant="horizontal" size="md" href="/" priority />
          </div>

          {/* Children: Auth Card */}
          {children}

          {/* Footer Privacy & Terms Guarantee */}
          <div className="mt-8 text-center text-xs text-brand-sandstone/40 space-y-2">
            <p>
              Caribbean identity is optional and private by default. You control all visibility.
            </p>
            <div className="flex justify-center gap-4 text-[11px] text-brand-sandstone/50">
              <Link href="/privacy" className="hover:text-brand-caribbeanSea transition-colors">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-brand-caribbeanSea transition-colors">
                Terms of Service
              </Link>
              <span>•</span>
              <Link href="/explore" className="hover:text-brand-goldenHour transition-colors font-semibold">
                Explore First →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
