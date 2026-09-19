'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, X, Sparkles, UserCheck, ShieldCheck, ArrowRight } from 'lucide-react';

interface CreatorTipModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorName: string;
  creatorHandle: string;
  creatorId?: string;
}

export default function CreatorTipModal({
  isOpen,
  onClose,
  creatorName,
  creatorHandle,
}: CreatorTipModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-twilight/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-brand-dusk border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-2 rounded-full text-brand-sandstone/60 hover:text-white hover:bg-white/10 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-brand-sunriseCoral/20 text-brand-sunriseCoral border border-brand-sunriseCoral/30 shrink-0">
            <Heart className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Coming Soon
              </span>
            </div>
            <h3 className="font-black text-lg text-white flex items-center gap-1.5 pt-0.5">
              Direct Patronage <Sparkles className="w-4 h-4 text-brand-goldenHour" />
            </h3>
            <p className="text-xs text-brand-sandstone/70">Support {creatorName} (@{creatorHandle})</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 text-xs text-slate-300 leading-relaxed">
          <div className="flex items-center gap-2 font-bold text-white">
            <ShieldCheck className="w-4 h-4 text-brand-caribbeanSea shrink-0" />
            <span>Regulated Caribbean Creator Payouts</span>
          </div>
          <p>
            Multi-currency creator tipping across the Caribbean (JMD, TTD, BBD, XCD, USD) is currently undergoing verified payment provider certification in accordance with TUKUBI&apos;s Payment Policy Engine.
          </p>
          <p className="text-brand-sandstone/70">
            In the meantime, you can directly support Caribbean creators by following their account, favoriting their profile, and sharing their content across the diaspora network.
          </p>
        </div>

        <div className="space-y-2 pt-1">
          <Link
            href={`/profile/${encodeURIComponent(creatorHandle)}`}
            onClick={onClose}
            className="w-full bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour hover:opacity-95 text-slate-950 font-black py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-brand-sunriseCoral/20 min-h-[44px]"
          >
            <UserCheck className="w-4 h-4" />
            <span>Visit @{creatorHandle}&apos;s Profile</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-brand-sandstone/70 hover:text-white transition-colors min-h-[40px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
