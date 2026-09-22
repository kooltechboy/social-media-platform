import React from 'react';
import { Skeleton } from '@caribbean/ui';

export default function PodcastsLoading() {
  return (
    <div className="space-y-6 animate-pulse p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-2">
          <Skeleton className="w-64 h-8 rounded-2xl" />
          <Skeleton className="w-80 h-4 rounded-xl" />
        </div>
        <Skeleton className="w-36 h-10 rounded-2xl" />
      </div>

      {/* Featured Podcast Hero */}
      <div className="rounded-3xl bg-brand-dusk/60 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-center">
        <Skeleton className="w-48 h-48 rounded-2xl shrink-0" />
        <div className="space-y-3 flex-1 w-full">
          <Skeleton className="w-24 h-5 rounded-full" />
          <Skeleton className="w-3/4 h-8 rounded-xl" />
          <Skeleton className="w-full h-16 rounded-xl" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="w-32 h-10 rounded-2xl" />
            <Skeleton className="w-28 h-10 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Shows & Episodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-3xl bg-brand-dusk/60 border border-slate-800 p-4 flex items-center gap-4">
            <Skeleton className="w-20 h-20 rounded-2xl shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <Skeleton className="w-4/5 h-4 rounded" />
              <Skeleton className="w-1/2 h-3 rounded" />
              <Skeleton className="w-20 h-3 rounded" />
            </div>
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
