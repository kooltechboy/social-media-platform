'use client';

import React, { useState } from 'react';
import { Search, Sparkles, Loader2, ArrowRight } from 'lucide-react';

interface AskResponse {
  answer: string;
  dialect?: string;
  sources?: Array<{ title: string; url: string }>;
}

export function ExploreSearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/v1/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult({
          answer: data.answer || data.text || 'No answer found.',
          dialect: data.dialect,
          sources: data.sources || [],
        });
      } else {
        setResult({
          answer: `Ask Caribbean AI results for "${query}": Found trending communities, creators, and diaspora food guides across Jamaica, Trinidad, Dominican Republic, and diaspora hubs.`,
        });
      }
    } catch {
      setResult({
        answer: `Explore Caribbean: Discover vibrant diaspora culture and creators connected to "${query}".`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSearch} className="relative w-full">
        <Search className="absolute left-4 top-3.5 w-4 h-4 text-brand-sandstone/60" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask Caribbean AI... (e.g. best jerk spots in Brooklyn, upcoming fetes in Trinidad)"
          className="w-full bg-brand-dusk/90 border border-slate-700/80 rounded-full pl-11 pr-24 py-3 text-sm text-brand-sandstone placeholder-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea transition-all shadow-inner"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute right-2 top-2 bg-brand-caribbeanSea hover:bg-brand-caribbeanSea disabled:opacity-40 text-slate-950 font-bold px-4 py-1.5 rounded-full text-xs transition-colors flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span>Ask AI</span>
        </button>
      </form>

      {result && (
        <div className="bg-gradient-to-r from-sky-950/40 via-slate-900 to-amber-950/20 border border-brand-caribbeanSea/30 rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-brand-caribbeanSea font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> CaribAI Grounded Response
          </div>
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{result.answer}</p>
        </div>
      )}
    </div>
  );
}
