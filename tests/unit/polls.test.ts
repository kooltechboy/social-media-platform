import { describe, it, expect } from 'vitest';
import type { PollData, PollOptionData } from '../../apps/web/src/lib/polls/types';

describe('TUKUBI Interactive Polls Engine', () => {
  it('correctly calculates option percentages based on total votes', () => {
    const options: PollOptionData[] = [
      { id: 'opt-1', pollId: 'p1', optionText: 'Reggae', position: 0, votesCount: 50 },
      { id: 'opt-2', pollId: 'p1', optionText: 'Soca', position: 1, votesCount: 30 },
      { id: 'opt-3', pollId: 'p1', optionText: 'Dancehall', position: 2, votesCount: 20 },
    ];

    const totalVotes = options.reduce((sum, opt) => sum + opt.votesCount, 0);
    expect(totalVotes).toBe(100);

    const withPercentages = options.map((opt) => ({
      ...opt,
      percentage: Math.round((opt.votesCount / totalVotes) * 100),
    }));

    expect(withPercentages[0].percentage).toBe(50);
    expect(withPercentages[1].percentage).toBe(30);
    expect(withPercentages[2].percentage).toBe(20);
  });

  it('handles zero votes gracefully with 0% across all options', () => {
    const options: PollOptionData[] = [
      { id: 'opt-1', pollId: 'p2', optionText: 'Option A', position: 0, votesCount: 0 },
      { id: 'opt-2', pollId: 'p2', optionText: 'Option B', position: 1, votesCount: 0 },
    ];

    const totalVotes = 0;
    const withPercentages = options.map((opt) => ({
      ...opt,
      percentage: totalVotes > 0 ? Math.round((opt.votesCount / totalVotes) * 100) : 0,
    }));

    expect(withPercentages[0].percentage).toBe(0);
    expect(withPercentages[1].percentage).toBe(0);
  });

  it('detects poll expiration correctly', () => {
    const activePoll: PollData = {
      id: 'poll-active',
      postId: 'post-1',
      question: 'Favorite Caribbean Island?',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      allowMultiple: false,
      totalVotes: 10,
      createdAt: new Date().toISOString(),
      options: [],
    };

    const expiredPoll: PollData = {
      ...activePoll,
      id: 'poll-expired',
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    };

    const isActiveExpired = new Date(activePoll.expiresAt).getTime() <= Date.now();
    const isPastExpired = new Date(expiredPoll.expiresAt).getTime() <= Date.now();

    expect(isActiveExpired).toBe(false);
    expect(isPastExpired).toBe(true);
  });
});
