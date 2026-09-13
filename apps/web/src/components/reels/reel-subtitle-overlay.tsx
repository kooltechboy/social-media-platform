'use client';

import React, { useState } from 'react';
import { Languages, Subtitles, Volume2 } from 'lucide-react';
import {
  CaptionTrack,
  findActiveCue,
} from '@caribbean/media';
import {
  CARIBBEAN_DIALECT_DETAILS,
  CaribbeanDialect,
} from '@caribbean/localization';

interface ReelSubtitleOverlayProps {
  currentTime: number;
  captions?: CaptionTrack;
  isEnabled: boolean;
  onToggleEnabled?: () => void;
}

export default function ReelSubtitleOverlay({
  currentTime,
  captions,
  isEnabled,
  onToggleEnabled,
}: ReelSubtitleOverlayProps) {
  const [showTranslation, setShowTranslation] = useState(false);

  if (!isEnabled || !captions || !captions.cues || captions.cues.length === 0) {
    return null;
  }

  const activeCue = findActiveCue(captions.cues, currentTime);

  if (!activeCue) {
    return null;
  }

  const dialect = (activeCue.dialect || captions.dialect || 'general') as CaribbeanDialect;
  const dialectMeta = CARIBBEAN_DIALECT_DETAILS[dialect] || CARIBBEAN_DIALECT_DETAILS.general;
  const hasTranslation = Boolean(activeCue.translations?.en);

  const displayText = showTranslation && activeCue.translations?.en
    ? activeCue.translations.en
    : activeCue.text;

  return (
    <div className="absolute left-4 right-20 bottom-32 z-30 pointer-events-none flex flex-col items-center">
      <div className="flex flex-col items-center max-w-[85%] sm:max-w-md w-full transition-all duration-150">
        {/* Dialect / Translation Toggle Chip */}
        <div className="flex items-center gap-1.5 mb-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (hasTranslation) {
                setShowTranslation((prev) => !prev);
              }
            }}
            aria-label="Toggle dialect translation"
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-medium text-white shadow-lg hover:bg-black/80 transition-colors"
          >
            <span>{showTranslation ? '🌐' : dialectMeta.flag}</span>
            <span className="text-brand-sunriseCoral font-bold">
              {showTranslation ? 'Standard English' : dialectMeta.nativeName}
            </span>
            {hasTranslation && (
              <span className="text-[10px] text-white/60 ml-0.5 flex items-center gap-0.5 underline">
                <Languages className="w-2.5 h-2.5" />
                {showTranslation ? 'Show Original' : 'Translate'}
              </span>
            )}
          </button>
        </div>

        {/* High-Legibility Subtitle Card */}
        <div className="bg-black/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 text-center shadow-2xl max-w-full">
          <p className="text-white text-sm sm:text-base font-semibold leading-snug drop-shadow tracking-wide">
            {displayText}
          </p>
        </div>
      </div>
    </div>
  );
}
