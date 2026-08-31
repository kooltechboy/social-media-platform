import React from 'react';
import Link from 'next/link';
import { Trophy, ArrowLeft, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AchievementsDirectoryPage() {
  const [supabase, currentUser] = await Promise.all([
    createSupabaseServerClient(),
    getCurrentUser(),
  ]);

  let achievements: any[] = [];
  let userProgressMap = new Map<string, { is_unlocked: boolean; unlocked_at?: string }>();

  if (supabase) {
    const { data } = await supabase
      .from('recognition_achievements')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    achievements = data ?? [];

    if (currentUser) {
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id, is_unlocked, unlocked_at')
        .eq('profile_id', currentUser.id);

      if (userAchievements) {
        userProgressMap = new Map(
          userAchievements.map((ua) => [
            ua.achievement_id,
            { is_unlocked: ua.is_unlocked, unlocked_at: ua.unlocked_at },
          ])
        );
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone">
      <header className="sticky top-0 z-40 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/recognition"
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Recognition
          </Link>
          <span className="text-slate-700">|</span>
          <span className="text-xs font-black text-brand-sandstone flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-brand-goldenHour" /> Digital Achievements
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-brand-goldenHour/20 text-amber-300 border border-brand-goldenHour/40 inline-block">
            Trophy Room
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-sandstone">
            Platform Achievements
          </h1>
          <p className="text-xs sm:text-sm text-brand-sandstone/60">
            Earn points, unlock permanent profile badges, and build your Caribbean reputation through genuine engagement.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {achievements.map((a) => {
            const userState = userProgressMap.get(a.id);
            const isUnlocked = userState?.is_unlocked ?? false;

            return (
              <div
                key={a.id}
                className={`bg-brand-dusk/60 border rounded-3xl p-5 flex flex-col justify-between transition-all ${
                  isUnlocked
                    ? 'border-amber-500/40 shadow-lg shadow-amber-950/20'
                    : 'border-slate-800 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                        isUnlocked
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}
                    >
                      {isUnlocked ? <Sparkles className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-brand-sandstone">{a.name}</h4>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-sandstone/40">
                        {a.category}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                    +{a.points} PTS
                  </span>
                </div>

                <p className="text-xs text-brand-sandstone/60 leading-relaxed mt-2">{a.description}</p>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  {isUnlocked ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Unlocked
                    </span>
                  ) : (
                    <span className="text-brand-sandstone/40">Locked Milestone</span>
                  )}

                  {userState?.unlocked_at && (
                    <span className="text-brand-sandstone/40">
                      {new Date(userState.unlocked_at).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
