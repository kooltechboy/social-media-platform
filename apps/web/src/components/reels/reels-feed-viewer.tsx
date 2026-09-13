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

  useEffect(() => {
    if (isActive) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
      }
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive]);

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
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
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
  const displayUrl = reel.videoUrl?.startsWith('http') ? reel.videoUrl : reel.videoUrl ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${reel.videoUrl}` : undefined;

  return (
    <div className="h-full w-full snap-start snap-always relative overflow-hidden bg-black reel-container" data-reel-id={reel.id}>
      {/* Video or Fallback */}
      <div onClick={handleTogglePlay} className="absolute inset-0 cursor-pointer flex items-center justify-center">
        {displayUrl ? (
          <video
            ref={videoRef}
            src={displayUrl}
            preload={preloadState}
            playsInline
            loop
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-t ${reel.gradient} flex items-center justify-center`}>
             <div className="w-20 h-20 rounded-full bg-black/40 flex items-center justify-center text-white">
                <Play className="w-8 h-8 fill-current translate-x-1" />
             </div>
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

export const DEFAULT_CARIBBEAN_REELS: ReelItem[] = [
  {
    id: 'sample-reel-jam-1',
    title: 'Wah Gwaan Kingston! Downtown street vibes and fresh riddims 🇯🇲',
    creator: 'Zion Marley',
    handle: 'zionvibes',
    views: '42.5K views',
    likes: '4.8K',
    comments: '312',
    sound: 'Kingston Dubplate Session — Original Sound',
    location: 'Kingston, Jamaica 🇯🇲',
    duration: '0:15',
    gradient: 'from-amber-900/60 via-slate-900 to-[#110D17]',
    captions: {
      id: 'captions-jam-1',
      label: 'Jamaican Patois (Original)',
      language: 'jam',
      dialect: 'jam',
      cues: [
        {
          id: 'jam-1',
          startTimeSec: 0.1,
          endTimeSec: 3.2,
          text: 'Wah gwaan fam! Mi deh yah inna downtown Kingston today.',
          dialect: 'jam',
          translations: {
            en: "What's going on family! I'm right here in downtown Kingston today.",
          },
        },
        {
          id: 'jam-2',
          startTimeSec: 3.3,
          endTimeSec: 7.0,
          text: 'Di whole place criss, riddim loud, and everybody hold a vibes!',
          dialect: 'jam',
          translations: {
            en: 'The whole place is great, the rhythm is loud, and everybody is chilling!',
          },
        },
        {
          id: 'jam-3',
          startTimeSec: 7.1,
          endTimeSec: 12.0,
          text: 'Soon come wit di fresh new release pon TUKUBI, big up unnu!',
          dialect: 'jam',
          translations: {
            en: "I'll be right back with the fresh new release on TUKUBI, shoutout to you all!",
          },
        },
      ],
    },
  },
  {
    id: 'sample-reel-ht-1',
    title: 'Bèl Solèy Pòtoprens — Kilti ak Mizik Kreyòl 🇭🇹',
    creator: 'Fabienne Jean',
    handle: 'fabienne_ayiti',
    views: '28.1K views',
    likes: '3.2K',
    comments: '184',
    sound: 'Koudjay Rara Beat — Live Roots',
    location: 'Pòtoprens, Ayiti 🇭🇹',
    duration: '0:12',
    gradient: 'from-blue-900/60 via-slate-900 to-[#110D17]',
    captions: {
      id: 'captions-ht-1',
      label: 'Kreyòl Ayisyen (Original)',
      language: 'ht',
      dialect: 'ht',
      cues: [
        {
          id: 'ht-1',
          startTimeSec: 0.1,
          endTimeSec: 3.5,
          text: "Sak pase tout moun! Nou la n'ap boule nan bèl chalè sa a.",
          dialect: 'ht',
          translations: {
            en: "What's up everyone! We're here doing great in this beautiful warmth.",
            fr: "Qu'est-ce qui se passe tout le monde! On est là, tout va bien dans cette belle chaleur.",
          },
        },
        {
          id: 'ht-2',
          startTimeSec: 3.6,
          endTimeSec: 7.5,
          text: 'Lakay se lakay, mwen renmen nou tout zanmi m yo!',
          dialect: 'ht',
          translations: {
            en: 'Home is home, I love you all my friends!',
            fr: "Chez soi c'est chez soi, je vous aime tous mes amis!",
          },
        },
        {
          id: 'ht-3',
          startTimeSec: 7.6,
          endTimeSec: 11.5,
          text: 'An nou ale pataje bèl enèji kreyòl sa a ansanm!',
          dialect: 'ht',
          translations: {
            en: "Let's go share this beautiful creole energy together!",
            fr: 'Allons partager cette belle énergie créole ensemble!',
          },
        },
      ],
    },
  },
  {
    id: 'sample-reel-pap-1',
    title: 'Dushi Kòrsou — Sunset Vibes na Willemstad 🇨🇼',
    creator: 'Dangelo Tromp',
    handle: 'dangelo_curacao',
    views: '19.4K views',
    likes: '2.1K',
    comments: '97',
    sound: 'Tumba Festival Stems — Antillean Rhythm',
    location: 'Willemstad, Kòrsou 🇨🇼',
    duration: '0:14',
    gradient: 'from-teal-900/60 via-slate-900 to-[#110D17]',
    captions: {
      id: 'captions-pap-1',
      label: 'Papiamentu (Original)',
      language: 'pap',
      dialect: 'pap',
      cues: [
        {
          id: 'pap-1',
          startTimeSec: 0.1,
          endTimeSec: 3.8,
          text: 'Con ta bay tur hende! Bon bini na Kòrsou dushi yiu.',
          dialect: 'pap',
          translations: {
            en: 'How is it going everyone! Welcome to Curaçao sweet darling.',
            es: '¿Cómo les va a todos! Bienvenidos a Curazao mi gente linda.',
          },
        },
        {
          id: 'pap-2',
          startTimeSec: 3.9,
          endTimeSec: 7.8,
          text: 'Tur kos bon aki na warda di solo, hopi dushi bida!',
          dialect: 'pap',
          translations: {
            en: 'All is well here watching the sunset, such a sweet beautiful life!',
            es: 'Todo bien aquí contemplando la puesta de sol, ¡qué vida tan hermosa!',
          },
        },
        {
          id: 'pap-3',
          startTimeSec: 7.9,
          endTimeSec: 13.0,
          text: 'Masha danki pa tur e sosten, pasa un bon dia!',
          dialect: 'pap',
          translations: {
            en: 'Thank you very much for all the support, have a wonderful day!',
            es: '¡Muchas gracias por todo el apoyo, que tengan un lindo día!',
          },
        },
      ],
    },
  },
];

