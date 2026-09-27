import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import EmojiPickerPopover, {
  EmojiPickerPopoverProps,
  CATEGORY_TABS,
  computeNextGridIndex,
} from '../apps/web/src/components/emoji/emoji-picker-popover';

describe('Task 3: Accessible 2D Keyboard-Navigable EmojiPickerPopover', () => {
  const componentPath = path.join(
    process.cwd(),
    'apps/web/src/components/emoji/emoji-picker-popover.tsx'
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Architecture & Contract', () => {
    it('is a defined functional component with category definitions and grid navigation helper', () => {
      expect(EmojiPickerPopover).toBeDefined();
      expect(typeof EmojiPickerPopover).toBe('function');
      expect(CATEGORY_TABS).toBeDefined();
      expect(Array.isArray(CATEGORY_TABS)).toBe(true);
      expect(typeof computeNextGridIndex).toBe('function');
    });

    it('integrates with the headless emoji library in apps/web/src/lib/emoji', () => {
      const source = fs.readFileSync(componentPath, 'utf8');
      expect(source).toContain("from '@/lib/emoji'");
      expect(source).toContain('UNICODE_EMOJI_DATASET');
      expect(source).toContain('applySkinTone');
      expect(source).toContain('searchEmojis');
      expect(source).toContain('getRecentEmojis');
      expect(source).toContain('addRecentEmoji');
      expect(source).toContain('getFavoriteEmojis');
      expect(source).toContain('toggleFavoriteEmoji');
    });

    it('returns null when isOpen is explicitly false without throwing', () => {
      const vdom = EmojiPickerPopover({
        isOpen: false,
        onEmojiSelect: vi.fn(),
        onClose: vi.fn(),
      });
      expect(vdom).toBeNull();
    });

    it('returns a React dialog element when isOpen is true', () => {
      const vdom = EmojiPickerPopover({
        isOpen: true,
        onEmojiSelect: vi.fn(),
        onClose: vi.fn(),
      });
      expect(vdom).not.toBeNull();
    });
  });

  describe('2D Grid Navigation Mathematical Logic', () => {
    const totalItems = 20;
    const columns = 7;

    it('handles left and right arrow navigation with boundaries', () => {
      expect(computeNextGridIndex(0, totalItems, columns, 'ArrowLeft')).toBe(0);
      expect(computeNextGridIndex(3, totalItems, columns, 'ArrowLeft')).toBe(2);
      expect(computeNextGridIndex(3, totalItems, columns, 'ArrowRight')).toBe(4);
      expect(computeNextGridIndex(19, totalItems, columns, 'ArrowRight')).toBe(19);
    });

    it('handles up and down arrow navigation across rows', () => {
      // 0 + 7 = 7
      expect(computeNextGridIndex(0, totalItems, columns, 'ArrowDown')).toBe(7);
      // 7 + 7 = 14
      expect(computeNextGridIndex(7, totalItems, columns, 'ArrowDown')).toBe(14);
      // Down clamp when out of bounds: 14 + 7 = 21 >= 20 -> stay at 14
      expect(computeNextGridIndex(14, totalItems, columns, 'ArrowDown')).toBe(14);
      // Up movement: 14 - 7 = 7
      expect(computeNextGridIndex(14, totalItems, columns, 'ArrowUp')).toBe(7);
      // Up clamp when top row: 3 - 7 < 0 -> stay at 3
      expect(computeNextGridIndex(3, totalItems, columns, 'ArrowUp')).toBe(3);
    });

    it('returns 0 when current index is unselected (-1)', () => {
      expect(computeNextGridIndex(-1, totalItems, columns, 'ArrowDown')).toBe(0);
      expect(computeNextGridIndex(-1, totalItems, columns, 'ArrowRight')).toBe(0);
    });

    it('returns -1 when total items is zero', () => {
      expect(computeNextGridIndex(0, 0, columns, 'ArrowDown')).toBe(-1);
    });
  });

  describe('Accessibility & 2D Keyboard Navigation Contract', () => {
    it('defines accessible ARIA attributes and live announcement region', () => {
      const source = fs.readFileSync(componentPath, 'utf8');
      expect(source).toContain('role="dialog"');
      expect(source).toContain('aria-label="Emoji picker"');
      expect(source).toContain('aria-live="polite"');
      expect(source).toContain('aria-selected');
    });

    it('implements 2D keyboard navigation event handling', () => {
      const source = fs.readFileSync(componentPath, 'utf8');
      expect(source).toContain('ArrowLeft');
      expect(source).toContain('ArrowRight');
      expect(source).toContain('ArrowUp');
      expect(source).toContain('ArrowDown');
      expect(source).toContain('Enter');
      expect(source).toContain('Escape');
    });

    it('ensures minimum 44x44px touch targets on mobile interactions', () => {
      const source = fs.readFileSync(componentPath, 'utf8');
      const has44pxTouchTargets =
        source.includes('min-h-[44px]') ||
        source.includes('min-w-[44px]') ||
        source.includes('h-11 w-11') ||
        source.includes('w-11 h-11');
      expect(has44pxTouchTargets).toBe(true);
    });
  });

  describe('Category Tabs & Fitzpatrick Modifier', () => {
    it('includes all required category tabs including Recents/Favorites', () => {
      const source = fs.readFileSync(componentPath, 'utf8');
      const expectedCategories = [
        'caribbean',
        'recents',
        'smileys',
        'people',
        'nature',
        'food',
        'travel',
        'activities',
        'objects',
        'symbols',
        'flags',
      ];

      for (const catId of expectedCategories) {
        expect(source).toContain(`'${catId}'`);
      }
    });

    it('contains skin tone modifier selector controls', () => {
      const source = fs.readFileSync(componentPath, 'utf8');
      expect(source).toContain('skinTone');
      expect(source).toContain('setSkinTone');
      expect(source).toContain('SKIN_TONE_MODIFIERS');
    });
  });
});
