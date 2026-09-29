'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  Sparkles,
  Smile,
  Heart,
  Coffee,
  Compass,
  Flag,
  X,
  Clock,
  Users,
  Leaf,
  Trophy,
  Lightbulb,
  Star,
} from 'lucide-react';
import {
  UNICODE_EMOJI_DATASET,
  applySkinTone,
  searchEmojis,
  getRecentEmojis,
  addRecentEmoji,
  getFavoriteEmojis,
  toggleFavoriteEmoji,
  SKIN_TONE_MODIFIERS,
} from '@/lib/emoji';
import type { SkinTone, EmojiItem } from '@/lib/emoji';

export interface CategoryTab {
  id: string;
  name: string;
  icon: React.ReactNode;
}

export const CATEGORY_TABS: CategoryTab[] = [
  {
    id: 'recents',
    name: 'Recents & Favorites',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  {
    id: 'caribbean',
    name: 'Caribbean & Island Vibes',
    icon: <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" />,
  },
  {
    id: 'smileys',
    name: 'Smileys & Emotion',
    icon: <Smile className="w-3.5 h-3.5 text-amber-400" />,
  },
  {
    id: 'people',
    name: 'People & Body',
    icon: <Users className="w-3.5 h-3.5 text-cyan-400" />,
  },
  {
    id: 'nature',
    name: 'Animals & Nature',
    icon: <Leaf className="w-3.5 h-3.5 text-emerald-400" />,
  },
  {
    id: 'food',
    name: 'Food & Drink',
    icon: <Coffee className="w-3.5 h-3.5 text-orange-400" />,
  },
  {
    id: 'travel',
    name: 'Travel & Places',
    icon: <Compass className="w-3.5 h-3.5 text-purple-400" />,
  },
  {
    id: 'activities',
    name: 'Activities',
    icon: <Trophy className="w-3.5 h-3.5 text-pink-400" />,
  },
  {
    id: 'objects',
    name: 'Objects',
    icon: <Lightbulb className="w-3.5 h-3.5 text-yellow-300" />,
  },
  {
    id: 'symbols',
    name: 'Symbols',
    icon: <Heart className="w-3.5 h-3.5 text-rose-500" />,
  },
  {
    id: 'flags',
    name: 'Flags',
    icon: <Flag className="w-3.5 h-3.5 text-blue-400" />,
  },
];

export const SKIN_TONE_OPTIONS: Array<{ tone: SkinTone; label: string; sample: string }> = [
  { tone: 'default', label: 'Default Yellow', sample: '👋' },
  { tone: 'light', label: 'Light skin tone', sample: '👋🏻' },
  { tone: 'medium-light', label: 'Medium-Light skin tone', sample: '👋🏼' },
  { tone: 'medium', label: 'Medium skin tone', sample: '👋🏽' },
  { tone: 'medium-dark', label: 'Medium-Dark skin tone', sample: '👋🏾' },
  { tone: 'dark', label: 'Dark skin tone', sample: '👋🏿' },
];

const QUICK_VIBES = ['🌴', '🥥', '🔥', '❤️', '🇯🇲', '🇹🇹', '🇧🇧', '🚀'];

export function computeNextGridIndex(
  currentIndex: number,
  totalItems: number,
  columns: number,
  direction: 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown'
): number {
  if (totalItems <= 0) return -1;
  if (currentIndex < 0) return 0;

  switch (direction) {
    case 'ArrowLeft':
      return currentIndex > 0 ? currentIndex - 1 : currentIndex;
    case 'ArrowRight':
      return currentIndex < totalItems - 1 ? currentIndex + 1 : currentIndex;
    case 'ArrowUp':
      return currentIndex - columns >= 0 ? currentIndex - columns : currentIndex;
    case 'ArrowDown':
      return currentIndex + columns < totalItems ? currentIndex + columns : currentIndex;
    default:
      return currentIndex;
  }
}

export interface EmojiPickerPopoverProps {
  isOpen?: boolean;
  onClose?: () => void;
  onEmojiSelect?: (emoji: string) => void;
  /** Backwards compatibility alias for onEmojiSelect */
  onSelectEmoji?: (emoji: string) => void;
  position?: 'top' | 'bottom' | 'top-right' | 'top-left';
  className?: string;
}

export function EmojiPickerPopoverContent({
  onClose,
  onEmojiSelect,
  onSelectEmoji,
  position = 'top',
  className = '',
}: EmojiPickerPopoverProps) {
  const [activeCategory, setActiveCategory] = useState<string>('caribbean');
  const [searchQuery, setSearchQuery] = useState('');
  const [skinTone, setSkinTone] = useState<SkinTone>('default');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [announcedEmoji, setAnnouncedEmoji] = useState<string>('');
  const [favoritesVersion, setFavoritesVersion] = useState<number>(0);

  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const handleSelectEmoji = useCallback(
    (emojiGlyph: string) => {
      addRecentEmoji(emojiGlyph);
      onEmojiSelect?.(emojiGlyph);
      onSelectEmoji?.(emojiGlyph);
      onClose?.();
    },
    [onEmojiSelect, onSelectEmoji, onClose]
  );

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose?.();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Global Escape keydown listener
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose?.();
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onClose]);

  // Derived emojis list based on category, search, and skin tone
  const displayedEmojis = useMemo<EmojiItem[]>(() => {
    const trimmed = searchQuery.trim();

    if (trimmed) {
      const searchResults = searchEmojis(trimmed, 80);
      return searchResults.map((item) => ({
        ...item,
        emoji: applySkinTone(item.emoji, skinTone),
      }));
    }

    if (activeCategory === 'recents') {
      const favs = getFavoriteEmojis();
      const recents = getRecentEmojis();
      const combined = Array.from(new Set([...favs, ...recents]));

      if (combined.length === 0) {
        return [];
      }

      return combined.map((emoji) => ({
        emoji: applySkinTone(emoji, skinTone),
        name: emoji,
        keywords: ['recent', 'favorite'],
      }));
    }

    const categoryData = UNICODE_EMOJI_DATASET.find((c) => c.id === activeCategory);
    const items = categoryData?.emojis ?? UNICODE_EMOJI_DATASET[0].emojis;

    return items.map((item) => ({
      ...item,
      emoji: applySkinTone(item.emoji, skinTone),
    }));
  }, [searchQuery, activeCategory, skinTone, favoritesVersion]);

  // Focus announcements for screen readers
  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < displayedEmojis.length) {
      const item = displayedEmojis[focusedIndex];
      setAnnouncedEmoji(`${item.name || item.emoji}, emoji`);
    }
  }, [focusedIndex, displayedEmojis]);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose?.();
      return;
    }

    if (
      e.key === 'ArrowDown' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight'
    ) {
      e.preventDefault();
      const columns = 7;
      setFocusedIndex((prev) =>
        computeNextGridIndex(prev, displayedEmojis.length, columns, e.key as any)
      );
      return;
    }

    if (e.key === 'Enter') {
      if (focusedIndex >= 0 && focusedIndex < displayedEmojis.length) {
        e.preventDefault();
        handleSelectEmoji(displayedEmojis[focusedIndex].emoji);
      }
    }
  };

  // Scroll focused emoji into view
  useEffect(() => {
    if (focusedIndex >= 0 && gridContainerRef.current) {
      const activeEl = gridContainerRef.current.querySelector(
        `[data-emoji-index="${focusedIndex}"]`
      ) as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  // Reset focus when query or category changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchQuery, activeCategory]);

  // Position classes
  const positionClasses = {
    top: 'bottom-full mb-3 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0',
    bottom: 'top-full mt-3 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0',
    'top-right': 'bottom-full mb-3 right-0',
    'top-left': 'bottom-full mb-3 left-0',
  }[position];

  const currentCategoryName =
    CATEGORY_TABS.find((c) => c.id === activeCategory)?.name ?? 'Emojis';

  const hoveredOrFocusedEmoji =
    focusedIndex >= 0 && focusedIndex < displayedEmojis.length
      ? displayedEmojis[focusedIndex]
      : null;

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Emoji picker"
      aria-modal="false"
      onKeyDown={handleKeyDown}
      className={`absolute z-50 ${positionClasses} w-80 sm:w-96 bg-[#130B1E]/95 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-4 space-y-3 animate-fadeIn text-white overflow-hidden ${className}`}
    >
      {/* Specular Edge Top Highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

      {/* Screen Reader Live Announcement Region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcedEmoji}
      </div>

      {/* Header & Sticky Search */}
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            role="searchbox"
            aria-label="Search emojis"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emojis & island flags..."
            className="w-full bg-[#1F142E] border border-white/10 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-caribbeanSea font-medium min-h-[44px] sm:min-h-[36px]"
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="absolute right-1 top-1 text-slate-400 hover:text-white min-w-[44px] min-h-[44px] sm:min-w-[28px] sm:min-h-[28px] flex items-center justify-center"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center"
          title="Close emoji picker"
          aria-label="Close emoji picker"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Fitzpatrick Skin Tone Modifier Picker Bar */}
      <div className="flex items-center justify-between gap-1 px-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Skin Tone
        </span>
        <div
          className="flex items-center gap-1 bg-[#1F142E]/70 p-1 rounded-xl border border-white/10"
          role="radiogroup"
          aria-label="Select skin tone"
        >
          {SKIN_TONE_OPTIONS.map(({ tone, label, sample }) => {
            const isSelected = skinTone === tone;
            return (
              <button
                key={tone}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSkinTone(tone)}
                className={`min-w-[44px] min-h-[44px] sm:min-w-[28px] sm:min-h-[28px] w-9 h-9 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-sm transition-all ${
                  isSelected
                    ? 'bg-brand-caribbeanSea/30 border border-brand-caribbeanSea text-white scale-105 shadow-sm'
                    : 'hover:bg-white/10 opacity-70 hover:opacity-100 border border-transparent'
                }`}
                title={label}
                aria-label={label}
              >
                <span>{sample}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Tabs */}
      {!searchQuery && (
        <div
          role="tablist"
          aria-label="Emoji categories"
          className="flex items-center gap-1 pb-1 border-b border-white/10 overflow-x-auto scrollbar-none"
        >
          {CATEGORY_TABS.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => setActiveCategory(cat.id)}
                className={`min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] p-2 rounded-xl transition-all flex items-center justify-center shrink-0 ${
                  isActive
                    ? 'bg-brand-caribbeanSea/20 border border-brand-caribbeanSea/40 text-brand-caribbeanSea shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
                title={cat.name}
                aria-label={cat.name}
              >
                {cat.icon}
              </button>
            );
          })}
        </div>
      )}

      {/* Emoji Grid */}
      <div
        ref={gridContainerRef}
        role="grid"
        aria-label={searchQuery ? 'Search results' : currentCategoryName}
        tabIndex={0}
        className="max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 outline-none focus:ring-1 focus:ring-brand-caribbeanSea/40 rounded-lg"
      >
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-2 px-1">
          <span>
            {searchQuery
              ? `Search Results (${displayedEmojis.length})`
              : currentCategoryName}
          </span>
          {hoveredOrFocusedEmoji && (
            <span className="text-[10px] text-brand-caribbeanSea truncate max-w-[180px]">
              {hoveredOrFocusedEmoji.name}
            </span>
          )}
        </div>

        {displayedEmojis.length > 0 ? (
          <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5" role="row">
            {displayedEmojis.map((item, index) => {
              const isFocused = focusedIndex === index;
              return (
                <button
                  key={`${item.emoji}-${index}`}
                  data-emoji-index={index}
                  role="gridcell"
                  type="button"
                  aria-selected={isFocused}
                  aria-label={item.name || item.emoji}
                  onClick={() => handleSelectEmoji(item.emoji)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={`w-11 h-11 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-xl sm:text-lg hover:scale-125 active:scale-95 transition-all duration-150 cursor-pointer ${
                    isFocused
                      ? 'bg-brand-caribbeanSea/30 ring-2 ring-brand-caribbeanSea scale-110 shadow-md'
                      : 'hover:bg-white/15'
                  }`}
                  title={item.name || item.emoji}
                >
                  <span>{item.emoji}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            {activeCategory === 'recents' && !searchQuery
              ? 'No recent emojis yet. Pick any emoji to start!'
              : `No emojis found for "${searchQuery}"`}
          </div>
        )}
      </div>

      {/* Caribbean Quick React Bar & Preview Footer */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-caribbeanSea">
            Quick Vibes
          </span>
          {hoveredOrFocusedEmoji && (
            <button
              type="button"
              onClick={() => {
                toggleFavoriteEmoji(hoveredOrFocusedEmoji.emoji);
                setFavoritesVersion((v) => v + 1);
              }}
              className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-amber-400 transition-colors"
              title="Toggle Favorite"
              aria-label="Toggle Favorite"
            >
              <Star className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {QUICK_VIBES.map((quickEmoji) => (
            <button
              key={quickEmoji}
              type="button"
              onClick={() => handleSelectEmoji(quickEmoji)}
              className="min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] sm:w-8 sm:h-8 text-base hover:scale-125 transition-transform p-1 hover:bg-white/10 rounded-lg flex items-center justify-center"
              aria-label={`Quick react ${quickEmoji}`}
              title={`Quick react ${quickEmoji}`}
            >
              {quickEmoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function EmojiPickerPopover(props: EmojiPickerPopoverProps) {
  if (props.isOpen === false) {
    return null;
  }
  return <EmojiPickerPopoverContent {...props} />;
}
