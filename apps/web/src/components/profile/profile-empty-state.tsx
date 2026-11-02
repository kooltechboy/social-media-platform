'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Film,
  Image as ImageIcon,
  Bookmark,
  Users,
  Sparkles,
  PlusCircle,
  Clapperboard,
} from 'lucide-react';

export type ProfileTabType = 'posts' | 'reels' | 'media' | 'saved' | 'friends' | 'recognition' | 'about';

interface ProfileEmptyStateProps {
  tab: ProfileTabType;
  isOwner: boolean;
  username: string;
}

const TAB_CONFIGS: Record<
  ProfileTabType,
  {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: (isOwner: boolean, username: string) => string;
    ctaHref?: string;
    ctaLabel?: string;
  }
> = {
  posts: {
    icon: FileText,
    title: 'No Posts Yet',
    description: (isOwner, username) =>
      isOwner
        ? 'Share your first story, image, or update with the Caribbean community.'
        : `@${username} hasn't posted anything yet. Check back soon!`,
    ctaHref: '/create',
    ctaLabel: 'Create Post',
  },
  reels: {
    icon: Clapperboard,
    title: 'No Reels Published',
    description: (isOwner, username) =>
      isOwner
        ? 'Capture Caribbean vibes with vertical short-form video clips.'
        : `@${username} hasn't published any reels yet.`,
    ctaHref: '/create?mode=clip',
    ctaLabel: 'Record Clip',
  },
  media: {
    icon: ImageIcon,
    title: 'No Media Uploaded',
    description: (isOwner, username) =>
      isOwner
        ? 'Upload photos, videos, and artwork to your personal Caribbean gallery.'
        : `No photos or videos from @${username} yet.`,
    ctaHref: '/create',
    ctaLabel: 'Upload Media',
  },
  saved: {
    icon: Bookmark,
    title: 'No Saved Posts',
    description: () => 'Save your favorite music, culture stories, and events to revisit later.',
    ctaHref: '/explore',
    ctaLabel: 'Explore Content',
  },
  friends: {
    icon: Users,
    title: 'No Friends Connected',
    description: (isOwner, username) =>
      isOwner
        ? 'Connect with family, friends, and diaspora peers across the islands.'
        : `@${username} has no mutual friends visible right now.`,
    ctaHref: '/explore',
    ctaLabel: 'Find Friends',
  },
  recognition: {
    icon: Sparkles,
    title: 'No Badges Yet',
    description: (isOwner, username) =>
      isOwner
        ? 'Earn founder, creator, and community recognition by participating across TUKUBI.'
        : `@${username} has not yet unlocked recognition badges.`,
  },
  about: {
    icon: FileText,
    title: 'No Profile Info',
    description: (isOwner, username) =>
      isOwner
        ? 'Tell the diaspora about yourself, your roots, and your passions.'
        : `No additional information shared by @${username}.`,
  },
};

export function ProfileEmptyState({ tab, isOwner, username }: ProfileEmptyStateProps) {
  const config = TAB_CONFIGS[tab] || TAB_CONFIGS.posts;
  const Icon = config.icon;

  return (
    <div className="w-full py-16 px-4 flex flex-col items-center justify-center text-center">
      {/* Ambient gradient badge */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-caribbeanSea/15 via-brand-goldenHour/10 to-brand-sunriseCoral/15 border border-white/10 flex items-center justify-center mb-4 shadow-lg shadow-black/40">
        <Icon className="w-7 h-7 text-brand-caribbeanSea" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mb-1.5">
        {config.title}
      </h3>
      <p className="text-xs sm:text-sm text-brand-sandstone/60 max-w-sm mb-6 leading-relaxed">
        {config.description(isOwner, username)}
      </p>

      {isOwner && config.ctaHref && (
        <Link
          href={config.ctaHref}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-[#06101E] bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral hover:brightness-110 active:scale-95 transition-all shadow-md shadow-brand-caribbeanSea/20"
        >
          <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{config.ctaLabel}</span>
        </Link>
      )}
    </div>
  );
}
