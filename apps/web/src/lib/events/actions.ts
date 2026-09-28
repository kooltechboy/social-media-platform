'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import type {
  CreateEventInput,
  EventAttendee,
  EventKind,
  EventPrivacy,
  LiveEventItem,
} from './types';

export interface EventActionState {
  error: string | null;
  eventId?: string;
  event?: LiveEventItem | null;
}

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Gracefully ignore outside Next.js request context (e.g. tests)
  }
}

/**
 * Creates an event with full Caribbean digital ecosystem metadata:
 * privacy scopes, livestream URLs, hero banners, tags, and capacity gates.
 */
export async function createEventAction(
  prevOrInput: EventActionState | FormData | CreateEventInput,
  maybeFormData?: FormData
): Promise<EventActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to host events.' };

  let title = '';
  let description: string | null = null;
  let eventKind: EventKind = 'in_person';
  let privacy: EventPrivacy = 'public';
  let venue: string | null = null;
  let livestreamUrl: string | null = null;
  let coverImageUrl: string | null = null;
  let tags: string[] = [];
  let cityId: string | null = null;
  let countryIso: string | null = null;
  let communityId: string | null = null;
  let businessId: string | null = null;
  let startsAt = '';
  let endsAt: string | null = null;
  let capacityRaw = '';

  let formData: FormData | null = null;
  if (maybeFormData instanceof FormData) {
    formData = maybeFormData;
  } else if (prevOrInput instanceof FormData) {
    formData = prevOrInput;
  }

  if (formData) {
    title = String(formData.get('title') ?? '').trim();
    description = String(formData.get('description') ?? '').trim() || null;
    eventKind = String(formData.get('eventKind') ?? formData.get('event_kind') ?? 'in_person') as EventKind;
    privacy = String(formData.get('privacy') ?? 'public') as EventPrivacy;
    venue = String(formData.get('venue') ?? '').trim() || null;
    livestreamUrl = String(formData.get('livestreamUrl') ?? formData.get('livestream_url') ?? '').trim() || null;
    coverImageUrl = String(formData.get('coverImageUrl') ?? formData.get('cover_image_url') ?? '').trim() || null;
    cityId = String(formData.get('cityId') ?? formData.get('city_id') ?? '') || null;
    countryIso = String(formData.get('countryIso') ?? formData.get('country_iso') ?? '') || null;
    communityId = String(formData.get('communityId') ?? formData.get('community_id') ?? '') || null;
    businessId = String(formData.get('businessId') ?? formData.get('business_id') ?? '') || null;
    startsAt = String(formData.get('startsAt') ?? formData.get('starts_at') ?? '');
    endsAt = String(formData.get('endsAt') ?? formData.get('ends_at') ?? '') || null;
    capacityRaw = String(formData.get('capacity') ?? '');

    const rawTags = formData.get('tags');
    if (typeof rawTags === 'string' && rawTags) {
      try {
        const parsed = JSON.parse(rawTags);
        if (Array.isArray(parsed)) {
          tags = parsed.map((t) => String(t).trim()).filter(Boolean);
        }
      } catch {
        tags = rawTags.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }
  } else if (typeof prevOrInput === 'object' && prevOrInput !== null && 'title' in prevOrInput) {
    const input = prevOrInput as CreateEventInput;
    title = (input.title ?? '').trim();
    description = input.description ?? null;
    eventKind = input.event_kind ?? 'in_person';
    privacy = input.privacy ?? 'public';
    venue = input.venue ?? null;
    livestreamUrl = input.livestream_url ?? null;
    coverImageUrl = input.cover_image_url ?? null;
    tags = input.tags ?? [];
    cityId = input.city_id ?? null;
    countryIso = input.country_iso ?? null;
    communityId = input.community_id ?? null;
    businessId = input.business_id ?? null;
    startsAt = input.starts_at;
    endsAt = input.ends_at ?? null;
    capacityRaw = input.capacity != null ? String(input.capacity) : '';
  }

  if (!title) return { error: 'Event title is required.' };
  if (!['in_person', 'livestream', 'hybrid'].includes(eventKind)) return { error: 'Invalid event format.' };
  if (!['public', 'community_only', 'invite_only'].includes(privacy)) return { error: 'Invalid event privacy.' };

  const startsAtDate = new Date(startsAt);
  if (Number.isNaN(startsAtDate.getTime())) return { error: 'A valid start date is required.' };
  if (startsAtDate.getTime() <= Date.now()) return { error: 'Events must start in the future.' };

  let endsAtIso: string | null = null;
  if (endsAt) {
    const endsAtDate = new Date(endsAt);
    if (Number.isNaN(endsAtDate.getTime())) {
      return { error: 'Invalid end date.' };
    }
    if (endsAtDate.getTime() <= startsAtDate.getTime()) {
      return { error: 'End date must be after start date.' };
    }
    endsAtIso = endsAtDate.toISOString();
  }

  const capacity = capacityRaw ? Number.parseInt(capacityRaw, 10) : null;
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) {
    return { error: 'Capacity must be a positive whole number.' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database is not configured.' };

  const { data: newEvent, error } = await supabase
    .from('events')
    .insert({
      host_id: user.id,
      title,
      description,
      event_kind: eventKind,
      privacy,
      venue,
      city_id: cityId,
      country_iso: countryIso,
      community_id: communityId,
      business_id: businessId,
      livestream_url: livestreamUrl,
      cover_image_url: coverImageUrl,
      tags,
      starts_at: startsAtDate.toISOString(),
      ends_at: endsAtIso,
      capacity,
      is_paid: false,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  safeRevalidatePath('/events');
  return { error: null, eventId: newEvent?.id, event: newEvent };
}

/**
 * Handles attendee RSVP transitions with party guest counts (1..10),
 * on-site check-in code generation, and capacity limit enforcement.
 */
export async function rsvpAction(
  eventId: string,
  targetStatusOrFormData: 'going' | 'interested' | 'cancelled' | FormData = 'going',
  guestCountOrOptions?: number | { guestCount?: number }
): Promise<{ status: string | null; error?: string; checkInCode?: string | null }> {
  let targetStatus: 'going' | 'interested' | 'cancelled' = 'going';
  let guestCount = 1;

  if (typeof targetStatusOrFormData === 'string') {
    targetStatus = targetStatusOrFormData;
  } else if (targetStatusOrFormData instanceof FormData) {
    const raw = String(targetStatusOrFormData.get('targetStatus') ?? 'going');
    if (raw === 'going' || raw === 'interested' || raw === 'cancelled') {
      targetStatus = raw;
    }
    const rawCount = targetStatusOrFormData.get('guestCount');
    if (rawCount) {
      guestCount = Number.parseInt(String(rawCount), 10);
    }
  }

  if (typeof guestCountOrOptions === 'number') {
    guestCount = guestCountOrOptions;
  } else if (guestCountOrOptions && typeof guestCountOrOptions === 'object' && 'guestCount' in guestCountOrOptions) {
    guestCount = guestCountOrOptions.guestCount ?? 1;
  }

  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 10) {
    return { status: null, error: 'Guest count must be between 1 and 10.' };
  }

  const user = await getCurrentUser();
  if (!user) return { status: null, error: 'Sign in to RSVP to events.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: null, error: 'Database not available.' };

  // Enforce capacity bounds when RSVPing 'going'
  if (targetStatus === 'going') {
    const { data: eventData } = await supabase
      .from('events')
      .select('id, capacity')
      .eq('id', eventId)
      .single();

    if (eventData && typeof eventData.capacity === 'number' && eventData.capacity > 0) {
      const { data: goingAttendees } = await supabase
        .from('event_attendees')
        .select('profile_id, guest_count')
        .eq('event_id', eventId)
        .eq('rsvp_status', 'going');

      const attendeeList = goingAttendees || [];
      const currentGoingTotal = attendeeList
        .filter((a: any) => a.profile_id !== user.id)
        .reduce((sum: number, a: any) => sum + (typeof a.guest_count === 'number' ? a.guest_count : 1), 0);

      if (currentGoingTotal + guestCount > eventData.capacity) {
        return { status: null, error: 'Event is at full capacity.' };
      }
    }
  }

  const existing = await supabase
    .from('event_attendees')
    .select('rsvp_status, check_in_code')
    .eq('event_id', eventId)
    .eq('profile_id', user.id)
    .maybeSingle();

  if (existing.data && existing.data.rsvp_status === targetStatus) {
    await supabase
      .from('event_attendees')
      .update({ rsvp_status: 'cancelled' })
      .eq('event_id', eventId)
      .eq('profile_id', user.id);

    safeRevalidatePath('/events');
    safeRevalidatePath(`/events/${eventId}`);
    return { status: 'cancelled' };
  } else {
    const checkInCode =
      existing.data?.check_in_code ||
      Math.random().toString(36).substring(2, 8).toUpperCase() +
        Math.random().toString(36).substring(2, 8).toUpperCase();

    const { error: upsertErr } = await supabase.from('event_attendees').upsert(
      {
        event_id: eventId,
        profile_id: user.id,
        rsvp_status: targetStatus,
        guest_count: targetStatus === 'going' ? guestCount : 1,
        check_in_code: checkInCode,
      },
      { onConflict: 'event_id,profile_id' }
    );

    if (upsertErr) {
      return { status: null, error: upsertErr.message };
    }

    safeRevalidatePath('/events');
    safeRevalidatePath(`/events/${eventId}`);
    return { status: targetStatus, checkInCode };
  }
}

/**
 * Validates and records on-site attendee check-in. Restricted strictly to the event host.
 */
export async function checkInAttendeeAction(
  eventId: string,
  checkInCode: string
): Promise<{ success: boolean; error: string | null; attendee?: EventAttendee | null }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable.' };

  const { data: event } = await supabase
    .from('events')
    .select('id, host_id')
    .eq('id', eventId)
    .single();

  if (!event || event.host_id !== user.id) {
    return { success: false, error: 'Only the event host can check in attendees.' };
  }

  const trimmedCode = (checkInCode || '').trim();
  if (!trimmedCode) {
    return { success: false, error: 'Invalid check-in code.' };
  }

  const { data: attendee } = await supabase
    .from('event_attendees')
    .select('*')
    .eq('event_id', eventId)
    .eq('check_in_code', trimmedCode)
    .maybeSingle();

  if (!attendee) {
    return { success: false, error: 'Invalid check-in code.' };
  }

  if (attendee.checked_in) {
    return { success: false, error: 'Attendee is already checked in.', attendee };
  }

  const checkedInAt = new Date().toISOString();
  const { data: updated, error: updateErr } = await supabase
    .from('event_attendees')
    .update({
      checked_in: true,
      checked_in_at: checkedInAt,
    })
    .eq('event_id', eventId)
    .eq('check_in_code', trimmedCode)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  safeRevalidatePath('/events');
  safeRevalidatePath(`/events/${eventId}`);
  return { success: true, error: null, attendee: updated as EventAttendee };
}

export async function rsvpEventFormAction(eventId: string): Promise<void> {
  await rsvpAction(eventId, 'going');
}

export async function updateEventAction(
  eventId: string,
  formData: FormData
): Promise<{ error: string | null; success?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database unavailable.' };

  const { data: event } = await supabase
    .from('events')
    .select('id, host_id')
    .eq('id', eventId)
    .maybeSingle();

  if (!event || event.host_id !== user.id) {
    return { error: 'Only the event host can edit this event.' };
  }

  const title = String(formData.get('title') ?? '').trim();
  const venue = String(formData.get('venue') ?? '').trim();
  const startsAt = String(formData.get('startsAt') ?? '');
  const capacityRaw = String(formData.get('capacity') ?? '');

  if (!title) return { error: 'Event title is required.' };

  const updatePayload: Record<string, unknown> = {
    title,
    venue: venue || null,
  };

  if (startsAt) {
    const startsAtDate = new Date(startsAt);
    if (!Number.isNaN(startsAtDate.getTime())) {
      updatePayload.starts_at = startsAtDate.toISOString();
    }
  }

  if (capacityRaw !== '') {
    const cap = Number.parseInt(capacityRaw, 10);
    updatePayload.capacity = Number.isInteger(cap) && cap > 0 ? cap : null;
  }

  const { error: updateErr } = await supabase
    .from('events')
    .update(updatePayload)
    .eq('id', eventId)
    .eq('host_id', user.id);

  if (updateErr) return { error: updateErr.message };

  safeRevalidatePath('/events');
  safeRevalidatePath(`/events/${eventId}`);
  return { error: null, success: true };
}

export async function cancelEventAction(
  eventId: string,
  reason?: string
): Promise<{ error: string | null; success?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database unavailable.' };

  const { data: event } = await supabase
    .from('events')
    .select('id, host_id')
    .eq('id', eventId)
    .maybeSingle();

  if (!event || event.host_id !== user.id) {
    return { error: 'Only the event host can cancel this event.' };
  }

  const { error: updateErr } = await supabase
    .from('events')
    .update({
      is_cancelled: true,
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason || 'Cancelled by host',
    })
    .eq('id', eventId)
    .eq('host_id', user.id);

  if (updateErr) return { error: updateErr.message };

  safeRevalidatePath('/events');
  safeRevalidatePath(`/events/${eventId}`);
  return { error: null, success: true };
}

export async function deleteEventAction(
  eventId: string
): Promise<{ error: string | null; success?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database unavailable.' };

  const { data: event } = await supabase
    .from('events')
    .select('id, host_id')
    .eq('id', eventId)
    .maybeSingle();

  if (!event || event.host_id !== user.id) {
    return { error: 'Only the event host can delete this event.' };
  }

  const { error: delErr } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('host_id', user.id);

  if (delErr) return { error: delErr.message };

  safeRevalidatePath('/events');
  safeRevalidatePath(`/events/${eventId}`);
  return { error: null, success: true };
}
