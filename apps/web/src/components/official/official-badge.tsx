import React from 'react';
import { BadgeCheck, Sparkles, ShieldCheck } from 'lucide-react';

interface OfficialBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export default function OfficialBadge({
  size = 'sm',
  showLabel = false,
  label = 'Official',
  className = '',
}: OfficialBadgeProps) {
  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizes = {
    xs: 'text-[9px] px-1.5 py-0.5',
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  if (!showLabel) {
    return (
      <span
        title="Official TUKUBI Platform Account"
        className={`inline-flex items-center justify-center text-[#0EA5E9] hover:text-[#38BDF8] transition-colors ${className}`}
        aria-label="Official TUKUBI Platform Account"
      >
        <span className="relative flex items-center justify-center">
          <BadgeCheck
            className={`${iconSizes[size]} fill-[#0EA5E9]/20 text-[#0EA5E9] drop-shadow-[0_0_8px_rgba(14,165,233,0.4)]`}
          />
        </span>
      </span>
    );
  }

  return (
    <span
      title="Official TUKUBI Platform Account"
      className={`inline-flex items-center gap-1.5 font-black uppercase tracking-wider rounded-full bg-gradient-to-r from-brand-sunriseCoral/20 via-brand-caribbeanSea/20 to-brand-twilight/40 text-[#38BDF8] border border-[#0EA5E9]/40 shadow-[0_0_12px_rgba(14,165,233,0.25)] ${textSizes[size]} ${className}`}
      aria-label="Official TUKUBI Platform Account"
    >
      <BadgeCheck className={`${iconSizes[size]} text-[#0EA5E9] fill-[#0EA5E9]/30`} />
      <span>{label}</span>
    </span>
  );
}
