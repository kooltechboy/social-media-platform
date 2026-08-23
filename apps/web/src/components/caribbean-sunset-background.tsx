'use client';

import React, { useState } from 'react';

const PHOTOREALISTIC_CARIBBEAN_WALLPAPERS = [
  {
    id: 'oceanic-topography',
    name: 'Oceanic Topography',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2400&q=95',
    description: 'Abstract liquid and topographical mesh representing the deep Caribbean sea',
  },
  {
    id: 'midnight-obsidian',
    name: 'Midnight Obsidian',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=2400&q=95',
    description: 'Dark, modern architectural grid with subtle reflections',
  },
  {
    id: 'abyssal-gradient',
    name: 'Abyssal Gradient',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=2400&q=95',
    description: 'Deep, rich dark gradient mesh',
  },
];

export default function CaribbeanSunsetBackground() {
  const [activeWallpaperIndex, setActiveWallpaperIndex] = useState(0);
  const [brightness, setBrightness] = useState<'vivid' | 'bright' | 'soft'>('vivid');

  const current = PHOTOREALISTIC_CARIBBEAN_WALLPAPERS[activeWallpaperIndex];

  const opacityMap = {
    vivid: 0.6,
    bright: 0.4,
    soft: 0.2,
  };

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#071324]">
        {/* Abstract Editorial Background Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 transform scale-100 mix-blend-luminosity"
          style={{
            backgroundImage: `url('${current.url}')`,
            opacity: opacityMap[brightness],
          }}
        />

        {/* Deep Atmospheric Tint (Darkening) */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950/95" />

        {/* Subtle Brand Accents (Deep Oceanic Cyan) */}
        <div className="absolute -top-10 right-1/4 w-[750px] h-[750px] rounded-full bg-gradient-to-br from-sky-900/10 via-cyan-900/10 to-transparent blur-[110px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-cyan-900/10 via-sky-900/5 to-transparent blur-[120px] pointer-events-none" />

        {/* Minimal Noise/Texture Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.08]" />
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


