'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Mic,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Rss,
  Headphones,
  Sparkles,
  Radio,
  Disc,
  Clock,
  Share2,
  Check,
  FileText,
  Bookmark,
  Layers,
  Moon,
  Lock,
  Plus,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import FollowPodcastButton from '../follow-podcast-button';
import CreatePodcastModal from './create-podcast-modal';
import { formatTimestamp, type Chapter } from '@caribbean/podcasts';

export interface PodcastShowItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  is_paid: boolean;
  follower_count: number;
  language: string | null;
  cover_path: string | null;
  creator_id: string;
  category?: string;
  episodesCount?: number;
  podcast_episodes?: Array<{ id: string }>;
  audioUrl?: string;
  latestEpisodeTitle?: string;
  chapters?: Chapter[];
  transcript?: string;
  profiles: { display_name: string; username: string } | null;
}

interface PodcastNetworkFeedProps {
  podcasts: PodcastShowItem[];
  user: {
    id: string;
    displayName: string;
    username?: string;
  } | null;
}

const PLAYBACK_SPEEDS = [0.75, 1.0, 1.25, 1.5, 2.0];
const SLEEP_TIMER_OPTIONS = [
  { label: 'Off', seconds: 0 },
  { label: '5 minutes', seconds: 300 },
  { label: '15 minutes', seconds: 900 },
  { label: '30 minutes', seconds: 1800 },
  { label: '45 minutes', seconds: 2700 },
  { label: 'End of Episode', seconds: -1 },
];

