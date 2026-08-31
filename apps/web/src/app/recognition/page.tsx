import React from 'react';
import Link from 'next/link';
import {
  Landmark,
  Crown,
  Sparkles,
  Trophy,
  Users,
  Shield,
  ArrowRight,
  Globe,
  Award,
  FlaskConical,
} from 'lucide-react';
import { createSupabaseServerClient } from '../../lib/supabase/server';
import { RecognitionService } from '../../lib/recognition/recognition-service';
import BadgeCard from '../../components/recognition/badge-card';

export const dynamic = 'force-dynamic';

export default async function RecognitionHubPage() {
  const supabase = await createSupabaseServerClient();
  const recognitionService = supabase ? new RecognitionService(supabase) : null;

  const [programsResult, badgesResult, spotlights] = await Promise.all([
    supabase
      ? supabase.from('founder_programs').select('*').order('max_members', { ascending: true })
      : Promise.resolve({ data: [] }),
    supabase
      ? supabase.from('recognition_badges').select('*').eq('is_active', true).order('display_priority', { ascending: false }).limit(9)
      : Promise.resolve({ data: [] }),
    recognitionService ? recognitionService.getActiveSpotlights() : Promise.resolve([]),
  ]);

  const programs = programsResult.data ?? [];
  const featuredBadges = badgesResult.data ?? [];

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            ← Home
          </Link>
          <span className="text-slate-700">|</span>
          <span className="text-xs font-black text-brand-sandstone">
            TUKUBI Status &amp; Recognition
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/recognition/hall-of-fame"
            className="text-slate-300 hover:text-white font-bold px-3 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-800 transition-colors"
          >
            Hall of Fame
          </Link>
          <Link
            href="/recognition/achievements"
            className="text-amber-300 hover:text-amber-200 font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 transition-colors"
          >
            Achievements
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-10">
        {/* Hero Section */}
        <section className="relative rounded-3xl p-8 sm:p-12 overflow-hidden bg-gradient-to-br from-brand-dusk via-slate-900 to-[#101A30] border border-amber-500/30 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Landmark className="w-4 h-4" /> TUKUBI Founders Program
            </span>

            <h1 className="text-3xl sm:text-5xl font-black text-brand-sandstone tracking-tight leading-tight">
              You weren&apos;t just here early. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-brand-goldenHour to-brand-sunriseCoral">
                You helped build TUKUBI.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-brand-sandstone/70 leading-relaxed">
              Permanent historical distinctions, authentic social status, exclusive early access, and verified creator, merchant, and business recognition across the Caribbean digital sphere.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/recognition/hall-of-fame"
                className="bg-gradient-to-r from-amber-500 via-amber-400 to-brand-goldenHour text-slate-950 font-black text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
              >
                <span>Explore Hall of Fame</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/labs"
                className="bg-brand-dusk hover:bg-slate-800 text-slate-200 font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl border border-slate-700 transition-colors flex items-center gap-2"
              >
                <FlaskConical className="w-4 h-4 text-brand-caribbeanSea" />
                <span>TUKUBI Labs (Beta)</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Founding Tiers Progress */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-brand-sandstone">Founding Membership Programs</h2>
              <p className="text-xs text-brand-sandstone/60">Strictly allocated chronological founder sequence</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {programs.map((p) => {
              const remaining = Math.max(0, p.max_members - p.current_count);
              const percent = Math.min(100, Math.round((p.current_count / p.max_members) * 100));

              return (
                <div
                  key={p.id}
                  className="bg-brand-dusk/60 border border-slate-800 rounded-3xl p-5 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                      {p.designation}
                    </span>
                    <h3 className="text-sm font-black text-brand-sandstone">{p.name}</h3>
                    <p className="text-xs text-brand-sandstone/60 leading-relaxed">{p.description}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-brand-sandstone/50">Allocated</span>
                      <span className="text-amber-300 font-bold">
                        {p.current_count.toLocaleString()} / {p.max_members.toLocaleString()}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-brand-caribbeanSea rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Featured Badges Showcase */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-brand-sandstone">Badge Catalog Preview</h2>
              <p className="text-xs text-brand-sandstone/60">Configurable, database-driven recognition achievements</p>
            </div>
            <Link
              href="/recognition/achievements"
              className="text-xs font-bold text-brand-caribbeanSea hover:underline"
            >
              View Achievements →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} isUnlocked={true} />
            ))}
          </div>
        </section>

        {/* Spotlights Carousel / Feed */}
        {spotlights.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-black text-brand-sandstone">Member &amp; Creator Spotlights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {spotlights.map((s) => (
                <div
                  key={s.id}
                  className="bg-brand-dusk/60 border border-slate-800 rounded-3xl p-6 space-y-3"
                >
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-caribbeanSea/15 text-brand-caribbeanSea border border-brand-caribbeanSea/30">
                    {s.category.replace(/_/g, ' ')}
                  </span>
                  <h3 className="text-base font-black text-brand-sandstone">{s.headline}</h3>
                  <p className="text-xs text-brand-sandstone/70 leading-relaxed">{s.story}</p>
                  <div className="pt-2 flex items-center gap-2">
                    <Link
                      href={`/profile/${s.profile.username}`}
                      className="text-xs font-bold text-amber-300 hover:underline"
                    >
                      View @{s.profile.username}&apos;s Profile →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
