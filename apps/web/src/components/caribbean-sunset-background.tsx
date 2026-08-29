'use client';

import React, { useState } from 'react';

// Island Vibes — Mandatory default and only active visual theme for TUKUBI
const ISLAND_VIBES_THEME = {
  id: 'island-vibes',
  name: '🌴 Island Vibes',
  // Stunning Caribbean tropical atmosphere, coconut palms, turquoise shores & warm ambient energy
  url: 'https://images.unsplash.com/photo-1531761535209-180857e963b9?auto=format&fit=crop&w=2400&q=90',
  overlayFrom: 'rgba(29, 20, 41, 0.65)',
  overlayTo: 'rgba(17, 13, 23, 0.85)',
};

export default function CaribbeanSunsetBackground() {
  return (
    <>
      {/* ─── Island Vibes Fixed Background ─── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* The high-resolution tropical backdrop */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700"
          style={{ backgroundImage: `url('${ISLAND_VIBES_THEME.url}')` }}
        />

        {/* Cohesive Island Vibes gradient overlay for text legibility and Caribbean depth */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(to bottom,
                ${ISLAND_VIBES_THEME.overlayFrom} 0%,
                rgba(17, 13, 23, 0.40) 40%,
                rgba(17, 13, 23, 0.60) 60%,
                ${ISLAND_VIBES_THEME.overlayTo} 100%
              )
            `,
          }}
        />
      </div>
    </>
  );
}
