'use client';

import React from 'react';
import Link from 'next/link';
import {
  Clock,
  MapPin,
  Users,
  Radio,
  CheckCircle2,
  Sparkles,
  XCircle,
  Plus,
  Minus,
  Ticket,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { rsvpAction } from '../../lib/events/actions';
import type { LiveEventItem, RSVPStatus } from '../../lib/events/types';

export interface InteractiveEventCardProps {
  event: LiveEventItem;
  currentUserId?: string;
  onRSVPChange?: (eventId: string, status: RSVPStatus, guestCount: number) => void;
  className?: string;
}

const TERRITORY_FLAGS: Record<string, string> = {
  JAM: '🇯🇲', JM: '🇯🇲',
  TTO: '🇹🇹', TT: '🇹🇹',
  BRB: '🇧🇧', BB: '🇧🇧',
  HTI: '🇭🇹', HT: '🇭🇹',
  DMA: '🇩🇲', DM: '🇩🇲',
  LCA: '🇱🇨', LC: '🇱🇨',
  GRD: '🇬🇩', GD: '🇬🇩',
  VCT: '🇻🇨', VC: '🇻🇨',
  ATG: '🇦🇬', AG: '🇦🇬',
  KNA: '🇰🇳', KN: '🇰🇳',
  BHS: '🇧🇸', BS: '🇧🇸',
  GUY: '🇬🇾', GY: '🇬🇾',
  SUR: '🇸🇷', SR: '🇸🇷',
  BLZ: '🇧🇿', BZ: '🇧🇿',
  DOM: '🇩🇴', DO: '🇩🇴',
  PRI: '🇵🇷', PR: '🇵🇷',
  CUB: '🇨🇺', CU: '🇨🇺',
  CUW: '🇨🇼', CW: '🇨🇼',
  ABW: '🇦🇼', AW: '🇦🇼',
  SXM: '🇸🇽', SX: '🇸🇽',
};

function getTerritoryFlag(iso?: string | null): string {
  if (!iso) return '🌴';
  return TERRITORY_FLAGS[iso.toUpperCase()] || '🌴';
}

function parseEventDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { month: 'TBD', day: '--', time: '' };
  }
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const month = months[d.getUTCMonth()] || 'TBD';
  const day = String(d.getUTCDate());
  const hours = d.getUTCHours();
  const minutes = d.getUTCMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const time = `${formattedHours}:${minutes} ${ampm} UTC`;
  return { month, day, time };
}

