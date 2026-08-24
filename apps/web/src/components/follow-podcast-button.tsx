'use client';

import React, { useState, useTransition } from 'react';
import { Play } from 'lucide-react';
import Link from 'next/link';
import { followPodcastAction } from '../lib/podcasts/actions';

interface Props {
  podcastId: string;
  isFollowing: boolean;
  isAuthenticated: boolean;
}

export default function FollowPodcastButton({ podcastId, isFollowing: initialFollowing, isAuthenticated }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="bg-brand-goldenHour/20 text-amber-300 hover:bg-brand-goldenHour/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-brand-goldenHour/30"
      >
        <Play className="w-3.5 h-3.5" /> Follow
      </Link>
    );
  }

  const handle = () => {
    startTransition(() => {
      void followPodcastAction(podcastId).then((result) => {
        if (!result.error) setFollowing(true);
      });
    });
  };

  return (
    <button
      onClick={handle}
      disabled={pending || following}
      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border disabled:opacity-60 ${
        following
          ? 'bg-brand-goldenHour/10 text-brand-goldenHour border-brand-goldenHour/20 cursor-default'
          : 'bg-brand-goldenHour/20 text-amber-300 hover:bg-brand-goldenHour/30 border-brand-goldenHour/30'
      }`}
    >
      <Play className="w-3.5 h-3.5" />
      {pending ? '…' : following ? 'Following' : 'Follow'}
    </button>
  );
}
