'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Mic,
  Play,
  Pause,
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
} from 'lucide-react';
import FollowPodcastButton from '../follow-podcast-button';

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
  audioUrl?: string;
  latestEpisodeTitle?: string;
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

export default function PodcastNetworkFeed({ podcasts, user }: PodcastNetworkFeedProps) {
  const [activePodcast, setActivePodcast] = useState<PodcastShowItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (activePodcast && audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [activePodcast, isPlaying]);

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
    }
  }

  function handleTimeUpdate() {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 180);
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

  function handleShare(id: string, slug: string) {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/podcasts?slug=${slug}` : '';
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  return (
    <div className="space-y-8">
      {/* Hidden Audio Player */}
      {activePodcast && (
        <audio
          ref={audioRef}
          src={activePodcast.audioUrl || 'https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3'}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Active Playing Podcast Deck */}
      {activePodcast && (
        <div className="bg-gradient-to-br from-purple-950/60 via-slate-900 to-[#090D16] border border-purple-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div
              onClick={() => handleTogglePlay(activePodcast)}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-3xl shadow-lg cursor-pointer flex-shrink-0 relative group"
            >
              🎙️
              <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isPlaying ? <Pause className="w-7 h-7 text-white fill-current" /> : <Play className="w-7 h-7 text-white fill-current translate-x-0.5" />}
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-2 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                  NOW PLAYING
                </span>
                <span className="text-xs text-brand-sandstone/60">
                  {activePodcast.category ?? 'Caribbean Podcast'}
                </span>
              </div>
              <h3 className="text-lg font-black text-brand-sandstone truncate">{activePodcast.title}</h3>
              <p className="text-xs text-slate-300">
                Latest Episode · Hosted by {activePodcast.profiles?.display_name ?? 'Creator'}
              </p>

              {/* Scrubber & Time */}
              <div className="space-y-1 pt-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 180}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex items-center justify-between text-[11px] text-brand-sandstone/40">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleMute}
                className="p-2.5 rounded-xl bg-brand-twilight border border-slate-800 text-slate-300 hover:text-white"
                title="Mute / Unmute"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
              <button
                onClick={() => handleTogglePlay(activePodcast)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-black px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
                {isPlaying ? 'Pause' : 'Resume'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Podcasts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {podcasts.map((podcast) => {
          const isCurrent = activePodcast?.id === podcast.id;
          const isCurrentPlaying = isCurrent && isPlaying;
          const epCount = podcast.episodesCount ?? 12;

          return (
            <article
              key={podcast.id}
              className={`border rounded-3xl p-6 space-y-4 flex flex-col justify-between transition-all shadow-xl group ${
                isCurrent
                  ? 'bg-brand-dusk border-purple-500/60 ring-2 ring-purple-500/20'
                  : 'bg-brand-dusk/80 border-slate-800/90 hover:border-purple-500/50'
              }`}
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/20">
                    🎙️
                  </div>
                  <div className="flex items-center gap-2">
                    {podcast.is_paid && (
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-brand-goldenHour/20 text-amber-300 border border-brand-goldenHour/30">
                        SpotPay Member Only
                      </span>
                    )}
                    <a
                      href={`/api/v1/podcasts/${podcast.id}/rss`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="iTunes RSS 2.0 Feed"
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-brand-dusk text-purple-300 border border-purple-500/30 flex items-center gap-1 hover:bg-purple-500/20 transition-colors"
                    >
                      <Rss className="w-3 h-3" /> iTunes RSS
                    </a>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block mb-1">
                    {podcast.category ?? 'Culture & Society'}
                  </span>
                  <h3 className="font-extrabold text-base text-brand-sandstone group-hover:text-purple-300 transition-colors leading-snug">
                    {podcast.title}
                  </h3>
                  <p className="text-xs text-brand-sandstone/60 mt-1">
                    Hosted by <strong className="text-slate-200">{podcast.profiles?.display_name ?? 'Creator'}</strong> • {epCount} Episodes
                  </p>
                </div>

                {podcast.description && (
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {podcast.description}
                  </p>
                )}
              </div>

              {/* Audio Wave Preview Bar & Follow Button */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-sandstone/60">
                  <Headphones className="w-4 h-4 text-purple-400" />
                  <span>{podcast.follower_count.toLocaleString()} Subscribers</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePlay(podcast)}
                    className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                      isCurrentPlaying
                        ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                        : 'bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border-purple-500/30'
                    }`}
                  >
                    {isCurrentPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>{isCurrentPlaying ? 'Pause' : 'Play Latest'}</span>
                  </button>

                  <FollowPodcastButton
                    podcastId={podcast.id}
                    isFollowing={false}
                    isAuthenticated={!!user}
                  />

                  <button
                    onClick={() => handleShare(podcast.id, podcast.slug)}
                    className="p-2 rounded-xl bg-brand-twilight border border-slate-800 text-slate-300 hover:text-brand-sunriseCoral"
                    title="Share Podcast"
                  >
                    {copiedId === podcast.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
