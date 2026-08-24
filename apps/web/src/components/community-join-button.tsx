'use client';

import React, { useState, useTransition } from 'react';
import { joinCommunityAction, leaveCommunityAction, type CommunityActionState } from '../lib/communities/actions';
import Link from 'next/link';

interface Props {
  communityId: string;
  joinPolicy: 'public' | 'private' | 'invite_only';
  isMember: boolean;
  isAuthenticated: boolean;
}

const INITIAL: CommunityActionState = { error: null, success: null };

export default function CommunityJoinButton({ communityId, joinPolicy, isMember, isAuthenticated }: Props) {
  const [state, setState] = useState<CommunityActionState>(INITIAL);
  const [memberState, setMemberState] = useState(isMember);
  const [pending, startTransition] = useTransition();

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="w-full text-center bg-brand-dusk hover:bg-slate-700 text-brand-caribbeanSea font-bold py-2 rounded-xl text-xs border border-brand-caribbeanSea/30 transition-colors"
      >
        Sign in to Join
      </Link>
    );
  }

  const handleJoin = () => {
    const formData = new FormData();
    formData.set('communityId', communityId);
    startTransition(() => {
      void joinCommunityAction(INITIAL, formData).then((result) => {
        setState(result);
        if (!result.error) setMemberState(true);
      });
    });
  };

  const handleLeave = () => {
    const formData = new FormData();
    formData.set('communityId', communityId);
    startTransition(() => {
      void leaveCommunityAction(INITIAL, formData).then((result) => {
        setState(result);
        if (!result.error) setMemberState(false);
      });
    });
  };

  return (
    <div className="w-full space-y-1">
      {memberState ? (
        <button
          onClick={handleLeave}
          disabled={pending}
          className="w-full bg-brand-dusk hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/40 text-slate-300 font-bold py-2 rounded-xl text-xs border border-slate-700 transition-colors disabled:opacity-50"
        >
          {pending ? 'Leaving…' : 'Leave Community'}
        </button>
      ) : (
        <button
          onClick={handleJoin}
          disabled={pending}
          className="w-full bg-brand-caribbeanSea/20 hover:bg-brand-caribbeanSea/30 text-brand-caribbeanSea font-bold py-2 rounded-xl text-xs border border-brand-caribbeanSea/40 transition-colors disabled:opacity-50"
        >
          {pending
            ? 'Joining…'
            : joinPolicy === 'public'
            ? 'Join Community'
            : joinPolicy === 'private'
            ? 'Request to Join'
            : 'Invite Only'}
        </button>
      )}
      {state.error && (
        <p role="alert" className="text-[11px] text-rose-400 text-center">{state.error}</p>
      )}
      {state.success && (
        <p className="text-[11px] text-brand-sunriseCoral text-center">{state.success}</p>
      )}
    </div>
  );
}
