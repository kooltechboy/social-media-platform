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
  ariaLabel = 'Contextual discovery and actions',
}: RightRailProps) {
  return (
    <aside
      className={`hidden lg:block w-[310px] xl:w-[340px] 2xl:w-[360px] shrink-0 sticky shell-right-rail self-start overflow-y-auto overscroll-contain custom-scrollbar z-20 pb-8 pr-0.5 ${className}`}
      aria-label={ariaLabel}
      role="complementary"
    >
      <div className="space-y-5">
        {children}
      </div>
    </aside>
  );
}
