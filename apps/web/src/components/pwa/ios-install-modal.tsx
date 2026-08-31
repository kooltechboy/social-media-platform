'use client';

import React, { useEffect, useRef } from 'react';
import { Share, PlusSquare, CheckCircle2, X } from 'lucide-react';

interface IosInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IosInstallModal({ isOpen, onClose }: IosInstallModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus close button on open
    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ios-install-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-sm bg-[#0C1220] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5"
      >
        {/* Header with App Emblem */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral p-[1.5px] shadow-md shadow-brand-caribbeanSea/30">
              <div className="w-full h-full bg-[#0A1428] rounded-2xl flex items-center justify-center">
                <span className="font-black text-transparent bg-clip-text bg-gradient-to-tr from-brand-caribbeanSea to-brand-goldenHour text-lg">
                  T
                </span>
              </div>
            </div>
            <div>
              <h2 id="ios-install-title" className="text-base font-black text-white">
                Install TUKUBI
              </h2>
              <p className="text-xs text-brand-sandstone/60">
                Add to your iPhone / iPad Home Screen
              </p>
            </div>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close installation instructions"
            className="p-1.5 rounded-full text-brand-sandstone/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps List */}
        <div className="space-y-3.5 text-xs text-brand-sandstone/90">
          <div className="flex items-start gap-3 p-3 bg-white/5 border border-white/5 rounded-2xl">
            <div className="w-7 h-7 rounded-xl bg-brand-caribbeanSea/20 text-brand-caribbeanSea flex items-center justify-center shrink-0">
              <Share className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <span className="font-bold text-white block">Step 1: Tap the Share button</span>
              <span className="text-brand-sandstone/60 text-[11px]">
                In Safari&apos;s bottom toolbar (or top right on iPad), tap the Share icon.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white/5 border border-white/5 rounded-2xl">
            <div className="w-7 h-7 rounded-xl bg-brand-goldenHour/20 text-brand-goldenHour flex items-center justify-center shrink-0">
              <PlusSquare className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <span className="font-bold text-white block">Step 2: Add to Home Screen</span>
              <span className="text-brand-sandstone/60 text-[11px]">
                Scroll down the action sheet and select &ldquo;Add to Home Screen&rdquo;.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white/5 border border-white/5 rounded-2xl">
            <div className="w-7 h-7 rounded-xl bg-brand-sunriseCoral/20 text-brand-sunriseCoral flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <span className="font-bold text-white block">Step 3: Tap Add</span>
              <span className="text-brand-sandstone/60 text-[11px]">
                Confirm by tapping &ldquo;Add&rdquo; in the top-right corner to place TUKUBI on your device.
              </span>
            </div>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-brand-caribbeanSea/20 hover:opacity-95 cursor-pointer"
        >
          Got It
        </button>
      </div>
    </div>
  );
}
