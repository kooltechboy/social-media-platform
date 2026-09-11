'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Music2 } from 'lucide-react';

interface UseThisSoundButtonProps {
  soundId?: string;
  soundTitle: string;
  className?: string;
}

export default function UseThisSoundButton({ soundId, soundTitle, className = '' }: UseThisSoundButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    const params = new URLSearchParams({ mode: 'reel' });
    if (soundId) params.set('soundId', soundId);
    params.set('soundTitle', soundTitle);
    router.push(`/create?${params.toString()}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-twilight/60 border border-brand-twilight/80 text-xs font-bold text-brand-sandstone hover:bg-brand-twilight transition-colors ${className}`}
      title={`Use "${soundTitle}" in your Reel`}
      aria-label={`Use "${soundTitle}" sound in your Reel`}
    >
      <Music2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
      <span className="truncate max-w-[120px]">Use This Sound</span>
    </button>
  );
}
