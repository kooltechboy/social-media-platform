'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, createServiceSupabaseClient, getCurrentUser, getAuthorizedUser } from '../supabase/server';
import { OfficialService, CreateDraftParams, PublishDirectParams } from './official-service';
import { OfficialContentType, OfficialPostDraftStatus } from './types';

export interface OfficialActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  error?: string | null;
  data?: T;
}

/**
 * Server action to create an official draft post.
 */
export async function createOfficialDraftAction(
  _prev: OfficialActionResponse,
  formData: FormData
): Promise<OfficialActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Authentication required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  const officialAccountId = String(formData.get('official_account_id') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();
  const contentType = (formData.get('content_type') as OfficialContentType) || 'announcement';
  const mediaUrlsRaw = formData.get('media_urls');
  const culturalTagsRaw = formData.get('cultural_tags');

  if (!officialAccountId) return { success: false, error: 'Official account target is required.' };
  if (!content) return { success: false, error: 'Post content cannot be empty.' };

  let mediaUrls: string[] = [];
  if (typeof mediaUrlsRaw === 'string' && mediaUrlsRaw.trim()) {
    try {
      mediaUrls = JSON.parse(mediaUrlsRaw);
    } catch {
      mediaUrls = mediaUrlsRaw.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  let culturalTags: string[] = [];
  if (typeof culturalTagsRaw === 'string' && culturalTagsRaw.trim()) {
    try {
      culturalTags = JSON.parse(culturalTagsRaw);
    } catch {
      culturalTags = culturalTagsRaw.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  try {
    const service = new OfficialService(supabase);
    const isAuthorized = await service.verifyOperatorPermission(
      officialAccountId,
      user.id,
      'publisher'
    );

    if (!isAuthorized) {
      return { success: false, error: 'Unauthorized: Operator permissions required.' };
    }

    const draft = await service.createDraft({
      officialAccountId,
      authorOperatorId: user.id,
      actorType: 'human_operator',
      content,
      mediaUrls,
      culturalTags,
      contentType,
    });

    revalidatePath('/admin/official-accounts');
    return {
      success: true,
      message: 'Official post draft saved successfully.',
      data: draft,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to create official draft.' };
  }
}

/**
 * Server action to publish an approved draft.
 */
export async function publishOfficialDraftAction(draftId: string): Promise<OfficialActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Authentication required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  try {
    const service = new OfficialService(supabase);
    const result = await service.publishDraft(draftId, user.id);

    revalidatePath('/');
    revalidatePath('/profile/tukubi');
    revalidatePath('/admin/official-accounts');
    return {
      success: true,
      message: 'Official post published to the TUKUBI feed successfully.',
      data: result,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to publish draft.' };
  }
}

/**
 * Server action to directly publish official content as @tukubi.
 */
export async function directPublishOfficialPostAction(
  _prev: OfficialActionResponse,
  formData: FormData
): Promise<OfficialActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Authentication required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  const officialAccountId = String(formData.get('official_account_id') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();
  const contentType = (formData.get('content_type') as OfficialContentType) || 'announcement';
  const isPinned = formData.get('is_pinned') === 'true';
  const mediaUrlsRaw = formData.get('media_urls');
  const culturalTagsRaw = formData.get('cultural_tags');

  if (!officialAccountId) return { success: false, error: 'Official account target is required.' };
  if (!content) return { success: false, error: 'Post content cannot be empty.' };

  let mediaUrls: string[] = [];
  if (typeof mediaUrlsRaw === 'string' && mediaUrlsRaw.trim()) {
    try {
      mediaUrls = JSON.parse(mediaUrlsRaw);
    } catch {
      mediaUrls = mediaUrlsRaw.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  let culturalTags: string[] = [];
  if (typeof culturalTagsRaw === 'string' && culturalTagsRaw.trim()) {
    try {
      culturalTags = JSON.parse(culturalTagsRaw);
    } catch {
      culturalTags = culturalTagsRaw.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  try {
    const service = new OfficialService(supabase);
    const result = await service.directPublish({
      officialAccountId,
      operatorUserId: user.id,
      content,
      mediaUrls,
      culturalTags,
      contentType,
      isPinned,
    });

    revalidatePath('/');
    revalidatePath('/explore');
    revalidatePath('/profile/tukubi');
    revalidatePath('/admin/official-accounts');
    return {
      success: true,
      message: 'Official TUKUBI post published successfully.',
      data: result,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to publish official post.' };
  }
}

/**
 * Server action to toggle pinning of an official post.
 */
export async function togglePinOfficialPostAction(
  postId: string,
  isPinned: boolean
): Promise<OfficialActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Authentication required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  try {
    const service = new OfficialService(supabase);
    await service.togglePin(postId, user.id, isPinned);

    revalidatePath('/');
    revalidatePath('/profile/tukubi');
    return {
      success: true,
      message: isPinned ? 'Post pinned to top of profile.' : 'Post unpinned.',
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to toggle pin.' };
  }
}
