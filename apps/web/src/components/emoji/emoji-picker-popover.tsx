'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Sparkles, Smile, Heart, Coffee, Compass, Flag, Zap, X, Music } from 'lucide-react';

export interface EmojiCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  emojis: string[];
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'caribbean',
    name: 'Caribbean & Island Vibes',
    icon: <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" />,
    emojis: [
      '🌴', '🥥', '🏝️', '🏖️', '🌅', '🌇', '🌊', '☀️', '🍹', '🍍', '🥭', '🍉', '🥑', '🌶️', '🥘',
      '🦜', '🦩', '🐠', '🐟', '🐬', '🐳', '🦈', '🪼', '🦀', '🦐', '🤿', '🏄', '⛵', '🌺', '🌸',
      '🥁', '🪘', '🪕', '🎺', '🎷', '🪗', '🎵', '🎶', '🕺', '💃', '🎉', '🎊', '✨', '👑', '🔥',
      '🇯🇲', '🇹🇹', '🇧🇧', '🇧🇸', '🇨🇺', '🇩🇴', '🇭🇹', '🇬🇾', '🇱🇨', '🇦🇬', '🇩🇲', '🇬🇩', '🇰🇳', '🇻🇨', '🇧🇿',
      '🇸🇷', '🇦🇮', '🇻🇬', '🇰🇾', '🇲🇸', '🇹🇨', '🇧🇲', '🇦🇼', '🇨🇼', '🇸🇽', '🇵🇷', '🇬🇵', '🇲🇶',
    ],
  },
  {
    id: 'smileys',
    name: 'Smileys & Expressions',
    icon: <Smile className="w-3.5 h-3.5 text-amber-400" />,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '🥹', '☺️', '😊', '😇', '🙂', '🙃',
      '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐',
      '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖',
      '😫', '😩', '🥺', '😢', '😭', '😮‍💨', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱',
      '😨', '😰', '😥', '😓', '🫣', '🤗', '🫡', '🤔', '🫢', '🤭', '🤫', '🤥', '😶', '😐', '😑',
      '😬', '🫠', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '😵‍💫', '🫥',
      '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡',
      '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃',
    ],
  },
  {
    id: 'gestures',
    name: 'Gestures & People',
    icon: <Zap className="w-3.5 h-3.5 text-cyan-400" />,
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '🫱', '🫲', '🫳', '🫴', '👌', '🤌', '🤏', '✌️', '🤞', '🫰',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '🫵', '👍', '👎', '✊', '👊', '🤛',
      '🤜', '👏', '🙌', '🫶', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵',
      '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '🫦', '🫂',
      '👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👵', '🧓', '👴', '👮', '🕵️', '💂', '🥷', '👷',
    ],
  },
  {
    id: 'hearts',
    name: 'Hearts & Love',
    icon: <Heart className="w-3.5 h-3.5 text-rose-500" />,
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞',
      '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️',
      '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓',
    ],
  },
  {
    id: 'food',
    name: 'Food & Drinks',
    icon: <Coffee className="w-3.5 h-3.5 text-emerald-400" />,
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍',
      '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅',
      '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩',
      '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗',
      '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘',
      '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰',
      '🥜', '🍯', '🥛', '🍼', '☕', '🫖', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂',
      '🥃', '🥤', '🧋', '🧃', '🧉', '🧊',
    ],
  },
  {
    id: 'music_fun',
    name: 'Music & Activities',
    icon: <Music className="w-3.5 h-3.5 text-pink-400" />,
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑',
      '🏏', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '🛹', '🛼', '🏋️', '🤸', '🏄', '🏊', '🚴', '🏆',
      '🥇', '🥈', '🥉', '🏅', '🎖️', '🎟️', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶',
      '🎹', '🥁', '🪘', '🎷', '🎺', '🪗', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰',
    ],
  },
  {
    id: 'travel_flags',
    name: 'Travel & Global Flags',
    icon: <Flag className="w-3.5 h-3.5 text-purple-400" />,
    emojis: [
      '🚗', '🚕', '🚙', '🚌', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚜', '🛵', '🏍️', '🛺',
      '🚨', '🚡', '🚠', '🚂', '🚆', '🚇', '🚁', '🛩️', '✈️', '🛫', '🛬', '🚀', '🛸', '🛶', '⛵',
      '🚤', '🛳️', '🚢', '⚓', '🏖️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🏕️', '⛺', '🏠', '🏢', '🏛️',
      '🇯🇲', '🇹🇹', '🇧🇧', '🇧🇸', '🇨🇺', '🇩🇴', '🇭🇹', '🇬🇾', '🇱🇨', '🇦🇬', '🇩🇲', '🇬🇩', '🇰🇳', '🇻🇨', '🇧🇿',
      '🇸🇷', '🇦🇮', '🇻🇬', '🇰🇾', '🇲🇸', '🇹🇨', '🇧🇲', '🇦🇼', '🇨🇼', '🇸🇽', '🇵🇷', '🇬🇵', '🇲🇶', '🇺🇸', '🇬🇧',
      '🇨🇦', '🇫🇷', '🇳🇱', '🇪🇸', '🇳🇬', '🇬🇭', '🇿🇦', '🇧🇷', '🇨🇴', '🇻🇪',
    ],
  },
];

