'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Sparkles, Compass, Music, Plane, Utensils } from 'lucide-react';
import { type StoryData } from '../../lib/social/actions';
import StoryCreatorModal from './story-creator-modal';
import StoryViewerModal from './story-viewer-modal';
import TukubiImage from '../ui/tukubi-image';
import UserAvatar from '../user-avatar';

export interface MomentsCinemaRailProps {
  initialStories: StoryData[];
  currentUserId?: string;
  currentUserAvatar?: string;
  currentUserName?: string;
}

const DISCOVERY_MOMENT_CHANNELS = [
  { id: 'ch-caribbean', label: 'Caribbean', href: '/explore?geo=caribbean', Icon: Compass, ring: 'from-[#00C2A8] to-[#0EA5E9]' },
  { id: 'ch-music', label: 'Music', href: '/explore?vibe=music', Icon: Music, ring: 'from-[#0EA5E9] to-[#8B5CF6]' },
  { id: 'ch-travel', label: 'Travel', href: '/explore?vibe=island-life', Icon: Plane, ring: 'from-[#00C2A8] to-[#0EA5E9]' },
  { id: 'ch-food', label: 'Food', href: '/explore?vibe=food', Icon: Utensils, ring: 'from-[#F59E0B] to-[#00C2A8]' },
];

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
  const myStoryIndex = stories.findIndex((s) => currentUserId && s.authorId === currentUserId);

  return (
    <section aria-label="Caribbean Moments" className="space-y-2.5">
      {/* ── MOBILE (< md): Circular Gradient-Ringed Stories Bar (Official Brand Showcase) ── */}
      <div className="md:hidden flex items-start gap-3.5 overflow-x-auto py-1 px-0.5 scrollbar-none snap-x">
        {/* 1. Your Story Ring */}
        <button
          type="button"
          onClick={() => {
            if (myStory && myStoryIndex >= 0) {
              setActiveStoryIndex(myStoryIndex);
            } else {
              setIsCreateOpen(true);
            }
          }}
          className="snap-start flex-shrink-0 flex flex-col items-center gap-1.5 w-[64px] group focus:outline-none"
        >
          <div className="relative w-[60px] h-[60px] rounded-full p-[2px] bg-gradient-to-tr from-[#00C2A8] via-[#0EA5E9] to-[#8B5CF6]">
            <div className="w-full h-full rounded-full bg-[#070D1A] p-[2px] flex items-center justify-center overflow-hidden">
              {myStory?.mediaUrl ? (
                <div className="relative w-full h-full rounded-full overflow-hidden">
                  <TukubiImage
                    src={myStory.mediaUrl}
                    alt="Your Story"
                    fill
                    sizes="56px"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <UserAvatar
                  src={currentUserAvatar}
                  name={currentUserName}
                  size="md"
                  className="w-full h-full rounded-full"
                />
              )}
            </div>
            <span
              onClick={(e) => {
                e.stopPropagation();
                setIsCreateOpen(true);
              }}
              className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-gradient-to-tr from-[#00C2A8] to-[#0EA5E9] text-[#041019] ring-2 ring-[#070D1A] flex items-center justify-center shadow-sm"
              aria-label="Add to Your Story"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.8]" />
            </span>
          </div>
          <span className="text-[11px] font-medium text-[#E8EDF5] truncate w-full text-center leading-tight">
            Your Story
          </span>
        </button>

        {/* 2. Active Member Stories */}
        {stories.map((story, index) => {
          if (currentUserId && story.authorId === currentUserId) return null;
          const isViewed = story.hasViewed;
          return (
            <button
              key={story.id || index}
              type="button"
              onClick={() => setActiveStoryIndex(index)}
              className="snap-start flex-shrink-0 flex flex-col items-center gap-1.5 w-[64px] group focus:outline-none"
            >
              <div
                className={`w-[60px] h-[60px] rounded-full p-[2px] transition-transform group-active:scale-95 ${
                  isViewed
                    ? 'bg-white/15'
                    : 'bg-gradient-to-tr from-[#00C2A8] via-[#0EA5E9] to-[#8B5CF6]'
                }`}
              >
                <div className="w-full h-full rounded-full bg-[#070D1A] p-[2px] overflow-hidden flex items-center justify-center">
                  {story.authorAvatar || story.mediaUrl ? (
                    <div className="relative w-full h-full rounded-full overflow-hidden">
                      <TukubiImage
                        src={story.authorAvatar || story.mediaUrl}
                        alt={story.authorName}
                        fill
                        sizes="56px"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#111C33] flex items-center justify-center text-xs font-bold text-[#F8FAFC]">
                      {story.authorName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[11px] font-medium text-[#C3CCDA] truncate w-full text-center leading-tight">
                {story.authorName.split(' ')[0]}
              </span>
            </button>
          );
        })}

        {/* 3. Curated Cultural Channels (fills horizontal rail cleanly when few/zero live stories exist) */}
        {stories.length < 4 &&
          DISCOVERY_MOMENT_CHANNELS.map(({ id, label, href, Icon, ring }) => (
            <Link
              key={id}
              href={href}
              className="snap-start flex-shrink-0 flex flex-col items-center gap-1.5 w-[64px] group focus:outline-none"
            >
              <div className={`w-[60px] h-[60px] rounded-full p-[2px] bg-gradient-to-tr ${ring} transition-transform group-active:scale-95`}>
                <div className="w-full h-full rounded-full bg-[#070D1A] p-[2px]">
                  <div className="w-full h-full rounded-full bg-[#0D1628] border border-white/[0.06] flex items-center justify-center text-[#00C2A8] group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-medium text-[#C3CCDA] truncate w-full text-center leading-tight">
                {label}
              </span>
            </Link>
          ))}
      </div>

      {/* ── DESKTOP (md+): Cinema Moments Rail (shown when active stories exist) ── */}
      {stories.length > 0 && (
        <div className="hidden md:block space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#00C2A8]" /> Caribbean Moments
            </h2>
            <span className="text-[11px] font-semibold text-[#00C2A8] bg-[#00C2A8]/10 px-2.5 py-0.5 rounded-full border border-[#00C2A8]/20">
              24h Stories
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x px-1">
            <div
              onClick={() => setIsCreateOpen(true)}
              className="snap-start flex-shrink-0 w-32 h-44 rounded-2xl tk-panel flex flex-col items-center justify-center relative cursor-pointer group hover:border-[#00C2A8]/50 transition-all"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setIsCreateOpen(true)}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#00C2A8] to-[#0EA5E9] p-[2px] mb-2.5 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#070D1A] rounded-full flex items-center justify-center text-[#00C2A8] overflow-hidden relative">
                  {myStory ? (
                    <TukubiImage
                      src={myStory.mediaUrl}
                      alt="Your Moment"
                      fill
                      sizes="64px"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Plus className="w-5 h-5 text-[#00C2A8]" />
                  )}
                </div>
              </div>
              <span className="text-xs font-semibold text-white z-10">
                {myStory ? 'Your Story' : '+ Add Story'}
              </span>
              <span className="text-[10.5px] text-[#94A3B8] mt-0.5 z-10">
                {myStory ? 'Active (24h)' : 'Share moment'}
              </span>
            </div>

            {stories.map((story, index) => {
              const isViewed = story.hasViewed;
              return (
                <div
                  key={story.id || index}
                  onClick={() => setActiveStoryIndex(index)}
                  className={`snap-start flex-shrink-0 w-32 h-44 rounded-2xl overflow-hidden relative group cursor-pointer transition-all border ${
                    isViewed
                      ? 'border-white/[0.08] bg-[#0D1628]'
                      : 'border-[#00C2A8]/45 ring-1 ring-[#00C2A8]/25'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setActiveStoryIndex(index)}
                >
                  {story.mediaUrl ? (
                    <TukubiImage
                      src={story.mediaUrl}
                      alt={story.authorName}
                      fill
                      sizes="128px"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070D1A] via-[#0D1628] to-[#0B1B3B]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070D1A]/95 via-black/20 to-black/25" />
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#00C2A8] to-[#0EA5E9] p-[1.5px]">
                      <div className="w-full h-full bg-[#070D1A] rounded-full flex items-center justify-center font-bold text-[10px] text-white">
                        {story.authorName.slice(0, 1).toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 space-y-0.5 z-10">
                    <span className="text-[10px] font-medium text-[#00C2A8] block truncate">
                      @{story.authorHandle}
                    </span>
                    <p className="text-xs font-semibold text-white leading-tight block truncate">
                      {story.authorName}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Creation Modal */}
      <StoryCreatorModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onStoryCreated={() => {}}
      />

      {/* Story Viewer Modal */}
      {activeStoryIndex !== null && (
        <StoryViewerModal
          initialIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
          stories={stories.map((s) => ({
            id: s.id,
            mediaUrl: s.mediaUrl,
            mediaType: s.mediaKind === 'video' ? 'video' : 'photo',
            textContent: s.caption,
            creatorId: s.authorId,
            creatorName: s.authorName,
            creatorHandle: s.authorHandle,
            creatorAvatar: s.authorAvatar,
            createdAt: s.createdAt,
          }))}
        />
      )}
    </section>
  );
}
