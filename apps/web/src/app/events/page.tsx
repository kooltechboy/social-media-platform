import React from 'react';
import { Calendar, MapPin, Users, Radio, Sparkles, Ticket, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import { rsvpEventFormAction } from '../../lib/events/actions';
import EventCreateForm, { type CityOption } from '../../components/event-create-form';
import EventCard, { type LiveEventItem } from '../../components/events/event-card';
import RightRail from '../../components/right-rail';
import EventsRail from '../../components/rails/events-rail';

export const dynamic = 'force-dynamic';

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<{ kind?: string; city?: string; q?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const { kind, city, q } = resolvedParams;

  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  let events: LiveEventItem[] = [];
  let cities: CityOption[] = [];

  if (supabase) {
    let query = supabase
      .from('events')
      .select('id, title, description, event_kind, venue, starts_at, capacity, host_id, is_cancelled, cancellation_reason, cities(name, country_iso), event_attendees(profile_id, rsvp_status)')
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
      events = eventsResult.data as unknown as LiveEventItem[];
    }
    cities = (citiesResult.data ?? []) as CityOption[];
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start w-full">
      <div className="flex-1 min-w-0 space-y-8 w-full max-w-[820px] xl:max-w-[860px] mx-auto lg:mx-0 animate-fadeIn">
        {/* Top Header */}
        <div className="surface-header rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-yellow-500/30 shadow-xl">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-yellow-500 animate-ping" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white flex items-center gap-3">
                <Calendar className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-400" /> Caribbean Events &amp; Fetes
              </h1>
            </div>
            <p className="text-xs sm:text-sm md:text-base text-brand-sandstone/80 mt-1 leading-relaxed">
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
            <h3 className="text-lg md:text-xl font-black text-white">No upcoming events found</h3>
            <p className="text-xs sm:text-sm md:text-base text-brand-sandstone/80 leading-relaxed">
              There are currently no events matching your query or scheduled in this category. Be the first to host an island gathering or diaspora fete!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {events.map((event) => (
              <EventCard key={event.id} event={event} currentUserId={user?.id} />
            ))}
          </div>
        )}
      </div>

      <RightRail ariaLabel="Events Contextual Actions">
        <EventsRail activeFilter={kind || 'all'} />
      </RightRail>
    </div>
  );
}
