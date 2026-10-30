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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070D1A]/80 backdrop-blur-sm animate-fadeIn"
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
        className="relative z-10 w-full max-w-sm bg-[#0D1628] border border-white/[0.10] rounded-2xl p-6 shadow-2xl space-y-5"
      >
        {/* Header with Official App Emblem */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B1B3B] border border-[#00C2A8]/30 flex items-center justify-center shadow-md shadow-[#00C2A8]/15">
              <img
                src="/brand/tukubi-emblem.png"
                alt=""
                aria-hidden="true"
                className="w-6 h-6 object-contain"
              />
            </div>
            <div>
              <h2 id="ios-install-title" className="text-base font-bold text-[#F8FAFC]">
                Install TUKUBI
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Add to your iPhone / iPad Home Screen
              </p>
            </div>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close installation instructions"
            className="p-1.5 rounded-full text-[#94A3B8] hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps List */}
        <div className="space-y-3 text-xs text-[#E8EDF5]">
          <div className="flex items-start gap-3 p-3 bg-[#15213A]/70 border border-white/[0.06] rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-[#0EA5E9]/15 text-[#0EA5E9] flex items-center justify-center shrink-0">
              <Share className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <span className="font-semibold text-[#F8FAFC] block">Step 1: Tap the Share button</span>
              <span className="text-[#94A3B8] text-[11px]">
                In Safari&apos;s bottom toolbar (or top right on iPad), tap the Share icon.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-[#15213A]/70 border border-white/[0.06] rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-[#00C2A8]/15 text-[#00C2A8] flex items-center justify-center shrink-0">
              <PlusSquare className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <span className="font-semibold text-[#F8FAFC] block">Step 2: Add to Home Screen</span>
              <span className="text-[#94A3B8] text-[11px]">
                Scroll down the action sheet and select &ldquo;Add to Home Screen&rdquo;.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-[#15213A]/70 border border-white/[0.06] rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-[#8B5CF6]/15 text-[#A78BFA] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <span className="font-semibold text-[#F8FAFC] block">Step 3: Tap Add</span>
              <span className="text-[#94A3B8] text-[11px]">
                Confirm by tapping &ldquo;Add&rdquo; in the top-right corner to place TUKUBI on your device.
              </span>
            </div>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 tk-btn-primary font-bold text-xs rounded-xl transition-all cursor-pointer min-h-[42px]"
        >
          Got It
        </button>
      </div>
    </div>
  );
}
