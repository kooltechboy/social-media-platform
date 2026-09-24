'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Video, Music, Heart, MessageCircle, MessageSquare, Share2, Wallet, Play, Pause,
  Volume2, VolumeX, Plus, Send, X, Copy, Check, UserPlus, UserCheck, Disc, Bookmark,
  Subtitles
} from 'lucide-react';
import type { CaptionTrack } from '@caribbean/media';
import {
  toggleReelLikeAction,
  postReelCommentAction,
  recordReelShareAction,
  recordReelViewAction,
  saveReelAction,
  unsaveReelAction,
} from '../../lib/media/reel-actions';
import { followAction, unfollowAction } from '../../lib/social/profile-actions';
import UseThisSoundButton from '../sounds/use-this-sound-button';
import CreateReelModal from './create-reel-modal';
import ReelSubtitleOverlay from './reel-subtitle-overlay';
import AudioManager from '../../lib/media/audio-manager';

export interface ReelItem {
  id: string;
  title: string;
  creatorId?: string;
  creator: string;
  handle: string;
  views: string;
  likes: string;
  comments: string;
  sound: string;
  soundId?: string;
  location: string;
  duration: string;
  gradient: string;
  videoUrl?: string;
  initialLiked?: boolean;
  captions?: CaptionTrack;
}


interface CommentItem {
  id: string;
  user: string;
  handle: string;
  avatar: string;
  text: string;
  time: string;
}

interface ReelsFeedViewerProps {
  initialReels: ReelItem[];
  user: {
    id: string;
    displayName: string;
    username?: string;
  } | null;
}

