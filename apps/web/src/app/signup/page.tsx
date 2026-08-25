'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Palette, Store, Building2, Mic, Users, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { getSignupSession, saveSignupSession, type AccountIntent } from '../../lib/auth/signup-session';

interface IntentOption {
  id: AccountIntent;
  title: string;
  desc: string;
  icon: React.ReactNode;
  badge?: string;
}

const INTENTS: IntentOption[] = [
  {
    id: 'personal',
    title: 'Personal',
    desc: 'Connect with family, Caribbean culture & global diaspora',
    icon: <User className="w-5 h-5 text-brand-caribbeanSea" />,
  },
  {
    id: 'creator',
    title: 'Creator / Artist',
    desc: 'Publish music, video & monetize via SpotPay ledger',
    icon: <Palette className="w-5 h-5 text-brand-sunriseCoral" />,
    badge: 'Monetize',
  },
  {
    id: 'business',
    title: 'Business & Store',
    desc: 'Grow your enterprise, reach local and diaspora clients',
    icon: <Store className="w-5 h-5 text-brand-goldenHour" />,
  },
  {
    id: 'organization',
    title: 'Organization / NGO',
    desc: 'Institutions, embassies, associations & foundations',
    icon: <Building2 className="w-5 h-5 text-cyan-400" />,
  },
  {
    id: 'media',
    title: 'Media & Podcast',
    desc: 'Live streams, podcast networks & digital publications',
    icon: <Mic className="w-5 h-5 text-purple-400" />,
  },
  {
    id: 'community',
    title: 'Community Hub',
    desc: 'Island associations, relief networks & youth programs',
    icon: <Users className="w-5 h-5 text-pink-400" />,
  },
  {
    id: 'seller',
    title: 'Marketplace Seller',
    desc: 'Sell artisan goods, culinary spices, fashion & crafts',
    icon: <ShoppingBag className="w-5 h-5 text-emerald-400" />,
    badge: 'Storefront',
  },
];

export default function SignupIntentPage() {
  const router = useRouter();
  const [selectedIntent, setSelectedIntent] = useState<AccountIntent>('personal');

  useEffect(() => {
    const session = getSignupSession();
    if (session.intent) {
      setSelectedIntent(session.intent);
    }
  }, []);

  const handleContinue = () => {
    saveSignupSession({ intent: selectedIntent });
    router.push('/signup/caribbean');
  };

  return (
    <div
      className="min-h-screen w-full bg-[#081020] flex flex-col text-brand-sandstone relative overflow-x-hidden selection:bg-[#FF7A59]/30"
      style={{
        backgroundImage:
          'radial-gradient(circle at 50% 0%, rgba(0, 180, 216, 0.12) 0%, transparent 60%), radial-gradient(circle, rgba(0, 180, 216, 0.06) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 32px 32px',
      }}
    >
      {/* Ambient glows */}
      <div className="fixed top-1/4 left-1/4 w-[600px] h-[400px] bg-brand-caribbeanSea/15 blur-[160px] rounded-full pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[400px] bg-brand-sunriseCoral/12 blur-[150px] rounded-full pointer-events-none" />

      {/* Top brand bar */}
      <header className="flex items-center justify-between px-6 sm:px-12 py-5 border-b border-white/10 bg-[#081020]/60 backdrop-blur-xl relative z-20">
        <Link href="/login" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral p-[1px]">
            <div className="w-full h-full bg-[#0A1428] rounded-xl flex items-center justify-center font-black text-transparent bg-clip-text bg-gradient-to-tr from-brand-caribbeanSea to-brand-goldenHour text-sm">
              A
            </div>
          </div>
          <span className="font-black text-lg text-white font-serif tracking-tight">ANTILIA</span>
        </Link>
        <span className="text-xs text-brand-sandstone/50 font-semibold uppercase tracking-wider">
          Step 1 of 5
        </span>
      </header>

      {/* Centered content container */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 relative z-10">
        <div className="w-full max-w-xl">
          {/* Step progress bar */}
          <div className="flex items-center gap-1.5 mb-8">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className={`h-[3px] rounded-full transition-all duration-500 ${
                  n < 1
                    ? 'flex-1 bg-brand-caribbeanSea'
                    : n === 1
                    ? 'flex-[2] bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral'
                    : 'flex-1 bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* Main Card */}
          <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/60 relative overflow-hidden">
            <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-brand-caribbeanSea/40 to-transparent" />

            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-brand-caribbeanSea/15 text-brand-caribbeanSea border border-brand-caribbeanSea/30 mb-3">
                <Sparkles className="w-3 h-3 text-brand-goldenHour" />
                <span>Account Intent</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                What brings you to Antilia?
              </h1>
              <p className="text-sm text-brand-sandstone/70 mt-1.5 leading-relaxed">
                Choose your primary experience. You can unlock all features anytime.
              </p>
            </div>

            {/* 2-Column Clean Minimalist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1 select-none custom-scrollbar">
              {INTENTS.map((item) => {
                const isSelected = selectedIntent === item.id;
                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedIntent(item.id)}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedIntent(item.id)}
                    className={`flex flex-col items-start gap-2 p-4 rounded-2xl border cursor-pointer transition-all duration-200 text-left select-none group ${
                      isSelected
                        ? 'border-brand-caribbeanSea bg-brand-caribbeanSea/15 ring-1 ring-brand-caribbeanSea/40 shadow-lg shadow-brand-caribbeanSea/10'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-brand-caribbeanSea/25' : 'bg-white/5'
                        }`}
                      >
                        {item.icon}
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-brand-goldenHour/20 text-brand-goldenHour border border-brand-goldenHour/30">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <h2 className="font-bold text-sm text-white group-hover:text-brand-caribbeanSea transition-colors">
                        {item.title}
                      </h2>
                      <p className="text-xs text-brand-sandstone/60 leading-snug">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Primary Action Button */}
            <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
              <button
                type="button"
                onClick={handleContinue}
                className="w-full py-4 px-6 rounded-2xl font-black text-sm tracking-widest bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral text-[#060A12] hover:opacity-95 active:scale-[0.99] transition-all shadow-xl shadow-brand-caribbeanSea/25 flex items-center justify-center gap-2 uppercase"
              >
                <span>CONTINUE</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-center text-xs text-brand-sandstone/60">
                Already have an account?{' '}
                <Link href="/login" className="text-brand-caribbeanSea font-bold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-brand-sandstone/40 mt-6">
            1 / 5 — Choose your path
          </p>
        </div>
      </div>
    </div>
  );
}
