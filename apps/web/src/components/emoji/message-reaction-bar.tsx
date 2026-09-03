'use client';

import React, { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import EmojiPickerPopover from './emoji-picker-popover';

export interface MessageReactionBarProps {
  onReact: (emoji: string) => void;
  messageId?: string;
  reactions?: Array<{ emoji: string; count: number; users: string[] }>;
  currentUserId?: string;
  isOwnMessage?: boolean;
}

const DEFAULT_REACTIONS = ['❤️', '🔥', '🌴', '🥥', '👍', '🇯🇲', '🚀', '😂'];

export default function MessageReactionBar({
  onReact,
  messageId,
  reactions = [],
  currentUserId,
  isOwnMessage = false,
}: MessageReactionBarProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center gap-1 group/reaction">
      {/* Existing Reactions Badges */}
      {reactions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {reactions.map((r, i) => {
            const hasReacted = currentUserId ? r.users.includes(currentUserId) : false;
            return (
              <button
                key={`${r.emoji}-${i}`}
                type="button"
                onClick={() => onReact(r.emoji)}
                className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 transition-all ${
                  hasReacted
                    ? 'bg-brand-caribbeanSea/30 text-white border border-brand-caribbeanSea shadow-sm'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20 border border-white/10'
                }`}
                title={`${r.count} reaction${r.count > 1 ? 's' : ''}`}
              >
                <span>{r.emoji}</span>
                <span className="text-[10px] font-black">{r.count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Floating Hover Trigger Bar */}
      <div
        className={`opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200 flex items-center gap-1 bg-[#130B1E]/95 backdrop-blur-xl border border-white/20 rounded-full px-2 py-1 shadow-xl absolute -top-8 ${
          isOwnMessage ? 'right-0' : 'left-0'
        } z-20`}
      >
        {DEFAULT_REACTIONS.slice(0, 5).map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onReact(emoji)}
            className="hover:scale-130 transition-transform p-1 text-sm hover:bg-white/10 rounded-full"
            title={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setIsPickerOpen(!isPickerOpen)}
          className="p-1 text-slate-400 hover:text-brand-caribbeanSea hover:bg-white/10 rounded-full transition-colors"
          title="More reactions"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Full Popover Picker */}
      <div className="relative">
        <EmojiPickerPopover
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSelectEmoji={(emoji) => {
            onReact(emoji);
            setIsPickerOpen(false);
          }}
          position={isOwnMessage ? 'top-right' : 'top-left'}
        />
      </div>
    </div>
  );
}
