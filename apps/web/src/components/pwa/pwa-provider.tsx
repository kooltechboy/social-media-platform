'use client';

import React, { createContext, useContext } from 'react';
import { usePwaInstall, type PwaPlatformInfo, type InstallOutcome } from '../../lib/pwa/use-pwa-install';
import { PwaInstallBanner } from './pwa-install-banner';
import { IosInstallModal } from './ios-install-modal';

interface PwaContextValue {
  isReady: boolean;
  isStandalone: boolean;
  isInstalled: boolean;
  isInstallable: boolean;
  isDismissed: boolean;
  platform: PwaPlatformInfo;
  hasNativePrompt: boolean;
  promptInstall: () => Promise<InstallOutcome>;
  dismissPrompt: () => void;
}

const PwaContext = createContext<PwaContextValue | null>(null);

export function usePwa() {
  const ctx = useContext(PwaContext);
  if (!ctx) {
    throw new Error('usePwa must be used within a PwaProvider');
  }
  return ctx;
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const pwa = usePwaInstall();

  const contextValue: PwaContextValue = {
    isReady: pwa.isReady,
    isStandalone: pwa.isStandalone,
    isInstalled: pwa.isInstalled,
    isInstallable: pwa.isInstallable,
    isDismissed: pwa.isDismissed,
    platform: pwa.platform,
    hasNativePrompt: pwa.hasNativePrompt,
    promptInstall: pwa.promptInstall,
    dismissPrompt: pwa.dismissPrompt,
  };

  return (
    <PwaContext.Provider value={contextValue}>
      {children}

      {/* Floating Polite Installation Banner */}
      <PwaInstallBanner
        isInstallable={pwa.isInstallable}
        isInstalled={pwa.isInstalled}
        isStandalone={pwa.isStandalone}
        isDismissed={pwa.isDismissed}
        onInstall={pwa.promptInstall}
        onDismiss={pwa.dismissPrompt}
      />

      {/* iOS Step-by-Step Guidance Sheet */}
      <IosInstallModal
        isOpen={pwa.showIosModal}
        onClose={pwa.closeIosModal}
      />
    </PwaContext.Provider>
  );
}
