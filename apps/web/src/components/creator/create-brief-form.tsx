'use client';

import React, { useState } from 'react';
import { createBriefAction } from '../../lib/marketplace/creator-marketplace-actions';

const CONTENT_TYPES = ['Sponsored Post', 'Reel', 'Story', 'Live Stream', 'Podcast Mention', 'Event Appearance'];
const CARIBBEAN_ISLANDS = [
  'Barbados', 'Jamaica', 'Trinidad & Tobago', 'Grenada', 'St. Lucia', 'Dominican Republic',
  'Haiti', 'Guyana', 'Belize', 'Bahamas', 'Antigua & Barbuda', 'St. Kitts & Nevis',
  'Dominica', 'St. Vincent', 'Montserrat', 'Anguilla', 'BVI', 'USVI', 'Puerto Rico',
  'Cuba', 'Cayman Islands', 'Turks & Caicos', 'Aruba', 'Curaçao', 'Bonaire',
];

function toggleItem(arr: string[], item: string) {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
}

export default function CreateBriefForm({ onSuccess }: { onSuccess?: (id: string) => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    budget_min: '',
    budget_max: '',
    deadline: '',
    content_types: [] as string[],
    target_islands: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createBriefAction({
      title: form.title,
      description: form.description,
      budget_range_cents_min: Math.round(parseFloat(form.budget_min || '0') * 100),
      budget_range_cents_max: Math.round(parseFloat(form.budget_max || '0') * 100),
      content_types: form.content_types,
      target_islands: form.target_islands,
      target_diaspora_cities: [],
      deadline: form.deadline,
    });

    setSubmitting(false);
    if (result.error) { setError(result.error); return; }
    setSuccess(true);
    if (result.id && onSuccess) onSuccess(result.id);
  };

  if (success) {
    return (
      <div className="p-6 text-center text-brand-caribbeanSea font-bold rounded-2xl border border-brand-caribbeanSea/30 bg-brand-caribbeanSea/10">
        ✅ Campaign brief posted successfully! Creators can now apply.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-bold text-slate-300 block mb-1">Campaign Title *</label>
        <input required value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Caribbean Summer Music Campaign 2026"
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:border-brand-caribbeanSea outline-none"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-slate-300 block mb-1">Description *</label>
        <textarea required value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={4}
          placeholder="Describe your campaign goals, target audience, and what you're looking for in a creator..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:border-brand-caribbeanSea outline-none resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Min Budget (USD)</label>
          <input type="number" min="0" step="50" value={form.budget_min}
            onChange={e => setForm(f => ({ ...f, budget_min: e.target.value }))}
            placeholder="500"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:border-brand-caribbeanSea outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Max Budget (USD)</label>
          <input type="number" min="0" step="50" value={form.budget_max}
            onChange={e => setForm(f => ({ ...f, budget_max: e.target.value }))}
            placeholder="5000"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:border-brand-caribbeanSea outline-none"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-300 block mb-1">Application Deadline</label>
        <input type="date" value={form.deadline}
          onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:border-brand-caribbeanSea outline-none"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-slate-300 block mb-2">Content Types</label>
        <div className="flex flex-wrap gap-2">
          {CONTENT_TYPES.map(ct => (
            <button key={ct} type="button"
              onClick={() => setForm(f => ({ ...f, content_types: toggleItem(f.content_types, ct) }))}
              className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                form.content_types.includes(ct)
                  ? 'bg-brand-twilight text-brand-sandstone border-brand-twilight'
                  : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >{ct}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-300 block mb-2">Target Islands</label>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
          {CARIBBEAN_ISLANDS.map(island => (
            <button key={island} type="button"
              onClick={() => setForm(f => ({ ...f, target_islands: toggleItem(f.target_islands, island) }))}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${
                form.target_islands.includes(island)
                  ? 'bg-brand-sunriseCoral/80 text-slate-900 border-brand-sunriseCoral'
                  : 'bg-transparent text-slate-500 border-slate-800 hover:border-slate-600'
              }`}
            >{island}</button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-400 font-medium">{error}</p>}

      <button type="submit" disabled={submitting}
        className="w-full py-3 rounded-xl font-black text-sm bg-brand-sunriseCoral text-slate-900 hover:bg-orange-400 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Posting Campaign...' : '🚀 Post Campaign Brief'}
      </button>
    </form>
  );
}
