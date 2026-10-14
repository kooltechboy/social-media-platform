import React from 'react';
import { Film } from 'lucide-react';

export default function ShortsLoading() {
  return (
    <div className="w-full h-[100dvh] flex flex-col items-center justify-center bg-black text-white p-6">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-brand-caribbeanSea/20 border-t-brand-caribbeanSea animate-spin" />
        <Film className="w-6 h-6 text-brand-coralPink absolute" />
      </div>
      <p className="mt-4 text-xs font-semibold tracking-wider text-slate-400 uppercase animate-pulse">
        Loading TUKUBI Shorts...
      </p>
    </div>
  );
}
