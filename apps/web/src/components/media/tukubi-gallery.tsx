'use client';

import React, { useState } from 'react';
import { getClampedAspectRatio } from '@caribbean/media';
import TukubiImage from '../ui/tukubi-image';
import TukubiVideoPlayer from './tukubi-video-player';
import TukubiMediaViewer from './tukubi-media-viewer';

export interface TukubiGalleryProps {
  mediaUrls: string[];
  mediaItems?: Array<{
    url: string;
    width?: number;
    height?: number;
    aspectRatio?: string | number;
    type?: 'image' | 'video';
    posterUrl?: string;
  }>;
  altText?: string;
  authorName?: string;
  className?: string;
}

export function computeSinglePhotoContainerStyle(
  width?: number,
  height?: number,
  aspectRatio?: number | string
): { aspectRatio: string; needsAmbientBackdrop: boolean; clampedRatio: number } {
  let numRatio = 1.0;
  if (typeof aspectRatio === 'number' && aspectRatio > 0) {
    numRatio = aspectRatio;
  } else if (typeof aspectRatio === 'string') {
    if (aspectRatio.includes(':') || aspectRatio.includes('/')) {
      const parts = aspectRatio.split(/[:/]/).map(Number);
      if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
        numRatio = parts[0] / parts[1];
      }
    } else {
      const parsed = parseFloat(aspectRatio);
      if (!isNaN(parsed) && parsed > 0) numRatio = parsed;
    }
  } else if (width && height && width > 0 && height > 0) {
    numRatio = width / height;
  } else {
    // Default fallback is 4:5 (0.8) as feed default
    return { aspectRatio: '4 / 5', needsAmbientBackdrop: false, clampedRatio: 0.8 };
  }

  const clamped = getClampedAspectRatio(numRatio, 0.8, 16 / 9);
  return {
    aspectRatio: clamped.cssAspectRatio,
    needsAmbientBackdrop: clamped.isClamped,
    clampedRatio: clamped.clampedRatio,
  };
}

/**
 * TUKUBI Intelligent Responsive Media Gallery
 * Intelligently arranges 1, 2, 3, 4, 5+ photos with aspect ratio intelligence,
 * zero layout shift, "+N more" badge, and integrated full-screen lightbox viewing.
 */
