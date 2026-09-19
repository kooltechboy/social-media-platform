'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  PlusCircle,
  Clock,
  MapPin,
  ChevronRight,
  Bookmark,
  Sparkles,
} from 'lucide-react';

export interface EventsRailProps {
  activeFilter?: string;
  upcomingFestivals?: Array<{
    id: string;
    title: string;
    date: string;
    location: string;
  }>;
}

export default function EventsRail({
  activeFilter = 'all',
  upcomingFestivals = [],
}: EventsRailProps) {
  const FESTIVALS =
    upcomingFestivals.length > 0
      ? upcomingFestivals
      : [
          { id: '1', title: 'Trinidad Carnival', date: 'Feb / Mar', location: 'Port of Spain, TTO' },
          { id: '2', title: 'Crop Over Festival', date: 'Jul / Aug', location: 'Bridgetown, BRB' },
          { id: '3', title: 'Reggae Sumfest', date: 'July', location: 'Montego Bay, JAM' },
          { id: '4', title: 'Kanaval d’Haïti', date: 'February', location: 'Port-au-Prince / Jacmel' },
        ];

  return (
    <div className="space-y-5">
      {/* 1. Host Event CTA */}
      <div className="glass rounded-3xl p-5 border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent space-y-3 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-brand-sunriseCoral flex items-center justify-center text-slate-950 font-black shadow-md">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Create an Event</h3>
            <p className="text-[10px] text-brand-sandstone/60">
              Concerts, fetes &amp; cultural summits
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Promote your event to local islanders and the international diaspora community.
        </p>
        <Link
          href="/events"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-md"
        >
          <PlusCircle className="w-4 h-4 text-slate-950" />
          <span>Post Event</span>
        </Link>
      </div>

      {/* 2. Event Filters */}
      <section aria-label="Event Categories" className="glass rounded-3xl p-4 sm:p-5 space-y-2 border border-white/10">
        <h4 className="text-xs font-black text-white uppercase tracking-wider">
          Event Discovery
        </h4>
        <nav className="space-y-1 pt-1">
          <Link
            href="/events"
            className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-goldenHour" />
              Discover All Events
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-white/40" />
          </Link>
          <Link
            href="/events?filter=upcoming"
            className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              Upcoming This Month
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-white/40" />
          </Link>
        </nav>
      </section>

      {/* 3. Major Caribbean Festivals Calendar */}
      <section aria-label="Major Festivals" className="glass rounded-3xl p-4 sm:p-5 space-y-3 border border-white/10">
        <h4 className="text-xs font-black text-white uppercase tracking-wider">
          Major Annual Carnivals
        </h4>
        <div className="space-y-2 pt-0.5">
          {FESTIVALS.map((f) => (
            <div
              key={f.id}
              className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-0.5"
            >
              <p className="text-xs font-black text-white">{f.title}</p>
              <div className="flex items-center justify-between text-[10px] text-brand-sandstone/60">
                <span>{f.date}</span>
                <span>{f.location}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
