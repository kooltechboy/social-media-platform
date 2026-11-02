'use client';

import React from 'react';

export function ProfileTabSkeleton() {
  return (
    <div className="w-full space-y-4 py-6" aria-busy="true" aria-label="Loading profile content">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 w-1/4 rounded bg-white/10" />
            <div className="h-2.5 w-1/6 rounded bg-white/5" />
          </div>
        </div>
        <div className="h-3 w-3/4 rounded bg-white/5" />
        <div className="h-3 w-1/2 rounded bg-white/5" />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 w-1/3 rounded bg-white/10" />
            <div className="h-2.5 w-1/5 rounded bg-white/5" />
          </div>
        </div>
        <div className="h-3 w-4/5 rounded bg-white/5" />
      </div>
    </div>
  );
}
