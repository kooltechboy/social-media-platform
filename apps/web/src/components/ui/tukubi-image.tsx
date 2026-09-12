'use client';

import React, { useState } from 'react';
import Image, { type ImageProps } from 'next/image';

export interface TukubiImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined;
  fallbackSrc?: string;
  fallbackText?: string;
  showGradientPlaceholder?: boolean;
}

/**
 * TUKUBI High-Performance Next.js Image Component
 * Automatically optimizes images via Next.js & CDN, manages fallback on broken links,
 * and renders Caribbean Futurism gradient placeholders to eliminate Cumulative Layout Shift (CLS).
 */
export default function TukubiImage({
  src,
  alt,
  fallbackSrc,
  fallbackText,
  showGradientPlaceholder = true,
  className = '',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  ...props
}: TukubiImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const cleanSrc = !hasError && src && src.trim() !== '' ? src.trim() : fallbackSrc;

  if (!cleanSrc) {
    return (
      <div
        className={`w-full h-full bg-brand-twilight flex items-center justify-center text-brand-sandstone font-bold text-xs select-none ${className}`}
        role="img"
        aria-label={alt || 'Image'}
      >
        {fallbackText || 'TUKUBI'}
      </div>
    );
  }

  // If source is an SVG or inline data URI, render directly
  const isSvgOrData = cleanSrc.startsWith('data:') || cleanSrc.endsWith('.svg');

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && showGradientPlaceholder && (
        <div
          className="absolute inset-0 bg-gradient-to-tr from-brand-dusk via-brand-twilight to-brand-twilight animate-pulse"
          aria-hidden="true"
        />
      )}

      {isSvgOrData ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cleanSrc}
          alt={alt}
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
        />
      ) : (
        <Image
          src={cleanSrc}
          alt={alt}
          sizes={sizes}
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
          className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          {...props}
        />
      )}
    </div>
  );
}
