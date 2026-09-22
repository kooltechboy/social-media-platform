'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Disc,
  ShieldCheck,
  Sparkles,
  Share2,
  Heart,
  ArrowLeft,
  Check,
  Plus,
  Video,
  Eye,
  MessageCircle,
  FileCheck,
  AlertCircle,
  X,
} from 'lucide-react';
import type { CaribbeanSound } from '../../lib/constants/caribbean-sounds';
import CreateReelModal from '../reels/create-reel-modal';
import AudioManager from '../../lib/media/audio-manager';

interface SoundDetailViewerProps {
  sound: CaribbeanSound;
  associatedReels: Array<{
    id: string;
    title: string;
    thumbnailUrl?: string | null;
    muxPlaybackId?: string | null;
    views: number;
    likes: number;
    comments: number;
    createdAt: string;
    author: {
      id?: string;
      displayName: string;
      username: string;
      avatarUrl?: string | null;
    };
  }>;
  totalUses: number;
  user: {
    id: string;
    displayName: string;
    username?: string;
  } | null;
}

export default function SoundDetailViewer({
  sound,
  associatedReels,
  totalUses,
  user,
}: SoundDetailViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(sound.durationSeconds || 15);
  const [isFavorite, setIsFavorite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerIdRef = useRef(`sound-detail-${sound.id}`);

  useEffect(() => {
    const audioMgr = AudioManager.getInstance();
    const unregister = audioMgr.register(playerIdRef.current, {
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
      audioMgr.releaseAudio(playerIdRef.current);
    };
  }, [sound.id]);

  const togglePlay = async () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      AudioManager.getInstance().releaseAudio(playerIdRef.current);
    } else {
      setPlaybackError(null);
      setIsBuffering(true);
      AudioManager.getInstance().claimAudio(playerIdRef.current, 'sound');
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err: any) {
        setIsPlaying(false);
        AudioManager.getInstance().releaseAudio(playerIdRef.current);
        if (err.name !== 'AbortError') {
          setPlaybackError(`Unable to play stem. Please check audio connection.`);
        }
      } finally {
        setIsBuffering(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || sound.durationSeconds || 15);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="w-full space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Audio element with full event handling */}
      <audio
        ref={audioRef}
        src={sound.audioUrl}
        preload="metadata"
        onPlay={() => {
          setIsPlaying(true);
          setPlaybackError(null);
          AudioManager.getInstance().claimAudio(playerIdRef.current, 'sound');
        }}
        onPause={() => {
          setIsPlaying(false);
          setIsBuffering(false);
        }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || sound.durationSeconds || 15);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setIsBuffering(false);
          AudioManager.getInstance().releaseAudio(playerIdRef.current);
        }}
        onError={(e) => {
          const mediaErr = (e.target as HTMLAudioElement).error;
          console.error('[SoundDetailViewer] Audio element error:', mediaErr);
          setIsPlaying(false);
          setIsBuffering(false);
          AudioManager.getInstance().releaseAudio(playerIdRef.current);
          setPlaybackError(`Audio stream failed to load (${mediaErr?.message || 'Network / format error'}).`);
        }}
      />

      {/* Truthful Playback Error Alert */}
      {playbackError && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between gap-3 text-xs font-bold animate-fadeIn">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            {playbackError}
          </span>
          <button
            type="button"
            onClick={() => setPlaybackError(null)}
            className="p-1 hover:text-white transition-colors cursor-pointer"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/sounds"
          className="inline-flex items-center gap-2 text-xs font-bold text-brand-sandstone/80 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Caribbean Sounds
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 text-xs font-bold text-brand-sandstone/80 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 min-h-[44px] cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Link Copied' : 'Share Stem'}
          </button>
        </div>
      </div>

      {/* Hero Sound Deck */}
      <div className="surface-card rounded-3xl p-6 sm:p-10 border border-rose-500/40 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-8 z-10 relative">
          {/* Turntable / Vinyl Visual */}
          <div
            onClick={togglePlay}
            className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-slate-950 border-2 border-rose-500/40 flex items-center justify-center flex-shrink-0 cursor-pointer shadow-2xl group relative overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-t ${sound.coverGradient}`} />
            <Disc
              className={`w-20 h-20 text-rose-400 z-10 transition-transform ${
                isPlaying && !isBuffering ? 'animate-spin' : 'group-hover:scale-105'
              }`}
              style={{ animationDuration: '4s' }}
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
              {isBuffering ? (
                <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-10 h-10 text-white fill-current" />
              ) : (
                <Play className="w-10 h-10 text-white fill-current translate-x-0.5" />
              )}
            </div>
          </div>

          {/* Sound Metadata & Controls */}
          <div className="flex-1 min-w-0 space-y-4 text-center md:text-left w-full">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="text-xs font-black px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">
                {sound.genre}
              </span>
              <span className="text-xs font-bold text-brand-sandstone/90">
                {sound.flag} {sound.countryName}
              </span>
              {sound.bpm && (
                <span className="text-xs text-brand-sandstone/70 font-mono bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                  {sound.bpm} BPM
                </span>
              )}
              <span className="text-xs text-brand-goldenHour font-black">
                {totalUses > 0 ? `🔥 ${totalUses.toLocaleString()} Reels` : 'Official Sound Stem'}
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">{sound.title}</h1>
              <p className="text-sm sm:text-base text-brand-sandstone font-bold mt-1">
                {sound.artist} {sound.artistHandle && `· @${sound.artistHandle}`}
              </p>
              {sound.sampleLyrics && (
                <p className="text-xs text-brand-sandstone/70 italic mt-2 font-serif">
                  “{sound.sampleLyrics}”
                </p>
              )}
            </div>

            {/* Audio scrubber */}
            <div className="space-y-2 pt-1 max-w-xl">
              <input
                type="range"
                min={0}
                max={duration || 48}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full accent-rose-500 h-2.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex items-center justify-between text-xs text-brand-sandstone/60">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          {/* Primary CTAs */}
          <div className="flex flex-row md:flex-col items-center gap-3 w-full md:w-auto justify-center">
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="flex-1 md:flex-initial bg-rose-500 hover:brightness-110 text-slate-950 font-black px-7 py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-rose-500/20 cursor-pointer min-h-[48px]"
            >
              <Sparkles className="w-5 h-5" /> Use This Sound
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                title="Mute / Unmute"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-3 rounded-xl border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ${
                  isFavorite
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                    : 'bg-white/5 border-white/10 text-brand-sandstone/80 hover:text-rose-400'
                }`}
                title="Save Sound"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Licensing & Legal Clearance Dossier */}
      <div className="surface-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Verified Licensing &amp; Legal Clearance</h2>
            <p className="text-xs text-brand-sandstone/70">
              Clearance status for short videos, remixes, broadcasts, and monetization on TUKUBI.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] font-black uppercase text-brand-sandstone/60">Licensing Status</span>
            <div className="text-xs font-black text-emerald-400 flex items-center gap-1.5 pt-1">
              <FileCheck className="w-4 h-4" />
              <span className="capitalize">{sound.licensingStatus.replace(/_/g, ' ')}</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] font-black uppercase text-brand-sandstone/60">License Type</span>
            <div className="text-xs font-bold text-white pt-1">{sound.licenseType}</div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] font-black uppercase text-brand-sandstone/60">Commercial Use</span>
            <div className="text-xs font-bold text-white pt-1">
              {sound.commercialUseAllowed ? (
                <span className="text-emerald-400">✓ Allowed for Creator Reels</span>
              ) : (
                <span className="text-amber-400">Non-commercial Only</span>
              )}
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] font-black uppercase text-brand-sandstone/60">License Source</span>
            <div className="text-xs font-bold text-white pt-1 truncate">{sound.licenseSource}</div>
          </div>
        </div>

        <div className="bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-brand-caribbeanSea" /> Attribution Requirement
          </div>
          <p className="text-xs text-brand-sandstone/80 font-mono bg-slate-900/90 p-3 rounded-xl border border-white/5 select-all">
            {sound.attributionRequirement}
          </p>
          <p className="text-[11px] text-brand-sandstone/60">
            TUKUBI automatically attaches this sound attribution credit to any Reel or Short created with this rhythm stem.
          </p>
        </div>
      </div>

      {/* Associated Caribbean Reels Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-rose-500" /> Reels Made with this Sound ({totalUses})
          </h2>
          {totalUses > 0 && (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="text-xs font-black text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Your Reel
            </button>
          )}
        </div>

        {associatedReels.length === 0 ? (
          <div className="surface-card rounded-3xl p-12 text-center border border-white/10 max-w-xl mx-auto space-y-4 my-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
              <Video className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white">No Reels with this Sound Yet</h3>
              <p className="text-xs text-brand-sandstone/70 max-w-md mx-auto mt-1 leading-relaxed">
                Be the pioneer creator to record or remix a Caribbean Reel using &ldquo;{sound.title}&rdquo;.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="bg-rose-500 hover:brightness-110 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs inline-flex items-center gap-2 cursor-pointer shadow-md min-h-[44px]"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Create First Reel
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {associatedReels.map((reel) => (
              <Link
                key={reel.id}
                href={`/reels?id=${reel.id}`}
                className="group relative rounded-2xl overflow-hidden bg-slate-950 aspect-[9/16] border border-white/10 hover:border-rose-500/60 transition-all shadow-md flex flex-col justify-end p-3"
              >
                {reel.thumbnailUrl ? (
                  <Image
                    src={reel.thumbnailUrl}
                    alt={reel.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900 to-purple-950 flex items-center justify-center">
                    <Video className="w-8 h-8 text-white/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                <div className="relative z-10 space-y-1">
                  <p className="text-xs font-black text-white truncate">{reel.title}</p>
                  <p className="text-[10px] text-brand-sandstone/80 truncate">@{reel.author.username}</p>
                  <div className="flex items-center gap-2 pt-1 text-[10px] text-brand-sandstone/80 font-bold">
                    <span className="flex items-center gap-0.5">
                      <Eye className="w-3 h-3 text-rose-400" /> {reel.views}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Heart className="w-3 h-3 text-rose-400 fill-current" /> {reel.likes}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Reel Modal with this sound attached */}
      <CreateReelModal
        isOpen={isCreateOpen}
        initialSoundId={sound.id}
        onClose={() => setIsCreateOpen(false)}
        user={user}
      />
    </div>
  );
}
