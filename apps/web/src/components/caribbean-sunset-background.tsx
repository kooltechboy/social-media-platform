'use client';

import React from 'react';

export const ISLAND_VIBES_THEME = {
  id: 'island-vibes',
  name: 'Island Vibes',
  url: '/backgrounds/island-vibes.jpg',
  fallbackUrl: 'https://images.unsplash.com/photo-1531761535209-180857e963b9?auto=format&fit=crop&w=2400&q=90',
  description: 'Tropical beach gathering, warm festive energy, and vibrant Caribbean culture',
  overlayGradient: `linear-gradient(to bottom,
    rgba(24, 10, 36, 0.35) 0%,
    rgba(24, 10, 36, 0.10) 25%,
    rgba(24, 10, 36, 0.25) 60%,
    rgba(17, 13, 23, 0.75) 100%
  )`,
};

export const DEFAULT_THEME_ID = 'island-vibes';
export const CARIBBEAN_THEMES = [ISLAND_VIBES_THEME];

export default function CaribbeanSunsetBackground() {
  const [imgSrc, setImgSrc] = React.useState(ISLAND_VIBES_THEME.url);

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* High-Resolution Caribbean Backdrop Image via Native Element */}
      <picture className="absolute inset-0 w-full h-full">
        <img
          src={imgSrc}
          alt="Caribbean Backdrop"
          className="w-full h-full object-cover object-center transition-opacity duration-700"
          style={{
            filter: 'saturate(1.15) brightness(1.05)',
          }}
          onError={() => {
            if (imgSrc !== ISLAND_VIBES_THEME.fallbackUrl) {
              setImgSrc(ISLAND_VIBES_THEME.fallbackUrl);
            }
          }}
        />
      </picture>

      {/* Atmospheric Contrast Overlay Gradient */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: ISLAND_VIBES_THEME.overlayGradient,
        }}
      />

      {/* Radiant Golden Hour / Coral Glow (Top-Right) */}
      <div
        className="absolute -top-16 -right-16 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-amber-400/25 via-orange-500/15 to-transparent blur-[140px] pointer-events-none"
      />

      {/* Radiant Caribbean Sea Turquoise Glow (Bottom-Left) */}
      <div
        className="absolute -bottom-20 -left-20 w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-cyan-400/25 via-sky-500/15 to-transparent blur-[140px] pointer-events-none"
      />

      {/* Subtle Water Shimmer Ripple Pattern */}
      <div
        className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04]"
      />
    </div>
  );
}

