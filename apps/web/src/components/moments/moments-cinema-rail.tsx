'use client';

import React, { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { type StoryData } from '../../lib/social/actions';
import CreateMomentModal from './create-moment-modal';
import MomentViewerModal from './moment-viewer-modal';

export interface MomentsCinemaRailProps {
  initialStories: StoryData[];
  currentUserId?: string;
  currentUserAvatar?: string;
  currentUserName?: string;
}

const CURATED_DEFAULT_STORIES: StoryData[] = [
  {
    id: 'curated-1',
    authorId: 'curated-author-1',
    authorName: 'Kingston Sound System',
    authorHandle: 'kingston_dub',
    authorAvatar: undefined,
    mediaUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    mediaKind: 'image',
    caption: 'Trenchtown dub session live tonight! Massive vinyl selector stack tuned to perfection. 🇯🇲🔊✨',
    audience: 'public',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'curated-2',
    authorId: 'curated-author-2',
    authorName: 'Port of Spain Soca',
    authorHandle: 'pos_soca',
    authorAvatar: undefined,
    mediaUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop&q=80',
    mediaKind: 'image',
    caption: 'Carnival brass band rehearsal live! Pure adrenaline and percussion on the savannah. 🇹🇹🎭✨',
    audience: 'public',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'curated-3',
    authorId: 'curated-author-3',
    authorName: 'Santo Domingo Bachata',
    authorHandle: 'santodomingo_vibes',
    authorAvatar: undefined,
    mediaUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
    mediaKind: 'image',
    caption: 'Zona Colonial guitar chords under the warm Caribbean evening sky. 🇩🇴🎸🌴',
    audience: 'public',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 21 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'curated-4',
    authorId: 'curated-author-4',
    authorName: 'Bridgetown Crop Over',
    authorHandle: 'bajan_fete',
    authorAvatar: undefined,
    mediaUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    mediaKind: 'image',
    caption: 'Sweetest summer festival vibes from Carlisle Bay to Spring Garden. 🇧🇧🌞🎶',
    audience: 'public',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 19 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'curated-5',
    authorId: 'curated-author-5',
    authorName: 'Miami Diaspora Carnival',
    authorHandle: 'miami_carib',
    authorAvatar: undefined,
    mediaUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    mediaKind: 'image',
    caption: 'Connecting all 30+ island nations right here in South Florida. 🇺🇸🌍🔥',
    audience: 'public',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
  },
];

export default function MomentsCinemaRail({
  initialStories,
  currentUserId,
  currentUserAvatar,
  currentUserName = 'You',
}: MomentsCinemaRailProps) {
  const [stories, setStories] = useState<StoryData[]>(
    initialStories.length > 0 ? initialStories : CURATED_DEFAULT_STORIES
  );
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
        <h2 className="text-xs font-black text-brand-sandstone/60 uppercase tracking-widest flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" /> Moments &amp; Stories
        </h2>
        <span className="text-[11px] font-bold text-brand-caribbeanSea">Island &amp; Diaspora</span>
      </div>

      {/* Horizontal Story Rail */}
      <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x px-1">
        {/* + Your Moment Creation Tile */}
        <div
          onClick={() => setIsCreateOpen(true)}
          className="snap-start flex-shrink-0 w-28 h-44 rounded-3xl glass flex flex-col items-center justify-center relative cursor-pointer group hover:border-brand-caribbeanSea/40 transition-all border border-slate-800/80 bg-brand-dusk/70"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setIsCreateOpen(true)}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-caribbeanSea via-brand-sunriseCoral to-brand-goldenHour p-0.5 mb-2 group-hover:scale-110 transition-transform shadow-md">
            <div className="w-full h-full bg-brand-twilight rounded-full flex items-center justify-center text-brand-caribbeanSea font-black">
              {myStory ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={myStory.mediaUrl}
                  alt="Your Moment"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <Plus className="w-6 h-6 text-brand-caribbeanSea" />
              )}
            </div>
          </div>
          <span className="text-xs font-extrabold text-slate-200">
            {myStory ? 'Your Moment' : '+ Your Moment'}
          </span>
          <span className="text-[10px] text-brand-sandstone/50 mt-0.5">
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
              className={`snap-start flex-shrink-0 w-28 h-44 rounded-3xl glass overflow-hidden relative group cursor-pointer hover:border-brand-caribbeanSea/50 transition-all border ${
                isViewed ? 'border-slate-800' : 'border-brand-caribbeanSea/30 ring-1 ring-brand-caribbeanSea/20'
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
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900 to-sky-950" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-black/30 to-black/20" />

              {/* Author Badge Top-Left */}
              <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral p-0.5 shadow-sm">
                  <div className="w-full h-full bg-brand-twilight rounded-full flex items-center justify-center font-black text-[9px] text-white">
                    {story.authorName.slice(0, 1).toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Bottom Details */}
              <div className="absolute bottom-3 left-2.5 right-2.5 space-y-0.5 z-10">
                <span className="text-[10px] font-bold text-brand-caribbeanSea block truncate">
                  @{story.authorHandle}
                </span>
                <p className="text-xs font-black text-brand-sandstone leading-tight block truncate">
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
