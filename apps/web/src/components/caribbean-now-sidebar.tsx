import React from 'react';
import Link from 'next/link';
import { Flame, Radio, Calendar, Sparkles, TrendingUp, ArrowUpRight, Wallet, MapPin } from 'lucide-react';
import OnlineFriendsWidget from './online-friends-widget';

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
      {/* Online Friends Widget */}
      <OnlineFriendsWidget />

      {/* Caribbean Now Live Ticker */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-brand-sandstone flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="bg-gradient-to-r from-red-400 via-amber-300 to-brand-caribbeanSea bg-clip-text text-transparent">
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
              className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/20 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{pulse.flag}</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-extrabold text-xs text-slate-200 group-hover:text-brand-caribbeanSea transition-colors">
                      {pulse.city}
                    </h4>
                    <span className="text-[10px] text-brand-sandstone/40">• {pulse.country}</span>
                  </div>
                  <p className="text-[11px] text-brand-sandstone/60 font-medium">{pulse.status}</p>
                </div>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-brand-sandstone/40 group-hover:text-brand-caribbeanSea transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* SpotPay Instant Wallet Quick Card */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-brand-sunriseCoral uppercase tracking-wider flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" /> SpotPay Ledger
          </span>
          <span className="text-[10px] font-bold text-brand-sandstone/60">FDIC Partnered</span>
        </div>
        <div>
          <p className="text-xs text-brand-sandstone/60">Personal Balance</p>
          <p className="text-2xl font-black text-brand-sandstone">$240.50 <span className="text-xs font-normal text-brand-sandstone/60">USD</span></p>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link
            href="/spotpay"
            className="bg-brand-sunriseCoral hover:bg-brand-sunriseCoral text-slate-950 font-extrabold py-2 px-3 rounded-xl text-xs text-center transition-colors shadow-sm shadow-brand-sunriseCoral/20"
          >
            Send Money
          </Link>
          <Link
            href="/spotpay"
            className="bg-transparent hover:bg-brand-dusk text-slate-300 font-bold py-2 px-3 rounded-xl text-xs text-center border border-slate-600 transition-colors"
          >
            Add Funds
          </Link>
        </div>
      </div>

      {/* Upcoming Cultural Fetes & Events */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-brand-sandstone flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-goldenHour" /> Featured Cultural Fetes
          </h3>
          <Link href="/events" className="text-[11px] font-bold text-brand-caribbeanSea hover:underline">
            View all
          </Link>
        </div>

        <div className="space-y-2.5">
          {[
            { title: 'Trinidad Carnival 2026: Soca Monarch', date: 'This Friday • Port of Spain', tickets: 'SpotPay $45' },
            { title: 'Caribana Toronto Grand Parade', date: 'Aug 1 • Lakeshore Toronto', tickets: 'Free RSVP' },
            { title: 'Dominican Food & Merengue Festival', date: 'Sunday • Washington Heights, NY', tickets: 'SpotPay $15' },
          ].map((event, idx) => (
            <div key={idx} className="p-3 rounded-2xl bg-white/5 border border-white/8 space-y-1">
              <h4 className="font-bold text-xs text-slate-200 leading-snug">{event.title}</h4>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-brand-sandstone/60">{event.date}</span>
                <span className="font-extrabold text-brand-goldenHour">{event.tickets}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

