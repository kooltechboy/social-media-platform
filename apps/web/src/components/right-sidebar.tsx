import React from 'react';
import { Flame, Globe } from 'lucide-react';

interface RightSidebarProps {
  className?: string;
}

export default function RightSidebar({ className = '' }: RightSidebarProps) {
  return (
    <aside className={`space-y-6 ${className}`} aria-label="Trending and events">
      {/* Trending in the Diaspora */}
      <div className="bg-brand-dusk/60 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-brand-sandstone flex items-center gap-2">
          <Flame className="w-4 h-4 text-brand-goldenHour" aria-hidden="true" />
          Trending in the Diaspora
        </h3>
        <div className="space-y-2 text-xs">
          <a
            href="/explore?trending=caribana2026"
            className="block p-2 hover:bg-brand-dusk/50 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-caribbeanSea focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            <span className="text-[10px] font-semibold text-brand-caribbeanSea block">TORONTO, CANADA</span>
            <p className="font-bold text-slate-200">#Caribana2026 Band Launch</p>
            <span className="text-[10px] text-brand-sandstone/60">14.2k Posts</span>
          </a>
          <a
            href="/explore?trending=techcaribbean"
            className="block p-2 hover:bg-brand-dusk/50 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-caribbeanSea focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            <span className="text-[10px] font-semibold text-brand-sunriseCoral block">SANTO DOMINGO, DR</span>
            <p className="font-bold text-slate-200">#TechCaribbean Summit</p>
            <span className="text-[10px] text-brand-sandstone/60">8.9k Posts</span>
          </a>
          <a
            href="/explore?trending=socafestivalmiami"
            className="block p-2 hover:bg-brand-dusk/50 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-caribbeanSea focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            <span className="text-[10px] font-semibold text-brand-goldenHour block">MIAMI, USA</span>
            <p className="font-bold text-slate-200">#SocaFestivalMiami</p>
            <span className="text-[10px] text-brand-sandstone/60">22.1k Posts</span>
          </a>
        </div>
      </div>

      {/* Featured Cultural Events */}
      <div className="bg-brand-dusk/60 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-brand-sandstone flex items-center gap-2">
          <Globe className="w-4 h-4 text-brand-caribbeanSea" aria-hidden="true" />
          Featured Cultural Events
        </h3>
        <div className="space-y-2.5 text-xs">
          <div className="bg-brand-twilight border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-bold text-brand-goldenHour uppercase">THIS SATURDAY</span>
            <h5 className="font-bold text-brand-sandstone text-xs mt-0.5">Trinidad Carnival Preview</h5>
            <p className="text-[11px] text-brand-sandstone/60">Port of Spain &amp; Livestream</p>
            <a
              href="/events/trinidad-carnival-preview"
              className="w-full mt-2 block bg-brand-dusk hover:bg-slate-700 text-brand-caribbeanSea font-semibold py-1 rounded-lg text-[11px] transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-caribbeanSea focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Get Tickets ($15)
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
