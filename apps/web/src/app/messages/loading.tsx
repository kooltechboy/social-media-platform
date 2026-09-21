import React from 'react';
import { Skeleton } from '@caribbean/ui';

export default function MessagesLoading() {
  return (
    <div className="min-h-screen bg-transparent text-white animate-pulse">
      {/* Header bar skeleton */}
      <div className="sticky top-0 z-40 bg-[#0E0818]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-20 h-9 rounded-xl" />
          <Skeleton className="w-36 h-6 rounded-lg" />
        </div>
        <Skeleton className="w-24 h-9 rounded-xl" />
      </div>

      {/* Main chat center grid skeleton */}
      <div className="w-full py-4 px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-140px)] rounded-3xl overflow-hidden border border-white/10 bg-[#0E0818]/80">
          {/* Conversation list column */}
          <div className="md:col-span-5 lg:col-span-4 border-r border-white/10 p-4 space-y-4">
            <Skeleton className="w-full h-10 rounded-2xl" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="w-11 h-11 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-28 h-4 rounded" />
                    <Skeleton className="w-44 h-3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversation thread column */}
          <div className="hidden md:flex md:col-span-7 lg:col-span-8 flex-col justify-between p-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="w-32 h-4 rounded" />
                <Skeleton className="w-20 h-3 rounded" />
              </div>
            </div>
            <div className="space-y-4 py-8">
              <Skeleton className="w-2/3 h-12 rounded-2xl ml-auto" />
              <Skeleton className="w-1/2 h-10 rounded-2xl" />
              <Skeleton className="w-3/5 h-12 rounded-2xl ml-auto" />
            </div>
            <Skeleton className="w-full h-12 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
