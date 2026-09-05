'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Search,
  Sparkles,
  Flame,
  Plus,
  Share2,
  Heart,
  Disc,
  ArrowRight,
  Sliders,
  Check,
  Radio,
} from 'lucide-react';
import {
  CARIBBEAN_SOUNDS,
  SOUND_GENRES,
  searchCaribbeanSounds,
  type CaribbeanSound,
} from '../../lib/constants/caribbean-sounds';
import CreateReelModal from '../reels/create-reel-modal';

interface SoundsDirectoryClientProps {
  initialTrackId?: string;
  initialQuery?: string;
  user: {
    id: string;
    displayName: string;
    username?: string;
  } | null;
}

export default function SoundsDirectoryClient({
  initialTrackId,
  initialQuery,
  user,
}: SoundsDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const [selectedGenre, setSelectedGenre] = useState<string>('All Genres');
  const [activeSound, setActiveSound] = useState<CaribbeanSound | null>(() => {
    if (initialTrackId) {
      return CARIBBEAN_SOUNDS.find((s) => s.id === initialTrackId) || CARIBBEAN_SOUNDS[0];
    }
    return CARIBBEAN_SOUNDS[0];
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(48);

  const [savedFavorites, setSavedFavorites] = useState<Record<string, boolean>>({});
  const [copiedSoundId, setCopiedSoundId] = useState<string | null>(null);
  const [createWithSoundId, setCreateWithSoundId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredSounds = searchCaribbeanSounds({
    query: searchQuery,
    genre: selectedGenre,
  });

  useEffect(() => {
    if (activeSound && audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [activeSound, isPlaying]);

  function handlePlaySound(sound: CaribbeanSound) {
    if (activeSound?.id === sound.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      setActiveSound(sound);
      setIsPlaying(true);
    }
  }

  function handleTimeUpdate() {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 48);
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  }

  function toggleMute() {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  }

  function toggleFavorite(id: string) {
    setSavedFavorites((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  function handleShareSound(sound: CaribbeanSound) {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/sounds/${sound.id}` : '';
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(url);
      setCopiedSoundId(sound.id);
      setTimeout(() => setCopiedSoundId(null), 2000);
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  return (
    <div className="w-full space-y-8">
      {/* Hidden Audio Player Element */}
      {activeSound && (
        <audio
          ref={audioRef}
          src={activeSound.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Top Header */}
      <div className="surface-header rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-rose-500/30 shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white flex items-center gap-3">
            <Music className="w-7 h-7 sm:w-8 sm:h-8 text-rose-500" /> Caribbean Sounds &amp; Rhythm Stems
          </h1>
          <p className="text-xs sm:text-sm text-brand-sandstone/80 mt-1 leading-relaxed">
            Official stems, soca riddims, dancehall beats, and regional music for short videos and remixes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/reels"
            className="bg-white/10 hover:bg-white/15 border border-white/20 hover:text-white text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors min-h-[44px]"
          >
            ← Back to Reels
          </Link>
          <button
            onClick={() => setCreateWithSoundId(activeSound?.id || null)}
            className="bg-rose-500 hover:brightness-110 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 cursor-pointer min-h-[44px]"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Create with Current Sound
          </button>
        </div>
      </div>

      {/* Active Featured Audio Deck */}
      {activeSound && (
        <div className="surface-card rounded-3xl p-6 sm:p-8 border border-rose-500/40 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-6 z-10 relative">
            {/* Spinning Vinyl Visual */}
            <div
              onClick={() => handlePlaySound(activeSound)}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-950 border border-rose-500/40 flex items-center justify-center flex-shrink-0 cursor-pointer shadow-xl group relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-t ${activeSound.coverGradient}`} />
              <Disc
                className={`w-14 h-14 text-rose-400 z-10 transition-transform ${
                  isPlaying ? 'animate-spin' : 'group-hover:scale-110'
                }`}
                style={{ animationDuration: '4s' }}
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-white fill-current" />
                ) : (
                  <Play className="w-8 h-8 text-white fill-current translate-x-0.5" />
                )}
              </div>
            </div>

            {/* Sound Metadata & Player Controls */}
            <div className="flex-1 min-w-0 space-y-3 text-center md:text-left w-full">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">
                  {activeSound.genre}
                </span>
                <span className="text-xs text-brand-sandstone/80 font-bold">
                  {activeSound.flag} {activeSound.countryName}
                </span>
                <span className="text-xs text-brand-goldenHour font-black">
                  {activeSound.usageCount > 0 ? `🔥 ${activeSound.usageCountFormatted} Reels` : 'Official Sound Stem'}
                </span>
              </div>

              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white">{activeSound.title}</h2>
                <p className="text-xs sm:text-sm text-brand-sandstone/90 font-bold mt-0.5">
                  {activeSound.artist} · @{activeSound.artistHandle}
                </p>
                {activeSound.sampleLyrics && (
                  <p className="text-xs text-brand-sandstone/70 italic mt-1 font-serif">
                    “{activeSound.sampleLyrics}”
                  </p>
                )}
              </div>

              {/* Progress Slider & Time */}
              <div className="space-y-1.5 pt-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 48}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full accent-rose-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex items-center justify-between text-xs text-brand-sandstone/60">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-row md:flex-col items-center gap-3 w-full md:w-auto justify-center">
              <button
                onClick={() => setCreateWithSoundId(activeSound.id)}
                className="flex-1 md:flex-initial bg-rose-500 hover:brightness-110 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer min-h-[44px]"
              >
                <Sparkles className="w-4 h-4" /> Use This Sound
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Mute / Unmute"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </button>
                <button
                  onClick={() => toggleFavorite(activeSound.id)}
                  className={`p-3 rounded-xl border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                    savedFavorites[activeSound.id]
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                      : 'bg-white/5 border-white/10 text-brand-sandstone/80 hover:text-rose-400'
                  }`}
                  title="Save Sound"
                >
                  <Heart className={`w-4 h-4 ${savedFavorites[activeSound.id] ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => handleShareSound(activeSound)}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-brand-sandstone/80 hover:text-brand-sunriseCoral min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Share Sound"
                >
                  {copiedSoundId === activeSound.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Genre Chips Bar */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-brand-caribbeanSea absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Caribbean sounds, soca riddims, dancehall beats, artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-white/20 hover:border-brand-caribbeanSea/60 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-brand-sandstone/50 focus:outline-none focus:border-brand-caribbeanSea focus:ring-2 focus:ring-brand-caribbeanSea/30 transition-all shadow-inner"
          />
        </div>

        {/* Genre Pill Filter Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {SOUND_GENRES.map((genre) => {
            const isSelected = selectedGenre === genre;
            return (
              <button
                key={genre}
                type="button"
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer min-h-[38px] ${
                  isSelected
                    ? 'bg-rose-500 text-slate-950 font-black shadow-md shadow-rose-500/20'
                    : 'bg-white/5 border border-white/10 text-brand-sandstone/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sounds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSounds.map((sound) => {
          const isCurrentActive = activeSound?.id === sound.id;
          const isCurrentlyPlaying = isCurrentActive && isPlaying;
          return (
            <div
              key={sound.id}
              className={`surface-card rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between space-y-4 ${
                isCurrentActive
                  ? 'border-rose-500/60 ring-2 ring-rose-500/30 shadow-xl'
                  : 'surface-card-interactive'
              }`}
            >
              <div className="flex items-start gap-3.5">
                {/* Play Button Icon */}
                <button
                  onClick={() => handlePlaySound(sound)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 shadow-md min-h-[44px] min-w-[44px] ${
                    isCurrentlyPlaying
                      ? 'bg-rose-500 text-slate-950'
                      : 'bg-white/10 border border-white/15 text-white hover:text-rose-400 hover:bg-white/15'
                  }`}
                >
                  {isCurrentlyPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current translate-x-0.5" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span>{sound.flag}</span>
                    <span className="text-[10px] font-black uppercase text-rose-300 bg-rose-500/20 border border-rose-500/30 px-1.5 py-0.5 rounded">
                      {sound.genre}
                    </span>
                    {sound.isTrending && (
                      <span className="text-[10px] font-bold text-brand-goldenHour flex items-center gap-0.5">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-black text-white mt-1 truncate">{sound.title}</h4>
                  <p className="text-xs text-brand-sandstone/80 truncate mt-0.5">
                    {sound.artist} • {sound.durationFormatted}
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-xs font-bold text-brand-sandstone/70">
                  {sound.usageCount > 0 ? `${sound.usageCountFormatted} videos` : 'Audio Stem'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFavorite(sound.id)}
                    className={`p-2 rounded-xl border transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center ${
                      savedFavorites[sound.id]
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                        : 'bg-white/5 border-white/10 text-brand-sandstone/70 hover:text-rose-400'
                    }`}
                    title="Save"
                  >
                    <Heart className={`w-3.5 h-3.5 ${savedFavorites[sound.id] ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={() => handleShareSound(sound)}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-brand-sandstone/70 hover:text-brand-sunriseCoral min-h-[38px] min-w-[38px] flex items-center justify-center"
                    title="Share Link"
                  >
                    {copiedSoundId === sound.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => setCreateWithSoundId(sound.id)}
                    className="bg-rose-500 hover:brightness-110 text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer min-h-[38px]"
                  >
                    Use Sound
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Reel Modal with attached sound */}
      <CreateReelModal
        isOpen={Boolean(createWithSoundId)}
        initialSoundId={createWithSoundId || undefined}
        onClose={() => setCreateWithSoundId(null)}
        user={user}
      />
    </div>
  );
}
