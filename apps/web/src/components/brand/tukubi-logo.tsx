'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export type LogoVariant = 'full' | 'emblem' | 'horizontal' | 'footer-dark' | 'footer-transparent' | 'stacked' | 'compact' | 'symbol';
export type LogoTheme = 'light' | 'dark' | 'white' | 'monochrome' | 'auto';

export interface TukubiLogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  width?: number;
  height?: number;
  className?: string;
  href?: string | null;
  priority?: boolean;
  alt?: string;
  useVector?: boolean;
}

export function TukubiLogo({
  variant = 'horizontal',
  theme = 'auto',
  size = 'md',
  width,
  height,
  className = '',
  href = '/',
  priority = false,
  alt = 'TUKUBI — The Caribbean Connected.',
  useVector = false,
}: TukubiLogoProps) {
  let content: React.ReactNode;

  if (variant === 'symbol') {
    const symSize = width ?? (size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'lg' ? 64 : size === 'xl' ? 96 : 40);
    const symSrc = theme === 'white'
      ? '/brand/tukubi-symbol-white.svg'
      : theme === 'monochrome'
        ? '/brand/tukubi-symbol-monochrome.svg'
        : '/brand/tukubi-symbol.svg';

    content = (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
        <Image
          src={symSrc}
          alt={alt}
          width={symSize}
          height={symSize}
          priority={priority}
          className="object-contain drop-shadow-sm"
        />
      </div>
    );
  } else if (variant === 'emblem') {
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
          className="object-contain drop-shadow-[0_4px_12px_rgba(0,194,168,0.3)]"
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
          className="object-contain rounded-xl shadow-lg border border-white/10"
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
  } else if (variant === 'stacked') {
    const w = width ?? (size === 'sm' ? 140 : size === 'lg' ? 260 : size === 'xl' ? 320 : 190);
    const h = height ?? Math.round(w * 0.83);
    const src = theme === 'dark' || theme === 'white'
      ? '/brand/tukubi-logo-stacked-dark.svg'
      : '/brand/tukubi-logo-stacked.svg';
    content = (
      <div className={`relative inline-flex flex-col items-center justify-center shrink-0 ${className}`}>
        <Image
          src={src}
          alt={alt}
          width={w}
          height={h}
          priority={priority}
          className="object-contain"
        />
      </div>
    );
  } else if (variant === 'compact') {
    const w = width ?? (size === 'xs' ? 120 : size === 'sm' ? 140 : size === 'lg' ? 200 : size === 'xl' ? 240 : 160);
    const h = height ?? Math.round(w * 0.22);
    content = (
      <div className={`relative inline-flex items-center shrink-0 ${className}`}>
        <Image
          src="/brand/tukubi-logo-compact.svg"
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
    // Horizontal format: Approved Emblem + Crisp Typography & Tagline
    const iconSize = size === 'xs' ? 28 : size === 'sm' ? 36 : size === 'lg' ? 52 : size === 'xl' ? 64 : 42;
    content = (
      <div className={`inline-flex items-center gap-2.5 shrink-0 group ${className}`}>
        <div className="relative shrink-0">
          <Image
            src="/brand/tukubi-symbol.svg"
            alt=""
            aria-hidden="true"
            width={iconSize}
            height={iconSize}
            priority={priority}
            className="object-contain"
          />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-display text-[20px] sm:text-[22px] font-bold text-white tracking-[0.04em]">
            TUKUBI
          </span>
          <span className="hidden sm:inline text-[10.5px] font-medium text-brand-mist tracking-[0.02em] mt-1">
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
