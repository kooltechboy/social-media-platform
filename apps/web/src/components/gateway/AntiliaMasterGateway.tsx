'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth-provider';
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
  Camera,
} from 'lucide-react';
import { LanguageDropdown } from './LanguageDropdown';
import { SignInForm } from './SignInForm';
import { ShowcaseMoments } from './ShowcaseMoments';
import { ShowcaseDiasporaCities } from './ShowcaseDiasporaCities';
import { InteractiveOnboardingPreview } from './InteractiveOnboardingPreview';

export interface CarnivalScene {
  id: string;
  name: string;
  badge: string;
  title: string;
  url: string;
  overlayGradient: string;
}

export const CARNIVAL_SCENES: CarnivalScene[] = [
  {
    id: 'grenada-spicemas',
    name: '🇬🇩 Grenada Spicemas',
    badge: 'Grenada Spicemas Official Edition',
    title: 'Spice Isle Carnival • St. George’s, Grenada',
    // Sunlit Caribbean carnival dancers in vibrant gold, scarlet, and turquoise feathered costume
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=2600&q=95',
    overlayGradient: `linear-gradient(to bottom,
      rgba(8, 16, 32, 0.55) 0%,
      rgba(8, 16, 32, 0.15) 25%,
      rgba(8, 16, 32, 0.20) 60%,
      rgba(8, 16, 32, 0.90) 100%
    )`,
  },
  {
    id: 'st-georges-grenada',
    name: '🌴 St. George’s Harbor, Grenada',
    badge: 'Pure Grenada • Spice Isle Vista',
    title: 'St. George’s Carenage & Grand Anse Shore',
    // Crystal clear turquoise Caribbean waters and lush hillside
    url: 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?auto=format&fit=crop&w=2600&q=95',
    overlayGradient: `linear-gradient(to bottom,
      rgba(6, 24, 38, 0.50) 0%,
      rgba(0, 0, 0, 0.10) 30%,
      rgba(0, 0, 0, 0.20) 65%,
      rgba(8, 16, 32, 0.90) 100%
    )`,
  },
  {
    id: 'trinidad-carnival',
    name: '🇹🇹 Trinidad Carnival Mas',
    badge: 'The Greatest Show on Earth',
    title: 'Port of Spain • Soca Parade of the Bands',
    // Confetti, dazzling feathers, and euphoria
    url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=2600&q=95',
    overlayGradient: `linear-gradient(to bottom,
      rgba(24, 10, 36, 0.55) 0%,
      rgba(0, 0, 0, 0.15) 30%,
      rgba(0, 0, 0, 0.20) 65%,
      rgba(8, 16, 32, 0.90) 100%
    )`,
  },
  {
    id: 'barbados-cropover',
    name: '🇧🇧 Barbados Crop Over',
    badge: 'Grand Kadooment Day',
    title: 'Bridgetown • Caribbean Summer Vibes',
    // Sunset shore and tropical island warmth
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2600&q=95',
    overlayGradient: `linear-gradient(to bottom,
      rgba(40, 16, 10, 0.50) 0%,
      rgba(0, 0, 0, 0.10) 30%,
      rgba(0, 0, 0, 0.20) 65%,
      rgba(8, 16, 32, 0.90) 100%
    )`,
  },
];

