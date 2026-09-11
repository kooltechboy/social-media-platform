'use client';

import React, { useState, useRef, useEffect } from 'react';

export type ReactionType = 'like' | 'love' | 'fire' | 'celebrate' | 'laugh' | 'wow' | 'sad' | 'angry';

export const VALID_REACTION_TYPES: ReactionType[] = ['like','love','fire','celebrate','laugh','wow','sad','angry'];

export const REACTION_EMOJI_MAP: Record<ReactionType, { emoji: string; label: string; color: string }> = {
  like:      { emoji: '🤍', label: 'Like',      color: 'text-slate-300' },
  love:      { emoji: '❤️', label: 'Love',      color: 'text-rose-400' },
  fire:      { emoji: '🔥', label: 'Fire',      color: 'text-orange-400' },
  celebrate: { emoji: '🎉', label: 'Celebrate', color: 'text-yellow-400' },
  laugh:     { emoji: '😂', label: 'Laugh',     color: 'text-amber-400' },
  wow:       { emoji: '😮', label: 'Wow',       color: 'text-sky-400' },
  sad:       { emoji: '😢', label: 'Sad',       color: 'text-blue-400' },
  angry:     { emoji: '😠', label: 'Angry',     color: 'text-red-500' },
};

interface ReactionPickerProps {
  currentReaction?: ReactionType | null;
  onSelect: (type: ReactionType) => void;
  className?: string;
}

export default function ReactionPicker({ currentReaction, onSelect, className = '' }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
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
        className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
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
        <span className="text-base leading-none">{current?.emoji ?? '🤍'}</span>
        <span className="hidden sm:inline text-xs">{current?.label ?? 'Like'}</span>
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 mb-2 flex items-center gap-1 bg-brand-dusk border border-slate-700 rounded-2xl px-3 py-2 shadow-2xl z-50 animate-fadeIn"
          role="listbox"
          aria-label="Choose a reaction"
          onMouseEnter={() => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); }}
          onMouseLeave={handleMouseLeave}
        >
          {VALID_REACTION_TYPES.map((type) => {
            const info = REACTION_EMOJI_MAP[type];
            return (
              <button
                key={type}
                type="button"
                role="option"
                aria-selected={currentReaction === type}
                title={info.label}
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all hover:scale-125 hover:bg-slate-700/50 ${
                  currentReaction === type ? 'ring-1 ring-brand-caribbeanSea bg-slate-700/50 scale-110' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(type);
                  setOpen(false);
                }}
              >
                <span className="text-xl leading-none">{info.emoji}</span>
                <span className="text-[9px] text-slate-400 font-medium leading-none">{info.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
