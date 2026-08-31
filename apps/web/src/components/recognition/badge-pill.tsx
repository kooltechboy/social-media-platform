import React from 'react';
import {
  Award,
  Crown,
  Landmark,
  Sparkles,
  Users,
  Mic,
  ShoppingBag,
  Building2,
  FlaskConical,
  Trophy,
  Globe,
  Flame,
  Shield,
  Star,
  Zap,
  TrendingUp,
  Radio,
  Store,
  CheckCircle2,
  UserPlus,
  Network,
  Palmtree,
  Moon,
  Volume2,
  Flag,
} from 'lucide-react';
import type { RecognitionBadge } from '../../lib/recognition/types';

const ICON_MAP: Record<string, React.ElementType> = {
  Award,
  Crown,
  Landmark,
  Sparkles,
  Users,
  Mic,
  ShoppingBag,
  Building2,
  FlaskConical,
  Trophy,
  Globe,
  Flame,
  Shield,
  Star,
  Zap,
  TrendingUp,
  Radio,
  Store,
  CheckCircle2,
  UserPlus,
  Network,
  Palmtree,
  Moon,
  Volume2,
  Flag,
};

interface BadgePillProps {
  badge: RecognitionBadge;
  size?: 'sm' | 'md';
  className?: string;
}

export default function BadgePill({ badge, size = 'md', className = '' }: BadgePillProps) {
  const IconComponent = ICON_MAP[badge.icon] || Award;

  const rarityStyles: Record<string, string> = {
    common: 'border-slate-700 bg-slate-800/80 text-slate-300',
    uncommon: 'border-cyan-500/30 bg-cyan-950/30 text-cyan-300',
    rare: 'border-blue-500/40 bg-blue-950/40 text-blue-300',
    epic: 'border-purple-500/40 bg-purple-950/40 text-purple-300',
    legendary: 'border-amber-500/50 bg-amber-950/40 text-amber-300',
    mythic: 'border-rose-500/60 bg-gradient-to-r from-rose-950/50 via-purple-950/50 to-amber-950/50 text-rose-200',
  };

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  };

  return (
    <span
      title={`${badge.name}: ${badge.description}`}
      className={`inline-flex items-center font-bold rounded-xl border transition-all hover:scale-105 select-none ${
        rarityStyles[badge.rarity] || rarityStyles.common
      } ${sizeClasses[size]} ${className}`}
    >
      <IconComponent className={iconSizes[size]} />
      <span>{badge.name}</span>
    </span>
  );
}
