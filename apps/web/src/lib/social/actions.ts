'use server';

import { revalidatePath } from 'next/cache';
import { CaribAIEngine } from '@caribbean/ai';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';

export interface PostActionState {
  error: string | null;
  postId?: string;
}

export async function createPostAction(_prev: PostActionState, formData: FormData): Promise<PostActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to post.' };

  const content = String(formData.get('content') ?? '').trim();
  const mediaUrlsRaw = formData.get('media_urls');
  const culturalTagsRaw = formData.get('cultural_tags');
  const visibility = (formData.get('visibility') as 'public' | 'followers' | 'friends' | 'private') || 'public';

  let mediaUrls: string[] = [];
  if (typeof mediaUrlsRaw === 'string' && mediaUrlsRaw.trim()) {
    try {
      mediaUrls = JSON.parse(mediaUrlsRaw);
    } catch {
      mediaUrls = mediaUrlsRaw.split(',').map((u) => u.trim()).filter(Boolean);
    }
  }

  let culturalTags: string[] = [];
  if (typeof culturalTagsRaw === 'string' && culturalTagsRaw.trim()) {
    try {
      culturalTags = JSON.parse(culturalTagsRaw);
    } catch {
      culturalTags = culturalTagsRaw.split(',').map((t) => t.trim()).filter(Boolean);
    }
  }

  if (!content && mediaUrls.length === 0) {
    return { error: 'Post must contain text or media.' };
  }
  if (content.length > 3000) {
    return { error: 'Posts are limited to 3000 characters.' };
  }

  if (content) {
    const caribAI = new CaribAIEngine();
    const risk = await caribAI.classifyContentRisk(content);
    if (risk.score >= 0.85) {
      return { error: 'CaribAI flagged this content before publishing. Please revise it.' };
    }
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database is not configured.' };

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      content: content || null,
      visibility,
      media_urls: mediaUrls,
      cultural_tags: culturalTags,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  revalidatePath('/');
  return { error: null, postId: data?.id };
}

export async function toggleLikeAction(postId: string): Promise<{ liked: boolean; likesCount: number; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { liked: false, likesCount: 0, error: 'Sign in to like posts.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { liked: false, likesCount: 0, error: 'Database is not configured.' };

  // Check if already liked
  const { data: existing } = await supabase
    .from('post_reactions')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    // Remove reaction
    await supabase.from('post_reactions').delete().eq('post_id', postId).eq('user_id', user.id);
    
    // Fetch updated count
    const { count } = await supabase
      .from('post_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    revalidatePath('/');
    return { liked: false, likesCount: count ?? 0, error: null };
  } else {
    // Add reaction
    await supabase.from('post_reactions').insert({
      post_id: postId,
      user_id: user.id,
      reaction_type: 'like',
    });

    const { count } = await supabase
      .from('post_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    revalidatePath('/');
    return { liked: true, likesCount: count ?? 1, error: null };
  }
}

export async function createCommentAction(postId: string, content: string): Promise<{ success: boolean; comment?: any; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in to comment.' };

  const cleanContent = content.trim();
  if (!cleanContent) return { success: false, error: 'Comment cannot be empty.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database is not configured.' };

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      author_id: user.id,
      content: cleanContent,
    })
    .select('id, content, created_at, profiles(display_name, username)')
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/');
  return { success: true, comment: data, error: null };
}

export async function fetchPostCommentsAction(postId: string): Promise<{ comments: any[]; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { comments: [], error: 'Database is not configured.' };

  const { data, error } = await supabase
    .from('comments')
    .select('id, content, created_at, profiles(display_name, username)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) return { comments: [], error: error.message };
  return { comments: data ?? [], error: null };
}

