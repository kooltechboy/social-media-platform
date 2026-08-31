'use client';

import React, { useState } from 'react';
import { Landmark, Sparkles, Check, ArrowRight } from 'lucide-react';

interface FounderOnboardingModalProps {
  founderNumber: number;
  formattedNumber: string;
  programName: string;
  onClose: () => void;
}

export default function FounderOnboardingModal({
  founderNumber,
  formattedNumber,
  programName,
  onClose,
}: FounderOnboardingModalProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  const handleDismiss = () => {
    setIsOpen(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#101A30] via-brand-dusk to-[#090D16] border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-950/40 text-center space-y-6 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Icon & Heading */}
        <div className="relative space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/30 to-purple-600/30 border border-amber-400/50 flex items-center justify-center mx-auto shadow-xl">
            <Landmark className="w-10 h-10 text-amber-300 animate-bounce" />
          </div>

          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Sparkles className="w-3.5 h-3.5" /> Welcome to History
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-brand-sandstone tracking-tight">
            You helped build TUKUBI.
          </h2>
          <p className="text-xs sm:text-sm text-brand-sandstone/70 leading-relaxed max-w-md mx-auto">
            You are officially registered among the first pioneer members of the Caribbean Digital Ecosystem.
          </p>
        </div>

        {/* Founder Card Banner */}
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-5 space-y-2 relative overflow-hidden">
          <p className="text-[11px] font-black uppercase tracking-widest text-amber-400">
            {programName}
          </p>
          <div className="text-3xl sm:text-4xl font-black text-amber-200 font-mono tracking-wider">
            {formattedNumber}
          </div>
          <p className="text-[11px] text-brand-sandstone/50">
            Permanent Historical Designation
          </p>
        </div>

        {/* Value Points */}
        <div className="text-left space-y-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-4 text-xs text-brand-sandstone/80">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-brand-caribbeanSea shrink-0" />
            <span>Permanent badge proudly displayed on your profile</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-brand-caribbeanSea shrink-0" />
            <span>Early access to upcoming Creator Studio &amp; Marketplace features</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-brand-caribbeanSea shrink-0" />
            <span>Eligibility for the TUKUBI Founders Council</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleDismiss}
          className="w-full bg-gradient-to-r from-brand-caribbeanSea via-teal-400 to-brand-caribbeanSea text-slate-950 font-black text-sm py-3.5 px-6 rounded-2xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>Enter Ecosystem</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
