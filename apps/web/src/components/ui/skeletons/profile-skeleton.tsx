'use client';

import React from 'react';

/**
 * TUKUBI Profile Shimmer Skeleton
 */
export default function ProfileSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse" aria-label="Loading profile" role="status">
      {/* Banner */}
      <div className="w-full h-48 sm:h-64 rounded-3xl bg-gradient-to-r from-[#0C1226] via-white/5 to-[#0C1226] border border-white/10" />

      {/* Avatar + Info */}
      <div className="relative px-6 -mt-16 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/15 border-4 border-[#0A0F22] shrink-0" />
          <div className="space-y-2 pb-1">
            <div className="w-40 h-5 rounded-xl bg-white/20" />
            <div className="w-24 h-3.5 rounded-lg bg-white/10" />
          </div>
        </div>
        <div className="w-28 h-9 rounded-2xl bg-white/15 shrink-0" />
      </div>

      {/* Stats Bar */}
      <div className="mx-6 p-4 rounded-2xl bg-[#0C1226]/60 border border-white/10 flex items-center justify-around">
        <div className="space-y-1 text-center">
          <div className="w-12 h-4 rounded bg-white/15 mx-auto" />
          <div className="w-16 h-3 rounded bg-white/10 mx-auto" />
        </div>
        <div className="space-y-1 text-center">
          <div className="w-12 h-4 rounded bg-white/15 mx-auto" />
          <div className="w-16 h-3 rounded bg-white/10 mx-auto" />
        </div>
        <div className="space-y-1 text-center">
          <div className="w-12 h-4 rounded bg-white/15 mx-auto" />
          <div className="w-16 h-3 rounded bg-white/10 mx-auto" />
        </div>
      </div>
    </div>
  );
}
