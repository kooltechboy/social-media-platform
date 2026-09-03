'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react';

export interface AudioVoiceNotePlayerProps {
  audioUrl: string;
  durationSeconds?: number;
  senderName?: string;
  isOwn?: boolean;
  isCurrentUser?: boolean;
}

export default function AudioVoiceNotePlayer({
  audioUrl,
  durationSeconds = 0,
  senderName = 'Caribbean Member',
  isOwn = false,
  isCurrentUser = false,
}: AudioVoiceNotePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);
  const [isMuted, setIsMuted] = useState(false);

  const isOwner = isOwn || isCurrentUser;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(Math.round(audio.duration));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => {
        console.warn('Audio play failed:', e);
      });
    }
  }

  function toggleSpeed() {
    const nextSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
    setPlaybackSpeed(nextSpeed as 1 | 1.5 | 2);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const targetTime = Number(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  }

  function formatAudioTime(seconds: number) {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // Pre-calculated aesthetic waveform heights for high-fidelity audio representation
  const waveformBars = [
    25, 45, 75, 55, 90, 60, 40, 70, 85, 100, 75, 45, 60, 85, 95, 70, 40, 30, 50, 80,
    95, 65, 40, 60, 85, 100, 80, 55, 35, 65, 80, 50, 30, 60, 90, 75, 45, 30,
  ];

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`p-3 rounded-2xl flex flex-col gap-2 min-w-[240px] sm:min-w-[280px] max-w-sm ${
        isOwner
          ? 'bg-gradient-to-r from-sky-950/60 to-emerald-950/60 border border-emerald-400/30 text-white'
          : 'bg-[#1C122B]/90 border border-white/15 text-slate-100'
      }`}
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Top Player Row: Play/Pause, Waveform, Speed Toggle */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all transform active:scale-95 shadow-md flex-shrink-0 ${
            isOwner
              ? 'bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 hover:brightness-110'
              : 'bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 hover:brightness-110'
          }`}
          title={isPlaying ? 'Pause voice note' : 'Play voice note'}
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        {/* Dynamic Waveform Visualizer & Scrub Bar */}
        <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
          <div className="relative flex items-center gap-0.5 h-7 cursor-pointer group" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            const targetSec = clickPos * (duration || 1);
            if (audioRef.current) audioRef.current.currentTime = targetSec;
            setCurrentTime(targetSec);
          }}>
            {waveformBars.map((height, idx) => {
              const barPercent = (idx / waveformBars.length) * 100;
              const isPlayed = barPercent <= progressPercent;

              return (
                <div
                  key={idx}
                  style={{ height: `${Math.max(15, height)}%` }}
                  className={`w-1 rounded-full transition-colors ${
                    isPlayed
                      ? 'bg-gradient-to-t from-brand-caribbeanSea to-emerald-400 shadow-sm'
                      : 'bg-white/20 group-hover:bg-white/30'
                  }`}
                />
              );
            })}
          </div>

          {/* Hidden input range for accessible scrubbing */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 opacity-0 absolute cursor-pointer"
            aria-label="Seek audio"
          />

          {/* Time & Duration Display */}
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-300">
            <span>{formatAudioTime(currentTime)}</span>
            <span>{duration > 0 ? formatAudioTime(duration) : 'Voice note'}</span>
          </div>
        </div>

        {/* Playback Speed Switcher (1x, 1.5x, 2x) */}
        <button
          type="button"
          onClick={toggleSpeed}
          className="text-[10px] font-black px-2 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-brand-caribbeanSea border border-white/10 transition-colors flex-shrink-0"
          title="Change playback speed"
        >
          {playbackSpeed}x
        </button>
      </div>
    </div>
  );
}
