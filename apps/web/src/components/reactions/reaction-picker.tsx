'use client';
/* eslint-disable react-hooks/rules-of-hooks */

import React from 'react';

export type ReactionType =
  | 'like'
  | 'love'
  | 'fire'
  | 'celebrate'
  | 'laugh'
  | 'wow'
  | 'sad'
  | 'angry'
  | 'palm'
  | 'sound';

export const VALID_REACTION_TYPES: ReactionType[] = [
  'like',
  'love',
  'fire',
  'celebrate',
  'laugh',
  'wow',
  'sad',
  'angry',
  'palm',
  'sound',
];

export const REACTION_EMOJI_MAP: Record<
  ReactionType,
  { emoji: string; label: string; color: string }
> = {
  like:      { emoji: '🤍', label: 'Like',        color: 'text-slate-300' },
  love:      { emoji: '❤️', label: 'Love',        color: 'text-rose-400' },
  fire:      { emoji: '🔥', label: 'Fire',        color: 'text-orange-400' },
  celebrate: { emoji: '🎉', label: 'Celebrate',   color: 'text-yellow-400' },
  laugh:     { emoji: '😂', label: 'Laugh',       color: 'text-amber-400' },
  wow:       { emoji: '😮', label: 'Wow',         color: 'text-sky-400' },
  sad:       { emoji: '😢', label: 'Sad',         color: 'text-blue-400' },
  angry:     { emoji: '😠', label: 'Angry',       color: 'text-red-500' },
  palm:      { emoji: '🌴', label: 'Island Vibe', color: 'text-emerald-400' },
  sound:     { emoji: '🎵', label: 'Riddim',      color: 'text-violet-400' },
};

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

export interface ReactionPickerProps {
  currentReaction?: ReactionType | null;
  onSelect: (type: ReactionType) => void;
  className?: string;
}

export default function ReactionPicker({
  currentReaction,
  onSelect,
  className = '',
}: ReactionPickerProps) {
  const [open, setOpen] = useSafeState(false);
  const hoverTimerRef = useSafeRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useSafeRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressRef = useSafeRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useSafeRef<HTMLDivElement | null>(null);

  const handleMouseEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setOpen(true), 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    closeTimerRef.current = setTimeout(() => setOpen(false), 200);
  };

  const handleTouchStart = () => {
    longPressRef.current = setTimeout(() => setOpen(true), 400);
  };

  const handleTouchEnd = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  };

  useSafeEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (longPressRef.current) clearTimeout(longPressRef.current);
    };
  }, []);

  useSafeEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const current = currentReaction ? REACTION_EMOJI_MAP[currentReaction] : null;

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className={`flex items-center justify-center gap-1.5 px-2.5 py-2 min-h-[44px] min-w-[44px] rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-caribbeanSea/50 ${
          current ? current.color : 'text-slate-400 hover:text-slate-200'
        }`}
        onClick={() => {
          if (open) {
            setOpen(false);
          } else {
            onSelect(currentReaction ?? 'like');
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label={current ? `Reacted: ${current.label}. Hold to change.` : 'React to post'}
      >
        <span className="text-base md:text-lg leading-none transition-transform duration-150 hover:scale-110">
          {current?.emoji ?? '🤍'}
        </span>
        <span className="hidden sm:inline text-xs md:text-sm font-semibold">
          {current?.label ?? 'Like'}
        </span>
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 mb-2 flex items-center gap-1 md:gap-1.5 bg-brand-dusk/95 backdrop-blur-md border border-slate-700 rounded-2xl px-2.5 py-1.5 md:px-3 md:py-2 shadow-2xl z-50 animate-fadeIn"
          role="listbox"
          aria-label="Choose a reaction"
          onMouseEnter={() => {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
          }}
          onMouseLeave={handleMouseLeave}
        >
          {VALID_REACTION_TYPES.map((type) => {
            const info = REACTION_EMOJI_MAP[type];
            const isSelected = currentReaction === type;
            return (
              <button
                key={type}
                type="button"
                role="option"
                aria-selected={isSelected}
                title={info.label}
                aria-label={info.label}
                className={`group relative flex flex-col items-center justify-center gap-0.5 p-1.5 md:p-2 min-w-[44px] min-h-[44px] rounded-xl transition-all duration-200 hover:scale-125 hover:bg-slate-700/60 focus:outline-none focus:ring-2 focus:ring-brand-caribbeanSea/50 ${
                  isSelected ? 'ring-2 ring-brand-caribbeanSea bg-slate-700/60 scale-110' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(type);
                  setOpen(false);
                }}
              >
                <span className="text-xl md:text-2xl leading-none transition-transform duration-150 group-hover:scale-115">
                  {info.emoji}
                </span>
                <span className="text-[9px] md:text-[10px] text-slate-400 font-medium leading-none group-hover:text-white">
                  {info.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
