'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  ArrowLeft,
  Globe,
  ShieldCheck,
  Sparkles,
  Lock,
  UserCheck,
  CheckCircle,
} from 'lucide-react';
import { createCommunityAction, type CommunityActionState } from '../../../lib/communities/actions';
import { CARIBBEAN_TERRITORIES } from '../../../lib/constants/caribbean-territories';
import { DIASPORA_COUNTRIES } from '../../../lib/constants/diaspora-hubs';

const INITIAL_STATE: CommunityActionState = { error: null, success: null };

export default function CreateCommunityPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [joinPolicy, setJoinPolicy] = useState<'public' | 'private' | 'invite_only'>('public');
  const [countryIso, setCountryIso] = useState('');
  const [rules, setRules] = useState('');
  const [state, setState] = useState<CommunityActionState>(INITIAL_STATE);
  const [isPending, startTransition] = useTransition();

  const slugPreview = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set('name', name);
    formData.set('description', description);
    formData.set('joinPolicy', joinPolicy);
    if (countryIso) formData.set('countryIso', countryIso);
    if (rules) formData.set('rules', rules);

    startTransition(async () => {
      const result = await createCommunityAction(INITIAL_STATE, formData);
      setState(result);
      if (!result.error) {
        setTimeout(() => {
          router.push('/communities');
        }, 1200);
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-10 px-4 space-y-6 text-brand-sandstone">
      {/* Top Header / Back Navigation */}
      <div className="flex items-center gap-3">
        <Link
          href="/communities"
          className="p-2.5 rounded-2xl bg-brand-dusk/60 hover:bg-brand-dusk border border-slate-700/60 text-brand-sandstone/70 hover:text-brand-sandstone transition-all"
          aria-label="Back to communities"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/30">
              New Caribbean Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Create a Community
          </h1>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-brand-dusk/80 border border-slate-800 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {state.success ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white">{state.success}</h2>
            <p className="text-xs text-brand-sandstone/60 max-w-sm mx-auto">
              Your community hub has been launched on the Caribbean network. Redirecting to communities...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Community Name */}
            <div className="space-y-2">
              <label htmlFor="comm-name" className="block text-xs font-bold uppercase tracking-wider text-brand-sandstone/80">
                Community Name *
              </label>
              <input
                id="comm-name"
                name="name"
                required
                minLength={3}
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Trinidad & Tobago Tech Leaders"
                className="w-full bg-brand-twilight/90 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-brand-sandstone placeholder-slate-600 focus:outline-none focus:border-brand-caribbeanSea focus:ring-1 focus:ring-brand-caribbeanSea"
              />
              {slugPreview && (
                <p className="text-[11px] text-brand-sandstone/50 font-mono">
                  Slug: /communities/{slugPreview}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="comm-desc" className="block text-xs font-bold uppercase tracking-wider text-brand-sandstone/80">
                Description & Purpose *
              </label>
              <textarea
                id="comm-desc"
                name="description"
                required
                rows={4}
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your community: what are your shared interests, topics, and values?"
                className="w-full bg-brand-twilight/90 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-brand-sandstone placeholder-slate-600 focus:outline-none focus:border-brand-caribbeanSea focus:ring-1 focus:ring-brand-caribbeanSea resize-none"
              />
              <p className="text-[11px] text-brand-sandstone/40 text-right">
                {description.length} / 500
              </p>
            </div>

            {/* Regional / Island Affinity */}
            <div className="space-y-2">
              <label htmlFor="comm-country" className="block text-xs font-bold uppercase tracking-wider text-brand-sandstone/80 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Regional or Island Connection (Optional)
              </label>
              <select
                id="comm-country"
                name="countryIso"
                value={countryIso}
                onChange={(e) => setCountryIso(e.target.value)}
                className="w-full bg-brand-twilight/90 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea cursor-pointer"
              >
                <option value="">Pan-Caribbean & Global Diaspora (All)</option>
                <optgroup label="Caribbean Nations & Territories">
                  {CARIBBEAN_TERRITORIES.map((t) => (
                    <option key={t.iso} value={t.iso}>
                      {t.flag} {t.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Diaspora Nations">
                  {DIASPORA_COUNTRIES.map((c) => (
                    <option key={c.iso} value={c.iso}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Membership Policy */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-sandstone/80 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-goldenHour" /> Membership & Privacy Policy *
              </label>
              <div className="grid sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setJoinPolicy('public')}
                  className={`p-4 rounded-2xl border text-left transition-all space-y-1.5 ${
                    joinPolicy === 'public'
                      ? 'bg-brand-caribbeanSea/15 border-brand-caribbeanSea text-white ring-1 ring-brand-caribbeanSea'
                      : 'bg-brand-twilight/60 border-slate-700/60 text-brand-sandstone/70 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-brand-caribbeanSea" />
                    <span className="text-xs font-black text-white">Public</span>
                  </div>
                  <p className="text-[11px] text-brand-sandstone/60 leading-snug">
                    Anyone can view content and join immediately.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setJoinPolicy('private')}
                  className={`p-4 rounded-2xl border text-left transition-all space-y-1.5 ${
                    joinPolicy === 'private'
                      ? 'bg-brand-goldenHour/15 border-brand-goldenHour text-white ring-1 ring-brand-goldenHour'
                      : 'bg-brand-twilight/60 border-slate-700/60 text-brand-sandstone/70 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-brand-goldenHour" />
                    <span className="text-xs font-black text-white">Approval</span>
                  </div>
                  <p className="text-[11px] text-brand-sandstone/60 leading-snug">
                    Anyone can request to join; moderators approve.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setJoinPolicy('invite_only')}
                  className={`p-4 rounded-2xl border text-left transition-all space-y-1.5 ${
                    joinPolicy === 'invite_only'
                      ? 'bg-brand-sunriseCoral/15 border-brand-sunriseCoral text-white ring-1 ring-brand-sunriseCoral'
                      : 'bg-brand-twilight/60 border-slate-700/60 text-brand-sandstone/70 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-brand-sunriseCoral" />
                    <span className="text-xs font-black text-white">Invite Only</span>
                  </div>
                  <p className="text-[11px] text-brand-sandstone/60 leading-snug">
                    Members can join only through direct invitation.
                  </p>
                </button>
              </div>
            </div>

            {/* Optional Community Rules */}
            <div className="space-y-2 pt-2">
              <label htmlFor="comm-rules" className="block text-xs font-bold uppercase tracking-wider text-brand-sandstone/80">
                Community Guidelines & Rules (Optional)
              </label>
              <textarea
                id="comm-rules"
                name="rules"
                rows={3}
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder="e.g. 1. Respect Caribbean culture. 2. No spam or unverified commercial promotions."
                className="w-full bg-brand-twilight/90 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-brand-sandstone placeholder-slate-600 focus:outline-none focus:border-brand-caribbeanSea focus:ring-1 focus:ring-brand-caribbeanSea resize-none"
              />
            </div>

            {/* Error Message */}
            {state.error && (
              <div role="alert" className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                {state.error}
              </div>
            )}

            {/* Submit Actions */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-800">
              <Link
                href="/communities"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-700 text-xs font-bold text-brand-sandstone/70 hover:text-brand-sandstone hover:bg-slate-800/40 text-center transition-all"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isPending || !name.trim()}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral text-slate-950 font-black text-xs hover:opacity-95 disabled:opacity-50 transition-all shadow-lg shadow-brand-caribbeanSea/20 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <span>Launching Hub...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Launch Community Hub</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
