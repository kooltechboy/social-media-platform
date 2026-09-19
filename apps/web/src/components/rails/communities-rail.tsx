'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  PlusCircle,
  Compass,
  Flame,
  Shield,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

export interface CommunitiesRailProps {
  myCommunities?: Array<{
    id: string;
    name: string;
    slug: string;
    avatar_url?: string | null;
    members_count?: number;
  }>;
  suggestedCommunities?: Array<{
    id: string;
    name: string;
    slug: string;
    category?: string;
    members_count?: number;
  }>;
  activeCommunity?: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    members_count?: number;
    rules?: string[];
    is_admin?: boolean;
  } | null;
}

export default function CommunitiesRail({
  myCommunities = [],
  suggestedCommunities = [],
  activeCommunity = null,
}: CommunitiesRailProps) {
  // Individual Community Rail View
  if (activeCommunity) {
    return (
      <div className="space-y-5">
        <div className="glass rounded-3xl p-5 border border-white/10 space-y-3 shadow-lg">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
              Community Hub
            </span>
            <h3 className="text-lg font-black text-white">{activeCommunity.name}</h3>
            {activeCommunity.members_count !== undefined && (
              <p className="text-xs font-bold text-brand-sandstone/70">
                {activeCommunity.members_count} active members
              </p>
            )}
          </div>
          {activeCommunity.description && (
            <p className="text-xs text-slate-300 leading-relaxed">
              {activeCommunity.description}
            </p>
          )}
        </div>

        {/* Community Navigation */}
        <section aria-label="Community Sections" className="glass rounded-3xl p-4 sm:p-5 space-y-2.5 border border-white/10">
          <h4 className="text-xs font-black text-white uppercase tracking-wider">
            Hub Navigation
          </h4>
          <nav className="space-y-1 pt-0.5">
            <Link
              href={`/communities/${activeCommunity.slug}`}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors"
            >
              <span>Posts &amp; Discussions</span>
              <ChevronRight className="w-3.5 h-3.5 text-white/40" />
            </Link>
            <Link
              href={`/communities/${activeCommunity.slug}?tab=members`}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors"
            >
              <span>Members Directory</span>
              <ChevronRight className="w-3.5 h-3.5 text-white/40" />
            </Link>
            <Link
              href={`/communities/${activeCommunity.slug}?tab=events`}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors"
            >
              <span>Community Events</span>
              <ChevronRight className="w-3.5 h-3.5 text-white/40" />
            </Link>
            {activeCommunity.is_admin && (
              <Link
                href={`/communities/${activeCommunity.slug}/settings`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-bold transition-colors"
              >
                <span>Admin &amp; Moderation</span>
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
              </Link>
            )}
          </nav>
        </section>

        {/* Community Guidelines */}
        {activeCommunity.rules && activeCommunity.rules.length > 0 && (
          <section aria-label="Community Rules" className="glass rounded-3xl p-4 sm:p-5 space-y-2.5 border border-white/10">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-goldenHour" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Community Rules
              </h4>
            </div>
            <ul className="space-y-1.5 text-xs text-brand-sandstone/80 pt-1" role="list">
              {activeCommunity.rules.slice(0, 4).map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-black text-brand-goldenHour">{idx + 1}.</span>
                  <span className="leading-snug">{rule}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  // General Communities Directory Rail
  return (
    <div className="space-y-5">
      {/* 1. Create Community CTA */}
      <div className="glass rounded-3xl p-5 border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-brand-sunsetPurple/20 space-y-3 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-brand-caribbeanSea flex items-center justify-center text-slate-950 font-black shadow-md">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Create a Community</h3>
            <p className="text-[10px] text-brand-sandstone/60">
              Gather islanders &amp; diaspora
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Launch a hub for music enthusiasts, country diaspora clubs, tech innovators, or cultural traditions.
        </p>
        <Link
          href="/communities/create"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs transition-all shadow-md"
        >
          <PlusCircle className="w-4 h-4 text-slate-950" />
          <span>Launch Hub</span>
        </Link>
      </div>

      {/* 2. My Joined Communities */}
      {myCommunities.length > 0 && (
        <section aria-label="My Communities" className="glass rounded-3xl p-4 sm:p-5 space-y-3 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-caribbeanSea" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                My Communities
              </h4>
            </div>
          </div>

          <div className="space-y-1.5 pt-0.5">
            {myCommunities.slice(0, 5).map((comm) => (
              <Link
                key={comm.id}
                href={`/communities/${comm.slug}`}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <span className="text-xs font-bold text-white group-hover:text-brand-caribbeanSea transition-colors truncate">
                  {comm.name}
                </span>
                {comm.members_count !== undefined && (
                  <span className="text-[10px] text-brand-sandstone/50 font-bold shrink-0 ml-2">
                    {comm.members_count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 3. Suggested Communities */}
      {suggestedCommunities.length > 0 && (
        <section aria-label="Suggested Communities" className="glass rounded-3xl p-4 sm:p-5 space-y-3 border border-white/10">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-brand-goldenHour" />
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Popular Hubs to Join
            </h4>
          </div>

          <div className="space-y-2 pt-0.5">
            {suggestedCommunities.slice(0, 4).map((comm) => (
              <Link
                key={comm.id}
                href={`/communities/${comm.slug}`}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 block transition-colors group"
              >
                <p className="text-xs font-black text-white group-hover:text-brand-goldenHour transition-colors truncate">
                  {comm.name}
                </p>
                <div className="flex items-center justify-between text-[10px] text-brand-sandstone/60 mt-1">
                  <span>{comm.category || 'Caribbean Hub'}</span>
                  {comm.members_count !== undefined && (
                    <span>{comm.members_count} members</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
