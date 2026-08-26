import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ShieldAlert, Lock, ArrowRight, AlertTriangle } from 'lucide-react';
import { createServiceSupabaseClient, createSupabaseServerClient } from '../../../lib/supabase/server';
import BootstrapForm from '../../../components/admin/bootstrap-form';

export const dynamic = 'force-dynamic';

export default async function SuperAdminBootstrapPage() {
  let isAlreadyInitialized = false;
  let hasServiceKey = true;
  let errorMessage: string | null = null;

  try {
    const serviceSupabase = await createServiceSupabaseClient();
    const anonSupabase = await createSupabaseServerClient();
    const supabase = serviceSupabase || anonSupabase;

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_KEY) {
      hasServiceKey = false;
    }

    if (supabase) {
      const { count, error } = await supabase
        .from('accounts')
        .select('id', { count: 'exact', head: true })
        .in('role', ['super_admin', 'superadmin', 'management']);

      if (error) {
        console.warn('Bootstrap check notice:', error.message);
      } else {
        isAlreadyInitialized = (count ?? 0) > 0;
      }
    }
  } catch (err) {
    console.error('SuperAdminBootstrapPage error:', err);
    errorMessage = err instanceof Error ? err.message : 'Unable to connect to database.';
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-950/60 border border-brand-caribbeanSea/30 text-brand-caribbeanSea shadow-lg shadow-sky-500/10 mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-brand-sandstone tracking-tight">
            ANTILIA Platform Security
          </h1>
          <p className="text-xs text-brand-sandstone/60">
            Role-Based Access Control (RBAC) & Root Authority Initialization
          </p>
        </div>

        {!hasServiceKey && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-amber-300 text-xs">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Missing Service Role Key</p>
              <p className="mt-0.5 text-amber-300/80">
                Please ensure <code className="bg-amber-500/20 px-1.5 py-0.5 rounded font-mono">SUPABASE_SERVICE_ROLE_KEY</code> is configured in your Vercel Project Environment Variables to enable administrative provisioning.
              </p>
            </div>
          </div>
        )}

        {isAlreadyInitialized ? (
          <div className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-brand-sandstone">Platform Already Initialized</h2>
              <p className="text-xs text-brand-sandstone/60 max-w-md mx-auto">
                A Root Super Admin account is already active. For security, the bootstrap procedure is locked.
                Administrative accounts and staff roles must be created by an authenticated Super Admin through the Admin Command Center.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/login?next=/admin"
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-950 bg-brand-caribbeanSea hover:bg-sky-400 px-6 py-3 rounded-xl transition-all shadow-lg shadow-sky-500/20"
              >
                Sign In to Admin Console <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-base font-bold text-brand-sandstone flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-brand-goldenHour" /> Initial Super Admin Bootstrap
              </h2>
              <p className="text-xs text-brand-sandstone/60 mt-1">
                No Super Admin exists. Configure the root authority account below.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            <BootstrapForm />
          </div>
        )}
      </div>
    </div>
  );
}
