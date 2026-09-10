'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, RefreshCcw, Send } from 'lucide-react';
import { creatorAIInsightAction } from '../../lib/ai/creator-actions';

interface CreatorAiInsightsPanelProps {
  stats: {
    postsCount: number;
    followersCount: number;
    recentEngagement: number;
  };
}

const PRESET_QUESTIONS = [
  "What should I post this week?",
  "Why might my recent content underperform?",
  "Suggest 5 content ideas for my audience",
  "When is the best time to post?",
];

export default function CreatorAiInsightsPanel({ stats }: CreatorAiInsightsPanelProps) {
  const [question, setQuestion] = useState('');
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk(query: string) {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    setInsight(null);
    setQuestion(query);

    try {
      const res = await creatorAIInsightAction(query, stats);
      if (res.error) {
        setError(res.error);
      } else {
        setInsight(res.insight);
      }
    } catch {
      setError('An error occurred while asking AI.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="surface-card rounded-3xl p-6 sm:p-8 space-y-5 border border-brand-goldenHour/30 mt-8 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Sparkles className="w-32 h-32 text-brand-goldenHour" />
      </div>
      
      <div className="relative z-10 space-y-4">
        <h3 className="text-base sm:text-lg font-black text-brand-goldenHour flex items-center gap-2">
          <Sparkles className="w-5 h-5" /> Ask CaribAI Insights
        </h3>
        <p className="text-sm text-brand-sandstone/80">
          Get personalized recommendations, content ideas, and growth strategies based on your TUKUBI performance.
        </p>

        {!insight && !isLoading && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {PRESET_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAsk(q)}
                  className="px-3 py-1.5 rounded-full bg-brand-goldenHour/10 hover:bg-brand-goldenHour/20 border border-brand-goldenHour/20 text-xs font-semibold text-brand-goldenHour transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAsk(question); }} className="flex items-center gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask your own question..."
                className="flex-1 bg-black/40 border border-slate-700 hover:border-brand-goldenHour/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-goldenHour transition-colors"
              />
              <button
                type="submit"
                disabled={!question.trim()}
                className="bg-brand-goldenHour hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> Ask
              </button>
            </form>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8 text-brand-goldenHour">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2 text-sm font-bold">CaribAI is thinking...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm font-semibold">
            {error}
            <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
          </div>
        )}

        {insight && !isLoading && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-5 rounded-2xl bg-black/40 border border-brand-goldenHour/20">
              <p className="text-xs text-brand-sandstone/60 font-bold mb-2">Q: {question}</p>
              <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {insight}
              </div>
            </div>
            <button
              onClick={() => { setInsight(null); setQuestion(''); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-dusk border border-slate-700 hover:border-slate-500 text-sm font-bold text-slate-300 transition-colors"
            >
              <RefreshCcw className="w-4 h-4" /> Ask another question
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
