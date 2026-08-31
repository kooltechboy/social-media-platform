'use client';

import React, { useState, useEffect } from 'react';

export interface BackgroundTheme {
  id: string;
  name: string;
  url: string;
  description: string;
  overlayGradient: string;
}

export const CARIBBEAN_THEMES: BackgroundTheme[] = [
  {
    id: 'palm-beach',
    name: '🌴 Palm Beach',
    // Turquoise Caribbean sea, fine white sand, and swaying tropical coconut palms
    url: 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?auto=format&fit=crop&w=2400&q=90',
    description: 'Crystal turquoise waters, fine white sand, and swaying tropical coconut palms',
    overlayGradient: `linear-gradient(to bottom,
      rgba(8, 16, 32, 0.45) 0%,
      rgba(8, 16, 32, 0.15) 30%,
      rgba(8, 16, 32, 0.35) 65%,
      rgba(8, 16, 32, 0.85) 100%
    )`,
  },
  {
    id: 'sunset-shore',
    name: '🌅 Sunset Shore',
    // Vivid Caribbean sunset with warm coral, amber, and golden horizon tones
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=90',
    description: 'Vivid Caribbean sunset with warm coral, amber, and golden horizon tones',
    overlayGradient: `linear-gradient(to bottom,
      rgba(36, 14, 10, 0.45) 0%,
      rgba(36, 14, 10, 0.15) 30%,
      rgba(36, 14, 10, 0.35) 65%,
      rgba(18, 8, 12, 0.85) 100%
    )`,
  },
  {
    id: 'island-vibes',
    name: '🎉 Island Vibes',
    // Tropical beach gathering, warm festive energy, and vibrant Caribbean culture
    url: 'https://images.unsplash.com/photo-1531761535209-180857e963b9?auto=format&fit=crop&w=2400&q=90',
    description: 'Tropical beach gathering, warm festive energy, and vibrant Caribbean culture',
    overlayGradient: `linear-gradient(to bottom,
      rgba(24, 10, 36, 0.45) 0%,
      rgba(24, 10, 36, 0.15) 30%,
      rgba(24, 10, 36, 0.35) 65%,
      rgba(17, 13, 23, 0.85) 100%
    )`,
  },
  {
    id: 'reef-dusk',
    name: '🌊 Reef Dusk',
    // Dramatic azure and bioluminescent turquoise deep-sea Caribbean waters
    url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2400&q=90',
    description: 'Dramatic azure and bioluminescent turquoise deep-sea Caribbean waters',
    overlayGradient: `linear-gradient(to bottom,
      rgba(0, 24, 48, 0.45) 0%,
      rgba(0, 24, 48, 0.15) 30%,
      rgba(0, 24, 48, 0.35) 65%,
      rgba(5, 15, 30, 0.85) 100%
    )`,
  },
];

export default function CaribbeanSunsetBackground() {
  const [activeThemeIndex, setActiveThemeIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const savedThemeId = localStorage.getItem('tukubi_bg_theme');
      if (savedThemeId) {
        const found = CARIBBEAN_THEMES.findIndex((t) => t.id === savedThemeId);
        if (found >= 0) {
          setActiveThemeIndex(found);
        }
      }
    } catch {
      // Ignore localStorage read errors in private browsing
    }
  }, []);

  const handleSelectTheme = (idx: number) => {
    setActiveThemeIndex(idx);
    try {
      localStorage.setItem('tukubi_bg_theme', CARIBBEAN_THEMES[idx].id);
    } catch {
      // Ignore
    }
  };

  const currentTheme = CARIBBEAN_THEMES[activeThemeIndex] || CARIBBEAN_THEMES[0];

  return (
    <>
      {/* ─── Global Fixed Caribbean Background Layer ─── */}
      <div
        className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none"
        aria-hidden="true"
      >
        {/* High-Resolution Caribbean Backdrop Image */}
        <div
          key={currentTheme.id}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700"
          style={{
            backgroundImage: `url('${currentTheme.url}')`,
            filter: 'saturate(1.10) brightness(1.02)',
          }}
        />

        {/* Atmospheric Contrast Overlay Gradient */}
        <div
          className="absolute inset-0 transition-all duration-700"
          style={{
            background: currentTheme.overlayGradient,
          }}
        />

        {/* Radiant Golden Hour / Coral Glow (Top-Right) */}
        <div
          className="absolute -top-16 -right-16 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-amber-400/20 via-orange-500/10 to-transparent blur-[140px] pointer-events-none"
        />

        {/* Radiant Caribbean Sea Turquoise Glow (Bottom-Left) */}
        <div
          className="absolute -bottom-20 -left-20 w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-cyan-400/20 via-sky-500/10 to-transparent blur-[140px] pointer-events-none"
        />

        {/* Subtle Water Shimmer Ripple Pattern */}
        <div
          className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.035]"
        />
      </div>

      {/* ─── Minimal Desktop Theme Switcher Pill (Fixed Bottom Right) ─── */}
      {mounted && (
        <aside
          aria-label="Background Theme Selector"
          className="fixed bottom-6 right-6 z-40 hidden lg:flex items-center gap-1 bg-[#0a0612]/75 backdrop-blur-2xl border border-white/15 px-3 py-1.5 rounded-full shadow-2xl transition-all hover:border-white/30"
        >
          <span className="text-[10px] font-black tracking-widest text-brand-goldenHour uppercase mr-1.5 select-none">
            🌴 Vibe:
          </span>
          <div className="flex items-center gap-1">
            {CARIBBEAN_THEMES.map((theme, idx) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleSelectTheme(idx)}
                title={theme.description}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all duration-200 ${
                  activeThemeIndex === idx
                    ? 'bg-gradient-to-r from-brand-goldenHour via-brand-sunriseCoral to-brand-caribbeanSea text-slate-950 shadow-md font-black scale-105'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {theme.name}
              </button>
            ))}
          </div>
        </aside>
      )}
    </>
  );
}
