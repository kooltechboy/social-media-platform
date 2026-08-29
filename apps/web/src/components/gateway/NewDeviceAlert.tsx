'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert, Check, X, ShieldCheck, Laptop } from 'lucide-react';

export function NewDeviceAlert() {
  const [visible, setVisible] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    browser: 'Web Browser',
    os: 'Device',
    location: 'Miami, Florida',
    time: 'Just now',
  });

  useEffect(() => {
    // Check if security alert was dismissed in this session
    const isDismissed = sessionStorage.getItem('tukubi_device_alert_dismissed');
    if (isDismissed) return;

    // Detect browser/os from navigator
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent;
      let browser = 'Chrome';
      if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
      if (ua.includes('Firefox')) browser = 'Firefox';
      if (ua.includes('Edg')) browser = 'Edge';

      let os = 'Windows';
      if (ua.includes('Macintosh')) os = 'macOS';
      if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
      if (ua.includes('Android')) os = 'Android';
      if (ua.includes('Linux')) os = 'Linux';

      setDeviceInfo({
        browser,
        os,
        location: 'Miami, Florida',
        time: 'Just now',
      });

      // Show alert after short delay on initial login
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleConfirm = () => {
    sessionStorage.setItem('tukubi_device_alert_dismissed', 'true');
    setVisible(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('tukubi_device_alert_dismissed', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full px-4 animate-fadeIn">
      <div className="bg-[#0C1322]/95 backdrop-blur-2xl border border-brand-goldenHour/30 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-black/80 text-white space-y-3 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-goldenHour via-brand-sunriseCoral to-brand-caribbeanSea" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-goldenHour/15 border border-brand-goldenHour/40 flex items-center justify-center text-brand-goldenHour flex-shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide">
                New Sign-In Detected
              </h4>
              <p className="text-[11px] text-brand-sandstone/60">
                Tukubi Account Security
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss alert"
            className="text-brand-sandstone/40 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-[#080D18] border border-white/5 rounded-xl p-2.5 flex items-center gap-3 text-xs">
          <Laptop className="w-4 h-4 text-brand-caribbeanSea flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-brand-sandstone/90 font-medium truncate">
              {deviceInfo.browser} on {deviceInfo.os}
            </p>
            <p className="text-[10px] text-brand-sandstone/50">
              Near {deviceInfo.location} • {deviceInfo.time}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-2 px-3 rounded-xl font-bold text-xs bg-brand-caribbeanSea/20 hover:bg-brand-caribbeanSea/30 text-brand-caribbeanSea border border-brand-caribbeanSea/40 transition-colors flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Yes, it was me</span>
          </button>

          <Link
            href="/settings/security"
            onClick={handleDismiss}
            className="py-2 px-3 rounded-xl font-semibold text-xs bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-colors flex items-center justify-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure account</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
