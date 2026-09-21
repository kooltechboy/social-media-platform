'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  BadgeCheck,
  Play,
} from 'lucide-react';
import TukubiVideoPlayer from './tukubi-video-player';

export interface ViewerMediaItem {
  url: string;
  type?: 'image' | 'video';
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  poster?: string;
  posterUrl?: string;
}

export interface TukubiMediaViewerProps {
  isOpen: boolean;
  media: (ViewerMediaItem | string)[];
  initialIndex?: number;
  onClose: () => void;
  title?: string;
  authorName?: string;
  authorHandle?: string;
  isVerified?: boolean;
}

export interface SwipeDismissResult {
  shouldDismiss: boolean;
  opacity: number;
  translateY: number;
}

/**
 * Bounds the zoom level between min and max (defaults 1x to 4x).
 */
export function clampZoomLevel(zoom: number, min: number = 1, max: number = 4): number {
  return Math.min(Math.max(zoom, min), max);
}

/**
 * Wraps an index safely around array length boundaries.
 */
export function wrapViewerIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return ((index % total) + total) % total;
}

/**
 * Computes next slide index with wrapping.
 */
export function getNextViewerIndex(currentIndex: number, total: number): number {
  if (total <= 1) return 0;
  return wrapViewerIndex(currentIndex + 1, total);
}

/**
 * Computes previous slide index with wrapping.
 */
export function getPrevViewerIndex(currentIndex: number, total: number): number {
  if (total <= 1) return 0;
  return wrapViewerIndex(currentIndex - 1, total);
}

/**
 * Calculates vertical drag translation and opacity fade for swipe-down dismiss.
 */
export function calculateSwipeDismiss(
  deltaY: number,
  threshold: number = 80
): SwipeDismissResult {
  if (deltaY <= 0) {
    return { shouldDismiss: false, opacity: 1, translateY: 0 };
  }
  const translateY = deltaY;
  // Fade opacity smoothly as vertical delta progresses, clamping at 0.2 floor
  const opacity = Math.max(0.2, Math.min(1, 1 - deltaY / (threshold * 2.5)));
  const shouldDismiss = deltaY > threshold;
  return { shouldDismiss, opacity, translateY };
}

/**
 * Normalizes mixed string URLs or ViewerMediaItem objects into structured items.
 */
export function normalizeViewerMedia(
  media: (ViewerMediaItem | string)[]
): ViewerMediaItem[] {
  if (!media || !Array.isArray(media)) return [];
  return media.map((item) => {
    if (typeof item === 'string') {
      const isVid =
        item.endsWith('.mp4') ||
        item.endsWith('.webm') ||
        item.endsWith('.mov') ||
        item.endsWith('.m3u8') ||
        item.includes('video');
      return {
        url: item,
        type: isVid ? 'video' : 'image',
      };
    }
    return item;
  });
}

/**
 * Toggles zoom level between 1x and 2x on double-tap or double-click.
 */
export function toggleDoubleTapZoom(currentZoom: number): number {
  return currentZoom > 1 ? 1 : 2;
}

/**
 * TUKUBI Full-Screen Interactive Media Lightbox
 * Uncompromised full-screen interactive lightbox that renders original media
 * with 100% uncropped fidelity, multi-touch pinch-to-zoom (up to 4×), carousel continuity,
 * desktop filmstrip thumbnail bar, and mobile swipe-down dismiss.
 */
