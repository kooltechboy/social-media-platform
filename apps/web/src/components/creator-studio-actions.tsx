'use client';

import React, { useState } from 'react';
import { Plus, Target, Radio, Sparkles } from 'lucide-react';
import CreatorTierModal from './creator-tier-modal';
import DiasporaAdsManagerModal from './diaspora-ads-manager-modal';

interface CreatorStudioActionsProps {
  displayName?: string;
}

export default function CreatorStudioActions({ displayName = 'Creator' }: CreatorStudioActionsProps) {
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [isAdsModalOpen, setIsAdsModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href="/live/broadcast"
          className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-red-600/20 transition-all hover:scale-105"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>🔴 Go Live</span>
        </a>

        <button
          type="button"
          onClick={() => setIsTierModalOpen(true)}
          className="bg-brand-dusk hover:bg-slate-700 text-brand-sandstone border border-slate-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors shadow-sm"
        >
          <Radio className="w-3.5 h-3.5 text-brand-caribbeanSea" />
          <span>Membership Tiers</span>
        </button>

        <button
          type="button"
          onClick={() => setIsAdsModalOpen(true)}
          className="bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour hover:opacity-90 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-brand-sunriseCoral/20 transition-all hover:scale-105"
        >
          <Target className="w-3.5 h-3.5 text-white" />
          <span>Promote to Diaspora</span>
        </button>
      </div>

      <CreatorTierModal
        isOpen={isTierModalOpen}
        onClose={() => setIsTierModalOpen(false)}
        creatorName={displayName}
      />

      <DiasporaAdsManagerModal
        isOpen={isAdsModalOpen}
        onClose={() => setIsAdsModalOpen(false)}
        advertiserName={displayName}
      />
    </>
  );
}
