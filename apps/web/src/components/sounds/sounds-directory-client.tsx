'use client';

import React, { useState, useRef, useEffect, useTransition } from 'react';
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
  Check,
  ShieldCheck,
  ExternalLink,
  Upload,
  X,
  Loader2,
  Radio,
  FileAudio,
} from 'lucide-react';
import {
  CARIBBEAN_SOUNDS,
  SOUND_GENRES,
  type CaribbeanSound,
} from '../../lib/constants/caribbean-sounds';
import {
  fetchSoundsAction,
  uploadSoundAction,
} from '../../lib/sounds/actions';
import AudioManager from '../../lib/media/audio-manager';
import CaribbeanSoundSynthesizer from '../../lib/media/sound-synthesizer';
import CreateReelModal from '../reels/create-reel-modal';

interface SoundsDirectoryClientProps {
  initialSounds?: CaribbeanSound[];
  initialTrackId?: string;
  initialQuery?: string;
  user: {
    id: string;
    displayName: string;
    username?: string;
  } | null;
}

type TabType = 'all' | 'trending' | 'verified' | 'my_uploads';

const CARIBBEAN_TERRITORIES = [
  { iso: 'TTO', name: 'Trinidad & Tobago', flag: '🇹🇹' },
  { iso: 'JAM', name: 'Jamaica', flag: '🇯🇲' },
  { iso: 'BRB', name: 'Barbados', flag: '🇧🇧' },
  { iso: 'HTI', name: 'Haiti', flag: '🇭🇹' },
  { iso: 'DMA', name: 'Dominica', flag: '🇩🇲' },
  { iso: 'LCA', name: 'Saint Lucia', flag: '🇱🇨' },
  { iso: 'GRD', name: 'Grenada', flag: '🇬🇩' },
  { iso: 'VCT', name: 'St. Vincent & Grenadines', flag: '🇻🇨' },
  { iso: 'ATG', name: 'Antigua & Barbuda', flag: '🇦🇬' },
  { iso: 'KNA', name: 'St. Kitts & Nevis', flag: '🇰🇳' },
  { iso: 'BHS', name: 'Bahamas', flag: '🇧🇸' },
  { iso: 'GUY', name: 'Guyana', flag: '🇬🇾' },
  { iso: 'SUR', name: 'Suriname', flag: '🇸🇷' },
  { iso: 'BLZ', name: 'Belize', flag: '🇧🇿' },
];

