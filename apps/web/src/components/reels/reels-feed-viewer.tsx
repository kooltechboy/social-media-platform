'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Video,
  Music,
  Heart,
  MessageCircle,
  Share2,
  Wallet,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Flame,
  ChevronUp,
  ChevronDown,
  Plus,
  Send,
  X,
  Copy,
  Check,
  UserPlus,
  UserCheck,
  Disc,
} from 'lucide-react';
import {
  toggleReelLikeAction,
  postReelCommentAction,
  recordReelShareAction,
  recordReelViewAction,
} from '../../lib/media/reel-actions';
import { followAction, unfollowAction } from '../../lib/social/profile-actions';
import CreateReelModal from './create-reel-modal';

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

export default function ReelsFeedViewer({ initialReels, user }: ReelsFeedViewerProps) {
  const [reels, setReels] = useState<ReelItem[]>(initialReels);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [durationTime, setDurationTime] = useState('0:30');

  // Engagement States per Reel
  const [likesState, setLikesState] = useState<Record<string, { count: number; liked: boolean }>>(() => {
    const initial: Record<string, { count: number; liked: boolean }> = {};
    for (const r of initialReels) {
      const numeric = parseInt(r.likes.replace(/[^0-9]/g, ''), 10) * (r.likes.includes('K') ? 1000 : 1) || 1200;
      initial[r.id] = { count: numeric, liked: r.initialLiked ?? false };
    }
    return initial;
  });

  const [followingState, setFollowingState] = useState<Record<string, boolean>>({});

  // Slide-over sheets & Modals
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentsByReel, setCommentsByReel] = useState<Record<string, CommentItem[]>>({
    'reel-1': [
      { id: 'c1', user: 'Marcus Garvey Jr', handle: 'marcusg', avatar: '🇯🇲', text: 'Pure vibes! That costume wirework is unmatched 🔥', time: '2h ago' },
      { id: 'c2', user: 'Soca Queen', handle: 'trinisoca', avatar: '🇹🇹', text: 'Road March contender right here!! See you on the avenue! 🎭', time: '1h ago' },
    ],
    'reel-2': [
      { id: 'c3', user: 'Tanya Foodie', handle: 'tanyaeats', avatar: '🇧🇧', text: 'You can smell the pimento wood through the screen! 🍗', time: '4h ago' },
    ],
    'reel-3': [
      { id: 'c4', user: 'Carlos Perez', handle: 'carlitos', avatar: '🇩🇴', text: 'El Malecón siempre tiene la mejor vibra de bachata 🇩🇴', time: '3h ago' },
    ],
  });
  const [newCommentText, setNewCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState('5.00');
  const [tipSuccess, setTipSuccess] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const activeReel = reels[currentIndex] || reels[0];

  // Auto record view on reel switch
  useEffect(() => {
    if (activeReel?.id) {
      void recordReelViewAction(activeReel.id, 3);
    }
    setProgress(0);
    setIsPlaying(true);
  }, [currentIndex, activeReel?.id]);

  // Video progress timeupdate
  function handleTimeUpdate() {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 30;
      setProgress((cur / dur) * 100);

      const mins = Math.floor(cur / 60);
      const secs = Math.floor(cur % 60);
      setCurrentTime(`${mins}:${secs < 10 ? '0' : ''}${secs}`);

      const dMins = Math.floor(dur / 60);
      const dSecs = Math.floor(dur % 60);
      setDurationTime(`${dMins}:${dSecs < 10 ? '0' : ''}${dSecs}`);
    }
  }

  function handleVideoEnded() {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      void videoRef.current.play();
    }
  }

  function togglePlayPause() {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        void videoRef.current.play();
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  }

  function toggleMute() {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  }

  function handleNextReel() {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0); // loop around
    }
  }

  function handlePrevReel() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(reels.length - 1);
    }
  }

  async function handleToggleLike() {
    const current = likesState[activeReel.id] || { count: 1200, liked: false };
    const nextLiked = !current.liked;
    const nextCount = nextLiked ? current.count + 1 : Math.max(0, current.count - 1);

    // Optimistic UI update
    setLikesState((prev) => ({
      ...prev,
      [activeReel.id]: { count: nextCount, liked: nextLiked },
    }));

    await toggleReelLikeAction(activeReel.id);
  }

  async function handleToggleFollow() {
    const isFollowed = followingState[activeReel.handle] ?? false;
    const nextFollow = !isFollowed;

    setFollowingState((prev) => ({
      ...prev,
      [activeReel.handle]: nextFollow,
    }));

    if (activeReel.creatorId) {
      if (nextFollow) {
        await followAction(activeReel.creatorId);
      } else {
        await unfollowAction(activeReel.creatorId);
      }
    }
  }

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setIsPostingComment(true);
    const newComment: CommentItem = {
      id: `c_${Date.now()}`,
      user: user?.displayName ?? 'Caribbean Friend',
      handle: user?.username ?? 'caribbean_guest',
      avatar: '🌴',
      text: newCommentText.trim(),
      time: 'Just now',
    };

    setCommentsByReel((prev) => ({
      ...prev,
      [activeReel.id]: [newComment, ...(prev[activeReel.id] ?? [])],
    }));

    setNewCommentText('');
    await postReelCommentAction(activeReel.id, newComment.text);
    setIsPostingComment(false);
  }

  function handleCopyShareLink() {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/reels?id=${activeReel.id}` : '';
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
    void recordReelShareAction(activeReel.id, 'copy_link');
  }

  function handleNativeShare() {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/reels?id=${activeReel.id}` : '';
    if (navigator.share) {
      navigator
        .share({
          title: activeReel.title,
          text: `Check out this Caribbean reel from @${activeReel.handle} on Antilia!`,
          url,
        })
        .then(() => recordReelShareAction(activeReel.id, 'native_share'))
        .catch(() => {});
    } else {
      handleCopyShareLink();
    }
  }

  function handleSendTip() {
    setTipSuccess(true);
    setTimeout(() => {
      setTipSuccess(false);
      setIsTipModalOpen(false);
    }, 1500);
  }

  if (!activeReel) {
    return (
      <div className="w-full flex flex-col items-center gap-6">
        {/* Action Navigation Header */}
        <div className="w-full flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-brand-sandstone flex items-center gap-2.5">
              <Video className="w-6 h-6 text-rose-500" /> Caribbean Reels &amp; Shorts
            </h1>
            <p className="text-xs text-brand-sandstone/60 mt-1">
              Immersive Caribbean short video stream, rhythm stems, and creator monetization.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sounds"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-brand-dusk border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-colors"
            >
              <Music className="w-4 h-4 text-rose-400" /> Browse Sounds
            </Link>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-rose-500 to-brand-goldenHour hover:from-rose-400 hover:to-brand-goldenHour text-slate-950 font-black px-4 py-2 rounded-2xl text-xs transition-all shadow-md shadow-rose-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Reel
            </button>
          </div>
        </div>

        {/* Empty State */}
        <div className="glass rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4 border border-rose-500/20 my-12">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <Video className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-white">No Reels Published Yet</h3>
          <p className="text-xs text-brand-sandstone/70 leading-relaxed">
            Be the first creator to share your Caribbean rhythm, carnival mas, or island short video!
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-brand-goldenHour text-slate-950 font-bold text-xs hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Create the First Reel
          </button>
        </div>

        {/* Create Reel Modal */}
        {isCreateModalOpen && (
          <CreateReelModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            user={user}
          />
        )}
      </div>
    );
  }

  const currentLike = likesState[activeReel.id] || { count: 1200, liked: false };
  const currentComments = commentsByReel[activeReel.id] ?? [];
  const isFollowing = followingState[activeReel.handle] ?? false;

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {/* Action Navigation Header */}
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-brand-sandstone flex items-center gap-2.5">
            <Video className="w-6 h-6 text-rose-500" /> Caribbean Reels &amp; Shorts
          </h1>
          <p className="text-xs text-brand-sandstone/60 mt-1">
            Immersive Caribbean short video stream, rhythm stems, and creator monetization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/sounds"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-brand-dusk border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-colors"
          >
            <Music className="w-4 h-4 text-rose-400" /> Browse Sounds
          </Link>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-rose-500 to-brand-goldenHour hover:from-rose-400 hover:to-brand-goldenHour text-slate-950 font-black px-4 py-2 rounded-2xl text-xs transition-all shadow-md shadow-rose-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Reel
          </button>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start justify-center">
        {/* Main Reel Viewport Container (Col 7) */}
        <div className="lg:col-span-7 flex flex-col items-center relative">
          <div className="w-full max-w-sm bg-black border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative h-[680px] flex flex-col justify-between select-none">
            {/* Background Simulated Video or Actual Video Stream */}
            <div
              onClick={togglePlayPause}
              className={`absolute inset-0 bg-gradient-to-t ${activeReel.gradient} cursor-pointer flex items-center justify-center`}
            >
              {activeReel.videoUrl ? (
                <video
                  ref={videoRef}
                  src={activeReel.videoUrl}
                  playsInline
                  autoPlay
                  loop
                  muted={isMuted}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleVideoEnded}
                  className="w-full h-full object-cover"
                />
              ) : (
                /* Cinematic Visual Wave Overlay */
                <div className="text-center space-y-4 px-6 relative z-0">
                  <div className="w-20 h-20 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-brand-sandstone shadow-2xl shadow-rose-500/20 backdrop-blur-md">
                    <Disc className="w-10 h-10 text-rose-400 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-brand-caribbeanSea uppercase tracking-wider block">
                      {activeReel.location}
                    </span>
                    <p className="text-xs font-semibold text-slate-300 line-clamp-2">{activeReel.title}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tap to Play/Pause indicator flash */}
            {!isPlaying && (
              <div
                onClick={togglePlayPause}
                className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-rose-500/80 text-slate-950 flex items-center justify-center shadow-xl">
                  <Play className="w-8 h-8 fill-current translate-x-0.5" />
                </div>
              </div>
            )}

            {/* Top Bar Controls */}
            <div className="p-4 flex items-center justify-between z-20 relative bg-gradient-to-b from-black/80 to-transparent">
              <span className="text-[11px] font-black px-3 py-1 rounded-full bg-brand-twilight/80 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 backdrop-blur-md">
                <Flame className="w-3.5 h-3.5 fill-current" /> CARIBBEAN REELS
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white border border-slate-700/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </button>
                <span className="text-xs font-bold text-slate-300 bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-md border border-slate-700/60">
                  {activeReel.views}
                </span>
              </div>
            </div>

            {/* Up/Down Scroll Navigation Arrows Floating */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
              <button
                onClick={handlePrevReel}
                title="Previous Reel"
                className="w-9 h-9 rounded-full bg-black/60 hover:bg-rose-500 hover:text-slate-950 text-white border border-slate-700/60 flex items-center justify-center backdrop-blur-md transition-all shadow-lg"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextReel}
                title="Next Reel"
                className="w-9 h-9 rounded-full bg-black/60 hover:bg-rose-500 hover:text-slate-950 text-white border border-slate-700/60 flex items-center justify-center backdrop-blur-md transition-all shadow-lg"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Right Action Rail */}
            <div className="absolute right-4 bottom-20 flex flex-col items-center gap-4 z-20">
              {/* Like Button */}
              <button
                onClick={handleToggleLike}
                className="flex flex-col items-center gap-1 text-slate-200 group transition-transform active:scale-90"
              >
                <div
                  className={`w-11 h-11 rounded-full border flex items-center justify-center backdrop-blur-md transition-all ${
                    currentLike.liked
                      ? 'bg-rose-500 border-rose-400 text-slate-950 shadow-lg shadow-rose-500/40 scale-110'
                      : 'bg-black/60 border-slate-700/80 text-rose-500 hover:scale-105'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${currentLike.liked ? 'fill-current' : 'fill-rose-500/20'}`} />
                </div>
                <span className="text-[11px] font-bold text-slate-200">
                  {currentLike.count >= 1000 ? `${(currentLike.count / 1000).toFixed(1)}K` : currentLike.count}
                </span>
              </button>

              {/* Comments Button */}
              <button
                onClick={() => setIsCommentsOpen(true)}
                className="flex flex-col items-center gap-1 text-slate-200 hover:text-brand-caribbeanSea transition-colors group"
              >
                <div className="w-11 h-11 rounded-full bg-black/60 border border-slate-700/80 flex items-center justify-center backdrop-blur-md group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-5 h-5 text-brand-caribbeanSea" />
                </div>
                <span className="text-[11px] font-bold text-slate-200">{currentComments.length}</span>
              </button>

              {/* Share Button */}
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex flex-col items-center gap-1 text-slate-200 hover:text-brand-sunriseCoral transition-colors group"
              >
                <div className="w-11 h-11 rounded-full bg-black/60 border border-slate-700/80 flex items-center justify-center backdrop-blur-md group-hover:scale-105 transition-transform">
                  <Share2 className="w-5 h-5 text-brand-sunriseCoral" />
                </div>
                <span className="text-[11px] font-bold text-slate-200">Share</span>
              </button>

              {/* SpotPay Tip Button */}
              <button
                onClick={() => setIsTipModalOpen(true)}
                className="flex flex-col items-center gap-1 text-brand-goldenHour hover:text-brand-goldenHour transition-colors group"
              >
                <div className="w-11 h-11 rounded-full bg-brand-goldenHour/20 border border-brand-goldenHour/50 flex items-center justify-center backdrop-blur-md group-hover:scale-110 transition-transform shadow-lg shadow-brand-goldenHour/20">
                  <Wallet className="w-5 h-5 text-brand-goldenHour" />
                </div>
                <span className="text-[10px] font-black uppercase text-brand-goldenHour">Tip</span>
              </button>
            </div>

            {/* Bottom Caption & Sound Attribution Overlay */}
            <div className="p-4 z-20 relative space-y-2 bg-gradient-to-t from-black via-black/80 to-transparent max-w-[80%]">
              {/* Creator info & Follow */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${activeReel.handle}`}
                  className="text-sm font-black text-brand-sandstone hover:underline"
                >
                  @{activeReel.handle}
                </Link>
                <button
                  onClick={handleToggleFollow}
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-all flex items-center gap-1 ${
                    isFollowing
                      ? 'bg-brand-twilight text-brand-caribbeanSea border border-brand-caribbeanSea/40'
                      : 'bg-white hover:bg-slate-200 text-slate-950'
                  }`}
                >
                  {isFollowing ? <UserCheck className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>

              {/* Caption */}
              <p className="text-xs text-slate-200 leading-snug font-medium line-clamp-2">
                {activeReel.title}
              </p>

              {/* Sound Badge with Deep Link */}
              <Link
                href={`/sounds?search=${encodeURIComponent(activeReel.sound)}`}
                className="inline-flex items-center gap-1.5 text-xs text-rose-300 hover:text-rose-200 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-full backdrop-blur-md transition-colors"
              >
                <Music className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-semibold truncate max-w-[200px]">{activeReel.sound}</span>
              </Link>
            </div>

            {/* Video Progress Scrubber Line */}
            <div className="w-full h-1 bg-slate-800 relative z-30">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-brand-goldenHour transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Up Next & Trending Sounds (Col 5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Reel Playlist Queue */}
          <div className="bg-brand-dusk/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-sm text-brand-sandstone flex items-center justify-between uppercase tracking-wide">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-goldenHour" /> Caribbean Feed Queue
              </span>
              <span className="text-xs text-brand-sandstone/40 font-normal">
                {currentIndex + 1} of {reels.length}
              </span>
            </h3>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {reels.map((reel, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <div
                    key={reel.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all cursor-pointer group ${
                      isActive
                        ? 'bg-rose-500/15 border-rose-500/50 shadow-md'
                        : 'bg-brand-twilight/60 hover:bg-brand-dusk/90 border-slate-800/60'
                    }`}
                  >
                    <div className="w-14 h-16 rounded-xl bg-brand-dusk border border-slate-700 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-t ${reel.gradient}`} />
                      <Play
                        className={`w-4 h-4 z-10 fill-current group-hover:scale-110 transition-transform ${
                          isActive ? 'text-rose-400' : 'text-brand-sandstone'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <span className="text-[10px] font-bold text-brand-caribbeanSea block">{reel.location}</span>
                      <h4
                        className={`text-xs font-bold transition-colors line-clamp-1 ${
                          isActive ? 'text-rose-300' : 'text-slate-200 group-hover:text-rose-400'
                        }`}
                      >
                        {reel.title}
                      </h4>
                      <p className="text-[11px] text-brand-sandstone/40 truncate">
                        @{reel.handle} • {reel.views} views
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Sound Hub Preview */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/30 border border-rose-500/20 rounded-3xl p-5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-2">
                <Music className="w-4 h-4" /> Trending Sounds
              </h4>
              <Link href="/sounds" className="text-[11px] font-black text-rose-400 hover:underline">
                View All
              </Link>
            </div>
            <p className="text-xs text-slate-300">
              Use official stems and riddim tracks from Caribbean artists in your short videos.
            </p>
            <div className="space-y-2 pt-1">
              {[
                { id: 'sound-soca-01', track: 'Soca Monarch Anthem', artist: 'Machel & Kes', flag: '🇹🇹', count: '84.2K' },
                { id: 'sound-dancehall-02', track: 'Dutty Bass Riddim', artist: 'Shenseea', flag: '🇯🇲', count: '112.5K' },
                { id: 'sound-kompa-03', track: 'Gouyad Nuits d’Été', artist: 'Kai & Enposib', flag: '🇭🇹', count: '63.1K' },
              ].map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-brand-twilight/60 text-xs border border-slate-800/60"
                >
                  <div className="flex items-center gap-2">
                    <span>{s.flag}</span>
                    <div>
                      <p className="font-bold text-slate-200">{s.track}</p>
                      <p className="text-[10px] text-brand-sandstone/40">{s.artist}</p>
                    </div>
                  </div>
                  <Link
                    href={`/sounds?id=${s.id}`}
                    className="text-[10px] font-black text-rose-400 hover:bg-rose-500/20 px-2 py-1 rounded-lg border border-rose-500/30 transition-colors"
                  >
                    Use Sound
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
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
                className="w-7 h-7 rounded-full bg-brand-dusk border border-slate-800 flex items-center justify-center text-brand-sandstone/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comments List */}
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

            {/* Post Comment Input */}
            <form onSubmit={handlePostComment} className="pt-3 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Add a Caribbean comment..."
                className="flex-1 bg-brand-twilight border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
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
                className="w-7 h-7 rounded-full bg-brand-dusk border border-slate-800 flex items-center justify-center text-brand-sandstone/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">Share this short moment with diaspora communities and friends.</p>

            <div className="space-y-2">
              <button
                onClick={handleNativeShare}
                className="w-full bg-gradient-to-r from-rose-500 to-brand-sunriseCoral text-slate-950 font-black p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Share2 className="w-4 h-4" /> Share via Apps
              </button>

              <button
                onClick={handleCopyShareLink}
                className="w-full bg-brand-twilight border border-slate-700 hover:border-slate-500 text-slate-200 font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? 'Link Copied to Clipboard!' : 'Copy Reel Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SpotPay Tip Modal */}
      {isTipModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1322] border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-brand-sandstone flex items-center gap-2">
                <Wallet className="w-4 h-4 text-brand-goldenHour" /> Tip @{activeReel.handle}
              </h3>
              <button
                onClick={() => setIsTipModalOpen(false)}
                className="w-7 h-7 rounded-full bg-brand-dusk border border-slate-800 flex items-center justify-center text-brand-sandstone/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {tipSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2">
                <p className="text-sm font-bold text-emerald-400">🎉 Tip Sent Successfully!</p>
                <p className="text-xs text-brand-sandstone/60">
                  ${tipAmount} USD transferred to @{activeReel.handle} via SpotPay Ledger.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-300">
                  Direct double-entry ledger tip to support this Caribbean creator.
                </p>

                <div className="grid grid-cols-4 gap-2">
                  {['1.00', '5.00', '10.00', '25.00'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTipAmount(amt)}
                      className={`p-2 rounded-xl text-xs font-black border transition-all ${
                        tipAmount === amt
                          ? 'bg-brand-goldenHour text-slate-950 border-brand-goldenHour'
                          : 'bg-brand-twilight text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleSendTip}
                  className="w-full bg-gradient-to-r from-brand-goldenHour to-brand-sunriseCoral text-slate-950 font-black p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Wallet className="w-4 h-4" /> Send ${tipAmount} USD Tip
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create Reel Modal */}
      <CreateReelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        user={user}
      />
    </div>
  );
}
