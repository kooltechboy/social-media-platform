import React from 'react';
import { Landmark, Crown, ShieldCheck, Compass } from 'lucide-react';
import type { FounderStatus } from '../../lib/recognition/types';

interface FounderBadgeProps {
  founder: FounderStatus;
  size?: 'sm' | 'md' | 'lg';
  showProgramName?: boolean;
  className?: string;
}

export default function FounderBadge({
  founder,
  size = 'md',
  showProgramName = false,
  className = '',
}: FounderBadgeProps) {
  if (!founder || !founder.is_founder) return null;

  const numberStr = founder.formatted_number || (founder.founder_number ? `#${String(founder.founder_number).padStart(4, '0')}` : '');
  const isElite = (founder.founder_number && founder.founder_number <= 100) || founder.designation?.includes('Elite');

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-black',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  if (isElite) {
    return (
      <span
        title={`TUKUBI Founding Elite ${numberStr} — Historical Pioneer`}
        className={`inline-flex items-center font-black rounded-full bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-amber-500/20 text-amber-300 border border-amber-400/50 shadow-md shadow-amber-950/40 backdrop-blur-sm ${sizeStyles[size]} ${className}`}
      >
        <Crown className={`${iconSizes[size]} text-amber-400 animate-pulse`} />
        <span>{showProgramName ? 'TUKUBI Founding Elite' : 'Founding Elite'}</span>
        {numberStr && <span className="font-mono text-amber-200 tracking-wider ml-0.5">{numberStr}</span>}
      </span>
    );
  }

  return (
    <span
      title={`TUKUBI Founding Member ${numberStr} — Permanent Historical Recognition`}
      className={`inline-flex items-center font-black rounded-full bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-500/10 text-amber-200 border border-amber-500/40 shadow-sm backdrop-blur-sm ${sizeStyles[size]} ${className}`}
    >
      <Landmark className={`${iconSizes[size]} text-amber-400`} />
      <span>{showProgramName ? 'TUKUBI Founding 1000' : 'Founding 1000'}</span>
      {numberStr && <span className="font-mono text-amber-300 tracking-wider ml-0.5">{numberStr}</span>}
    </span>
  );
}
