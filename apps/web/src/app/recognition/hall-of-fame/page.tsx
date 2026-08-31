import React from 'react';
import Link from 'next/link';
import { Landmark, Crown, Shield, ArrowLeft, Trophy } from 'lucide-react';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import UserAvatar from '../../../components/user-avatar';
import FounderBadge from '../../../components/recognition/founder-badge';

export const dynamic = 'force-dynamic';

export default async function HallOfFamePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = 'founding_1000' } = await searchParams;
  const supabase = await createSupabaseServerClient();

  let members: any[] = [];
  if (supabase) {
    if (tab === 'founding_1000' || tab === 'founding_elite_100') {
      const { data } = await supabase
        .from('founder_members')
        .select(`
          founder_number, formatted_number, allocated_at,
          profile:profiles(id, username, display_name, avatar_url, is_verified, account_type),
          program:founder_programs(name, designation)
        `)
        .eq('is_revoked', false)
        .order('founder_number', { ascending: true })
        .limit(100);
      members = data ?? [];
    } else if (tab === 'council') {
      const { data } = await supabase
        .from('founders_council_members')
        .select(`
          seat_number, joined_at,
          profile:profiles(id, username, display_name, avatar_url, is_verified)
        `)
        .eq('status', 'active')
        .order('joined_at', { ascending: true });
      members = data ?? [];
    } else if (tab === 'ambassadors') {
      const { data } = await supabase
        .from('ambassador_members')
        .select(`
          territory, appointed_at,
          profile:profiles(id, username, display_name, avatar_url, is_verified)
        `)
        .eq('status', 'active')
        .order('appointed_at', { ascending: true });
      members = data ?? [];
    }
  }

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone">
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
            <Trophy className="w-4 h-4 text-amber-400" /> TUKUBI Hall of Fame
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
            🏛️ Permanent Legacy Registry
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-brand-sandstone">
            TUKUBI Hall of Fame
          </h1>
          <p className="text-xs sm:text-sm text-brand-sandstone/60 leading-relaxed">
            Honoring the founders, community leaders, council members, and platform ambassadors who established the foundation of the Caribbean Digital Ecosystem.
          </p>
        </div>

        {/* Category Tabs */}
        <nav className="flex justify-center border-b border-slate-800 gap-4 sm:gap-8 text-xs sm:text-sm font-bold">
          <Link
            href="/recognition/hall-of-fame?tab=founding_1000"
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
              tab === 'founding_1000'
                ? 'border-amber-400 text-amber-300 font-black'
                : 'border-transparent text-brand-sandstone/60 hover:text-white'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Founding 1000</span>
          </Link>
          <Link
            href="/recognition/hall-of-fame?tab=council"
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
              tab === 'council'
                ? 'border-purple-400 text-purple-300 font-black'
                : 'border-transparent text-brand-sandstone/60 hover:text-white'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Founders Council</span>
          </Link>
          <Link
            href="/recognition/hall-of-fame?tab=ambassadors"
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
              tab === 'ambassadors'
                ? 'border-emerald-400 text-emerald-300 font-black'
                : 'border-transparent text-brand-sandstone/60 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Ambassadors</span>
          </Link>
        </nav>

        {/* Member Grid */}
        {members.length === 0 ? (
          <div className="bg-brand-dusk/40 border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-2">
            <Trophy className="w-10 h-10 mx-auto text-brand-sandstone/20" />
            <h3 className="text-sm font-bold text-brand-sandstone">Members Inscribed Soon</h3>
            <p className="text-xs text-brand-sandstone/50 max-w-sm mx-auto">
              Founding registrations and council inductions are being chronologically processed.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((item, idx) => {
              const profile = item.profile;
              if (!profile) return null;

              return (
                <Link
                  key={idx}
                  href={`/profile/${profile.username}`}
                  className="bg-brand-dusk/60 hover:bg-brand-dusk/90 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-5 transition-all space-y-4 group block shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      src={profile.avatar_url}
                      name={profile.display_name}
                      size="md"
                    />
                    <div className="overflow-hidden">
                      <h4 className="text-sm font-black text-brand-sandstone group-hover:text-amber-300 transition-colors truncate">
                        {profile.display_name}
                      </h4>
                      <p className="text-xs text-brand-sandstone/50 truncate">@{profile.username}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    {item.formatted_number ? (
                      <span className="font-mono text-amber-300 font-black">
                        {item.formatted_number}
                      </span>
                    ) : item.territory ? (
                      <span className="text-emerald-300 font-bold">{item.territory}</span>
                    ) : (
                      <span className="text-purple-300 font-bold">Council Seat</span>
                    )}

                    <span className="text-[11px] text-brand-sandstone/40">
                      {item.allocated_at || item.joined_at || item.appointed_at
                        ? new Date(item.allocated_at || item.joined_at || item.appointed_at).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Founder'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
