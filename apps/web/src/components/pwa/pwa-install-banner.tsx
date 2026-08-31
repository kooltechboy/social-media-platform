'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Download } from 'lucide-react';
import { trackPwaEvent } from '../../lib/pwa/use-pwa-install';

interface PwaInstallBannerProps {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isDismissed: boolean;
  onInstall: () => Promise<unknown>;
  onDismiss: () => void;
}

export function PwaInstallBanner({
  isInstallable,
  isInstalled,
  isStandalone,
  isDismissed,
  onInstall,
  onDismiss,
}: PwaInstallBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Suppress if already installed, standalone, or previously dismissed within cooldown
    if (!isInstallable || isInstalled || isStandalone || isDismissed) {
      setIsVisible(false);
      return;
    }

    // Polite 4-second engagement delay before showing prompt to the user
    const timer = setTimeout(() => {
      setIsVisible(true);
      trackPwaEvent('pwa_install_prompt_shown');
    }, 4000);

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, isStandalone, isDismissed]);

  if (!isVisible) return null;

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await onInstall();
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  return (
    <aside
      aria-label="Install TUKUBI"
      className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-40 max-w-sm w-[calc(100vw-1.5rem)] sm:w-full animate-slideUp pointer-events-auto"
    >
      <div className="relative bg-[#0C1220]/95 backdrop-blur-xl border border-brand-caribbeanSea/30 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-black/80 space-y-3.5">
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-caribbeanSea/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header & Close Button */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            {/* TUKUBI Icon Badge */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral p-[1.5px] shadow-lg shadow-brand-caribbeanSea/30 shrink-0">
              <div className="w-full h-full bg-[#0A1428] rounded-2xl flex items-center justify-center">
                <span className="font-black text-transparent bg-clip-text bg-gradient-to-tr from-brand-caribbeanSea to-brand-goldenHour text-lg">
                  T
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-white tracking-tight">
                  Install TUKUBI
                </h3>
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/30">
                  <Sparkles className="w-2.5 h-2.5" /> PWA
                </span>
              </div>
              <p className="text-[11px] text-brand-sandstone/60 font-medium">
                The Caribbean Connected.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss installation prompt"
            className="p-1 rounded-full text-brand-sandstone/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Supporting Copy */}
        <p className="text-xs text-brand-sandstone/85 leading-relaxed relative z-10">
          Take TUKUBI with you. Install the app for quick access and an app-like experience.
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 relative z-10">
          <button
            type="button"
            disabled={isInstalling}
            onClick={handleInstall}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral hover:opacity-95 text-slate-950 font-black text-xs py-2.5 px-4 rounded-xl transition-all shadow-md shadow-brand-caribbeanSea/20 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isInstalling ? 'Opening…' : 'Install TUKUBI'}</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-2.5 text-xs font-bold text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </aside>
  );
}