export default function SoundsDirectoryClient({
  initialSounds,
  initialTrackId,
  initialQuery,
  user,
}: SoundsDirectoryClientProps) {
  const [sounds, setSounds] = useState<CaribbeanSound[]>(() => {
    if (initialSounds && initialSounds.length > 0) return initialSounds;
    return CARIBBEAN_SOUNDS;
  });

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const [selectedGenre, setSelectedGenre] = useState<string>('All Genres');

  const [activeSound, setActiveSound] = useState<CaribbeanSound | null>(() => {
    const list = initialSounds && initialSounds.length > 0 ? initialSounds : CARIBBEAN_SOUNDS;
    if (initialTrackId) {
      return list.find((s) => s.id === initialTrackId) || list[0] || null;
    }
    return list[0] || null;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(48);

  const [savedFavorites, setSavedFavorites] = useState<Record<string, boolean>>({});
  const [copiedSoundId, setCopiedSoundId] = useState<string | null>(null);
  const [createWithSoundId, setCreateWithSoundId] = useState<string | null>(null);

  // Upload sound stem modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadPending, startUploadTransition] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);

  // Register with AudioManager singleton for platform-wide single-audio master
  useEffect(() => {
    const audioMgr = AudioManager.getInstance();
    const unregister = audioMgr.register('sounds-directory-player', {
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
      audioMgr.releaseAudio('sounds-directory-player');
    };
  }, []);

  // Filter sounds
  const filteredSounds = sounds.filter((s) => {
    if (activeTab === 'trending' && s.usageCount <= 0) {
      return false;
    }
    if (activeTab === 'verified' && s.licensingStatus !== 'royalty_free' && s.licensingStatus !== 'public_domain') {
      return false;
    }
    if (activeTab === 'my_uploads') {
      if (!user || (s.artistHandle !== user.username && s.artist !== user.displayName)) {
        return false;
      }
    }
    if (selectedGenre !== 'All Genres' && s.genre !== selectedGenre) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchArtist = s.artist.toLowerCase().includes(q);
      const matchGenre = s.genre.toLowerCase().includes(q);
      const matchCountry = s.countryName.toLowerCase().includes(q);
      if (!matchTitle && !matchArtist && !matchGenre && !matchCountry) {
        return false;
      }
    }
    return true;
  });

  useEffect(() => {
    const unregister = AudioManager.getInstance().register('sounds-directory-player', {
      onPause: () => {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
        }
        CaribbeanSoundSynthesizer.getInstance().stop();
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
      CaribbeanSoundSynthesizer.getInstance().stop();
    };
  }, []);

  useEffect(() => {
    if (!activeSound || !audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    setPlaybackError(null);
    setIsBuffering(true);
    AudioManager.getInstance().claimAudio('sounds-directory-player', 'sound');

    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
        setIsBuffering(false);
      })
      .catch((err) => {
        setIsBuffering(false);
        if (err.name !== 'AbortError') {
          const played = CaribbeanSoundSynthesizer.getInstance().playRhythm(activeSound.genre);
          if (played) {
            setIsPlaying(true);
            setPlaybackError(null);
          } else {
            console.warn('[SoundsDirectory] Playback failed:', err);
            setIsPlaying(false);
            setPlaybackError(`Could not play "${activeSound.title}". Audio stream error.`);
            AudioManager.getInstance().releaseAudio('sounds-directory-player');
          }
        }
      });
  }, [activeSound]);

  async function handlePlaySound(sound: CaribbeanSound) {
    setPlaybackError(null);

    if (activeSound?.id === sound.id) {
      if (isPlaying) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        CaribbeanSoundSynthesizer.getInstance().stop();
        setIsPlaying(false);
        AudioManager.getInstance().releaseAudio('sounds-directory-player');
      } else {
        setIsBuffering(true);
        AudioManager.getInstance().claimAudio('sounds-directory-player', 'sound');
        try {
          if (audioRef.current) {
            await audioRef.current.play();
            setIsPlaying(true);
          }
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            const played = CaribbeanSoundSynthesizer.getInstance().playRhythm(sound.genre);
            if (played) {
              setIsPlaying(true);
              setPlaybackError(null);
            } else {
              setIsPlaying(false);
              AudioManager.getInstance().releaseAudio('sounds-directory-player');
              setPlaybackError(`Unable to play "${sound.title}". Please check audio connection.`);
            }
          }
        } finally {
          setIsBuffering(false);
        }
      }
    } else {
      CaribbeanSoundSynthesizer.getInstance().stop();
      setActiveSound(sound);
      setIsPlaying(false);
      setIsBuffering(true);
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

  function handleUploadSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) {
      setUploadError('Please sign in to upload rhythm stems.');
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);

    if (!uploadFile) {
      setUploadError('Please choose an audio file (.mp3, .wav, or .aac).');
      return;
    }

    setUploadError(null);
    startUploadTransition(async () => {
      const res = await uploadSoundAction(formData);
      if (!res.success || !res.data) {
        setUploadError(res.error || 'Failed to upload sound stem.');
      } else {
        setUploadSuccess(true);
        setSounds((prev) => [res.data!, ...prev]);
        setActiveSound(res.data);
        setTimeout(() => {
          setIsUploadOpen(false);
          setUploadSuccess(false);
          setUploadFile(null);
        }, 1200);
      }
    });
  }

  const getLicensingBadge = (status: CaribbeanSound['licensingStatus']) => {
    switch (status) {
      case 'royalty_free':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Royalty-Free
          </span>
        );
      case 'public_domain':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Public Domain
          </span>
        );
      case 'creative_commons':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> CC-BY-4.0
          </span>
        );
      case 'original_creator':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Original Stem
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Licensed
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Audio Player Element with complete media events */}
      {activeSound && (
        <audio
          ref={audioRef}
          src={activeSound.audioUrl}
          preload="metadata"
          onPlay={() => {
            setIsPlaying(true);
            setPlaybackError(null);
            AudioManager.getInstance().claimAudio('sounds-directory-player', 'sound');
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
              setDuration(audioRef.current.duration || activeSound.durationSeconds || 15);
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setIsBuffering(false);
            AudioManager.getInstance().releaseAudio('sounds-directory-player');
          }}
          onError={(e) => {
            const mediaErr = (e.target as HTMLAudioElement).error;
            console.error('[SoundsDirectory] HTMLAudioElement error:', mediaErr);
            setIsPlaying(false);
            setIsBuffering(false);
            AudioManager.getInstance().releaseAudio('sounds-directory-player');
            setPlaybackError(`Audio stream failed to load (${mediaErr?.message || 'Network / format error'}).`);
          }}
        />
      )}

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

      {/* Top Header */}
      <div className="surface-header rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-rose-500/30 shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white flex items-center gap-3">
            <Music className="w-7 h-7 sm:w-8 sm:h-8 text-rose-500" /> Caribbean Sounds &amp; Rhythm Stems
          </h1>
          <p className="text-xs sm:text-sm text-brand-sandstone/80 mt-1 leading-relaxed">
            Official stems, soca riddims, dancehall beats, and verified music for short videos and remixes with legal licensing metadata.
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
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors min-h-[44px] cursor-pointer"
          >
            <Upload className="w-4 h-4 text-rose-400" /> Upload Stem
          </button>
          <button
            type="button"
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
                  isPlaying && !isBuffering ? 'animate-spin' : 'group-hover:scale-110'
                }`}
                style={{ animationDuration: '4s' }}
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                {isBuffering ? (
                  <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
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
                {activeSound.bpm && (
                  <span className="text-xs text-brand-sandstone/60 font-mono">
                    {activeSound.bpm} BPM
                  </span>
                )}
                {getLicensingBadge(activeSound.licensingStatus)}
                <span className="text-xs text-brand-goldenHour font-black">
                  {activeSound.usageCount > 0 ? `🔥 ${activeSound.usageCountFormatted} Reels` : 'Official Sound Stem'}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white">{activeSound.title}</h2>
                  <Link
                    href={`/sounds/${activeSound.id}`}
                    className="text-brand-sandstone/60 hover:text-white transition-colors"
                    title="View Sound Page & Associated Reels"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
                <p className="text-xs sm:text-sm text-brand-sandstone/90 font-bold mt-0.5">
                  {activeSound.artist} {activeSound.artistHandle && `· @${activeSound.artistHandle}`}
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
                type="button"
                onClick={() => setCreateWithSoundId(activeSound.id)}
                className="flex-1 md:flex-initial bg-rose-500 hover:brightness-110 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer min-h-[44px]"
              >
                <Sparkles className="w-4 h-4" /> Use This Sound
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
                  onClick={() => toggleFavorite(activeSound.id)}
                  className={`p-3 rounded-xl border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ${
                    savedFavorites[activeSound.id]
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                      : 'bg-white/5 border-white/10 text-brand-sandstone/80 hover:text-rose-400'
                  }`}
                  title="Save Sound"
                >
                  <Heart className={`w-4 h-4 ${savedFavorites[activeSound.id] ? 'fill-current' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => handleShareSound(activeSound)}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-brand-sandstone/80 hover:text-brand-sunriseCoral min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  title="Share Sound"
                >
                  {copiedSoundId === activeSound.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                </button>
                <Link
                  href={`/sounds/${activeSound.id}`}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-brand-sandstone/80 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Full Sound Dossier"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discovery Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] flex items-center gap-1.5 ${
            activeTab === 'all'
              ? 'bg-rose-500 text-slate-950 font-black shadow-md shadow-rose-500/20'
              : 'text-brand-sandstone/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <Music className="w-3.5 h-3.5" /> All Sounds ({sounds.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('trending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] flex items-center gap-1.5 ${
            activeTab === 'trending'
              ? 'bg-rose-500 text-slate-950 font-black shadow-md shadow-rose-500/20'
              : 'text-brand-sandstone/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <Flame className="w-3.5 h-3.5" /> Trending Charts
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('verified')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] flex items-center gap-1.5 ${
            activeTab === 'verified'
              ? 'bg-rose-500 text-slate-950 font-black shadow-md shadow-rose-500/20'
              : 'text-brand-sandstone/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Verified Royalty-Free Stems
        </button>
        {user && (
          <button
            type="button"
            onClick={() => setActiveTab('my_uploads')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] flex items-center gap-1.5 ${
              activeTab === 'my_uploads'
                ? 'bg-rose-500 text-slate-950 font-black shadow-md shadow-rose-500/20'
                : 'text-brand-sandstone/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> My Uploads
          </button>
        )}
      </div>

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

      {/* Sounds Grid or Empty States */}
      {filteredSounds.length === 0 ? (
        <div className="surface-card rounded-3xl p-12 text-center border border-white/10 max-w-xl mx-auto space-y-4 my-8">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
            {activeTab === 'trending' ? <Flame className="w-8 h-8" /> : <Music className="w-8 h-8" />}
          </div>

          <div>
            <h3 className="text-lg font-black text-white">
              {activeTab === 'trending'
                ? 'No Trending Sounds Yet'
                : activeTab === 'my_uploads'
                ? 'No Uploaded Stems Yet'
                : 'No Sounds Found'}
            </h3>
            <p className="text-xs text-brand-sandstone/70 max-w-md mx-auto mt-1 leading-relaxed">
              {activeTab === 'trending'
                ? 'Sounds appear in trending charts once they are used in community Reels and Shorts. Be the first to start a dance challenge or remix!'
                : activeTab === 'my_uploads'
                ? 'You have not uploaded any rhythm stems or beats yet. Share your Caribbean sound with regional creators.'
                : `We couldn't find any sounds matching your filters. Caribbean Sounds will grow as creators and artists contribute.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {activeTab !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('all');
                  setSelectedGenre('All Genres');
                  setSearchQuery('');
                }}
                className="bg-white/10 hover:bg-white/15 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer min-h-[40px]"
              >
                Clear Filters
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="bg-rose-500 hover:brightness-110 text-slate-950 font-black px-5 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer min-h-[40px]"
            >
              <Upload className="w-4 h-4" /> Upload Sound Stem
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-5 gap-4">
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
                    type="button"
                    onClick={() => handlePlaySound(sound)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 shadow-md min-h-[44px] min-w-[44px] cursor-pointer ${
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
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span>{sound.flag}</span>
                      <span className="text-[10px] font-black uppercase text-rose-300 bg-rose-500/20 border border-rose-500/30 px-1.5 py-0.5 rounded">
                        {sound.genre}
                      </span>
                      {sound.bpm && (
                        <span className="text-[10px] text-brand-sandstone/60 font-mono">
                          {sound.bpm} BPM
                        </span>
                      )}
                      {getLicensingBadge(sound.licensingStatus)}
                      {sound.isTrending && (
                        <span className="text-[10px] font-bold text-brand-goldenHour flex items-center gap-0.5">
                          <Flame className="w-3.5 h-3.5 fill-current" />
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/sounds/${sound.id}`}
                      className="text-sm font-black text-white mt-1 truncate block hover:text-rose-400 transition-colors"
                    >
                      {sound.title}
                    </Link>
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
                      type="button"
                      onClick={() => toggleFavorite(sound.id)}
                      className={`p-2 rounded-xl border transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer ${
                        savedFavorites[sound.id]
                          ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                          : 'bg-white/5 border-white/10 text-brand-sandstone/70 hover:text-rose-400'
                      }`}
                      title="Save"
                    >
                      <Heart className={`w-3.5 h-3.5 ${savedFavorites[sound.id] ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareSound(sound)}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 text-brand-sandstone/70 hover:text-brand-sunriseCoral min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
                      title="Share Link"
                    >
                      {copiedSoundId === sound.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
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
      )}

      {/* Upload Sound Stem Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                  <FileAudio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Upload Rhythm Stem</h3>
                  <p className="text-xs text-brand-sandstone/70">Share your beats and riddims with Caribbean creators</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="text-brand-sandstone/60 hover:text-white p-2 rounded-lg hover:bg-white/10 min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-xs font-semibold">
                {uploadError}
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4" /> Stem successfully published to Caribbean Sounds!
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-sandstone mb-1">
                  Audio File (MP3, WAV, AAC — Max 25MB)
                </label>
                <input
                  type="file"
                  name="audioFile"
                  accept="audio/*"
                  required
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-brand-sandstone/80 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-rose-500 file:text-slate-950 hover:file:brightness-110 cursor-pointer bg-slate-950/60 p-2 rounded-xl border border-white/10"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-sandstone mb-1">Stem Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Iron Park Bouyon Bassline"
                  className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-brand-sandstone/40 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-brand-sandstone mb-1">Genre</label>
                  <select
                    name="genre"
                    defaultValue="Soca"
                    className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    {SOUND_GENRES.filter((g) => g !== 'All Genres').map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-sandstone mb-1">Tempo (BPM)</label>
                  <input
                    type="number"
                    name="bpm"
                    placeholder="120"
                    min={40}
                    max={260}
                    className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-brand-sandstone/40 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-brand-sandstone mb-1">Caribbean Country</label>
                  <select
                    name="countryIso"
                    defaultValue="TTO"
                    className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    {CARIBBEAN_TERRITORIES.map((t) => (
                      <option key={t.iso} value={t.iso}>
                        {t.flag} {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-sandstone mb-1">Licensing Status</label>
                  <select
                    name="licensingStatus"
                    defaultValue="original_creator"
                    className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="original_creator">Original Creator Stem</option>
                    <option value="royalty_free">Royalty-Free / Cleared</option>
                    <option value="creative_commons">Creative Commons (CC-BY-4.0)</option>
                    <option value="public_domain">Public Domain</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="commercialUse"
                  name="commercialUseAllowed"
                  value="true"
                  defaultChecked
                  className="rounded border-white/20 bg-slate-950 text-rose-500 focus:ring-rose-500"
                />
                <label htmlFor="commercialUse" className="text-xs text-brand-sandstone/90">
                  Allow commercial use in monetized creator reels
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs text-brand-sandstone hover:bg-white/5 cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadPending || uploadSuccess}
                  className="bg-rose-500 hover:brightness-110 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer min-h-[44px]"
                >
                  {uploadPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" /> Publish Stem
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