export default function PodcastNetworkFeed({ podcasts, user }: PodcastNetworkFeedProps) {
  const [activePodcast, setActivePodcast] = useState<PodcastShowItem | null>(() => podcasts[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(1800); // default 30m

  // Advanced features state
  const [showChaptersDrawer, setShowChaptersDrawer] = useState(false);
  const [showTranscriptDrawer, setShowTranscriptDrawer] = useState(false);
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [sleepTimerSeconds, setSleepTimerSeconds] = useState<number>(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Active episode chapters
  const activeChapters: Chapter[] = activePodcast?.chapters || [];

  // Active episode transcript
  const activeTranscript = activePodcast?.transcript || 'No automated transcript has been generated for this episode yet.';

  // Setup MediaSession API (Lock Screen & Bluetooth Car Controls)
  useEffect(() => {
    if ('mediaSession' in navigator && activePodcast) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: activePodcast.latestEpisodeTitle || activePodcast.title,
        artist: activePodcast.profiles?.display_name || 'Caribbean Creator',
        album: activePodcast.title,
        artwork: [
          {
            src: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=512&auto=format&fit=crop&q=80',
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        audioRef.current?.play().catch(() => {});
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        audioRef.current?.pause();
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        if (audioRef.current) {
          const next = Math.max(0, audioRef.current.currentTime - 15);
          audioRef.current.currentTime = next;
          setCurrentTime(next);
        }
      });
      navigator.mediaSession.setActionHandler('seekforward', () => {
        if (audioRef.current) {
          const next = Math.min(audioRef.current.duration || 1800, audioRef.current.currentTime + 15);
          audioRef.current.currentTime = next;
          setCurrentTime(next);
        }
      });
    }
  }, [activePodcast]);

  // Audio Playback Listener
  useEffect(() => {
    if (activePodcast && audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [activePodcast, isPlaying, playbackSpeed]);

  // Sleep Timer Tick
  useEffect(() => {
    if (sleepTimerSeconds > 0) {
      sleepTimerRef.current = setInterval(() => {
        setSleepTimerSeconds((prev) => {
          if (prev <= 1) {
            audioRef.current?.pause();
            setIsPlaying(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    }
    return () => {
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    };
  }, [sleepTimerSeconds]);

  function handleTogglePlay(podcast: PodcastShowItem) {
    if (activePodcast?.id === podcast.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      setActivePodcast(podcast);
      setIsPlaying(true);
      setCurrentTime(0);
    }
  }

  function handleTimeUpdate() {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 1800);
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  }

  function skip(seconds: number) {
    if (audioRef.current) {
      const next = Math.min(duration, Math.max(0, audioRef.current.currentTime + seconds));
      audioRef.current.currentTime = next;
      setCurrentTime(next);
    }
  }

  function jumpToTimestamp(seconds: number) {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
      if (!isPlaying) {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  }

  function cyclePlaybackSpeed() {
    const idx = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const next = PLAYBACK_SPEEDS[(idx + 1) % PLAYBACK_SPEEDS.length];
    setPlaybackSpeed(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = next;
    }
  }

  function toggleMute() {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  }

  function handleShare(id: string, slug: string) {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/podcasts?slug=${slug}&t=${Math.floor(currentTime)}` : '';
    if (navigator.share) {
      navigator.share({ title: activePodcast?.title || 'Caribbean Podcast', url }).catch(() => {});
    } else if (navigator.clipboard) {
      void navigator.clipboard.writeText(url);
      setCopiedShareId(id);
      setTimeout(() => setCopiedShareId(null), 2000);
    }
  }

  return (
    <div className="space-y-8 pb-32">
      {/* Hidden Audio Player */}
      {activePodcast && (
        <audio
          ref={audioRef}
          src={activePodcast.audioUrl || 'https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3'}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => {
            if (sleepTimerSeconds === -1) setSleepTimerSeconds(0);
            setIsPlaying(false);
          }}
        />
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-purple-400" /> Featured Shows &amp; Network Transcripts
          </h2>
          <p className="text-xs sm:text-sm text-brand-sandstone/70 mt-0.5">
            Podcasting 2.0 namespace, chapter navigation, and synchronized transcripts.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer min-h-[44px]"
        >
          <Plus className="w-4 h-4" /> Host Show / Publish Episode
        </button>
      </div>

      {/* Persistent Top Audio Deck */}
      {activePodcast && (
        <div className="surface-card border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Cover & Play Toggle */}
            <div
              onClick={() => handleTogglePlay(activePodcast)}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-4xl shadow-xl cursor-pointer flex-shrink-0 relative group overflow-hidden"
            >
              🎙️
              <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-white fill-current" />
                ) : (
                  <Play className="w-8 h-8 text-white fill-current translate-x-0.5" />
                )}
              </div>
            </div>

            {/* Metadata & Scrubber */}
            <div className="flex-1 min-w-0 space-y-2 text-center md:text-left w-full">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                  NOW PLAYING
                </span>
                <span className="text-xs text-brand-sandstone/80 font-bold">
                  {activePodcast.category ?? 'Caribbean Podcast'}
                </span>
                {activePodcast.is_paid && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-goldenHour/20 text-amber-300 border border-brand-goldenHour/40 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Member Only
                  </span>
                )}
                {sleepTimerSeconds > 0 && (
                  <span className="text-[10px] font-bold text-indigo-300 flex items-center gap-1 bg-indigo-500/15 px-2.5 py-0.5 rounded-full">
                    <Moon className="w-3 h-3" /> Sleep in {Math.ceil(sleepTimerSeconds / 60)}m
                  </span>
                )}
              </div>

              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white truncate">{activePodcast.title}</h3>
              <p className="text-xs sm:text-sm text-brand-sandstone/85 font-medium">
                {activePodcast.latestEpisodeTitle || 'Latest Episode'} · Hosted by{' '}
                <strong className="text-white font-black">{activePodcast.profiles?.display_name ?? 'Creator'}</strong>
              </p>

              {/* Scrubber & Time */}
              <div className="space-y-1 pt-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 1800}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full accent-purple-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex items-center justify-between text-xs text-brand-sandstone/60">
                  <span>{formatTimestamp(Math.floor(currentTime))}</span>
                  <span>-{formatTimestamp(Math.floor(Math.max(0, duration - currentTime)))}</span>
                </div>
              </div>
            </div>

            {/* Deck Controls */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                {/* Skip -15s */}
                <button
                  type="button"
                  onClick={() => skip(-15)}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Rewind 15 seconds"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Main Play/Pause */}
                <button
                  type="button"
                  onClick={() => handleTogglePlay(activePodcast)}
                  className="p-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-0.5" />}
                </button>

                {/* Skip +15s */}
                <button
                  type="button"
                  onClick={() => skip(15)}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Skip forward 15 seconds"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              {/* Quick speed & mute */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cyclePlaybackSpeed}
                  className="text-xs font-black px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-purple-300 hover:bg-white/10 min-h-[36px]"
                >
                  {playbackSpeed}x
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              </div>
            </div>
          </div>

          {/* Drawer Expand Toggles */}
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowChaptersDrawer(!showChaptersDrawer);
                  setShowTranscriptDrawer(false);
                }}
                className={`px-3.5 py-2 rounded-xl border font-bold flex items-center gap-1.5 transition-colors min-h-[38px] ${
                  showChaptersDrawer
                    ? 'bg-purple-600/30 text-purple-200 border-purple-500/50'
                    : 'bg-white/5 border-white/10 text-brand-sandstone/80 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Chapters ({activeChapters.length})</span>
                {showChaptersDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowTranscriptDrawer(!showTranscriptDrawer);
                  setShowChaptersDrawer(false);
                }}
                className={`px-3.5 py-2 rounded-xl border font-bold flex items-center gap-1.5 transition-colors min-h-[38px] ${
                  showTranscriptDrawer
                    ? 'bg-purple-600/30 text-purple-200 border-purple-500/50'
                    : 'bg-white/5 border-white/10 text-brand-sandstone/80 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-brand-caribbeanSea" />
                <span>AI Transcript</span>
                {showTranscriptDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Sleep Timer & Share */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[11px] text-brand-sandstone/60">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <select
                  value={sleepTimerSeconds}
                  onChange={(e) => setSleepTimerSeconds(parseInt(e.target.value, 10))}
                  className="bg-slate-950/80 border border-white/20 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 min-h-[38px]"
                >
                  {SLEEP_TIMER_OPTIONS.map((opt) => (
                    <option key={opt.label} value={opt.seconds}>
                      Timer: {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleShare(activePodcast.id, activePodcast.slug)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 min-h-[38px] min-w-[38px] flex items-center justify-center"
                title="Share Episode"
              >
                {copiedShareId === activePodcast.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Collapsible Chapters Drawer */}
          {showChaptersDrawer && (
            <div className="p-4 surface-card border border-white/10 rounded-2xl space-y-2 animate-fadeIn">
              <h4 className="text-xs font-black uppercase tracking-wider text-purple-400">
                Episode Navigation Chapters
              </h4>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {activeChapters.map((chap, idx) => (
                  <div
                    key={idx}
                    onClick={() => jumpToTimestamp(chap.startSeconds)}
                    className="p-2.5 rounded-xl hover:bg-purple-600/20 transition-all flex items-center justify-between text-xs cursor-pointer group"
                  >
                    <span className="text-white font-bold group-hover:text-purple-300">
                      {idx + 1}. {chap.title}
                    </span>
                    <span className="text-brand-sandstone/70 font-mono text-xs bg-slate-900 px-2 py-0.5 rounded-lg border border-white/10">
                      {formatTimestamp(chap.startSeconds)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Collapsible Synchronized Transcript Drawer */}
          {showTranscriptDrawer && (
            <div className="p-4 surface-card border border-white/10 rounded-2xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-400">
                  Episode Audio Transcript
                </h4>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-brand-caribbeanSea absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search words in transcript…"
                    value={transcriptSearch}
                    onChange={(e) => setTranscriptSearch(e.target.value)}
                    className="bg-slate-950/80 border border-white/20 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-brand-sandstone/50 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950/90 rounded-xl max-h-48 overflow-y-auto text-xs text-brand-sandstone/90 leading-relaxed font-serif whitespace-pre-line border border-white/5">
                {transcriptSearch
                  ? activeTranscript
                      .split('\n')
                      .filter((line) => line.toLowerCase().includes(transcriptSearch.toLowerCase()))
                      .join('\n') || 'No matching lines found.'
                  : activeTranscript}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shows Grid */}
      {podcasts.length === 0 ? (
        <div className="surface-card rounded-3xl p-12 text-center max-w-2xl mx-auto space-y-4 border border-white/10 my-8">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
            <Mic className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-white">No Podcasts Available</h3>
          <p className="text-xs sm:text-sm text-brand-sandstone/80 leading-relaxed max-w-md mx-auto">
            There are currently no podcasts in this category. Be the first creator to launch a Caribbean show with automated transcripts and iTunes RSS feeds!
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-opacity shadow-lg shadow-purple-600/30 cursor-pointer min-h-[44px]"
          >
            <Plus className="w-4 h-4" /> Host First Show
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {podcasts.map((podcast) => {
            const isCurrent = activePodcast?.id === podcast.id;
            const isCurrentPlaying = isCurrent && isPlaying;
            const epCount = podcast.episodesCount ?? podcast.podcast_episodes?.length ?? 0;

            return (
              <article
                key={podcast.id}
                className={`surface-card rounded-3xl p-6 space-y-4 flex flex-col justify-between transition-all shadow-xl group border ${
                  isCurrent
                    ? 'border-purple-500/80 ring-2 ring-purple-500/30'
                    : 'surface-card-interactive'
                }`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/20">
                      🎙️
                    </div>
                    <div className="flex items-center gap-2">
                      {podcast.is_paid && (
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-brand-goldenHour/20 text-amber-300 border border-brand-goldenHour/40 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Member Only
                        </span>
                      )}
                      <a
                        href={`/api/v1/podcasts/${podcast.id}/rss`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="iTunes RSS 2.0 Feed"
                        className="text-[10px] font-bold px-3 py-1 rounded-full bg-white/5 text-purple-300 border border-purple-500/30 flex items-center gap-1 hover:bg-purple-500/20 transition-colors min-h-[30px]"
                      >
                        <Rss className="w-3 h-3" /> iTunes RSS
                      </a>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block mb-1">
                      {podcast.category ?? 'Culture & Society'}
                    </span>
                    <h3 className="font-black text-base sm:text-lg text-white group-hover:text-purple-300 transition-colors leading-snug">
                      {podcast.title}
                    </h3>
                    <p className="text-xs text-brand-sandstone/70 mt-1">
                      Hosted by <strong className="text-white font-bold">{podcast.profiles?.display_name ?? 'Creator'}</strong> • {epCount} Episode{epCount === 1 ? '' : 's'}
                    </p>
                  </div>

                  {podcast.description && (
                    <p className="text-xs sm:text-sm text-brand-sandstone/85 leading-relaxed line-clamp-2">
                      {podcast.description}
                    </p>
                  )}
                </div>

                {/* Audio Wave Preview Bar & Follow Button */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-sandstone/70">
                    <Headphones className="w-4 h-4 text-purple-400" />
                    <span>{podcast.follower_count.toLocaleString()} Subscribers</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePlay(podcast)}
                      className={`p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-black cursor-pointer min-h-[38px] ${
                        isCurrentPlaying
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                          : 'bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border-purple-500/40'
                      }`}
                    >
                      {isCurrentPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>{isCurrentPlaying ? 'Pause' : 'Play Latest'}</span>
                    </button>

                    <FollowPodcastButton
                      podcastId={podcast.id}
                      isFollowing={false}
                      isAuthenticated={Boolean(user)}
                    />

                    <button
                      onClick={() => handleShare(podcast.id, podcast.slug)}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 min-h-[38px] min-w-[38px] flex items-center justify-center"
                      title="Share Podcast"
                    >
                      {copiedShareId === podcast.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Creator Show Publisher Modal */}
      <CreatePodcastModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        user={user}
        existingPodcasts={podcasts.map((p) => ({ id: p.id, title: p.title }))}
      />
    </div>
  );
}
