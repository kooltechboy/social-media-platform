'use client';

import React, { useState, useTransition } from 'react';
import { updateProfileAction, type ProfileUpdateState } from '../lib/social/profile-actions';

interface Props {
  currentDisplayName: string;
  currentBio: string;
  currentWebsite: string;
  username: string;
}

const INITIAL: ProfileUpdateState = { error: null, success: null };

export default function ProfileEditForm({ currentDisplayName, currentBio, currentWebsite, username }: Props) {
  const [state, setState] = useState<ProfileUpdateState>(INITIAL);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      void updateProfileAction(INITIAL, formData).then((result) => {
        setState(result);
      });
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="displayName" className="text-xs font-semibold text-brand-sandstone/60 block mb-1">
          Display Name *
        </label>
        <input
          id="displayName"
          name="displayName"
          required
          maxLength={100}
          defaultValue={currentDisplayName}
          className="w-full bg-brand-twilight border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors"
        />
      </div>

      <div>
        <label htmlFor="bio" className="text-xs font-semibold text-brand-sandstone/60 block mb-1">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          maxLength={500}
          rows={3}
          defaultValue={currentBio}
          placeholder="Tell your Caribbean story…"
          className="w-full bg-brand-twilight border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors resize-none"
        />
      </div>

      <div>
        <label htmlFor="website" className="text-xs font-semibold text-brand-sandstone/60 block mb-1">
          Website
        </label>
        <input
          id="website"
          name="website"
          type="url"
          defaultValue={currentWebsite}
          placeholder="https://yoursite.com"
          className="w-full bg-brand-twilight border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-xs text-brand-sunriseCoral bg-brand-sunriseCoral/10 border border-brand-sunriseCoral/30 rounded-xl px-3 py-2">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-brand-caribbeanSea hover:bg-brand-caribbeanSea disabled:opacity-50 text-slate-950 font-bold px-6 py-2 rounded-xl text-xs transition-colors"
      >
        {pending ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  );
}
