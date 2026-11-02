'use client';

import React from 'react';
import { Sparkles, Trash2, RotateCcw } from 'lucide-react';
import type { ComposerDraftData } from '../../lib/social/draft-manager';

interface DraftRestoreBannerProps {
  draft: ComposerDraftData;
  onRestore: () => void;
  onDiscard: () => void;
}

function formatDraftAge(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export function DraftRestoreBanner({ draft, onRestore, onDiscard }: DraftRestoreBannerProps) {
  const snippet = draft.content.trim().slice(0, 60);

  return (
    <div
      role="region"
      aria-label="Recover saved composer draft"
      className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-brand-caribbeanSea/15 via-[#0C1527] to-brand-goldenHour/10 border border-brand-caribbeanSea/30 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn shadow-lg shadow-black/40"
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-xl bg-brand-caribbeanSea/20 border border-brand-caribbeanSea/40 flex items-center justify-center text-brand-caribbeanSea shrink-0">
          <Sparkles className="w-4 h-4 text-brand-goldenHour" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white tracking-wide">
              Unsaved Caribbean Draft Found
            </span>
            <span className="text-[10px] text-brand-sandstone/50 font-mono">
              ({formatDraftAge(draft.updatedAt)})
            </span>
          </div>
          {snippet && (
            <p className="text-xs text-brand-sandstone/70 truncate max-w-md mt-0.5">
              &ldquo;{snippet}{draft.content.length > 60 ? '…' : ''}&rdquo;
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <button
          type="button"
          onClick={onDiscard}
          className="text-xs font-semibold text-brand-sandstone/60 hover:text-rose-400 px-2.5 py-1.5 rounded-xl hover:bg-rose-500/10 transition-colors flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Discard</span>
        </button>

        <button
          type="button"
          onClick={onRestore}
          className="text-xs font-bold text-[#06101E] bg-gradient-to-r from-brand-caribbeanSea to-brand-goldenHour hover:brightness-110 px-3.5 py-1.5 rounded-xl transition-all shadow-md shadow-brand-caribbeanSea/20 flex items-center gap-1.5 active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restore Draft</span>
        </button>
      </div>
    </div>
  );
}
