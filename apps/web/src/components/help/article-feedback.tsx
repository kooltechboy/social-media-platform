'use client';

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Send } from 'lucide-react';

export interface ArticleFeedbackProps {
  articleId: string;
  slug: string;
}

export default function ArticleFeedback({ articleId, slug }: ArticleFeedbackProps) {
  const [vote, setVote] = useState<'helpful' | 'not_helpful' | null>(null);
  const [showTextarea, setShowTextarea] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async (isHelpful: boolean) => {
    const newVote = isHelpful ? 'helpful' : 'not_helpful';
    setVote(newVote);
    if (!isHelpful) {
      setShowTextarea(true);
    } else {
      await submitFeedback(isHelpful, '');
    }
  };

  const submitFeedback = async (isHelpful: boolean, text: string) => {
    setIsSubmitting(true);
    try {
      await fetch('/api/v1/help/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId, slug, is_helpful: isHelpful, feedback_text: text }),
      });
      setSubmitted(true);
      setShowTextarea(false);
    } catch {
      // silently fail — analytics failure should not break UX
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-5 rounded-2xl border border-brand-caribbeanSea/30 bg-brand-caribbeanSea/10 text-center">
        <p className="text-sm font-semibold text-brand-caribbeanSea">Thanks for your feedback! 🌴</p>
        <p className="text-xs text-brand-sandstone/60 mt-1">Your input helps us improve TUKUBI Help.</p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-4">
      <p className="text-sm font-semibold text-white text-center">Was this article helpful?</p>
      <div className="flex justify-center gap-3">
        <button
          onClick={() => handleVote(true)}
          disabled={vote !== null}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all min-h-[44px] border ${
            vote === 'helpful'
              ? 'bg-brand-caribbeanSea/20 border-brand-caribbeanSea/50 text-brand-caribbeanSea'
              : 'bg-white/5 border-white/15 text-brand-sandstone/80 hover:border-brand-caribbeanSea/40 hover:text-brand-caribbeanSea'
          }`}
          aria-label="Mark as helpful"
        >
          <ThumbsUp className="w-4 h-4" /> Yes
        </button>
        <button
          onClick={() => handleVote(false)}
          disabled={vote !== null}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all min-h-[44px] border ${
            vote === 'not_helpful'
              ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
              : 'bg-white/5 border-white/15 text-brand-sandstone/80 hover:border-orange-500/30 hover:text-orange-400'
          }`}
          aria-label="Mark as not helpful"
        >
          <ThumbsDown className="w-4 h-4" /> No
        </button>
      </div>
      {showTextarea && (
        <div className="space-y-3">
          <label className="block text-sm text-brand-sandstone/70">
            What were you looking for?
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Tell us what would make this article more helpful..."
              className="mt-2 w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-caribbeanSea/50 resize-none min-h-[80px]"
              maxLength={500}
            />
          </label>
          <button
            onClick={() => submitFeedback(false, feedbackText)}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black text-sm transition-all min-h-[44px] disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> {isSubmitting ? 'Sending...' : 'Send Feedback'}
          </button>
        </div>
      )}
    </div>
  );
}
