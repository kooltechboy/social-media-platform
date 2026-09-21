import React from 'react';
import { Skeleton } from '@caribbean/ui';

export default function FeedsLoading() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start w-full animate-pulse p-4 sm:p-6">
      <div className="flex-1 min-w-0 space-y-6 w-full max-w-[680px] mx-auto lg:mx-0">
        {/* Feeds Tabs Skeleton */}
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/10">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="w-24 h-9 rounded-xl flex-shrink-0" />
          ))}
        </div>

        {/* Composer Placeholder Skeleton */}
        <Skeleton className="w-full h-28 rounded-3xl" />

        {/* Feed Posts Skeleton */}
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="w-32 h-4 rounded" />
                  <Skeleton className="w-20 h-3 rounded" />
                </div>
              </div>
              <Skeleton className="w-full h-16 rounded-xl" />
              <Skeleton className="w-full h-52 rounded-2xl" />
            </div>
          ))}
        </div>
      </div>

      {/* Right Rail Skeleton */}
      <div className="hidden lg:block w-80 space-y-6">
        <Skeleton className="w-full h-48 rounded-3xl" />
        <Skeleton className="w-full h-56 rounded-3xl" />
      </div>
    </div>
  );
}
