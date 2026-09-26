'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Radio,
  Clock,
  Share2,
  Check,
  FileText,
  Layers,
  Moon,
  Lock,
  Plus,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Video,
  Maximize2,
  MessageSquare,
  Link2,
  Send,
} from 'lucide-react';
import FollowPodcastButton from '../follow-podcast-button';
import CreatePodcastModal from './create-podcast-modal';
import {
  formatTimestamp,
  type Chapter,
  type TimedLink,
  type TranscriptSegment,
} from '@caribbean/podcasts';
import { AudioManager } from '../../lib/media/audio-manager';
import {
  savePodcastProgressAction,
  getPodcastProgressAction,
  recordPodcastPlayAction,
  fetchEpisodeTimedLinksAction,
  fetchEpisodeTranscriptsAction,
  fetchPodcastCommentsAction,
  addPodcastCommentAction,
} from '../../lib/podcasts/actions';

export interface PodcastEpisodeItem {
  id: string;
  title: string;
  season_number?: number;
  episode_number?: number;
  duration_seconds: number;
  audio_path: string;
  video_path?: string | null;
  audioUrl?: string;
  videoUrl?: string | null;
  show_notes?: string | null;
  transcript?: string | null;
  chapters?: Chapter[];
  published_at: string | null;
  is_subscriber_only?: boolean;
}

