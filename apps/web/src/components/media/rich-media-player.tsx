'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, ExternalLink, RotateCcw, AlertTriangle, Film } from 'lucide-react';
import type { ResolvedContentMetadata } from '@caribbean/media';
import TukubiImage from '../ui/tukubi-image';

export const ALLOWED_EMBED_ORIGINS = [
  'https://www.youtube.com',
  'https://www.youtube-nocookie.com',
  'https://player.vimeo.com',
  'https://www.dailymotion.com',
  'https://player.twitch.tv',
  'https://clips.twitch.tv',
  'https://www.loom.com',
  'https://open.spotify.com',
  'https://w.soundcloud.com',
  'https://embed.podcasts.apple.com',
  'https://embed.music.apple.com',
  'https://www.tiktok.com',
];

export function isSafeEmbedUrl(urlStr?: string): boolean {
  if (!urlStr) return false;
  try {
    const u = new URL(urlStr);
    if (u.protocol !== 'https:') return false;
    return ALLOWED_EMBED_ORIGINS.some((origin) => {
      const o = new URL(origin);
      return u.hostname === o.hostname || u.hostname.endsWith(`.${o.hostname}`);
    });
  } catch {
    return false;
  }
}

export type PlayerState = 'idle' | 'loading' | 'playing' | 'fallback';

export interface RichMediaPlayerProps {
  metadata: ResolvedContentMetadata;
  aspectRatio?: string;
  className?: string;
  onFallback?: (reason: string) => void;
}

