import React from 'react';
import { Flame, Globe } from 'lucide-react';

interface RightSidebarProps {
  className?: string;
}

export default function RightSidebar({ className = '' }: RightSidebarProps) {
  return (
    <aside className={`space-y-6 ${className}`} aria-label="Trending and events">
      {/* Trending in the Diaspora */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400" aria-hidden="true" />
          Trending in the Diaspora
        </h3>
        <div className="space-y-2 text-xs">
          <a
            href="/explore?trending=caribana2026"
            className="block p-2 hover:bg-slate-800/50 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            <span className="text-[10px] font-semibold text-sky-400 block">TORONTO, CANADA</span>
            <p className="font-bold text-slate-200">#Caribana2026 Band Launch</p>
            <span className="text-[10px] text-slate-400">14.2k Posts</span>
          </a>
          <a
            href="/explore?trending=techcaribbean"
            className="block p-2 hover:bg-slate-800/50 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            <span className="text-[10px] font-semibold text-emerald-400 block">SANTO DOMINGO, DR</span>
            <p className="font-bold text-slate-200">#TechCaribbean Summit</p>
            <span className="text-[10px] text-slate-400">8.9k Posts</span>
          </a>
          <a
            href="/explore?trending=socafestivalmiami"
            className="block p-2 hover:bg-slate-800/50 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            <span className="text-[10px] font-semibold text-amber-400 block">MIAMI, USA</span>
            <p className="font-bold text-slate-200">#SocaFestivalMiami</p>
            <span className="text-[10px] text-slate-400">22.1k Posts</span>
          </a>
        </div>
      </div>

      {/* Featured Cultural Events */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-sky-400" aria-hidden="true" />
          Featured Cultural Events
        </h3>
        <div className="space-y-2.5 text-xs">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-bold text-amber-400 uppercase">THIS SATURDAY</span>
            <h5 className="font-bold text-white text-xs mt-0.5">Trinidad Carnival Preview</h5>
            <p className="text-[11px] text-slate-400">Port of Spain &amp; Livestream</p>
            <a
              href="/events/trinidad-carnival-preview"
              className="w-full mt-2 block bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold py-1 rounded-lg text-[11px] transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Get Tickets ($15)
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
