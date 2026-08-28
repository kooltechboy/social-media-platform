'use client';

import React, { useState, useTransition } from 'react';
import { Heart, Check } from 'lucide-react';
import Link from 'next/link';
import { followPodcastAction, unfollowPodcastAction } from '../lib/podcasts/actions';

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
        href="/login?redirect=/podcasts"
        className="bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-purple-500/30"
      >
        <Heart className="w-3.5 h-3.5" /> Follow
      </Link>
    );
  }

  const handleToggle = () => {
    startTransition(async () => {
      const next = !following;
      setFollowing(next);
      try {
        if (next) {
          const res = await followPodcastAction(podcastId);
          if (res.error) setFollowing(!next);
        } else {
          const res = await unfollowPodcastAction(podcastId);
          if (res.error) setFollowing(!next);
        }
      } catch {
        setFollowing(!next);
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border disabled:opacity-60 cursor-pointer ${
        following
          ? 'bg-purple-600/30 text-purple-200 border-purple-500/50 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40'
          : 'bg-purple-600 text-white hover:bg-purple-500 border-purple-500 shadow-sm'
      }`}
      title={following ? 'Click to unfollow show' : 'Follow show'}
    >
      {following ? <Check className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5" />}
      {pending ? '…' : following ? 'Following ✓' : 'Follow'}
    </button>
  );
}
