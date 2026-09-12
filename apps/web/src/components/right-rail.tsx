'use client';

import React from 'react';

interface RightRailProps {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

export default function RightRail({
  children,
  className = '',
  ariaLabel = 'Contextual sidebar',
}: RightRailProps) {
  return (
    <aside
      className={`hidden lg:block w-[320px] xl:w-[340px] 3xl:w-[360px] shrink-0 space-y-6 ${className}`}
      aria-label={ariaLabel}
    >
      <div className="sticky top-[76px] space-y-6 max-h-[calc(100vh-88px)] overflow-y-auto scrollbar-none pb-8">
        {children}
      </div>
    </aside>
  );
}
