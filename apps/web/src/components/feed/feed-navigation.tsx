'use client';

import React, { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Users, Globe, Flame, Building2, ShieldCheck, Palette } from 'lucide-react';
import { useTranslation } from '@caribbean/localization';
import type { FeedMode } from '@caribbean/social';

export interface FeedNavigationProps {
  currentMode: FeedMode | string;
  onModeChange?: (mode: FeedMode) => void;
  className?: string;
}

export const FEED_CHANNELS: Array<{
  id: FeedMode;
  labelKey: string;
  fallbackLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'for_you', labelKey: 'feed.for_you', fallbackLabel: 'For You', icon: Sparkles },
  { id: 'following', labelKey: 'feed.following', fallbackLabel: 'Following', icon: Users },
  { id: 'pages', labelKey: 'feed.pages', fallbackLabel: 'Pages', icon: Building2 },
  { id: 'creators', labelKey: 'feed.creators', fallbackLabel: 'Creators', icon: Palette },
  { id: 'official', labelKey: 'feed.official', fallbackLabel: 'Official', icon: ShieldCheck },
  { id: 'caribbean', labelKey: 'feed.caribbean', fallbackLabel: 'Caribbean', icon: Globe },
  { id: 'communities', labelKey: 'nav.communities', fallbackLabel: 'Communities', icon: Flame },
];

export default function FeedNavigation({
  currentMode = 'for_you',
  onModeChange,
  className = '',
}: FeedNavigationProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const tabListRef = useRef<HTMLDivElement>(null);

  function handleSelectMode(mode: FeedMode) {
    if (onModeChange) {
      onModeChange(mode);
    } else {
      const feedSlug = mode.replace(/_/g, '-');
      router.replace(`/?feed=${feedSlug}`, { scroll: false });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    let nextIndex: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (index + 1) % FEED_CHANNELS.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (index - 1 + FEED_CHANNELS.length) % FEED_CHANNELS.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = FEED_CHANNELS.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      const targetChannel = FEED_CHANNELS[nextIndex];
      handleSelectMode(targetChannel.id);
      const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('button[role="tab"]');
      buttons?.[nextIndex]?.focus();
    }
  }

  return (
    <nav
      aria-label="Feed Navigation"
      className={`border-b border-white/[0.08] md:border md:rounded-2xl md:bg-[#0D1526]/85 px-1 sm:px-3 relative ${className}`}
    >
      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Feed filter modes"
        className="flex items-center justify-start gap-0.5 sm:gap-2 overflow-x-auto scrollbar-none"
      >
        {FEED_CHANNELS.map((channel, index) => {
          const isActive =
            currentMode === channel.id ||
            currentMode === channel.id.replace(/_/g, '-') ||
            (currentMode === 'for-you' && channel.id === 'for_you') ||
            (currentMode === 'for_you' && channel.id === 'for_you');
          const label = t(channel.labelKey as any) || channel.fallbackLabel;
          const Icon = channel.icon;

          return (
            <button
              key={channel.id}
              role="tab"
              id={`feed-tab-${channel.id}`}
              aria-controls={`feed-panel-${channel.id}`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleSelectMode(channel.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`relative flex items-center justify-center gap-1.5 px-3 sm:px-3.5 h-11 sm:h-12 min-h-[44px] text-[13px] sm:text-[13.5px] transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-caribbeanSea cursor-pointer select-none ${
                isActive
                  ? 'text-[#F8FAFC] font-semibold'
                  : 'text-[#94A3B8] font-medium hover:text-white'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors hidden sm:inline-block ${
                  isActive ? 'text-[#00C2A8]' : 'text-[#64748B]'
                }`}
              />
              <span>{label}</span>

              {/* Active Indicator Underline */}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-2.5 right-2.5 h-[2px] bg-gradient-to-r from-[#00C2A8] to-[#0EA5E9] rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
