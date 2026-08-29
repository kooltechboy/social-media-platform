import React from 'react';
import Link from 'next/link';
import { Calendar, ArrowUpRight, Wallet } from 'lucide-react';
import OnlineFriendsWidget from './online-friends-widget';
import { createSupabaseServerClient, getCurrentUser } from '../lib/supabase/server';
import { Money } from '@caribbean/spotpay';

interface IslandPulse {
  city: string;
  country: string;
  flag: string;
  status: string;
  tag: string;
}

const ISLAND_PULSES: IslandPulse[] = [
  { city: 'Kingston', country: 'Jamaica', flag: '🇯🇲', status: 'Sound System Culture', tag: '#KingstonNights' },
  { city: 'Port of Spain', country: 'Trinidad', flag: '🇹🇹', status: 'Carnival & Soca Pulse', tag: '#CarnivalTT' },
  { city: 'Santo Domingo', country: 'Dominican Rep.', flag: '🇩🇴', status: 'Bachata & Tech Meetup', tag: '#RDTech' },
  { city: 'Bridgetown', country: 'Barbados', flag: '🇧🇧', status: 'Crop Over Season Vibes', tag: '#CropOver2026' },
  { city: 'Miami', country: 'USA Diaspora', flag: '🗽', status: 'Wynwood Diaspora Fest', tag: '#MiamiCarnival' },
  { city: 'Toronto', country: 'Canada Diaspora', flag: '🇨🇦', status: 'Caribana Hub', tag: '#Caribana2026' },
  { city: 'London', country: 'UK Diaspora', flag: '🇬🇧', status: 'Notting Hill Connection', tag: '#LondonSoca' },
];

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default async function CaribbeanNowSidebar() {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  let walletBalanceFormatted = '$0.00 USD';
  let upcomingEvents: Array<{
    id: string;
    title: string;
    starts_at: string;
    venue: string | null;
    cities: { name: string; country_iso: string } | null;
  }> = [];

  if (supabase) {
    const [eventsRes, walletAccountRes] = await Promise.all([
      supabase
        .from('events')
        .select('id, title, starts_at, venue, cities(name, country_iso)')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(3),
      user
        ? supabase
            .from('ledger_accounts')
            .select('id, account_type, currency')
            .eq('owner_id', user.id)
            .eq('account_type', 'spotpay_wallet')
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (eventsRes?.data) {
      upcomingEvents = eventsRes.data as unknown as typeof upcomingEvents;
    }

    if (walletAccountRes?.data) {
      const walletAccount = walletAccountRes.data;
      const { data: entries } = await supabase
        .from('ledger_entries')
        .select('amount, entry_type')
        .eq('account_id', walletAccount.id);

      if (entries && entries.length > 0) {
        const netMajor = entries.reduce((sum, e) => {
          const amt = Number(e.amount);
          return e.entry_type === 'CREDIT' ? sum + amt : sum - amt;
        }, 0);
        const minor = Math.round(Math.abs(netMajor) * 100);
        walletBalanceFormatted = `${new Money(minor, walletAccount.currency || 'USD').format()} ${walletAccount.currency || 'USD'}`;
      } else {
        walletBalanceFormatted = `$0.00 ${walletAccount.currency || 'USD'}`;
      }
    }
  }

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
          <span className="text-[10px] font-bold text-brand-sandstone/60">Double-Entry</span>
        </div>
        <div>
          <p className="text-xs text-brand-sandstone/60">Personal Balance</p>
          <p className="text-2xl font-black text-brand-sandstone">
            {user ? walletBalanceFormatted : '$0.00 USD'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link
            href="/spotpay"
            className="bg-brand-sunriseCoral hover:bg-brand-sunriseCoral text-slate-950 font-extrabold py-2 px-3 rounded-xl text-xs text-center transition-colors shadow-sm shadow-brand-sunriseCoral/20"
          >
            {user ? 'Send Money' : 'Open Wallet'}
          </Link>
          <Link
            href="/spotpay"
            className="bg-transparent hover:bg-brand-dusk text-slate-300 font-bold py-2 px-3 rounded-xl text-xs text-center border border-slate-600 transition-colors"
          >
            {user ? 'Add Funds' : 'Learn More'}
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
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <Link
                key={event.id}
                href="/events"
                className="p-3 rounded-2xl bg-white/5 border border-white/8 space-y-1 block hover:border-white/20 transition-colors"
              >
                <h4 className="font-bold text-xs text-slate-200 leading-snug">{event.title}</h4>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-brand-sandstone/60">
                    {formatEventDate(event.starts_at)} {event.cities ? `• ${event.cities.name}` : ''}
                  </span>
                  <span className="font-extrabold text-brand-goldenHour">RSVP</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-3 rounded-2xl bg-white/5 border border-dashed border-slate-800 text-center">
              <p className="text-xs text-brand-sandstone/60">No upcoming events right now.</p>
              <Link href="/events" className="text-[11px] text-brand-caribbeanSea hover:underline font-bold mt-1 inline-block">
                Host an Event →
              </Link>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

