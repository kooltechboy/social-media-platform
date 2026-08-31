import React from 'react';
import { Award, Lock, Sparkles } from 'lucide-react';
import type { RecognitionBadge } from '../../lib/recognition/types';

interface BadgeCardProps {
  badge: RecognitionBadge;
  isUnlocked?: boolean;
  unlockedAt?: string;
  className?: string;
}

export default function BadgeCard({
  badge,
  isUnlocked = true,
  unlockedAt,
  className = '',
}: BadgeCardProps) {
  const rarityBorders: Record<string, string> = {
    common: 'border-slate-800 hover:border-slate-700',
    uncommon: 'border-cyan-500/30 hover:border-cyan-500/50',
    rare: 'border-blue-500/30 hover:border-blue-500/60',
    epic: 'border-purple-500/40 hover:border-purple-500/70',
    legendary: 'border-amber-500/50 hover:border-amber-400 shadow-lg shadow-amber-950/20',
    mythic: 'border-rose-500/50 hover:border-rose-400 shadow-lg shadow-rose-950/30',
  };

  const rarityBadges: Record<string, string> = {
    common: 'text-slate-400 bg-slate-800/80',
    uncommon: 'text-cyan-300 bg-cyan-950/60',
    rare: 'text-blue-300 bg-blue-950/60',
    epic: 'text-purple-300 bg-purple-950/60',
    legendary: 'text-amber-300 bg-amber-950/60',
    mythic: 'text-rose-300 bg-rose-950/60',
  };

  return (
    <div
      className={`relative group rounded-3xl p-5 border bg-brand-dusk/60 transition-all flex flex-col justify-between ${
        rarityBorders[badge.rarity] || rarityBorders.common
      } ${!isUnlocked ? 'opacity-60 grayscale' : ''} ${className}`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-brand-sandstone">
            {isUnlocked ? (
              <Sparkles className="w-5 h-5 text-brand-caribbeanSea" />
            ) : (
              <Lock className="w-4 h-4 text-slate-500" />
            )}
          </div>
          <span
            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-current/20 ${
              rarityBadges[badge.rarity] || rarityBadges.common
            }`}
          >
            {badge.rarity}
          </span>
        </div>

        <h4 className="text-sm font-black text-brand-sandstone group-hover:text-brand-caribbeanSea transition-colors">
          {badge.name}
        </h4>
        <p className="text-xs text-brand-sandstone/60 mt-1 leading-relaxed">
          {badge.description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-brand-sandstone/40 font-semibold">
        <span>{badge.tier.toUpperCase()} TIER</span>
        {unlockedAt && (
          <span>
            Earned {new Date(unlockedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  );
}
