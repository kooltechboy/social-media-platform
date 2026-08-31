import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SuperAdminBootstrapPage() {
  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-brand-sandstone tracking-tight">
            TUKUBI Platform Security
          </h1>
          <p className="text-xs text-brand-sandstone/60">
            Root authority initialization
          </p>
        </div>

        <div className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-brand-sandstone">Bootstrap is disabled</h2>
              <p className="text-xs text-brand-sandstone/60 max-w-md mx-auto">
                Root administrator initialization is an operational deployment task and cannot be performed from a public web page.
                Existing administrators manage staff through the Admin Command Center.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/login?next=/admin"
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-950 bg-brand-caribbeanSea hover:bg-sky-400 px-6 py-3 rounded-xl transition-all shadow-lg shadow-sky-500/20"
              >
                Sign In to Admin Console
              </Link>
            </div>
          </div>
        </div>
    </div>
  );
}
