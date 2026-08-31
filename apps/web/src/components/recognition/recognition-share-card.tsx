'use client';

import React, { useState } from 'react';
import { Share2, Check, Copy, Landmark } from 'lucide-react';
import type { FounderStatus } from '../../lib/recognition/types';

interface RecognitionShareCardProps {
  founder: FounderStatus;
  username: string;
  displayName: string;
}

export default function RecognitionShareCard({
  founder,
  username,
  displayName,
}: RecognitionShareCardProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `I was here early and helped build TUKUBI — ${founder.formatted_number || '#Founder'} on the Caribbean Digital Ecosystem. Follow my journey @${username} on Tukubi!`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-amber-400" />
          <h4 className="text-sm font-black text-brand-sandstone">Share Your Founder Legacy</h4>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-brand-sandstone border border-slate-700 transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy Share Card'}</span>
        </button>
      </div>

      <p className="text-xs text-brand-sandstone/70 italic bg-slate-950/60 p-3 rounded-xl border border-slate-800 font-mono">
        &quot;{shareText}&quot;
      </p>
    </div>
  );
}
