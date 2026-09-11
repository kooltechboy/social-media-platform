import React from 'react';
import { REACTION_EMOJI_MAP, VALID_REACTION_TYPES, type ReactionType } from './reaction-picker';

interface ReactionSummaryBarProps {
  counts: Record<ReactionType, number>;
  total: number;
  className?: string;
}

export default function ReactionSummaryBar({ counts, total, className = '' }: ReactionSummaryBarProps) {
  if (total === 0) return null;

  const topTypes = VALID_REACTION_TYPES
    .filter(t => counts[t] > 0)
    .sort((a, b) => counts[b] - counts[a])
    .slice(0, 3);

  return (
    <div className={`flex items-center gap-1 text-xs text-slate-400 ${className}`}>
      <span className="flex items-center -space-x-0.5">
        {topTypes.map(t => (
          <span key={t} className="text-sm leading-none">{REACTION_EMOJI_MAP[t].emoji}</span>
        ))}
      </span>
      <span>{total.toLocaleString()}</span>
    </div>
  );
}
