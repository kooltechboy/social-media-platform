'use client';

import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, Layers } from 'lucide-react';
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
  initialViewMode?: 'carousel' | 'grid';
  enableViewModeSwitch?: boolean;
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

export function clampSlideIndex(index: number, totalSlides: number): number {
  if (totalSlides <= 0) return 0;
  return Math.max(0, Math.min(index, totalSlides - 1));
}

export function getNextSlideIndex(currentIndex: number, totalSlides: number): number {
  return clampSlideIndex(currentIndex + 1, totalSlides);
}

export function getPrevSlideIndex(currentIndex: number, totalSlides: number): number {
  return clampSlideIndex(currentIndex - 1, totalSlides);
}

export function calculateActiveSlideIndex(scrollLeft: number, slideWidth: number, totalSlides: number): number {
  if (slideWidth <= 0 || totalSlides <= 0) return 0;
  const raw = Math.round(scrollLeft / slideWidth);
  return clampSlideIndex(raw, totalSlides);
}

export function getCarouselAnchorRatio(
  widths?: (number | undefined)[],
  heights?: (number | undefined)[],
  aspectRatios?: (string | number | undefined)[]
): string {
  const firstWidth = widths?.[0];
  const firstHeight = heights?.[0];
  const firstRatio = aspectRatios?.[0];

  const style = computeSinglePhotoContainerStyle(firstWidth, firstHeight, firstRatio);
  return style.aspectRatio || '4 / 5';
}

/**
 * TUKUBI Intelligent Responsive Media Gallery
 * Intelligently presents 1, 2, 3, 4, 5+ photos with:
 * - Single photo: Fluid clamped container (4:5 to 16:9) with ambient blurred backdrop and zero CLS.
 * - Multi-photo: Instagram-grade swipeable carousel with pagination pills and slide counter,
 *   with an optional toggle to switch between Carousel and Grid views.
 * - Full-screen integrated lightbox viewer.
 */
