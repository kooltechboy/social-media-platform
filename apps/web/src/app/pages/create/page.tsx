'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Landmark,
  Sparkles,
  GraduationCap,
  Tv,
  Users,
  Calendar,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Store,
  ShieldCheck,
  MapPin,
  Wallet,
} from 'lucide-react';

type PageType = 'business' | 'creator' | 'government' | 'institution' | 'media' | 'community' | 'event';

interface PageTypeOption {
  type: PageType;
  title: string;
  desc: string;
  icon: React.ReactNode;
  badge: string;
}

const PAGE_TYPE_OPTIONS: PageTypeOption[] = [
  {
    type: 'business',
    title: 'Business & Storefront',
    desc: 'Retail, restaurants, hotels, manufacturers, professional services, and tech startups.',
    icon: <Building2 className="w-6 h-6 text-emerald-400" />,
    badge: 'COMMERCE ENABLED',
  },
  {
    type: 'creator',
    title: 'Creator & Artist Hub',
    desc: 'Musicians, designers, influencers, chefs, podcasters, athletes, and writers.',
    icon: <Sparkles className="w-6 h-6 text-sky-400" />,
    badge: 'MONETIZED',
  },
  {
    type: 'government',
    title: 'Government & Civic Entity',
    desc: 'Ministries, municipalities, agencies, embassies, and public officials.',
    icon: <Landmark className="w-6 h-6 text-amber-400" />,
    badge: 'CIVIC VERIFIED',
  },
  {
    type: 'institution',
    title: 'Institution & University',
    desc: 'Universities, research centers, cultural institutes, NGOs, and foundations.',
    icon: <GraduationCap className="w-6 h-6 text-purple-400" />,
    badge: 'OFFICIAL',
  },
  {
    type: 'community',
    title: 'Community & Diaspora Guild',
    desc: 'Alumni networks, regional guilds, neighborhood associations, and diaspora groups.',
    icon: <Users className="w-6 h-6 text-cyan-400" />,
    badge: 'PUBLIC/PRIVATE',
  },
  {
    type: 'event',
    title: 'Event Promoter & Carnival Band',
    desc: 'Concert producers, carnival mas bands, festival organizers, and sports promoters.',
    icon: <Calendar className="w-6 h-6 text-yellow-400" />,
    badge: 'TICKETING',
  },
];

