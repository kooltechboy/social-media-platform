import React from 'react';
import Link from 'next/link';
import { FlaskConical, ArrowLeft, Check, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import { RecognitionService } from '../../lib/recognition/recognition-service';
import LabsProgramList from './labs-program-list';

export const dynamic = 'force-dynamic';

export default async function LabsPage() {
  const [supabase, currentUser] = await Promise.all([
    createSupabaseServerClient(),
    getCurrentUser(),
  ]);

  const recognitionService = supabase ? new RecognitionService(supabase) : null;
  const programs = recognitionService ? await recognitionService.getLabsPrograms(currentUser?.id) : [];

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone">
      <header className="sticky top-0 z-40 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
          <span className="text-slate-700">|</span>
          <span className="text-xs font-black text-brand-sandstone flex items-center gap-1.5">
            <FlaskConical className="w-4 h-4 text-brand-caribbeanSea" /> TUKUBI Labs
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Banner */}
        <section className="bg-gradient-to-r from-teal-950/60 via-slate-900 to-cyan-950/60 border border-teal-500/30 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="max-w-2xl space-y-3 relative z-10">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
              <Sparkles className="w-3.5 h-3.5" /> Experimental Features
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-brand-sandstone">
              TUKUBI Labs (Beta)
            </h1>
            <p className="text-xs sm:text-sm text-brand-sandstone/70 leading-relaxed">
              Opt in to test upcoming creator tools, marketplace enhancements, and AI capabilities before general availability. Your feedback directly shapes our product roadmap.
            </p>
          </div>
        </section>

        {/* Labs Programs List with Interactive Join / Feedback */}
        <LabsProgramList programs={programs} isAuthenticated={Boolean(currentUser)} />
      </main>
    </div>
  );
}