export default function RichMediaPlayer({
  metadata,
  aspectRatio = '16:9',
  className = '',
  onFallback,
}: RichMediaPlayerProps) {
  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  const [fallbackReason, setFallbackReason] = useState<string>('');
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const {
    url,
    canonicalUrl,
    provider,
    providerDisplayName,
    title,
    thumbnailUrl,
    durationFormatted,
    embedUrl,
    canEmbed,
    extra,
  } = metadata;

  const isShort = aspectRatio === '9:16' || Boolean(extra?.isShort);
  const targetExternalUrl = canonicalUrl || url;

  const triggerFallback = useCallback(
    (reason: string) => {
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
      setFallbackReason(reason);
      setPlayerState('fallback');
      onFallback?.(reason);
    },
    [onFallback]
  );

  // Clear watchdog on unmount
  useEffect(() => {
    return () => {
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
      }
    };
  }, []);

  // YouTube / External postMessage error detection & state change trap
  useEffect(() => {
    if (playerState !== 'loading' && playerState !== 'playing') return;

    function handleWindowMessage(event: MessageEvent) {
      if (!event.data) return;

      try {
        let payload: any = event.data;
        if (typeof payload === 'string' && (payload.startsWith('{') || payload.startsWith('['))) {
          payload = JSON.parse(payload);
        }

        // 1. YouTube IFrame API error trap (101 / 150 = embedding forbidden by owner; 100 = video removed/private; 2/5 = invalid param)
        if (
          payload?.event === 'onError' ||
          (typeof payload?.info === 'number' && [2, 5, 100, 101, 150].includes(payload.info))
        ) {
          triggerFallback('Playback restricted by content creator.');
          return;
        }

        // 2. YouTube confirmation of playback -> clear watchdog
        if (
          payload?.event === 'onStateChange' &&
          (payload?.info === 1 || payload?.info === 3) // 1 = playing, 3 = buffering
        ) {
          if (watchdogTimerRef.current) {
            clearTimeout(watchdogTimerRef.current);
            watchdogTimerRef.current = null;
          }
          setPlayerState('playing');
        }
      } catch {
        // Non-JSON message from other extensions or iframes; safely ignore
      }
    }

    window.addEventListener('message', handleWindowMessage);
    return () => {
      window.removeEventListener('message', handleWindowMessage);
    };
  }, [playerState, triggerFallback]);

  const handlePlayClick = () => {
    if (!embedUrl || !isSafeEmbedUrl(embedUrl) || canEmbed === false) {
      // Cannot embed directly; open safely in external destination
      window.open(targetExternalUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setPlayerState('loading');

    // Start 4500ms watchdog timer: if iframe fails to initialize or confirm playback, fall back gracefully
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
    }
    watchdogTimerRef.current = setTimeout(() => {
      triggerFallback('Playback timed out inside platform container.');
    }, 4500);
  };

  const handleRetry = () => {
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
    setPlayerState('idle');
    setFallbackReason('');
  };

  // Build enhanced embed URL with JS API enabled for error trapping
  const getAugmentedEmbedUrl = (): string => {
    if (!embedUrl) return '';
    try {
      const u = new URL(embedUrl);
      if (u.hostname.includes('youtube')) {
        u.searchParams.set('enablejsapi', '1');
        if (typeof window !== 'undefined' && window.location.origin) {
          u.searchParams.set('origin', window.location.origin);
        }
      }
      return u.toString();
    } catch {
      return embedUrl;
    }
  };

  const handleIframeLoad = useCallback(() => {
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
    setPlayerState((prev) => (prev === 'loading' ? 'playing' : prev));

    // Register YouTube IFrame API listener so restricted embeds (error 101/150) emit onError
    if (embedUrl && embedUrl.includes('youtube') && iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }),
          '*'
        );
      } catch {
        // Cross-origin postMessage ignored if blocked
      }
    }
  }, [embedUrl]);

  const containerAspectClass = isShort
    ? 'relative w-full max-w-[320px] mx-auto aspect-[9/16] bg-black/95 rounded-xl overflow-hidden'
    : 'relative w-full aspect-video bg-black/90 overflow-hidden';

  return (
    <div className={`${containerAspectClass} ${className}`}>
      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. ACTIVE EMBED PLAYBACK                                     */}
      {/* ──────────────────────────────────────────────────────────── */}
      {(playerState === 'loading' || playerState === 'playing') && embedUrl && (
        <div className="relative w-full h-full">
          <iframe
            ref={iframeRef}
            src={getAugmentedEmbedUrl()}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-forms"
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
            title={title}
            onLoad={handleIframeLoad}
            onError={() => triggerFallback('Iframe failed to load.')}
          />

          {/* Loading spinner overlay while initializing */}
          {playerState === 'loading' && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-brand-caribbeanSea border-t-transparent animate-spin" />
                <span className="text-[11px] font-bold text-white/80">Loading player...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. GRACEFUL FALLBACK (No Gray Box, No Broken State)          */}
      {/* ──────────────────────────────────────────────────────────── */}
      {playerState === 'fallback' && (
        <div className="relative w-full h-full flex flex-col justify-end p-4 text-left overflow-hidden">
          {/* Preserved High-Resolution Thumbnail Backdrop */}
          {thumbnailUrl ? (
            <TukubiImage
              src={thumbnailUrl}
              alt={title}
              width={isShort ? 360 : 640}
              height={isShort ? 640 : 360}
              objectFit="cover"
              className="absolute inset-0 w-full h-full filter blur-[2px] brightness-50"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-tr from-[#1E1030] to-[#0A0512]" />
          )}

          {/* Gradient readability scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-black/30 pointer-events-none" />

          {/* Fallback Message & Action Buttons */}
          <div className="relative z-20 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Playback unavailable in embed</span>
            </div>

            <p className="text-xs text-slate-200 line-clamp-2">
              This video requires viewing directly on {providerDisplayName}.
            </p>

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <a
                href={targetExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black text-xs hover:brightness-110 transition-all shadow-lg shadow-cyan-500/20 active:scale-98"
                aria-label={`Watch on ${providerDisplayName}`}
              >
                <span>Watch on {providerDisplayName}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
                aria-label="Try playback again"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 3. IDLE POSTER & PLAY TRIGGER                                */}
      {/* ──────────────────────────────────────────────────────────── */}
      {playerState === 'idle' && (
        <div
          className="relative w-full h-full cursor-pointer group/thumb select-none"
          onClick={handlePlayClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handlePlayClick();
            }
          }}
          aria-label={`Play ${title} on ${providerDisplayName}`}
        >
          {thumbnailUrl ? (
            <TukubiImage
              src={thumbnailUrl}
              alt={title}
              width={isShort ? 360 : 640}
              height={isShort ? 640 : 360}
              objectFit="cover"
              className="w-full h-full group-hover/thumb:scale-102 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-brand-twilight to-brand-dusk flex items-center justify-center">
              <Film className="w-12 h-12 text-white/30" />
            </div>
          )}

          {/* Gradient Scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Centered Play Button or External Link Chip */}
          {embedUrl && isSafeEmbedUrl(embedUrl) && canEmbed !== false ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 flex items-center justify-center shadow-2xl group-hover/thumb:scale-110 transition-transform">
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
              <div className="px-3.5 py-1.5 rounded-full bg-black/80 text-white font-bold text-xs flex items-center gap-1.5 backdrop-blur-sm border border-white/20">
                <span>Watch on {providerDisplayName}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </div>
          )}

          {/* Bottom Chips: Duration & Provider */}
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
  );
}
