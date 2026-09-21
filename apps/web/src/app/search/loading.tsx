import React from 'react';
import { Skeleton } from '@caribbean/ui';

export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 sm:p-6 max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="space-y-2">
          <Skeleton className="w-64 h-8 rounded-2xl" />
          <Skeleton className="w-80 h-4 rounded-xl" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="w-20 h-9 rounded-xl" />
          <Skeleton className="w-20 h-9 rounded-xl" />
        </div>
      </div>

      <Skeleton className="w-full h-12 rounded-2xl" />

      <div className="space-y-3 pt-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
            <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="w-36 h-4 rounded" />
              <Skeleton className="w-60 h-3 rounded" />
            </div>
            <Skeleton className="w-20 h-8 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
