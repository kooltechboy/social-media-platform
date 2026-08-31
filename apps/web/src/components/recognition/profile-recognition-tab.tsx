import React from 'react';
import {
  Trophy,
  Award,
  Crown,
  Landmark,
  Sparkles,
  Users,
  Shield,
  GraduationCap,
  Share2,
} from 'lucide-react';
import Link from 'next/link';
import type { ProfileRecognitionSummary } from '../../lib/recognition/types';
import FounderBadge from './founder-badge';
import BadgePill from './badge-pill';
import BadgeCard from './badge-card';

interface ProfileRecognitionTabProps {
  recognition: ProfileRecognitionSummary;
  username: string;
  isOwnProfile?: boolean;
}

export default function ProfileRecognitionTab({
  recognition,
  username,
  isOwnProfile = false,
}: ProfileRecognitionTabProps) {
  const { founder, reputation, badges, achievements, council, ambassador } = recognition;

  return (
    <div className="space-y-6">
      {/* Top Banner: Founder Status & Reputation Overview */}
      <section className="bg-gradient-to-r from-brand-dusk/90 via-slate-900 to-brand-dusk/90 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {founder.is_founder && <FounderBadge founder={founder} size="lg" showProgramName={true} />}
              {council.is_member && (
                <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  <Crown className="w-3.5 h-3.5 text-purple-400" /> Founders Council
                </span>
              )}
              {ambassador.is_ambassador && (
                <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" /> TUKUBI Ambassador
                </span>
              )}
            </div>

            <h3 className="text-lg font-black text-brand-sandstone flex items-center gap-2 pt-1">
              <span>{reputation.level_emoji}</span>
              <span>Level {reputation.level_tier} — {reputation.level_name}</span>
            </h3>
            <p className="text-xs text-brand-sandstone/60 max-w-xl">
              {reputation.level_title}. Recognition is permanently tied to verified contributions, historical participation, and authentic community standing.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0">
            <Link
              href="/recognition"
              className="bg-brand-dusk hover:bg-slate-800 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-2xl border border-slate-700 transition-colors text-center w-full sm:w-auto"
            >
              Status Directory
            </Link>
          </div>
        </div>
      </section>

      {/* Badges Gallery */}
      <section className="bg-brand-dusk/60 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-brand-caribbeanSea flex items-center gap-2">
            <Award className="w-4 h-4" /> Earned Badges ({badges.length})
          </h3>
          <Link
            href="/recognition"
            className="text-xs text-brand-sandstone/60 hover:text-brand-caribbeanSea font-bold transition-colors"
          >
            Explore Catalog →
          </Link>
        </div>

        {badges.length === 0 ? (
          <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-2">
            <Award className="w-8 h-8 mx-auto text-brand-sandstone/20" />
            <p className="text-xs text-brand-sandstone/50">
              {isOwnProfile
                ? 'Engage with creator content, invite verified friends, or launch a marketplace store to earn your first badges.'
                : `@${username} hasn't earned public badges yet.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                isUnlocked={true}
                unlockedAt={badge.awarded_at}
              />
            ))}
          </div>
        )}
      </section>

      {/* Digital Achievements */}
      <section className="bg-brand-dusk/60 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-brand-goldenHour flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Achievements ({achievements.length})
          </h3>
          <Link
            href="/recognition/achievements"
            className="text-xs text-brand-sandstone/60 hover:text-brand-goldenHour font-bold transition-colors"
          >
            View All Achievements →
          </Link>
        </div>

        {achievements.length === 0 ? (
          <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-2">
            <Trophy className="w-8 h-8 mx-auto text-brand-sandstone/20" />
            <p className="text-xs text-brand-sandstone/50">
              No digital achievements unlocked yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {achievements.map((a) => (
              <div
                key={a.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-brand-sandstone">{a.name}</h5>
                    <p className="text-[11px] text-brand-sandstone/60 mt-0.5">{a.description}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-400 font-mono bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 whitespace-nowrap">
                  +{a.points} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
