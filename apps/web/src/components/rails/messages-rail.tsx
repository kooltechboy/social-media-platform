'use client';

import React from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Users,
  ShieldAlert,
  Search,
  Settings,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export interface MessagesRailProps {
  unreadCount?: number;
}

export default function MessagesRail({
  unreadCount = 0,
}: MessagesRailProps) {
  return (
    <div className="space-y-5">
      {/* 1. Direct Messaging Hub Overview */}
      <div className="glass rounded-3xl p-5 border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-transparent space-y-2.5 shadow-xl">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-black text-white">Direct Conversations</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Communicate with Caribbean friends, marketplace sellers, creators, and community members.
        </p>
      </div>

      {/* 2. Message Navigation Folders */}
      <section aria-label="Message Folders" className="glass rounded-3xl p-4 sm:p-5 space-y-2 border border-white/10">
        <h4 className="text-xs font-black text-white uppercase tracking-wider">
          Folders &amp; Filters
        </h4>
        <nav className="space-y-1 pt-1">
          <Link
            href="/messages"
            className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              All Conversations
            </span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-brand-caribbeanSea text-slate-950 font-black text-[10px]">
                {unreadCount}
              </span>
            )}
          </Link>

          <Link
            href="/messages?tab=unread"
            className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors"
          >
            <span>Unread Messages</span>
            <ChevronRight className="w-3.5 h-3.5 text-white/40" />
          </Link>

          <Link
            href="/messages?tab=requests"
            className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors"
          >
            <span>Message Requests</span>
            <ChevronRight className="w-3.5 h-3.5 text-white/40" />
          </Link>
        </nav>
      </section>

      {/* 3. Quick Connect People */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
        <p className="text-xs font-black text-white flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Looking for Friends?
        </p>
        <p className="text-[11px] text-brand-sandstone/70 leading-relaxed">
          Search members across the Caribbean islands or connect with people you know.
        </p>
        <Link
          href="/people"
          className="inline-block w-full text-center py-2 px-3 rounded-xl bg-brand-caribbeanSea hover:bg-brand-caribbeanSea/80 text-slate-950 font-black text-xs transition-colors shadow-sm"
        >
          Find Members
        </Link>
      </div>
    </div>
  );
}
