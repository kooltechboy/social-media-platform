import React from 'react';
import { Video, Heart, MessageCircle, Share2, Music, Bookmark } from 'lucide-react';

export default function ReelsPage() {
  const reelItems = [
    {
      id: 'reel_1',
      author: '@kingston_dancers',
      flag: '🇯🇲',
      title: 'New Dancehall Moves in Kingston Street Festival 🔥',
      music: 'Original Sound - Dancehall Riddim 2026',
      likes: '45.2k',
      comments: '1.2k',
      shares: '8.4k',
    },
    {
      id: 'reel_2',
      author: '@santo_domingo_eats',
      flag: '🇩🇴',
      title: 'Best Mofongo & Mangú in Zona Colonial! 🍛🇩🇴',
      music: 'Merengue & Bachata Mix - Santo Domingo',
      likes: '32.1k',
      comments: '890',
      shares: '4.1k',
    }
  ];

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative h-[780px] flex flex-col justify-between p-6">
        
        {/* Top Overlay Header */}
        <div className="flex items-center justify-between z-10">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-950/80 text-sky-400 border border-sky-500/30 flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5" /> Caribbean Reels
          </span>
          <span className="text-sm font-bold text-white">1 / 2</span>
        </div>

        {/* Video Simulation Canvas */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-900 flex items-center justify-center">
          <div className="text-center space-y-2 p-6">
            <span className="text-6xl">{reelItems[0].flag}</span>
            <p className="text-sm font-bold text-slate-300">Vertical Video Autoplay Stream</p>
          </div>
        </div>

        {/* Right Floating Actions */}
        <div className="absolute right-4 bottom-24 flex flex-col items-center gap-5 z-10">
          <button className="flex flex-col items-center gap-1 text-slate-200 hover:text-red-400 transition-colors">
            <div className="w-11 h-11 rounded-full bg-slate-950/80 border border-slate-800 flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold">{reelItems[0].likes}</span>
          </button>

          <button className="flex flex-col items-center gap-1 text-slate-200 hover:text-sky-400 transition-colors">
            <div className="w-11 h-11 rounded-full bg-slate-950/80 border border-slate-800 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold">{reelItems[0].comments}</span>
          </button>

          <button className="flex flex-col items-center gap-1 text-slate-200 hover:text-emerald-400 transition-colors">
            <div className="w-11 h-11 rounded-full bg-slate-950/80 border border-slate-800 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold">{reelItems[0].shares}</span>
          </button>
        </div>

        {/* Bottom Metadata Info */}
        <div className="z-10 space-y-2 max-w-[80%]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">{reelItems[0].author}</span>
            <span className="text-xs font-semibold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">Follow</span>
          </div>
          <p className="text-xs text-slate-200 leading-snug">{reelItems[0].title}</p>
          <div className="flex items-center gap-2 text-[11px] text-amber-300">
            <Music className="w-3.5 h-3.5" />
            <span className="truncate">{reelItems[0].music}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
