'use client';

import React, { useState } from 'react';

const PHOTOREALISTIC_CARIBBEAN_WALLPAPERS = [
  {
    id: 'caribbean-sunrise',
    name: 'Island Sunrise',
    url: 'https://images.unsplash.com/photo-1548810793-7eecc7ce27b0?auto=format&fit=crop&w=2400&q=95',
    description: 'Vibrant sunrise over the Caribbean sea',
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    url: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=2400&q=95',
    description: 'Warm golden hues illuminating the tropical coast',
  },
  {
    id: 'twilight-dusk',
    name: 'Twilight Dusk',
    url: 'https://images.unsplash.com/photo-1473445763261-2679c65651ab?auto=format&fit=crop&w=2400&q=95',
    description: 'Deep purple and coral twilight skies',
  },
];

export default function CaribbeanSunsetBackground() {
  const [activeWallpaperIndex, setActiveWallpaperIndex] = useState(0);
  const [brightness, setBrightness] = useState<'vivid' | 'bright' | 'soft'>('vivid');

  const current = PHOTOREALISTIC_CARIBBEAN_WALLPAPERS[activeWallpaperIndex];

  const opacityMap = {
    vivid: 0.85,
    bright: 0.5,
    soft: 0.25,
  };

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-brand-twilight">
        {/* Beautiful Vibrant Background Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 transform scale-100 mix-blend-screen"
          style={{
            backgroundImage: `url('${current.url}')`,
            opacity: opacityMap[brightness],
          }}
        />

        {/* Twilight Tint for Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-twilight/50 via-brand-twilight/70 to-brand-twilight/95 mix-blend-multiply" />

        {/* Vibrant Glowing Accents (Coral & Gold) */}
        <div className="absolute -top-10 right-1/4 w-[750px] h-[750px] rounded-full bg-gradient-to-br from-brand-sunriseCoral/20 via-brand-goldenHour/10 to-transparent blur-[110px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-brand-caribbeanSea/20 via-brand-sunsetPurple/10 to-transparent blur-[120px] pointer-events-none" />

        {/* Minimal Noise/Texture Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05]" />
      </div>

      {/* Photorealistic Wallpaper & Brightness Switcher Widget */}
      <div className="fixed bottom-4 right-4 z-40 hidden md:flex items-center gap-2 bg-brand-twilight/90 backdrop-blur-2xl border border-brand-sunriseCoral/40 px-3 py-1.5 rounded-full shadow-2xl">
        <span className="text-[10px] font-black text-brand-goldenHour uppercase tracking-widest flex items-center gap-1">
          🌅 Caribbean Theme:
        </span>
        <div className="flex items-center gap-1">
          {PHOTOREALISTIC_CARIBBEAN_WALLPAPERS.map((wp, idx) => (
            <button
              key={wp.id}
              type="button"
              onClick={() => setActiveWallpaperIndex(idx)}
              className={`text-[10px] font-black px-2.5 py-1 rounded-full transition-all ${
                activeWallpaperIndex === idx
                  ? 'bg-gradient-to-r from-brand-goldenHour via-brand-sunriseCoral to-brand-caribbeanSea text-brand-twilight shadow-md scale-105'
                  : 'text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-brand-dusk/80'
              }`}
              title={wp.description}
            >
              {wp.name}
            </button>
          ))}
        </div>

        <div className="h-3 w-px bg-brand-sunsetPurple/40 mx-1" />

        <div className="flex items-center gap-1">
          {(['vivid', 'bright', 'soft'] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setBrightness(level)}
              className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full capitalize transition-all ${
                brightness === level
                  ? 'bg-brand-caribbeanSea text-brand-twilight shadow'
                  : 'text-brand-sandstone/60 hover:text-brand-sandstone'
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
