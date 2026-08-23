'use client';

import React, { useState } from 'react';

const PHOTOREALISTIC_CARIBBEAN_WALLPAPERS = [
  {
    id: 'sunset-golden',
    name: 'Golden Caribbean Sunset',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=90',
    description: 'Golden sun setting over crystal clear Caribbean sea with palm beach framing',
  },
  {
    id: 'ocean-horizon',
    name: 'Turquoise Ocean Horizon',
    url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=2400&q=90',
    description: 'Vibrant turquoise Caribbean waves glowing under warm sun rays',
  },
  {
    id: 'resort-dusk',
    name: 'Resort Beach Dusk',
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2400&q=90',
    description: 'Serene dusk waves crashing along a tropical palm coast',
  },
];

export default function CaribbeanSunsetBackground() {
  const [activeWallpaperIndex, setActiveWallpaperIndex] = useState(0);

  const current = PHOTOREALISTIC_CARIBBEAN_WALLPAPERS[activeWallpaperIndex];

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#0A1120]">
        {/* Photorealistic High-Definition Background Image Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 transform scale-105"
          style={{
            backgroundImage: `url('${current.url}')`,
            opacity: 0.55,
          }}
        />

        {/* Realistic Golden Sunset & Oceanic Wave Gradient Blends */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1120]/80 via-[#0C1B33]/65 to-[#060D1A]/90 mix-blend-multiply" />

        {/* Radiant Golden Sun Rays & Turquoise Ocean Glow */}
        <div className="absolute top-0 right-1/4 w-[700px] h-[700px] rounded-full bg-radial-gradient from-amber-400/25 via-orange-500/15 to-transparent blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[650px] h-[650px] rounded-full bg-radial-gradient from-sky-400/20 via-teal-500/15 to-transparent blur-[150px] pointer-events-none" />

        {/* Subtle Water Shimmer Ripple Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.05]" />
      </div>

      {/* Photorealistic Wallpaper Switcher Widget */}
      <div className="fixed bottom-4 right-4 z-40 hidden lg:flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-xl border border-sky-500/30 p-1.5 rounded-full shadow-2xl">
        <span className="text-[10px] font-black px-2 text-amber-300 uppercase tracking-widest">
          🌅 Theme:
        </span>
        {PHOTOREALISTIC_CARIBBEAN_WALLPAPERS.map((wp, idx) => (
          <button
            key={wp.id}
            type="button"
            onClick={() => setActiveWallpaperIndex(idx)}
            className={`text-[10px] font-extrabold px-3 py-1 rounded-full transition-all ${
              activeWallpaperIndex === idx
                ? 'bg-gradient-to-r from-amber-400 to-sky-400 text-slate-950 shadow-md scale-105'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            title={wp.description}
          >
            {wp.name}
          </button>
        ))}
      </div>
    </>
  );
}