function useSafeState<T>(initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  const internals =
    (React as any)?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
    (React as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const dispatcher = internals?.H || internals?.ReactCurrentDispatcher?.current;

  if (dispatcher) {
    return React.useState<T>(initialValue);
  }
  const val = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
  return [val, () => {}];
}

function useSafeTransition(): [boolean, (callback: () => void) => void] {
  const internals =
    (React as any)?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
    (React as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const dispatcher = internals?.H || internals?.ReactCurrentDispatcher?.current;

  if (dispatcher && typeof React.useTransition === 'function') {
    return React.useTransition();
  }
  return [false, (cb: () => void) => cb()];
}

export default function InteractiveEventCard({
  event,
  currentUserId,
  onRSVPChange,
  className = '',
}: InteractiveEventCardProps) {
  const existingAttendee = currentUserId
    ? event.event_attendees?.find((a) => a.profile_id === currentUserId)
    : undefined;

  const initialStatus: RSVPStatus | null =
    (existingAttendee?.rsvp_status as RSVPStatus) || null;
  const initialGuestCount =
    existingAttendee?.guest_count && existingAttendee.guest_count >= 1
      ? existingAttendee.guest_count
      : 1;
  const initialCheckInCode =
    (existingAttendee as any)?.check_in_code || null;

  const [userStatus, setUserStatus] = useSafeState<RSVPStatus | null>(initialStatus);
  const [guestCount, setGuestCount] = useSafeState<number>(initialGuestCount);
  const [checkInCode, setCheckInCode] = useSafeState<string | null>(initialCheckInCode);
  const [announcement, setAnnouncement] = useSafeState<string>('');
  const [isPending, startTransition] = useSafeTransition();

  const otherAttendeesGoing = (event.event_attendees || []).filter(
    (a) => a.rsvp_status === 'going' && a.profile_id !== currentUserId
  );
  const otherAttendeesCount = otherAttendeesGoing.reduce(
    (sum, a) => sum + (a.guest_count && a.guest_count > 0 ? a.guest_count : 1),
    0
  );

  const attendeeCount =
    otherAttendeesCount + (userStatus === 'going' ? guestCount : 0);

  const hasCapacity = typeof event.capacity === 'number' && event.capacity > 0;
  const isAtCapacity = Boolean(hasCapacity && event.capacity && attendeeCount >= event.capacity);
  const isGoingDisabled = Boolean(isAtCapacity && userStatus !== 'going');

  const progressPercentage = hasCapacity && event.capacity
    ? Math.min(100, Math.round((attendeeCount / event.capacity) * 100))
    : 0;

  const dateParts = parseEventDate(event.starts_at);
  const territoryFlag = getTerritoryFlag(event.country_iso || event.cities?.country_iso);

  const handleStatusChange = (targetStatus: RSVPStatus) => {
    if (isPending) return;
    if (targetStatus === 'going' && isGoingDisabled) return;

    const prevStatus = userStatus;
    const prevCode = checkInCode;
    const nextStatus = userStatus === targetStatus ? 'cancelled' : targetStatus;

    setUserStatus(nextStatus);
    if (nextStatus === 'going') {
      setAnnouncement(`RSVP updated to Going with ${guestCount} guest(s).`);
    } else if (nextStatus === 'interested') {
      setAnnouncement('RSVP updated to Interested.');
    } else {
      setAnnouncement('RSVP cancelled.');
    }

    onRSVPChange?.(event.id, nextStatus, guestCount);

    startTransition(async () => {
      try {
        const res = await rsvpAction(event.id, nextStatus, guestCount);
        if (res.error) {
          setUserStatus(prevStatus);
          setAnnouncement(`Failed to update RSVP: ${res.error}`);
        } else {
          if (res.checkInCode) {
            setCheckInCode(res.checkInCode);
          } else if (nextStatus === 'cancelled') {
            setCheckInCode(null);
          }
        }
      } catch {
        setUserStatus(prevStatus);
        setCheckInCode(prevCode);
        setAnnouncement('Failed to update RSVP. Please try again.');
      }
    });
  };

  const handleGuestCountChange = (newCount: number) => {
    if (newCount < 1 || newCount > 10 || isPending) return;

    if (
      hasCapacity &&
      event.capacity &&
      newCount > guestCount &&
      otherAttendeesCount + newCount > event.capacity
    ) {
      setAnnouncement('Cannot increase guest count beyond capacity limit.');
      return;
    }

    setGuestCount(newCount);
    setAnnouncement(`Guest count updated to ${newCount}.`);
    onRSVPChange?.(event.id, userStatus || 'going', newCount);

    if (userStatus === 'going') {
      startTransition(async () => {
        try {
          await rsvpAction(event.id, 'going', newCount);
        } catch {
          // Handled silently
        }
      });
    }
  };

  return (
    <div
      className={`surface-card rounded-3xl p-6 space-y-5 flex flex-col justify-between transition-all shadow-xl border ${
        event.is_cancelled
          ? 'border-rose-500/30 opacity-80'
          : 'border-white/10 hover:border-amber-400/40 bg-slate-900/60'
      } ${className}`}
    >
      {/* Live announcement region for WCAG 2.2 AA */}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <div className="space-y-4">
        {/* Top Header: Date Chip + Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Caribbean Calendar Date Chip */}
            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-amber-400/20 via-brand-sunriseCoral/20 to-purple-500/20 border border-amber-400/30 rounded-2xl px-3.5 py-2 text-center min-w-[56px] shadow-sm">
              <span className="text-[11px] font-black tracking-widest text-amber-300 uppercase leading-none">
                {dateParts.month}
              </span>
              <span className="text-xl sm:text-2xl font-black text-white leading-tight">
                {dateParts.day}
              </span>
            </div>

            {/* Badges: Format & Privacy */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Event Format Badge */}
              {event.event_kind === 'in_person' && (
                <span className="text-[11px] font-black px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  🌴 In-Person
                </span>
              )}
              {event.event_kind === 'livestream' && (
                <span className="flex items-center gap-1.5 text-[11px] font-black text-rose-300 bg-rose-500/15 px-3 py-1 rounded-full border border-rose-500/30">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400" />
                  📹 Live Stream
                </span>
              )}
              {event.event_kind === 'hybrid' && (
                <span className="text-[11px] font-black px-3 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                  ⚡ Hybrid
                </span>
              )}

              {/* Privacy Badge */}
              {(!event.privacy || event.privacy === 'public') && (
                <span className="text-[11px] font-black px-3 py-1 rounded-full bg-brand-caribbeanSea/15 text-brand-caribbeanSea border border-brand-caribbeanSea/30 uppercase tracking-wider">
                  🌐 Public
                </span>
              )}
              {event.privacy === 'community_only' && (
                <span className="text-[11px] font-black px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                  🔒 Community Only
                </span>
              )}
              {event.privacy === 'invite_only' && (
                <span className="text-[11px] font-black px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  ✉️ Invite Only
                </span>
              )}
            </div>
          </div>

          {/* Livestream Watch Link if stream format */}
          {(event.event_kind === 'livestream' || event.event_kind === 'hybrid') &&
            event.livestream_url && (
              <a
                href={event.livestream_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-300 hover:text-rose-200 bg-rose-500/15 hover:bg-rose-500/25 px-3 py-1.5 rounded-full border border-rose-500/30 transition-colors"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>Watch Stream</span>
              </a>
            )}
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <h3 className="font-black text-lg sm:text-xl text-white group-hover:text-amber-300 transition-colors leading-snug">
            {event.title}
          </h3>
          {event.description && (
            <p className="text-xs sm:text-sm text-brand-sandstone/85 leading-relaxed line-clamp-2 font-medium">
              {event.description}
            </p>
          )}
        </div>

        {/* Venue, City, Territory Flag */}
        <div className="flex flex-col gap-1.5 text-xs sm:text-sm text-brand-sandstone/80">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-caribbeanSea flex-shrink-0" />
            <span className="text-base">{territoryFlag}</span>
            <span className="truncate">
              {event.venue ? `${event.venue} — ` : ''}
              {event.cities?.name || 'Caribbean'}
            </span>
          </div>

          {/* Time & Price */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>{dateParts.time}</span>
            </div>
            {event.price && (
              <span className="font-black text-white text-xs sm:text-sm bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                {event.price}
              </span>
            )}
          </div>
        </div>

        {/* Tag Pills */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium text-amber-200/90 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full"
              >
                {`#${tag.replace(/^#/, '')}`}
              </span>
            ))}
          </div>
        )}

        {/* Attendance & Capacity Tracker */}
        {hasCapacity && event.capacity && (
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-brand-sandstone/80 font-medium">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-brand-sunriseCoral" />
                <span>Confirmed Attendance</span>
              </span>
              <span className="font-semibold text-white">
                {`${attendeeCount} / ${event.capacity}`}
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={attendeeCount}
              aria-valuemin={0}
              aria-valuemax={event.capacity}
              className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden border border-white/10"
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isAtCapacity
                    ? 'bg-rose-500'
                    : progressPercentage >= 80
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* At Capacity Banner */}
        {isAtCapacity && (
          <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>At Capacity — RSVPs Closed</span>
          </div>
        )}
      </div>

      {/* Interactive RSVP Controls */}
      <div className="pt-4 border-t border-white/10 space-y-3">
        {currentUserId ? (
          <>
            {/* Segmented RSVP Controls */}
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="RSVP Options">
              <button
                type="button"
                disabled={isPending || isGoingDisabled}
                aria-pressed={userStatus === 'going'}
                onClick={() => handleStatusChange('going')}
                className={`min-h-[44px] min-w-[44px] font-bold text-xs sm:text-sm rounded-xl px-2 py-2.5 transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                  userStatus === 'going'
                    ? 'bg-emerald-500/25 border-emerald-500/60 text-emerald-200 shadow-md shadow-emerald-500/10'
                    : isGoingDisabled
                    ? 'bg-slate-800/40 border-slate-700/40 text-slate-500 cursor-not-allowed opacity-50'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-brand-sandstone hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Going</span>
              </button>

              <button
                type="button"
                disabled={isPending}
                aria-pressed={userStatus === 'interested'}
                onClick={() => handleStatusChange('interested')}
                className={`min-h-[44px] min-w-[44px] font-bold text-xs sm:text-sm rounded-xl px-2 py-2.5 transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                  userStatus === 'interested'
                    ? 'bg-amber-400/25 border-amber-400/60 text-amber-200 shadow-md shadow-amber-400/10'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-brand-sandstone hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Interested</span>
              </button>

              <button
                type="button"
                disabled={isPending}
                aria-pressed={userStatus === 'cancelled'}
                onClick={() => handleStatusChange('cancelled')}
                className={`min-h-[44px] min-w-[44px] font-bold text-xs sm:text-sm rounded-xl px-2 py-2.5 transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                  userStatus === 'cancelled'
                    ? 'bg-rose-500/25 border-rose-500/60 text-rose-200 shadow-md shadow-rose-500/10'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-brand-sandstone hover:text-white'
                }`}
              >
                <XCircle className="w-4 h-4 shrink-0" />
                <span>Can't Go</span>
              </button>
            </div>

            {/* Guest Count Stepper when Going */}
            {userStatus === 'going' && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-caribbeanSea" />
                  <span className="text-xs sm:text-sm font-semibold text-white">Guests</span>
                  <span className="text-xs text-brand-sandstone/70">(max 10)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Decrease guest count"
                    disabled={isPending || guestCount <= 1}
                    onClick={() => handleGuestCountChange(guestCount - 1)}
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center border border-white/10 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-black text-amber-300">
                    {guestCount}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase guest count"
                    disabled={
                      isPending ||
                      guestCount >= 10 ||
                      Boolean(hasCapacity && event.capacity && otherAttendeesCount + guestCount + 1 > event.capacity)
                    }
                    onClick={() => handleGuestCountChange(guestCount + 1)}
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center border border-white/10 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Check-in Code display */}
            {userStatus === 'going' && checkInCode && (
              <div className="p-3 rounded-2xl bg-brand-caribbeanSea/15 border border-brand-caribbeanSea/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-brand-caribbeanSea" />
                  <span className="text-xs font-bold text-brand-caribbeanSea">Check-in Code</span>
                </div>
                <span className="font-mono text-xs sm:text-sm font-black text-white bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/10 tracking-wider">
                  {checkInCode}
                </span>
              </div>
            )}
          </>
        ) : (
          <Link
            href="/login"
            className="w-full text-center bg-white/10 hover:bg-white/15 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm border border-white/15 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            Sign in to RSVP
          </Link>
        )}
      </div>
    </div>
  );
}
