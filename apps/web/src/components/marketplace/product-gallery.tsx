'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, ShieldCheck } from 'lucide-react';

export interface GalleryMedia {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  thumbnailUrl?: string;
  altText?: string;
}

interface ProductGalleryProps {
  media: GalleryMedia[];
  title: string;
  productKind: 'physical' | 'digital' | 'service';
  conditionBadge?: { label: string; badgeClass: string };
}

export default function ProductGallery({
  media,
  title,
  productKind,
  conditionBadge,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fallback if no images uploaded yet
  const items: GalleryMedia[] =
    media.length > 0
      ? media
      : [
          {
            id: 'fallback',
            mediaUrl: '',
            mediaType: 'image',
            altText: title,
          },
        ];

  const currentMedia = items[activeIndex] || items[0];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-3">
      {/* Main Image Viewport */}
      <div className="aspect-square bg-gradient-to-br from-slate-900 via-slate-950 to-orange-950/20 border border-white/10 rounded-3xl relative overflow-hidden flex items-center justify-center group shadow-xl">
        {currentMedia.mediaUrl ? (
          currentMedia.mediaType === 'video' ? (
            <video
              src={currentMedia.mediaUrl}
              controls
              className="w-full h-full object-cover"
              poster={currentMedia.thumbnailUrl}
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={currentMedia.mediaUrl}
              alt={currentMedia.altText || title}
              className="w-full h-full object-cover cursor-zoom-in transition-transform duration-300 group-hover:scale-105"
              onClick={() => setIsFullscreen(true)}
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
            <span className="text-8xl select-none">
              {productKind === 'service' ? '🤝' : productKind === 'digital' ? '🎧' : '📦'}
            </span>
            <span className="text-xs text-brand-sandstone/50 font-bold">Caribbean Verified Offering</span>
          </div>
        )}

        {/* Badges Overlaid */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {conditionBadge && (
            <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-wider ${conditionBadge.badgeClass}`}>
              {conditionBadge.label}
            </span>
          )}
          <span
            className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-wider ${
              productKind === 'physical'
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                : productKind === 'digital'
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
            }`}
          >
            {productKind}
          </span>
        </div>

        {/* Fullscreen Button */}
        {currentMedia.mediaUrl && (
          <button
            onClick={() => setIsFullscreen(true)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="View Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}

        {/* Prev / Next Arrows */}
        {items.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Verified Catalog Footer Tag */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-brand-sandstone/70 bg-black/40 backdrop-blur-md py-1.5 px-3 rounded-2xl border border-white/10">
          <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified Caribbean Product
          </span>
          <span className="text-[10px] text-brand-sandstone/50">
            {items.length > 1 ? `${activeIndex + 1} of ${items.length}` : 'Protected Catalog'}
          </span>
        </div>
      </div>

      {/* Thumbnails Row */}
      {items.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {items.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => setActiveIndex(idx)}
              className={`w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all shrink-0 bg-slate-900 ${
                activeIndex === idx
                  ? 'border-orange-500 scale-105 shadow-md shadow-orange-500/20'
                  : 'border-white/10 opacity-70 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.thumbnailUrl || m.mediaUrl}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal View */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close fullscreen"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-4xl max-h-[85vh] relative flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentMedia.mediaUrl}
              alt={currentMedia.altText || title}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />

            {items.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-4 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
