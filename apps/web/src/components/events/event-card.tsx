'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  Radio,
  MapPin,
  Users,
  Settings,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import EventManageModal from './event-manage-modal';
import { rsvpEventFormAction } from '../../lib/events/actions';

export interface LiveEventItem {
  id: string;
  title: string;
  description: string | null;
  event_kind: 'in_person' | 'livestream' | 'hybrid';
  venue: string | null;
  starts_at: string;
  capacity: number | null;
  price?: string;
  host_id?: string | null;
  is_cancelled?: boolean;
  cancellation_reason?: string | null;
  cities: { name: string; country_iso: string } | null;
  event_attendees: Array<{ profile_id: string; rsvp_status: string }>;
}

interface EventCardProps {
  event: LiveEventItem;
  currentUserId?: string;
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

export default function EventCard({ event, currentUserId }: EventCardProps) {
  const [isManageOpen, setIsManageOpen] = useState(false);

  const going = event.event_attendees?.filter((attendee) => attendee.rsvp_status === 'going') ?? [];
  const userGoing = currentUserId
    ? going.some((attendee) => attendee.profile_id === currentUserId)
    : false;
  const isHost = Boolean(currentUserId && event.host_id === currentUserId);

  return (
    <>
      <div
        className={`surface-card surface-card-interactive rounded-3xl p-6 space-y-4 flex flex-col justify-between transition-all shadow-xl group border ${
          event.is_cancelled
            ? 'border-rose-500/30 opacity-80'
            : 'border-white/10 hover:border-amber-400/40'
        }`}
      >
        <div className="space-y-3.5">
          {/* Top badges */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] md:text-xs font-black px-2.5 md:px-3 py-1 md:py-1.5 rounded-full bg-brand-caribbeanSea/15 text-brand-caribbeanSea border border-brand-caribbeanSea/30 uppercase tracking-wider">
                {event.event_kind.replace('_', ' ')}
              </span>
              {event.event_kind !== 'in_person' && (
                <span className="flex items-center gap-1.5 text-[10px] md:text-xs font-black text-rose-300 bg-rose-500/15 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full border border-rose-500/30 animate-pulse">
                  <Radio className="w-3 h-3 md:w-3.5 md:h-3.5" /> Live Stream
                </span>
              )}
            </div>

            {isHost && (
              <button
                type="button"
                onClick={() => setIsManageOpen(true)}
                className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 transition-all cursor-pointer"
              >
                <Settings className="w-3 h-3" /> Host Controls
              </button>
            )}
          </div>

          {/* Cancellation Notice */}
          {event.is_cancelled && (
            <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="truncate">
                Cancelled: {event.cancellation_reason || 'By host'}
              </span>
            </div>
          )}

          {/* Date & Time */}
          <div className="flex items-center gap-2 text-xs sm:text-sm md:text-[15px] font-black text-amber-300">
            <Clock className="w-4 h-4 md:w-4.5 md:h-4.5" />
            <span>{formatEventDate(event.starts_at)}</span>
          </div>

          {/* Title */}
          <h3 className="font-black text-base sm:text-lg md:text-xl text-white group-hover:text-amber-300 transition-colors leading-snug">
            {event.title}
          </h3>

          {/* Description */}
          {event.description && (
            <p className="text-xs sm:text-sm md:text-[15px] text-brand-sandstone/85 leading-relaxed md:leading-[1.6] line-clamp-2 font-medium">
              {event.description}
            </p>
          )}

          {/* Venue & Attendees */}
          <div className="space-y-2 pt-1 text-xs md:text-sm text-brand-sandstone/70">
            <p className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-caribbeanSea flex-shrink-0" />
              <span className="truncate">
                {event.venue ? `${event.venue} — ` : ''}
                {event.cities ? `${event.cities.name}, ${event.cities.country_iso}` : 'Caribbean'}
              </span>
            </p>
            <p className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold">
                <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-sunriseCoral flex-shrink-0" />
                <span>{going.length > 0 ? `${going.length} attending` : 'Open RSVP'}</span>
              </span>
              {event.price && (
                <span className="font-black text-white text-xs md:text-sm">{event.price}</span>
              )}
            </p>
          </div>
        </div>

        {/* RSVP Action */}
        <div className="pt-4 border-t border-white/10">
          {event.is_cancelled ? (
            <div className="w-full text-center py-2.5 rounded-xl bg-slate-800/60 text-slate-400 font-bold text-xs border border-slate-700/60">
              Event Cancelled
            </div>
          ) : currentUserId ? (
            <form action={rsvpEventFormAction.bind(null, event.id)}>
              <button
                type="submit"
                className={`w-full font-black py-3 rounded-xl text-xs sm:text-sm md:text-base transition-all shadow-md min-h-[44px] md:min-h-[46px] flex items-center justify-center cursor-pointer ${
                  userGoing
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-yellow-400 hover:brightness-110 text-slate-950 shadow-yellow-500/20'
                }`}
              >
                {userGoing ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Booking Confirmed
                  </span>
                ) : (
                  'RSVP / Get Ticket'
                )}
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="w-full block text-center bg-white/10 hover:bg-white/15 text-white font-black py-3 rounded-xl text-xs sm:text-sm md:text-base border border-white/15 transition-colors min-h-[44px] md:min-h-[46px] flex items-center justify-center"
            >
              Sign in to RSVP
            </Link>
          )}
        </div>
      </div>

      {/* Host Controls Modal */}
      {isHost && (
        <EventManageModal
          event={event}
          isOpen={isManageOpen}
          onClose={() => setIsManageOpen(false)}
        />
      )}
    </>
  );
}
