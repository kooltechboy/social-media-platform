'use client';

import React, { useState } from 'react';

const PHOTOREALISTIC_CARIBBEAN_WALLPAPERS = [
  {
    id: 'sunset-golden',
    name: 'Golden Beach Sunset',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=95',
    description: 'Bright sunlit Caribbean beach with turquoise sea and golden sunrise/sunset',
  },
  {
    id: 'ocean-horizon',
    name: 'Turquoise Tropical Ocean',
    url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=2400&q=95',
    description: 'Vibrant turquoise Caribbean ocean glowing under bright tropical sun',
  },
  {
    id: 'resort-dusk',
    name: 'Caribbean Island Coast',
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2400&q=95',
    description: 'Luminous sun rays over tropical palm shoreline and azure waves',
  },
];

export default function CaribbeanSunsetBackground() {
  const [activeWallpaperIndex, setActiveWallpaperIndex] = useState(0);
  const [brightness, setBrightness] = useState<'vivid' | 'bright' | 'soft'>('vivid');

  const current = PHOTOREALISTIC_CARIBBEAN_WALLPAPERS[activeWallpaperIndex];

  const opacityMap = {
    vivid: 0.9,
    bright: 0.75,
    soft: 0.6,
  };

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#071324]">
        {/* Photorealistic High-Definition Background Image Layer (Bright & Luminous) */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 transform scale-100"
          style={{
            backgroundImage: `url('${current.url}')`,
            opacity: opacityMap[brightness],
            filter: 'saturate(1.15) brightness(1.05)',
          }}
        />

        {/* Soft, Transparent Luminous Sun & Azure Atmospheric Tint (Non-Darkening) */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-950/25 via-transparent to-slate-950/60" />

        {/* Radiant Golden Sun Glow & Ocean Cyan Lighting */}
        <div className="absolute -top-10 right-1/4 w-[750px] h-[750px] rounded-full bg-gradient-to-br from-amber-300/30 via-orange-400/20 to-transparent blur-[110px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-cyan-400/25 via-sky-500/20 to-transparent blur-[120px] pointer-events-none" />

        {/* Subtle Crystal Water Shimmer Ripple Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:30px_30px] opacity-[0.04]" />
      </div>

      {/* Photorealistic Wallpaper & Brightness Switcher Widget */}
      <div className="fixed bottom-4 right-4 z-40 hidden md:flex items-center gap-2 bg-slate-950/90 backdrop-blur-2xl border border-amber-400/40 px-3 py-1.5 rounded-full shadow-2xl">
        <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest flex items-center gap-1">
          ☀️ Caribbean Theme:
        </span>
        <div className="flex items-center gap-1">
          {PHOTOREALISTIC_CARIBBEAN_WALLPAPERS.map((wp, idx) => (
            <button
              key={wp.id}
              type="button"
              onClick={() => setActiveWallpaperIndex(idx)}
              className={`text-[10px] font-black px-2.5 py-1 rounded-full transition-all ${
                activeWallpaperIndex === idx
                  ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-sky-400 text-slate-950 shadow-md scale-105'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
              title={wp.description}
            >
              {wp.name}
            </button>
          ))}
        </div>

        <div className="h-3 w-px bg-slate-700 mx-1" />

        <div className="flex items-center gap-1">
          {(['vivid', 'bright', 'soft'] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setBrightness(level)}
              className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full capitalize transition-all ${
                brightness === level
                  ? 'bg-sky-400 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}


