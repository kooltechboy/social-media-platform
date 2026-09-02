'use client';

import React, { useState } from 'react';

export interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showRing?: boolean;
}

const SIZE_MAP: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl', { box: string; text: string }> = {
  xs: { box: 'w-6 h-6', text: 'text-[10px]' },
  sm: { box: 'w-8 h-8', text: 'text-xs' },
  md: { box: 'w-10 h-10', text: 'text-sm' },
  lg: { box: 'w-14 h-14', text: 'text-base font-bold' },
  xl: { box: 'w-20 h-20', text: 'text-xl font-black' },
  '2xl': { box: 'w-28 h-28', text: 'text-3xl font-black' },
};

export default function UserAvatar({
  src,
  name,
  size = 'md',
  className = '',
  showRing = true,
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const displayName = name?.trim() || 'Member';
  const isTukubiBrand = displayName.toUpperCase() === 'TUKUBI' || displayName.toUpperCase() === 'TUKUBI OFFICIAL';
  const resolvedSrc = src || (isTukubiBrand ? '/brand/tukubi-emblem.png' : null);

  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || displayName.slice(0, 2).toUpperCase() || 'TK';

  const { box, text } = SIZE_MAP[size];

  const ringClasses = showRing
    ? 'p-0.5 bg-gradient-to-tr from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral shadow-md'
    : '';

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden ${box} ${ringClasses} ${className}`}
      role="img"
      aria-label={displayName}
    >
      {resolvedSrc && !imgError ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={resolvedSrc}
          alt={displayName}
          onError={() => setImgError(true)}
          className={`w-full h-full object-cover rounded-full ${isTukubiBrand && !src ? 'bg-[#110D17] p-1' : ''}`}
        />
      ) : (
        <div
          className={`w-full h-full bg-brand-twilight text-brand-sandstone flex items-center justify-center rounded-full font-bold ${text} tracking-wider select-none`}
        >
          {initials}
        </div>
      )}
    </div>
  );
}
