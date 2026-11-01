import React from 'react';
import { Calendar, MapPin, Users, Radio, Sparkles, Ticket, CheckCircle, Clock, ArrowRight, Landmark, ExternalLink, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import { rsvpEventFormAction, fetchCulturalObservancesAction } from '../../lib/events/actions';
import type { CulturalObservance } from '../../lib/events/types';
import EventCreateForm, { type CityOption } from '../../components/event-create-form';
import EventCard, { type LiveEventItem } from '../../components/events/event-card';
import RightRail from '../../components/right-rail';
import EventsRail from '../../components/rails/events-rail';

export const dynamic = 'force-dynamic';

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<{ kind?: string; city?: string; q?: string; create?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const { kind, city, q, create } = resolvedParams;

  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  let events: LiveEventItem[] = [];
  let cities: CityOption[] = [];
  let observances: CulturalObservance[] = [];

  if (supabase) {
    let query = supabase
      .from('events')
      .select('id, title, description, event_kind, venue, starts_at, capacity, host_id, is_cancelled, cancellation_reason, source_type, verification_status, official_source_url, cities(name, country_iso), event_attendees(profile_id, rsvp_status)')
      .gte('starts_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('starts_at', { ascending: true })
      .limit(30);

    if (kind) {
      query = query.eq('event_kind', kind);
    }
    if (q) {
      const safeQ = q.replace(/[,().%]/g, '').trim();
      if (safeQ) {
        query = query.or(`title.ilike.%${safeQ}%,description.ilike.%${safeQ}%`);
      }
    }

    const [eventsResult, citiesResult, observancesResult] = await Promise.all([
      query,
      supabase.from('cities').select('id, name, country_iso').order('name'),
      fetchCulturalObservancesAction(),
    ]);
    if (eventsResult.data && eventsResult.data.length > 0) {
      events = eventsResult.data as unknown as LiveEventItem[];
    }
    cities = (citiesResult.data ?? []) as CityOption[];
    observances = observancesResult ?? [];
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
              <EventCreateForm cities={cities} initialOpen={create === 'true'} />
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

        {/* Authoritative Annual Cultural Observances & Traditions */}
        {observances.length > 0 && (
          <section className="space-y-3" aria-labelledby="cultural-observances-heading">
            <div className="flex items-center justify-between">
              <h2 id="cultural-observances-heading" className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                <Landmark className="w-4 h-4 text-amber-400" /> Annual Caribbean Cultural Traditions
              </h2>
              <span className="text-[11px] text-brand-sandstone/70 font-semibold">
                Verified Cultural Authorities
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {observances.slice(0, 4).map((obs) => (
                <div
                  key={obs.id}
                  className="surface-card rounded-2xl p-4 border border-amber-500/20 space-y-2.5 bg-gradient-to-br from-amber-500/5 to-transparent"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      {obs.territory_name}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-brand-sandstone">
                      {obs.typical_season}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white">{obs.name}</h3>
                  <p className="text-xs text-brand-sandstone/80 line-clamp-2 leading-relaxed">
                    {obs.historical_significance}
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[11px] text-brand-sandstone/70 border-t border-white/5">
                    <span className="truncate max-w-[200px]">{obs.official_authority_name}</span>
                    {obs.official_source_url && (
                      <a
                        href={obs.official_source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-300 hover:text-amber-200 inline-flex items-center gap-1 font-semibold"
                      >
                        Official Authority
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section Heading for Scheduled Events */}
        <div className="pt-2 flex items-center justify-between">
          <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-yellow-400" /> Confirmed &amp; Scheduled Events
          </h2>
          <span className="text-xs text-brand-sandstone/70">
            {events.length} {events.length === 1 ? 'event' : 'events'} scheduled
          </span>
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
