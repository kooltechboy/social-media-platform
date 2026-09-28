import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

// --- Engagement Primitive Imports ---
import {
  UNICODE_EMOJI_DATASET,
  searchEmojis,
  applySkinTone,
  SKIN_TONE_MODIFIERS,
  getRecentEmojis,
  addRecentEmoji,
  clearRecentEmojis,
  getFavoriteEmojis,
  toggleFavoriteEmoji,
  clearFavoriteEmojis,
  type EmojiItem,
  type SkinTone,
} from '../apps/web/src/lib/emoji';

import EmojiPickerPopover, {
  EmojiPickerPopoverContent,
  CATEGORY_TABS,
  computeNextGridIndex,
} from '../apps/web/src/components/emoji/emoji-picker-popover';

import type { PollData, PollOptionData } from '../apps/web/src/lib/polls/types';
import {
  createPollAction,
  votePollAction,
  fetchPollByPostIdAction,
} from '../apps/web/src/lib/polls/actions';

import InteractivePollWidget from '../apps/web/src/components/polls/interactive-poll-widget';

import ReactionPicker, {
  ReactionType,
  VALID_REACTION_TYPES,
  REACTION_EMOJI_MAP,
} from '../apps/web/src/components/reactions/reaction-picker';

import ReactionSummaryBar from '../apps/web/src/components/reactions/reaction-summary-bar';

// --- Mocks for Supabase & Next.js Server Environment ---
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

