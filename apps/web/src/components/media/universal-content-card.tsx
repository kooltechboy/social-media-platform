'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  Play,
  Film,
  Music,
  Radio,
  FileText,
  ShoppingBag,
  Calendar,
  MapPin,
  Globe,
  X,
  Volume2,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { ResolvedContentMetadata, ContentType } from '@caribbean/media';
import TukubiImage from '../ui/tukubi-image';
import TukubiAudioPlayer from './tukubi-audio-player';
import TukubiVideoPlayer from './tukubi-video-player';

export interface UniversalContentCardProps {
  metadata: ResolvedContentMetadata;
  compact?: boolean;
  onRemove?: () => void;
  className?: string;
}

export default function UniversalContentCard({
  metadata,
  compact = false,
  onRemove,
  className = '',
}: UniversalContentCardProps) {
  const [isPlayingEmbed, setIsPlayingEmbed] = useState(false);

  if (!metadata) return null;

  const {
    url,
    provider,
    providerDisplayName,
    contentType,
    title,
    description,
    thumbnailUrl,
    authorName,
    durationFormatted,
    siteName,
    faviconUrl,
    embedUrl,
    embedHtml,
    aspectRatio = '16:9',
    isPlayable,
    extra,
  } = metadata;

  // 1. TUKUBI NATIVE AUDIO / DIRECT AUDIO STREAM
  if (contentType === 'audio' && (provider === 'tukubi_sound' || extra?.audioUrl || (embedUrl && (embedUrl.endsWith('.wav') || embedUrl.endsWith('.mp3'))))) {
    const audioSrc = (extra?.audioUrl as string) || embedUrl || url;
    return (
      <div className={`relative ${className}`}>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove preview"
            className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <TukubiAudioPlayer
          src={audioSrc}
          title={title}
          artist={authorName}
          genre={extra?.genre as string}
          flag={extra?.flag as string}
          bpm={extra?.bpm as number}
          durationSeconds={metadata.durationSeconds}
        />
      </div>
    );
  }

  // 2. TUKUBI NATIVE VIDEO / DIRECT MP4 STREAM
  if (contentType === 'video' && (provider === 'tukubi_video' || extra?.videoUrl || (embedUrl && embedUrl.endsWith('.mp4')))) {
    const videoSrc = (extra?.videoUrl as string) || embedUrl || url;
    return (
      <div className={`relative rounded-2xl overflow-hidden ${className}`}>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove preview"
            className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <TukubiVideoPlayer
          src={videoSrc}
          posterUrl={thumbnailUrl}
          aspectRatio={aspectRatio}
          altText={title}
        />
      </div>
    );
  }

  // 3. COMPACT MODE (Comments, Chat Messages, or Secondary Attachment Cards)
  if (compact) {
    return (
      <div
        className={`group relative flex items-center gap-3 p-2.5 rounded-xl bg-[#140C22]/90 border border-white/10 hover:border-brand-caribbeanSea/40 transition-all text-left max-w-full overflow-hidden ${className}`}
      >
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove preview"
            className="absolute top-1 right-1 z-10 p-1 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {thumbnailUrl ? (
          <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-white/10 relative">
            <TukubiImage
              src={thumbnailUrl}
              alt={title}
              width={56}
              height={56}
              objectFit="cover"
              className="w-full h-full"
            />
            {contentType === 'video' && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white">
                <Play className="w-4 h-4 fill-current" />
              </div>
            )}
          </div>
        ) : (
          <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-brand-caribbeanSea">
            {contentType === 'video' ? (
              <Film className="w-5 h-5" />
            ) : contentType === 'audio' ? (
              <Music className="w-5 h-5" />
            ) : contentType === 'podcast' ? (
              <Radio className="w-5 h-5" />
            ) : (
              <Globe className="w-5 h-5" />
            )}
          </div>
        )}

        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/50 truncate">
            {faviconUrl && (
              <img src={faviconUrl} alt="" className="w-3 h-3 rounded-full shrink-0" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            )}
            <span className="truncate">{siteName || providerDisplayName}</span>
          </div>
          <h4 className="text-xs font-bold text-white group-hover:text-brand-caribbeanSea transition-colors truncate">
            {title}
          </h4>
          {description && (
            <p className="text-[11px] text-white/60 truncate">{description}</p>
          )}
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg text-white/40 group-hover:text-brand-caribbeanSea hover:bg-white/10 transition-colors shrink-0"
          title={`Open on ${providerDisplayName}`}
          aria-label={`Open on ${providerDisplayName}`}
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    );
  }

  // 4. FULL RICH MEDIA CARDS
  return (
    <div
      className={`group relative rounded-2xl bg-gradient-to-b from-[#180E28] to-[#10091B] border border-white/12 hover:border-brand-caribbeanSea/35 transition-all shadow-xl overflow-hidden text-left ${className}`}
    >
      {/* Remove preview button (used in Composer) */}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove preview"
          className="absolute top-3 right-3 z-30 p-1.5 rounded-full bg-black/70 text-white hover:bg-black/95 transition-colors shadow-md"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* A. VIDEO PLAYER / EMBED / THUMBNAIL */}
      {contentType === 'video' && (
        <div className="relative w-full aspect-video bg-black/80 overflow-hidden">
          {isPlayingEmbed && embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title={title}
            />
          ) : (
            <div
              className="relative w-full h-full cursor-pointer group/thumb"
              onClick={() => {
                if (embedUrl) setIsPlayingEmbed(true);
              }}
            >
              {thumbnailUrl ? (
                <TukubiImage
                  src={thumbnailUrl}
                  alt={title}
                  width={640}
                  height={360}
                  objectFit="cover"
                  className="w-full h-full group-hover/thumb:scale-102 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-brand-twilight to-brand-dusk flex items-center justify-center">
                  <Film className="w-12 h-12 text-white/30" />
                </div>
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Centered Play Button */}
              {embedUrl && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 flex items-center justify-center shadow-2xl group-hover/thumb:scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  </div>
                </div>
              )}

              {/* Bottom Video Chips: Duration & Channel */}
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white">
                <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm font-bold text-[11px] flex items-center gap-1 border border-white/10">
                  <Film className="w-3 h-3 text-brand-caribbeanSea" />
                  <span>{providerDisplayName}</span>
                </span>
                {durationFormatted && (
                  <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm font-mono text-[11px] font-bold">
                    {durationFormatted}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* B. AUDIO / PODCAST EMBED (Spotify, Apple, SoundCloud) */}
      {(contentType === 'audio' || contentType === 'podcast') && embedHtml && (
        <div
          className="w-full p-2 bg-black/40 border-b border-white/8"
          dangerouslySetInnerHTML={{ __html: embedHtml }}
        />
      )}

      {/* C. HERO IMAGE FOR ARTICLES & PRODUCTS */}
      {contentType !== 'video' && !embedHtml && thumbnailUrl && (
        <div className="relative w-full aspect-[1.91/1] max-h-64 bg-slate-900 overflow-hidden">
          <TukubiImage
            src={thumbnailUrl}
            alt={title}
            width={600}
            height={315}
            objectFit="cover"
            className="w-full h-full group-hover:scale-101 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      )}

      {/* D. CONTENT DETAILS & CALL-TO-ACTION */}
      <div className="p-4 space-y-2">
        {/* Source Badge */}
        <div className="flex items-center justify-between text-xs text-white/50">
          <div className="flex items-center gap-1.5">
            {faviconUrl && (
              <img
                src={faviconUrl}
                alt=""
                className="w-3.5 h-3.5 rounded-full shrink-0"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            <span className="font-bold text-white/70">{siteName || providerDisplayName}</span>
            {authorName && (
              <>
                <span className="text-white/30">•</span>
                <span className="truncate max-w-[150px]">{authorName}</span>
              </>
            )}
          </div>

          <span className="text-[11px] font-black uppercase tracking-wider text-brand-caribbeanSea/80">
            {contentType}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm md:text-base font-black text-white group-hover:text-brand-caribbeanSea transition-colors line-clamp-2 leading-snug">
          {String(title)}
        </h3>

        {/* Description Snippet */}
        {description ? (
          <p className="text-xs md:text-sm text-slate-300 line-clamp-2 leading-relaxed">
            {description}
          </p>
        ) : null}

        {/* E. PRODUCT / COMMERCE SPECIFIC ATTRS */}
        {contentType === 'product' && Boolean(extra?.price) && (
          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs">
            <span className="font-black text-brand-goldenHour text-sm">
              ${String(extra?.price)} {String(extra?.currency || 'USD')}
            </span>
            <span className="text-[11px] text-white/50">External Product</span>
          </div>
        )}

        {/* F. EVENT SPECIFIC ATTRS */}
        {contentType === 'event' && Boolean(extra?.startDate || extra?.location) && (
          <div className="flex items-center gap-3 pt-1 border-t border-white/10 text-xs text-brand-goldenHour">
            {Boolean(extra?.startDate) && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(extra?.startDate as string).toLocaleDateString()}</span>
              </span>
            )}
            {Boolean(extra?.location) && (
              <span className="flex items-center gap-1 truncate text-white/70">
                <MapPin className="w-3.5 h-3.5 text-brand-sunriseCoral" />
                <span className="truncate">{String(extra?.location)}</span>
              </span>
            )}
          </div>
        )}

        {/* G. ACTION FOOTER */}
        <div className="pt-2 flex items-center justify-between">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-black text-brand-caribbeanSea hover:text-brand-sunriseCoral transition-colors group/link"
          >
            <span>Open on {providerDisplayName}</span>
            <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
}
