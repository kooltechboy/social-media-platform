import React from 'react';
import { Calendar, MapPin, Users, Radio, Sparkles, Ticket, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import { rsvpAction } from '../../lib/events/actions';
import EventCreateForm, { type CityOption } from '../../components/event-create-form';

export const dynamic = 'force-dynamic';

interface LiveEvent {
  id: string;
  title: string;
  description: string | null;
  event_kind: 'in_person' | 'livestream' | 'hybrid';
  venue: string | null;
  starts_at: string;
  capacity: number | null;
  price?: string;
  cities: { name: string; country_iso: string } | null;
  event_attendees: Array<{ profile_id: string; rsvp_status: string }>;
}

const SHOWCASE_EVENTS: LiveEvent[] = [
  {
    id: 'event-1',
    title: 'Trinidad Carnival 2026: International Soca Monarch & Fete',
    description: 'The pinnacle of Trinidad Carnival. Live performances, steel orchestra showcases, and morning breakfast party.',
    event_kind: 'hybrid',
    venue: 'Queen’s Park Savannah',
    starts_at: new Date(Date.now() + 5 * 86400000).toISOString(),
    capacity: 25000,
    price: 'SpotPay $45 USD',
    cities: { name: 'Port of Spain', country_iso: 'TTO 🇹🇹' },
    event_attendees: [{ profile_id: '1', rsvp_status: 'going' }, { profile_id: '2', rsvp_status: 'going' }],
  },
  {
    id: 'event-2',
    title: 'Reggae Sumfest 2026: Sound System Explosion',
    description: 'World-renowned reggae & dancehall festival featuring the greatest sound systems and live artist sets.',
    event_kind: 'hybrid',
    venue: 'Catherine Hall Entertainment Complex',
    starts_at: new Date(Date.now() + 14 * 86400000).toISOString(),
    capacity: 18000,
    price: 'SpotPay $60 USD',
    cities: { name: 'Montego Bay', country_iso: 'JAM 🇯🇲' },
    event_attendees: [{ profile_id: '3', rsvp_status: 'going' }],
  },
  {
    id: 'event-3',
    title: 'Caribana Toronto Grand Parade & Lakeshore Celebration',
    description: 'North America’s largest cultural festival. Masqueraders, steel bands, sound trucks, and diaspora food market.',
    event_kind: 'in_person',
    venue: 'Exhibition Place & Lakeshore Blvd',
    starts_at: new Date(Date.now() + 25 * 86400000).toISOString(),
    capacity: 50000,
    price: 'Free Public RSVP',
    cities: { name: 'Toronto', country_iso: 'CAN 🇨🇦' },
    event_attendees: [{ profile_id: '4', rsvp_status: 'going' }],
  },
  {
    id: 'event-4',
    title: 'Dominican Food & Merengue Summit in the Heights',
    description: 'Traditional Quisqueyan cuisine, chef demonstrations, live accordion merengue, and business expo.',
    event_kind: 'in_person',
    venue: 'Highbridge Park Plaza',
    starts_at: new Date(Date.now() + 8 * 86400000).toISOString(),
    capacity: 3500,
    price: 'SpotPay $15 USD',
    cities: { name: 'New York', country_iso: 'USA 🗽' },
    event_attendees: [{ profile_id: '5', rsvp_status: 'going' }],
  },
  {
    id: 'event-5',
    title: 'Barbados Crop Over Foreday Morning Jump',
    description: 'Mud, paint, powder, and non-stop soca through the streets of St. Michael until sunrise.',
    event_kind: 'in_person',
    venue: 'Bridgetown Harbour Route',
    starts_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    capacity: 12000,
    price: 'SpotPay $50 USD',
    cities: { name: 'Bridgetown', country_iso: 'BRB 🇧🇧' },
    event_attendees: [{ profile_id: '6', rsvp_status: 'going' }],
  },
  {
    id: 'event-6',
    title: 'London Notting Hill Warm-Up: Caribbean Creators Summit',
    description: 'Panel sessions on Caribbean creative monetization, music publishing, and SpotPay European integration.',
    event_kind: 'hybrid',
    venue: 'The Tabernacle, Notting Hill',
    starts_at: new Date(Date.now() + 18 * 86400000).toISOString(),
    capacity: 800,
    price: 'Free RSVP',
    cities: { name: 'London', country_iso: 'GBR 🇬🇧' },
    event_attendees: [{ profile_id: '7', rsvp_status: 'going' }],
  },
];

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default async function EventsPage() {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  let events: LiveEvent[] = [];
  let cities: CityOption[] = [];

  if (supabase) {
    const [eventsResult, citiesResult] = await Promise.all([
      supabase
        .from('events')
        .select('id, title, description, event_kind, venue, starts_at, capacity, cities(name, country_iso), event_attendees(profile_id, rsvp_status)')
        .gte('starts_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('starts_at', { ascending: true })
        .limit(30),
      supabase.from('cities').select('id, name, country_iso').order('name'),
    ]);
    if (eventsResult.data && eventsResult.data.length > 0) {
      events = eventsResult.data as unknown as LiveEvent[];
    }
    cities = (citiesResult.data ?? []) as CityOption[];
  }

  if (events.length === 0) {
    events = SHOWCASE_EVENTS;
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-4 md:p-6 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-yellow-500 animate-ping" />
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              <Calendar className="w-8 h-8 text-yellow-400" /> Caribbean Events &amp; Fetes
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Carnivals, festivals, concerts, culinary gatherings, and diaspora meetups with SpotPay ticketing.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {user ? (
            <EventCreateForm cities={cities} />
          ) : (
            <Link
              href="/login"
              className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 transition-all shadow-md shadow-yellow-500/20"
            >
              <Ticket className="w-4 h-4" /> Host an Event
            </Link>
          )}
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => {
          const going = event.event_attendees?.filter((attendee) => attendee.rsvp_status === 'going') ?? [];
          const userGoing = user ? going.some((attendee) => attendee.profile_id === user.id) : false;
          return (
            <div
              key={event.id}
              className="bg-slate-900/80 border border-slate-800/90 hover:border-yellow-500/50 rounded-3xl p-6 space-y-4 flex flex-col justify-between transition-all shadow-xl group"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase tracking-wider">
                    {event.event_kind.replace('_', ' ')}
                  </span>
                  {event.event_kind !== 'in_person' && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 animate-pulse">
                      <Radio className="w-3 h-3" /> Live Stream
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatEventDate(event.starts_at)}</span>
                </div>

                <h3 className="font-extrabold text-base text-white group-hover:text-yellow-300 transition-colors leading-snug">
                  {event.title}
                </h3>

                {event.description && (
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 font-medium">
                    {event.description}
                  </p>
                )}

                <div className="space-y-1.5 pt-1 text-xs text-slate-400">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                    <span>{event.venue ? `${event.venue} — ` : ''}{event.cities ? `${event.cities.name}, ${event.cities.country_iso}` : 'Caribbean'}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>{going.length > 0 ? `${going.length} attending` : 'Open RSVP'}</span>
                    </span>
                    {event.price && (
                      <span className="font-extrabold text-white text-xs">{event.price}</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80">
                {user ? (
                  <form action={rsvpAction.bind(null, event.id)}>
                    <button
                      type="submit"
                      className={`w-full font-black py-2.5 rounded-2xl text-xs transition-all shadow-md ${
                        userGoing
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 shadow-yellow-500/20'
                      }`}
                    >
                      {userGoing ? '✓ You Are Going (SpotPay Confirmed)' : 'RSVP / Get SpotPay Ticket'}
                    </button>
                  </form>
                ) : (
                  <Link
                    href="/login"
                    className="w-full block text-center bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-2xl text-xs border border-slate-700 transition-colors"
                  >
                    Sign in to RSVP
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
