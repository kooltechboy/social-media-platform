import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import InteractivePollWidget, {
  InteractivePollWidgetProps,
} from '../apps/web/src/components/polls/interactive-poll-widget';
import type { PollData, PollOptionData } from '../apps/web/src/lib/polls/types';

describe('Task 6: Interactive Poll & Quiz Widget with Instant Feedback and Explanations', () => {
  const componentPath = path.join(
    process.cwd(),
    'apps/web/src/components/polls/interactive-poll-widget.tsx'
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockQuizPoll: PollData = {
    id: 'poll-carib-101',
    postId: 'post-999',
    question: 'Which island nation is famous for the Pitons volcanic spires?',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    allowMultiple: false,
    totalVotes: 42,
    createdAt: new Date().toISOString(),
    isQuiz: true,
    quizExplanation: 'The Gros Piton and Petit Piton are UNESCO World Heritage twin peaks in Saint Lucia.',
    correctOptionId: 'opt-st-lucia',
    userVotedOptionId: 'opt-st-lucia',
    userIsCorrect: true,
    options: [
      {
        id: 'opt-st-lucia',
        pollId: 'poll-carib-101',
        optionText: 'Saint Lucia',
        position: 0,
        votesCount: 30,
        percentage: 71,
        imageUrl: 'https://cdn.tukubi.com/images/st-lucia.jpg',
      },
      {
        id: 'opt-barbados',
        pollId: 'poll-carib-101',
        optionText: 'Barbados',
        position: 1,
        votesCount: 8,
        percentage: 19,
        imageUrl: 'https://cdn.tukubi.com/images/barbados.jpg',
      },
      {
        id: 'opt-grenada',
        pollId: 'poll-carib-101',
        optionText: 'Grenada',
        position: 2,
        votesCount: 4,
        percentage: 10,
      },
    ],
  };

  describe('Component Architecture & WCAG 2.2 AA Accessibility Contract', () => {
    it('is a defined functional component with InteractivePollWidget export', () => {
      expect(InteractivePollWidget).toBeDefined();
      expect(typeof InteractivePollWidget).toBe('function');
    });

    it('enforces WCAG 2.2 AA accessibility roles and live announcement regions', () => {
      const source = fs.readFileSync(componentPath, 'utf8');
      expect(source).toContain('role="radiogroup"');
      expect(source).toContain('role="radio"');
      expect(source).toContain('aria-checked');
      expect(source).toContain('aria-live="polite"');
    });

    it('implements visual quiz indicators: emerald for correct, rose for incorrect, and correctness badges', () => {
      const source = fs.readFileSync(componentPath, 'utf8');
      // Emerald styling for correct quiz answers
      expect(source).toMatch(/emerald-500|text-emerald|border-emerald|ring-emerald/);
      // Rose styling for incorrect user answers
      expect(source).toMatch(/rose-500|text-rose|border-rose|ring-rose/);
      // User correctness badge text
      expect(source).toContain('Correct!');
      expect(source).toContain('Incorrect');
    });

    it('renders option images when imageUrl is provided', () => {
      const source = fs.readFileSync(componentPath, 'utf8');
      expect(source).toContain('imageUrl');
      expect(source).toMatch(/<img/);
    });

    it('reveals quiz explanation card with animated entrance', () => {
      const source = fs.readFileSync(componentPath, 'utf8');
      expect(source).toContain('quizExplanation');
      expect(source).toMatch(/animate-|transition-|duration-/);
    });
  });

  describe('VDOM & Structure Contract', () => {
    it('renders a quiz badge when poll.isQuiz is true', () => {
      const vdom = InteractivePollWidget({
        initialPoll: mockQuizPoll,
        currentUserId: 'usr-1',
      });
      expect(vdom).not.toBeNull();
      const serialized = JSON.stringify(vdom);
      expect(serialized).toContain('Quiz');
    });

    it('renders option images when option.imageUrl is provided', () => {
      const vdom = InteractivePollWidget({
        initialPoll: mockQuizPoll,
        currentUserId: 'usr-1',
      });
      const serialized = JSON.stringify(vdom);
      expect(serialized).toContain('https://cdn.tukubi.com/images/st-lucia.jpg');
      expect(serialized).toContain('https://cdn.tukubi.com/images/barbados.jpg');
      expect(serialized).toContain('Saint Lucia');
    });

    it('reveals the explanation card when results are shown for a quiz', () => {
      const vdom = InteractivePollWidget({
        initialPoll: mockQuizPoll,
        currentUserId: 'usr-1',
      });
      const serialized = JSON.stringify(vdom);
      expect(serialized).toContain('The Gros Piton and Petit Piton are UNESCO World Heritage twin peaks in Saint Lucia.');
      expect(serialized).toContain('Correct!');
    });

    it('indicates incorrect selection badge when user voted incorrectly', () => {
      const incorrectPoll: PollData = {
        ...mockQuizPoll,
        userVotedOptionId: 'opt-barbados',
        userIsCorrect: false,
      };
      const vdom = InteractivePollWidget({
        initialPoll: incorrectPoll,
        currentUserId: 'usr-1',
      });
      const serialized = JSON.stringify(vdom);
      expect(serialized).toContain('Incorrect');
    });

    it('renders role="radiogroup" and role="radio" with aria-checked', () => {
      const vdom = InteractivePollWidget({
        initialPoll: mockQuizPoll,
        currentUserId: 'usr-1',
      });
      const serialized = JSON.stringify(vdom);
      expect(serialized).toContain('radiogroup');
      expect(serialized).toContain('radio');
      expect(serialized).toContain('aria-checked');
      expect(serialized).toContain('polite');
    });
  });
});
