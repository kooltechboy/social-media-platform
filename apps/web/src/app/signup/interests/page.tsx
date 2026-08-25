'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Sparkles, Check, CheckCircle2 } from 'lucide-react';
import { getSignupSession, saveSignupSession, type SignupState } from '../../../lib/auth/signup-session';

interface InterestItem {
  id: string;
  name: string;
  emoji: string;
  subtitle: string;
  hasAudioWave?: boolean;
}

const INTEREST_TOPICS: InterestItem[] = [
  { id: 'music', name: 'Reggae & Soca', emoji: '🎵', subtitle: 'Dancehall, Kompa, Calypso, Bachata, Salsa', hasAudioWave: true },
  { id: 'food', name: 'Island Culinary', emoji: '🍛', subtitle: 'Jerk, Roti, Rum, Seafood, Island Fusion' },
  { id: 'carnival', name: 'Carnival Mas', emoji: '🎭', subtitle: 'Trinidad, Crop Over, Junkanoo, Caribana' },
  { id: 'tech', name: 'CaribAI & Tech', emoji: '💻', subtitle: 'Fintech, developer ecosystem, AI models' },
  { id: 'finance', name: 'SpotPay & Wallets', emoji: '💰', subtitle: 'Multi-currency ledger, zero-fee remittances' },
  { id: 'travel', name: 'Travel & Islands', emoji: '🏝️', subtitle: 'Hidden beaches, eco-resorts, diving, sailing' },
  { id: 'sports', name: 'Sports & Cricket', emoji: '⚽', subtitle: 'Football, Track & Field, Cricket, Boxing' },
  { id: 'culture', name: 'Art & Heritage', emoji: '🎨', subtitle: 'Visual art, literature, spoken word, fashion' },
  { id: 'podcasts', name: 'Podcasts & Talk', emoji: '🎙️', subtitle: 'Diaspora dialogue, news, comedy, interviews', hasAudioWave: true },
  { id: 'live', name: 'Live Sound Systems', emoji: '📺', subtitle: 'DJs, festivals, concerts, street galas', hasAudioWave: true },
  { id: 'business', name: 'Enterprise & Startups', emoji: '💼', subtitle: 'Commerce, investing, real estate, trade' },
  { id: 'shopping', name: 'Marketplace & Crafts', emoji: '🛍️', subtitle: 'Artisan goods, fashion, apparel, spices' },
  { id: 'education', name: 'Education & Languages', emoji: '🎓', subtitle: 'Patois, Creole, history, universities' },
  { id: 'community', name: 'Diaspora Hubs', emoji: '❤️', subtitle: 'Island associations, relief, youth mentorship' },
  { id: 'lifestyle', name: 'Coastal Lifestyle', emoji: '🏄', subtitle: 'Wellness, yoga, sailing, sea conservation' },
  { id: 'diaspora', name: 'Global Connections', emoji: '🌎', subtitle: 'UK, US, Canada, EU, African linkages' },
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
    <div
      className="min-h-screen w-full bg-[#081020] flex flex-col text-brand-sandstone relative overflow-x-hidden selection:bg-[#FF7A59]/30"
      style={{
        backgroundImage:
          'radial-gradient(circle at 50% 0%, rgba(0, 180, 216, 0.12) 0%, transparent 60%), radial-gradient(circle, rgba(0, 180, 216, 0.06) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 32px 32px',
      }}
    >
      {/* Ambient glows */}
      <div className="fixed top-1/4 left-1/4 w-[600px] h-[400px] bg-cyan-500/12 blur-[160px] rounded-full pointer-events-none" />
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
          Step 4 of 5
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
                  n < 4
                    ? 'flex-1 bg-brand-caribbeanSea'
                    : n === 4
                    ? 'flex-[2] bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral'
                    : 'flex-1 bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* Main Card */}
          <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/60 relative overflow-hidden">
            <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
                  <Sparkles className="w-3 h-3 text-brand-goldenHour" />
                  <span>Cultural Vibes</span>
                </div>
                <Link
                  href="/signup/account"
                  className="text-xs text-brand-sandstone/50 hover:text-white transition-colors"
                >
                  ← Back
                </Link>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                What moves you?
              </h1>
              <p className="text-sm text-brand-sandstone/70 mt-1.5 leading-relaxed">
                Pick 3+ vibes to calibrate your Home Feed, music, and recommendations.
              </p>
            </div>

            {/* Selected Counter Badge */}
            <div className="mb-4 flex items-center justify-between text-xs">
              <span className="text-brand-sandstone/70">
                Active Vibes:{' '}
                <strong className="text-brand-caribbeanSea font-bold">{selectedInterests.length}</strong>{' '}
                selected
              </span>
              {selectedInterests.length < 3 && (
                <span className="text-brand-goldenHour text-[11px] font-medium animate-pulse">
                  Select {3 - selectedInterests.length} more
                </span>
              )}
              {selectedInterests.length >= 3 && (
                <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> High Signal Calibrated
                </span>
              )}
            </div>

            {/* Topics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1 select-none custom-scrollbar">
              {INTEREST_TOPICS.map((topic) => {
                const isSelected = selectedInterests.includes(topic.id);
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => toggleInterest(topic.id)}
                    className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden group ${
                      isSelected
                        ? 'bg-gradient-to-br from-brand-caribbeanSea/20 via-brand-goldenHour/10 to-brand-sunriseCoral/20 border-brand-sunriseCoral ring-1 ring-brand-sunriseCoral/40 shadow-lg shadow-brand-sunriseCoral/10'
                        : 'bg-[#080D18] border-white/5 hover:border-white/20 hover:bg-[#0A111F]'
                    }`}
                  >
                    <span className="text-2xl flex-shrink-0 pt-0.5">{topic.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-white leading-tight">{topic.name}</p>
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

            {/* Primary Action Button */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <button
                type="button"
                disabled={selectedInterests.length < 3}
                onClick={handleContinue}
                className="w-full py-4 px-6 rounded-2xl font-black text-sm tracking-widest bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral text-[#060A12] hover:opacity-95 active:scale-[0.99] transition-all shadow-xl shadow-brand-caribbeanSea/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase"
              >
                <span>GENERATE ANTILIA PASSPORT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-brand-sandstone/40 mt-6">
            4 / 5 — Choose your vibes
          </p>
        </div>
      </div>
    </div>
  );
}