function ReelCard({
  reel,
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
  isSaved,
  onSave,
}: {
  reel: ReelItem;
  isActive: boolean;
  isNext: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  user: any;
  likesState: Record<string, { count: number; liked: boolean }>;
  setLikesState: React.Dispatch<React.SetStateAction<Record<string, { count: number; liked: boolean }>>>;
  followingState: Record<string, boolean>;
  setFollowingState: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onOpenComments: (reelId: string) => void;
  onOpenShare: (reelId: string) => void;
  isSaved: boolean;
  onSave: (reelId: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [videoError, setVideoError] = useState(false);

  // Register Reel with global AudioManager
  useEffect(() => {
    const audioMgr = AudioManager.getInstance();
    const unregister = audioMgr.register(reel.id, {
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
      audioMgr.releaseAudio(reel.id);
    };
  }, [reel.id, isMuted, toggleMute]);

  useEffect(() => {
    if (isActive) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        if (!isMuted) {
          AudioManager.getInstance().claimAudio(reel.id, 'reel');
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
      AudioManager.getInstance().releaseAudio(reel.id);
    }
  }, [isActive, isMuted, reel.id]);

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
      AudioManager.getInstance().releaseAudio(reel.id);
    } else {
      if (!isMuted) {
        AudioManager.getInstance().claimAudio(reel.id, 'reel');
      }
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleToggleLike = async () => {
    const current = likesState[reel.id] || { count: 0, liked: false };
    const nextLiked = !current.liked;
    const nextCount = nextLiked ? current.count + 1 : Math.max(0, current.count - 1);
    setLikesState(prev => ({ ...prev, [reel.id]: { count: nextCount, liked: nextLiked } }));
    await toggleReelLikeAction(reel.id);
  };

  const handleToggleFollow = async () => {
    const isFollowed = followingState[reel.handle] ?? false;
    const nextFollow = !isFollowed;
    setFollowingState(prev => ({ ...prev, [reel.handle]: nextFollow }));
    if (reel.creatorId) {
      if (nextFollow) await followAction(reel.creatorId);
      else await unfollowAction(reel.creatorId);
    }
  };

  const currentLike = likesState[reel.id] || { count: parseInt(reel.likes.replace(/[^0-9]/g, ''), 10) || 0, liked: reel.initialLiked || false };
  const isFollowed = followingState[reel.handle] ?? false;

  const preloadState = isActive || isNext ? 'auto' : 'none';
  const supabaseBase = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qixlaqwohhrynownvqwp.supabase.co';
  const displayUrl = reel.videoUrl?.startsWith('http')
    ? reel.videoUrl
    : reel.videoUrl
    ? `${supabaseBase}/storage/v1/object/public/${reel.videoUrl}`
    : undefined;

  return (
    <div className="h-full w-full snap-start snap-always relative overflow-hidden bg-black reel-container" data-reel-id={reel.id}>
      {/* Video or Fallback */}
      <div onClick={handleTogglePlay} className="absolute inset-0 cursor-pointer flex items-center justify-center">
        {displayUrl && !videoError ? (
          <video
            ref={videoRef}
            src={displayUrl}
            preload={preloadState}
            playsInline
            loop
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => {
              setIsPlaying(true);
              if (!isMuted) {
                AudioManager.getInstance().claimAudio(reel.id, 'reel');
              }
            }}
            onPause={() => setIsPlaying(false)}
            onError={() => {
              console.warn('[ReelCard] Video playback error for reel:', reel.id);
              setVideoError(true);
              setIsPlaying(false);
              AudioManager.getInstance().releaseAudio(reel.id);
            }}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-t ${reel.gradient} flex flex-col items-center justify-center p-6 text-center space-y-3`}>
             <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white/60 border border-white/15">
                <Video className="w-8 h-8 opacity-60" />
             </div>
             <p className="text-sm font-bold text-white/90">Video Unavailable</p>
             <p className="text-xs text-white/60 max-w-xs">
               This video stream is currently being transcoded or is temporarily offline.
             </p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-white/20 z-20">
        <div className="h-full bg-brand-sunriseCoral transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
      </div>

      {/* Mute Button */}
      <button 
        onClick={toggleMute} 
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* Right Action Rail */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-20">
        <button onClick={handleToggleLike} aria-label="Like" className="flex flex-col items-center gap-1 group">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-transform active:scale-90 ${currentLike.liked ? 'bg-rose-500 text-white' : 'bg-black/40 text-white'}`}>
            <Heart className={`w-6 h-6 ${currentLike.liked ? 'fill-current scale-110' : ''}`} />
          </div>
          <span className="text-xs font-bold text-white shadow-black drop-shadow-md">
            {currentLike.count >= 1000 ? `${(currentLike.count / 1000).toFixed(1)}K` : currentLike.count}
          </span>
        </button>

        <button onClick={() => onOpenComments(reel.id)} aria-label="Comments" className="flex flex-col items-center gap-1 group active:scale-90 transition-transform">
          <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-md text-white">
            <MessageCircle className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-white shadow-black drop-shadow-md">{reel.comments}</span>
        </button>

        <button
          type="button"
          onClick={() => onSave(reel.id)}
          className={`flex flex-col items-center gap-1 group active:scale-90 transition-transform ${isSaved ? 'text-brand-caribbeanSea' : 'text-white'}`}
          aria-label={isSaved ? 'Unsave reel' : 'Save reel'}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${isSaved ? 'bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/40' : 'bg-black/40 text-white'}`}>
            <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-brand-caribbeanSea' : ''}`} />
          </div>
          <span className="text-[10px] font-medium shadow-black drop-shadow-md">{isSaved ? 'Saved' : 'Save'}</span>
        </button>

        {reel.captions && (
          <button
            type="button"
            onClick={() => setCaptionsEnabled(prev => !prev)}
            aria-label={captionsEnabled ? 'Turn off subtitles' : 'Turn on subtitles'}
            className={`flex flex-col items-center gap-1 group active:scale-90 transition-transform ${captionsEnabled ? 'text-brand-sunriseCoral' : 'text-white/60'}`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${captionsEnabled ? 'bg-brand-sunriseCoral/20 border border-brand-sunriseCoral/40 text-brand-sunriseCoral' : 'bg-black/40 text-white'}`}>
              <Subtitles className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold shadow-black drop-shadow-md">{captionsEnabled ? 'CC On' : 'CC Off'}</span>
          </button>
        )}

        <button onClick={() => onOpenShare(reel.id)} aria-label="Share" className="flex flex-col items-center gap-1 group active:scale-90 transition-transform">
          <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-md text-white">
            <Share2 className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-white shadow-black drop-shadow-md">Share</span>
        </button>

        <Link
          href={`/messages?u=${encodeURIComponent(reel.handle)}`}
          aria-label={`Message ${reel.creator}`}
          className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-md text-white hover:bg-brand-caribbeanSea/30 hover:text-brand-caribbeanSea transition-colors">
            <MessageSquare className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-white shadow-black drop-shadow-md">Message</span>
        </Link>

        <div className="relative mt-2">
          <Link href={`/profile/${reel.handle}`} aria-label="Creator Profile">
            <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-brand-twilight flex items-center justify-center">
              <span className="text-lg">🌴</span>
            </div>
          </Link>
          <button 
            onClick={handleToggleFollow} 
            aria-label={isFollowed ? 'Unfollow' : 'Follow'}
            className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-white border-2 border-black ${isFollowed ? 'bg-brand-caribbeanSea' : 'bg-rose-500'}`}
          >
            {isFollowed ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Caribbean Dialect Subtitle Overlay */}
      <ReelSubtitleOverlay
        currentTime={currentTime}
        captions={reel.captions}
        isEnabled={captionsEnabled}
        onToggleEnabled={() => setCaptionsEnabled((prev) => !prev)}
      />

      {/* Bottom Left Info */}

      <div className="absolute left-4 bottom-6 right-20 z-20 flex flex-col gap-2">
        <Link href={`/profile/${reel.handle}`} className="flex items-center gap-2">
          <span className="text-base font-bold text-white drop-shadow-md">{reel.creator}</span>
          <span className="text-sm font-medium text-white/80 drop-shadow-md">@{reel.handle}</span>
        </Link>
        
        <div className="text-sm text-white drop-shadow-md cursor-pointer" onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}>
          <p className={isCaptionExpanded ? '' : 'line-clamp-2'}>{reel.title}</p>
        </div>
        
        {reel.location && (
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-xs font-medium text-white border border-white/10">
              📍 {reel.location}
            </span>
            <span className="px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-xs font-medium text-brand-goldenHour border border-white/10">
              Caribbean Culture
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-2 mt-2">
          <Disc className="w-5 h-5 text-white animate-spin" style={{ animationDuration: '4s' }} />
          <span className="text-sm font-medium text-white drop-shadow-md truncate">{reel.sound}</span>
        </div>
        {reel.sound && (
          <UseThisSoundButton soundId={reel.soundId} soundTitle={reel.sound} className="mt-1" />
        )}
      </div>
    </div>
  );
}

export default function ReelsFeedViewer({ initialReels, user }: ReelsFeedViewerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get('tab') || 'for_you';
  
  const effectiveReels = initialReels || [];
  const [reels, setReels] = useState<ReelItem[]>(effectiveReels);
  const [isMuted, setIsMuted] = useState(true);
  const [activeReelId, setActiveReelId] = useState<string | null>(effectiveReels[0]?.id || null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    setReels(initialReels || []);
    if (initialReels && initialReels.length > 0) {
      setActiveReelId(initialReels[0].id);
    } else {
      setActiveReelId(null);
    }
  }, [initialReels]);

  const [likesState, setLikesState] = useState<Record<string, { count: number; liked: boolean }>>(() => {
    const initial: Record<string, { count: number; liked: boolean }> = {};
    for (const r of effectiveReels) {
      const numeric = parseInt(r.likes.replace(/[^0-9]/g, ''), 10) || 0;
      initial[r.id] = { count: numeric, liked: r.initialLiked ?? false };
    }
    return initial;
  });

  const [followingState, setFollowingState] = useState<Record<string, boolean>>({});
  const [savedReels, setSavedReels] = useState<Set<string>>(new Set());

  const handleSaveReel = async (reelId: string) => {
    const isSaved = savedReels.has(reelId);
    setSavedReels(prev => {
      const next = new Set(prev);
      if (isSaved) next.delete(reelId); else next.add(reelId);
      return next;
    });
    if (isSaved) {
      await unsaveReelAction(reelId);
    } else {
      await saveReelAction(reelId);
    }
  };

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [activeCommentsReelId, setActiveCommentsReelId] = useState<string | null>(null);
  const [commentsByReel, setCommentsByReel] = useState<Record<string, CommentItem[]>>({});
  const [newCommentText, setNewCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeShareReelId, setActiveShareReelId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const options = { root: null, rootMargin: '0px', threshold: 0.6 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('data-reel-id');
          if (id) {
            setActiveReelId(id);
            void recordReelViewAction(id, 3);
          }
        }
      });
    }, options);
    const elements = document.querySelectorAll('.reel-container');
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [reels]);

  const toggleMute = useCallback(() => setIsMuted(prev => !prev), []);

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set('tab', tab);
    router.push(`?${params.toString()}`);
  };

  const handleOpenComments = (reelId: string) => {
    setActiveCommentsReelId(reelId);
    setIsCommentsOpen(true);
  };

  const handleOpenShare = (reelId: string) => {
    setActiveShareReelId(reelId);
    setIsShareModalOpen(true);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeCommentsReelId) return;
    setIsPostingComment(true);
    const newComment: CommentItem = {
      id: `c_${Date.now()}`,
      user: user?.displayName ?? 'Caribbean Friend',
      handle: user?.username ?? 'caribbean_guest',
      avatar: '🌴',
      text: newCommentText.trim(),
      time: 'Just now',
    };
    setCommentsByReel(prev => ({
      ...prev,
      [activeCommentsReelId]: [newComment, ...(prev[activeCommentsReelId] ?? [])],
    }));
    setNewCommentText('');
    await postReelCommentAction(activeCommentsReelId, newComment.text);
    setIsPostingComment(false);
  };

  const handleCopyShareLink = () => {
    const url = typeof window !== 'undefined' && activeShareReelId ? `${window.location.origin}/reels?id=${activeShareReelId}` : '';
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
    if (activeShareReelId) void recordReelShareAction(activeShareReelId, 'copy_link');
  };

  const tabs = [
    { id: 'for_you', label: 'For You' },
    { id: 'following', label: 'Following' },
    { id: 'caribbean', label: 'Caribbean' },
    { id: 'communities', label: 'Communities' },
  ];

  if (reels.length === 0) {
    return (
      <div className="flex flex-col h-[100dvh] w-full bg-[#0b0811] text-white relative">
        {/* Top Nav Tabs */}
        <div className="flex-none h-16 w-full flex items-center justify-between z-30 px-6 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                aria-label={`Tab ${tab.label}`}
                className={`text-sm font-bold transition-colors ${currentTab === tab.id ? 'text-white border-b-2 border-brand-sunriseCoral pb-1' : 'text-white/60 hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-brand-sunriseCoral text-slate-950 font-black text-xs rounded-xl hover:opacity-90 flex items-center gap-1.5 transition-all shadow-md shadow-brand-sunriseCoral/20"
          >
            <Plus className="w-4 h-4" /> Create Reel
          </button>
        </div>

        {/* Premium Intentional Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-500/20 to-brand-sunriseCoral/20 border border-brand-sunriseCoral/40 flex items-center justify-center text-brand-sunriseCoral shadow-xl shadow-brand-sunriseCoral/10">
            <Video className="w-10 h-10" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-black text-white">No Reels yet</h2>
            <p className="text-xs sm:text-sm text-brand-sandstone/75 leading-relaxed">
              Be the first creator to share a Reel. Broadcast short moments, cultural vibes, and dialect stories to the Caribbean &amp; diaspora.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-brand-sunriseCoral to-rose-500 text-slate-950 font-black text-xs rounded-xl hover:opacity-95 transition-all shadow-lg shadow-brand-sunriseCoral/30 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Reel
            </button>
            <Link
              href="/sounds"
              className="px-5 py-3 bg-white/5 border border-white/10 text-white font-bold text-xs rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <Music className="w-4 h-4 text-brand-goldenHour" /> Caribbean Sounds
            </Link>
          </div>
        </div>

        <CreateReelModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          user={user}
        />
      </div>
    );
  }

  const currentComments = activeCommentsReelId ? (commentsByReel[activeCommentsReelId] ?? []) : [];

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-black relative">
      {/* Top Nav Tabs */}
      <div className="flex-none h-16 w-full flex items-center justify-between z-30 px-6 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0">
        <div className="flex items-center gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              aria-label={`Tab ${tab.label}`}
              className={`text-sm font-bold transition-colors ${currentTab === tab.id ? 'text-white border-b-2 border-brand-sunriseCoral pb-1' : 'text-white/60 hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-brand-sunriseCoral text-slate-950 font-black text-xs rounded-xl hover:opacity-90 flex items-center gap-1.5 transition-all shadow-md shadow-brand-sunriseCoral/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Reel
        </button>
      </div>

      {/* Snap Scroll Container */}
      <div className="flex-1 w-full h-full overflow-y-scroll snap-y snap-mandatory overscroll-none scrollbar-hide" style={{ touchAction: 'pan-y' }}>
        {reels.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center z-10 relative">
            <div className="surface-card rounded-3xl p-8 sm:p-10 max-w-md w-full border border-white/15 shadow-2xl space-y-5 bg-[#0D1322]/80 backdrop-blur-xl">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <Video className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">No Reels in this stream yet</h2>
                <p className="text-sm text-brand-sandstone/80 leading-relaxed">
                  Be the first creator to share short moments, carnival rhythm stems, and island vibes with the global diaspora.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:brightness-110 text-slate-950 font-black px-6 py-3 rounded-2xl text-sm transition-all shadow-md shadow-rose-500/20 min-h-[44px] cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Create your first Reel
                </button>
                <Link
                  href="/feeds"
                  className="w-full sm:w-auto inline-flex items-center justify-center border border-white/20 hover:bg-white/10 text-white font-bold px-5 py-3 rounded-2xl text-sm transition-all min-h-[44px]"
                >
                  Explore Feeds
                </Link>
              </div>
            </div>
          </div>
        ) : (
          reels.map((reel, idx) => {
            const isActive = activeReelId === reel.id;
            const isNext = reels[idx - 1]?.id === activeReelId || reels[idx + 1]?.id === activeReelId;
            return (
              <ReelCard
                key={reel.id}
                reel={reel}
                isActive={isActive}
                isNext={isNext}
                isMuted={isMuted}
                toggleMute={toggleMute}
                user={user}
                likesState={likesState}
                setLikesState={setLikesState}
                followingState={followingState}
                setFollowingState={setFollowingState}
                onOpenComments={handleOpenComments}
                onOpenShare={handleOpenShare}
                isSaved={savedReels.has(reel.id)}
                onSave={handleSaveReel}
              />
            );
          })
        )}
      </div>

      {/* Slide-over Comments Drawer */}
      {isCommentsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-[#0D1322] border-l border-slate-800 h-full p-5 flex flex-col justify-between shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-brand-sandstone flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-brand-caribbeanSea" /> Comments ({currentComments.length})
              </h3>
              <button
                onClick={() => setIsCommentsOpen(false)}
                aria-label="Close Comments"
                className="w-7 h-7 rounded-full bg-brand-dusk border border-slate-800 flex items-center justify-center text-brand-sandstone/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {currentComments.length === 0 ? (
                <p className="text-xs text-brand-sandstone/40 text-center py-10">No comments yet. Start the conversation!</p>
              ) : (
                currentComments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-2.5 p-2 rounded-xl bg-brand-twilight/50 text-xs">
                    <span className="text-xl">{comment.avatar}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">@{comment.handle}</span>
                        <span className="text-[10px] text-brand-sandstone/40">{comment.time}</span>
                      </div>
                      <p className="text-slate-300 mt-1">{comment.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handlePostComment} className="pt-3 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Add a Caribbean comment..."
                aria-label="Comment input"
                className="flex-1 bg-brand-twilight border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                aria-label="Send Comment"
                disabled={isPostingComment || !newCommentText.trim()}
                className="bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-slate-950 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1322] border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-brand-sandstone flex items-center gap-2">
                <Share2 className="w-4 h-4 text-brand-sunriseCoral" /> Share Caribbean Reel
              </h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                aria-label="Close Share Modal"
                className="w-7 h-7 rounded-full bg-brand-dusk border border-slate-800 flex items-center justify-center text-brand-sandstone/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300">Share this short moment with diaspora communities and friends.</p>
            <div className="space-y-2">
              <button
                onClick={handleCopyShareLink}
                aria-label="Copy Link"
                className="w-full bg-brand-twilight border border-slate-700 hover:border-slate-500 text-slate-200 font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? 'Link Copied to Clipboard!' : 'Copy Reel Link'}
              </button>

              {(() => {
                const targetReel = reels.find((r) => r.id === activeShareReelId);
                if (!targetReel?.handle) return null;
                return (
                  <Link
                    href={`/messages?u=${encodeURIComponent(targetReel.handle)}`}
                    className="w-full bg-brand-caribbeanSea/20 border border-brand-caribbeanSea/40 hover:bg-brand-caribbeanSea/30 text-brand-caribbeanSea font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Message @{targetReel.handle}
                  </Link>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <CreateReelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        user={user}
      />
    </div>
  );
}
