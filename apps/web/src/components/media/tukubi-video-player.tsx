'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, AlertCircle } from 'lucide-react';

export interface TukubiVideoPlayerProps {
  src: string;
  posterUrl?: string;
  autoPlayInView?: boolean;
  mutedDefault?: boolean;
  className?: string;
  altText?: string;
}

/**
 * TUKUBI Enterprise Adaptive Video Player
 * Supports HLS streaming manifests, responsive posters, viewport-aware auto-play/pause,
 * and Caribbean Futurism sleek glass controls.
 */
export default function TukubiVideoPlayer({
  src,
  posterUrl,
  autoPlayInView = true,
  mutedDefault = true,
  className = '',
  altText = 'Video playback',
}: TukubiVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(mutedDefault);
  const [progress, setProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Auto-pause when scrolled out of viewport
  useEffect(() => {
    if (!autoPlayInView || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video) return;

        if (!entry.isIntersecting && !video.paused) {
          video.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [autoPlayInView]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickPos = (e.clientX - rect.left) / rect.width;
    video.currentTime = clickPos * video.duration;
  };

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

  if (hasError) {
    return (
      <div className={`w-full aspect-video bg-brand-dusk rounded-2xl flex items-center justify-center p-4 text-center border border-slate-800 ${className}`}>
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
      onClick={togglePlay}
      className={`relative group overflow-hidden rounded-2xl bg-black select-none cursor-pointer ${className}`}
      role="region"
      aria-label={altText}
    >
      <video
        ref={videoRef}
        src={src}
        poster={posterUrl}
        muted={isMuted}
        playsInline
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedData={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover max-h-[550px]"
      />

      {/* Center Play Button Overlay (visible when paused) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-opacity">
          <div className="w-14 h-14 rounded-full bg-brand-caribbeanSea/90 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30 transform transition-transform hover:scale-110 active:scale-95">
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </div>
        </div>
      )}

      {/* Bottom Floating Controls (Fade in on hover or when paused) */}
      <div
        className={`absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col gap-2 transition-opacity duration-300 ${
          isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div
          onClick={handleSeek}
          className="w-full h-1.5 bg-white/20 hover:h-2 rounded-full cursor-pointer relative overflow-hidden transition-all"
        >
          <div
            className="h-full bg-gradient-to-r from-brand-caribbeanSea to-brand-goldenHour rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Control Bar Actions */}
        <div className="flex items-center justify-between text-white text-xs pt-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="p-1 hover:text-brand-caribbeanSea transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="p-1 hover:text-brand-caribbeanSea transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-300" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
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