interface EmojiPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  position?: 'top' | 'bottom' | 'top-right' | 'top-left';
}

export default function EmojiPickerPopover({
  isOpen,
  onClose,
  onSelectEmoji,
  position = 'top',
}: EmojiPickerPopoverProps) {
  const [activeCategory, setActiveCategory] = useState<string>('caribbean');
  const [searchQuery, setSearchQuery] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Filtered emojis based on search
  const displayedEmojis = useMemo(() => {
    if (!searchQuery.trim()) {
      const cat = EMOJI_CATEGORIES.find((c) => c.id === activeCategory);
      return cat ? cat.emojis : EMOJI_CATEGORIES[0].emojis;
    }

    // Collect all emojis matching category or search query
    const query = searchQuery.toLowerCase().trim();
    const matches: string[] = [];

    EMOJI_CATEGORIES.forEach((category) => {
      if (category.name.toLowerCase().includes(query)) {
        matches.push(...category.emojis);
      } else {
        category.emojis.forEach((emoji) => {
          if (emoji.includes(query)) {
            matches.push(emoji);
          }
        });
      }
    });

    return Array.from(new Set(matches));
  }, [activeCategory, searchQuery]);

  if (!isOpen) return null;

  // Position classes
  const positionClasses = {
    top: 'bottom-full mb-3 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0',
    bottom: 'top-full mt-3 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0',
    'top-right': 'bottom-full mb-3 right-0',
    'top-left': 'bottom-full mb-3 left-0',
  }[position];

  return (
    <div
      ref={popoverRef}
      className={`absolute z-50 ${positionClasses} w-80 sm:w-96 bg-[#130B1E]/95 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-4 space-y-3 animate-fadeIn text-white overflow-hidden`}
    >
      {/* Specular Edge Top Highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

      {/* Header & Search */}
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emojis & flags..."
            className="w-full bg-[#1F142E] border border-white/10 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-caribbeanSea font-medium"
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Close emoji picker"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Category Tabs */}
      {!searchQuery && (
        <div className="flex items-center justify-between gap-1 pb-1 border-b border-white/10 overflow-x-auto scrollbar-none">
          {EMOJI_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                  isActive
                    ? 'bg-brand-caribbeanSea/20 border border-brand-caribbeanSea/40 text-brand-caribbeanSea shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
                title={cat.name}
              >
                {cat.icon}
              </button>
            );
          })}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="text-[11px] font-bold text-slate-400 mb-2 px-1">
          {searchQuery ? `Search Results (${displayedEmojis.length})` : EMOJI_CATEGORIES.find((c) => c.id === activeCategory)?.name}
        </div>

        {displayedEmojis.length > 0 ? (
          <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5">
            {displayedEmojis.map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                type="button"
                onClick={() => {
                  onSelectEmoji(emoji);
                  onClose();
                }}
                className="w-9 h-9 rounded-xl hover:bg-white/15 flex items-center justify-center text-xl hover:scale-125 active:scale-95 transition-all duration-150 cursor-pointer"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            No emojis found for &quot;{searchQuery}&quot;
          </div>
        )}
      </div>

      {/* Caribbean Quick React Bar */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-caribbeanSea">
          Quick Vibes
        </span>
        <div className="flex items-center gap-1.5">
          {['🌴', '🥥', '🔥', '❤️', '🇯🇲', '🇹🇹', '🚀'].map((quickEmoji) => (
            <button
              key={quickEmoji}
              type="button"
              onClick={() => {
                onSelectEmoji(quickEmoji);
                onClose();
              }}
              className="text-base hover:scale-125 transition-transform p-1 hover:bg-white/10 rounded-lg"
            >
              {quickEmoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
