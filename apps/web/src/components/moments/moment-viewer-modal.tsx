'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  type StoryData,
  recordStoryViewAction,
  deleteStoryAction,
} from '../../lib/social/actions';

interface MomentViewerModalProps {
  isOpen: boolean;
  stories: StoryData[];
  initialIndex?: number;
  onClose: () => void;
  onStoryDeleted?: (storyId: string) => void;
  currentUserId?: string;
}

const STORY_DURATION_MS = 5000;

export default function MomentViewerModal({
  isOpen,
  stories,
  initialIndex = 0,
  onClose,
  onStoryDeleted,
  currentUserId,
}: MomentViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const pausedProgressRef = useRef<number>(0);

  const currentStory = stories[currentIndex];

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setProgress(0);
    pausedProgressRef.current = 0;
  }, [initialIndex, isOpen]);

  // Record story view on active story change
  useEffect(() => {
    if (isOpen && currentStory && currentStory.id) {
      recordStoryViewAction(currentStory.id).catch(() => {});
    }
  }, [isOpen, currentStory]);

  const handleNextStory = React.useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const handlePrevStory = React.useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  // Story progress timer
  useEffect(() => {
    if (!isOpen || !currentStory || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const interval = 50; // Update every 50ms
    const step = (interval / STORY_DURATION_MS) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNextStory();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPaused, currentStory, handleNextStory]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNextStory();
      } else if (e.key === 'ArrowLeft') {
        handlePrevStory();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNextStory, handlePrevStory]);

  if (!isOpen || !currentStory) return null;

  function handleHoldStart() {
    setIsPaused(true);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }

  function handleHoldEnd() {
    setIsPaused(false);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }

  async function handleDeleteStory() {
    if (!currentStory || !confirm('Are you sure you want to delete this Moment?')) return;
    const res = await deleteStoryAction(currentStory.id);
    if (res.success) {
      if (onStoryDeleted) onStoryDeleted(currentStory.id);
      if (stories.length <= 1) {
        onClose();
      } else {
        handleNextStory();
      }
    }
  }

  function relativeTime(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  const isOwner = currentUserId && currentStory.authorId === currentUserId;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-0 sm:p-4 select-none"
      onClick={onClose}
    >
      {/* Navigation Arrows for Desktop */}
      {currentIndex > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrevStory();
          }}
          className="hidden md:flex absolute left-8 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all shadow-xl"
          title="Previous Story"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {currentIndex < stories.length - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNextStory();
          }}
          className="hidden md:flex absolute right-8 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all shadow-xl"
          title="Next Story"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Main Story Container */}
      <div
        className="relative w-full h-full sm:h-[90vh] sm:max-w-md sm:rounded-3xl overflow-hidden bg-slate-950 flex flex-col justify-between shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={handleHoldStart}
        onPointerUp={handleHoldEnd}
        onPointerCancel={handleHoldEnd}
      >
        {/* Progress Bars Row */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5 pointer-events-none">
          {stories.map((story, idx) => {
            let fillPercent = 0;
            if (idx < currentIndex) fillPercent = 100;
            else if (idx === currentIndex) fillPercent = progress;

            return (
              <div
                key={story.id || idx}
                className="flex-1 h-1 rounded-full bg-white/25 overflow-hidden backdrop-blur-sm"
              >
                <div
                  className="h-full bg-gradient-to-r from-brand-caribbeanSea via-brand-sunriseCoral to-brand-goldenHour transition-all duration-75 ease-linear rounded-full"
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Top Header: Author info & controls */}
        <div className="relative z-30 p-4 pt-7 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-caribbeanSea via-brand-sunriseCoral to-brand-goldenHour p-0.5 shadow-md flex-shrink-0">
              <div className="w-full h-full bg-brand-twilight rounded-full flex items-center justify-center font-black text-xs text-white">
                {currentStory.authorAvatar ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={currentStory.authorAvatar}
                    alt={currentStory.authorName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  currentStory.authorName.slice(0, 2).toUpperCase()
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs text-white drop-shadow-md">
                  {currentStory.authorName}
                </span>
                <span className="text-[10px] font-bold text-white/60 drop-shadow-md">
                  {relativeTime(currentStory.createdAt)}
                </span>
              </div>
              <span className="text-[11px] font-medium text-brand-caribbeanSea block drop-shadow-md">
                @{currentStory.authorHandle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {currentStory.mediaKind === 'video' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted((m) => !m);
                }}
                className="p-2 rounded-full text-white/80 hover:text-white bg-black/30 hover:bg-black/50 transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}

            {isOwner && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteStory();
                }}
                className="p-2 rounded-full text-rose-400 hover:text-rose-300 bg-black/30 hover:bg-black/50 transition-colors"
                title="Delete Moment"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-2 rounded-full text-white/80 hover:text-white bg-black/30 hover:bg-black/50 transition-colors"
              title="Close Story"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Surface with Tap Navigation Areas */}
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black overflow-hidden">
          {currentStory.mediaKind === 'video' ? (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              autoPlay
              playsInline
              loop
              muted={isMuted}
              className="w-full h-full object-cover"
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={currentStory.mediaUrl}
              alt={currentStory.caption || 'Caribbean Moment'}
              className="w-full h-full object-cover"
            />
          )}

          {/* Left / Right Invisible Tap Controls */}
          <div
            className="absolute left-0 top-16 bottom-20 w-1/3 z-20 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevStory();
            }}
          />
          <div
            className="absolute right-0 top-16 bottom-20 w-2/3 z-20 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleNextStory();
            }}
          />
        </div>

        {/* Bottom Caption & Vibes Overlay */}
        <div className="relative z-30 p-4 pb-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent space-y-2">
          {currentStory.caption && (
            <p className="text-xs sm:text-sm font-semibold text-white/95 leading-relaxed drop-shadow-md bg-black/30 p-3 rounded-2xl backdrop-blur-md border border-white/10">
              {currentStory.caption}
            </p>
          )}

          <div className="flex items-center justify-between text-[11px] text-white/70">
            <span className="font-bold text-brand-goldenHour">🌴 Tukubi 24h Moment</span>
            {isPaused && (
              <span className="px-2 py-0.5 rounded-full bg-white/20 font-bold text-white flex items-center gap-1 backdrop-blur-sm">
                <Pause className="w-3 h-3 fill-current" /> Paused
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
