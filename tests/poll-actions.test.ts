import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PollData, PollOptionData } from '../apps/web/src/lib/polls/types';
import { createPollAction, fetchPollByPostIdAction, votePollAction } from '../apps/web/src/lib/polls/actions';

const { getCurrentUser, createSupabaseServerClient } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('../apps/web/src/lib/supabase/server', () => ({
  getCurrentUser,
  createSupabaseServerClient,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Poll & Quiz Server Actions and Types', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Type Definitions', () => {
    it('supports quiz metadata and user correctness tracking on PollData and imageUrl on PollOptionData', () => {
      const sampleOption: PollOptionData = {
        id: 'opt-steelpan',
        pollId: 'poll-1',
        optionText: 'Steelpan',
        position: 0,
        votesCount: 8,
        percentage: 80,
        imageUrl: 'https://cdn.tukubi.com/steelpan.jpg',
      };

      const samplePoll: PollData = {
        id: 'poll-1',
        postId: 'post-1',
        question: 'What is the national instrument of Trinidad and Tobago?',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        allowMultiple: false,
        totalVotes: 10,
        createdAt: new Date().toISOString(),
        isQuiz: true,
        quizExplanation: 'The steelpan was invented in Trinidad in the early 20th century.',
        correctOptionId: 'opt-steelpan',
        userIsCorrect: true,
        options: [
          sampleOption,
          {
            id: 'opt-maracas',
            pollId: 'poll-1',
            optionText: 'Maracas',
            position: 1,
            votesCount: 2,
            percentage: 20,
          },
        ],
      };

      expect(samplePoll.isQuiz).toBe(true);
      expect(samplePoll.quizExplanation).toContain('steelpan was invented');
      expect(samplePoll.correctOptionId).toBe('opt-steelpan');
      expect(samplePoll.userIsCorrect).toBe(true);
      expect(samplePoll.options[0].imageUrl).toBe('https://cdn.tukubi.com/steelpan.jpg');
    });
  });

  describe('createPollAction', () => {
    it('creates quiz polls with image options and sets correct_option_id', async () => {
      getCurrentUser.mockResolvedValue({ id: 'user-author' });

      let insertedPoll: Record<string, unknown> | null = null;
      let insertedOptions: Record<string, unknown>[] | null = null;
      let updatedPoll: Record<string, unknown> | null = null;

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'polls') {
            return {
              insert: vi.fn((payload: Record<string, unknown>) => {
                insertedPoll = payload;
                return {
                  select: vi.fn(() => ({
                    single: vi.fn(async () => ({ data: { id: 'poll-xyz' }, error: null })),
                  })),
                };
              }),
              update: vi.fn((payload: Record<string, unknown>) => {
                updatedPoll = payload;
                return {
                  eq: vi.fn(async () => ({ data: null, error: null })),
                };
              }),
            };
          }
          if (table === 'poll_options') {
            return {
              insert: vi.fn((payload: Record<string, unknown>[]) => {
                insertedOptions = payload;
                return {
                  select: vi.fn(async () => ({
                    data: [
                      { id: 'opt-0', position: 0 },
                      { id: 'opt-1', position: 1 },
                    ],
                    error: null,
                  })),
                };
              }),
            };
          }
          return {};
        }),
      };

      createSupabaseServerClient.mockResolvedValue(mockSupabase as any);

      const result = await createPollAction({
        postId: 'post-100',
        question: 'What is the capital of Barbados?',
        options: [
          { text: 'Bridgetown', imageUrl: 'https://cdn.tukubi.com/bridgetown.jpg' },
          { text: 'Kingston' },
        ],
        isQuiz: true,
        correctOptionIndex: 0,
        quizExplanation: 'Bridgetown is the capital and largest city of Barbados.',
        durationHours: 48,
        allowMultiple: false,
      });

      expect(result.success).toBe(true);
      expect(result.pollId).toBe('poll-xyz');

      // Verify poll insertion included quiz mode and explanation
      expect(insertedPoll).toBeDefined();
      expect(insertedPoll?.post_id).toBe('post-100');
      expect(insertedPoll?.is_quiz).toBe(true);
      expect(insertedPoll?.quiz_explanation).toBe('Bridgetown is the capital and largest city of Barbados.');

      // Verify options insertion included image_url
      expect(insertedOptions).toBeDefined();
      expect(insertedOptions).toHaveLength(2);
      expect(insertedOptions?.[0].image_url).toBe('https://cdn.tukubi.com/bridgetown.jpg');
      expect(insertedOptions?.[0].option_text).toBe('Bridgetown');
      expect(insertedOptions?.[1].image_url).toBeNull();

      // Verify correct_option_id was linked to created option id
      expect(updatedPoll).toBeDefined();
      expect(updatedPoll?.correct_option_id).toBe('opt-0');
    });
  });

  describe('votePollAction', () => {
    it('records vote and returns updated poll with quiz evaluation and correctness', async () => {
      getCurrentUser.mockResolvedValue({ id: 'voter-1' });

      let voteInserted: Record<string, unknown> | null = null;

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'polls') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(async () => ({
                    data: {
                      id: 'poll-123',
                      post_id: 'post-123',
                      expires_at: new Date(Date.now() + 100000).toISOString(),
                      is_quiz: true,
                      quiz_explanation: 'Correct answer explanation.',
                      correct_option_id: 'opt-correct',
                    },
                    error: null,
                  })),
                  maybeSingle: vi.fn(async () => ({
                    data: {
                      id: 'poll-123',
                      post_id: 'post-123',
                      question: 'Quiz Question',
                      expires_at: new Date(Date.now() + 100000).toISOString(),
                      allow_multiple: false,
                      total_votes: 1,
                      created_at: new Date().toISOString(),
                      is_quiz: true,
                      quiz_explanation: 'Correct answer explanation.',
                      correct_option_id: 'opt-correct',
                    },
                    error: null,
                  })),
                })),
              })),
            };
          }
          if (table === 'poll_options') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn(async () => ({
                    data: [
                      { id: 'opt-correct', poll_id: 'poll-123', option_text: 'A', position: 0, votes_count: 1, image_url: null },
                      { id: 'opt-wrong', poll_id: 'poll-123', option_text: 'B', position: 1, votes_count: 0, image_url: null },
                    ],
                    error: null,
                  })),
                })),
              })),
            };
          }
          if (table === 'poll_votes') {
            return {
              insert: vi.fn((payload: Record<string, unknown>) => {
                voteInserted = payload;
                const result = { id: 'vote-1', option_id: 'opt-correct', is_correct: true };
                return {
                  select: vi.fn(() => ({
                    single: vi.fn(async () => ({ data: result, error: null })),
                    maybeSingle: vi.fn(async () => ({ data: result, error: null })),
                  })),
                };
              }),
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    maybeSingle: vi.fn(async () => ({
                      data: { option_id: 'opt-correct', is_correct: true },
                      error: null,
                    })),
                  })),
                })),
              })),
            };
          }
          return {};
        }),
      };

      createSupabaseServerClient.mockResolvedValue(mockSupabase as any);

      const result = await votePollAction('poll-123', 'opt-correct');

      expect(result.success).toBe(true);
      expect(voteInserted).toBeDefined();
      expect(voteInserted?.poll_id).toBe('poll-123');
      expect(voteInserted?.option_id).toBe('opt-correct');

      expect(result.poll).toBeDefined();
      expect(result.poll?.isQuiz).toBe(true);
      expect(result.poll?.quizExplanation).toBe('Correct answer explanation.');
      expect(result.poll?.correctOptionId).toBe('opt-correct');
      expect(result.poll?.userIsCorrect).toBe(true);
    });
  });

  describe('fetchPollByPostIdAction', () => {
    it('fetches poll data with quiz fields and userIsCorrect status', async () => {
      getCurrentUser.mockResolvedValue({ id: 'voter-1' });

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'polls') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({
                    data: {
                      id: 'poll-456',
                      post_id: 'post-456',
                      question: 'Capital of Saint Lucia?',
                      expires_at: new Date(Date.now() + 50000).toISOString(),
                      allow_multiple: false,
                      total_votes: 10,
                      created_at: new Date().toISOString(),
                      is_quiz: true,
                      quiz_explanation: 'Castries is the capital of Saint Lucia.',
                      correct_option_id: 'opt-castries',
                    },
                    error: null,
                  })),
                })),
              })),
            };
          }
          if (table === 'poll_options') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn(async () => ({
                    data: [
                      { id: 'opt-castries', poll_id: 'poll-456', option_text: 'Castries', position: 0, votes_count: 7, image_url: 'https://cdn.tukubi.com/castries.jpg' },
                      { id: 'opt-soufriere', poll_id: 'poll-456', option_text: 'Soufrière', position: 1, votes_count: 3, image_url: null },
                    ],
                    error: null,
                  })),
                })),
              })),
            };
          }
          if (table === 'poll_votes') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    maybeSingle: vi.fn(async () => ({
                      data: { option_id: 'opt-castries', is_correct: true },
                      error: null,
                    })),
                  })),
                })),
              })),
            };
          }
          return {};
        }),
      };

      createSupabaseServerClient.mockResolvedValue(mockSupabase as any);

      const poll = await fetchPollByPostIdAction('post-456');

      expect(poll).not.toBeNull();
      expect(poll?.isQuiz).toBe(true);
      expect(poll?.quizExplanation).toBe('Castries is the capital of Saint Lucia.');
      expect(poll?.correctOptionId).toBe('opt-castries');
      expect(poll?.userIsCorrect).toBe(true);
      expect(poll?.options[0].imageUrl).toBe('https://cdn.tukubi.com/castries.jpg');
    });
  });
});
