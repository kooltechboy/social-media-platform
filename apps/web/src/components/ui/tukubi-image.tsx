'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image, { type ImageProps } from 'next/image';
import { ImageOff, AlertCircle } from 'lucide-react';

export interface TukubiImageProps extends Omit<ImageProps, 'src' | 'alt' | 'onLoad' | 'onError' | 'onClick'> {
  src: string | null | undefined;
  alt?: string;
  aspectRatio?: string | number;
  preserveAspect?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  objectPosition?: string;
  className?: string;
  imageClassName?: string;
  fallbackSrc?: string;
  fallbackText?: string;
  showGradientPlaceholder?: boolean;
  useNextImage?: boolean;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLDivElement | HTMLImageElement>) => void;
  onDimensionsDetected?: (dimensions: { width: number; height: number; aspectRatio: number }) => void;
}

/**
 * TUKUBI Production-Grade Image Component
 * Eliminates distortion, stretching, squashing, and layout shift across desktop, tablet, and mobile.
 * Separates container styling from img styling, enforces accurate aspect-ratio bounding,
 * delivers Caribbean Futurism gradient placeholders, and fails gracefully without broken image icons.
 */
export default function TukubiImage({
  src,
  alt = 'TUKUBI Media',
  aspectRatio,
  preserveAspect = false,
  objectFit = 'cover',
  objectPosition = 'center',
  className = '',
  imageClassName = '',
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 680px',
  priority = false,
  fill = true,
  width,
  height,
  fallbackSrc,
  fallbackText,
  showGradientPlaceholder = true,
  useNextImage = true,
  onLoad,
  onError,
  onClick,
  onDimensionsDetected,
  style,
  ...restProps
}: TukubiImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [triedNativeFallback, setTriedNativeFallback] = useState(false);
  const [detectedRatio, setDetectedRatio] = useState<number | null>(null);

  const cleanSrc = !hasError && src && typeof src === 'string' && src.trim() !== '' ? src.trim() : fallbackSrc;

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
    setTriedNativeFallback(false);
  }, [src]);

  // If no source at all, render graceful empty state
  if (!cleanSrc) {
    return (
      <div
        className={`w-full h-full min-h-[140px] bg-brand-twilight/80 border border-white/10 rounded-2xl flex flex-col items-center justify-center text-brand-sandstone/70 p-4 select-none ${className}`}
        role="img"
        aria-label={alt || 'No image available'}
        onClick={onClick}
      >
        <ImageOff className="w-6 h-6 mb-1 text-brand-caribbeanSea/50" />
        <span className="text-xs font-semibold tracking-wide">{fallbackText || 'Photo unavailable'}</span>
      </div>
    );
  }

  const isSvgOrData = cleanSrc.startsWith('data:') || cleanSrc.endsWith('.svg');
  const isBlob = cleanSrc.startsWith('blob:');
  const shouldUseNative = !useNextImage || isSvgOrData || isBlob || triedNativeFallback;

  // Compute computed style for aspect ratio container
  const containerStyle: React.CSSProperties = { ...style };
  if (aspectRatio) {
    containerStyle.aspectRatio = typeof aspectRatio === 'number' ? `${aspectRatio}` : aspectRatio;
  } else if (preserveAspect && detectedRatio) {
    containerStyle.aspectRatio = `${detectedRatio}`;
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    const target = e.currentTarget;
    if (target.naturalWidth && target.naturalHeight) {
      const ratio = target.naturalWidth / target.naturalHeight;
      setDetectedRatio(ratio);
      onDimensionsDetected?.({
        width: target.naturalWidth,
        height: target.naturalHeight,
        aspectRatio: ratio,
      });
    }
    onLoad?.(e);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // If Next.js image proxy fails for a remote URL, try native <img> first before giving up
    if (!shouldUseNative) {
      setTriedNativeFallback(true);
      return;
    }

    setHasError(true);
    setIsLoading(false);
    onError?.(e);
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={containerStyle}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e as any);
              }
            }
          : undefined
      }
    >
      {/* Caribbean Futurism gradient placeholder while image is hydrating/loading */}
      {isLoading && showGradientPlaceholder && (
        <div
          className="absolute inset-0 z-10 bg-gradient-to-tr from-[#0B0614] via-[#170E2B] to-[#0A1628] animate-pulse pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* When native <img> or SVG/blob fallback is used */}
      {shouldUseNative ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cleanSrc}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          style={{
            objectFit,
            objectPosition,
          }}
          className={`w-full h-full transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          } ${imageClassName}`}
        />
      ) : fill ? (
        <Image
          src={cleanSrc}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            objectFit,
            objectPosition,
          }}
          className={`transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          } ${imageClassName}`}
          {...restProps}
        />
      ) : (
        <Image
          src={cleanSrc}
          alt={alt}
          width={width || 800}
          height={height || 600}
          sizes={sizes}
          priority={priority}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            objectFit,
            objectPosition,
          }}
          className={`transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          } ${imageClassName}`}
          {...restProps}
        />
      )}
    </div>
  );
}
