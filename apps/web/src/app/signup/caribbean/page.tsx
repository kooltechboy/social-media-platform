'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Globe, ArrowRight, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { CARIBBEAN_TERRITORIES, type CaribbeanTerritory } from '../../../lib/constants/caribbean-territories';
import { DIASPORA_COUNTRIES, type DiasporaCountry } from '../../../lib/constants/diaspora-hubs';
import { getSignupSession, saveSignupSession } from '../../../lib/auth/signup-session';

export default function SignupCaribbeanPage() {
  const router = useRouter();
  const [searchIsland, setSearchIsland] = useState('');
  const [selectedTerritory, setSelectedTerritory] = useState<CaribbeanTerritory | null>(null);
  const [isDiaspora, setIsDiaspora] = useState(false);
  const [selectedDiasporaCountry, setSelectedDiasporaCountry] = useState<DiasporaCountry | null>(null);
  const [searchDiaspora, setSearchDiaspora] = useState('');

  useEffect(() => {
    const session = getSignupSession();
    if (session.originCountryIso) {
      const found = CARIBBEAN_TERRITORIES.find((t) => t.iso === session.originCountryIso);
      if (found) setSelectedTerritory(found);
    } else {
      const defaultIsland = CARIBBEAN_TERRITORIES.find((t) => t.iso === 'JAM');
      if (defaultIsland) setSelectedTerritory(defaultIsland);
    }

    if (session.isDiaspora) {
      setIsDiaspora(true);
      if (session.diasporaCountryIso) {
        const dFound = DIASPORA_COUNTRIES.find((c) => c.iso === session.diasporaCountryIso);
        if (dFound) setSelectedDiasporaCountry(dFound);
      }
    }
  }, []);

  const filteredTerritories = CARIBBEAN_TERRITORIES.filter((t) =>
    t.name.toLowerCase().includes(searchIsland.toLowerCase()) ||
    t.iso.toLowerCase().includes(searchIsland.toLowerCase())
  );

  const filteredDiasporaCountries = DIASPORA_COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(searchDiaspora.toLowerCase()) ||
    c.iso.toLowerCase().includes(searchDiaspora.toLowerCase())
  );

  const handleContinue = () => {
    if (!selectedTerritory) return;

    saveSignupSession({
      originCountryIso: selectedTerritory.iso,
      originCountryName: selectedTerritory.name,
      originFlag: selectedTerritory.flag,
      isDiaspora,
      diasporaCountryIso: isDiaspora ? selectedDiasporaCountry?.iso : undefined,
      diasporaCountryName: isDiaspora ? selectedDiasporaCountry?.name : undefined,
      diasporaFlag: isDiaspora ? selectedDiasporaCountry?.flag : undefined,
    });

    router.push('/signup/account');
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
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[400px] bg-brand-goldenHour/12 blur-[150px] rounded-full pointer-events-none" />

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
          Step 2 of 5
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
                  n < 2
                    ? 'flex-1 bg-brand-caribbeanSea'
                    : n === 2
                    ? 'flex-[2] bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral'
                    : 'flex-1 bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* Main Card */}
          <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/60 relative overflow-hidden">
            <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-brand-goldenHour/40 to-transparent" />

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-brand-goldenHour/15 text-brand-goldenHour border border-brand-goldenHour/30">
                  <Sparkles className="w-3 h-3 text-brand-sunriseCoral" />
                  <span>Origin & Roots</span>
                </div>
                <Link
                  href="/signup"
                  className="text-xs text-brand-sandstone/50 hover:text-white transition-colors"
                >
                  ← Back
                </Link>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Your Caribbean roots
              </h1>
              <p className="text-sm text-brand-sandstone/70 mt-1.5 leading-relaxed">
                Select your island connection. Optional — always private by default.
              </p>
            </div>

            {/* Search Island */}
            <div className="relative mb-3.5 flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-brand-sandstone/40 pointer-events-none" />
              <input
                type="text"
                value={searchIsland}
                onChange={(e) => setSearchIsland(e.target.value)}
                placeholder="Search all 30+ islands & territories…"
                className="w-full bg-[#080D18] border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-brand-sandstone/40 focus:outline-none focus:border-brand-goldenHour focus:ring-1 focus:ring-brand-goldenHour/30 transition-all"
              />
            </div>

            {/* Territories Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1 select-none custom-scrollbar">
              {filteredTerritories.map((t) => {
                const isSelected = selectedTerritory?.iso === t.iso;
                return (
                  <button
                    key={t.iso}
                    type="button"
                    onClick={() => setSelectedTerritory(t)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-brand-caribbeanSea/25 to-brand-goldenHour/20 border-brand-goldenHour ring-1 ring-brand-goldenHour/40 shadow-md shadow-brand-goldenHour/10 text-white'
                        : 'bg-[#080D18] border-white/5 hover:border-white/20 hover:bg-[#0A111F] text-brand-sandstone/80'
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{t.flag}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate leading-tight">{t.name}</p>
                      <p className="text-[10px] text-brand-sandstone/40 uppercase font-semibold">{t.iso}</p>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-goldenHour flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Diaspora Live Section */}
            <div className="mt-5 pt-4 border-t border-white/10 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={isDiaspora}
                  onChange={(e) => setIsDiaspora(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-[#080D18] text-brand-caribbeanSea focus:ring-brand-caribbeanSea"
                />
                <span className="text-xs font-bold text-brand-sandstone group-hover:text-white transition-colors flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-brand-goldenHour" />
                  I currently live in the Global Diaspora
                </span>
              </label>

              {isDiaspora && (
                <div className="space-y-2 p-3.5 rounded-2xl bg-[#080D18] border border-white/10 animate-fadeIn">
                  <p className="text-[11px] font-semibold text-brand-sandstone/70">
                    Where do you live now?
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[130px] overflow-y-auto pr-1 select-none custom-scrollbar">
                    {filteredDiasporaCountries.map((c) => {
                      const isDiasporaSelected = selectedDiasporaCountry?.iso === c.iso;
                      return (
                        <button
                          key={c.iso}
                          type="button"
                          onClick={() => setSelectedDiasporaCountry(c)}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all ${
                            isDiasporaSelected
                              ? 'bg-brand-goldenHour/20 border-brand-goldenHour text-white font-bold'
                              : 'bg-white/5 border-white/5 text-brand-sandstone/70 hover:text-white'
                          }`}
                        >
                          <span className="text-base">{c.flag}</span>
                          <span className="truncate">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Privacy Note */}
            <div className="mt-4 flex items-center gap-2 text-[11px] text-brand-sandstone/50 bg-white/5 px-3.5 py-2.5 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-brand-caribbeanSea flex-shrink-0" />
              <span>Caribbean identity is optional and private by default. You control all visibility.</span>
            </div>

            {/* Primary Action Button */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <button
                type="button"
                disabled={!selectedTerritory}
                onClick={handleContinue}
                className="w-full py-4 px-6 rounded-2xl font-black text-sm tracking-widest bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral text-[#060A12] hover:opacity-95 active:scale-[0.99] transition-all shadow-xl shadow-brand-caribbeanSea/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase"
              >
                <span>NEXT: YOUR IDENTITY</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-brand-sandstone/40 mt-6">
            2 / 5 — Your Caribbean roots
          </p>
        </div>
      </div>
    </div>
  );
}
