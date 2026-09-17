'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, ShieldCheck } from 'lucide-react';
import TukubiImage from '../ui/tukubi-image';
import TukubiMediaViewer from '../media/tukubi-media-viewer';

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

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-3">
      {/* Main Image Viewport with Ambient Backdrop */}
      <div
        className="aspect-[4/3] sm:aspect-[16/11] bg-gradient-to-br from-slate-900 via-slate-950 to-orange-950/20 border border-white/10 rounded-3xl relative overflow-hidden flex items-center justify-center group shadow-xl cursor-pointer"
        onClick={() => {
          if (currentMedia.mediaUrl && currentMedia.mediaType !== 'video') {
            setIsFullscreen(true);
          }
        }}
      >
        {currentMedia.mediaUrl ? (
          currentMedia.mediaType === 'video' ? (
            <video
              src={currentMedia.mediaUrl}
              controls
              className="w-full h-full object-contain bg-black"
              poster={currentMedia.thumbnailUrl}
            />
          ) : (
            <TukubiImage
              src={currentMedia.mediaUrl}
              alt={currentMedia.altText || title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 600px"
              objectFit="contain"
              className="w-full h-full"
              imageClassName="transition-transform duration-300 group-hover:scale-102"
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 select-none">
            <span className="text-8xl">
              {productKind === 'service' ? '🤝' : productKind === 'digital' ? '🎧' : '📦'}
            </span>
            <span className="text-xs text-brand-sandstone/50 font-bold">Caribbean Verified Offering</span>
          </div>
        )}

        {/* Badges Overlaid */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2 pointer-events-none z-10">
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

        {/* Fullscreen Trigger Button */}
        {currentMedia.mediaUrl && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(true);
            }}
            className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
            aria-label="View Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}

        {/* Prev / Next Arrows */}
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Verified Catalog Footer Tag */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-brand-sandstone/70 bg-black/50 backdrop-blur-md py-1.5 px-3 rounded-2xl border border-white/10 z-10 pointer-events-none">
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
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all shrink-0 bg-slate-900 cursor-pointer ${
                activeIndex === idx
                  ? 'border-orange-500 scale-105 shadow-md shadow-orange-500/20'
                  : 'border-white/10 opacity-70 hover:opacity-100'
              }`}
            >
              <TukubiImage
                src={m.thumbnailUrl || m.mediaUrl}
                alt={`Thumbnail ${idx + 1}`}
                fill
                sizes="64px"
                objectFit="cover"
                className="w-full h-full"
              />
            </button>
          ))}
        </div>
      )}

      {/* Full-Screen Lightbox */}
      <TukubiMediaViewer
        isOpen={isFullscreen}
        media={items.map((i) => ({
          url: i.mediaUrl,
          type: i.mediaType,
          alt: i.altText || title,
        }))}
        initialIndex={activeIndex}
        title={title}
        onClose={() => setIsFullscreen(false)}
      />
    </div>
  );
}
