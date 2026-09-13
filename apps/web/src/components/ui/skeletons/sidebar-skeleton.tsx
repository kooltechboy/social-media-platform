'use client';

import React from 'react';

/**
 * TUKUBI Live Sidebar Shimmer Skeleton
 * Eliminates Cumulative Layout Shift (CLS) and renders instant placeholder while streaming.
 */
export default function SidebarSkeleton() {
  return (
    <div className="space-y-5 w-full animate-pulse" aria-label="Loading sidebar discovery" role="status">
      {/* 1. Official Platform Identity Widget Skeleton */}
      <div className="rounded-3xl border border-white/10 bg-[#130B1E]/80 p-5 space-y-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="w-24 h-4 rounded-lg bg-white/15" />
            <div className="w-16 h-2.5 rounded-lg bg-white/10" />
          </div>
          <div className="w-16 h-5 rounded-full bg-white/10" />
        </div>
        <div className="w-full h-10 rounded-xl bg-white/5" />
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="h-10 rounded-xl bg-white/5" />
          <div className="h-10 rounded-xl bg-white/5" />
          <div className="h-10 rounded-xl bg-white/5" />
        </div>
      </div>

      {/* 2. Friends & Members Widget Skeleton */}
      <div className="rounded-3xl border border-white/10 bg-[#130B1E]/80 p-5 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="w-36 h-4 rounded-lg bg-white/15" />
          <div className="w-16 h-5 rounded-full bg-white/10" />
        </div>
        <div className="h-9 rounded-xl bg-white/5" />
        <div className="space-y-2 pt-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-2xl bg-white/[0.03]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/10" />
                <div className="space-y-1.5">
                  <div className="w-20 h-3 rounded bg-white/15" />
                  <div className="w-14 h-2 rounded bg-white/10" />
                </div>
              </div>
              <div className="w-14 h-7 rounded-xl bg-white/10" />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Tukubi Live Ticker Skeleton */}
      <div className="rounded-3xl border border-white/10 bg-[#130B1E]/80 p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="w-28 h-4 rounded-lg bg-white/15" />
          <div className="w-14 h-4 rounded-full bg-white/10" />
        </div>
        <div className="h-16 rounded-2xl bg-white/5" />
      </div>

      {/* 4. Financial Center Quick Card Skeleton */}
      <div className="rounded-3xl border border-white/10 bg-[#130B1E]/80 p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="w-32 h-4 rounded-lg bg-white/15" />
          <div className="w-14 h-4 rounded-full bg-emerald-500/10" />
        </div>
        <div className="w-full h-8 rounded-lg bg-white/5" />
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="h-9 rounded-xl bg-white/10" />
          <div className="h-9 rounded-xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}
