'use client';

import React, { useState } from 'react';
import { BarChart2, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { votePollAction } from '../../lib/polls/actions';
import type { PollData, PollOptionData } from '../../lib/polls/types';

export interface InteractivePollWidgetProps {
  initialPoll: PollData;
  currentUserId?: string;
  onVoteSuccess?: (updatedPoll: PollData) => void;
}

export default function InteractivePollWidget({
  initialPoll,
  currentUserId,
  onVoteSuccess,
}: InteractivePollWidgetProps) {
  const [poll, setPoll] = useState<PollData>(initialPoll);
  const [isVoting, setIsVoting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasVoted = Boolean(poll.userVotedOptionId);
  const isExpired = poll.isExpired || new Date(poll.expiresAt).getTime() <= Date.now();
  const showResults = hasVoted || isExpired;

  // Find the highest vote count to highlight the leader
  const maxVotes = Math.max(...poll.options.map((o) => o.votesCount), 0);

  const handleVote = async (optionId: string) => {
    if (showResults || isVoting) return;

    if (!currentUserId) {
      setErrorMessage('Please sign in to participate in polls.');
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }

    setIsVoting(true);
    setErrorMessage(null);

    // Optimistic UI update
    const previousState = { ...poll };
    const optimisticTotal = poll.totalVotes + 1;
    const optimisticOptions = poll.options.map((opt) => {
      const isSelected = opt.id === optionId;
      const count = isSelected ? opt.votesCount + 1 : opt.votesCount;
      const percentage = Math.round((count / optimisticTotal) * 100);
      return { ...opt, votesCount: count, percentage };
    });

    setPoll({
      ...poll,
      totalVotes: optimisticTotal,
      options: optimisticOptions,
      userVotedOptionId: optionId,
    });

    try {
      const res = await votePollAction(poll.id, optionId);
      if (!res.success) {
        // Rollback optimistic update
        setPoll(previousState);
        setErrorMessage(res.error || 'Failed to record vote.');
      } else if (res.poll) {
        setPoll(res.poll);
        if (onVoteSuccess) onVoteSuccess(res.poll);
      }
    } catch {
      setPoll(previousState);
      setErrorMessage('A network error occurred while voting.');
    } finally {
      setIsVoting(false);
    }
  };

  const formattedExpires = () => {
    const diff = new Date(poll.expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Final Results';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${Math.max(1, hours)}h remaining`;
    return `${Math.floor(hours / 24)}d remaining`;
  };

  return (
    <div className="w-full my-3 p-4 rounded-2xl bg-[#0C1226]/90 border border-white/10 shadow-lg text-brand-sandstone">
      {/* Header: Question + Status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-brand-caribbeanSea flex-shrink-0" />
          <h4 className="text-sm font-bold text-white leading-snug">{poll.question}</h4>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-white/50 shrink-0 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
          <Clock className="w-3 h-3 text-brand-caribbeanSea" />
          <span>{formattedExpires()}</span>
        </div>
      </div>

      {/* Options List */}
      <div className="space-y-2">
        {poll.options.map((opt) => {
          const isSelected = poll.userVotedOptionId === opt.id;
          const isLeader = maxVotes > 0 && opt.votesCount === maxVotes;
          const percentage = opt.percentage ?? (poll.totalVotes > 0 ? Math.round((opt.votesCount / poll.totalVotes) * 100) : 0);

          if (showResults) {
            return (
              <div
                key={opt.id}
                className={`relative overflow-hidden rounded-xl border p-2.5 transition-all ${
                  isSelected
                    ? 'border-brand-caribbeanSea/60 bg-brand-caribbeanSea/10 ring-1 ring-brand-caribbeanSea/40'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                {/* Background Progress Bar */}
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${
                    isLeader
                      ? 'bg-gradient-to-r from-brand-caribbeanSea/25 to-brand-goldenHour/25'
                      : 'bg-white/10'
                  }`}
                  style={{ width: `${percentage}%` }}
                />

                {/* Content Overlay */}
                <div className="relative z-10 flex items-center justify-between gap-2 text-xs font-semibold">
                  <div className="flex items-center gap-2 min-w-0">
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-caribbeanSea flex-shrink-0" />
                    )}
                    <span className={`truncate ${isSelected ? 'text-white font-bold' : 'text-slate-200'}`}>
                      {opt.optionText}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-white shrink-0">
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          }

          // Pre-voting state (clickable options)
          return (
            <button
              key={opt.id}
              type="button"
              disabled={isVoting}
              onClick={() => handleVote(opt.id)}
              className="w-full text-left p-3 rounded-xl border border-white/10 hover:border-brand-caribbeanSea/60 hover:bg-brand-caribbeanSea/10 bg-white/5 transition-all text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between group active:scale-[0.99]"
            >
              <span className="truncate">{opt.optionText}</span>
              <div className="w-4 h-4 rounded-full border border-white/30 group-hover:border-brand-caribbeanSea flex items-center justify-center shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-brand-caribbeanSea transition-colors" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Info & Feedback */}
      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/50">
        <span>{poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}</span>
        {isVoting && (
          <span className="flex items-center gap-1 text-brand-caribbeanSea">
            <Loader2 className="w-3 h-3 animate-spin" /> Recording vote...
          </span>
        )}
        {errorMessage && (
          <span className="text-rose-400 font-medium">{errorMessage}</span>
        )}
      </div>
    </div>
  );
}
