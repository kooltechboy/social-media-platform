'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export type LogoVariant = 'full' | 'emblem' | 'horizontal' | 'footer-dark' | 'footer-transparent';

export interface TukubiLogoProps {
  variant?: LogoVariant;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  width?: number;
  height?: number;
  className?: string;
  href?: string | null;
  priority?: boolean;
  alt?: string;
}

export function TukubiLogo({
  variant = 'horizontal',
  size = 'md',
  width,
  height,
  className = '',
  href = '/',
  priority = false,
  alt = 'TUKUBI — The Caribbean Connected.',
}: TukubiLogoProps) {
  let content: React.ReactNode;

  if (variant === 'emblem') {
    const w = width ?? (size === 'xs' ? 32 : size === 'sm' ? 44 : size === 'lg' ? 64 : size === 'xl' ? 96 : 48);
    const h = height ?? w;
    content = (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
        <Image
          src="/brand/tukubi-emblem.png"
          alt={alt}
          width={w}
          height={h}
          priority={priority}
          className="object-contain drop-shadow-md"
        />
      </div>
    );
  } else if (variant === 'footer-dark') {
    const w = width ?? 190;
    const h = height ?? 76;
    content = (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
        <Image
          src="/brand/tukubi-footer-dark.png"
          alt={alt}
          width={w}
          height={h}
          priority={priority}
          className="object-contain rounded-lg shadow-lg border border-white/10"
        />
      </div>
    );
  } else if (variant === 'footer-transparent') {
    const w = width ?? 180;
    const h = height ?? 56;
    content = (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
        <Image
          src="/brand/tukubi-footer-transparent.png"
          alt={alt}
          width={w}
          height={h}
          priority={priority}
          className="object-contain"
        />
      </div>
    );
  } else if (variant === 'full') {
    const w = width ?? (size === 'sm' ? 160 : size === 'lg' ? 320 : size === 'xl' ? 480 : 240);
    const h = height ?? Math.round(w * 0.81);
    content = (
      <div className={`relative inline-flex flex-col items-center justify-center shrink-0 ${className}`}>
        <Image
          src="/brand/tukubi-logo-transparent.png"
          alt={alt}
          width={w}
          height={h}
          priority={priority}
          className="object-contain"
        />
      </div>
    );
  } else {
    // Horizontal format: Emblem icon + Crisp Typography & Tagline
    const iconSize = size === 'xs' ? 28 : size === 'sm' ? 36 : size === 'lg' ? 52 : size === 'xl' ? 64 : 42;
    content = (
      <div className={`inline-flex items-center gap-3 shrink-0 group ${className}`}>
        <div className="relative shrink-0 transition-transform duration-300 group-hover:scale-105">
          <Image
            src="/brand/tukubi-emblem.png"
            alt=""
            aria-hidden="true"
            width={iconSize}
            height={iconSize}
            priority={priority}
            className="object-contain drop-shadow-[0_4px_12px_rgba(0,180,216,0.3)]"
          />
        </div>
        <div className="flex flex-col tracking-tight leading-tight">
          <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral bg-clip-text text-transparent tracking-wider">
            TUKUBI
          </span>
          <span className="text-[10.5px] sm:text-[11px] font-bold text-brand-sandstone/85 tracking-wide -mt-0.5 group-hover:text-brand-caribbeanSea transition-colors">
            The Caribbean Connected.
          </span>
        </div>
      </div>
    );
  }

  if (href) {
    return (
      <Link href={href} className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-caribbeanSea rounded-xl" aria-label={alt}>
        {content}
      </Link>
    );
  }

  return content;
}
