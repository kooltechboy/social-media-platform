'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Palette, Store, Building2, Mic, Users, ShoppingBag, ArrowRight } from 'lucide-react';
import { GatewayShell } from '../../components/gateway/GatewayShell';
import { StepProgress } from '../../components/gateway/signup/StepProgress';
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
    desc: 'Connect with friends, family, Caribbean culture & diaspora',
    icon: <User className="w-5 h-5 text-brand-caribbeanSea" />,
  },
  {
    id: 'creator',
    title: 'Creator / Artist',
    desc: 'Publish music, video, art & monetize directly via SpotPay',
    icon: <Palette className="w-5 h-5 text-brand-sunriseCoral" />,
    badge: 'Monetize',
  },
  {
    id: 'business',
    title: 'Business',
    desc: 'Grow your Caribbean enterprise, reach local & global clients',
    icon: <Store className="w-5 h-5 text-brand-goldenHour" />,
  },
  {
    id: 'organization',
    title: 'Organization',
    desc: 'NGOs, cultural institutions, embassies, associations & foundations',
    icon: <Building2 className="w-5 h-5 text-cyan-400" />,
  },
  {
    id: 'media',
    title: 'Media & Podcast',
    desc: 'Publish podcast networks, journalism & live streaming shows',
    icon: <Mic className="w-5 h-5 text-purple-400" />,
  },
  {
    id: 'community',
    title: 'Community Leader',
    desc: 'Host diaspora hubs, island groups & cultural networks',
    icon: <Users className="w-5 h-5 text-pink-400" />,
  },
  {
    id: 'seller',
    title: 'Marketplace Seller',
    desc: 'Sell artisan goods, culinary flavors, fashion & services',
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
    <GatewayShell>
      <div className="bg-[#0C1322]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-brand-caribbeanSea/40 to-transparent" />

        <StepProgress currentStep={1} totalSteps={5} />

        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            What brings you to Antilia?
          </h2>
          <p className="text-xs sm:text-sm text-brand-sandstone/60 mt-1">
            Choose your primary experience. You can unlock all features anytime.
          </p>
        </div>

        {/* Intent Cards Grid */}
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 select-none custom-scrollbar">
          {INTENTS.map((item) => {
            const isSelected = selectedIntent === item.id;
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedIntent(item.id)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedIntent(item.id)}
                className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-brand-caribbeanSea/15 border-brand-caribbeanSea shadow-md shadow-brand-caribbeanSea/10'
                    : 'bg-[#080D18] border-white/5 hover:border-white/20 hover:bg-[#0A111F]'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-brand-caribbeanSea/20' : 'bg-white/5'
                  }`}
                >
                  {item.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{item.title}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-goldenHour/20 text-brand-goldenHour border border-brand-goldenHour/30">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-sandstone/60 leading-snug line-clamp-1">
                    {item.desc}
                  </p>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected
                      ? 'border-brand-caribbeanSea bg-brand-caribbeanSea'
                      : 'border-white/20'
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-slate-950" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full py-3.5 px-4 rounded-xl font-black text-sm tracking-wide bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral text-[#060A12] hover:opacity-95 active:scale-[0.99] transition-all shadow-lg shadow-brand-caribbeanSea/25 flex items-center justify-center gap-2"
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
    </GatewayShell>
  );
}
