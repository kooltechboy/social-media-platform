'use client';

import { useState, useEffect, useCallback } from 'react';

// Window BeforeInstallPromptEvent interface for TypeScript
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PwaPlatformInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isEdge: boolean;
  isFirefox: boolean;
}

export type InstallOutcome = 'accepted' | 'dismissed' | 'unsupported' | 'ios-instructions';

const DISMISSAL_STORAGE_KEY = 'tukubi_pwa_dismissed_at';
const INSTALLED_STORAGE_KEY = 'tukubi_pwa_installed';
const DISMISSAL_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Browser-safe PWA event telemetry
export function trackPwaEvent(
  eventName: string,
  properties: Record<string, string | number | boolean | null> = {}
) {
  try {
    if (typeof window !== 'undefined') {
      // Console telemetry for local auditing
      if (process.env.NODE_ENV !== 'production') {
        console.info(`[TUKUBI PWA Telemetry] ${eventName}`, properties);
      }

      // Custom window event for analytics listeners
      window.dispatchEvent(
        new CustomEvent('tukubi_pwa_event', {
          detail: { eventName, properties, timestamp: new Date().toISOString() },
        })
      );
    }
  } catch {
    // Fail silently without disrupting UI
  }
}

export function detectPwaPlatform(): PwaPlatformInfo {
  if (typeof window === 'undefined') {
    return {
      isIOS: false,
      isAndroid: false,
      isDesktop: true,
      isSafari: false,
      isChrome: false,
      isEdge: false,
      isFirefox: false,
    };
  }

  const ua = window.navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isDesktop = !isIOS && !isAndroid;

  const isEdge = /Edg\//i.test(ua);
  const isChrome = /Chrome/i.test(ua) && !isEdge;
  const isSafari = /Safari/i.test(ua) && !isChrome && !isEdge;
  const isFirefox = /Firefox/i.test(ua);

  return {
    isIOS,
    isAndroid,
    isDesktop,
    isSafari,
    isChrome,
    isEdge,
    isFirefox,
  };
}

export function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
  const isNavigatorStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  const isAndroidReferrer = document.referrer.includes('android-app://');

  return Boolean(isStandaloneMedia || isNavigatorStandalone || isAndroidReferrer);
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [platform, setPlatform] = useState<PwaPlatformInfo>({
    isIOS: false,
    isAndroid: false,
    isDesktop: true,
    isSafari: false,
    isChrome: false,
    isEdge: false,
    isFirefox: false,
  });
  const [showIosModal, setShowIosModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Initialize environment detection & listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const detectedPlatform = detectPwaPlatform();
    setPlatform(detectedPlatform);

    const standaloneActive = checkIsStandalone();
    setIsStandalone(standaloneActive);

    const persistedInstalled = localStorage.getItem(INSTALLED_STORAGE_KEY) === 'true';
    const installed = standaloneActive || persistedInstalled;
    setIsInstalled(installed);

    if (installed) {
      trackPwaEvent('pwa_already_installed', {
        standalone: standaloneActive,
        platform: detectedPlatform.isIOS ? 'ios' : detectedPlatform.isAndroid ? 'android' : 'desktop',
      });
    }

    // Check dismissal cooldown
    const dismissedAt = localStorage.getItem(DISMISSAL_STORAGE_KEY);
    if (dismissedAt) {
      const parsedTime = parseInt(dismissedAt, 10);
      if (!isNaN(parsedTime) && Date.now() - parsedTime < DISMISSAL_COOLDOWN_MS) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem(DISMISSAL_STORAGE_KEY);
      }
    }

    // Native beforeinstallprompt handler (Chromium & Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);

      trackPwaEvent('pwa_install_prompt_available', {
        platform: detectedPlatform.isAndroid ? 'android' : 'desktop',
      });
    };

    // Native appinstalled handler
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      setIsInstallable(false);
      localStorage.setItem(INSTALLED_STORAGE_KEY, 'true');
      localStorage.removeItem(DISMISSAL_STORAGE_KEY);

      trackPwaEvent('pwa_install_completed', {
        platform: detectedPlatform.isIOS ? 'ios' : detectedPlatform.isAndroid ? 'android' : 'desktop',
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // iOS Safari is installable via Add to Home Screen if not already standalone
    if (detectedPlatform.isIOS && !installed) {
      setIsInstallable(true);
    }

    // Register Service Worker in production
    if ('serviceWorker' in navigator && (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_SW === 'true')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            registration.addEventListener('updatefound', () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.addEventListener('statechange', () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    installingWorker.postMessage({ type: 'SKIP_WAITING' });
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.warn('[TUKUBI SW] Registration failed:', err);
          });
      });
    }

    setIsReady(true);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Dismiss prompt and activate cooldown
  const dismissPrompt = useCallback(() => {
    setIsDismissed(true);
    localStorage.setItem(DISMISSAL_STORAGE_KEY, Date.now().toString());
    trackPwaEvent('pwa_install_dismissed', {
      cooldownDays: 7,
    });
  }, []);

  // Trigger installation prompt or guidance
  const promptInstall = useCallback(async (): Promise<InstallOutcome> => {
    trackPwaEvent('pwa_install_clicked', {
      platform: platform.isIOS ? 'ios' : platform.isAndroid ? 'android' : 'desktop',
      hasNativePrompt: Boolean(deferredPrompt),
    });

    // 1. Native Chromium Install Prompt
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setIsInstallable(false);
          setDeferredPrompt(null);
          localStorage.setItem(INSTALLED_STORAGE_KEY, 'true');
          trackPwaEvent('pwa_install_completed', { method: 'native_prompt' });
          return 'accepted';
        } else {
          dismissPrompt();
          return 'dismissed';
        }
      } catch (err) {
        console.error('[TUKUBI PWA] Prompt execution error:', err);
        return 'dismissed';
      }
    }

    // 2. iOS Safari Add to Home Screen Instructions
    if (platform.isIOS) {
      setShowIosModal(true);
      trackPwaEvent('pwa_ios_install_instructions_shown');
      return 'ios-instructions';
    }

    // 3. Fallback for unsupported browsers
    return 'unsupported';
  }, [deferredPrompt, platform, dismissPrompt]);

  const closeIosModal = useCallback(() => {
    setShowIosModal(false);
  }, []);

  return {
    isReady,
    isStandalone,
    isInstalled,
    isInstallable,
    isDismissed,
    platform,
    hasNativePrompt: Boolean(deferredPrompt),
    showIosModal,
    promptInstall,
    dismissPrompt,
    closeIosModal,
  };
}
