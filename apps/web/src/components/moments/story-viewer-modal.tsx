'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Pause, Play } from 'lucide-react';

export interface StoryViewerModalProps {
  stories: Array<{
    id: string;
    mediaUrl?: string;
    mediaType?: 'photo' | 'video' | 'text';
    textContent?: string;
    backgroundColor?: string;
    creatorId: string;
    creatorName: string;
    creatorHandle: string;
    creatorAvatar?: string;
    createdAt: string;
  }>;
  initialIndex?: number;
  onClose: () => void;
}

export default function StoryViewerModal({ stories, initialIndex = 0, onClose }: StoryViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setProgress(0);
  }, [initialIndex]);

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

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const interval = 50; 
    const step = (interval / 5000) * 100; 

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
  }, [isPaused, currentIndex, handleNextStory]);

  if (!stories[currentIndex]) return null;
  const currentStory = stories[currentIndex];

  const handleReplySubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      window.location.href = `/messages?u=${currentStory.creatorHandle}`;
    }
  };

  const relativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const renderMedia = () => {
    if (currentStory.mediaType === 'text' || (!currentStory.mediaUrl && currentStory.textContent)) {
      return (
        <div 
          className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br ${currentStory.backgroundColor || 'from-slate-800 to-slate-950'}`}
        >
          <span className="text-white text-3xl font-bold text-center z-10">{currentStory.textContent}</span>
        </div>
      );
    } else if (currentStory.mediaType === 'video') {
      return <video autoPlay src={currentStory.mediaUrl} className="absolute inset-0 w-full h-full object-cover" />;
    } else {
      /* eslint-disable-next-line @next/next/no-img-element */
      return <img src={currentStory.mediaUrl} alt="Story Media" className="absolute inset-0 w-full h-full object-cover" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center animate-fadeIn select-none">
      <div 
        className="relative w-full h-full sm:h-[90vh] sm:max-w-md sm:rounded-3xl overflow-hidden bg-slate-950 flex flex-col"
        onPointerDown={() => setIsPaused(true)}
        onPointerUp={() => setIsPaused(false)}
        onPointerCancel={() => setIsPaused(false)}
      >
        {/* Progress Bars */}
        <div className="absolute top-3 inset-x-3 z-30 flex items-center gap-1.5 pointer-events-none">
          {stories.map((story, idx) => {
            let fillPercent = 0;
            if (idx < currentIndex) fillPercent = 100;
            else if (idx === currentIndex) fillPercent = progress;

            return (
              <div key={story.id || idx} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-75 ease-linear rounded-full"
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Top Header Controls */}
        <div className="absolute top-0 inset-x-0 pt-8 pb-4 px-4 z-20 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center text-white font-bold text-xs border border-white/20">
               {currentStory.creatorAvatar ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                 <img src={currentStory.creatorAvatar} alt="avatar" className="w-full h-full object-cover" />
               ) : currentStory.creatorName.slice(0, 2).toUpperCase()}
             </div>
             <div className="flex flex-col">
               <span className="text-white font-bold text-sm shadow-black drop-shadow-md">{currentStory.creatorName}</span>
               <span className="text-white/80 font-semibold text-xs shadow-black drop-shadow-md">{relativeTime(currentStory.createdAt)}</span>
             </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }} 
            className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Container */}
        <div className="flex-1 relative w-full h-full bg-black">
          {renderMedia()}

          {/* Navigation Overlay Zones */}
          <div 
            className="absolute left-0 top-20 bottom-24 w-1/3 z-20 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); handlePrevStory(); }}
          />
          <div 
            className="absolute right-0 top-20 bottom-24 w-2/3 z-20 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); handleNextStory(); }}
          />
        </div>

        {/* Bottom Reply Area */}
        <div className="absolute bottom-0 inset-x-0 p-4 z-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-auto">
          <input
            type="text"
            placeholder={`Reply to ${currentStory.creatorName}...`}
            onKeyDown={handleReplySubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-black/40 text-white border border-white/30 rounded-full px-5 py-3 outline-none focus:border-white transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
