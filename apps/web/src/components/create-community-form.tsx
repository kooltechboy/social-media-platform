'use client';

import React, { useState, useTransition } from 'react';
import { Plus, X } from 'lucide-react';
import { createCommunityAction, type CommunityActionState } from '../lib/communities/actions';

const INITIAL: CommunityActionState = { error: null, success: null };

export default function CreateCommunityForm() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<CommunityActionState>(INITIAL);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      void createCommunityAction(INITIAL, formData).then((result) => {
        setState(result);
        if (!result.error) setOpen(false);
      });
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-brand-caribbeanSea hover:bg-brand-caribbeanSea text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors"
      >
        <Plus className="w-4 h-4" /> Create Community
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-brand-twilight/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-brand-dusk border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-brand-sandstone">Create a Community</h2>
          <button onClick={() => setOpen(false)} className="p-1 text-brand-sandstone/60 hover:text-brand-sandstone">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="comm-name" className="text-xs font-semibold text-brand-sandstone/60 block mb-1">
              Community Name *
            </label>
            <input
              id="comm-name"
              name="name"
              required
              minLength={3}
              maxLength={80}
              className="w-full bg-brand-twilight border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
              placeholder="e.g. Jamaicans in Toronto"
            />
          </div>

          <div>
            <label htmlFor="comm-desc" className="text-xs font-semibold text-brand-sandstone/60 block mb-1">
              Description
            </label>
            <textarea
              id="comm-desc"
              name="description"
              maxLength={500}
              rows={3}
              className="w-full bg-brand-twilight border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea resize-none"
              placeholder="What is this community about?"
            />
          </div>

          <div>
            <label htmlFor="comm-policy" className="text-xs font-semibold text-brand-sandstone/60 block mb-1">
              Membership
            </label>
            <select
              id="comm-policy"
              name="joinPolicy"
              className="w-full bg-brand-twilight border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
            >
              <option value="public">Public — anyone can join</option>
              <option value="private">Private — request required</option>
              <option value="invite_only">Invite Only</option>
            </select>
          </div>

          {state.error && (
            <p role="alert" className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
              {state.error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 bg-brand-dusk hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 bg-brand-caribbeanSea hover:bg-brand-caribbeanSea disabled:opacity-50 text-slate-950 font-bold py-2 rounded-xl text-xs transition-colors"
            >
              {pending ? 'Creating…' : 'Create Community'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
