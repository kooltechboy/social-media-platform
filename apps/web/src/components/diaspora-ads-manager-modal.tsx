'use client';

import React, { useState } from 'react';
import { Target, Sparkles, X, Check, ShieldCheck, DollarSign, Globe, Users, TrendingUp, Loader2 } from 'lucide-react';

interface DiasporaAdsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  advertiserName?: string;
}

const ISLAND_ORIGINS = [
  { code: 'DOM', name: 'Dominican Republic 🇩🇴' },
  { code: 'JAM', name: 'Jamaica 🇯🇲' },
  { code: 'TTO', name: 'Trinidad & Tobago 🇹🇹' },
  { code: 'BRB', name: 'Barbados 🇧🇧' },
  { code: 'HTG', name: 'Haiti 🇭🇹' },
  { code: 'BHS', name: 'Bahamas 🇧🇸' },
  { code: 'PRI', name: 'Puerto Rico 🇵🇷' },
  { code: 'ALL', name: 'Pan-Caribbean 🌴' },
];

const DIASPORA_METROS = [
  { id: 'nyc', name: 'New York Metro (NYC/NJ/CT) 🗽', estReach: '2.4M Caribbean Diaspora' },
  { id: 'mia', name: 'Miami & South Florida 🌴', estReach: '1.8M Caribbean Diaspora' },
  { id: 'tor', name: 'Greater Toronto Area 🍁', estReach: '750K Caribbean Diaspora' },
  { id: 'lon', name: 'London & UK Metro 🇬🇧', estReach: '620K Caribbean Diaspora' },
  { id: 'bos', name: 'Boston & New England 🦞', estReach: '380K Caribbean Diaspora' },
  { id: 'homeland', name: 'Homeland Residents Only 🏝️', estReach: '5.2M Island Residents' },
];

const INTERESTS = [
  'Carnival & Mas Music', 'Homeland Real Estate & Property', 'Caribbean Cuisine & Export Food',
  'Fintech & Diaspora Remittances', 'Reggae / Dancehall / Soca / Dembow', 'Travel, Eco-Villas & Resorts'
];

export default function DiasporaAdsManagerModal({
  isOpen,
  onClose,
  advertiserName = 'Tukubi Business',
}: DiasporaAdsManagerModalProps) {
  const [selectedOrigin, setSelectedOrigin] = useState(ISLAND_ORIGINS[0].code);
  const [selectedMetro, setSelectedMetro] = useState(DIASPORA_METROS[0].id);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([INTERESTS[0], INTERESTS[1]]);
  const [dailyBudget, setDailyBudget] = useState('20');
  const [durationDays, setDurationDays] = useState('7');
  const [headline, setHeadline] = useState('');
  const [isLaunching, setIsLaunching] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const budgetNum = parseFloat(dailyBudget) || 0;
  const daysNum = parseInt(durationDays, 10) || 1;
  const totalBudget = (budgetNum * daysNum).toFixed(2);
  const estImpressions = Math.round(budgetNum * daysNum * 125); // ~$8 CPM estimate

  function toggleInterest(item: string) {
    setSelectedInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }

  async function handleLaunch(e: React.FormEvent) {
    e.preventDefault();
    setIsLaunching(true);
    setTimeout(() => {
      setIsLaunching(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 3000);
    }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-twilight/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-brand-dusk border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-brand-sunriseCoral to-brand-goldenHour text-white shadow-lg shadow-brand-sunriseCoral/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base text-white">Tukubi Diaspora Ads Manager</h3>
            <p className="text-xs text-slate-400">Target Caribbean audiences across North America, UK & Homeland</p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-black text-white">Campaign Launched to Diaspora!</h4>
            <p className="text-xs text-slate-300">
              Your campaign is active across <strong className="text-brand-sunriseCoral">{DIASPORA_METROS.find((m) => m.id === selectedMetro)?.name}</strong>.
            </p>
            <div className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-full inline-block">
              Budget Allocated via Ledger &bull; Real-time ROI Tracking Active
            </div>
          </div>
        ) : (
          <form onSubmit={handleLaunch} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">Ad Headline / Tagline</label>
              <input
                type="text"
                required
                placeholder="e.g., Authentic Jamaican Blue Mountain Coffee — Free NYC Dispatch"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-sunriseCoral"
              />
            </div>

            {/* Target Origin */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Island Heritage Focus
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ISLAND_ORIGINS.map((origin) => (
                  <button
                    key={origin.code}
                    type="button"
                    onClick={() => setSelectedOrigin(origin.code)}
                    className={`p-2 rounded-xl border text-[11px] font-bold text-left transition-all ${
                      selectedOrigin === origin.code
                        ? 'border-brand-sunriseCoral bg-brand-sunriseCoral/20 text-white'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400'
                    }`}
                  >
                    {origin.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Diaspora Metro */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Diaspora Location Target
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DIASPORA_METROS.map((metro) => (
                  <button
                    key={metro.id}
                    type="button"
                    onClick={() => setSelectedMetro(metro.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedMetro === metro.id
                        ? 'border-brand-goldenHour bg-brand-goldenHour/15 text-white'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{metro.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{metro.estReach}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Interests */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Cultural Interest Targeting
              </label>
              <div className="flex flex-wrap gap-1.5">
                {INTERESTS.map((interest) => {
                  const isSel = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                        isSel
                          ? 'border-brand-caribbeanSea bg-brand-caribbeanSea/20 text-brand-caribbeanSea'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Budget & Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">Daily Spend (USD)</label>
                <input
                  type="number"
                  min="5"
                  max="1000"
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-bold focus:outline-none focus:border-brand-sunriseCoral"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-bold focus:outline-none focus:border-brand-sunriseCoral"
                />
              </div>
            </div>

            {/* Projected Audience Reach Box */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Estimated Diaspora Impressions:</span>
                <span className="font-bold text-emerald-400">~{estImpressions.toLocaleString()} views</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Campaign Investment:</span>
                <span className="font-bold text-white">${totalBudget} USD</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLaunching || budgetNum <= 0}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-sunriseCoral via-brand-goldenHour to-brand-sunriseCoral font-black text-white text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-brand-sunriseCoral/20"
            >
              {isLaunching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Authorizing Ad Budget...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Launch Campaign (${totalBudget} USD)
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
