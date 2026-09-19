'use client';

import React, { useState, useTransition } from 'react';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { togglePageFollowAction } from '../lib/pages/actions';
import { followUserAction, unfollowUserAction } from '../lib/social/relationship-actions';

interface PageFollowButtonProps {
  pageId?: string;
  targetUserId?: string;
  initialIsFollowing: boolean;
  initialFollowerCount: number;
}

export default function PageFollowButton({
  pageId,
  targetUserId,
  initialIsFollowing,
  initialFollowerCount,
}: PageFollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [count, setCount] = useState(initialFollowerCount);
  const [isPending, startTransition] = useTransition();

  async function handleToggleFollow() {
    if (isPending) return;

    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setCount((prev) => Math.max(0, nextState ? prev + 1 : prev - 1));

    startTransition(async () => {
      try {
        if (pageId) {
          // Page follow toggle
          const res = await togglePageFollowAction(pageId);
          if (res.error) {
            setIsFollowing(!nextState);
            setCount((prev) => Math.max(0, !nextState ? prev + 1 : prev - 1));
          } else if (res.followerCount !== undefined) {
            setCount(res.followerCount);
            if (res.isFollowing !== undefined) {
              setIsFollowing(res.isFollowing);
            }
          }
        } else if (targetUserId) {
          // User follow toggle
          if (nextState) {
            const res = await followUserAction(targetUserId);
            if (res.error) {
              setIsFollowing(!nextState);
              setCount((prev) => Math.max(0, !nextState ? prev + 1 : prev - 1));
            }
          } else {
            const res = await unfollowUserAction(targetUserId);
            if (res.error) {
              setIsFollowing(!nextState);
              setCount((prev) => Math.max(0, !nextState ? prev + 1 : prev - 1));
            }
          }
        }
      } catch {
        setIsFollowing(!nextState);
        setCount((prev) => Math.max(0, !nextState ? prev + 1 : prev - 1));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggleFollow}
      disabled={isPending}
      className={`flex-1 md:flex-initial font-black px-6 py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-md min-h-[44px] flex items-center justify-center gap-2 ${
        isFollowing
          ? 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
          : 'bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-400 hover:brightness-110 text-slate-950 shadow-orange-500/20'
      }`}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <UserCheck className="w-4 h-4 text-emerald-400" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      <span>{isFollowing ? 'Following' : 'Follow'} ({count})</span>
    </button>
  );
}