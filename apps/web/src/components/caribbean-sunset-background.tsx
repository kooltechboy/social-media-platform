'use client';

import React from 'react';

/**
 * TUKUBI "Midnight Reef" backdrop (ADR-UI-002).
 *
 * A single editorial Caribbean coastline photograph at blue hour, graded into the
 * official deep-navy identity. The image is intentionally quiet: content panels sit
 * on near-opaque navy surfaces, and the photograph only breathes through the
 * gutters and the top of the viewport — the way premium hospitality brands use
 * photography as atmosphere rather than decoration.
 *
 * The exported theme constants keep their legacy names for compatibility with
 * existing imports (`ISLAND_VIBES_THEME`, `CARIBBEAN_THEMES`).
 */
export const ISLAND_VIBES_THEME = {
  id: 'island-vibes',
  name: 'Midnight Reef',
  url: '/backgrounds/caribbean-blue-hour.jpg',
  fallbackUrl: '/backgrounds/island-vibes.jpg',
  description: 'Caribbean coastline at blue hour — deep navy, reef teal and a warm golden horizon',
  overlayGradient: `linear-gradient(180deg,
    rgba(6, 11, 22, 0.55) 0%,
    rgba(6, 11, 22, 0.72) 30%,
    rgba(6, 11, 22, 0.86) 65%,
    rgba(6, 11, 22, 0.94) 100%
  )`,
};

export const DEFAULT_THEME_ID = 'island-vibes';
export const CARIBBEAN_THEMES = [ISLAND_VIBES_THEME];

export default function CaribbeanSunsetBackground() {
  const [imgSrc, setImgSrc] = React.useState(ISLAND_VIBES_THEME.url);

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none bg-brand-ink"
      aria-hidden="true"
    >
      {/* Editorial photograph, slightly desaturated for a calm, expensive tone */}
      <img
        src={imgSrc}
        alt=""
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-[center_35%] scale-[1.03]"
        style={{ filter: 'saturate(0.85) brightness(0.8) contrast(1.05)' }}
        onError={() => {
          if (imgSrc !== ISLAND_VIBES_THEME.fallbackUrl) {
            setImgSrc(ISLAND_VIBES_THEME.fallbackUrl);
          }
        }}
      />

      {/* Navy grade — keeps every surface legible (WCAG 2.2 AA) */}
      <div className="absolute inset-0" style={{ background: ISLAND_VIBES_THEME.overlayGradient }} />

      {/* Cinematic vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 20%, transparent 40%, rgba(4, 8, 16, 0.65) 100%)',
        }}
      />

      {/* A single, faint golden-hour warmth on the horizon line */}
      <div
        className="absolute -top-40 right-[-10%] w-[900px] h-[520px] rounded-full blur-[160px] opacity-[0.18]"
        style={{ background: 'radial-gradient(closest-side, #F4AE45, transparent)' }}
      />

      {/* Fine film grain to remove banding on large dark gradients */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
