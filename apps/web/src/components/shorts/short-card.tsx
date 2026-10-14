'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Video as VideoIcon, Heart, MessageCircle, MessageSquare, Share2,
  Volume2, VolumeX, Plus, Check, Disc, Bookmark, Subtitles,
  MoreVertical, AlertTriangle, ShieldCheck, RefreshCw, Eye
} from 'lucide-react';
import type { CaptionTrack } from '@caribbean/media';
import { toggleShortLikeAction, saveShortAction, unsaveShortAction } from '../../lib/media/short-actions';
import { followAction, unfollowAction } from '../../lib/social/profile-actions';
import AudioManager from '../../lib/media/audio-manager';
import ReelSubtitleOverlay from '../reels/reel-subtitle-overlay';
import ShoppableReelBadge from '../commerce/shoppable-reel-badge';
import type { TaggedProductSummary } from '@caribbean/marketplace';

export interface ShortItem {
  id: string;
  title: string;
  creatorId?: string;
  creator: string;
  handle: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
  pageId?: string | null;
  pageName?: string | null;
  pageSlug?: string | null;
  views: string;
  likes: string;
  comments: string;
  sound: string;
  soundId?: string;
  location: string;
  category?: string;
  duration: string;
  gradient: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  initialLiked?: boolean;
  captions?: CaptionTrack;
  tagged_product_ids?: string[];
  taggedProductIds?: string[];
  taggedProducts?: TaggedProductSummary[];
}

interface ShortCardProps {
  short: ShortItem;
  isActive: boolean;
  isNext: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  user: any;
  likesState: Record<string, { count: number; liked: boolean }>;
  setLikesState: React.Dispatch<React.SetStateAction<Record<string, { count: number; liked: boolean }>>>;
  followingState: Record<string, boolean>;
  setFollowingState: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onOpenComments: (shortId: string) => void;
  onOpenShare: (shortId: string) => void;
  onOpenReport: (shortId: string) => void;
  isSaved: boolean;
  onSave: (shortId: string) => void;
}

