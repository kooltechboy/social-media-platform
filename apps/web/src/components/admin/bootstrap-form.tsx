'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { ShieldAlert, ShieldCheck, Key, Mail, User, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { bootstrapSuperAdminAction } from '../../lib/admin/staff-actions';
import type { ActionResponse } from '../../lib/admin/types';

const initialState: ActionResponse = { error: null, success: null };

export default function BootstrapForm() {
  const [state, formAction, isPending] = useActionState(bootstrapSuperAdminAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-start gap-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Bootstrap Rejected</p>
            <p className="text-xs text-rose-300/80 mt-0.5">{state.error}</p>
          </div>
        </div>
      )}

      {state.success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 flex items-start gap-3 text-emerald-300 text-sm">
          <Check className="w-6 h-6 flex-shrink-0 mt-0.5 text-emerald-400" />
          <div className="space-y-3">
            <div>
              <p className="font-bold text-base text-emerald-300">Root Super Admin Initialized!</p>
              <p className="text-xs text-emerald-300/80 mt-1">{state.success}</p>
            </div>
            <div className="bg-[#090D16] border border-emerald-500/30 rounded-xl p-3 text-xs text-brand-sandstone space-y-1">
              <p className="font-semibold text-emerald-400">Next Steps:</p>
              <p className="text-brand-sandstone/70">
                1. Sign in to your account with your credentials at <code className="text-emerald-300">/login</code>.
              </p>
              <p className="text-brand-sandstone/70">
                2. Navigate to <code className="text-emerald-300">/admin/administrators</code> to create team roles.
              </p>
            </div>
            <div>
              <Link
                href="/login?next=/admin"
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
              >
                Proceed to Login <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {!state.success && (
        <>
          <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-sandstone/70 mb-1">
                  Full Name / Display Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    name="displayName"
                    required
                    placeholder="Chief Administrator"
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-brand-sandstone placeholder:text-slate-600 focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-sandstone/70 mb-1">
                  Root Username <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-semibold">@</span>
                  <input
                    type="text"
                    name="username"
                    required
                    placeholder="superadmin"
                    pattern="[a-zA-Z0-9_]{3,30}"
                    title="3-30 letters, numbers, or underscores"
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-brand-sandstone placeholder:text-slate-600 focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-sandstone/70 mb-1">
                Super Admin Email <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="admin@caribbeanone.app"
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-brand-sandstone placeholder:text-slate-600 focus:outline-none focus:border-brand-caribbeanSea"
                />
              </div>
              <p className="text-[11px] text-brand-sandstone/40 mt-1">
                Will be registered as the root administrative user in Supabase Auth.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-sandstone/70 mb-1">
                Root Master Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  name="password"
                  required
                  minLength={10}
                  placeholder="Min 10 characters (high entropy recommended)"
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-brand-sandstone placeholder:text-slate-600 focus:outline-none focus:border-brand-caribbeanSea"
                />
              </div>
            </div>
          </div>

          <div className="bg-sky-950/20 border border-sky-800/40 rounded-2xl p-4 flex items-start gap-3 text-xs text-brand-sandstone/70">
            <ShieldCheck className="w-5 h-5 text-brand-caribbeanSea flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-brand-caribbeanSea">Immutable Authority Guarantee</p>
              <p className="mt-0.5">
                This bootstrap process executes <code className="text-sky-300">public.bootstrap_super_admin()</code> with PostgreSQL atomicity. Once created, this bootstrap endpoint permanently disables itself.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-brand-caribbeanSea hover:bg-sky-400 text-slate-950 font-bold py-3 px-6 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            {isPending ? 'Executing Atomically...' : 'Initialize Root Super Admin'}
          </button>
        </>
      )}
    </form>
  );
}
