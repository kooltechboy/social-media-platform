import React from 'react';
import type { ReputationSummary } from '../../lib/recognition/types';

interface ReputationIndicatorProps {
  reputation: ReputationSummary;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ReputationIndicator({
  reputation,
  size = 'md',
  className = '',
}: ReputationIndicatorProps) {
  if (!reputation) return null;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-black',
  };

  return (
    <div
      title={`TUKUBI Reputation: Level ${reputation.level_tier} (${reputation.level_name})`}
      className={`inline-flex items-center font-bold rounded-full bg-slate-900/90 text-brand-sandstone border border-slate-800 shadow-sm ${sizeClasses[size]} ${className}`}
    >
      <span className="text-sm select-none">{reputation.level_emoji}</span>
      <span className="text-slate-300 font-semibold">{reputation.level_name}</span>
    </div>
  );
}