export default function TukubiGallery({
  mediaUrls,
  mediaItems,
  altText = 'Post media',
  authorName,
  className = '',
  initialViewMode = 'carousel',
  enableViewModeSwitch = true,
}: TukubiGalleryProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeViewerIndex, setActiveViewerIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>(initialViewMode);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!mediaUrls || mediaUrls.length === 0) return null;

  const totalSlides = mediaUrls.length;

  const openViewer = (index: number) => {
    setActiveViewerIndex(index);
    setViewerOpen(true);
  };

  const isVideo = (url: string) =>
    url.endsWith('.mp4') || url.includes('video') || url.endsWith('.m3u8') || url.endsWith('.webm');

  const scrollToSlide = (idx: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const targetIndex = clampSlideIndex(idx, totalSlides);
    const slideWidth = container.clientWidth;
    container.scrollTo({
      left: targetIndex * slideWidth,
      behavior: 'smooth',
    });
    setActiveIndex(targetIndex);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const slideWidth = container.clientWidth;
    if (slideWidth > 0) {
      const newIndex = calculateActiveSlideIndex(container.scrollLeft, slideWidth, totalSlides);
      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (activeIndex > 0) {
        scrollToSlide(activeIndex - 1);
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (activeIndex < totalSlides - 1) {
        scrollToSlide(activeIndex + 1);
      }
    }
  };

  const renderViewModeToggle = () => {
    if (!enableViewModeSwitch || totalSlides < 2) return null;
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setViewMode(viewMode === 'carousel' ? 'grid' : 'carousel');
        }}
        aria-label={viewMode === 'carousel' ? 'Switch to Grid view' : 'Switch to Carousel view'}
        className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-medium text-white/90 hover:text-white hover:bg-black/80 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
      >
        {viewMode === 'carousel' ? (
          <>
            <LayoutGrid className="w-3 h-3 text-brand-sunriseCoral" />
            <span>Grid</span>
          </>
        ) : (
          <>
            <Layers className="w-3 h-3 text-brand-caribbeanSea" />
            <span>Carousel</span>
          </>
        )}
      </button>
    );
  };

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

  // MULTI-PHOTO CAROUSEL PRESENTATION (DEFAULT FOR 2+ PHOTOS):
  if (viewMode === 'carousel') {
    const anchorRatio = getCarouselAnchorRatio(
      mediaItems?.map((m) => m.width),
      mediaItems?.map((m) => m.height),
      mediaItems?.map((m) => m.aspectRatio)
    );

    return (
      <>
        <div
          role="region"
          aria-label="Photo carousel"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          style={{ aspectRatio: anchorRatio }}
          className={`relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg group select-none bg-gradient-to-br from-[#0D0818] via-[#150D24] to-[#081220] focus:outline-none focus:ring-2 focus:ring-brand-sunriseCoral/50 ${className}`}
        >
          {/* View Mode Switcher Toggle */}
          {renderViewModeToggle()}

          {/* Slide Badge Counter */}
          <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-bold text-white tracking-wide pointer-events-none">
            {activeIndex + 1}/{totalSlides}
          </div>

          {/* Scroll Track */}
          <div
            ref={scrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none w-full h-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            onScroll={handleScroll}
          >
            {mediaUrls.map((url, idx) => {
              const item = mediaItems?.[idx];
              const isVid = isVideo(url) || item?.type === 'video';
              const itemStyle = computeSinglePhotoContainerStyle(item?.width, item?.height, item?.aspectRatio);
              const needsBackdrop = itemStyle.needsAmbientBackdrop || itemStyle.aspectRatio !== anchorRatio;

              return (
                <div
                  key={idx}
                  className="min-w-full w-full h-full snap-center relative flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={() => openViewer(idx)}
                >
                  {isVid ? (
                    <TukubiVideoPlayer
                      src={url}
                      posterUrl={item?.posterUrl}
                      altText={`${altText} (${idx + 1})`}
                      className="w-full h-full"
                    />
                  ) : (
                    <>
                      {/* Ambient blurred backdrop if slide ratio differs from anchor ratio */}
                      {needsBackdrop && (
                        <div
                          className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-35 scale-110 pointer-events-none"
                          style={{ backgroundImage: `url(${url})` }}
                          aria-hidden="true"
                        />
                      )}
                      <TukubiImage
                        src={url}
                        alt={`${altText} (${idx + 1} of ${totalSlides})`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 680px"
                        objectFit="contain"
                        className="w-full h-full relative z-10 transition-transform duration-300 group-hover:scale-[1.01]"
                        imageClassName="w-full h-full object-contain mx-auto"
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Chevron Buttons */}
          {activeIndex > 0 && (
            <button
              type="button"
              aria-label="Previous slide"
              onClick={(e) => {
                e.stopPropagation();
                scrollToSlide(activeIndex - 1);
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white hover:bg-black/75 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-md cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {activeIndex < totalSlides - 1 && (
            <button
              type="button"
              aria-label="Next slide"
              onClick={(e) => {
                e.stopPropagation();
                scrollToSlide(activeIndex + 1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white hover:bg-black/75 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-md cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Pagination Pills */}
          <div className="absolute bottom-3 left-0 right-0 z-20 flex items-center justify-center gap-1.5 pointer-events-none">
            {mediaUrls.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                aria-label={`Go to slide ${dotIdx + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  scrollToSlide(dotIdx);
                }}
                className={`pointer-events-auto cursor-pointer ${
                  dotIdx === activeIndex
                    ? 'w-4 h-1.5 rounded-full bg-brand-sunriseCoral transition-all duration-300 shadow-[0_0_8px_rgba(255,122,89,0.5)]'
                    : 'w-1.5 h-1.5 rounded-full bg-white/40 transition-all hover:bg-white/70'
                }`}
              />
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

  // 2 PHOTOS PRESENTATION (GRID VIEW):
  // Side-by-side harmonious grid with 4:3 tiles
  if (mediaUrls.length === 2) {
    return (
      <>
        <div className="relative w-full">
          {renderViewModeToggle()}
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

  // 3 PHOTOS PRESENTATION (GRID VIEW):
  // 1 large hero photo on left, 2 stacked photos on right
  if (mediaUrls.length === 3) {
    return (
      <>
        <div className="relative w-full">
          {renderViewModeToggle()}
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

  // 4 PHOTOS PRESENTATION (GRID VIEW):
  // Balanced 2x2 Grid
  if (mediaUrls.length === 4) {
    return (
      <>
        <div className="relative w-full">
          {renderViewModeToggle()}
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

  // 5+ PHOTOS PRESENTATION (GRID VIEW):
  // 1 large hero (spanning 3 columns) + 3-tile bottom row with "+N" badge on 4th visible slot
  const displayedUrls = mediaUrls.slice(0, 4);
  const remainingCount = mediaUrls.length - 4;

  return (
    <>
      <div className="relative w-full">
        {renderViewModeToggle()}
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
