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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-brand-sandstone flex items-center gap-3">
            <Music className="w-8 h-8 text-rose-500" /> Caribbean Sounds &amp; Rhythm Stems
          </h1>
          <p className="text-xs md:text-sm text-brand-sandstone/60 mt-1">
            Official stems, soca riddims, dancehall beats, and regional music for short videos and remixes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/reels"
            className="bg-brand-dusk border border-slate-800 hover:text-white text-brand-sandstone/80 font-bold px-4 py-2 rounded-2xl text-xs flex items-center gap-2 transition-colors"
          >
            ← Back to Reels
          </Link>
          <button
            onClick={() => setCreateWithSoundId(activeSound?.id || null)}
            className="bg-gradient-to-r from-rose-500 to-brand-goldenHour text-slate-950 font-black px-4 py-2 rounded-2xl text-xs flex items-center gap-2 shadow-md shadow-rose-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create with Current Sound
          </button>
        </div>
      </div>

      {/* Active Featured Audio Deck */}
      {activeSound && (
        <div className="bg-gradient-to-br from-slate-900 via-[#0D1322] to-rose-950/40 border border-rose-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-6 z-10 relative">
            {/* Spinning Vinyl Visual */}
            <div
              onClick={() => handlePlaySound(activeSound)}
              className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-brand-twilight border border-rose-500/40 flex items-center justify-center flex-shrink-0 cursor-pointer shadow-xl group relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-t ${activeSound.coverGradient}`} />
              <Disc
                className={`w-14 h-14 text-rose-400 z-10 transition-transform ${
                  isPlaying ? 'animate-spin' : 'group-hover:scale-110'
                }`}
                style={{ animationDuration: '4s' }}
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-white fill-current" />
                ) : (
                  <Play className="w-8 h-8 text-white fill-current translate-x-0.5" />
                )}
              </div>
            </div>

            {/* Sound Metadata & Player Controls */}
            <div className="flex-1 min-w-0 space-y-3 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 uppercase">
                  {activeSound.genre}
                </span>
                <span className="text-xs text-brand-sandstone/60 font-semibold">
                  {activeSound.flag} {activeSound.countryName}
                </span>
                <span className="text-xs text-brand-goldenHour font-bold">
                  🔥 {activeSound.usageCountFormatted} Reels
                </span>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-black text-brand-sandstone">{activeSound.title}</h2>
                <p className="text-xs text-slate-300 font-semibold mt-0.5">
                  {activeSound.artist} · @{activeSound.artistHandle}
                </p>
                {activeSound.sampleLyrics && (
                  <p className="text-[11px] text-brand-sandstone/60 italic mt-1 font-serif">
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
                  className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex items-center justify-between text-[11px] text-brand-sandstone/40">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-row md:flex-col items-center gap-3 w-full md:w-auto justify-center">
              <button
                onClick={() => setCreateWithSoundId(activeSound.id)}
                className="flex-1 md:flex-initial bg-rose-500 hover:bg-rose-400 text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> Use This Sound
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-2.5 rounded-xl bg-brand-twilight border border-slate-800 text-slate-300 hover:text-white"
                  title="Mute / Unmute"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </button>
                <button
                  onClick={() => toggleFavorite(activeSound.id)}
                  className={`p-2.5 rounded-xl border transition-colors ${
                    savedFavorites[activeSound.id]
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                      : 'bg-brand-twilight border-slate-800 text-slate-300 hover:text-rose-400'
                  }`}
                  title="Save Sound"
                >
                  <Heart className={`w-4 h-4 ${savedFavorites[activeSound.id] ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => handleShareSound(activeSound)}
                  className="p-2.5 rounded-xl bg-brand-twilight border border-slate-800 text-slate-300 hover:text-brand-sunriseCoral"
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
          <Search className="w-4 h-4 text-brand-sandstone/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Caribbean sounds, soca riddims, dancehall beats, artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-dusk border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs text-brand-sandstone focus:outline-none focus:border-rose-500 transition-colors shadow-inner"
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/20'
                    : 'bg-brand-dusk border border-slate-800 text-brand-sandstone/60 hover:text-slate-200 hover:border-slate-700'
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
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                isCurrentActive
                  ? 'bg-brand-dusk/90 border-rose-500/50 shadow-xl'
                  : 'bg-brand-dusk/60 hover:bg-brand-dusk/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3.5">
                {/* Play Button Icon */}
                <button
                  onClick={() => handlePlaySound(sound)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 shadow-md ${
                    isCurrentlyPlaying
                      ? 'bg-rose-500 text-slate-950'
                      : 'bg-brand-twilight border border-slate-700 text-slate-200 hover:text-rose-400'
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
                    <span className="text-[10px] font-black uppercase text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                      {sound.genre}
                    </span>
                    {sound.isTrending && (
                      <span className="text-[10px] font-bold text-brand-goldenHour flex items-center gap-0.5">
                        <Flame className="w-3 h-3 fill-current" />
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-black text-brand-sandstone mt-1 truncate">{sound.title}</h4>
                  <p className="text-[11px] text-brand-sandstone/60 truncate">
                    {sound.artist} • {sound.durationFormatted}
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold text-slate-400">
                  {sound.usageCountFormatted} videos
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFavorite(sound.id)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      savedFavorites[sound.id]
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                        : 'bg-brand-twilight border-slate-800 text-slate-400 hover:text-rose-400'
                    }`}
                    title="Save"
                  >
                    <Heart className={`w-3.5 h-3.5 ${savedFavorites[sound.id] ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={() => handleShareSound(sound)}
                    className="p-1.5 rounded-lg bg-brand-twilight border border-slate-800 text-slate-400 hover:text-brand-sunriseCoral"
                    title="Share Link"
                  >
                    {copiedSoundId === sound.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => setCreateWithSoundId(sound.id)}
                    className="bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-slate-950 border border-rose-500/40 font-black px-3 py-1 rounded-xl text-[11px] transition-all cursor-pointer"
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