export default function TukubiMediaViewer({
  isOpen,
  media,
  initialIndex = 0,
  onClose,
  title,
  authorName,
  authorHandle,
  isVerified = false,
}: TukubiMediaViewerProps) {
  const normalizedItems = normalizeViewerMedia(media);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Swipe dismiss state on mobile
  const [dismissDeltaY, setDismissDeltaY] = useState(0);

  // Overlay visibility timer (fades out after 2.5s of inactivity)
  const [overlayVisible, setOverlayVisible] = useState(true);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Touch tracking refs
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchPanStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchDistanceStartRef = useRef<number | null>(null);
  const touchZoomStartRef = useRef<number>(1);
  const lastTapTimestampRef = useRef<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Inactivity overlay timer
  const resetInactivityTimer = useCallback(() => {
    setOverlayVisible(true);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      // Keep overlay visible when zoomed in so controls remain accessible
      setOverlayVisible((prev) => (zoomLevel > 1 ? true : false));
    }, 2500);
  }, [zoomLevel]);

  // Sync initial index
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, normalizedItems.length - 1)));
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
      setDismissDeltaY(0);
      resetInactivityTimer();
    }
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isOpen, initialIndex, normalizedItems.length, resetInactivityTimer]);

  // Lock document scroll when viewer is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleNext = useCallback(() => {
    if (normalizedItems.length <= 1) return;
    setCurrentIndex((prev) => getNextViewerIndex(prev, normalizedItems.length));
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    resetInactivityTimer();
  }, [normalizedItems.length, resetInactivityTimer]);

  const handlePrev = useCallback(() => {
    if (normalizedItems.length <= 1) return;
    setCurrentIndex((prev) => getPrevViewerIndex(prev, normalizedItems.length));
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    resetInactivityTimer();
  }, [normalizedItems.length, resetInactivityTimer]);

  // Native wheel listener for Ctrl + Wheel / Trackpad Pinch zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isOpen) return;

    const onNativeWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.01;
        setZoomLevel((prev) => {
          const next = clampZoomLevel(prev + delta, 1, 4);
          if (next === 1) setPanPosition({ x: 0, y: 0 });
          return next;
        });
        resetInactivityTimer();
      }
    };

    container.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onNativeWheel);
    };
  }, [isOpen, resetInactivityTimer]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      resetInactivityTimer();
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoomLevel((z) => clampZoomLevel(z + 0.5, 1, 4));
      } else if (e.key === '-') {
        e.preventDefault();
        setZoomLevel((z) => {
          const next = clampZoomLevel(z - 0.5, 1, 4);
          if (next === 1) setPanPosition({ x: 0, y: 0 });
          return next;
        });
      } else if (e.key === '0') {
        e.preventDefault();
        setZoomLevel(1);
        setPanPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose, resetInactivityTimer]);

  // Zoom controls
  const handleZoomIn = () => {
    resetInactivityTimer();
    setZoomLevel((z) => clampZoomLevel(z + 0.5, 1, 4));
  };

  const handleZoomOut = () => {
    resetInactivityTimer();
    setZoomLevel((z) => {
      const next = clampZoomLevel(z - 0.5, 1, 4);
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    resetInactivityTimer();
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  // Double-tap or double-click to toggle zoom
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetInactivityTimer();
    setZoomLevel((prev) => {
      const next = toggleDoubleTapZoom(prev);
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  // Mouse Drag & Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    resetInactivityTimer();
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    resetInactivityTimer();
    if (!isDragging || zoomLevel <= 1) return;
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Multi-touch & gestural swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    resetInactivityTimer();

    // Check for double-tap gesture (within 300ms)
    const now = Date.now();
    if (e.touches.length === 1 && now - lastTapTimestampRef.current < 300) {
      setZoomLevel((prev) => {
        const next = toggleDoubleTapZoom(prev);
        if (next === 1) setPanPosition({ x: 0, y: 0 });
        return next;
      });
      lastTapTimestampRef.current = 0;
      return;
    }
    lastTapTimestampRef.current = now;

    // Two-finger pinch gesture
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceStartRef.current = dist;
      touchZoomStartRef.current = zoomLevel;
      return;
    }

    // Single finger touch
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      touchPanStartRef.current = { ...panPosition };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    resetInactivityTimer();

    // Multi-finger pinch-to-zoom
    if (e.touches.length === 2 && touchDistanceStartRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchDistanceStartRef.current;
      const targetZoom = clampZoomLevel(touchZoomStartRef.current * ratio, 1, 4);
      setZoomLevel(targetZoom);
      return;
    }

    // Single finger interaction
    if (e.touches.length === 1 && touchStartXRef.current !== null && touchStartYRef.current !== null) {
      const deltaX = e.touches[0].clientX - touchStartXRef.current;
      const deltaY = e.touches[0].clientY - touchStartYRef.current;

      // Panning when zoomed in
      if (zoomLevel > 1) {
        setPanPosition({
          x: touchPanStartRef.current.x + deltaX,
          y: touchPanStartRef.current.y + deltaY,
        });
        return;
      }

      // Swipe-down to dismiss when zoom === 1
      if (zoomLevel === 1 && deltaY > 0 && deltaY > Math.abs(deltaX)) {
        setDismissDeltaY(deltaY);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    resetInactivityTimer();

    if (e.touches.length < 2) {
      touchDistanceStartRef.current = null;
    }

    // Process swipe-down dismissal
    if (dismissDeltaY > 0) {
      const dismissCalc = calculateSwipeDismiss(dismissDeltaY, 80);
      if (dismissCalc.shouldDismiss) {
        onClose();
      }
      setDismissDeltaY(0);
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      return;
    }

    // Process horizontal swipe navigation
    if (touchStartXRef.current !== null && touchStartYRef.current !== null && zoomLevel === 1) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchStartXRef.current - touchEndX;
      const diffY = Math.abs(touchStartYRef.current - touchEndY);

      // Horizontal swipe threshold: 50px with dominant horizontal intent
      if (Math.abs(diffX) > 50 && diffY < Math.abs(diffX)) {
        if (diffX > 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Download media handler
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentItem) return;
    try {
      const response = await fetch(currentItem.url, { mode: 'cors' });
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const fileName = currentItem.url.split('/').pop()?.split('?')[0] || 'tukubi-media';
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(currentItem.url, '_blank');
    }
  };

  if (!isOpen || normalizedItems.length === 0) return null;

  const currentItem = normalizedItems[currentIndex] || normalizedItems[0];
  const isVideo = currentItem.type === 'video' || currentItem.url.match(/\.(mp4|webm|mov|m3u8)$/i);
  const swipeDismiss = calculateSwipeDismiss(dismissDeltaY, 80);

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Full-screen Photo View'}
      onPointerMove={resetInactivityTimer}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06030A]/95 backdrop-blur-xl animate-fadeIn select-none overflow-hidden"
      style={{
        transform: swipeDismiss.translateY > 0 ? `translateY(${swipeDismiss.translateY}px)` : undefined,
        opacity: swipeDismiss.opacity,
        transition: dismissDeltaY === 0 ? 'transform 0.25s ease-out, opacity 0.25s ease-out' : 'none',
      }}
    >
      {/* Top Header & Controls Bar */}
      <header
        className={`absolute top-0 inset-x-0 p-4 sm:p-6 flex items-center justify-between z-30 bg-gradient-to-b from-black/85 via-black/40 to-transparent transition-opacity duration-300 ${
          overlayVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-white shadow-md backdrop-blur-md">
            {currentIndex + 1} / {normalizedItems.length}
          </span>
          {(authorName || authorHandle) && (
            <div className="hidden sm:flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              {authorName && (
                <span className="text-xs font-bold text-white/95">
                  {authorName}
                </span>
              )}
              {isVerified && (
                <BadgeCheck className="w-3.5 h-3.5 text-brand-caribbeanSea fill-brand-caribbeanSea/20 shrink-0" aria-label="Verified" />
              )}
              {authorHandle && (
                <span className="text-xs font-medium text-brand-sandstone/80">
                  @{authorHandle.replace(/^@/, '')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isVideo && (
            <>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 4}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-40 transition-all cursor-pointer backdrop-blur-md border border-white/10"
                title="Zoom In (+)"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-40 transition-all cursor-pointer backdrop-blur-md border border-white/10"
                title="Zoom Out (-)"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              {zoomLevel > 1 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-2.5 rounded-xl bg-brand-caribbeanSea/30 hover:bg-brand-caribbeanSea/50 text-brand-caribbeanSea border border-brand-caribbeanSea/40 text-xs font-bold transition-all cursor-pointer backdrop-blur-md"
                  title="Reset Zoom (0)"
                  aria-label="Reset zoom"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          {/* Download Original File */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all cursor-pointer backdrop-blur-md"
            title="Download Original"
            aria-label="Download original media"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Close Lightbox */}
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 transition-all cursor-pointer backdrop-blur-md ml-1"
            title="Close (Esc)"
            aria-label="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-default p-2 sm:p-10"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {isVideo ? (
          <div className="w-full h-full max-w-5xl max-h-[85vh] flex items-center justify-center">
            <TukubiVideoPlayer
              src={currentItem.url}
              posterUrl={currentItem.poster || currentItem.posterUrl}
              altText={currentItem.alt || title || 'Video playback'}
              className="w-full h-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        ) : (
          <div
            onDoubleClick={handleDoubleClick}
            style={{
              transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
              transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            }}
            className="relative flex items-center justify-center max-w-full max-h-[90vh]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentItem.url}
              alt={currentItem.alt || title || 'Full view image'}
              className="max-w-[95vw] max-h-[88vh] object-contain rounded-xl shadow-2xl transition-all select-none"
              draggable={false}
            />
          </div>
        )}
      </div>

      {/* Multi-Item Left/Right Navigation Chevrons */}
      {normalizedItems.length > 1 && (
        <div
          className={`transition-opacity duration-300 ${
            overlayVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-2xl bg-black/60 hover:bg-black/90 text-white border border-white/10 backdrop-blur-md transition-all shadow-xl active:scale-95 cursor-pointer z-30"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-2xl bg-black/60 hover:bg-black/90 text-white border border-white/10 backdrop-blur-md transition-all shadow-xl active:scale-95 cursor-pointer z-30"
            aria-label="Next photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Bottom Filmstrip Thumbnail Bar & Caption */}
      <footer
        className={`absolute bottom-0 inset-x-0 p-4 sm:p-6 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col items-center gap-3 z-30 transition-opacity duration-300 ${
          overlayVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {currentItem.caption && (
          <p className="text-xs sm:text-sm text-white/95 font-medium max-w-2xl text-center bg-black/60 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg">
            {currentItem.caption}
          </p>
        )}

        {/* Filmstrip Thumbnail Bar (Desktop & Mobile) */}
        {normalizedItems.length > 1 && (
          <div className="flex items-center gap-2.5 overflow-x-auto max-w-full py-1.5 px-3 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 scrollbar-none shadow-xl">
            {normalizedItems.map((item, idx) => {
              const isItemVideo = item.type === 'video' || item.url.match(/\.(mp4|webm|mov|m3u8)$/i);
              const isActive = currentIndex === idx;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                    setZoomLevel(1);
                    setPanPosition({ x: 0, y: 0 });
                    resetInactivityTimer();
                  }}
                  className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden transition-all duration-200 shrink-0 bg-slate-900 cursor-pointer ${
                    isActive
                      ? 'border-2 border-brand-sunriseCoral shadow-md scale-105 ring-2 ring-brand-sunriseCoral/40'
                      : 'border border-white/20 opacity-60 hover:opacity-100 hover:border-white/50'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.poster || item.posterUrl || item.url}
                    alt={item.alt || `Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {isItemVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="w-3.5 h-3.5 text-white fill-white/80" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </footer>
    </div>
  );
}
