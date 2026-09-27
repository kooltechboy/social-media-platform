import { describe, it, expect, beforeEach } from 'vitest';
import {
  applySkinTone,
  SKIN_TONE_MODIFIERS,
  getRecentEmojis,
  addRecentEmoji,
  getFavoriteEmojis,
  toggleFavoriteEmoji,
  clearRecentEmojis,
  clearFavoriteEmojis,
} from '../apps/web/src/lib/emoji';
import type { SkinTone } from '../apps/web/src/lib/emoji';

describe('Fitzpatrick Skin-Tone Synthesis', () => {
  it('defines modifiers for all standard Fitzpatrick tones', () => {
    expect(SKIN_TONE_MODIFIERS).toBeDefined();
    expect(SKIN_TONE_MODIFIERS.default).toBe('');
    expect(SKIN_TONE_MODIFIERS.light).toBe('🏻');
    expect(SKIN_TONE_MODIFIERS['medium-light']).toBe('🏼');
    expect(SKIN_TONE_MODIFIERS.medium).toBe('🏽');
    expect(SKIN_TONE_MODIFIERS['medium-dark']).toBe('🏾');
    expect(SKIN_TONE_MODIFIERS.dark).toBe('🏿');
  });

  it('concatenates skin tone modifier on supported glyphs', () => {
    // Wave hand
    expect(applySkinTone('👋', 'dark')).toBe('👋🏿');
    expect(applySkinTone('👋', 'light')).toBe('👋🏻');
    expect(applySkinTone('👋', 'medium')).toBe('👋🏽');

    // Thumbs up
    expect(applySkinTone('👍', 'medium-dark')).toBe('👍🏾');

    // Victory hand with variation selector
    expect(applySkinTone('✌️', 'dark')).toBe('✌🏿');

    // ZWJ complex sequence
    expect(applySkinTone('🧑‍💻', 'dark')).toBe('🧑🏿‍💻');
  });

  it('swaps or clears skin tone modifier on an already-modified glyph', () => {
    // Already modified to dark -> switch to light
    expect(applySkinTone('👋🏿', 'light')).toBe('👋🏻');

    // Already modified to dark -> switch to default
    expect(applySkinTone('👋🏿', 'default')).toBe('👋');
  });

  it('returns unmodified glyph on unsupported emojis', () => {
    // Non-modifiable emojis should remain intact
    expect(applySkinTone('🔥', 'dark')).toBe('🔥');
    expect(applySkinTone('🇯🇲', 'dark')).toBe('🇯🇲');
    expect(applySkinTone('🌴', 'medium')).toBe('🌴');
    expect(applySkinTone('🚀', 'light')).toBe('🚀');
    expect(applySkinTone('🔥', 'default')).toBe('🔥');
  });
});

describe('Recent Emojis LRU Store', () => {
  beforeEach(() => {
    clearRecentEmojis?.();
  });

  it('adds and retrieves emojis in LRU order (most recent first)', () => {
    addRecentEmoji('👋');
    addRecentEmoji('🌴');
    addRecentEmoji('🔥');

    expect(getRecentEmojis()).toEqual(['🔥', '🌴', '👋']);
  });

  it('moves existing emoji to front when re-added without duplicates', () => {
    addRecentEmoji('👋');
    addRecentEmoji('🌴');
    addRecentEmoji('🔥');
    addRecentEmoji('👋'); // Re-add first emoji

    expect(getRecentEmojis()).toEqual(['👋', '🔥', '🌴']);
  });

  it('caps store at max limit of 32 items', () => {
    for (let i = 1; i <= 40; i++) {
      addRecentEmoji(`emoji_${i}`);
    }

    const recents = getRecentEmojis();
    expect(recents.length).toBe(32);
    expect(recents[0]).toBe('emoji_40');
    expect(recents[31]).toBe('emoji_9');
    expect(recents).not.toContain('emoji_1');
    expect(recents).not.toContain('emoji_8');
  });
});

describe('Favorite Emojis Store', () => {
  beforeEach(() => {
    clearFavoriteEmojis?.();
  });

  it('toggles favorite emoji and reports status correctly', () => {
    expect(getFavoriteEmojis()).toEqual([]);

    // Add favorite
    const added = toggleFavoriteEmoji('🇯🇲');
    expect(added).toBe(true);
    expect(getFavoriteEmojis()).toContain('🇯🇲');

    // Toggle off
    const removed = toggleFavoriteEmoji('🇯🇲');
    expect(removed).toBe(false);
    expect(getFavoriteEmojis()).not.toContain('🇯🇲');
  });

  it('supports multiple favorite emojis', () => {
    toggleFavoriteEmoji('🇯🇲');
    toggleFavoriteEmoji('🇹🇹');
    toggleFavoriteEmoji('🇧🇧');

    const favorites = getFavoriteEmojis();
    expect(favorites).toHaveLength(3);
    expect(favorites).toEqual(expect.arrayContaining(['🇯🇲', '🇹🇹', '🇧🇧']));

    // Untoggle one
    toggleFavoriteEmoji('🇹🇹');
    expect(getFavoriteEmojis()).toEqual(['🇯🇲', '🇧🇧']);
  });
});
