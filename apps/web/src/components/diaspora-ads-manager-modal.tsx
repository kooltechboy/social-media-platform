'use client';

import React, { useState } from 'react';
import {
  Target, Sparkles, X, Check, DollarSign, Globe, Users, TrendingUp, Loader2, ArrowRight, ArrowLeft, Eye
} from 'lucide-react';
import {
  createCampaignAction,
  createAdSetAction,
  createAdAction,
} from '../lib/advertising/actions';

interface DiasporaAdsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  advertiserName?: string;
  defaultHeadline?: string;
}

const OBJECTIVES = [
  { id: 'reach', title: 'Reach', desc: 'Get seen by more Caribbean people', icon: Users, objectiveKey: 'awareness' },
  { id: 'engagement', title: 'Engagement', desc: 'Get more likes, comments & shares', icon: TrendingUp, objectiveKey: 'engagement' },
  { id: 'traffic', title: 'Traffic', desc: 'Drive visitors to your profile or website', icon: Globe, objectiveKey: 'traffic' },
  { id: 'video_views', title: 'Video Views', desc: 'Maximize views on video & reels', icon: Eye, objectiveKey: 'awareness' },
];

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
  defaultHeadline = '',
}: DiasporaAdsManagerModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedObjective, setSelectedObjective] = useState(OBJECTIVES[0].id);
  const [dailyBudget, setDailyBudget] = useState('15');
  const [durationDays, setDurationDays] = useState('7');

  const [audienceTarget, setAudienceTarget] = useState<'caribbean' | 'diaspora' | 'all'>('diaspora');
  const [selectedOrigin, setSelectedOrigin] = useState(ISLAND_ORIGINS[0].code);
  const [selectedMetro, setSelectedMetro] = useState(DIASPORA_METROS[0].id);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([INTERESTS[0], INTERESTS[1]]);

  const [headline, setHeadline] = useState(defaultHeadline || 'Authentic Caribbean Experience — Powered by Tukubi');
  const [destinationUrl, setDestinationUrl] = useState('https://tukubi.com');
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const budgetNum = Math.max(5, parseFloat(dailyBudget) || 10);
  const daysNum = Math.max(1, parseInt(durationDays, 10) || 1);
  const totalBudget = (budgetNum * daysNum).toFixed(2);
  const totalBudgetMinor = Math.round(budgetNum * daysNum * 100);
  const dailyBudgetMinor = Math.round(budgetNum * 100);
  const estImpressions = Math.round(budgetNum * daysNum * 125); // ~$8 CPM estimate

  function toggleInterest(item: string) {
    setSelectedInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }

  async function handleLaunch() {
    setIsLaunching(true);
    setLaunchError(null);

    try {
      const objConfig = OBJECTIVES.find(o => o.id === selectedObjective) || OBJECTIVES[0];
      
      // 1. Create Campaign
      const campRes = await createCampaignAction({
        name: `Boost: ${headline.slice(0, 30)}`,
        objective: objConfig.objectiveKey,
        objective_v2: selectedObjective,
        budgetTotalMinor: totalBudgetMinor,
        budgetDailyMinor: dailyBudgetMinor,
        currency: 'USD',
      });

      if (campRes.error || !campRes.campaignId) {
        setLaunchError(campRes.error || 'Failed to create campaign');
        setIsLaunching(false);
        return;
      }

      // 2. Create Ad Set
      const adSetRes = await createAdSetAction({
        campaignId: campRes.campaignId,
        name: `Audience (${audienceTarget.toUpperCase()})`,
        country_iso: selectedOrigin === 'ALL' ? undefined : selectedOrigin,
        interest_keys: selectedInterests,
        placement: 'feed',
        placements: ['feed', 'reels', 'explore'],
        bid_cpm_minor: 800,
      });

      if (adSetRes.error || !adSetRes.adSetId) {
        setLaunchError(adSetRes.error || 'Failed to configure audience');
        setIsLaunching(false);
        return;
      }

      // 3. Create Ad
      const adRes = await createAdAction({
        adSetId: adSetRes.adSetId,
        headline: headline.slice(0, 100),
        body: `Targeting: ${selectedInterests.join(', ')}`,
        destination_url: destinationUrl,
        creative_type: 'single_image',
      });

      if (adRes.error || !adRes.adId) {
        setLaunchError(adRes.error || 'Failed to finalize ad creative');
        setIsLaunching(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setStep(1);
        onClose();
      }, 3000);
    } catch (err: any) {
      setLaunchError(err?.message || 'An unexpected error occurred.');
    } finally {
      setIsLaunching(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-twilight/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-brand-dusk border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-brand-sunriseCoral to-brand-goldenHour text-white shadow-lg shadow-brand-sunriseCoral/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">Tukubi Boost+ Ads Manager</h3>
              <p className="text-xs text-slate-400">Step {step} of 3 &bull; Grow Caribbean & Diaspora Presence</p>
            </div>
          </div>
          {/* Step dots */}
          <div className="flex items-center gap-1.5 pr-8">
            <div className={`w-2.5 h-2.5 rounded-full ${step === 1 ? 'bg-brand-sunriseCoral' : 'bg-slate-700'}`} />
            <div className={`w-2.5 h-2.5 rounded-full ${step === 2 ? 'bg-brand-sunriseCoral' : 'bg-slate-700'}`} />
            <div className={`w-2.5 h-2.5 rounded-full ${step === 3 ? 'bg-brand-sunriseCoral' : 'bg-slate-700'}`} />
          </div>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-black text-white">Campaign Live in Boost Pool!</h4>
            <p className="text-xs text-slate-300">
              Your boost is live and routing to{' '}
              <strong className="text-brand-sunriseCoral">
                {audienceTarget === 'diaspora' ? DIASPORA_METROS.find((m) => m.id === selectedMetro)?.name : 'Homeland Islands'}
              </strong>.
            </p>
            <div className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-full inline-block">
              Recorded in Database &bull; Real-Time Impressions Active
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {launchError && (
              <div className="p-3 bg-red-950/60 border border-red-500/30 rounded-xl text-xs text-red-300">
                {launchError}
              </div>
            )}

            {/* STEP 1: Objective & Budget */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Select Campaign Objective
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {OBJECTIVES.map((obj) => {
                      const Icon = obj.icon;
                      const isSel = selectedObjective === obj.id;
                      return (
                        <button
                          key={obj.id}
                          type="button"
                          onClick={() => setSelectedObjective(obj.id)}
                          className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                            isSel
                              ? 'border-brand-sunriseCoral bg-brand-sunriseCoral/15 text-white ring-1 ring-brand-sunriseCoral/50'
                              : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className={`w-4 h-4 ${isSel ? 'text-brand-sunriseCoral' : 'text-slate-400'}`} />
                            <span className="text-xs font-bold text-white">{obj.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight">{obj.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-300">Daily Spend (USD)</label>
                    <div className="flex gap-1.5 mb-1.5">
                      {['5', '15', '25', '50'].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setDailyBudget(amt)}
                          className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all ${
                            dailyBudget === amt
                              ? 'border-brand-sunriseCoral bg-brand-sunriseCoral/20 text-white'
                              : 'border-slate-800 bg-slate-900 text-slate-400'
                          }`}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>
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
                    <div className="flex gap-1.5 mb-1.5">
                      {['3', '7', '14', '30'].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDurationDays(d)}
                          className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all ${
                            durationDays === d
                              ? 'border-brand-sunriseCoral bg-brand-sunriseCoral/20 text-white'
                              : 'border-slate-800 bg-slate-900 text-slate-400'
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
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

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 rounded-xl bg-brand-sunriseCoral text-white text-xs font-bold flex items-center gap-1.5 hover:bg-brand-sunriseCoral/90 transition-all"
                  >
                    Next: Target Audience <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Audience & Targeting */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Audience Scope
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'diaspora', label: 'Diaspora Metro 🗽' },
                      { id: 'caribbean', label: 'Homeland Islands 🌴' },
                      { id: 'all', label: 'Global Caribbean 🌎' },
                    ].map((scope) => (
                      <button
                        key={scope.id}
                        type="button"
                        onClick={() => setAudienceTarget(scope.id as any)}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                          audienceTarget === scope.id
                            ? 'border-brand-goldenHour bg-brand-goldenHour/20 text-white'
                            : 'border-slate-800 bg-slate-900 text-slate-400'
                        }`}
                      >
                        {scope.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Metro or Island */}
                {audienceTarget === 'diaspora' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Metro Focus
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {DIASPORA_METROS.map((metro) => (
                        <button
                          key={metro.id}
                          type="button"
                          onClick={() => setSelectedMetro(metro.id)}
                          className={`p-2 rounded-xl border text-left transition-all ${
                            selectedMetro === metro.id
                              ? 'border-brand-sunriseCoral bg-brand-sunriseCoral/20 text-white'
                              : 'border-slate-800 bg-slate-900/50 text-slate-400'
                          }`}
                        >
                          <div className="text-[11px] font-bold text-white truncate">{metro.name}</div>
                          <div className="text-[9px] text-slate-400">{metro.estReach}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Island Origin */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Island Heritage Affiliation
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {ISLAND_ORIGINS.map((origin) => (
                      <button
                        key={origin.code}
                        type="button"
                        onClick={() => setSelectedOrigin(origin.code)}
                        className={`p-1.5 rounded-lg border text-[10px] font-bold text-center truncate transition-all ${
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

                {/* Interests */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Interest Tags
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {INTERESTS.map((interest) => {
                      const isSel = selectedInterests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
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

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-5 py-2.5 rounded-xl bg-brand-sunriseCoral text-white text-xs font-bold flex items-center gap-1.5 hover:bg-brand-sunriseCoral/90 transition-all"
                  >
                    Next: Review &amp; Launch <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Review & Publish */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-300">Campaign / Ad Headline</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Authentic Jamaican Blue Mountain Coffee"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-sunriseCoral"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-300">Destination Link</label>
                    <input
                      type="url"
                      required
                      placeholder="https://..."
                      value={destinationUrl}
                      onChange={(e) => setDestinationUrl(e.target.value)}
                      className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-sunriseCoral"
                    />
                  </div>
                </div>

                {/* Review Card */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Objective:</span>
                    <span className="font-bold text-white uppercase">{selectedObjective}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Target Audience:</span>
                    <span className="font-bold text-brand-goldenHour">
                      {audienceTarget === 'diaspora' ? DIASPORA_METROS.find((m) => m.id === selectedMetro)?.name : 'Pan-Caribbean'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Estimated Impressions:</span>
                    <span className="font-bold text-emerald-400">~{estImpressions.toLocaleString()} views</span>
                  </div>
                  <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-2">
                    <span>Total Investment:</span>
                    <span className="font-black text-white text-sm">${totalBudget} USD</span>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={handleLaunch}
                    disabled={isLaunching || !headline.trim()}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-sunriseCoral via-brand-goldenHour to-brand-sunriseCoral font-black text-white text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-brand-sunriseCoral/20"
                  >
                    {isLaunching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Authorizing via Ledger...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Launch Boost (${totalBudget} USD)
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
