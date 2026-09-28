import { describe, it, expect, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ReactionPicker, {
  ReactionType,
  VALID_REACTION_TYPES,
  REACTION_EMOJI_MAP,
} from '../apps/web/src/components/reactions/reaction-picker';
import ReactionSummaryBar from '../apps/web/src/components/reactions/reaction-summary-bar';

describe('Task 7: Multi-Type Reaction Bar Integration with Caribbean Badges', () => {
  const pickerPath = path.join(
    process.cwd(),
    'apps/web/src/components/reactions/reaction-picker.tsx'
  );
  const summaryPath = path.join(
    process.cwd(),
    'apps/web/src/components/reactions/reaction-summary-bar.tsx'
  );

  describe('1. Extended Caribbean Reaction Types and Emoji Mapping', () => {
    it('supports all 10 valid reaction types including palm and sound', () => {
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

      expect(VALID_REACTION_TYPES).toHaveLength(10);
      for (const t of expectedTypes) {
        expect(VALID_REACTION_TYPES).toContain(t);
      }
    });

    it('maps palm to Island Vibe with palm tree emoji and emerald styling', () => {
      const palmInfo = REACTION_EMOJI_MAP['palm'];
      expect(palmInfo).toBeDefined();
      expect(palmInfo.emoji).toBe('🌴');
      expect(palmInfo.label).toMatch(/Island Vibe/i);
      expect(palmInfo.color).toMatch(/emerald/i);
    });

    it('maps sound to Riddim with musical note emoji and violet styling', () => {
      const soundInfo = REACTION_EMOJI_MAP['sound'];
      expect(soundInfo).toBeDefined();
      expect(soundInfo.emoji).toBe('🎵');
      expect(soundInfo.label).toMatch(/Riddim|Rhythm/i);
      expect(soundInfo.color).toMatch(/violet/i);
    });

    it('maps all 10 reactions with valid emoji, label, and color tokens', () => {
      for (const type of VALID_REACTION_TYPES) {
        const item = REACTION_EMOJI_MAP[type];
        expect(item).toBeDefined();
        expect(item.emoji.length).toBeGreaterThan(0);
        expect(item.label.length).toBeGreaterThan(0);
        expect(item.color.length).toBeGreaterThan(0);
      }
    });
  });

  describe('2. ReactionPicker Component Architecture & Interaction', () => {
    it('is a defined functional component', () => {
      expect(ReactionPicker).toBeDefined();
      expect(typeof ReactionPicker).toBe('function');
    });

    it('renders default like state when no reaction selected', () => {
      const vdom = ReactionPicker({
        onSelect: vi.fn(),
      });
      expect(vdom).not.toBeNull();
      const serialized = JSON.stringify(vdom);
      expect(serialized).toContain('🤍');
      expect(serialized).toContain('Like');
    });

    it('renders chosen Caribbean reaction badge and label when selected', () => {
      const vdom = ReactionPicker({
        currentReaction: 'palm',
        onSelect: vi.fn(),
      });
      const serialized = JSON.stringify(vdom);
      expect(serialized).toContain('🌴');
      expect(serialized).toContain('Island Vibe');
    });

    it('implements WCAG touch target size of 44x44px minimum for mobile', () => {
      const source = fs.readFileSync(pickerPath, 'utf8');
      expect(source).toMatch(/min-h-\[44px\]/);
      expect(source).toMatch(/min-w-\[44px\]/);
    });

    it('contains accessibility attributes for popover options and tooltips', () => {
      const source = fs.readFileSync(pickerPath, 'utf8');
      expect(source).toContain('role="listbox"');
      expect(source).toContain('role="option"');
      expect(source).toContain('aria-selected');
      expect(source).toContain('title=');
      expect(source).toContain('aria-label=');
    });

    it('supports hover and long-press event handlers for fluid reveal', () => {
      const source = fs.readFileSync(pickerPath, 'utf8');
      expect(source).toContain('onMouseEnter');
      expect(source).toContain('onMouseLeave');
      expect(source).toContain('onTouchStart');
      expect(source).toContain('onTouchEnd');
    });
  });

  describe('3. ReactionSummaryBar Component & Grouped Breakdown Popover', () => {
    const mockCounts: Record<ReactionType, number> = {
      like: 15,
      love: 4,
      fire: 25,
      celebrate: 2,
      laugh: 0,
      wow: 1,
      sad: 0,
      angry: 0,
      palm: 42,
      sound: 18,
    };

    it('is a defined functional component', () => {
      expect(ReactionSummaryBar).toBeDefined();
      expect(typeof ReactionSummaryBar).toBe('function');
    });

    it('returns null when total is 0', () => {
      const emptyCounts = Object.fromEntries(
        VALID_REACTION_TYPES.map(t => [t, 0])
      ) as Record<ReactionType, number>;
      const vdom = ReactionSummaryBar({
        counts: emptyCounts,
        total: 0,
      });
      expect(vdom).toBeNull();
    });

    it('displays top reactions and total count formatted', () => {
      const vdom = ReactionSummaryBar({
        counts: mockCounts,
        total: 107,
      });
      expect(vdom).not.toBeNull();
      const serialized = JSON.stringify(vdom);
      // Top 3 should be palm (42), fire (25), sound (18)
      expect(serialized).toContain('🌴');
      expect(serialized).toContain('🔥');
      expect(serialized).toContain('🎵');
      expect(serialized).toContain('107');
    });

    it('implements grouped popover showing breakdown with toggle on click', () => {
      const source = fs.readFileSync(summaryPath, 'utf8');
      // Should have state for toggling popover or interactive click
      expect(source).toMatch(/useState/);
      expect(source).toMatch(/onClick/);
      // Popover should list counts and emojis/labels
      expect(source).toMatch(/REACTION_EMOJI_MAP/);
      expect(source).toMatch(/role="dialog"|role="tooltip"|role="region"/);
    });
  });
});
