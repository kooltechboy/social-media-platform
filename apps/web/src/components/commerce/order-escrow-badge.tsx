'use client';

import React from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import {
  type EscrowStatus,
  ESCROW_STATUS_METADATA,
  DISPUTE_WINDOW_DAYS,
} from '@caribbean/marketplace';

export interface OrderEscrowBadgeProps {
  status: EscrowStatus;
  variant?: 'pill' | 'card';
  createdAt?: string;
  disputeDaysRemaining?: number;
  className?: string;
}

/**
 * Calculates remaining dispute window days from order creation timestamp.
 */
export function calculateRemainingDisputeDays(
  createdAt: string,
  now: Date = new Date()
): number {
  try {
    const createdTime = new Date(createdAt).getTime();
    if (Number.isNaN(createdTime)) return 0;
    const elapsedMs = now.getTime() - createdTime;
    const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
    const remaining = DISPUTE_WINDOW_DAYS - elapsedDays;
    return Math.max(0, remaining);
  } catch {
    return 0;
  }
}

interface EscrowVisualTheme {
  bg: string;
  border: string;
  text: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
}

const ESCROW_THEMES: Record<EscrowStatus, EscrowVisualTheme> = {
  held: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-300',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    badgeBg: 'bg-amber-950/60',
  },
  releasing: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-300',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    badgeBg: 'bg-blue-950/60',
  },
  released: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-300',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/60',
  },
  refunded: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-300',
    iconBg: 'bg-rose-500/20',
    iconColor: 'text-rose-400',
    badgeBg: 'bg-rose-950/60',
  },
  disputed: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-300',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    badgeBg: 'bg-purple-950/60',
  },
};

function getEscrowIcon(status: EscrowStatus, className = 'w-3.5 h-3.5') {
  switch (status) {
    case 'held':
      return <Lock className={className} />;
    case 'releasing':
      return <Clock className={className} />;
    case 'released':
      return <CheckCircle2 className={className} />;
    case 'refunded':
      return <RotateCcw className={className} />;
    case 'disputed':
      return <AlertTriangle className={className} />;
    default:
      return <ShieldCheck className={className} />;
  }
}

export function OrderEscrowBadge({
  status,
  variant = 'pill',
  createdAt,
  disputeDaysRemaining,
  className = '',
}: OrderEscrowBadgeProps) {
  const meta = ESCROW_STATUS_METADATA[status] || ESCROW_STATUS_METADATA.held;
  const theme = ESCROW_THEMES[status] || ESCROW_THEMES.held;

  const remainingDays =
    disputeDaysRemaining !== undefined
      ? disputeDaysRemaining
      : createdAt
      ? calculateRemainingDisputeDays(createdAt)
      : null;

  if (variant === 'pill') {
    return (
      <div
        role="status"
        aria-label={`Escrow Status: ${meta.label}`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-sm transition-all ${theme.bg} ${theme.border} ${theme.text} ${className}`}
      >
        <span className={theme.iconColor}>{getEscrowIcon(status, 'w-3 h-3')}</span>
        <span>{meta.label}</span>
      </div>
    );
  }

  // Expanded card variant
  return (
    <div
      role="status"
      aria-label={`Escrow Protection Status: ${meta.label}`}
      className={`rounded-2xl p-4 border transition-all ${theme.bg} ${theme.border} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${theme.iconBg} ${theme.iconColor}`}>
            {getEscrowIcon(status, 'w-5 h-5')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-white">
                30-Day Escrow Guarantee
              </h4>
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${theme.badgeBg} ${theme.border} ${theme.text}`}
              >
                {meta.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              {meta.description}
            </p>
          </div>
        </div>
      </div>

      {remainingDays !== null && status === 'held' && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Buyer Protection Window:</span>
          </span>
          <span className="font-bold text-white">
            {`${remainingDays} ${remainingDays === 1 ? 'day' : 'days'} remaining in 30-day dispute window`}
          </span>
        </div>
      )}
    </div>
  );
}

export default OrderEscrowBadge;
