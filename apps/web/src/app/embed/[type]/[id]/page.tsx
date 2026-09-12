import React from 'react';

interface EmbedPageProps {
  params: Promise<{
    type: string;
    id: string;
  }>;
}

export default async function EmbedViewerPage({ params }: EmbedPageProps) {
  const { type, id } = await params;

  return (
    <div className="w-full h-full min-h-[360px] p-4 bg-[#110D17] text-[#FDF2E9] flex flex-col justify-between font-sans antialiased box-border">
      {/* Top Author & Brand Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2A1B38]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF7A59] via-[#FFB347] to-[#8B5CF6] flex items-center justify-center font-bold text-sm text-white">
            T
          </div>
          <div>
            <p className="font-bold text-sm text-white">TUKUBI Creator</p>
            <p className="text-[11px] text-[#00B4D8]">Caribbean Basin & Diaspora</p>
          </div>
        </div>

        <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">
          {type}
        </span>
      </div>

      {/* Main Content Showcase */}
      <div className="my-4 p-4 rounded-xl bg-[#1D1429] border border-[#2A1B38] space-y-2">
        <span className="text-xs font-semibold text-[#FF7A59] uppercase tracking-wider">
          {type === 'spaces' ? '🎙️ Live Audio Lounge' : type === 'marketplace' ? '🛍️ Island Marketplace' : '🌴 Caribbean Moment'}
        </span>
        <h2 className="text-lg font-bold text-white line-clamp-2">
          Discover Caribbean culture, authentic stories, music, and diaspora craft on TUKUBI.
        </h2>
        <p className="text-xs text-[#FDF2E9]/70 font-mono">ID: {id}</p>
      </div>

      {/* Footer Branding & Call to Action */}
      <div className="pt-3 border-t border-[#2A1B38] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-[#FF7A59] to-[#FFB347] bg-clip-text text-transparent">
            TUKUBI
          </span>
          <span className="text-[11px] text-[#FDF2E9]/50">• The Caribbean Connected</span>
        </div>

        <a
          href={`https://tukubi.caribbean/${type}/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#FF7A59] text-white hover:opacity-90 transition-opacity"
        >
          View on Tukubi →
        </a>
      </div>
    </div>
  );
}