export default function TukubiGallery({
  mediaUrls,
  mediaItems,
  altText = 'Post media',
  authorName,
  className = '',
}: TukubiGalleryProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeViewerIndex, setActiveViewerIndex] = useState(0);

  if (!mediaUrls || mediaUrls.length === 0) return null;

  const openViewer = (index: number) => {
    setActiveViewerIndex(index);
    setViewerOpen(true);
  };

  const isVideo = (url: string) =>
    url.endsWith('.mp4') || url.includes('video') || url.endsWith('.m3u8') || url.endsWith('.webm');

  // 1 PHOTO PRESENTATION:
  // Intelligent adaptive container that preserves natural framing without squashing,
  // bounded between a safe portrait (4:5) and safe landscape (16:9 / 2:1).
  if (mediaUrls.length === 1) {
    const url = mediaUrls[0];
    const firstItem = mediaItems?.[0];
    const isVid = isVideo(url) || firstItem?.type === 'video';

    if (isVid) {
      return (
        <div className={`relative rounded-2xl overflow-hidden bg-black aspect-video w-full ${className}`}>
          <TukubiVideoPlayer
            src={url}
            posterUrl={firstItem?.posterUrl}
            altText={altText}
            className="w-full h-full"
          />
        </div>
      );
    }

    const containerStyle = computeSinglePhotoContainerStyle(
      firstItem?.width,
      firstItem?.height,
      firstItem?.aspectRatio
    );

    return (
      <>
        <div
          className={`relative w-full rounded-2xl overflow-hidden bg-gradient-to-br from-[#0D0818] via-[#150D24] to-[#081220] border border-white/10 shadow-lg group cursor-pointer max-h-[640px] sm:max-h-[720px] ${className}`}
          style={{ aspectRatio: containerStyle.aspectRatio }}
          onClick={() => openViewer(0)}
        >
          {/* Ambient blurred backdrop if image exceeds ergonomic clamp */}
          {containerStyle.needsAmbientBackdrop && (
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-35 scale-110 pointer-events-none"
              style={{ backgroundImage: `url(${url})` }}
              aria-hidden="true"
            />
          )}

          <TukubiImage
            src={url}
            alt={altText}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 680px"
            objectFit="contain"
            className="w-full h-full relative z-10 transition-transform duration-300 group-hover:scale-[1.01]"
            imageClassName="w-full h-full object-contain mx-auto"
          />

          {/* Subtle click-to-expand prompt on hover */}
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
            Tap to expand
          </div>
        </div>

        <TukubiMediaViewer
          isOpen={viewerOpen}
          media={mediaUrls}
          initialIndex={activeViewerIndex}
          authorName={authorName}
          onClose={() => setViewerOpen(false)}
        />
      </>
    );
  }

  // 2 PHOTOS PRESENTATION:
  // Side-by-side harmonious grid with 4:3 tiles
  if (mediaUrls.length === 2) {
    return (
      <>
        <div className={`grid grid-cols-2 gap-2 rounded-2xl overflow-hidden ${className}`}>
          {mediaUrls.map((url, idx) => (
            <div
              key={idx}
              onClick={() => openViewer(idx)}
              className="relative aspect-[4/3] bg-brand-twilight rounded-xl overflow-hidden cursor-pointer group border border-white/10 shadow-sm"
            >
              {isVideo(url) ? (
                <TukubiVideoPlayer src={url} altText={altText} className="w-full h-full" />
              ) : (
                <TukubiImage
                  src={url}
                  alt={`${altText} (${idx + 1})`}
                  fill
                  sizes="(max-width: 768px) 50vw, 340px"
                  objectFit="cover"
                  className="w-full h-full"
                  imageClassName="transition-transform duration-300 group-hover:scale-105"
                />
              )}
            </div>
          ))}
        </div>

        <TukubiMediaViewer
          isOpen={viewerOpen}
          media={mediaUrls}
          initialIndex={activeViewerIndex}
          authorName={authorName}
          onClose={() => setViewerOpen(false)}
        />
      </>
    );
  }

  // 3 PHOTOS PRESENTATION:
  // 1 large hero photo on left, 2 stacked photos on right
  if (mediaUrls.length === 3) {
    return (
      <>
        <div className={`grid grid-cols-3 gap-2 rounded-2xl overflow-hidden aspect-[16/10] ${className}`}>
          {/* Main Hero Tile */}
          <div
            onClick={() => openViewer(0)}
            className="col-span-2 relative h-full bg-brand-twilight rounded-xl overflow-hidden cursor-pointer group border border-white/10 shadow-sm"
          >
            {isVideo(mediaUrls[0]) ? (
              <TukubiVideoPlayer src={mediaUrls[0]} altText={altText} className="w-full h-full" />
            ) : (
              <TukubiImage
                src={mediaUrls[0]}
                alt={`${altText} (1)`}
                fill
                sizes="(max-width: 768px) 66vw, 450px"
                objectFit="cover"
                className="w-full h-full"
                imageClassName="transition-transform duration-300 group-hover:scale-105"
              />
            )}
          </div>

          {/* 2 Companion Stacked Tiles */}
          <div className="col-span-1 flex flex-col gap-2 h-full">
            {mediaUrls.slice(1, 3).map((url, idx) => (
              <div
                key={idx}
                onClick={() => openViewer(idx + 1)}
                className="relative flex-1 bg-brand-twilight rounded-xl overflow-hidden cursor-pointer group border border-white/10 shadow-sm"
              >
                {isVideo(url) ? (
                  <TukubiVideoPlayer src={url} altText={altText} className="w-full h-full" />
                ) : (
                  <TukubiImage
                    src={url}
                    alt={`${altText} (${idx + 2})`}
                    fill
                    sizes="(max-width: 768px) 33vw, 225px"
                    objectFit="cover"
                    className="w-full h-full"
                    imageClassName="transition-transform duration-300 group-hover:scale-105"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <TukubiMediaViewer
          isOpen={viewerOpen}
          media={mediaUrls}
          initialIndex={activeViewerIndex}
          authorName={authorName}
          onClose={() => setViewerOpen(false)}
        />
      </>
    );
  }

  // 4 PHOTOS PRESENTATION:
  // Balanced 2x2 Grid
  if (mediaUrls.length === 4) {
    return (
      <>
        <div className={`grid grid-cols-2 gap-2 rounded-2xl overflow-hidden ${className}`}>
          {mediaUrls.map((url, idx) => (
            <div
              key={idx}
              onClick={() => openViewer(idx)}
              className="relative aspect-square bg-brand-twilight rounded-xl overflow-hidden cursor-pointer group border border-white/10 shadow-sm"
            >
              {isVideo(url) ? (
                <TukubiVideoPlayer src={url} altText={altText} className="w-full h-full" />
              ) : (
                <TukubiImage
                  src={url}
                  alt={`${altText} (${idx + 1})`}
                  fill
                  sizes="(max-width: 768px) 50vw, 340px"
                  objectFit="cover"
                  className="w-full h-full"
                  imageClassName="transition-transform duration-300 group-hover:scale-105"
                />
              )}
            </div>
          ))}
        </div>

        <TukubiMediaViewer
          isOpen={viewerOpen}
          media={mediaUrls}
          initialIndex={activeViewerIndex}
          authorName={authorName}
          onClose={() => setViewerOpen(false)}
        />
      </>
    );
  }

  // 5+ PHOTOS PRESENTATION:
  // 1 large hero (spanning 2 columns) + 3-tile bottom row with "+N" badge on 4th visible slot
  const displayedUrls = mediaUrls.slice(0, 4);
  const remainingCount = mediaUrls.length - 4;

  return (
    <>
      <div className={`grid grid-cols-3 gap-2 rounded-2xl overflow-hidden ${className}`}>
        {/* Top Hero Span */}
        <div
          onClick={() => openViewer(0)}
          className="col-span-3 relative aspect-[16/9] bg-brand-twilight rounded-xl overflow-hidden cursor-pointer group border border-white/10 shadow-sm"
        >
          {isVideo(displayedUrls[0]) ? (
            <TukubiVideoPlayer src={displayedUrls[0]} altText={altText} className="w-full h-full" />
          ) : (
            <TukubiImage
              src={displayedUrls[0]}
              alt={`${altText} (1)`}
              fill
              sizes="(max-width: 768px) 100vw, 680px"
              objectFit="cover"
              className="w-full h-full"
              imageClassName="transition-transform duration-300 group-hover:scale-105"
            />
          )}
        </div>

        {/* Bottom Row Tiles */}
        {displayedUrls.slice(1).map((url, idx) => {
          const isLastSlot = idx === 2;
          const actualIndex = idx + 1;

          return (
            <div
              key={actualIndex}
              onClick={() => openViewer(actualIndex)}
              className="relative aspect-square bg-brand-twilight rounded-xl overflow-hidden cursor-pointer group border border-white/10 shadow-sm"
            >
              {isVideo(url) ? (
                <TukubiVideoPlayer src={url} altText={altText} className="w-full h-full" />
              ) : (
                <TukubiImage
                  src={url}
                  alt={`${altText} (${actualIndex + 1})`}
                  fill
                  sizes="(max-width: 768px) 33vw, 225px"
                  objectFit="cover"
                  className="w-full h-full"
                  imageClassName="transition-transform duration-300 group-hover:scale-105"
                />
              )}

              {/* +N More Overlay */}
              {isLastSlot && remainingCount > 0 && (
                <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex flex-col items-center justify-center text-white font-black transition-opacity group-hover:bg-black/55">
                  <span className="text-xl sm:text-2xl font-black tracking-tight">+{remainingCount}</span>
                  <span className="text-[10px] uppercase tracking-widest text-brand-sandstone font-bold">More</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <TukubiMediaViewer
        isOpen={viewerOpen}
        media={mediaUrls}
        initialIndex={activeViewerIndex}
        authorName={authorName}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}
