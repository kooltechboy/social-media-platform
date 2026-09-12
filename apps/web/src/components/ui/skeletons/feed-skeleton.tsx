'use client';

import React from 'react';

/**
 * TUKUBI Feed Stream Shimmer Skeleton
 * Prevents Cumulative Layout Shift (CLS) with Caribbean Futurism styled placeholders.
 */
export default function FeedSkeleton() {
  return (
    <div className="space-y-4 w-full" aria-label="Loading feed stream" role="status">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className="rounded-3xl border border-white/10 bg-[#0C1226]/80 p-5 space-y-4 shadow-xl animate-pulse"
        >
          {/* Author Header Shimmer */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="w-28 h-3.5 rounded-lg bg-white/15" />
              <div className="w-16 h-2.5 rounded-lg bg-white/10" />
            </div>
            <div className="w-6 h-6 rounded-full bg-white/10" />
          </div>

          {/* Content Body Shimmer */}
          <div className="space-y-2 pt-1">
            <div className="w-full h-3.5 rounded-lg bg-white/15" />
            <div className="w-5/6 h-3.5 rounded-lg bg-white/10" />
            <div className="w-3/4 h-3.5 rounded-lg bg-white/10" />
          </div>

          {/* Media Box Shimmer */}
          <div className="w-full h-64 rounded-2xl bg-gradient-to-tr from-[#090D1C] via-white/5 to-[#090D1C]" />

          {/* Interaction Bar Shimmer */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-6 rounded-full bg-white/10" />
              <div className="w-12 h-6 rounded-full bg-white/10" />
              <div className="w-12 h-6 rounded-full bg-white/10" />
            </div>
            <div className="w-8 h-6 rounded-full bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
