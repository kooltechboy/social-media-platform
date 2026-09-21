'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  AlertCircle,
  Heart,
  PictureInPicture2,
} from 'lucide-react';
import { getClampedAspectRatio } from '@caribbean/media';
import AudioManager from '../../lib/media/audio-manager';

export interface TukubiVideoPlayerProps {
  src: string;
  posterUrl?: string;
  aspectRatio?: string | number;
  autoPlayInView?: boolean;
  mutedDefault?: boolean;
  className?: string;
  altText?: string;
  onDoubleTapLike?: () => void;
  id?: string;
}

/**
 * Bounds and resolves the video container aspect ratio to provide zero-CLS, zero-crop framing.
 * Falls back to 16 / 9 if not specified, and clamps between 4 / 5 portrait and 16 / 9 landscape.
 */
export function computeVideoContainerStyle(
  aspectRatio?: number | string
): { aspectRatio: string; needsAmbientBackdrop: boolean; clampedRatio: number } {
  let numRatio = 16 / 9; // Default 16:9 for social video

  if (typeof aspectRatio === 'number') {
    if (!isNaN(aspectRatio) && isFinite(aspectRatio) && aspectRatio > 0) {
      numRatio = aspectRatio;
    }
  } else if (typeof aspectRatio === 'string' && aspectRatio.trim().length > 0) {
    const trimmed = aspectRatio.trim();
    if (trimmed.includes(':') || trimmed.includes('/')) {
      const parts = trimmed.split(/[:/]/).map((s) => parseFloat(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[0] > 0 && parts[1] > 0) {
        numRatio = parts[0] / parts[1];
      }
    } else {
      const parsed = parseFloat(trimmed);
      if (!isNaN(parsed) && isFinite(parsed) && parsed > 0) {
        numRatio = parsed;
      }
    }
  }

  const clamped = getClampedAspectRatio(numRatio, 0.8, 16 / 9);
  return {
    aspectRatio: clamped.cssAspectRatio,
    needsAmbientBackdrop: clamped.isClamped,
    clampedRatio: clamped.clampedRatio,
  };
}

/**
 * Formats duration or current playback timestamp in seconds into a clean time string (m:ss or h:mm:ss).
 */
export function formatVideoTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds) || seconds <= 0) {
    return '0:00';
  }

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  const paddedSeconds = remainingSeconds.toString().padStart(2, '0');

  if (hours > 0) {
    const paddedMinutes = minutes.toString().padStart(2, '0');
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${minutes}:${paddedSeconds}`;
}

/**
 * Calculates seek time in seconds given a click/drag position ratio (0 to 1) and total duration.
 */
export function calculateSeekTime(clickPositionRatio: number, duration: number): number {
  if (isNaN(clickPositionRatio) || isNaN(duration) || duration <= 0) {
    return 0;
  }
  const clampedRatio = Math.max(0, Math.min(clickPositionRatio, 1));
  return clampedRatio * duration;
}

/**
 * Calculates progress percentage (0 to 100) from current playback time and total duration.
 */
export function calculateProgressPercentage(currentTime: number, duration: number): number {
  if (isNaN(currentTime) || isNaN(duration) || duration <= 0 || currentTime <= 0) {
    return 0;
  }
  const ratio = currentTime / duration;
  const clampedRatio = Math.max(0, Math.min(ratio, 1));
  return clampedRatio * 100;
}

/**
 * TUKUBI Enterprise Video Player
 *
 * Features:
 * - Fluid aspect ratio container with zero-cropping (contain framing) and optional ambient blurred backdrop.
 * - Single-Audio Master via AudioManager singleton, preventing simultaneous audio playback.
 * - Sub-200ms poster and Caribbean twilight placeholder shimmer until ready.
 * - IntersectionObserver viewport auto-play/pause (50% visibility threshold).
 * - Tactile micro-scrubber with Caribbean gradient (caribbeanSea -> sunriseCoral -> goldenHour).
 * - Double-tap gesture with pulsing heart like indicator.
 * - Centered play/pause flash indicator and one-tap Picture-in-Picture (PiP).
 */
export default function TukubiVideoPlayer({
  src,
  posterUrl,
  aspectRatio,
  autoPlayInView = true,
  mutedDefault = true,
  className = '',
  altText = 'Video playback',
  onDoubleTapLike,
  id,
}: TukubiVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrubberRef = useRef<HTMLDivElement | null>(null);

  const playerIdRef = useRef<string>(
    id || `tukubi-video-${Math.random().toString(36).substring(2, 9)}`
  );

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined' && AudioManager.getInstance().isGloballyUnmuted()) {
      return false;
    }
    return mutedDefault;
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);

  // Scrubber hover / drag state
  const [isHoveringScrubber, setIsHoveringScrubber] = useState(false);
  const [hoverPositionRatio, setHoverPositionRatio] = useState<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Gestures and feedback
  const [showHeart, setShowHeart] = useState(false);
  const [flashIcon, setFlashIcon] = useState<'play' | 'pause' | null>(null);
  const lastTapRef = useRef<number>(0);
  const singleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Aspect ratio calculations
  const containerStyle = computeVideoContainerStyle(aspectRatio);

  // Check Picture-in-Picture API support
  useEffect(() => {
    if (typeof document !== 'undefined' && 'pictureInPictureEnabled' in document) {
      setPipSupported(document.pictureInPictureEnabled);
    }
  }, []);

  // Register with AudioManager singleton for single-audio master control
  useEffect(() => {
    const audioMgr = AudioManager.getInstance();
    const unregister = audioMgr.register(playerIdRef.current, () => {
      const video = videoRef.current;
      if (video) {
        video.muted = true;
      }
      setIsMuted(true);
    });

    return () => {
      unregister();
      audioMgr.releaseAudio(playerIdRef.current);
    };
  }, []);

  // Auto-pause / Auto-play when scrolled in/out of viewport
  useEffect(() => {
    if (!autoPlayInView || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video) return;

        if (entry.isIntersecting) {
          const isGlobalUnmuted = AudioManager.getInstance().isGloballyUnmuted();
          if (isGlobalUnmuted) {
            AudioManager.getInstance().claimAudio(playerIdRef.current);
            video.muted = false;
            setIsMuted(false);
          } else {
            video.muted = true;
            setIsMuted(true);
          }
          video
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => {});
        } else {
          if (!video.paused) {
            video.pause();
            setIsPlaying(false);
          }
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [autoPlayInView]);

  const flashIndicator = (type: 'play' | 'pause') => {
    setFlashIcon(type);
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
    }
    flashTimeoutRef.current = setTimeout(() => {
      setFlashIcon(null);
    }, 500);
  };

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          flashIndicator('play');
        })
        .catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
      flashIndicator('pause');
    }
  }, []);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      // User tapped unmute: claim single audio master
      AudioManager.getInstance().claimAudio(playerIdRef.current);
      video.muted = false;
      setIsMuted(false);
    } else {
      // User tapped mute: release audio and reset global preference
      AudioManager.getInstance().releaseAudio(playerIdRef.current);
      AudioManager.getInstance().setGloballyUnmuted(false);
      video.muted = true;
      setIsMuted(true);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    if (!duration && video.duration) {
      setDuration(video.duration);
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video && video.duration) {
      setDuration(video.duration);
    }
  };

  // Micro-scrubber pointer seeking
  const handleScrubberSeek = (clientX: number) => {
    const scrubber = scrubberRef.current;
    const video = videoRef.current;
    if (!scrubber || !video || !duration) return;

    const rect = scrubber.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const targetTime = calculateSeekTime(ratio, duration);
    video.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsScrubbing(true);
    handleScrubberSeek(e.clientX);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const scrubber = scrubberRef.current;
    if (!scrubber) return;
    const rect = scrubber.getBoundingClientRect();
    const ratio = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
    setHoverPositionRatio(ratio);

    if (isScrubbing) {
      handleScrubberSeek(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isScrubbing) {
      setIsScrubbing(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    }
  };

  // Picture in Picture
  const handleTogglePiP = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement === video) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled && !video.disablePictureInPicture) {
        await video.requestPictureInPicture();
      }
    } catch {
      // PiP error or user abort
    }
  };

  // Fullscreen
  const handleFullScreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    } else {
      container.requestFullscreen?.().catch(() => {});
    }
  };

  // Container tap / double-tap handling
  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-video-controls]')) return;

    const now = Date.now();
    const DOUBLE_TAP_THRESHOLD = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_THRESHOLD) {
      // Double tap detected
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
      lastTapRef.current = 0;

      setShowHeart(true);
      onDoubleTapLike?.();
      setTimeout(() => setShowHeart(false), 900);
    } else {
      // Single tap: queue play/pause toggle
      lastTapRef.current = now;
      singleTapTimeoutRef.current = setTimeout(() => {
        togglePlay();
        singleTapTimeoutRef.current = null;
      }, DOUBLE_TAP_THRESHOLD);
    }
  };

  const progressPercent = calculateProgressPercentage(currentTime, duration);
  const hoveredTime =
    hoverPositionRatio !== null && duration ? hoverPositionRatio * duration : null;

  if (hasError) {
    return (
      <div
        className={`w-full bg-[#0D0818] rounded-2xl flex items-center justify-center p-4 text-center border border-slate-800 ${className}`}
        style={{ aspectRatio: containerStyle.aspectRatio }}
      >
        <div className="space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-xs text-brand-sandstone/70">Video playback temporarily unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className={`relative group overflow-hidden rounded-2xl bg-black select-none cursor-pointer max-h-[640px] sm:max-h-[720px] ${className}`}
      style={{ aspectRatio: containerStyle.aspectRatio }}
      role="region"
      aria-label={altText}
    >
      {/* Ambient blurred backdrop when exceeding clamp bounds (zero cropping safeguard) */}
      {containerStyle.needsAmbientBackdrop && posterUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-40 scale-110 pointer-events-none"
          style={{ backgroundImage: `url(${posterUrl})` }}
          aria-hidden="true"
        />
      )}

      {/* Sub-200ms Poster & Shimmer Loading Skeleton */}
      {posterUrl && !isLoaded && (
        <div className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden bg-[#0D0818]">
          <img
            src={posterUrl}
            alt={altText || 'Video preview'}
            className="w-full h-full object-contain"
          />
          {/* Caribbean twilight placeholder shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-caribbeanSea/20 to-transparent animate-pulse pointer-events-none" />
        </div>
      )}

      {/* Primary Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={posterUrl}
        muted={isMuted}
        playsInline
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onLoadedData={() => setIsLoaded(true)}
        onCanPlay={() => setIsLoaded(true)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setHasError(true)}
        className="w-full h-full object-contain relative z-10"
      />

      {/* Center Play Button Overlay (visible when paused and not flashing) */}
      {!isPlaying && !flashIcon && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[2px] transition-opacity z-20 pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-brand-caribbeanSea/90 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30 transform transition-transform group-hover:scale-110">
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </div>
        </div>
      )}

      {/* Centered Flash Indicator on Tap */}
      {flashIcon && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none animate-in fade-in zoom-in duration-200">
          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center shadow-2xl">
            {flashIcon === 'play' ? (
              <Play className="w-8 h-8 fill-current ml-1" />
            ) : (
              <Pause className="w-8 h-8 fill-current" />
            )}
          </div>
        </div>
      )}

      {/* Double-Tap Pulsing Heart Overlay */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-in fade-in zoom-in duration-300">
          <div className="p-4 rounded-full bg-black/50 backdrop-blur-md shadow-[0_0_35px_#FF7A59] animate-bounce">
            <Heart className="w-16 h-16 text-[#FF7A59] fill-[#FF7A59] drop-shadow-[0_0_18px_#FF7A59]" />
          </div>
        </div>
      )}

      {/* Bottom Floating Tactile Controls & Micro-Scrubber */}
      <div
        data-video-controls
        className={`absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/85 via-black/50 to-transparent flex flex-col gap-2 transition-opacity duration-300 z-20 ${
          isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tactile Micro-Scrubber Bar */}
        <div
          ref={scrubberRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onMouseEnter={() => setIsHoveringScrubber(true)}
          onMouseLeave={() => {
            setIsHoveringScrubber(false);
            setHoverPositionRatio(null);
          }}
          className="w-full h-1 hover:h-2 group/scrubber rounded-full cursor-pointer relative overflow-visible transition-all flex items-center"
        >
          {/* Track background */}
          <div className="absolute inset-0 bg-white/25 rounded-full overflow-hidden">
            {/* Caribbean Gradient Progress Line */}
            <div
              className="h-full bg-gradient-to-r from-brand-caribbeanSea via-brand-sunriseCoral to-brand-goldenHour rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Hover Scrub Preview Line */}
          {isHoveringScrubber && hoverPositionRatio !== null && (
            <div
              className="absolute h-full bg-white/30 rounded-full pointer-events-none"
              style={{
                width: `${hoverPositionRatio * 100}%`,
              }}
            />
          )}

          {/* Glowing Scrubber Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,122,89,0.9)] scale-0 group-hover/scrubber:scale-100 transition-transform pointer-events-none"
            style={{ left: `${progressPercent}%` }}
          />

          {/* Floating Time Indicator Tooltip on Hover / Drag */}
          {(isHoveringScrubber || isScrubbing) && hoverPositionRatio !== null && (
            <div
              className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded bg-black/85 backdrop-blur-md border border-white/10 text-[10px] font-mono font-medium text-white shadow-lg pointer-events-none whitespace-nowrap"
              style={{
                left: `${Math.max(5, Math.min(hoverPositionRatio * 100, 95))}%`,
              }}
            >
              {formatVideoTime(hoveredTime ?? currentTime)} / {formatVideoTime(duration)}
            </div>
          )}
        </div>

        {/* Action Controls & Persistent Time Indicator */}
        <div className="flex items-center justify-between text-white text-xs pt-0.5">
          <div className="flex items-center gap-3">
            {/* Play / Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="p-1 hover:text-brand-caribbeanSea transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
            </button>

            {/* Mute / Unmute Button */}
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="p-1 hover:text-brand-caribbeanSea transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-300" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            {/* Clean Static Time Indicator (0:14 / 0:45) */}
            <div className="text-[11px] font-mono tracking-tight text-white/80 select-none">
              {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Picture in Picture Button */}
            {pipSupported && (
              <button
                type="button"
                onClick={handleTogglePiP}
                aria-label="Picture-in-Picture"
                className="p-1 hover:text-brand-caribbeanSea transition-colors"
              >
                <PictureInPicture2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={handleFullScreen}
              aria-label="Fullscreen"
              className="p-1 hover:text-brand-caribbeanSea transition-colors"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