export interface PodcastShowItem {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  description: string | null;
  is_paid: boolean;
  follower_count: number;
  language: string | null;
  cover_path: string | null;
  creator_id: string;
  category?: string;
  subcategory?: string | null;
  country?: string | null;
  island_territory?: string | null;
  episodesCount?: number;
  podcast_episodes?: PodcastEpisodeItem[];
  audioUrl?: string;
  videoUrl?: string | null;
  latestEpisodeTitle?: string;
  chapters?: Chapter[];
  transcript?: string;
  timedLinks?: TimedLink[];
  transcriptSegments?: TranscriptSegment[];
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

const PLAYBACK_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 3.0];
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
  const [activeEpisode, setActiveEpisode] = useState<PodcastEpisodeItem | null>(() => podcasts[0]?.podcast_episodes?.[0] || null);
  const [mediaMode, setMediaMode] = useState<'audio' | 'video'>('audio');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(1800);

  // Drawers
  const [showChaptersDrawer, setShowChaptersDrawer] = useState(false);
  const [showTranscriptDrawer, setShowTranscriptDrawer] = useState(false);
  const [showTimedLinksDrawer, setShowTimedLinksDrawer] = useState(false);
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);

  // Dynamic episode data
  const [timedLinks, setTimedLinks] = useState<TimedLink[]>([]);
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [sleepTimerSeconds, setSleepTimerSeconds] = useState<number>(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeEpisodeId = activeEpisode?.id || activePodcast?.podcast_episodes?.[0]?.id;
  const hasVideo = Boolean(activeEpisode?.videoUrl || activePodcast?.videoUrl);

  // Sync active episode when active podcast changes
  useEffect(() => {
    if (activePodcast?.podcast_episodes?.[0]) {
      setActiveEpisode(activePodcast.podcast_episodes[0]);
    }
  }, [activePodcast]);

  // Load timed links and structured transcripts when episode changes
  useEffect(() => {
    if (!activeEpisodeId) return;
    let isMounted = true;

    void fetchEpisodeTimedLinksAction(activeEpisodeId).then((links) => {
      if (isMounted) setTimedLinks(links);
    });

    void fetchEpisodeTranscriptsAction(activeEpisodeId).then((segs) => {
      if (isMounted) setTranscriptSegments(segs);
    });

    void fetchPodcastCommentsAction(activeEpisodeId).then((comms) => {
      if (isMounted) setComments(comms);
    });

    return () => {
      isMounted = false;
    };
  }, [activeEpisodeId]);

  // Register with global AudioManager
  useEffect(() => {
    AudioManager.register('tukubi-podcast-network-deck', {
      kind: 'podcast',
      onPause: () => {
        audioRef.current?.pause();
        videoRef.current?.pause();
        setIsPlaying(false);
      },
      onMute: () => {
        if (audioRef.current) audioRef.current.muted = true;
        if (videoRef.current) videoRef.current.muted = true;
        setIsMuted(true);
      },
    });
    return () => {
      AudioManager.unregister('tukubi-podcast-network-deck');
    };
  }, []);

  // MediaSession API Integration (Lock Screen, Car Display, Headphones)
  useEffect(() => {
    if ('mediaSession' in navigator && activePodcast) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: activeEpisode?.title || activePodcast.latestEpisodeTitle || activePodcast.title,
        artist: activePodcast.profiles?.display_name || 'Caribbean Creator',
        album: activePodcast.title,
        artwork: activePodcast.cover_path
          ? [
              {
                src: activePodcast.cover_path,
                sizes: '512x512',
                type: 'image/jpeg',
              },
            ]
          : [],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        const el = mediaMode === 'video' ? videoRef.current : audioRef.current;
        el?.play().catch(() => {});
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        const el = mediaMode === 'video' ? videoRef.current : audioRef.current;
        el?.pause();
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        skip(-15);
      });
      navigator.mediaSession.setActionHandler('seekforward', () => {
        skip(15);
      });
    }
  }, [activePodcast, activeEpisode, mediaMode]);

  // Restore saved listening progress
  useEffect(() => {
    if (!activeEpisodeId || !user) return;
    let isMounted = true;
    void getPodcastProgressAction(activeEpisodeId).then((progress) => {
      if (isMounted && progress && progress.positionSeconds > 0 && !progress.completed) {
        setCurrentTime(progress.positionSeconds);
        if (audioRef.current) audioRef.current.currentTime = progress.positionSeconds;
        if (videoRef.current) videoRef.current.currentTime = progress.positionSeconds;
      }
    });
    return () => {
      isMounted = false;
    };
  }, [activeEpisodeId, user]);

  // Persist listening progress periodically
  useEffect(() => {
    if (!isPlaying || !activeEpisodeId || !user) return;
    const interval = setInterval(() => {
      const el = mediaMode === 'video' ? videoRef.current : audioRef.current;
      if (el) {
        void savePodcastProgressAction(activeEpisodeId, el.currentTime, false);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [isPlaying, activeEpisodeId, user, mediaMode]);

  // Sleep Timer countdown
  useEffect(() => {
    if (sleepTimerSeconds > 0) {
      sleepTimerRef.current = setInterval(() => {
        setSleepTimerSeconds((prev) => {
          if (prev <= 1) {
            audioRef.current?.pause();
            videoRef.current?.pause();
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

  // Chapters list and current active chapter calculation
  const chapters: Chapter[] = activeEpisode?.chapters || activePodcast?.chapters || [];
  const currentChapter = useMemo(() => {
    if (!chapters || chapters.length === 0) return null;
    let active: Chapter = chapters[0];
    for (const chap of chapters) {
      if (chap.startSeconds <= currentTime) {
        active = chap;
      } else {
        break;
      }
    }
    return active;
  }, [chapters, currentTime]);

  // Active timed link banner matching current playback seconds
  const activeTimedLink = useMemo(() => {
    return timedLinks.find((tl) => Math.abs(tl.timestampSeconds - Math.floor(currentTime)) <= 4) || null;
  }, [timedLinks, currentTime]);

  function handleTogglePlay() {
    setPlaybackError(null);
    const mediaEl = mediaMode === 'video' ? videoRef.current : audioRef.current;
    if (!mediaEl) {
      setPlaybackError('Media player initializing.');
      return;
    }

    if (isPlaying) {
      mediaEl.pause();
      setIsPlaying(false);
    } else {
      AudioManager.claimAudio('tukubi-podcast-network-deck', 'podcast');
      mediaEl.play().catch((err: unknown) => {
        setIsPlaying(false);
        setPlaybackError(err instanceof Error ? err.message : 'Playback failed to start.');
      });
      if (activeEpisodeId) {
        void recordPodcastPlayAction(activeEpisodeId, 1, false);
      }
    }
  }

  function handleSwitchEpisode(ep: PodcastEpisodeItem, pod: PodcastShowItem) {
    if (audioRef.current) audioRef.current.pause();
    if (videoRef.current) videoRef.current.pause();
    setActivePodcast(pod);
    setActiveEpisode(ep);
    setCurrentTime(0);
    setIsPlaying(true);
    setMediaMode(ep.videoUrl ? 'video' : 'audio');
    AudioManager.claimAudio('tukubi-podcast-network-deck', 'podcast');
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) audioRef.current.currentTime = val;
    if (videoRef.current) videoRef.current.currentTime = val;
  }

  function skip(seconds: number) {
    const target = Math.min(duration, Math.max(0, currentTime + seconds));
    setCurrentTime(target);
    if (audioRef.current) audioRef.current.currentTime = target;
    if (videoRef.current) videoRef.current.currentTime = target;
  }

  function jumpToTimestamp(seconds: number) {
    setCurrentTime(seconds);
    if (audioRef.current) audioRef.current.currentTime = seconds;
    if (videoRef.current) videoRef.current.currentTime = seconds;
    if (!isPlaying) {
      AudioManager.claimAudio('tukubi-podcast-network-deck', 'podcast');
      const el = mediaMode === 'video' ? videoRef.current : audioRef.current;
      el?.play().catch(() => {});
      setIsPlaying(true);
    }
  }

  function cyclePlaybackSpeed() {
    const idx = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const next = PLAYBACK_SPEEDS[(idx + 1) % PLAYBACK_SPEEDS.length];
    setPlaybackSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
    if (videoRef.current) videoRef.current.playbackRate = next;
  }

  function toggleMute() {
    const next = !isMuted;
    if (audioRef.current) audioRef.current.muted = next;
    if (videoRef.current) videoRef.current.muted = next;
    setIsMuted(next);
  }

  function handleShare(slug: string) {
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/podcasts/${slug}?t=${Math.floor(currentTime)}`
      : '';
    if (navigator.share) {
      navigator.share({ title: activePodcast?.title || 'Caribbean Podcast', url }).catch(() => {});
    } else if (navigator.clipboard) {
      void navigator.clipboard.writeText(url);
      setCopiedShareId(slug);
      setTimeout(() => setCopiedShareId(null), 2000);
    }
  }

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!activeEpisodeId || !newCommentBody.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const res = await addPodcastCommentAction(activeEpisodeId, newCommentBody.trim(), currentTime);
      if (res.success) {
        setNewCommentBody('');
        const fresh = await fetchPodcastCommentsAction(activeEpisodeId);
        setComments(fresh);
      }
    } finally {
      setIsSubmittingComment(false);
    }
  }

  return (
    <div className="space-y-8 pb-32">
      {/* Audio Element */}
      {activeEpisode?.audioUrl && (
        <audio
          ref={audioRef}
          src={activeEpisode.audioUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => {
            if (mediaMode === 'audio') {
              setIsPlaying(false);
              setPlaybackError('Audio stream error: Unable to load podcast media from storage.');
            }
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) setDuration(audioRef.current.duration || 1800);
          }}
          onTimeUpdate={() => {
            if (mediaMode === 'audio' && audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            if (activeEpisodeId && user) {
              void savePodcastProgressAction(activeEpisodeId, duration, true);
              void recordPodcastPlayAction(activeEpisodeId, duration, true);
            }
          }}
        />
      )}

      {/* Playback Error Banner */}
      {playbackError && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-brand-sunsetCoral/15 border border-brand-sunsetCoral/40 text-brand-sunsetCoral flex items-center justify-between text-sm animate-fadeIn"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{playbackError}</span>
          </div>
          <button
            type="button"
            onClick={() => setPlaybackError(null)}
            className="text-xs underline hover:text-white ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Header & Launch Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-purple-400" /> Caribbean Podcast Network &amp; Video Streams
          </h2>
          <p className="text-xs sm:text-sm text-brand-sandstone/70 mt-0.5">
            Podcasting 2.0 namespace, dual audio/video streaming, chapter navigation, timed links &amp; transcripts.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer min-h-[44px]"
        >
          <Plus className="w-4 h-4" /> Host Show / Publish Episode
        </button>
      </div>

      {/* Real-time Timed Link Banner */}
      {activeTimedLink && (
        <div className="p-3.5 rounded-2xl bg-purple-500/20 border border-purple-500/50 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-600 text-white">
              <Link2 className="w-4 h-4" />
            </span>
            <div>
              <p className="text-xs font-black text-white">{activeTimedLink.title}</p>
              {activeTimedLink.description && (
                <p className="text-[11px] text-brand-sandstone/80">{activeTimedLink.description}</p>
              )}
            </div>
          </div>
          <a
            href={activeTimedLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black flex items-center gap-1 shrink-0"
          >
            <span>Open Link</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Universal Player Deck (Dual Audio & Video) */}
      {activePodcast && (
        <div className="surface-card border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Video Player Display (if video mode selected and active) */}
          {hasVideo && mediaMode === 'video' && activeEpisode?.videoUrl && (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
              <video
                ref={videoRef}
                src={activeEpisode.videoUrl}
                playsInline
                className="w-full h-full object-contain"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={() => {
                  if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                }}
                onLoadedMetadata={() => {
                  if (videoRef.current) setDuration(videoRef.current.duration || 1800);
                }}
                onError={() => {
                  setIsPlaying(false);
                  setPlaybackError('Video stream error: Unable to load video file.');
                }}
              />
            </div>
          )}

          {/* Media Header & Mode Toggle */}
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Cover / Video Toggle */}
            <div
              onClick={handleTogglePlay}
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

                {/* Audio vs Video Mode Switcher */}
                {hasVideo && (
                  <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white/10 border border-white/10 text-xs">
                    <button
                      type="button"
                      onClick={() => setMediaMode('audio')}
                      className={`px-2 py-0.5 rounded-lg font-black transition-all flex items-center gap-1 ${
                        mediaMode === 'audio' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Headphones className="w-3 h-3" /> Audio
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaMode('video')}
                      className={`px-2 py-0.5 rounded-lg font-black transition-all flex items-center gap-1 ${
                        mediaMode === 'video' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Video className="w-3 h-3" /> Video
                    </button>
                  </div>
                )}

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

              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white truncate">
                {activeEpisode?.title || activePodcast.title}
              </h3>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs text-brand-sandstone/85 font-medium">
                <span>Hosted by <strong className="text-white font-black">{activePodcast.profiles?.display_name ?? 'Creator'}</strong></span>
                {currentChapter && (
                  <span className="text-purple-300 font-bold bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/30">
                    📍 {currentChapter.title}
                  </span>
                )}
              </div>

              {/* Scrubber Bar */}
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

            {/* Deck Playback Controls */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => skip(-15)}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Rewind 15 seconds"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="p-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => skip(15)}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Skip forward 15 seconds"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

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

          {/* Interactive Feature Drawers Bar */}
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowChaptersDrawer(!showChaptersDrawer);
                  setShowTranscriptDrawer(false);
                  setShowTimedLinksDrawer(false);
                  setShowCommentsDrawer(false);
                }}
                className={`px-3.5 py-2 rounded-xl border font-bold flex items-center gap-1.5 transition-colors min-h-[38px] ${
                  showChaptersDrawer
                    ? 'bg-purple-600/30 text-purple-200 border-purple-500/50'
                    : 'bg-white/5 border-white/10 text-brand-sandstone/80 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Chapters ({chapters.length})</span>
                {showChaptersDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowTranscriptDrawer(!showTranscriptDrawer);
                  setShowChaptersDrawer(false);
                  setShowTimedLinksDrawer(false);
                  setShowCommentsDrawer(false);
                }}
                className={`px-3.5 py-2 rounded-xl border font-bold flex items-center gap-1.5 transition-colors min-h-[38px] ${
                  showTranscriptDrawer
                    ? 'bg-purple-600/30 text-purple-200 border-purple-500/50'
                    : 'bg-white/5 border-white/10 text-brand-sandstone/80 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-brand-caribbeanSea" />
                <span>Transcript</span>
                {showTranscriptDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowTimedLinksDrawer(!showTimedLinksDrawer);
                  setShowChaptersDrawer(false);
                  setShowTranscriptDrawer(false);
                  setShowCommentsDrawer(false);
                }}
                className={`px-3.5 py-2 rounded-xl border font-bold flex items-center gap-1.5 transition-colors min-h-[38px] ${
                  showTimedLinksDrawer
                    ? 'bg-purple-600/30 text-purple-200 border-purple-500/50'
                    : 'bg-white/5 border-white/10 text-brand-sandstone/80 hover:text-white'
                }`}
              >
                <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Timed Links ({timedLinks.length})</span>
                {showTimedLinksDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCommentsDrawer(!showCommentsDrawer);
                  setShowChaptersDrawer(false);
                  setShowTranscriptDrawer(false);
                  setShowTimedLinksDrawer(false);
                }}
                className={`px-3.5 py-2 rounded-xl border font-bold flex items-center gap-1.5 transition-colors min-h-[38px] ${
                  showCommentsDrawer
                    ? 'bg-purple-600/30 text-purple-200 border-purple-500/50'
                    : 'bg-white/5 border-white/10 text-brand-sandstone/80 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Discussion ({comments.length})</span>
                {showCommentsDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
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
                onClick={() => handleShare(activePodcast.slug)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 min-h-[38px] min-w-[38px] flex items-center justify-center"
                title="Share Episode"
              >
                {copiedShareId === activePodcast.slug ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Chapters Drawer */}
          {showChaptersDrawer && (
            <div className="p-4 surface-card border border-white/10 rounded-2xl space-y-2 animate-fadeIn">
              <h4 className="text-xs font-black uppercase tracking-wider text-purple-400">
                Episode Chapters ({chapters.length})
              </h4>
              {chapters.length === 0 ? (
                <p className="text-xs text-brand-sandstone/60 italic">No chapters configured for this episode.</p>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {chapters.map((chap, idx) => (
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
              )}
            </div>
          )}

          {/* Transcript Drawer */}
          {showTranscriptDrawer && (
            <div className="p-4 surface-card border border-white/10 rounded-2xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-400">
                  Interactive Transcript
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

              <div className="p-3 bg-slate-950/90 rounded-xl max-h-56 overflow-y-auto text-xs text-brand-sandstone/90 leading-relaxed font-serif whitespace-pre-line border border-white/5 space-y-2">
                {transcriptSegments.length > 0 ? (
                  transcriptSegments
                    .filter((seg) => !transcriptSearch || seg.text.toLowerCase().includes(transcriptSearch.toLowerCase()))
                    .map((seg, idx) => {
                      const isCurrent = currentTime >= seg.startSeconds && currentTime <= seg.endSeconds;
                      return (
                        <div
                          key={idx}
                          onClick={() => jumpToTimestamp(seg.startSeconds)}
                          className={`p-2 rounded-lg cursor-pointer transition-colors ${
                            isCurrent ? 'bg-purple-600/30 text-white font-medium' : 'hover:bg-white/5'
                          }`}
                        >
                          <span className="font-mono text-[10px] text-purple-400 mr-2">
                            {formatTimestamp(seg.startSeconds)}
                          </span>
                          {seg.speaker && <strong className="text-white mr-1.5">{seg.speaker}:</strong>}
                          <span>{seg.text}</span>
                        </div>
                      );
                    })
                ) : (
                  <p className="italic text-brand-sandstone/60">
                    {activeEpisode?.transcript || activePodcast.transcript || 'No automated transcript has been published for this episode yet.'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Timed Links Drawer */}
          {showTimedLinksDrawer && (
            <div className="p-4 surface-card border border-white/10 rounded-2xl space-y-3 animate-fadeIn">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Contextual Timed Links ({timedLinks.length})
              </h4>
              {timedLinks.length === 0 ? (
                <p className="text-xs text-brand-sandstone/60 italic">No timed links added to this episode yet.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {timedLinks.map((link, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => jumpToTimestamp(link.timestampSeconds)}
                            className="font-mono text-purple-400 hover:underline"
                          >
                            [{formatTimestamp(link.timestampSeconds)}]
                          </button>
                          <span className="font-bold text-white">{link.title}</span>
                        </div>
                        {link.description && (
                          <p className="text-brand-sandstone/70 text-[11px] mt-0.5">{link.description}</p>
                        )}
                      </div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 font-bold shrink-0 flex items-center gap-1"
                      >
                        Visit <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Timestamped Discussion Drawer */}
          {showCommentsDrawer && (
            <div className="p-4 surface-card border border-white/10 rounded-2xl space-y-3 animate-fadeIn">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                Timestamped Listener Comments ({comments.length})
              </h4>

              {/* Add Comment Form */}
              {user ? (
                <form onSubmit={handlePostComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Comment at ${formatTimestamp(Math.floor(currentTime))}…`}
                    value={newCommentBody}
                    onChange={(e) => setNewCommentBody(e.target.value)}
                    className="flex-1 bg-slate-950/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-brand-sandstone/50 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !newCommentBody.trim()}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black text-xs flex items-center gap-1.5 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              ) : (
                <p className="text-xs text-brand-sandstone/60">
                  <a href="/login" className="text-purple-400 font-bold underline">Sign in</a> to participate in episode discussions.
                </p>
              )}

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-xs text-brand-sandstone/60 italic py-2">No comments yet. Start the conversation!</p>
                ) : (
                  comments.map((comm) => (
                    <div key={comm.id} className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{comm.profile?.display_name || 'Listener'}</span>
                        {comm.timestamp_seconds !== null && comm.timestamp_seconds !== undefined && (
                          <button
                            type="button"
                            onClick={() => jumpToTimestamp(comm.timestamp_seconds)}
                            className="font-mono text-purple-400 hover:underline text-[11px]"
                          >
                            @{formatTimestamp(comm.timestamp_seconds)}
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-brand-sandstone/85">{comm.body}</p>
                    </div>
                  ))
                )}
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
            There are currently no podcasts in this category. Be the first creator to launch a Caribbean show with video streams, automated transcripts, and iTunes RSS feeds!
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-opacity shadow-lg shadow-purple-600/30 cursor-pointer min-h-[44px]"
          >
            <Plus className="w-4 h-4" /> Host First Show
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 3xl:grid-cols-3 4xl:grid-cols-4 gap-6">
          {podcasts.map((podcast) => {
            const isCurrent = activePodcast?.id === podcast.id;
            const isCurrentPlaying = isCurrent && isPlaying;
            const epCount = podcast.episodesCount ?? podcast.podcast_episodes?.length ?? 0;
            const latestEp = podcast.podcast_episodes?.[0];

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
                    <Link href={`/podcasts/${podcast.slug}`}>
                      <h3 className="font-black text-base sm:text-lg text-white group-hover:text-purple-300 transition-colors leading-snug">
                        {podcast.title}
                      </h3>
                    </Link>
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

                {/* Footer / Controls */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-sandstone/70">
                    <Headphones className="w-4 h-4 text-purple-400" />
                    <span>{podcast.follower_count.toLocaleString()} Subscribers</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {latestEp && (
                      <button
                        onClick={() => {
                          if (isCurrent) {
                            handleTogglePlay();
                          } else {
                            handleSwitchEpisode(latestEp, podcast);
                          }
                        }}
                        className={`p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-black cursor-pointer min-h-[38px] ${
                          isCurrentPlaying
                            ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                            : 'bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border-purple-500/40'
                        }`}
                      >
                        {isCurrentPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        <span>{isCurrentPlaying ? 'Pause' : 'Play'}</span>
                      </button>
                    )}

                    <FollowPodcastButton
                      podcastId={podcast.id}
                      isFollowing={false}
                      isAuthenticated={Boolean(user)}
                    />

                    <button
                      onClick={() => handleShare(podcast.slug)}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 min-h-[38px] min-w-[38px] flex items-center justify-center"
                      title="Share Podcast"
                    >
                      {copiedShareId === podcast.slug ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
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