export default function ReelsFeedViewer({ initialReels, user }: ReelsFeedViewerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get('tab') || 'for_you';
  
  const effectiveReels = initialReels && initialReels.length > 0 ? initialReels : DEFAULT_CARIBBEAN_REELS;
  const [reels, setReels] = useState<ReelItem[]>(effectiveReels);
  const [isMuted, setIsMuted] = useState(true);
  const [activeReelId, setActiveReelId] = useState<string | null>(effectiveReels[0]?.id || null);

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

  if (reels.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-black p-4 text-center">
        <Video className="w-12 h-12 text-brand-sunriseCoral mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">No Reels yet. Be the first Caribbean creator! 🌴</h2>
        <Link href="/create?mode=reel" className="mt-4 px-6 py-3 bg-brand-sunriseCoral text-black font-bold rounded-full hover:opacity-90">
          Create Reel
        </Link>
      </div>
    );
  }

  const currentComments = activeCommentsReelId ? (commentsByReel[activeCommentsReelId] ?? []) : [];
  const tabs = [
    { id: 'for_you', label: 'For You' },
    { id: 'following', label: 'Following' },
    { id: 'caribbean', label: 'Caribbean' },
    { id: 'trending', label: 'Trending' },
    { id: 'sounds', label: 'Sounds' },
  ];

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-black relative">
      {/* Top Nav Tabs */}
      <div className="flex-none h-16 w-full flex items-center justify-center gap-6 z-30 px-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0">
        {tabs.map(tab => (
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

      {/* Snap Scroll Container */}
      <div className="flex-1 w-full h-full overflow-y-scroll snap-y snap-mandatory overscroll-none scrollbar-hide" style={{ touchAction: 'pan-y' }}>
        {reels.map((reel, idx) => {
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
        })}
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
    </div>
  );
}
