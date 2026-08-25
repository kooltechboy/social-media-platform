'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Globe, ArrowRight, ShieldCheck, MapPin, Check } from 'lucide-react';
import { GatewayShell } from '../../../components/gateway/GatewayShell';
import { StepProgress } from '../../../components/gateway/signup/StepProgress';
import { CARIBBEAN_TERRITORIES, type CaribbeanTerritory } from '../../../lib/constants/caribbean-territories';
import { DIASPORA_COUNTRIES, DIASPORA_CITY_HUBS, type DiasporaCountry } from '../../../lib/constants/diaspora-hubs';
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
    <GatewayShell>
      <div className="bg-[#0C1322]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-brand-caribbeanSea/40 to-transparent" />

        <StepProgress currentStep={2} totalSteps={5} backHref="/signup" />

        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Your Caribbean Roots
          </h2>
          <p className="text-xs sm:text-sm text-brand-sandstone/60 mt-1">
            Where is your island connection, heritage, or affinity?
          </p>
        </div>

        {/* Search Island */}
        <div className="relative mb-3 flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-brand-sandstone/40 pointer-events-none" />
          <input
            type="text"
            value={searchIsland}
            onChange={(e) => setSearchIsland(e.target.value)}
            placeholder="Search all 30+ islands & territories…"
            className="w-full bg-[#080D18] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea focus:ring-1 focus:ring-brand-caribbeanSea/30 transition-all"
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
                    ? 'bg-brand-caribbeanSea/20 border-brand-caribbeanSea shadow-sm'
                    : 'bg-[#080D18] border-white/5 hover:border-white/20 hover:bg-[#0A111F]'
                }`}
              >
                <span className="text-2xl flex-shrink-0">{t.flag}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate leading-tight">{t.name}</p>
                  <p className="text-[10px] text-brand-sandstone/50 uppercase font-semibold">{t.iso}</p>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-brand-caribbeanSea flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Diaspora Live Section */}
        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
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
            <div className="space-y-2 p-3 rounded-2xl bg-[#080D18] border border-white/10 animate-fadeIn">
              <p className="text-[11px] font-semibold text-brand-sandstone/70">
                Where do you live now?
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[140px] overflow-y-auto pr-1 select-none custom-scrollbar">
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
                      <span className="text-lg">{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Privacy Note */}
        <div className="mt-4 flex items-center gap-2 text-[11px] text-brand-sandstone/50 bg-white/5 px-3 py-2 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-brand-caribbeanSea flex-shrink-0" />
          <span>Caribbean identity is optional and private by default. You control all visibility.</span>
        </div>

        {/* Action Button */}
        <div className="mt-5 pt-3 border-t border-white/10">
          <button
            type="button"
            disabled={!selectedTerritory}
            onClick={handleContinue}
            className="w-full py-3.5 px-4 rounded-xl font-black text-sm tracking-wide bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral text-[#060A12] hover:opacity-95 active:scale-[0.99] transition-all shadow-lg shadow-brand-caribbeanSea/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>NEXT: YOUR IDENTITY</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </GatewayShell>
  );
}