export function AntiliaMasterGateway() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const activeScene = CARNIVAL_SCENES[activeSceneIndex];

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, loading, router]);

  return (
    <div className="min-h-screen w-full bg-[#081020] text-brand-sandstone relative overflow-x-hidden select-none">
      {/* ── 1. High-Resolution Grenada Carnival / Spicemas Photographic Layer ── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Crisp Full-Resolution Carnival Photograph */}
        <div
          key={activeScene.id}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 transform scale-100 animate-fadeIn"
          style={{
            backgroundImage: `url('${activeScene.url}')`,
          }}
        />

        {/* Clean, light gradient overlay: lets the photo remain crisp, bright & colorful */}
        <div
          className="absolute inset-0 transition-all duration-700"
          style={{
            background: activeScene.overlayGradient,
          }}
        />

        {/* Subtle dot matrix grid */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(0, 180, 216, 0.2) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* ── 2. Floating Carnival Atmosphere Switcher (Bottom Right) ── */}
      <div className="fixed bottom-6 right-6 z-40 hidden md:flex items-center gap-1.5 bg-[#081020]/80 backdrop-blur-2xl border border-white/15 px-3 py-1.5 rounded-full shadow-2xl">
        <Camera className="w-3.5 h-3.5 text-brand-caribbeanSea mr-1 flex-shrink-0" />
        <span className="text-[10px] font-bold text-brand-sandstone/50 uppercase tracking-wider mr-1">
          Backdrop:
        </span>
        {CARNIVAL_SCENES.map((scene, idx) => {
          const isCurrent = activeSceneIndex === idx;
          return (
            <button
              key={scene.id}
              type="button"
              onClick={() => setActiveSceneIndex(idx)}
              className={`text-[11px] font-bold px-3 py-1 rounded-full transition-all duration-200 ${
                isCurrent
                  ? 'bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-[#060A12] shadow-md shadow-brand-caribbeanSea/30 font-black'
                  : 'text-brand-sandstone/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {scene.name}
            </button>
          );
        })}
      </div>

      {/* ── 3. Top Navigation Bar ── */}
      <header className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between border-b border-white/15 bg-[#081020]/75 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral p-[1.5px] shadow-xl shadow-brand-caribbeanSea/35">
            <div className="w-full h-full bg-[#0A1428] rounded-2xl flex items-center justify-center">
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-tr from-brand-caribbeanSea to-brand-goldenHour text-xl">
                T
              </span>
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-serif">
              TUKUBI
            </span>
            <span className="block text-[9px] uppercase font-extrabold tracking-[0.25em] text-brand-caribbeanSea">
              Global Caribbean Network
            </span>
          </div>
        </div>

        {/* Center Desktop Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-brand-sandstone/90">
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
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-[#060A12] hover:opacity-95 transition-all shadow-lg shadow-brand-caribbeanSea/30 active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Join Tukubi</span>
          </Link>
        </div>
      </header>

      {/* ── 4. Master Hero Showcase ── */}
      <section className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 lg:pt-14 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Brand & Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-caribbeanSea/25 border border-brand-caribbeanSea/45 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-2xl shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" />
                <span>One Caribbean. One Community. One Digital Home.</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-sunriseCoral/25 border border-brand-sunriseCoral/40 text-brand-sunriseCoral text-[11px] font-extrabold backdrop-blur-2xl shadow-md">
                <Flame className="w-3.5 h-3.5 text-brand-goldenHour fill-current" />
                <span>{activeScene.badge}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black text-white tracking-tight leading-[1.1] drop-shadow-md">
                Your Caribbean.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral">
                  Connected.
                </span>{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-goldenHour via-brand-sunriseCoral to-pink-500">
                  Empowered.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-white/95 font-medium leading-relaxed max-w-xl drop-shadow-md">
                The Caribbean and its global diaspora united in one platform to connect with family & culture, create content, discover commerce, and thrive.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/signup"
                className="px-6 py-3.5 rounded-2xl font-black text-sm tracking-wide bg-gradient-to-r from-brand-sunriseCoral via-brand-goldenHour to-brand-caribbeanSea text-[#060A12] shadow-2xl shadow-brand-sunriseCoral/35 hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </Link>

              <Link
                href="/explore"
                className="px-6 py-3.5 rounded-2xl font-bold text-sm text-white bg-[#081020]/75 hover:bg-[#081020]/90 border border-white/30 backdrop-blur-2xl transition-all flex items-center gap-2 active:scale-[0.98] shadow-xl"
              >
                <Play className="w-4 h-4 text-brand-caribbeanSea fill-current" />
                <span>Explore First</span>
              </Link>
            </div>

            {/* 4 Glass Metric Pills */}
            <div className="pt-6 border-t border-white/20">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#081020]/80 border border-white/20 backdrop-blur-2xl border-t-brand-caribbeanSea shadow-2xl">
                  <div className="flex items-center gap-1.5 text-brand-caribbeanSea mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-lg font-black text-white">59M+</span>
                  </div>
                  <p className="text-[11px] text-brand-sandstone/90 font-medium leading-tight">
                    Caribbean People & Diaspora
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#081020]/80 border border-white/20 backdrop-blur-2xl border-t-brand-goldenHour shadow-2xl">
                  <div className="flex items-center gap-1.5 text-brand-goldenHour mb-1">
                    <Globe className="w-4 h-4" />
                    <span className="text-lg font-black text-white">200+</span>
                  </div>
                  <p className="text-[11px] text-brand-sandstone/90 font-medium leading-tight">
                    Countries Connected
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#081020]/80 border border-white/20 backdrop-blur-2xl border-t-brand-sunriseCoral shadow-2xl">
                  <div className="flex items-center gap-1.5 text-brand-sunriseCoral mb-1">
                    <Video className="w-4 h-4" />
                    <span className="text-lg font-black text-white">10K+</span>
                  </div>
                  <p className="text-[11px] text-brand-sandstone/90 font-medium leading-tight">
                    Live & On-Demand Shows
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#081020]/80 border border-white/20 backdrop-blur-2xl border-t-emerald-400 shadow-2xl">
                  <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                    <Store className="w-4 h-4" />
                    <span className="text-lg font-black text-white">50K+</span>
                  </div>
                  <p className="text-[11px] text-brand-sandstone/90 font-medium leading-tight">
                    Businesses & Creators
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Auth Container */}
          <div className="lg:col-span-5 relative">
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-brand-caribbeanSea/35 via-brand-goldenHour/25 to-brand-sunriseCoral/30 blur-3xl rounded-[40px] pointer-events-none" />
              <div className="relative z-10 w-full max-w-md mx-auto">
                <SignInForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Section: The Caribbean in Every Moment ── */}
      <section className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-white/15 bg-[#081020]/80 backdrop-blur-2xl">
        <ShowcaseMoments />
      </section>

      {/* ── 6. Section: A Community Without Borders (Diaspora Hubs) ── */}
      <section className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-white/15 bg-[#081020]/80 backdrop-blur-2xl">
        <ShowcaseDiasporaCities />
      </section>

      {/* ── 7. Section: Interactive 5-Step Onboarding Architecture Gallery ── */}
      <section className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-white/15 bg-[#081020]/80 backdrop-blur-2xl">
        <InteractiveOnboardingPreview />
      </section>

      {/* ── 8. Master Footer ── */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-white/15 bg-[#081020]/95 backdrop-blur-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-brand-sandstone/70">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white font-serif">TUKUBI</span>
          <span>•</span>
          <span>&copy; {new Date().getFullYear()} TUKUBI Caribbean Digital Ecosystem. All rights reserved.</span>
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
