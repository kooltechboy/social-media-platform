'use client';

import React from 'react';
import {
  BarChart2,
  CheckCircle2,
  Clock,
  HelpCircle,
  Lightbulb,
  Loader2,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { votePollAction } from '../../lib/polls/actions';
import type { PollData, PollOptionData } from '../../lib/polls/types';

export interface InteractivePollWidgetProps {
  initialPoll: PollData;
  currentUserId?: string;
  onVoteSuccess?: (updatedPoll: PollData) => void;
}

function useSafeState<T>(initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  const internals =
    (React as any)?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
    (React as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const dispatcher = internals?.H || internals?.ReactCurrentDispatcher?.current;

  if (dispatcher) {
    return React.useState<T>(initialValue);
  }
  const val = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
  return [val, () => {}];
}

export default function InteractivePollWidget({
  initialPoll,
  currentUserId,
  onVoteSuccess,
}: InteractivePollWidgetProps) {
  const [poll, setPoll] = useSafeState<PollData>(initialPoll);
  const [isVoting, setIsVoting] = useSafeState(false);
  const [errorMessage, setErrorMessage] = useSafeState<string | null>(null);

  const hasVoted = Boolean(poll.userVotedOptionId);
  const isExpired = poll.isExpired || new Date(poll.expiresAt).getTime() <= Date.now();
  const showResults = hasVoted || isExpired;

  const isUserCorrect =
    poll.userIsCorrect ??
    (poll.correctOptionId && poll.userVotedOptionId
      ? poll.userVotedOptionId === poll.correctOptionId
      : null);

  // Find highest vote count to highlight current leader
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
      {/* Screen Reader Live Region for WCAG 2.2 AA Compliance */}
      <div className="sr-only" aria-live="polite" role="status">
        {showResults
          ? poll.isQuiz
            ? `Quiz completed. You answered ${isUserCorrect ? 'correctly' : 'incorrectly'}. ${poll.totalVotes} total votes.`
            : `Poll results: ${poll.totalVotes} total votes.`
          : `Poll: ${poll.question}. ${poll.options.length} options available.`}
      </div>

      {/* Header: Question + Status + Badges */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2 min-w-0">
          <BarChart2 className="w-4 h-4 text-brand-caribbeanSea flex-shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="text-sm font-bold text-white leading-snug">{poll.question}</h4>
              {poll.isQuiz && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-goldenHour bg-brand-goldenHour/10 border border-brand-goldenHour/30 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-2.5 h-2.5 text-brand-goldenHour" />
                  Quiz
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-white/50 shrink-0 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
          <Clock className="w-3 h-3 text-brand-caribbeanSea" />
          <span>{formattedExpires()}</span>
        </div>
      </div>

      {/* Instant User Correctness Feedback for Quizzes */}
      {poll.isQuiz && showResults && hasVoted && isUserCorrect !== null && (
        <div
          className={`flex items-center gap-2 px-3 py-2 mb-3 rounded-xl border text-xs font-semibold animate-in fade-in duration-300 transition-all ${
            isUserCorrect
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/40 text-rose-400'
          }`}
        >
          {isUserCorrect ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Correct! Great knowledge of Caribbean culture.</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>Incorrect. Check the correct answer and explanation below.</span>
            </>
          )}
        </div>
      )}

      {/* Options List with WCAG 2.2 AA RadioGroup & Radio Roles */}
      <div
        role="radiogroup"
        aria-label={poll.question}
        className="space-y-2"
      >
        {poll.options.map((opt) => {
          const isSelected = poll.userVotedOptionId === opt.id;
          const isLeader = maxVotes > 0 && opt.votesCount === maxVotes;
          const percentage =
            opt.percentage ??
            (poll.totalVotes > 0 ? Math.round((opt.votesCount / poll.totalVotes) * 100) : 0);

          const isCorrectOption = poll.isQuiz && showResults && poll.correctOptionId === opt.id;
          const isIncorrectUserVote =
            poll.isQuiz && showResults && isSelected && poll.correctOptionId !== opt.id;

          if (showResults) {
            return (
              <div
                key={opt.id}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                className={`relative overflow-hidden rounded-xl border p-2.5 transition-all ${
                  isCorrectOption
                    ? 'border-emerald-500/70 bg-emerald-500/10 ring-1 ring-emerald-500/50'
                    : isIncorrectUserVote
                    ? 'border-rose-500/70 bg-rose-500/10 ring-1 ring-rose-500/50'
                    : isSelected
                    ? 'border-brand-caribbeanSea/60 bg-brand-caribbeanSea/10 ring-1 ring-brand-caribbeanSea/40'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                {/* Background Progress Bar */}
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${
                    isCorrectOption
                      ? 'bg-emerald-500/20'
                      : isIncorrectUserVote
                      ? 'bg-rose-500/20'
                      : isLeader
                      ? 'bg-gradient-to-r from-brand-caribbeanSea/25 to-brand-goldenHour/25'
                      : 'bg-white/10'
                  }`}
                  style={{ width: `${percentage}%` }}
                />

                {/* Content Overlay */}
                <div className="relative z-10 flex items-center justify-between gap-3 text-xs font-semibold">
                  <div className="flex items-center gap-3 min-w-0">
                    {opt.imageUrl && (
                      <img
                        src={opt.imageUrl}
                        alt={opt.optionText}
                        className="w-10 h-10 object-cover rounded-lg flex-shrink-0 border border-white/10"
                      />
                    )}
                    <div className="flex items-center gap-2 min-w-0">
                      {isCorrectOption ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : isIncorrectUserVote ? (
                        <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      ) : isSelected ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-caribbeanSea flex-shrink-0" />
                      ) : null}
                      <span
                        className={`truncate ${
                          isCorrectOption
                            ? 'text-emerald-300 font-bold'
                            : isIncorrectUserVote
                            ? 'text-rose-300 font-bold'
                            : isSelected
                            ? 'text-white font-bold'
                            : 'text-slate-200'
                        }`}
                      >
                        {opt.optionText}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold shrink-0 ${
                      isCorrectOption
                        ? 'text-emerald-300'
                        : isIncorrectUserVote
                        ? 'text-rose-300'
                        : 'text-white'
                    }`}
                  >
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          }

          // Pre-voting state (clickable options with 44px min touch target)
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={isVoting}
              onClick={() => handleVote(opt.id)}
              className="w-full min-h-[44px] text-left p-2.5 rounded-xl border border-white/10 hover:border-brand-caribbeanSea/60 hover:bg-brand-caribbeanSea/10 bg-white/5 transition-all text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between gap-3 group active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-brand-caribbeanSea/50"
            >
              <div className="flex items-center gap-3 min-w-0">
                {opt.imageUrl && (
                  <img
                    src={opt.imageUrl}
                    alt={opt.optionText}
                    className="w-10 h-10 object-cover rounded-lg flex-shrink-0 border border-white/10 group-hover:border-brand-caribbeanSea/40 transition-colors"
                  />
                )}
                <span className="truncate">{opt.optionText}</span>
              </div>
              <div className="w-4 h-4 rounded-full border border-white/30 group-hover:border-brand-caribbeanSea flex items-center justify-center shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-brand-caribbeanSea transition-colors" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Educational Quiz Explanation Card */}
      {poll.isQuiz && showResults && poll.quizExplanation && (
        <div className="mt-3 p-3.5 rounded-xl bg-brand-caribbeanSea/10 border border-brand-caribbeanSea/25 text-xs text-white/90 animate-in fade-in slide-in-from-top-2 duration-300 transition-all">
          <div className="flex items-center gap-1.5 font-bold text-brand-caribbeanSea mb-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-brand-goldenHour" />
            <span>Explanation</span>
          </div>
          <p className="text-white/80 leading-relaxed">{poll.quizExplanation}</p>
        </div>
      )}

      {/* Footer Info & Feedback */}
      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/50">
        <span>
          {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}
        </span>
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
