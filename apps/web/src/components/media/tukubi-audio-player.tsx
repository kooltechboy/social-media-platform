'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, AlertCircle, Disc } from 'lucide-react';
import AudioManager from '../../lib/media/audio-manager';
import { formatDurationSeconds } from '@caribbean/media';

export interface TukubiAudioPlayerProps {
  src: string;
  title: string;
  artist?: string;
  genre?: string;
  flag?: string;
  bpm?: number;
  durationSeconds?: number;
  coverGradient?: string;
  className?: string;
  id?: string;
}

export default function TukubiAudioPlayer({
  src,
  title,
  artist,
  genre,
  flag,
  bpm,
  durationSeconds,
  coverGradient = 'from-brand-caribbeanSea via-teal-600 to-brand-sunriseCoral',
  className = '',
  id,
}: TukubiAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds || 0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerIdRef = useRef(id || `tukubi-audio-${Math.random().toString(36).substring(2, 9)}`);
  const scrubberRef = useRef<HTMLDivElement | null>(null);

  // Register with AudioManager singleton for single-audio-master policy
  useEffect(() => {
    const unregister = AudioManager.register(playerIdRef.current, {
      onPause: () => {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
      },
      onMute: () => {
        if (audioRef.current) {
          audioRef.current.muted = true;
        }
        setIsMuted(true);
      },
      kind: 'sound',
    });

    return () => {
      unregister();
      AudioManager.releaseAudio(playerIdRef.current);
    };
  }, []);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      AudioManager.releaseAudio(playerIdRef.current);
    } else {
      setHasError(false);
      AudioManager.claimAudio(playerIdRef.current, 'sound');
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.warn('[TukubiAudioPlayer] Audio playback prevented:', err?.message);
          setHasError(true);
          setIsPlaying(false);
        }
      }
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!duration && audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || !audioRef.current) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * (duration || 1);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const target = !isMuted;
      audioRef.current.muted = target;
      setIsMuted(target);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`rounded-2xl p-4 bg-gradient-to-br from-[#1A1028] via-[#140C22] to-[#0D0717] border border-brand-caribbeanSea/30 shadow-xl text-left relative overflow-hidden transition-all hover:border-brand-caribbeanSea/50 ${className}`}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (audioRef.current?.duration) {
            setDuration(audioRef.current.duration);
          }
        }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          AudioManager.releaseAudio(playerIdRef.current);
        }}
        onError={() => {
          setHasError(true);
          setIsBuffering(false);
          setIsPlaying(false);
        }}
      />

      <div className="flex items-center gap-3.5">
        {/* Play/Pause Button with Disc Motif */}
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-caribbeanSea ${
            isPlaying
              ? 'bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour text-slate-950 animate-pulse'
              : 'bg-gradient-to-r from-brand-caribbeanSea to-teal-500 text-slate-950 hover:brightness-110'
          }`}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Track Metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-sm font-black text-white truncate max-w-full">
              {title}
            </h4>
            {flag && <span className="text-sm">{flag}</span>}
          </div>

          <div className="flex items-center gap-2 text-xs text-white/60 mt-0.5 flex-wrap">
            {artist && <span className="text-white/80 font-semibold truncate">{artist}</span>}
            {genre && (
              <>
                <span className="text-white/30">•</span>
                <span className="text-[11px] font-bold text-brand-caribbeanSea px-1.5 py-0.2 rounded bg-brand-caribbeanSea/10">
                  {genre}
                </span>
              </>
            )}
            {bpm && (
              <>
                <span className="text-white/30">•</span>
                <span className="text-[11px] text-white/50">{bpm} BPM</span>
              </>
            )}
          </div>
        </div>

        {/* Mute Toggle */}
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-caribbeanSea"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Scrubber Progress Bar */}
      <div className="mt-3 space-y-1">
        <div
          ref={scrubberRef}
          onClick={handleScrubberClick}
          role="slider"
          aria-label="Audio scrubber"
          aria-valuemin={0}
          aria-valuemax={duration || 100}
          aria-valuenow={currentTime}
          className="w-full h-2 bg-white/10 rounded-full cursor-pointer relative overflow-hidden group py-1"
        >
          <div
            className="h-full bg-gradient-to-r from-brand-caribbeanSea via-teal-400 to-brand-sunriseCoral rounded-full transition-all duration-100 group-hover:brightness-125"
            style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
          <span>{formatDurationSeconds(currentTime) || '0:00'}</span>
          <span>{formatDurationSeconds(duration) || (durationSeconds ? formatDurationSeconds(durationSeconds) : '0:00')}</span>
        </div>
      </div>

      {hasError && (
        <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-2">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Audio stream is temporarily unavailable.</span>
        </div>
      )}
    </div>
  );
}