export default function CreatePageWizard() {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<PageType>('business');
  const [pageName, setPageName] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('Jamaica 🇯🇲');
  const [city, setCity] = useState('Kingston');
  const [description, setDescription] = useState('');
  const [enableStore, setEnableStore] = useState(true);
  const [isCreated, setIsCreated] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleNameChange(val: string) {
    setPageName(val);
    setPageSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pageName.trim() || !pageSlug.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.set('name', pageName);
    formData.set('slug', pageSlug);
    formData.set('category', selectedType);
    formData.set('description', description);
    const COUNTRY_ISO_MAP: Record<string, string> = {
      'Jamaica 🇯🇲': 'JM',
      'Trinidad & Tobago 🇹🇹': 'TT',
      'Dominican Republic 🇩🇴': 'DO',
      'Barbados 🇧🇧': 'BB',
      'Haiti 🇭🇹': 'HT',
      'Bahamas 🇧🇸': 'BS',
      'Puerto Rico 🇵🇷': 'PR',
      'Global Diaspora 🌍': 'WW',
    };
    formData.set('countryIso', COUNTRY_ISO_MAP[country] || 'JM');

    try {
      const { createBusinessPageAction } = await import('../../../lib/business/actions');
      const res = await createBusinessPageAction({ error: null }, formData);

      if (res.error) {
        setErrorMessage(res.error);
        return;
      }

      if (res.slug) {
        setPageSlug(res.slug);
      }
      setIsCreated(true);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to publish page.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCreated) {
    return (
      <div className="min-h-screen bg-[#090D16] text-slate-100 p-6 max-w-2xl mx-auto flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-500/20">
          <CheckCircle className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-white">
            {pageName} is Officially Published!
          </h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-md">
            Your verified Caribbean Page is live on the Caribbean One network with instant SpotPay storefront and community reach.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/pages/${pageSlug || 'preview'}`}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-2.5 rounded-2xl text-xs transition-all shadow-md shadow-emerald-500/20"
          >
            Visit Live Page →
          </Link>
          <Link
            href="/pages"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-5 py-2.5 rounded-2xl text-xs border border-slate-700 transition-colors"
          >
            All Pages
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-4 md:p-6 max-w-3xl mx-auto space-y-8">
      {/* Step Counter */}
      <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
            Page Onboarding • Step {step} of 3
          </span>
          <h1 className="text-xl md:text-2xl font-black text-white mt-0.5">
            {step === 1 && 'Select Your Page Entity Type'}
            {step === 2 && 'Identity, Geography & Mission'}
            {step === 3 && 'Storefront, Verification & SpotPay'}
          </h1>
        </div>
        <Link href="/pages" className="text-xs text-slate-400 hover:text-white">
          ✕ Cancel
        </Link>
      </div>

      {/* Step 1: Entity Type */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Choose the entity class that best represents your organization or brand on Caribbean One:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {PAGE_TYPE_OPTIONS.map((opt) => (
              <div
                key={opt.type}
                onClick={() => setSelectedType(opt.type)}
                className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  selectedType === opt.type
                    ? 'bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
                    {opt.icon}
                  </div>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-950 text-slate-300 border border-slate-700">
                    {opt.badge}
                  </span>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">{opt.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{opt.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-2.5 rounded-2xl text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20"
            >
              Continue to Identity <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Identity & Location */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Official Page / Brand Name *
              </label>
              <input
                type="text"
                value={pageName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Kingston Artisan Rum Co."
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Custom Page Slug URL
              </label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2 text-xs text-slate-400 font-mono">
                <span>caribbeanone.com/pages/</span>
                <input
                  type="text"
                  value={pageSlug}
                  onChange={(e) => setPageSlug(e.target.value)}
                  className="bg-transparent text-emerald-400 font-bold focus:outline-none flex-1 ml-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Island Nation / Headquarters
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option>Jamaica 🇯🇲</option>
                  <option>Trinidad & Tobago 🇹🇹</option>
                  <option>Dominican Republic 🇩🇴</option>
                  <option>Barbados 🇧🇧</option>
                  <option>Haiti 🇭🇹</option>
                  <option>Bahamas 🇧🇸</option>
                  <option>Puerto Rico 🇵🇷</option>
                  <option>Global Diaspora 🌍</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  City / District
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Kingston or Miami"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                About / Mission &amp; Overview
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your organization, mission, and services to the Caribbean diaspora..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              disabled={!pageName.trim()}
              onClick={() => setStep(3)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-2.5 rounded-2xl text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              Continue to Commerce <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Storefront & SpotPay Settlement */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-400" /> Digital Storefront &amp; Social Commerce
            </h3>
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <p className="text-xs font-bold text-white">Enable Caribbean One Storefront</p>
                <p className="text-[11px] text-slate-400">
                  Allows selling physical goods, digital assets, tickets, and services directly on your Page.
                </p>
              </div>
              <input
                type="checkbox"
                checked={enableStore}
                onChange={(e) => setEnableStore(e.target.checked)}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" /> Verification Class
            </h3>
            <p className="text-xs text-slate-400">
              Your page will receive a verified badge reflecting your entity class:
            </p>
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <span className="text-xs font-black text-white capitalize">{selectedType} Verified Tier</span>
              <span className="text-[10px] text-slate-400">• Includes dispute protection &amp; instant SpotPay settlement</span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
              {errorMessage}
            </div>
          )}

          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-slate-950 font-black px-8 py-3 rounded-2xl text-xs flex items-center gap-2 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" /> {isSubmitting ? 'Publishing Page...' : 'Publish Verified Page'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
