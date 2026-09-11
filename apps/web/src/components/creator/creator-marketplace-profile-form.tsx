'use client';

import React, { useState } from 'react';
import { upsertCreatorMarketplaceProfileAction } from '../../lib/marketplace/creator-marketplace-actions';

const CATEGORIES = ['Music', 'Food & Beverage', 'Fashion', 'Sports', 'Comedy', 'Travel', 'Business', 'Art & Culture', 'Beauty', 'Tech'];
const COLLAB_TYPES = ['Sponsored Post', 'Reel', 'Story', 'Live Stream', 'Podcast', 'Event Appearance', 'Product Review', 'Giveaway'];
const LANGUAGES = ['English', 'Spanish', 'Haitian Kreyòl', 'French', 'Dutch', 'Papiamento'];

interface ExistingProfile {
  categories?: string[];
  min_collaboration_budget_cents?: number;
  typical_turnaround_days?: number;
  languages?: string[];
  collaboration_types?: string[];
  media_kit_url?: string | null;
  is_available?: boolean;
}

function toggleItem(arr: string[], item: string) {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
}

export default function CreatorMarketplaceProfileForm({
  existing,
  onSuccess,
}: {
  existing?: ExistingProfile | null;
  onSuccess?: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    categories: existing?.categories || [],
    min_budget: existing?.min_collaboration_budget_cents
      ? String(existing.min_collaboration_budget_cents / 100)
      : '',
    turnaround: String(existing?.typical_turnaround_days || 7),
    languages: existing?.languages || ['English'],
    collab_types: existing?.collaboration_types || [],
    media_kit_url: existing?.media_kit_url || '',
    is_available: existing?.is_available ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await upsertCreatorMarketplaceProfileAction({
      categories: form.categories,
      min_collaboration_budget_cents: Math.round(parseFloat(form.min_budget || '0') * 100),
      typical_turnaround_days: parseInt(form.turnaround, 10) || 7,
      languages: form.languages,
      collaboration_types: form.collab_types,
      media_kit_url: form.media_kit_url || undefined,
      is_available: form.is_available,
    });

    setSubmitting(false);
    if (result.error) { setError(result.error); return; }
    setSuccess(true);
    onSuccess?.();
  };

  if (success) {
    return (
      <div className="p-6 text-center text-brand-caribbeanSea font-bold rounded-2xl border border-brand-caribbeanSea/30 bg-brand-caribbeanSea/10">
        ✅ Creator marketplace profile updated!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-xs font-bold text-slate-300 block mb-2">Your Content Categories</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <button key={c} type="button"
              onClick={() => setForm(f => ({ ...f, categories: toggleItem(f.categories, c) }))}
              className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                form.categories.includes(c)
                  ? 'bg-brand-twilight text-brand-sandstone border-brand-twilight'
                  : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >{c}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Min. Budget (USD)</label>
          <input type="number" min="0" step="50" value={form.min_budget}
            onChange={e => setForm(f => ({ ...f, min_budget: e.target.value }))}
            placeholder="500"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:border-brand-caribbeanSea outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Turnaround (days)</label>
          <input type="number" min="1" max="90" value={form.turnaround}
            onChange={e => setForm(f => ({ ...f, turnaround: e.target.value }))}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:border-brand-caribbeanSea outline-none"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-300 block mb-2">Languages</label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(l => (
            <button key={l} type="button"
              onClick={() => setForm(f => ({ ...f, languages: toggleItem(f.languages, l) }))}
              className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                form.languages.includes(l)
                  ? 'bg-brand-caribbeanSea/20 text-brand-caribbeanSea border-brand-caribbeanSea/50'
                  : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >{l}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-300 block mb-2">Collaboration Types</label>
        <div className="flex flex-wrap gap-2">
          {COLLAB_TYPES.map(ct => (
            <button key={ct} type="button"
              onClick={() => setForm(f => ({ ...f, collab_types: toggleItem(f.collab_types, ct) }))}
              className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                form.collab_types.includes(ct)
                  ? 'bg-brand-sunriseCoral/20 text-brand-sunriseCoral border-brand-sunriseCoral/50'
                  : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >{ct}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-300 block mb-1">Media Kit URL (optional)</label>
        <input type="url" value={form.media_kit_url}
          onChange={e => setForm(f => ({ ...f, media_kit_url: e.target.value }))}
          placeholder="https://drive.google.com/your-media-kit"
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:border-brand-caribbeanSea outline-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <button type="button"
          onClick={() => setForm(f => ({ ...f, is_available: !f.is_available }))}
          className={`relative w-11 h-6 rounded-full transition-colors ${form.is_available ? 'bg-brand-caribbeanSea' : 'bg-slate-700'}`}
          role="switch" aria-checked={form.is_available}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.is_available ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
        <label className="text-xs font-medium text-slate-300">Available for new collaborations</label>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button type="submit" disabled={submitting}
        className="w-full py-3 rounded-xl font-black text-sm bg-brand-caribbeanSea text-slate-900 hover:bg-emerald-400 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Saving...' : '✅ Save Creator Profile'}
      </button>
    </form>
  );
}
