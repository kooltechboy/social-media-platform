import React from 'react';
import { Skeleton } from '@caribbean/ui';

export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-2">
          <Skeleton className="w-64 h-8 rounded-2xl" />
          <Skeleton className="w-80 h-4 rounded-xl" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="w-32 h-10 rounded-2xl" />
          <Skeleton className="w-32 h-10 rounded-2xl" />
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-3xl bg-brand-dusk/60 border border-slate-800 space-y-3">
            <Skeleton className="w-20 h-4 rounded-lg" />
            <Skeleton className="w-28 h-8 rounded-xl" />
            <Skeleton className="w-36 h-3 rounded" />
          </div>
        ))}
      </div>

      {/* Action Tabs */}
      <div className="flex gap-2 pb-2 overflow-x-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="w-32 h-10 rounded-xl flex-shrink-0" />
        ))}
      </div>

      {/* Main Table Container */}
      <div className="rounded-3xl bg-brand-dusk/60 border border-slate-800 p-6 space-y-4">
        <div className="flex justify-between items-center pb-2">
          <Skeleton className="w-48 h-6 rounded-xl" />
          <Skeleton className="w-36 h-8 rounded-xl" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-800/60">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="w-40 h-4 rounded" />
                  <Skeleton className="w-24 h-3 rounded" />
                </div>
              </div>
              <Skeleton className="w-20 h-6 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
