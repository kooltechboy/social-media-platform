import React from 'react';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import { FileText, Download } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StatementsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-caribbeanSea" /> Financial Statements &amp; Reports
        </h2>
        <p className="text-xs text-slate-400">
          Monthly account summaries, tax reports, and immutable audit logs.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-brand-dusk/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white">Monthly Summary Reports</h3>
        <p className="text-xs text-slate-400">
          Statements are compiled at the close of each calendar month and archived for 7 years in accordance with financial record retention standards.
        </p>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Current Billing Cycle: {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          <span className="text-brand-goldenHour font-semibold">Active &bull; In Progress</span>
        </div>
      </div>
    </div>
  );
}
