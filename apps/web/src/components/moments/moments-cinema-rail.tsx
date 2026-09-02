'use client';

import React, { useState } from 'react';
import { Plus, Sparkles, Radio } from 'lucide-react';
import { type StoryData } from '../../lib/social/actions';
import CreateMomentModal from './create-moment-modal';
import MomentViewerModal from './moment-viewer-modal';

export interface MomentsCinemaRailProps {
  initialStories: StoryData[];
  currentUserId?: string;
  currentUserAvatar?: string;
  currentUserName?: string;
}

export default function MomentsCinemaRail({
  initialStories,
  currentUserId,
  currentUserAvatar,
  currentUserName = 'You',
}: MomentsCinemaRailProps) {
  const [stories, setStories] = useState<StoryData[]>(initialStories ?? []);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);

  const myStory = stories.find((s) => currentUserId && s.authorId === currentUserId);

  function handleStoryCreated(newStory: StoryData) {
    setStories((prev) => [newStory, ...prev]);
  }

  function handleStoryDeleted(storyId: string) {
    setStories((prev) => prev.filter((s) => s.id !== storyId));
  }

  return (
    <section aria-label="Caribbean Moments" className="space-y-3">
      {/* Rail Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-black text-white/70 uppercase tracking-widest flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" /> Caribbean Moments
        </h2>
        <span className="text-[11px] font-black tracking-tight text-brand-caribbeanSea bg-brand-caribbeanSea/10 px-2.5 py-0.5 rounded-full border border-brand-caribbeanSea/20">
          Island &amp; Diaspora
        </span>
      </div>

      {/* Horizontal Story Rail */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x px-1">
        {/* + Your Moment Creation Tile */}
        <div
          onClick={() => setIsCreateOpen(true)}
          className="snap-start flex-shrink-0 w-32 h-48 rounded-3xl glass-aerospace flex flex-col items-center justify-center relative cursor-pointer group hover:border-brand-caribbeanSea/60 hover:scale-[1.02] transition-all duration-300 border border-white/15 bg-[#0C1226]/80 shadow-xl"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setIsCreateOpen(true)}
        >
          {/* Glowing Ambient Backdrop Accent */}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-twilight via-transparent to-white/5 opacity-60 rounded-3xl pointer-events-none" />

          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-brand-caribbeanSea via-brand-sunriseCoral to-brand-goldenHour p-[2px] mb-2.5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-brand-caribbeanSea/25 z-10">
            <div className="w-full h-full bg-[#0A1024] rounded-2xl flex items-center justify-center text-brand-caribbeanSea font-black overflow-hidden">
              {myStory ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={myStory.mediaUrl}
                  alt="Your Moment"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Plus className="w-6 h-6 text-brand-caribbeanSea" />
              )}
            </div>
          </div>

          <span className="text-xs font-black text-white z-10 tracking-tight">
            {myStory ? 'Your Moment' : '+ Your Moment'}
          </span>
          <span className="text-[10px] font-bold text-white/50 mt-0.5 z-10">
            {myStory ? 'Active (24h)' : 'Post update'}
          </span>
        </div>

        {/* Stories List */}
        {stories.map((story, index) => {
          const isViewed = story.hasViewed;
          return (
            <div
              key={story.id || index}
              onClick={() => setActiveStoryIndex(index)}
              className={`snap-start flex-shrink-0 w-32 h-48 rounded-3xl overflow-hidden relative group cursor-pointer hover:scale-[1.02] transition-all duration-300 border shadow-xl ${
                isViewed
                  ? 'border-white/10 bg-[#0C1226]/70'
                  : 'border-brand-caribbeanSea/40 ring-2 ring-brand-caribbeanSea/30 shadow-brand-caribbeanSea/20'
              }`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveStoryIndex(index)}
            >
              {/* Background Media / Gradient */}
              {story.mediaUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={story.mediaUrl}
                  alt={story.authorName}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900 to-sky-950" />
              )}

              {/* Specular Ambient Shadows & Bevel */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#080B17]/95 via-black/25 to-black/30" />
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent" />

              {/* Author Badge Top-Left */}
              <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral p-[2px] shadow-md shadow-black/50">
                  <div className="w-full h-full bg-[#0A1024] rounded-full flex items-center justify-center font-black text-[10px] text-white">
                    {story.authorName.slice(0, 1).toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Bottom Details */}
              <div className="absolute bottom-3 left-2.5 right-2.5 space-y-0.5 z-10">
                <span className="text-[10px] font-extrabold text-brand-caribbeanSea block truncate tracking-tight">
                  @{story.authorHandle}
                </span>
                <p className="text-xs font-black text-white leading-tight block truncate tracking-tight">
                  {story.authorName}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Creation Modal */}
      <CreateMomentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onStoryCreated={handleStoryCreated}
        currentUserId={currentUserId}
      />

      {/* Story Viewer Modal */}
      {activeStoryIndex !== null && (
        <MomentViewerModal
          isOpen={activeStoryIndex !== null}
          stories={stories}
          initialIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
          onStoryDeleted={handleStoryDeleted}
          currentUserId={currentUserId}
        />
      )}
    </section>
  );
}

