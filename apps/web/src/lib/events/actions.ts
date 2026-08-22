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

export async function rsvpAction(eventId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  const existing = await supabase
    .from('event_attendees')
    .select('rsvp_status')
    .eq('event_id', eventId)
    .eq('profile_id', user.id)
    .maybeSingle();

  if (existing.data && existing.data.rsvp_status === 'going') {
    await supabase
      .from('event_attendees')
      .update({ rsvp_status: 'cancelled' })
      .eq('event_id', eventId)
      .eq('profile_id', user.id);
  } else {
    await supabase.from('event_attendees').upsert(
      { event_id: eventId, profile_id: user.id, rsvp_status: 'going' },
      { onConflict: 'event_id,profile_id' },
    );
  }
  revalidatePath('/events');
}
