'use client';

import React, { useState, useTransition } from 'react';
import { createPostAction, type PostActionState } from '../lib/social/actions';

export default function PostComposer({ displayName }: { displayName: string }) {
  const [state, setState] = useState<PostActionState>({ error: null });
  const [pending, startTransition] = useTransition();
  const [content, setContent] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      void createPostAction(state, formData).then((next) => {
        setState(next);
        if (!next.error) setContent('');
      });
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-sky-600/30 text-sky-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
          {displayName.slice(0, 2).toUpperCase()}
        </div>
        <textarea
          name="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="What's happening in your Caribbean world?"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors resize-none h-20"
        />
      </div>
      {state.error && (
        <p role="alert" className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
          {state.error}
        </p>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
        <span className="text-[11px] text-slate-500">Screened by CaribAI before publishing</span>
        <button
          type="submit"
          disabled={pending || content.length === 0}
          className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold px-5 py-1.5 rounded-full text-xs transition-colors"
        >
          {pending ? 'Publishing…' : 'Publish Post'}
        </button>
      </div>
    </form>
  );
}
