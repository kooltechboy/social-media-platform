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

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<{ kind?: string; city?: string; q?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const { kind, city, q } = resolvedParams;

  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  let events: LiveEvent[] = [];
  let cities: CityOption[] = [];

  if (supabase) {
    let query = supabase
      .from('events')
      .select('id, title, description, event_kind, venue, starts_at, capacity, cities(name, country_iso), event_attendees(profile_id, rsvp_status)')
      .gte('starts_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('starts_at', { ascending: true })
      .limit(30);

    if (kind) {
      query = query.eq('event_kind', kind);
    }
    if (q) {
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const [eventsResult, citiesResult] = await Promise.all([
      query,
      supabase.from('cities').select('id, name, country_iso').order('name'),
    ]);
    if (eventsResult.data && eventsResult.data.length > 0) {
      events = eventsResult.data as unknown as LiveEvent[];
    }
    cities = (citiesResult.data ?? []) as CityOption[];
  }

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="surface-header rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-yellow-500/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-yellow-500 animate-ping" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white flex items-center gap-3">
              <Calendar className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-400" /> Caribbean Events &amp; Fetes
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-brand-sandstone/80 mt-1 leading-relaxed">
            Carnivals, festivals, concerts, culinary gatherings, and diaspora meetups with digital ticketing.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {user ? (
            <EventCreateForm cities={cities} />
          ) : (
            <Link
              href="/login"
              className="bg-yellow-400 hover:brightness-110 text-slate-950 font-black px-6 py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-yellow-500/20 min-h-[44px]"
            >
              <Ticket className="w-4 h-4" /> Host an Event
            </Link>
          )}
        </div>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="surface-card rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto border border-white/10">
          <Calendar className="w-12 h-12 text-yellow-400/70 mx-auto" />
          <h3 className="text-lg font-black text-white">No upcoming events found</h3>
          <p className="text-xs sm:text-sm text-brand-sandstone/80 leading-relaxed">
            There are currently no events matching your query or scheduled in this category. Be the first to host an island gathering or diaspora fete!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
          const going = event.event_attendees?.filter((attendee) => attendee.rsvp_status === 'going') ?? [];
          const userGoing = user ? going.some((attendee) => attendee.profile_id === user.id) : false;
          return (
            <div
              key={event.id}
              className="surface-card surface-card-interactive rounded-3xl p-6 space-y-4 flex flex-col justify-between transition-all shadow-xl group border border-white/10"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-brand-caribbeanSea/15 text-brand-caribbeanSea border border-brand-caribbeanSea/30 uppercase tracking-wider">
                    {event.event_kind.replace('_', ' ')}
                  </span>
                  {event.event_kind !== 'in_person' && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-rose-300 bg-rose-500/15 px-2.5 py-1 rounded-full border border-rose-500/30 animate-pulse">
                      <Radio className="w-3 h-3" /> Live Stream
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-amber-300">
                  <Clock className="w-4 h-4" />
                  <span>{formatEventDate(event.starts_at)}</span>
                </div>

                <h3 className="font-black text-base sm:text-lg text-white group-hover:text-amber-300 transition-colors leading-snug">
                  {event.title}
                </h3>

                {event.description && (
                  <p className="text-xs sm:text-sm text-brand-sandstone/85 leading-relaxed line-clamp-2 font-medium">
                    {event.description}
                  </p>
                )}

                <div className="space-y-1.5 pt-1 text-xs text-brand-sandstone/70">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-caribbeanSea flex-shrink-0" />
                    <span>{event.venue ? `${event.venue} — ` : ''}{event.cities ? `${event.cities.name}, ${event.cities.country_iso}` : 'Caribbean'}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Users className="w-3.5 h-3.5 text-brand-sunriseCoral flex-shrink-0" />
                      <span>{going.length > 0 ? `${going.length} attending` : 'Open RSVP'}</span>
                    </span>
                    {event.price && (
                      <span className="font-black text-white text-xs">{event.price}</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                {user ? (
                  <form action={rsvpAction.bind(null, event.id)}>
                    <button
                      type="submit"
                      className={`w-full font-black py-3 rounded-xl text-xs sm:text-sm transition-all shadow-md min-h-[44px] flex items-center justify-center ${
                        userGoing
                          ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-yellow-400 hover:brightness-110 text-slate-950 shadow-yellow-500/20'
                      }`}
                    >
                      {userGoing ? '✓ You Are Going (Booking Confirmed)' : 'RSVP / Get Ticket'}
                    </button>
                  </form>
                ) : (
                  <Link
                    href="/login"
                    className="w-full block text-center bg-white/10 hover:bg-white/15 text-white font-black py-3 rounded-xl text-xs border border-white/15 transition-colors min-h-[44px] flex items-center justify-center"
                  >
                    Sign in to RSVP
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
