import React from 'react';
import { Skeleton } from '@caribbean/ui';

export default function SavedLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse p-4 sm:p-6">
      {/* Header */}
      <div className="space-y-2 pb-4 border-b border-slate-800">
        <Skeleton className="w-48 h-8 rounded-2xl" />
        <Skeleton className="w-72 h-4 rounded-xl" />
      </div>

      {/* Saved Posts Grid */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-3xl bg-brand-dusk/60 border border-slate-800 p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="w-36 h-4 rounded" />
                <Skeleton className="w-24 h-3 rounded" />
              </div>
              <Skeleton className="w-6 h-6 rounded-lg" />
            </div>
            <Skeleton className="w-full h-12 rounded-xl" />
            <Skeleton className="w-full h-40 rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
