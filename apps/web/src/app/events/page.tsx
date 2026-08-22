import React from 'react';
import { Calendar, MapPin, Users, Radio } from 'lucide-react';
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
    events = (eventsResult.data ?? []) as unknown as LiveEvent[];
    cities = (citiesResult.data ?? []) as CityOption[];
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-sky-400" /> Caribbean Events & Ticketing
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Discover festivals, concerts, food summits, and diaspora events across the Caribbean and its hubs.
          </p>
        </div>
        {user ? (
          <EventCreateForm cities={cities} />
        ) : (
          <a href="/login" className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors">
            Sign in to host events
          </a>
        )}
      </div>

      {events.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center">
          <p className="text-sm font-semibold text-slate-200">No upcoming events yet.</p>
          <p className="text-xs text-slate-400 mt-1">Be the first to host one for your community.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((event) => {
            const going = event.event_attendees.filter((attendee) => attendee.rsvp_status === 'going');
            const userGoing = user ? going.some((attendee) => attendee.profile_id === user.id) : false;
            return (
              <div key={event.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-sky-500/50 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/40 capitalize">
                      {event.event_kind.replace('_', ' ')}
                    </span>
                    {event.event_kind !== 'in_person' && <Radio className="w-4 h-4 text-rose-400" aria-label="Live" />}
                  </div>
                  <span className="text-xs font-bold text-amber-400 block">{formatEventDate(event.starts_at)}</span>
                  <h3 className="font-bold text-base text-white">{event.title}</h3>
                  {event.description && <p className="text-xs text-slate-400 leading-relaxed">{event.description}</p>}
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    {event.venue ? `${event.venue} — ` : ''}
                    {event.cities ? `${event.cities.name}, ${event.cities.country_iso}` : 'Caribbean'}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    {going.length} going{event.capacity ? ` • capacity ${event.capacity}` : ''}
                  </p>
                </div>

                {user ? (
                  <form action={rsvpAction.bind(null, event.id)}>
                    <button
                      type="submit"
                      className={`w-full font-bold py-2 rounded-xl text-xs transition-colors ${
                        userGoing
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                      }`}
                    >
                      {userGoing ? '✓ Going — tap to cancel' : 'RSVP — I am going'}
                    </button>
                  </form>
                ) : (
                  <a href="/login" className="w-full block text-center bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 rounded-xl text-xs transition-colors">
                    Sign in to RSVP
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
