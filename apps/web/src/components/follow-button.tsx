'use client';

import React, { useState, useTransition } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { followAction, unfollowAction } from '../lib/social/profile-actions';

interface Props {
  targetUserId: string;
  isFollowing: boolean;
}

export default function FollowButton({ targetUserId, isFollowing: initialFollowing }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handle = () => {
    startTransition(() => {
      const action = following ? unfollowAction(targetUserId) : followAction(targetUserId);
      void action.then((result) => {
        if (result.error) {
          setError(result.error);
        } else {
          setFollowing(!following);
          setError(null);
        }
      });
    });
  };

  return (
    <div>
      <button
        onClick={handle}
        disabled={pending}
        className={`flex items-center gap-1.5 font-bold text-xs px-4 py-2 rounded-full transition-colors disabled:opacity-50 ${
          following
            ? 'bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/40 text-slate-300 border border-slate-700'
            : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
        }`}
      >
        {following ? (
          <><UserCheck className="w-3.5 h-3.5" /> {pending ? '…' : 'Following'}</>
        ) : (
          <><UserPlus className="w-3.5 h-3.5" /> {pending ? '…' : 'Follow'}</>
        )}
      </button>
      {error && <p role="alert" className="text-[11px] text-rose-400 mt-1">{error}</p>}
    </div>
  );
}
