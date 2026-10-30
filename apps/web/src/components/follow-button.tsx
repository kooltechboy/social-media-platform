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
        type="button"
        onClick={handle}
        disabled={pending}
        aria-pressed={following}
        className={`inline-flex items-center justify-center gap-1.5 font-semibold text-xs px-3.5 min-h-[34px] rounded-full transition-colors disabled:opacity-50 ${
          following
            ? 'bg-white/[0.05] hover:bg-rose-500/12 hover:text-rose-300 hover:border-rose-500/30 text-[#C3CCDA] border border-white/[0.10]'
            : 'bg-brand-caribbeanSea hover:bg-[#38BDF8] text-[#04101F] shadow-sm shadow-brand-caribbeanSea/20'
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
