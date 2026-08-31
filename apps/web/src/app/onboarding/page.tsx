'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Globe, ShieldCheck, ArrowRight, Check } from 'lucide-react';
import { GatewayShell } from '../../components/gateway/GatewayShell';
import { CARIBBEAN_TERRITORIES } from '../../lib/constants/caribbean-territories';
import { DIASPORA_COUNTRIES, DIASPORA_CITY_HUBS } from '../../lib/constants/diaspora-hubs';
import { updateOnboardingIdentity } from '../../lib/social/onboarding-actions';
import { useTranslation, LOCALES, LOCALE_DETAILS, Locale } from '@caribbean/localization';
import FounderOnboardingModal from '../../components/recognition/founder-onboarding-modal';

export default function OnboardingPage() {
  const router = useRouter();
  const { t, setLocale, locale } = useTranslation();
  const [selectedLocale, setSelectedLocale] = useState<Locale>(locale);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [originIso, setOriginIso] = useState<string>('');
  const [diasporaId, setDiasporaId] = useState<string>('');
  const [isDiaspora, setIsDiaspora] = useState<boolean>(false);
  const [founderMoment, setFounderMoment] = useState<{
    founderNumber: number;
    formattedNumber: string;
    programName: string;
  } | null>(null);

  const filteredTerritories = CARIBBEAN_TERRITORIES.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.iso.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originIso) return;

    setLoading(true);
    try {
      await updateOnboardingIdentity(originIso, isDiaspora ? diasporaId : null, selectedLocale);

      // Attempt to claim Founder status for early adopter
      const res = await fetch('/api/recognition/founders/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programSlug: 'founding_1000' }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.founder_number) {
          setFounderMoment({
            founderNumber: data.founder_number,
            formattedNumber: data.formatted_number || `#${String(data.founder_number).padStart(4, '0')}`,
            programName: data.program_name || 'TUKUBI Founding 1000',
          });
          setLoading(false);
          return;
        }
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      console.error(err);
      setLoading(false);
      router.push('/');
      router.refresh();
    }
  };

  const handleModalClose = () => {
    router.push('/');
    router.refresh();
  };

  return (
    <GatewayShell>
      <div className="bg-[#0C1322]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-brand-caribbeanSea/40 to-transparent" />

        <div className="mb-5">
          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-brand-caribbeanSea/15 text-brand-caribbeanSea border border-brand-caribbeanSea/30 inline-block mb-2">
            {t('onboarding.identity_title')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t('onboarding.welcome')}
          </h2>
          <p className="text-xs sm:text-sm text-brand-sandstone/60 mt-1">
            {t('onboarding.identity_subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Language Selection */}
          <div className="space-y-2 pb-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-brand-caribbeanSea" />
                <span>{t('onboarding.choose_language')}</span>
              </label>
              <span className="text-[10px] text-brand-sandstone/50">
                {t('settings.language')}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {LOCALES.map((code) => {
                const lang = LOCALE_DETAILS[code];
                const isSelected = selectedLocale === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setSelectedLocale(code);
                      setLocale(code);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-brand-caribbeanSea/20 border-brand-caribbeanSea text-white font-bold shadow-sm'
                        : 'bg-[#080D18] border-white/5 text-brand-sandstone/70 hover:border-white/20 hover:bg-[#0A111F]'
                    }`}
                  >
                    <span className="text-base flex-shrink-0">{lang.flag}</span>
                    <span className="text-xs truncate leading-tight">{lang.nativeName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Island Search */}
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-brand-sandstone/40 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('onboarding.search_roots')}
              className="w-full bg-[#080D18] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea transition-all"
            />
          </div>

          {/* Territory Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[240px] overflow-y-auto pr-1 select-none custom-scrollbar">
            {filteredTerritories.map((c) => {
              const isSelected = originIso === c.iso;
              return (
                <button
                  key={c.iso}
                  type="button"
                  onClick={() => setOriginIso(c.iso)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-brand-caribbeanSea/20 border-brand-caribbeanSea shadow-sm'
                      : 'bg-[#080D18] border-white/5 hover:border-white/20 hover:bg-[#0A111F]'
                  }`}
                >
                  <span className="text-2xl flex-shrink-0">{c.flag}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate leading-tight">{c.name}</p>
                    <p className="text-[10px] text-brand-sandstone/50 uppercase font-semibold">{c.iso}</p>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-brand-caribbeanSea flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Diaspora Toggle */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={isDiaspora}
                onChange={(e) => setIsDiaspora(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-[#080D18] text-brand-caribbeanSea focus:ring-brand-caribbeanSea"
              />
              <span className="text-xs font-bold text-brand-sandstone group-hover:text-white transition-colors flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-brand-goldenHour" />
                {t('onboarding.diaspora_question')}
              </span>
            </label>

            {isDiaspora && (
              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-[#080D18] border border-white/10 max-h-[140px] overflow-y-auto custom-scrollbar animate-fadeIn">
                {DIASPORA_CITY_HUBS.map((hub) => {
                  const isHubSelected = diasporaId === hub.id;
                  return (
                    <button
                      key={hub.id}
                      type="button"
                      onClick={() => setDiasporaId(hub.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs transition-all ${
                        isHubSelected
                          ? 'bg-brand-goldenHour/20 border-brand-goldenHour text-white font-bold'
                          : 'bg-white/5 border-white/5 text-brand-sandstone/70 hover:text-white'
                      }`}
                    >
                      <span className="text-base">{hub.flag}</span>
                      <span className="truncate">{hub.city}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Privacy Note */}
          <div className="flex items-center gap-2 text-[11px] text-brand-sandstone/50 bg-white/5 px-3 py-2 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-brand-caribbeanSea flex-shrink-0" />
            <span>Caribbean identity is optional and private by default.</span>
          </div>

          {/* Submit */}
          <div className="pt-2 border-t border-white/10">
            <button
              type="submit"
              disabled={!originIso || loading}
              className="w-full py-3.5 px-4 rounded-xl font-black text-sm tracking-wide bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral text-[#060A12] hover:opacity-95 active:scale-[0.99] transition-all shadow-lg shadow-brand-caribbeanSea/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t('onboarding.continue').toUpperCase()}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {founderMoment && (
          <FounderOnboardingModal
            founderNumber={founderMoment.founderNumber}
            formattedNumber={founderMoment.formattedNumber}
            programName={founderMoment.programName}
            onClose={handleModalClose}
          />
        )}
      </div>
    </GatewayShell>
  );
}
