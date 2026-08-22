import React from 'react';
import { Skeleton } from '@caribbean/ui';

export default function RootLoading() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-4 md:p-6 animate-pulse">
      <div className="lg:col-span-8 space-y-8">
        {/* Stories Skeleton */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="w-28 h-44 rounded-2xl flex-shrink-0" />
          ))}
        </div>

        {/* Composer Skeleton */}
        <Skeleton className="w-full h-32 rounded-3xl" />

        {/* Feed Posts Skeleton */}
        <div className="space-y-6 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 py-4">
              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <Skeleton className="w-1/3 h-4 rounded" />
                <Skeleton className="w-full h-16 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden lg:block lg:col-span-4 space-y-6">
        <Skeleton className="w-full h-64 rounded-3xl" />
        <Skeleton className="w-full h-48 rounded-3xl" />
      </div>
    </div>
  );
}
