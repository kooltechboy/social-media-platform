'use client';

export function ComingSoonBadge({ label = 'Coming Soon', sublabel }: { label?: string; sublabel?: string }) {
  return (
    <div className="inline-flex flex-col items-center gap-1">
      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-gradient-to-r from-purple-600/20 to-coral-500/20 text-purple-300 border border-purple-500/30 backdrop-blur-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
        {label}
      </span>
      {sublabel && <p className="text-xs text-white/50">{sublabel}</p>}
    </div>
  );
}

export function ComingSoonButton({ label = 'Coming Soon', className }: { label?: string; className?: string }) {
  return (
    <button
      disabled
      className={`relative inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white/40 bg-white/5 border border-white/10 cursor-not-allowed ${className ?? ''}`}
      title="Available in the coming weeks"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
      {label}
    </button>
  );
}
