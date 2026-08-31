import React from 'react';
import { Search, Sparkles, Calendar, Users, Store, FileText, ArrowLeft, Mic, Radio, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { askCaribbean, type AskResult } from '../../lib/ai/ask-caribbean';

export const dynamic = 'force-dynamic';

const ENTITY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  events: { label: 'Events', icon: <Calendar className="w-4 h-4" />, color: 'text-brand-goldenHour' },
  communities: { label: 'Communities', icon: <Users className="w-4 h-4" />, color: 'text-brand-caribbeanSea' },
  businesses: { label: 'Businesses', icon: <Store className="w-4 h-4" />, color: 'text-brand-sunriseCoral' },
  posts: { label: 'Posts', icon: <FileText className="w-4 h-4" />, color: 'text-slate-300' },
  profiles: { label: 'Profiles', icon: <FileText className="w-4 h-4" />, color: 'text-slate-300' },
  podcasts: { label: 'Podcasts', icon: <Mic className="w-4 h-4" />, color: 'text-purple-400' },
  videos: { label: 'Live & Videos', icon: <Radio className="w-4 h-4" />, color: 'text-rose-400' },
  products: { label: 'Marketplace', icon: <ShoppingBag className="w-4 h-4" />, color: 'text-emerald-400' },
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q ?? '').trim();
  const response = query ? await askCaribbean(query) : null;

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
        <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-brand-sandstone text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-2xl font-black text-brand-sandstone flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-brand-goldenHour" /> Ask Caribbean
        </h1>
      </div>

      <form action="/search" className="relative">
        <Search className="absolute left-4 top-3.5 w-4 h-4 text-brand-sandstone/60" />
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder='Try: "What Caribbean events are happening in Miami this weekend?"'
          className="w-full bg-brand-dusk border border-slate-700/70 rounded-full pl-11 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-brand-caribbeanSea transition-colors"
        />
      </form>

      {!query && (
        <div className="bg-brand-dusk/60 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-200">CaribAI searches people, events, communities, businesses and posts.</p>
          <p className="text-xs text-brand-sandstone/40">Answers are grounded in live platform data with citations — never invented.</p>
        </div>
      )}

      {response && (
        <>
          <div className="bg-brand-dusk/60 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="font-bold text-slate-300">CaribAI plan:</span>
            {response.plan.entities.map((entity) => (
              <span key={entity} className="px-2 py-0.5 rounded bg-brand-caribbeanSea/10 text-brand-caribbeanSea border border-brand-caribbeanSea/30 font-semibold">
                {entity}
              </span>
            ))}
            {response.plan.locationHints.map((hint) => (
              <span key={hint} className="px-2 py-0.5 rounded bg-brand-goldenHour/10 text-amber-300 border border-brand-goldenHour/30 font-semibold">
                📍 {hint}
              </span>
            ))}
            {response.plan.timeWindowDays && (
              <span className="px-2 py-0.5 rounded bg-brand-sunriseCoral/10 text-emerald-300 border border-brand-sunriseCoral/30 font-semibold">
                next {response.plan.timeWindowDays}d
              </span>
            )}
          </div>

          {response.results.length === 0 ? (
            <div className="bg-brand-dusk/60 border border-slate-800 rounded-2xl p-8 text-center">
              <p className="text-sm font-semibold text-slate-200">No grounded results yet.</p>
              <p className="text-xs text-brand-sandstone/40 mt-1">CaribAI only answers with real platform content — check back as the community grows.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {response.results.map((result: AskResult) => {
                const meta = ENTITY_META[result.entityType] ?? ENTITY_META.posts;
                return (
                  <Link
                    key={`${result.entityType}-${result.entityId}`}
                    href={result.href}
                    className="block bg-brand-dusk/70 border border-slate-800 hover:border-brand-caribbeanSea/40 rounded-2xl p-4 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={meta.color}>{meta.icon}</span>
                      <span className="text-[10px] font-bold uppercase text-brand-sandstone/40">{meta.label}</span>
                    </div>
                    <h3 className="text-sm font-bold text-brand-sandstone">{result.title}</h3>
                    <p className="text-xs text-brand-sandstone/60 mt-1">{result.snippet}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
