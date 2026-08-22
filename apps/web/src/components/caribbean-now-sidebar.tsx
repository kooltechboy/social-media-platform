import React from 'react';
import Link from 'next/link';
import { Flame, Radio, Calendar, Sparkles, TrendingUp, ArrowUpRight, Wallet, MapPin } from 'lucide-react';

interface IslandPulse {
  city: string;
  country: string;
  flag: string;
  status: string;
  tag: string;
}

const ISLAND_PULSES: IslandPulse[] = [
  { city: 'Kingston', country: 'Jamaica', flag: '🇯🇲', status: 'Dancehall Session Live', tag: '#KingstonNights' },
  { city: 'Port of Spain', country: 'Trinidad', flag: '🇹🇹', status: 'Carnival Band Launch', tag: '#CarnivalTT' },
  { city: 'Santo Domingo', country: 'Dominican Rep.', flag: '🇩🇴', status: 'Tech Diaspora Meetup', tag: '#RDTech' },
  { city: 'Bridgetown', country: 'Barbados', flag: '🇧🇧', status: 'Crop Over Season Vibes', tag: '#CropOver2026' },
  { city: 'Miami', country: 'USA Diaspora', flag: '🗽', status: 'Wynwood Soca Fest', tag: '#MiamiCarnival' },
  { city: 'Toronto', country: 'Canada Diaspora', flag: '🇨🇦', status: 'Caribana Presale Live', tag: '#Caribana2026' },
  { city: 'London', country: 'UK Diaspora', flag: '🇬🇧', status: 'Notting Hill Prep', tag: '#LondonSoca' },
];

export default function CaribbeanNowSidebar() {
  return (
    <aside className="hidden lg:block col-span-1 space-y-5" aria-label="Caribbean Now Discovery">
      {/* Caribbean Now Live Ticker */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="bg-gradient-to-r from-red-400 via-amber-300 to-sky-400 bg-clip-text text-transparent">
              CARIBBEAN NOW
            </span>
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
            LIVE PULSE
          </span>
        </div>

        <div className="space-y-3">
          {ISLAND_PULSES.map((pulse) => (
            <Link
              key={pulse.city}
              href={`/explore?q=${encodeURIComponent(pulse.city)}`}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/60 hover:border-sky-500/40 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{pulse.flag}</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-extrabold text-xs text-slate-200 group-hover:text-sky-400 transition-colors">
                      {pulse.city}
                    </h4>
                    <span className="text-[10px] text-slate-500">• {pulse.country}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">{pulse.status}</p>
                </div>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* SpotPay Instant Wallet Quick Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-3xl p-5 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" /> SpotPay Ledger
          </span>
          <span className="text-[10px] font-bold text-slate-400">FDIC Partnered</span>
        </div>
        <div>
          <p className="text-xs text-slate-400">Personal Balance</p>
          <p className="text-2xl font-black text-white">$240.50 <span className="text-xs font-normal text-slate-400">USD</span></p>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link
            href="/spotpay"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2 px-3 rounded-xl text-xs text-center transition-colors shadow-sm shadow-emerald-500/20"
          >
            Send Money
          </Link>
          <Link
            href="/spotpay"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 px-3 rounded-xl text-xs text-center border border-slate-700 transition-colors"
          >
            Add Funds
          </Link>
        </div>
      </div>

      {/* Upcoming Cultural Fetes & Events */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" /> Featured Cultural Fetes
          </h3>
          <Link href="/events" className="text-[11px] font-bold text-sky-400 hover:underline">
            View all
          </Link>
        </div>

        <div className="space-y-2.5">
          {[
            { title: 'Trinidad Carnival 2026: Soca Monarch', date: 'This Friday • Port of Spain', tickets: 'SpotPay $45' },
            { title: 'Caribana Toronto Grand Parade', date: 'Aug 1 • Lakeshore Toronto', tickets: 'Free RSVP' },
            { title: 'Dominican Food & Merengue Festival', date: 'Sunday • Washington Heights, NY', tickets: 'SpotPay $15' },
          ].map((event, idx) => (
            <div key={idx} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60 space-y-1">
              <h4 className="font-bold text-xs text-slate-200 leading-snug">{event.title}</h4>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">{event.date}</span>
                <span className="font-extrabold text-amber-400">{event.tickets}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
