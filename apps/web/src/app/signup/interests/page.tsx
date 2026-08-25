'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, Check, CheckCircle2, Radio, Volume2 } from 'lucide-react';
import { GatewayShell } from '../../../components/gateway/GatewayShell';
import { StepProgress } from '../../../components/gateway/signup/StepProgress';
import { getSignupSession, saveSignupSession, type SignupState } from '../../../lib/auth/signup-session';

interface InterestItem {
  id: string;
  name: string;
  emoji: string;
  subtitle: string;
  hasAudioWave?: boolean;
}

const INTEREST_TOPICS: InterestItem[] = [
  { id: 'music', name: 'Reggae & Soca 🎵', emoji: '🎵', subtitle: 'Dancehall, Kompa, Calypso, Bachata, Salsa', hasAudioWave: true },
  { id: 'food', name: 'Island Culinary 🍛', emoji: '🍛', subtitle: 'Jerk, Roti, Rum, Seafood, Island Fusion' },
  { id: 'carnival', name: 'Carnival Mas 🎭', emoji: '🎭', subtitle: 'Trinidad, Crop Over, Junkanoo, Caribana' },
  { id: 'tech', name: 'CaribAI & Tech 💻', emoji: '💻', subtitle: 'Fintech, developer ecosystem, AI models' },
  { id: 'finance', name: 'SpotPay & Wallets 💰', emoji: '💰', subtitle: 'Multi-currency ledger, zero-fee remittances' },
  { id: 'travel', name: 'Travel & Islands 🏝️', emoji: '🏝️', subtitle: 'Hidden beaches, eco-resorts, diving, sailing' },
  { id: 'sports', name: 'Sports & Cricket ⚽', emoji: '⚽', subtitle: 'Football, Track & Field, Cricket, Boxing' },
  { id: 'culture', name: 'Art & Heritage 🎨', emoji: '🎨', subtitle: 'Visual art, literature, spoken word, fashion' },
  { id: 'podcasts', name: 'Podcasts & Talk 🎙️', emoji: '🎙️', subtitle: 'Diaspora dialogue, news, comedy, interviews', hasAudioWave: true },
  { id: 'live', name: 'Live Sound Systems 📺', emoji: '📺', subtitle: 'DJs, festivals, concerts, street galas', hasAudioWave: true },
  { id: 'business', name: 'Enterprise & Startups 💼', emoji: '💼', subtitle: 'Commerce, investing, real estate, trade' },
  { id: 'shopping', name: 'Marketplace & Crafts 🛍️', emoji: '🛍️', subtitle: 'Artisan goods, fashion, apparel, spices' },
  { id: 'education', name: 'Education & Languages 🎓', emoji: '🎓', subtitle: 'Patois, Creole, history, universities' },
  { id: 'community', name: 'Diaspora Hubs ❤️', emoji: '❤️', subtitle: 'Island associations, relief, youth mentorship' },
  { id: 'lifestyle', name: 'Coastal Lifestyle 🏄', emoji: '🏄', subtitle: 'Wellness, yoga, sailing, sea conservation' },
  { id: 'diaspora', name: 'Global Connections 🌎', emoji: '🌎', subtitle: 'UK, US, Canada, EU, African linkages' },
];

function AudioWaveform() {
  return (
    <div className="flex items-center gap-[2px] h-3">
      <span className="w-[2px] h-2 bg-brand-sunriseCoral rounded-full animate-pulse" />
      <span className="w-[2px] h-3 bg-brand-goldenHour rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
      <span className="w-[2px] h-1.5 bg-brand-caribbeanSea rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
      <span className="w-[2px] h-3 bg-brand-sunriseCoral rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
      <span className="w-[2px] h-2 bg-brand-caribbeanSea rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
    </div>
  );
}

export default function SignupInterestsPage() {
  const router = useRouter();
  const [session, setSession] = useState<SignupState>({});
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['music', 'food', 'culture']);

  useEffect(() => {
    const s = getSignupSession();
    setSession(s);
    if (s.interests && s.interests.length > 0) {
      setSelectedInterests(s.interests);
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
    <GatewayShell activeIslandIso={session.originCountryIso}>
      <div className="bg-[#0C1322]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-brand-caribbeanSea/40 to-transparent" />

        <StepProgress currentStep={4} totalSteps={5} backHref="/signup/account" />

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-brand-sunriseCoral/15 text-brand-sunriseCoral border border-brand-sunriseCoral/30">
              Cultural Vibe Radar
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            What do you want to discover?
          </h2>
          <p className="text-xs sm:text-sm text-brand-sandstone/60 mt-0.5">
            Pick 3+ topics to calibrate your Home Feed, CaribAI recommendations, and live streams.
          </p>
        </div>

        {/* Selected Counter Badge */}
        <div className="mb-3 flex items-center justify-between text-xs">
          <span className="text-brand-sandstone/70">
            Active Vibes:{' '}
            <strong className="text-brand-caribbeanSea font-bold">{selectedInterests.length}</strong>{' '}
            selected
          </span>
          {selectedInterests.length < 3 && (
            <span className="text-brand-goldenHour text-[11px] font-medium animate-pulse">
              Select {3 - selectedInterests.length} more to continue
            </span>
          )}
          {selectedInterests.length >= 3 && (
            <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> High Signal Calibrated
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
                className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'bg-gradient-to-br from-brand-caribbeanSea/25 via-brand-goldenHour/15 to-brand-sunriseCoral/25 border-brand-sunriseCoral shadow-lg shadow-brand-sunriseCoral/15 ring-1 ring-brand-sunriseCoral/40'
                    : 'bg-[#080D18] border-white/5 hover:border-white/20 hover:bg-[#0A111F]'
                }`}
              >
                <span className="text-2xl flex-shrink-0 pt-0.5">{topic.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-white leading-tight">{topic.name.split(' ')[0]} {topic.name.split(' ')[1]}</p>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-brand-sunriseCoral text-[#060A12] flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-brand-sandstone/50 truncate mt-0.5">
                    {topic.subtitle}
                  </p>
                  {topic.hasAudioWave && isSelected && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[9px] text-brand-sunriseCoral font-semibold">
                      <AudioWaveform />
                      <span>Live stream tuned</span>
                    </div>
                  )}
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
            <span>GENERATE ANTILIA PASSPORT</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </GatewayShell>
  );
}
