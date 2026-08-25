'use client';

import React, { useState } from 'react';

// Each theme uses a HIGH-QUALITY, FULL-RES Unsplash image that fills the screen.
const THEMES = [
  {
    id: 'palm-beach',
    name: '🌴 Palm Beach',
    // Stunning Caribbean beach — turquoise water, white sand, palm trees
    url: 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?auto=format&fit=crop&w=2400&q=90',
    // Overlay tint colors that complement this image
    overlayFrom: 'rgba(0,60,80,0.55)',
    overlayTo: 'rgba(5,20,35,0.80)',
  },
  {
    id: 'sunset-shore',
    name: '🌅 Sunset Shore',
    // Vivid Caribbean sunset with warm coral + gold tones
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=90',
    overlayFrom: 'rgba(80,20,10,0.50)',
    overlayTo: 'rgba(20,8,2,0.78)',
  },
  {
    id: 'island-vibes',
    name: '🎉 Island Vibes',
    // People enjoying a tropical beach gathering, coconut palms, festive energy
    url: 'https://images.unsplash.com/photo-1531761535209-180857e963b9?auto=format&fit=crop&w=2400&q=90',
    overlayFrom: 'rgba(40,10,60,0.50)',
    overlayTo: 'rgba(10,5,20,0.78)',
  },
  {
    id: 'reef-dusk',
    name: '🌊 Reef Dusk',
    // Dramatic turquoise waters, bioluminescent blue vibes
    url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2400&q=90',
    overlayFrom: 'rgba(0,30,60,0.55)',
    overlayTo: 'rgba(0,10,25,0.80)',
  },
];

export default function CaribbeanSunsetBackground() {
  const [active, setActive] = useState(0);

  const theme = THEMES[active];

  return (
    <>
      {/* ─── Full-screen fixed background ─── */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {/* The photo — no blend modes that destroy the image */}
        <div
          key={theme.id}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700"
          style={{ backgroundImage: `url('${theme.url}')` }}
        />

        {/* Clean dark gradient overlay for legibility — gradient from top and bottom only */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(to bottom,
                ${theme.overlayFrom} 0%,
                rgba(0,0,0,0.15) 40%,
                rgba(0,0,0,0.15) 60%,
                ${theme.overlayTo} 100%
              )
            `,
          }}
        />
      </div>

      {/* ─── Theme Switcher — bottom right, minimal ─── */}
      <div className="fixed bottom-6 right-6 z-50 hidden md:flex items-center gap-1.5 bg-black/40 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-full">
        {THEMES.map((t, idx) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(idx)}
            title={t.name}
            className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-all duration-200 ${
              active === idx
                ? 'bg-white/20 text-white border border-white/30'
                : 'text-white/50 hover:text-white/80 hover:bg-white/10'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>
    </>
  );
}
