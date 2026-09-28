'use client';

import React from 'react';
import {
  REACTION_EMOJI_MAP,
  VALID_REACTION_TYPES,
  type ReactionType,
} from './reaction-picker';

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

function useSafeRef<T>(initialValue: T): React.MutableRefObject<T> {
  const internals =
    (React as any)?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
    (React as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const dispatcher = internals?.H || internals?.ReactCurrentDispatcher?.current;

  if (dispatcher) {
    return React.useRef<T>(initialValue);
  }
  return { current: initialValue };
}

function useSafeEffect(effect: React.EffectCallback, deps?: React.DependencyList) {
  const internals =
    (React as any)?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
    (React as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const dispatcher = internals?.H || internals?.ReactCurrentDispatcher?.current;

  if (dispatcher) {
    React.useEffect(effect, deps);
  }
}

export interface ReactionSummaryBarProps {
  counts: Record<ReactionType, number>;
  total: number;
  className?: string;
  onToggle?: () => void;
}

export default function ReactionSummaryBar({
  counts,
  total,
  className = '',
  onToggle,
}: ReactionSummaryBarProps) {
  const [showBreakdown, setShowBreakdown] = useSafeState(false);
  const containerRef = useSafeRef<HTMLDivElement | null>(null);

  useSafeEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowBreakdown(false);
      }
    };

    if (showBreakdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBreakdown]);

  if (total === 0) return null;

  const topTypes = VALID_REACTION_TYPES
    .filter((t) => (counts[t] || 0) > 0)
    .sort((a, b) => (counts[b] || 0) - (counts[a] || 0))
    .slice(0, 3);

  const activeReactions = VALID_REACTION_TYPES
    .filter((t) => (counts[t] || 0) > 0)
    .sort((a, b) => (counts[b] || 0) - (counts[a] || 0));

  const handleToggle = () => {
    setShowBreakdown((prev) => !prev);
    onToggle?.();
  };

  return (
    <div ref={containerRef} className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-1.5 py-1 px-2 min-h-[32px] md:min-h-[44px] rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-600"
        aria-label={`View ${total.toLocaleString()} reactions`}
        aria-expanded={showBreakdown}
      >
        <span className="flex items-center -space-x-1">
          {topTypes.map((t) => (
            <span
              key={t}
              className="text-sm md:text-base leading-none drop-shadow-sm transition-transform hover:scale-110"
              title={`${REACTION_EMOJI_MAP[t]?.label || t}: ${counts[t] || 0}`}
            >
              {REACTION_EMOJI_MAP[t]?.emoji}
            </span>
          ))}
        </span>
        <span className="font-medium text-slate-300">
          {total.toLocaleString()}
        </span>
      </button>

      {showBreakdown && (
        <div
          role="dialog"
          aria-label="Reaction breakdown"
          className="absolute bottom-full left-0 mb-2 w-56 bg-brand-dusk/95 backdrop-blur-md border border-slate-700 rounded-xl p-3 shadow-2xl z-50 animate-fadeIn"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-200">
              Reactions ({total.toLocaleString()})
            </span>
            <button
              type="button"
              onClick={() => setShowBreakdown(false)}
              className="text-slate-400 hover:text-white text-xs p-1 rounded-md min-w-[24px] min-h-[24px] flex items-center justify-center"
              aria-label="Close reaction breakdown"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {activeReactions.map((type) => {
              const meta = REACTION_EMOJI_MAP[type];
              const count = counts[type] || 0;
              return (
                <div
                  key={type}
                  className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-slate-800/60 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{meta.emoji}</span>
                    <span className={`font-medium ${meta.color}`}>{meta.label}</span>
                  </div>
                  <span className="font-semibold text-slate-300">
                    {count.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
