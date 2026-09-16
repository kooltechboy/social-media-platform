import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, ArrowLeft, ArrowRight, BookOpen, Sparkles, HelpCircle } from 'lucide-react';
import HelpSearch from '../../../components/help/help-search';
import AskTukubiPanel from '../../../components/help/ask-tukubi-panel';
import { searchArticles, HELP_ARTICLES } from '../../../lib/help/articles-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const resolved = searchParams ? await searchParams : {};
  const query = resolved.q || '';
  return {
    title: query ? `Search: "${query}" — TUKUBI Help Center` : 'Search Help — TUKUBI',
    description: `Search results for "${query}" in the official TUKUBI Knowledge Base.`,
  };
}

export default async function HelpSearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const resolved = searchParams ? await searchParams : {};
  const query = (resolved.q || '').trim();
  const results = query ? searchArticles(query, 20) : [];

  return (
    <div className="space-y-8">
      {/* Breadcrumb & Header */}
      <div className="space-y-3">
        <Link
          href="/help"
          className="text-xs font-semibold text-brand-sandstone/60 hover:text-white flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Help Center
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          {query ? (
            <>Search Results for &quot;<span className="text-brand-caribbeanSea">{query}</span>&quot;</>
          ) : (
            'Search TUKUBI Help'
          )}
        </h1>
      </div>

      {/* Search Input Bar */}
      <div className="max-w-2xl">
        <HelpSearch size="sm" placeholder="Search guides, tools, features..." />
      </div>

      {/* Results List */}
      {query && (
        <div className="space-y-4">
          <p className="text-xs text-brand-sandstone/60 font-semibold">
            {results.length === 1 ? '1 result found' : `${results.length} results found`}
          </p>

          {results.length > 0 ? (
            <div className="space-y-3">
              {results.map((art) => (
                <Link
                  key={art.slug}
                  href={`/help/${art.slug}`}
                  className="block p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-caribbeanSea/40 hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-caribbeanSea/15 text-brand-caribbeanSea border border-brand-caribbeanSea/30">
                          {art.categoryTitle}
                        </span>
                        {art.featureSlug && (
                          <span className="text-[10px] font-mono text-brand-sandstone/40">
                            /{art.featureSlug}
                          </span>
                        )}
                      </div>
                      <h2 className="text-base font-bold text-white group-hover:text-brand-caribbeanSea transition-colors">
                        {art.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-brand-sandstone/70 leading-relaxed line-clamp-2">
                        {art.description}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-brand-sandstone/30 group-hover:text-brand-caribbeanSea flex-shrink-0 mt-2 transition-all group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="surface-card rounded-2xl p-8 text-center space-y-4 border border-white/10">
              <HelpCircle className="w-10 h-10 text-brand-goldenHour mx-auto" />
              <div>
                <h2 className="text-base font-bold text-white">No articles matched your search</h2>
                <p className="text-xs text-brand-sandstone/70 mt-1 max-w-md mx-auto">
                  Try checking for spelling errors, using more general keywords, or asking the TUKUBI Assistant below.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ask TUKUBI Assistant */}
      <div className="max-w-2xl pt-4">
        <AskTukubiPanel />
      </div>
    </div>
  );
}
