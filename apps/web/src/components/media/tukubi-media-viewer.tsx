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
  Share2,
  Maximize2,
} from 'lucide-react';

export interface ViewerMediaItem {
  url: string;
  type?: 'image' | 'video';
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface TukubiMediaViewerProps {
  isOpen: boolean;
  media: (ViewerMediaItem | string)[];
  initialIndex?: number;
  onClose: () => void;
  title?: string;
  authorName?: string;
}

/**
 * TUKUBI Full-Screen Interactive Media Lightbox
 * Full-resolution view with pinch/zoom, pan, touch swipe, keyboard navigation,
 * and page scroll locking.
 */
export default function TukubiMediaViewer({
  isOpen,
  media,
  initialIndex = 0,
  onClose,
  title,
  authorName,
}: TukubiMediaViewerProps) {
  const normalizedItems: ViewerMediaItem[] = media.map((item) =>
    typeof item === 'string' ? { url: item, type: item.endsWith('.mp4') || item.includes('video') ? 'video' : 'image' } : item
  );

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync initial index
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, normalizedItems.length - 1)));
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex, normalizedItems.length]);

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
    setCurrentIndex((prev) => (prev < normalizedItems.length - 1 ? prev + 1 : 0));
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, [normalizedItems.length]);

  const handlePrev = useCallback(() => {
    if (normalizedItems.length <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : normalizedItems.length - 1));
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, [normalizedItems.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
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
        setZoomLevel((z) => Math.min(z + 0.5, 4));
      } else if (e.key === '-') {
        e.preventDefault();
        setZoomLevel((z) => {
          const next = Math.max(z - 0.5, 1);
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
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Zoom controls
  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.5, 4));
  const handleZoomOut = () => {
    setZoomLevel((z) => {
      const next = Math.max(z - 0.5, 1);
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  // Drag & Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && zoomLevel === 1) {
      setTouchStartX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || zoomLevel > 1) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext(); // swipe left -> next
      } else {
        handlePrev(); // swipe right -> prev
      }
    }
    setTouchStartX(null);
  };

  if (!isOpen || normalizedItems.length === 0) return null;

  const currentItem = normalizedItems[currentIndex] || normalizedItems[0];
  const isVideo = currentItem.type === 'video' || currentItem.url.match(/\.(mp4|webm|mov)$/i);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06030A]/95 backdrop-blur-xl animate-fadeIn select-none"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Full-screen Photo View'}
      ref={containerRef}
    >
      {/* Top Controls Bar */}
      <div className="absolute top-0 inset-x-0 p-4 sm:p-6 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-white shadow-md">
            {currentIndex + 1} / {normalizedItems.length}
          </span>
          {authorName && (
            <span className="text-xs font-bold text-brand-sandstone/90 hidden sm:inline-block">
              {authorName}
            </span>
          )}
        </div>

        {/* Zoom & Action buttons */}
        <div className="flex items-center gap-2">
          {!isVideo && (
            <>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 4}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-40 transition-all cursor-pointer"
                title="Zoom In (+)"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-40 transition-all cursor-pointer"
                title="Zoom Out (-)"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              {zoomLevel > 1 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-2.5 rounded-xl bg-brand-caribbeanSea/30 hover:bg-brand-caribbeanSea/50 text-brand-caribbeanSea border border-brand-caribbeanSea/40 text-xs font-bold transition-all cursor-pointer"
                  title="Reset Zoom (0)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 transition-all cursor-pointer ml-1"
            title="Close (Esc)"
            aria-label="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-default p-4 sm:p-10"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isVideo ? (
          <video
            src={currentItem.url}
            controls
            autoPlay
            playsInline
            className="max-w-full max-h-[88vh] rounded-2xl shadow-2xl object-contain"
          />
        ) : (
          <div
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
              className="max-w-[95vw] max-h-[88vh] object-contain rounded-xl shadow-2xl transition-all"
              draggable={false}
            />
          </div>
        )}
      </div>

      {/* Left / Right Arrow Navigation */}
      {normalizedItems.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-2xl bg-black/60 hover:bg-black/90 text-white border border-white/10 backdrop-blur-md transition-all shadow-xl active:scale-95 cursor-pointer z-20"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-2xl bg-black/60 hover:bg-black/90 text-white border border-white/10 backdrop-blur-md transition-all shadow-xl active:scale-95 cursor-pointer z-20"
            aria-label="Next photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Bottom Caption & Thumbnail Strip (if multiple) */}
      <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center gap-3 z-20 pointer-events-auto">
        {currentItem.caption && (
          <p className="text-xs sm:text-sm text-white/90 font-medium max-w-2xl text-center bg-black/50 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10">
            {currentItem.caption}
          </p>
        )}

        {normalizedItems.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1 scrollbar-none">
            {normalizedItems.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  setZoomLevel(1);
                  setPanPosition({ x: 0, y: 0 });
                }}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-slate-900 cursor-pointer ${
                  currentIndex === idx
                    ? 'border-brand-caribbeanSea scale-105 shadow-md shadow-brand-caribbeanSea/30'
                    : 'border-white/20 opacity-60 hover:opacity-100'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
