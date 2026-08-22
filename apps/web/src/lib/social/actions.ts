'use server';

import { revalidatePath } from 'next/cache';
import { CaribAIEngine } from '@caribbean/ai';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';

export interface PostActionState {
  error: string | null;
}

export async function createPostAction(_prev: PostActionState, formData: FormData): Promise<PostActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to post.' };

  const content = String(formData.get('content') ?? '').trim();
  if (!content) return { error: 'Write something first.' };
  if (content.length > 3000) return { error: 'Posts are limited to 3000 characters.' };

  const caribAI = new CaribAIEngine();
  const risk = await caribAI.classifyContentRisk(content);
  if (risk.score >= 0.85) {
    return { error: 'CaribAI flagged this content before publishing. Please revise it.' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database is not configured.' };

  const { error } = await supabase.from('posts').insert({
    author_id: user.id,
    content,
    visibility: 'public',
  });
  if (error) return { error: error.message };

  revalidatePath('/');
  return { error: null };
}
