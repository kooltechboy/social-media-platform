/**
 * Tukubi Caribbean Digital Ecosystem — Events Domain Primitives & Types
 * Adheres to NASA-grade architecture and Tukubi engineering standards.
 */

export type EventKind = 'in_person' | 'livestream' | 'hybrid';
export type EventPrivacy = 'public' | 'community_only' | 'invite_only';
export type RSVPStatus = 'going' | 'interested' | 'cancelled';

export interface EventAttendee {
  event_id: string;
  profile_id: string;
  rsvp_status: RSVPStatus;
  guest_count: number;
  check_in_code?: string | null;
  checked_in: boolean;
  checked_in_at?: string | null;
  joined_at: string;
  profile?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string | null;
  } | null;
}

export interface LiveEventItem {
  id: string;
  title: string;
  description: string | null;
  event_kind: EventKind;
  privacy?: EventPrivacy;
  venue: string | null;
  starts_at: string;
  ends_at?: string | null;
  capacity: number | null;
  price?: string;
  price_minor?: number | null;
  currency?: string;
  is_paid?: boolean;
  host_id?: string | null;
  community_id?: string | null;
  business_id?: string | null;
  country_iso?: string | null;
  city_id?: string | null;
  livestream_url?: string | null;
  cover_image_url?: string | null;
  tags?: string[];
  is_featured?: boolean;
  is_cancelled?: boolean;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  created_at?: string;
  cities?: {
    name: string;
    country_iso: string;
  } | null;
  event_attendees?: Array<{
    profile_id: string;
    rsvp_status: string;
    guest_count?: number;
  }>;
  host?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string | null;
  } | null;
}

export interface CreateEventInput {
  title: string;
  description?: string | null;
  event_kind: EventKind;
  privacy?: EventPrivacy;
  venue?: string | null;
  country_iso?: string | null;
  city_id?: string | null;
  starts_at: string;
  ends_at?: string | null;
  capacity?: number | null;
  is_paid?: boolean;
  price_minor?: number | null;
  currency?: string;
  community_id?: string | null;
  business_id?: string | null;
  livestream_url?: string | null;
  cover_image_url?: string | null;
  tags?: string[];
  is_featured?: boolean;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  is_cancelled?: boolean;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
}

/**
 * Validates state transitions between RSVP statuses.
 * Null indicates no current RSVP record.
 */
export function validateRSVPTransition(
  current: RSVPStatus | null,
  next: RSVPStatus
): boolean {
  if (current === next) return false;
  if (!['going', 'interested', 'cancelled'].includes(next)) return false;

  // Cannot cancel an RSVP that doesn't exist
  if (current === null) {
    return next === 'going' || next === 'interested';
  }

  // Once an RSVP exists, transitioning between going, interested, or cancelled is allowed
  return true;
}

/**
 * Validates whether a user has permission to view/access an event based on its privacy setting.
 */
export function canUserAccessEvent(
  event: {
    id?: string;
    privacy: EventPrivacy;
    host_id?: string | null;
    community_id?: string | null;
  },
  user: {
    id: string;
    communityIds?: string[];
    invitedEventIds?: string[];
  } | null
): boolean {
  // Public events are accessible to everyone, including unauthenticated guests
  if (event.privacy === 'public') {
    return true;
  }

  // Private / community events require an authenticated session
  if (!user) {
    return false;
  }

  // The event host always has full access to their own event
  if (event.host_id && user.id === event.host_id) {
    return true;
  }

  // Community-only events require membership in the host community
  if (event.privacy === 'community_only') {
    if (!event.community_id) return false;
    return Boolean(user.communityIds && user.communityIds.includes(event.community_id));
  }

  // Invite-only events require an explicit invite
  if (event.privacy === 'invite_only') {
    if (!event.id) return false;
    return Boolean(user.invitedEventIds && user.invitedEventIds.includes(event.id));
  }

  return false;
}

/**
 * Formats an ISO datetime string into a localized Caribbean/English presentation.
 */
export function formatEventDateTime(iso: string, locale: string = 'en-US'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  return date.toLocaleString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Determines whether an event is currently live based on start time and optional end time.
 * If no end time is specified, assumes a default live duration of 3 hours.
 */
export function isEventLive(
  startsAt: string,
  endsAt?: string | null,
  referenceDate: Date | number = Date.now()
): boolean {
  const nowMs = typeof referenceDate === 'number' ? referenceDate : referenceDate.getTime();
  const startMs = new Date(startsAt).getTime();

  if (Number.isNaN(startMs) || nowMs < startMs) {
    return false;
  }

  if (endsAt) {
    const endMs = new Date(endsAt).getTime();
    if (Number.isNaN(endMs)) return false;
    return nowMs <= endMs;
  }

  // Default duration for events without explicit end time: 3 hours
  const DEFAULT_EVENT_DURATION_MS = 3 * 60 * 60 * 1000;
  return nowMs - startMs <= DEFAULT_EVENT_DURATION_MS;
}
