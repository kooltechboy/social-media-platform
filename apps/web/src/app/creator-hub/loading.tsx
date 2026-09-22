import React from 'react';
import { Skeleton } from '@caribbean/ui';

export default function CreatorHubLoading() {
  return (
    <div className="space-y-8 animate-pulse p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Hero Banner */}
      <div className="rounded-3xl bg-brand-dusk/60 border border-slate-800 p-8 text-center space-y-4">
        <Skeleton className="w-32 h-6 rounded-full mx-auto" />
        <Skeleton className="w-80 h-10 rounded-2xl mx-auto" />
        <Skeleton className="w-full max-w-md h-4 rounded-lg mx-auto" />
        <div className="pt-2 flex justify-center gap-3">
          <Skeleton className="w-36 h-11 rounded-2xl" />
          <Skeleton className="w-36 h-11 rounded-2xl" />
        </div>
      </div>

      {/* Creator Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-3xl bg-brand-dusk/60 border border-slate-800 p-6 space-y-4">
            <Skeleton className="w-24 h-6 rounded-lg" />
            <Skeleton className="w-32 h-8 rounded-xl" />
            <Skeleton className="w-full h-16 rounded-xl" />
            <div className="space-y-2 pt-2">
              <Skeleton className="w-full h-4 rounded" />
              <Skeleton className="w-full h-4 rounded" />
              <Skeleton className="w-3/4 h-4 rounded" />
            </div>
            <Skeleton className="w-full h-10 rounded-2xl mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