export default function ShortCard({
  short,
  isActive,
  isNext,
  isMuted,
  toggleMute,
  user,
  likesState,
  setLikesState,
  followingState,
  setFollowingState,
  onOpenComments,
  onOpenShare,
  onOpenReport,
  isSaved,
  onSave,
}: ShortCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Register Short with global AudioManager
  useEffect(() => {
    const audioMgr = AudioManager.getInstance();
    const unregister = audioMgr.register(short.id, {
      onMute: () => {
        if (!isMuted) toggleMute();
      },
      onPause: () => {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      },
      kind: 'reel',
    });

    return () => {
      unregister();
      audioMgr.releaseAudio(short.id);
    };
  }, [short.id, isMuted, toggleMute]);

  useEffect(() => {
    if (isActive) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        if (!isMuted) {
          AudioManager.getInstance().claimAudio(short.id, 'reel');
        }
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      }
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      AudioManager.getInstance().releaseAudio(short.id);
    }
  }, [isActive, isMuted, short.id]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 1;
      setCurrentTime(cur);
      setProgress((cur / dur) * 100);
    }
  };

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      AudioManager.getInstance().releaseAudio(short.id);
    } else {
      if (!isMuted) {
        AudioManager.getInstance().claimAudio(short.id, 'reel');
      }
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleToggleLike = async () => {
    const current = likesState[short.id] || { count: 0, liked: false };
    const nextLiked = !current.liked;
    const nextCount = nextLiked ? current.count + 1 : Math.max(0, current.count - 1);
    setLikesState(prev => ({ ...prev, [short.id]: { count: nextCount, liked: nextLiked } }));
    await toggleShortLikeAction(short.id);
  };

  const handleToggleFollow = async () => {
    const isFollowed = followingState[short.handle] ?? false;
    const nextFollow = !isFollowed;
    setFollowingState(prev => ({ ...prev, [short.handle]: nextFollow }));
    if (short.creatorId) {
      if (nextFollow) await followAction(short.creatorId);
      else await unfollowAction(short.creatorId);
    }
  };

  const currentLike = likesState[short.id] || {
    count: parseInt(short.likes.replace(/[^0-9]/g, ''), 10) || 0,
    liked: short.initialLiked || false,
  };
  const isFollowed = followingState[short.handle] ?? false;

  const preloadState = isActive || isNext ? 'auto' : 'none';
  const supabaseBase = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qixlaqwohhrynownvqwp.supabase.co';
  const displayUrl = short.videoUrl?.startsWith('http')
    ? short.videoUrl
    : short.videoUrl
    ? `${supabaseBase}/storage/v1/object/public/${short.videoUrl}`
    : undefined;

  return (
    <div
      className="h-full w-full snap-start snap-always relative overflow-hidden bg-black flex items-center justify-center short-container"
      data-short-id={short.id}
    >
      {/* Outer ambient blur backdrop on desktop widescreen */}
      <div
        className="hidden md:block absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 scale-110 pointer-events-none"
        style={{ backgroundImage: `url(${short.thumbnailUrl || ''})` }}
      />

      {/* Portrait Stage: max-w-[460px] to preserve vertical 9:16 aspect on desktop widescreen without distortion */}
      <div className="relative w-full h-full max-w-[460px] mx-auto bg-slate-950 overflow-hidden shadow-2xl flex flex-col justify-between">
        {/* Click to play/pause stage */}
        <div onClick={handleTogglePlay} className="absolute inset-0 cursor-pointer flex items-center justify-center">
          {displayUrl && !videoError && (isActive || isNext) ? (
            <video
              ref={videoRef}
              src={displayUrl}
              poster={short.thumbnailUrl}
              preload={preloadState}
              playsInline
              loop
              muted={isMuted}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => {
                setIsPlaying(true);
                if (!isMuted) {
                  AudioManager.getInstance().claimAudio(short.id, 'reel');
                }
              }}
              onPause={() => setIsPlaying(false)}
              onError={() => {
                console.warn('[ShortCard] Video playback error for short:', short.id);
                setVideoError(true);
                setIsPlaying(false);
                AudioManager.getInstance().releaseAudio(short.id);
              }}
              className="w-full h-full object-cover"
            />
          ) : videoError ? (
            <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <VideoIcon className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-white">Playback Interrupted</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Could not stream video. Check network connectivity or retry.
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setVideoError(false);
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Playback
              </button>
            </div>
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-t ${short.gradient} flex flex-col items-center justify-center p-6 text-center space-y-3`}>
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white/60 border border-white/15">
                <VideoIcon className="w-8 h-8 opacity-60" />
              </div>
              <p className="text-sm font-bold text-white/90">{short.title || 'TUKUBI Short'}</p>
              <p className="text-xs text-white/60 max-w-xs">
                @{short.handle}
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-white/20 z-20">
          <div className="h-full bg-brand-sunriseCoral transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
        </div>

        {/* Top Controls: Sound Toggle & More Menu */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/15 hover:bg-black/70 transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              aria-label="More options"
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/15 hover:bg-black/70 transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-12 w-44 rounded-2xl bg-[#0D1322] border border-slate-800 shadow-2xl p-1.5 z-30 space-y-1 animate-fadeIn">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    onOpenReport(short.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors text-left"
                >
                  <AlertTriangle className="w-4 h-4" /> Report Short
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Action Rail */}
        <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-20">
          {/* Like */}
          <button onClick={handleToggleLike} aria-label="Like short" className="flex flex-col items-center gap-1 group active:scale-90 transition-transform">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-md ${currentLike.liked ? 'bg-rose-500 text-white' : 'bg-black/50 text-white border border-white/15'}`}>
              <Heart className={`w-5 h-5 ${currentLike.liked ? 'fill-current scale-110' : ''}`} />
            </div>
            <span className="text-[11px] font-black text-white shadow-black drop-shadow-md">
              {currentLike.count >= 1000 ? `${(currentLike.count / 1000).toFixed(1)}K` : currentLike.count}
            </span>
          </button>

          {/* Comments */}
          <button onClick={() => onOpenComments(short.id)} aria-label="Comments" className="flex flex-col items-center gap-1 group active:scale-90 transition-transform">
            <div className="w-11 h-11 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-md text-white border border-white/15 shadow-md">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black text-white shadow-black drop-shadow-md">{short.comments}</span>
          </button>

          {/* Save / Bookmark */}
          <button
            type="button"
            onClick={() => onSave(short.id)}
            className={`flex flex-col items-center gap-1 group active:scale-90 transition-transform ${isSaved ? 'text-brand-caribbeanSea' : 'text-white'}`}
            aria-label={isSaved ? 'Unsave short' : 'Save short'}
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-colors shadow-md ${isSaved ? 'bg-brand-caribbeanSea/30 text-brand-caribbeanSea border border-brand-caribbeanSea/50' : 'bg-black/50 text-white border border-white/15'}`}>
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-brand-caribbeanSea' : ''}`} />
            </div>
            <span className="text-[10px] font-bold shadow-black drop-shadow-md">{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          {/* Captions / Subtitles Toggle */}
          {short.captions && (
            <button
              type="button"
              onClick={() => setCaptionsEnabled(prev => !prev)}
              aria-label={captionsEnabled ? 'Turn off subtitles' : 'Turn on subtitles'}
              className={`flex flex-col items-center gap-1 group active:scale-90 transition-transform ${captionsEnabled ? 'text-brand-sunriseCoral' : 'text-white/60'}`}
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-colors shadow-md ${captionsEnabled ? 'bg-brand-sunriseCoral/20 border border-brand-sunriseCoral/40 text-brand-sunriseCoral' : 'bg-black/50 text-white border border-white/15'}`}>
                <Subtitles className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold shadow-black drop-shadow-md">{captionsEnabled ? 'CC On' : 'CC Off'}</span>
            </button>
          )}

          {/* Share */}
          <button onClick={() => onOpenShare(short.id)} aria-label="Share short" className="flex flex-col items-center gap-1 group active:scale-90 transition-transform">
            <div className="w-11 h-11 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-md text-white border border-white/15 shadow-md">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-white shadow-black drop-shadow-md">Share</span>
          </button>

          {/* Message Creator Shortcut */}
          <Link
            href={`/messages?u=${encodeURIComponent(short.handle)}`}
            aria-label={`Message ${short.creator}`}
            className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
          >
            <div className="w-11 h-11 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-md text-white border border-white/15 shadow-md hover:bg-brand-caribbeanSea/30 hover:text-brand-caribbeanSea transition-colors">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-white shadow-black drop-shadow-md">Chat</span>
          </Link>

          {/* Creator Profile Avatar & Follow Button */}
          <div className="relative mt-1">
            <Link href={`/profile/${short.handle}`} aria-label="Creator Profile">
              <div className="w-11 h-11 rounded-full border-2 border-white overflow-hidden bg-brand-twilight flex items-center justify-center shadow-lg">
                {short.avatarUrl ? (
                  <img src={short.avatarUrl} alt={short.creator} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base">🌴</span>
                )}
              </div>
            </Link>
            <button
              onClick={handleToggleFollow}
              aria-label={isFollowed ? 'Unfollow' : 'Follow'}
              className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center text-white border-2 border-black ${isFollowed ? 'bg-brand-caribbeanSea' : 'bg-rose-500'}`}
            >
              {isFollowed ? <Check className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
            </button>
          </div>
        </div>

        {/* Subtitle Overlay */}
        <ReelSubtitleOverlay
          currentTime={currentTime}
          captions={short.captions}
          isEnabled={captionsEnabled}
          onToggleEnabled={() => setCaptionsEnabled((prev) => !prev)}
        />

        {/* Bottom Left Info / Creator Details */}
        <div className="absolute left-4 bottom-5 right-20 z-20 flex flex-col gap-1.5">
          {/* Shoppable Reel Badge Overlay */}
          {(short.taggedProducts?.length || short.tagged_product_ids?.length || short.taggedProductIds?.length) ? (
            <div className="mb-0.5">
              <ShoppableReelBadge
                products={short.taggedProducts}
                productIds={short.tagged_product_ids || short.taggedProductIds}
              />
            </div>
          ) : null}

          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/profile/${short.handle}`} className="flex items-center gap-1.5 hover:underline">
              <span className="text-sm font-extrabold text-white drop-shadow-md">{short.creator}</span>
              <span className="text-xs font-semibold text-white/80 drop-shadow-md">@{short.handle}</span>
            </Link>

            {short.pageId && (
              <span className="px-1.5 py-0.5 rounded bg-brand-caribbeanSea/30 border border-brand-caribbeanSea/50 text-[10px] font-black text-brand-caribbeanSea">
                PAGE
              </span>
            )}
          </div>

          <div className="text-xs text-white/95 drop-shadow-md cursor-pointer" onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}>
            <p className={isCaptionExpanded ? '' : 'line-clamp-2'}>{short.title}</p>
          </div>

          {/* Location & Category Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            {short.location && (
              <span className="px-2 py-0.5 bg-black/50 backdrop-blur-md rounded-lg text-[10px] font-bold text-white border border-white/15">
                📍 {short.location}
              </span>
            )}
            {short.category && (
              <span className="px-2 py-0.5 bg-brand-goldenHour/20 border border-brand-goldenHour/40 rounded-lg text-[10px] font-black text-brand-goldenHour uppercase">
                {short.category}
              </span>
            )}
            <span className="px-2 py-0.5 bg-black/50 backdrop-blur-md rounded-lg text-[10px] font-bold text-white/70 border border-white/15 flex items-center gap-1">
              <Eye className="w-3 h-3 text-brand-goldenHour" /> {short.views}
            </span>
          </div>

          {/* Sound / Rhythm Track */}
          <div className="flex items-center gap-2 mt-1">
            <Disc className="w-4 h-4 text-white animate-spin" style={{ animationDuration: '4s' }} />
            <span className="text-xs font-medium text-white/90 drop-shadow-md truncate">{short.sound}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
