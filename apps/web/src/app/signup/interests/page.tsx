'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, Check, CheckCircle2 } from 'lucide-react';
import { GatewayShell } from '../../../components/gateway/GatewayShell';
import { StepProgress } from '../../../components/gateway/signup/StepProgress';
import { getSignupSession, saveSignupSession } from '../../../lib/auth/signup-session';

interface InterestItem {
  id: string;
  name: string;
  emoji: string;
  subtitle: string;
}

const INTEREST_TOPICS: InterestItem[] = [
  { id: 'music', name: 'Music & Sounds', emoji: '🎵', subtitle: 'Reggae, Soca, Dancehall, Kompa, Calypso' },
  { id: 'food', name: 'Food & Culinary', emoji: '🍛', subtitle: 'Jerk, Roti, Rum, Seafood, Caribbean flavors' },
  { id: 'travel', name: 'Travel & Islands', emoji: '🏝️', subtitle: 'Hidden beaches, resorts, sailing, island guides' },
  { id: 'sports', name: 'Sports & Cricket', emoji: '⚽', subtitle: 'Football, Track & Field, Cricket, Boxing' },
  { id: 'carnival', name: 'Carnival & Mas', emoji: '🎭', subtitle: 'Trinidad, Crop Over, Junkanoo, Caribana' },
  { id: 'culture', name: 'Art & Heritage', emoji: '🎨', subtitle: 'Visual art, literature, spoken word, fashion' },
  { id: 'business', name: 'Business & Startups', emoji: '💼', subtitle: 'Commerce, investing, Caribbean enterprise' },
  { id: 'tech', name: 'Technology & AI', emoji: '💻', subtitle: 'CaribAI, fintech, developer ecosystem' },
  { id: 'podcasts', name: 'Podcasts & Talk', emoji: '🎙️', subtitle: 'Culture discussions, news, comedy, interviews' },
  { id: 'live', name: 'Live Shows & DJs', emoji: '📺', subtitle: 'Sound systems, concerts, live streams, galas' },
  { id: 'shopping', name: 'Marketplace & Crafts', emoji: '🛍️', subtitle: 'Artisan goods, fashion, spices, apparel' },
  { id: 'finance', name: 'Finance & SpotPay', emoji: '💰', subtitle: 'Digital wallets, remittance, business payments' },
  { id: 'education', name: 'Education & Roots', emoji: '🎓', subtitle: 'Patois, Creole, history, scholarship' },
  { id: 'community', name: 'Diaspora Hubs', emoji: '❤️', subtitle: 'Island associations, community groups' },
  { id: 'lifestyle', name: 'Island Lifestyle', emoji: '🏄', subtitle: 'Wellness, nature, sailing, coastal life' },
  { id: 'diaspora', name: 'Global Diaspora', emoji: '🌎', subtitle: 'UK, US, Canada, EU, African connections' },
];

export default function SignupInterestsPage() {
  const router = useRouter();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['music', 'food', 'culture']);

  useEffect(() => {
    const session = getSignupSession();
    if (session.interests && session.interests.length > 0) {
      setSelectedInterests(session.interests);
    }
  }, []);

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    if (selectedInterests.length < 3) return;

    saveSignupSession({
      interests: selectedInterests,
    });

    router.push('/signup/complete');
  };

  return (
    <GatewayShell>
      <div className="bg-[#0C1322]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-brand-caribbeanSea/40 to-transparent" />

        <StepProgress currentStep={4} totalSteps={5} backHref="/signup/account" />

        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              What do you want to discover?
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-brand-sandstone/60 mt-1">
            Pick at least 3 topics to personalize your Home Feed and recommendation graph.
          </p>
        </div>

        {/* Selected Counter Badge */}
        <div className="mb-3 flex items-center justify-between text-xs">
          <span className="text-brand-sandstone/70">
            Selected:{' '}
            <strong className="text-brand-caribbeanSea font-bold">{selectedInterests.length}</strong>{' '}
            topics
          </span>
          {selectedInterests.length < 3 && (
            <span className="text-brand-goldenHour text-[11px] font-medium">
              Select {3 - selectedInterests.length} more to continue
            </span>
          )}
          {selectedInterests.length >= 3 && (
            <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Great selection!
            </span>
          )}
        </div>

        {/* Topics Grid */}
        <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1 select-none custom-scrollbar">
          {INTEREST_TOPICS.map((topic) => {
            const isSelected = selectedInterests.includes(topic.id);
            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => toggleInterest(topic.id)}
                className={`flex items-start gap-2.5 p-2.5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-gradient-to-br from-brand-caribbeanSea/20 via-brand-goldenHour/10 to-brand-sunriseCoral/20 border-brand-caribbeanSea/80 shadow-md shadow-brand-caribbeanSea/10'
                    : 'bg-[#080D18] border-white/5 hover:border-white/20 hover:bg-[#0A111F]'
                }`}
              >
                <span className="text-2xl flex-shrink-0 pt-0.5">{topic.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white leading-tight">{topic.name}</p>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-brand-caribbeanSea text-slate-950 flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-brand-sandstone/50 truncate mt-0.5">
                    {topic.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="mt-5 pt-4 border-t border-white/10">
          <button
            type="button"
            disabled={selectedInterests.length < 3}
            onClick={handleContinue}
            className="w-full py-3.5 px-4 rounded-xl font-black text-sm tracking-wide bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral text-[#060A12] hover:opacity-95 active:scale-[0.99] transition-all shadow-lg shadow-brand-caribbeanSea/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>PREPARE MY ANTILIA FEED</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </GatewayShell>
  );
}
