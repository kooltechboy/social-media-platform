'use client';

import React, { useState } from 'react';
import TukubiImage from './ui/tukubi-image';

export interface UserAvatarProps {
  src?: string | null;
  avatarUrl?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showRing?: boolean;
  ringVariant?: 'subtle' | 'brand';
}

const SIZE_MAP: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl', { box: string; text: string }> = {
  xs: { box: 'w-6 h-6 md:w-7 md:h-7', text: 'text-[10px] md:text-[11px] font-semibold' },
  sm: { box: 'w-8 h-8 md:w-9 md:h-9', text: 'text-xs font-semibold' },
  md: { box: 'w-10 h-10 md:w-11 md:h-11', text: 'text-[13px] md:text-sm font-semibold' },
  lg: { box: 'w-14 h-14 md:w-16 md:h-16', text: 'text-base md:text-lg font-semibold' },
  xl: { box: 'w-20 h-20 md:w-22 md:h-22', text: 'text-xl md:text-2xl font-bold' },
  '2xl': { box: 'w-28 h-28 md:w-32 md:h-32', text: 'text-3xl md:text-4xl font-bold' },
};

export default function UserAvatar({
  src,
  avatarUrl,
  name,
  size = 'md',
  className = '',
  showRing = true,
  ringVariant = 'subtle',
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const effectiveSrc = src || avatarUrl || null;
  const displayName = name?.trim() || 'Member';
  const isTukubiBrand =
    displayName.toUpperCase() === 'TUKUBI' || displayName.toUpperCase() === 'TUKUBI OFFICIAL';
  const resolvedSrc = effectiveSrc || (isTukubiBrand ? '/brand/tukubi-emblem.png' : null);

  const initials =
    displayName
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() ||
    displayName.slice(0, 2).toUpperCase() ||
    'TK';

  const { box, text } = SIZE_MAP[size];

  const ringClasses = !showRing
    ? ''
    : ringVariant === 'brand' || isTukubiBrand
    ? 'p-[1.5px] bg-gradient-to-tr from-brand-caribbeanTeal to-brand-caribbeanSea'
    : 'ring-1 ring-inset ring-white/[0.14]';

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden ${box} ${ringClasses} ${className}`}
      role="img"
      aria-label={displayName}
    >
      {resolvedSrc && !imgError ? (
        <TukubiImage
          src={resolvedSrc}
          alt={displayName}
          fill
          sizes="120px"
          fallbackText={initials}
          objectFit="cover"
          onError={() => setImgError(true)}
          className={`w-full h-full rounded-full ${
            isTukubiBrand && !src && !avatarUrl ? 'bg-[#070D1A] p-1' : ''
          }`}
          imageClassName="rounded-full"
        />
      ) : (
        <div
          className={`w-full h-full bg-gradient-to-br from-[#162744] to-[#0B1424] text-[#E8EDF5] flex items-center justify-center rounded-full ${text} tracking-wide select-none`}
        >
          {initials}
        </div>
      )}
    </div>
  );
}
