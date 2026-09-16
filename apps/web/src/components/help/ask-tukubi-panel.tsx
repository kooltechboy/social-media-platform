'use client';

import React, { useState } from 'react';
import { Sparkles, Send, BookOpen, ArrowRight, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category_title: string | null;
}

export default function AskTukubiPanel() {
  const [question, setQuestion] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [responseArticles, setResponseArticles] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/v1/help/search?q=${encodeURIComponent(question.trim())}&limit=4`);
      if (res.ok) {
        const data = await res.json();
        setResponseArticles(data.results || []);
      }
    } catch {
      setResponseArticles([]);
    } finally {
      setIsSearching(false);
    }
  };

  const sampleQuestions = [
    'How do I create a Reel?',
    'What is the difference between Friends and Members?',
    'How do Creator payouts work in the Financial Center?',
    'How do I join a Diaspora Community?',
  ];

  return (
    <div className="surface-card rounded-3xl p-6 sm:p-8 border border-brand-caribbeanSea/30 bg-gradient-to-br from-brand-caribbeanSea/10 via-slate-900/90 to-brand-sunriseCoral/10 shadow-2xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral p-0.5 shadow-md">
          <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center text-brand-caribbeanSea">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            Ask TUKUBI Assistant
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/30">
              Instant Answer
            </span>
          </h3>
          <p className="text-xs text-brand-sandstone/70">
            Ask any question about using TUKUBI features, creators, communities or accounts.
          </p>
        </div>
      </div>

      <form onSubmit={handleAsk} className="relative">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. How do I start a livestream or sell on Marketplace?"
          className="w-full bg-slate-950/80 border border-white/20 rounded-2xl pl-4 pr-28 py-3.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-brand-caribbeanSea/60 focus:ring-2 focus:ring-brand-caribbeanSea/20 transition-all"
        />
        <button
          type="submit"
          disabled={isSearching || !question.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral hover:brightness-110 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 disabled:opacity-50"
        >
          {isSearching ? (
            <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-3.5 h-3.5" /> Ask
            </>
          )}
        </button>
      </form>

      {!hasSearched && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-brand-sandstone/50 uppercase tracking-wider">Suggested Questions</p>
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((sq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQuestion(sq);
                }}
                className="text-xs text-brand-sandstone/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-1.5 transition-all text-left"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasSearched && (
        <div className="space-y-3 pt-2 border-t border-white/10">
          <p className="text-xs font-bold text-brand-sandstone/80">
            {responseArticles.length > 0 ? 'Top Matching Knowledge Base Guides:' : 'No exact guide found. Try exploring by category or rephrasing.'}
          </p>
          {responseArticles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {responseArticles.map((art) => (
                <Link
                  key={art.id}
                  href={`/help/${art.slug}`}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-white/10 hover:border-brand-caribbeanSea/40 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-black text-white group-hover:text-brand-caribbeanSea transition-colors line-clamp-1">
                      {art.title}
                    </p>
                    {art.description && (
                      <p className="text-[11px] text-brand-sandstone/70 line-clamp-2 leading-relaxed">
                        {art.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/5 text-[10px] text-brand-caribbeanSea">
                    <span>{art.category_title || 'Guide'}</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-brand-sandstone/70">
              <HelpCircle className="w-4 h-4 text-brand-goldenHour" />
              <span>Browse all categories below or submit a question to the TUKUBI Support Team.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
