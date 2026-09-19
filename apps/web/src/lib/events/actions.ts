'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';

export interface EventActionState {
  error: string | null;
}

export async function createEventAction(_prev: EventActionState, formData: FormData): Promise<EventActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to host events.' };

  const title = String(formData.get('title') ?? '').trim();
  const eventKind = String(formData.get('eventKind') ?? 'in_person');
  const venue = String(formData.get('venue') ?? '').trim();
  const cityId = String(formData.get('cityId') ?? '') || null;
  const startsAt = String(formData.get('startsAt') ?? '');
  const capacityRaw = String(formData.get('capacity') ?? '');

  if (!title) return { error: 'Event title is required.' };
  if (!['in_person', 'livestream', 'hybrid'].includes(eventKind)) return { error: 'Invalid event format.' };
  const startsAtDate = new Date(startsAt);
  if (Number.isNaN(startsAtDate.getTime())) return { error: 'A valid start date is required.' };
  if (startsAtDate.getTime() <= Date.now()) return { error: 'Events must start in the future.' };

  const capacity = capacityRaw ? Number.parseInt(capacityRaw, 10) : null;
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) {
    return { error: 'Capacity must be a positive whole number.' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database is not configured.' };

  const { error } = await supabase.from('events').insert({
    host_id: user.id,
    title,
    event_kind: eventKind,
    venue: venue || null,
    city_id: cityId,
    starts_at: startsAtDate.toISOString(),
    capacity,
    is_paid: false,
  });
  if (error) return { error: error.message };

  revalidatePath('/events');
  return { error: null };
}

export async function rsvpAction(
  eventId: string,
  targetStatusOrFormData: 'going' | 'interested' | 'cancelled' | FormData = 'going'
): Promise<{ status: string | null; error?: string }> {
  let targetStatus: 'going' | 'interested' | 'cancelled' = 'going';
  if (typeof targetStatusOrFormData === 'string') {
    targetStatus = targetStatusOrFormData;
  } else if (targetStatusOrFormData instanceof FormData) {
    const raw = String(targetStatusOrFormData.get('targetStatus') ?? 'going');
    if (raw === 'going' || raw === 'interested' || raw === 'cancelled') {
      targetStatus = raw;
    }
  }

  const user = await getCurrentUser();
  if (!user) return { status: null, error: 'Sign in to RSVP to events.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: null, error: 'Database not available.' };

  const existing = await supabase
    .from('event_attendees')
    .select('rsvp_status')
    .eq('event_id', eventId)
    .eq('profile_id', user.id)
    .maybeSingle();

  if (existing.data && existing.data.rsvp_status === targetStatus) {
    await supabase
      .from('event_attendees')
      .update({ rsvp_status: 'cancelled' })
      .eq('event_id', eventId)
      .eq('profile_id', user.id);
    revalidatePath('/events');
    return { status: 'cancelled' };
  } else {
    await supabase.from('event_attendees').upsert(
      { event_id: eventId, profile_id: user.id, rsvp_status: targetStatus },
      { onConflict: 'event_id,profile_id' },
    );
    revalidatePath('/events');
    return { status: targetStatus };
  }
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

  const updatePayload: any = {
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

  revalidatePath('/events');
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

  revalidatePath('/events');
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

  revalidatePath('/events');
  return { error: null, success: true };
}

