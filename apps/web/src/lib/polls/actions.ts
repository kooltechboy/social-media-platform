'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import type { CreatePollParams, PollData, PollOptionData, PollVoteResult } from './types';

/**
 * Fetches structured poll data for a specific post.
 */
export async function fetchPollByPostIdAction(postId: string): Promise<PollData | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const user = await getCurrentUser();

  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select('id, post_id, question, expires_at, allow_multiple, total_votes, created_at, is_quiz, quiz_explanation, correct_option_id')
    .eq('post_id', postId)
    .maybeSingle();

  if (pollError || !poll) return null;

  const { data: options } = await supabase
    .from('poll_options')
    .select('id, poll_id, option_text, position, votes_count, image_url')
    .eq('poll_id', poll.id)
    .order('position', { ascending: true });

  let userVotedOptionId: string | null = null;
  let userIsCorrect: boolean | null = null;

  if (user) {
    const { data: vote } = await supabase
      .from('poll_votes')
      .select('option_id, is_correct')
      .eq('poll_id', poll.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (vote) {
      userVotedOptionId = vote.option_id;
      userIsCorrect = vote.is_correct ?? null;
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
      imageUrl: opt.image_url || undefined,
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
    isQuiz: Boolean(poll.is_quiz),
    quizExplanation: poll.quiz_explanation ?? null,
    correctOptionId: poll.correct_option_id ?? null,
    userIsCorrect,
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
    .select('id, post_id, expires_at, is_quiz, quiz_explanation, correct_option_id')
    .eq('id', pollId)
    .single();

  if (pollError || !poll) {
    return { success: false, error: 'Poll not found.' };
  }

  if (new Date(poll.expires_at).getTime() <= Date.now()) {
    return { success: false, error: 'This poll has already ended.' };
  }

  // 2. Insert vote record
  const { data: vote, error: voteError } = await supabase
    .from('poll_votes')
    .insert({
      poll_id: pollId,
      option_id: optionId,
      user_id: user.id,
    })
    .select('id, option_id, is_correct')
    .single();

  if (voteError) {
    if (voteError.code === '23505') {
      return { success: false, error: 'You have already voted in this poll.' };
    }
    return { success: false, error: voteError.message || 'Failed to record vote.' };
  }

  // 3. Re-fetch updated poll state
  const updatedPoll = await fetchPollByPostIdAction(poll.post_id);

  if (updatedPoll && vote && vote.is_correct !== undefined && updatedPoll.userIsCorrect === null) {
    updatedPoll.userIsCorrect = vote.is_correct;
  }

  try {
    revalidatePath('/');
  } catch {
    // Safe fallback outside Next.js request context (e.g., tests or background jobs)
  }

  return {
    success: true,
    message: 'Vote recorded!',
    poll: updatedPoll || undefined,
  };
}

/**
 * Creates an interactive poll or quiz attached to a post.
 */
export async function createPollAction(
  params: CreatePollParams
): Promise<{ success: boolean; pollId?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Authentication required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  // Normalize options
  const normalizedOptions = (params.options || [])
    .map((opt) => {
      if (typeof opt === 'string') {
        return { text: opt.trim(), imageUrl: null as string | null };
      }
      return {
        text: (opt.text || '').trim(),
        imageUrl: opt.imageUrl ? opt.imageUrl.trim() : null,
      };
    })
    .filter((opt) => opt.text.length > 0);

  if (normalizedOptions.length < 2) {
    return { success: false, error: 'A poll must have at least 2 options.' };
  }

  if (params.isQuiz && params.correctOptionIndex !== undefined) {
    if (params.correctOptionIndex < 0 || params.correctOptionIndex >= normalizedOptions.length) {
      return { success: false, error: 'Invalid correct option index for quiz.' };
    }
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
      allow_multiple: params.allowMultiple ?? false,
      is_quiz: Boolean(params.isQuiz),
      quiz_explanation: params.quizExplanation?.trim() || null,
    })
    .select('id')
    .single();

  if (pollErr || !poll) {
    return { success: false, error: pollErr?.message || 'Failed to create poll.' };
  }

  // 2. Insert Poll Options
  const optionRows = normalizedOptions.map((opt, index) => ({
    poll_id: poll.id,
    option_text: opt.text,
    position: index,
    image_url: opt.imageUrl,
  }));

  const { data: createdOptions, error: optErr } = await supabase
    .from('poll_options')
    .insert(optionRows)
    .select('id, position');

  if (optErr) {
    return { success: false, error: optErr.message || 'Failed to save poll options.' };
  }

  // 3. Link correct_option_id if quiz
  if (params.isQuiz && params.correctOptionIndex !== undefined && createdOptions) {
    const correctOpt = createdOptions.find((o) => o.position === params.correctOptionIndex) || createdOptions[params.correctOptionIndex];
    if (correctOpt) {
      const { error: updateErr } = await supabase
        .from('polls')
        .update({ correct_option_id: correctOpt.id })
        .eq('id', poll.id);

      if (updateErr) {
        return { success: false, error: updateErr.message || 'Failed to set correct option for quiz.' };
      }
    }
  }

  try {
    revalidatePath('/');
  } catch {
    // Safe fallback outside Next.js request context
  }

  return { success: true, pollId: poll.id };
}
