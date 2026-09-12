'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import type { PollData, PollOptionData, PollVoteResult } from './types';

/**
 * Fetches structured poll data for a specific post.
 */
export async function fetchPollByPostIdAction(postId: string): Promise<PollData | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const user = await getCurrentUser();

  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select('id, post_id, question, expires_at, allow_multiple, total_votes, created_at')
    .eq('post_id', postId)
    .maybeSingle();

  if (pollError || !poll) return null;

  const { data: options } = await supabase
    .from('poll_options')
    .select('id, poll_id, option_text, position, votes_count')
    .eq('poll_id', poll.id)
    .order('position', { ascending: true });

  let userVotedOptionId: string | null = null;
  if (user) {
    const { data: vote } = await supabase
      .from('poll_votes')
      .select('option_id')
      .eq('poll_id', poll.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (vote) {
      userVotedOptionId = vote.option_id;
    }
  }

  const total = Number(poll.total_votes || 0);
  const formattedOptions: PollOptionData[] = (options || []).map((opt) => {
    const count = Number(opt.votes_count || 0);
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return {
      id: opt.id,
      pollId: opt.poll_id,
      optionText: opt.option_text,
      position: opt.position,
      votesCount: count,
      percentage,
    };
  });

  const isExpired = new Date(poll.expires_at).getTime() <= Date.now();

  return {
    id: poll.id,
    postId: poll.post_id,
    question: poll.question,
    expiresAt: poll.expires_at,
    allowMultiple: poll.allow_multiple,
    totalVotes: total,
    createdAt: poll.created_at,
    options: formattedOptions,
    userVotedOptionId,
    isExpired,
  };
}

/**
 * Casts a vote in an interactive poll.
 */
export async function votePollAction(pollId: string, optionId: string): Promise<PollVoteResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'You must be signed in to vote.' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: 'Database service is unavailable.' };
  }

  // 1. Check poll validity and expiration
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select('id, post_id, expires_at')
    .eq('id', pollId)
    .single();

  if (pollError || !poll) {
    return { success: false, error: 'Poll not found.' };
  }

  if (new Date(poll.expires_at).getTime() <= Date.now()) {
    return { success: false, error: 'This poll has already ended.' };
  }

  // 2. Insert vote record
  const { error: voteError } = await supabase
    .from('poll_votes')
    .insert({
      poll_id: pollId,
      option_id: optionId,
      user_id: user.id,
    });

  if (voteError) {
    if (voteError.code === '23505') {
      return { success: false, error: 'You have already voted in this poll.' };
    }
    return { success: false, error: voteError.message || 'Failed to record vote.' };
  }

  // 3. Re-fetch updated poll state
  const updatedPoll = await fetchPollByPostIdAction(poll.post_id);
  revalidatePath('/');

  return {
    success: true,
    message: 'Vote recorded!',
    poll: updatedPoll || undefined,
  };
}

/**
 * Creates an interactive poll attached to a post.
 */
export async function createPollAction(params: {
  postId: string;
  question: string;
  options: string[];
  durationHours?: number;
}): Promise<{ success: boolean; pollId?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Authentication required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  const validOptions = params.options.map((o) => o.trim()).filter(Boolean);
  if (validOptions.length < 2) {
    return { success: false, error: 'A poll must have at least 2 options.' };
  }

  const durationHours = params.durationHours || 24;
  const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();

  // 1. Create Poll
  const { data: poll, error: pollErr } = await supabase
    .from('polls')
    .insert({
      post_id: params.postId,
      question: params.question.trim(),
      expires_at: expiresAt,
      allow_multiple: false,
    })
    .select('id')
    .single();

  if (pollErr || !poll) {
    return { success: false, error: pollErr?.message || 'Failed to create poll.' };
  }

  // 2. Insert Poll Options
  const optionRows = validOptions.map((opt, index) => ({
    poll_id: poll.id,
    option_text: opt,
    position: index,
  }));

  const { error: optErr } = await supabase.from('poll_options').insert(optionRows);
  if (optErr) {
    return { success: false, error: optErr.message || 'Failed to save poll options.' };
  }

  return { success: true, pollId: poll.id };
}