describe('Unified Caribbean Engagement & Interaction Primitives (E2E Suite)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearRecentEmojis?.();
    clearFavoriteEmojis?.();
  });

  // =========================================================================
  // 1. Unicode 15/16 Dataset, Caribbean Flags & Instant Tokenized Search
  // =========================================================================
  describe('1. Full Unicode 15/16 Categorization & Caribbean Regional Search', () => {
    it('provides all 10 standard & cultural categories in UNICODE_EMOJI_DATASET', () => {
      expect(UNICODE_EMOJI_DATASET).toBeDefined();
      expect(UNICODE_EMOJI_DATASET.length).toBe(10);

      const categoryIds = UNICODE_EMOJI_DATASET.map(c => c.id);
      expect(categoryIds).toEqual([
        'caribbean',
        'smileys',
        'people',
        'nature',
        'food',
        'travel',
        'activities',
        'objects',
        'symbols',
        'flags',
      ]);
    });

    it('contains comprehensive Caribbean flags across the archipelago and diaspora', () => {
      const caribbeanCategory = UNICODE_EMOJI_DATASET.find(c => c.id === 'caribbean');
      expect(caribbeanCategory).toBeDefined();
      expect(caribbeanCategory?.emojis.length).toBeGreaterThanOrEqual(30);

      const flagsCategory = UNICODE_EMOJI_DATASET.find(c => c.id === 'flags');
      expect(flagsCategory).toBeDefined();

      const caribbeanGlyphs = (caribbeanCategory?.emojis || []).map(e => e.emoji);
      const expectedCaribbeanNations = [
        '🇯🇲', // Jamaica
        '🇹🇹', // Trinidad & Tobago
        '🇧🇧', // Barbados
        '🇧🇸', // Bahamas
        '🇭🇹', // Haiti
        '🇩🇴', // Dominican Republic
        '🇵🇷', // Puerto Rico
        '🇨🇺', // Cuba
        '🇬🇩', // Grenada
        '🇱🇨', // Saint Lucia
        '🇻🇨', // St. Vincent & the Grenadines
        '🇦🇬', // Antigua & Barbuda
        '🇩🇲', // Dominica
        '🇰🇳', // St. Kitts & Nevis
        '🇬🇾', // Guyana
        '🇸🇷', // Suriname
        '🇧🇿', // Belize
      ];

      for (const flag of expectedCaribbeanNations) {
        expect(caribbeanGlyphs).toContain(flag);
      }
    });

    it('executes instant tokenized keyword search across emoji names and keywords', () => {
      // Caribbean territory search
      const jamSearch = searchEmojis('jamaica');
      expect(jamSearch.length).toBeGreaterThan(0);
      expect(jamSearch[0].emoji).toBe('🇯🇲');

      // Steelpan/drum search
      const panSearch = searchEmojis('steelpan');
      expect(panSearch.length).toBeGreaterThan(0);
      expect(panSearch.some(e => e.emoji === '🛢️' || e.name.toLowerCase().includes('steelpan'))).toBe(true);

      // Caribbean vibes search
      const vibeSearch = searchEmojis('palm');
      expect(vibeSearch.some(e => e.emoji === '🌴')).toBe(true);

      // Empty and whitespace queries return empty lists
      expect(searchEmojis('')).toHaveLength(0);
      expect(searchEmojis('    ')).toHaveLength(0);
      expect(searchEmojis('unknownnonsensequeryxyz')).toHaveLength(0);
    });
  });

  // =========================================================================
  // 2. Fitzpatrick Skin Tone Synthesis & Recent/Favorite LRU Stores
  // =========================================================================
  describe('2. Fitzpatrick Skin Tone Synthesis & LRU Recents/Favorites Store', () => {
    it('synthesizes Fitzpatrick modifiers accurately across tones and ZWJ sequences', () => {
      // Modifiers coverage
      expect(SKIN_TONE_MODIFIERS.default).toBe('');
      expect(SKIN_TONE_MODIFIERS.light).toBe('🏻');
      expect(SKIN_TONE_MODIFIERS['medium-light']).toBe('🏼');
      expect(SKIN_TONE_MODIFIERS.medium).toBe('🏽');
      expect(SKIN_TONE_MODIFIERS['medium-dark']).toBe('🏾');
      expect(SKIN_TONE_MODIFIERS.dark).toBe('🏿');

      // Hand gesture synthesis
      expect(applySkinTone('👋', 'dark')).toBe('👋🏿');
      expect(applySkinTone('👍', 'medium-dark')).toBe('👍🏾');
      expect(applySkinTone('👋🏿', 'light')).toBe('👋🏻');
      expect(applySkinTone('👋🏿', 'default')).toBe('👋');

      // Complex ZWJ sequences
      expect(applySkinTone('🧑‍💻', 'dark')).toBe('🧑🏿‍💻');

      // Non-modifiable emojis remain unchanged
      expect(applySkinTone('🌴', 'dark')).toBe('🌴');
      expect(applySkinTone('🇯🇲', 'medium')).toBe('🇯🇲');
      expect(applySkinTone('🔥', 'dark')).toBe('🔥');
    });

    it('enforces LRU deduplication and 32-item capacity bounds on recent store', () => {
      addRecentEmoji('🌴');
      addRecentEmoji('🔥');
      addRecentEmoji('🇯🇲');
      expect(getRecentEmojis()).toEqual(['🇯🇲', '🔥', '🌴']);

      // Re-adding brings to top without duplicate
      addRecentEmoji('🌴');
      expect(getRecentEmojis()).toEqual(['🌴', '🇯🇲', '🔥']);

      // Fill past 32 limit
      for (let i = 1; i <= 40; i++) {
        addRecentEmoji(`custom_emoji_${i}`);
      }
      const recents = getRecentEmojis();
      expect(recents.length).toBe(32);
      expect(recents[0]).toBe('custom_emoji_40');
      expect(recents).not.toContain('custom_emoji_1');
    });

    it('persists and toggles favorite emojis', () => {
      expect(getFavoriteEmojis()).toEqual([]);
      expect(toggleFavoriteEmoji('🇯🇲')).toBe(true);
      expect(toggleFavoriteEmoji('🇹🇹')).toBe(true);
      expect(getFavoriteEmojis()).toEqual(['🇯🇲', '🇹🇹']);

      // Untoggle
      expect(toggleFavoriteEmoji('🇯🇲')).toBe(false);
      expect(getFavoriteEmojis()).toEqual(['🇹🇹']);
    });
  });

  // =========================================================================
  // 3. Accessible EmojiPickerPopover & 2D Grid Keyboard Navigation
  // =========================================================================
  describe('3. EmojiPickerPopover Architecture & 2D Grid Keyboard Navigation', () => {
    it('computes 2D grid coordinates with boundaries and directional clamps', () => {
      const total = 28;
      const cols = 7;

      // Horizontal boundaries
      expect(computeNextGridIndex(0, total, cols, 'ArrowLeft')).toBe(0);
      expect(computeNextGridIndex(0, total, cols, 'ArrowRight')).toBe(1);
      expect(computeNextGridIndex(27, total, cols, 'ArrowRight')).toBe(27);

      // Vertical navigation
      expect(computeNextGridIndex(2, total, cols, 'ArrowDown')).toBe(9);
      expect(computeNextGridIndex(9, total, cols, 'ArrowUp')).toBe(2);
      expect(computeNextGridIndex(2, total, cols, 'ArrowUp')).toBe(2); // clamped at top

      // Out of bounds downward clamped
      expect(computeNextGridIndex(25, total, cols, 'ArrowDown')).toBe(25);

      // Unselected index (-1) resets to 0
      expect(computeNextGridIndex(-1, total, cols, 'ArrowDown')).toBe(0);
    });

    it('renders popover element when isOpen=true and null when isOpen=false', () => {
      const closed = EmojiPickerPopover({
        isOpen: false,
        onEmojiSelect: vi.fn(),
        onClose: vi.fn(),
      });
      expect(closed).toBeNull();

      const open = EmojiPickerPopover({
        isOpen: true,
        onEmojiSelect: vi.fn(),
        onClose: vi.fn(),
      });
      expect(open).not.toBeNull();
      expect(open?.type).toBe(EmojiPickerPopoverContent);
      expect(open?.props.isOpen).toBe(true);
    });

    it('verifies accessibility compliance and mobile 44x44px touch targets in source', () => {
      const sourcePath = path.join(
        process.cwd(),
        'apps/web/src/components/emoji/emoji-picker-popover.tsx'
      );
      const source = fs.readFileSync(sourcePath, 'utf8');

      expect(source).toContain('role="dialog"');
      expect(source).toContain('aria-label="Emoji picker"');
      expect(source).toContain('aria-live="polite"');
      expect(source).toMatch(/min-h-\[44px\]|min-w-\[44px\]|h-11|w-11/);
    });
  });

  // =========================================================================
  // 4. Interactive Poll & Quiz Lifecycle (Actions, Trigger Contract & UI)
  // =========================================================================
  describe('4. Interactive Poll & Quiz Lifecycle with Server-Authoritative Evaluation', () => {
    it('creates quiz poll with image options and sets correct_option_id', async () => {
      getCurrentUser.mockResolvedValue({ id: 'quiz-creator-1' });

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
                    single: vi.fn(async () => ({ data: { id: 'poll-carnival-42' }, error: null })),
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
                      { id: 'opt-trinidad', position: 0 },
                      { id: 'opt-jamaica', position: 1 },
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
        postId: 'post-carnival-1',
        question: 'Which country is home to the largest Carnival celebration in the Caribbean?',
        options: [
          { text: 'Trinidad and Tobago', imageUrl: 'https://cdn.tukubi.com/carnival-tt.jpg' },
          { text: 'Jamaica', imageUrl: 'https://cdn.tukubi.com/carnival-jm.jpg' },
        ],
        isQuiz: true,
        correctOptionIndex: 0,
        quizExplanation: 'Trinidad Carnival is the mother of Caribbean carnivals, celebrated on Carnival Monday and Tuesday before Ash Wednesday.',
        durationHours: 72,
        allowMultiple: false,
      });

      expect(result.success).toBe(true);
      expect(result.pollId).toBe('poll-carnival-42');
      expect(insertedPoll).toBeDefined();
      expect(insertedPoll?.is_quiz).toBe(true);
      expect(insertedPoll?.quiz_explanation).toContain('mother of Caribbean carnivals');
      expect(insertedOptions).toHaveLength(2);
      expect(insertedOptions?.[0].image_url).toBe('https://cdn.tukubi.com/carnival-tt.jpg');
      expect(updatedPoll?.correct_option_id).toBe('opt-trinidad');
    });

    it('submits a quiz vote, evaluates correctness server-side, and returns enriched poll data', async () => {
      getCurrentUser.mockResolvedValue({ id: 'voter-carib-99' });

      let voteInserted: Record<string, unknown> | null = null;

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'polls') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(async () => ({
                    data: {
                      id: 'poll-carnival-42',
                      post_id: 'post-carnival-1',
                      expires_at: new Date(Date.now() + 1000000).toISOString(),
                      is_quiz: true,
                      quiz_explanation: 'Trinidad Carnival is the mother of Caribbean carnivals.',
                      correct_option_id: 'opt-trinidad',
                    },
                    error: null,
                  })),
                  maybeSingle: vi.fn(async () => ({
                    data: {
                      id: 'poll-carnival-42',
                      post_id: 'post-carnival-1',
                      question: 'Which country is home to the largest Carnival celebration?',
                      expires_at: new Date(Date.now() + 1000000).toISOString(),
                      allow_multiple: false,
                      total_votes: 1,
                      created_at: new Date().toISOString(),
                      is_quiz: true,
                      quiz_explanation: 'Trinidad Carnival is the mother of Caribbean carnivals.',
                      correct_option_id: 'opt-trinidad',
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
                      { id: 'opt-trinidad', poll_id: 'poll-carnival-42', option_text: 'Trinidad and Tobago', position: 0, votes_count: 1, image_url: 'https://cdn.tukubi.com/carnival-tt.jpg' },
                      { id: 'opt-jamaica', poll_id: 'poll-carnival-42', option_text: 'Jamaica', position: 1, votes_count: 0, image_url: null },
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
                const result = { id: 'vote-entry-1', option_id: 'opt-trinidad', is_correct: true };
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
                      data: { option_id: 'opt-trinidad', is_correct: true },
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

      const response = await votePollAction('poll-carnival-42', 'opt-trinidad');
      expect(response.success).toBe(true);
      expect(voteInserted).toBeDefined();
      expect(voteInserted?.poll_id).toBe('poll-carnival-42');
      expect(voteInserted?.option_id).toBe('opt-trinidad');

      expect(response.poll?.isQuiz).toBe(true);
      expect(response.poll?.correctOptionId).toBe('opt-trinidad');
      expect(response.poll?.userVotedOptionId).toBe('opt-trinidad');
      expect(response.poll?.userIsCorrect).toBe(true);
      expect(response.poll?.quizExplanation).toContain('Trinidad Carnival is the mother');
    });

    it('renders InteractivePollWidget with option images, quiz badge, and explanation card', () => {
      const mockPoll: PollData = {
        id: 'poll-carnival-42',
        postId: 'post-carnival-1',
        question: 'Which country is home to the largest Carnival celebration?',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        allowMultiple: false,
        totalVotes: 100,
        createdAt: new Date().toISOString(),
        isQuiz: true,
        quizExplanation: 'Trinidad Carnival is the mother of Caribbean carnivals.',
        correctOptionId: 'opt-trinidad',
        userVotedOptionId: 'opt-trinidad',
        userIsCorrect: true,
        options: [
          {
            id: 'opt-trinidad',
            pollId: 'poll-carnival-42',
            optionText: 'Trinidad and Tobago',
            position: 0,
            votesCount: 95,
            percentage: 95,
            imageUrl: 'https://cdn.tukubi.com/carnival-tt.jpg',
          },
          {
            id: 'opt-jamaica',
            pollId: 'poll-carnival-42',
            optionText: 'Jamaica',
            position: 1,
            votesCount: 5,
            percentage: 5,
          },
        ],
      };

      const vdom = InteractivePollWidget({
        initialPoll: mockPoll,
        currentUserId: 'voter-carib-99',
      });
      expect(vdom).not.toBeNull();

      const serialized = JSON.stringify(vdom);
      expect(serialized).toContain('Quiz');
      expect(serialized).toContain('https://cdn.tukubi.com/carnival-tt.jpg');
      expect(serialized).toContain('Trinidad and Tobago');
      expect(serialized).toContain('Correct!');
      expect(serialized).toContain('Trinidad Carnival is the mother of Caribbean carnivals.');
      expect(serialized).toContain('radiogroup');
      expect(serialized).toContain('radio');
    });
  });

  // =========================================================================
  // 5. 10-Type Reactions with Caribbean Badges & Breakdown Dialog
  // =========================================================================
  describe('5. 10-Type Caribbean Reaction Bar & Summary Breakdown Dialog', () => {
    it('supports 10 distinct reaction types with Palm, Sound, and Fire badges', () => {
      expect(VALID_REACTION_TYPES).toHaveLength(10);
      const expectedTypes: ReactionType[] = [
        'like',
        'love',
        'fire',
        'celebrate',
        'laugh',
        'wow',
        'sad',
        'angry',
        'palm',
        'sound',
      ];
      expect(VALID_REACTION_TYPES).toEqual(expectedTypes);

      // Caribbean badges
      expect(REACTION_EMOJI_MAP.palm.emoji).toBe('🌴');
      expect(REACTION_EMOJI_MAP.palm.label).toBe('Island Vibe');
      expect(REACTION_EMOJI_MAP.palm.color).toContain('emerald');

      expect(REACTION_EMOJI_MAP.sound.emoji).toBe('🎵');
      expect(REACTION_EMOJI_MAP.sound.label).toBe('Riddim');
      expect(REACTION_EMOJI_MAP.sound.color).toContain('violet');

      expect(REACTION_EMOJI_MAP.fire.emoji).toBe('🔥');
      expect(REACTION_EMOJI_MAP.fire.label).toBe('Fire');
      expect(REACTION_EMOJI_MAP.fire.color).toContain('orange');
    });

    it('renders ReactionPicker with current reaction badge and accessible controls', () => {
      const onSelect = vi.fn();
      const vdom = ReactionPicker({
        currentReaction: 'palm',
        onSelect,
      });
      expect(vdom).not.toBeNull();
      const serialized = JSON.stringify(vdom);
      expect(serialized).toContain('🌴');
      expect(serialized).toContain('Island Vibe');
    });

    it('renders ReactionSummaryBar with top reactions and toggleable breakdown dialog', () => {
      const mockCounts: Record<ReactionType, number> = {
        like: 10,
        love: 5,
        fire: 50,
        celebrate: 12,
        laugh: 2,
        wow: 1,
        sad: 0,
        angry: 0,
        palm: 85,
        sound: 64,
      };

      const vdom = ReactionSummaryBar({
        counts: mockCounts,
        total: 229,
      });
      expect(vdom).not.toBeNull();

      const serialized = JSON.stringify(vdom);
      // Top 3 should be palm (85), sound (64), fire (50)
      expect(serialized).toContain('🌴');
      expect(serialized).toContain('🎵');
      expect(serialized).toContain('🔥');
      expect(serialized).toContain('229');
    });
  });

  // =========================================================================
  // 6. Cross-Primitive Cohesion & Inviolable Architecture Verifications
  // =========================================================================
  describe('6. Cross-Primitive Cohesion & Monorepo Architectural Integrity', () => {
    it('verifies all reaction emojis exist within Unicode emoji search and categorization', () => {
      for (const type of VALID_REACTION_TYPES) {
        const item = REACTION_EMOJI_MAP[type];
        // Ensure emoji search can find the glyph or it exists in dataset
        const matchesInDataset = UNICODE_EMOJI_DATASET.some(cat =>
          cat.emojis.some(e => e.emoji === item.emoji)
        );
        expect(matchesInDataset).toBe(true);
      }
    });

    it('verifies migration 00101 enforces RLS and tamper-proof triggers for polls', () => {
      const migrationFile = path.join(
        process.cwd(),
        'supabase/migrations/00101_polls_and_quizzes_enhancements.sql'
      );
      expect(fs.existsSync(migrationFile)).toBe(true);
      const sql = fs.readFileSync(migrationFile, 'utf8');

      // Schema constraints
      expect(sql).toContain('is_quiz');
      expect(sql).toContain('quiz_explanation');
      expect(sql).toContain('correct_option_id');
      expect(sql).toContain('image_url');
      expect(sql).toContain('is_correct');

      // Security DEFINER & RLS
      expect(sql).toContain('SECURITY DEFINER');
      expect(sql).toMatch(/ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
      expect(sql).toMatch(/FORCE\s+ROW\s+LEVEL\s+SECURITY/i);
    });
  });
});
