'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';

export type DraftContentType = 'post' | 'video' | 'podcast' | 'episode' | 'livestream' | 'event';

export interface CreatorDraftItem {
  id: string;
  creator_id: string;
  content_type: DraftContentType;
  title: string;
  body: string | null;
  media_urls: string[];
  metadata: Record<string, any>;
  scheduled_for: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaveDraftInput {
  id?: string;
  contentType: DraftContentType;
  title: string;
  body?: string | null;
  mediaUrls?: string[];
  metadata?: Record<string, any>;
  scheduledFor?: string | null;
}

export async function saveDraftAction(
  input: SaveDraftInput,
): Promise<{ success: boolean; draftId?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  const payload = {
    creator_id: user.id,
    content_type: input.contentType,
    title: input.title.trim() || 'Untitled Draft',
    body: input.body ?? null,
    media_urls: input.mediaUrls ?? [],
    metadata: input.metadata ?? {},
    scheduled_for: input.scheduledFor ? new Date(input.scheduledFor).toISOString() : null,
  };

  if (input.id) {
    const { data, error } = await supabase
      .from('creator_content_drafts')
      .update(payload)
      .eq('id', input.id)
      .eq('creator_id', user.id)
      .select('id')
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath('/create');
    revalidatePath('/creator-studio');
    return { success: true, draftId: data?.id };
  } else {
    const { data, error } = await supabase
      .from('creator_content_drafts')
      .insert(payload)
      .select('id')
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath('/create');
    revalidatePath('/creator-studio');
    return { success: true, draftId: data?.id };
  }
}

export async function deleteDraftAction(
  draftId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  const { error } = await supabase
    .from('creator_content_drafts')
    .delete()
    .eq('id', draftId)
    .eq('creator_id', user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/create');
  revalidatePath('/creator-studio');
  return { success: true };
}

export async function getCreatorDraftsAction(
  contentType?: DraftContentType,
): Promise<{ drafts: CreatorDraftItem[]; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { drafts: [], error: 'Unauthorized.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { drafts: [], error: 'Service unavailable.' };

  let query = supabase
    .from('creator_content_drafts')
    .select('*')
    .eq('creator_id', user.id)
    .order('updated_at', { ascending: false });

  if (contentType) {
    query = query.eq('content_type', contentType);
  }

  const { data, error } = await query;
  if (error) return { drafts: [], error: error.message };

  return { drafts: (data as CreatorDraftItem[]) ?? [] };
}
