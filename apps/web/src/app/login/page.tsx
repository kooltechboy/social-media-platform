'use client';

import React, { useState, useTransition } from 'react';
import { signInAction, signUpAction, type AuthFormState } from '../../lib/auth/actions';

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [state, setState] = useState<AuthFormState>({ error: null, info: null });
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      const action = mode === 'signin' ? signInAction : signUpAction;
      void action(state, formData).then((next) => setState(next));
    });
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black bg-gradient-to-r from-sky-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent">
            CARIBBEAN ONE
          </h1>
          <p className="text-sm text-slate-400 mt-2">The digital home of the Caribbean and its global diaspora.</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setMode('signin'); setState({ error: null, info: null }); }}
              className={`py-2 rounded-lg text-xs font-bold transition-colors ${mode === 'signin' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setState({ error: null, info: null }); }}
              className={`py-2 rounded-lg text-xs font-bold transition-colors ${mode === 'signup' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <>
                <input
                  name="displayName"
                  type="text"
                  placeholder="Display name"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                />
                <input
                  name="username"
                  type="text"
                  placeholder="Username"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </>
            )}
            <input
              name="email"
              type="email"
              required
              placeholder="Email address"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
            <input
              name="password"
              type="password"
              required
              placeholder={mode === 'signup' ? 'Password (min 8 characters)' : 'Password'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />

            {state.error && (
              <p role="alert" className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">{state.error}</p>
            )}
            {state.info && (
              <p role="status" className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">{state.info}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-slate-950 font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              {pending ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center">
            Caribbean identity is optional and private by default. You control what is visible.
          </p>
        </div>
      </div>
    </div>
  );
}
