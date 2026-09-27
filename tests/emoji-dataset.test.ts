import { describe, it, expect } from 'vitest';
import {
  UNICODE_EMOJI_DATASET,
  searchEmojis,
  type EmojiItem,
  type EmojiCategoryData,
} from '../apps/web/src/lib/emoji';

describe('Unicode Emoji Dataset & Search Index', () => {
  it('contains 10 comprehensive categories including Caribbean & Island vibes', () => {
    expect(UNICODE_EMOJI_DATASET).toBeDefined();
    expect(UNICODE_EMOJI_DATASET.length).toBe(10);
    const categoryIds = UNICODE_EMOJI_DATASET.map((c) => c.id);
    expect(categoryIds).toContain('caribbean');
    expect(categoryIds).toContain('smileys');
    expect(categoryIds).toContain('people');
    expect(categoryIds).toContain('nature');
    expect(categoryIds).toContain('food');
    expect(categoryIds).toContain('travel');
    expect(categoryIds).toContain('activities');
    expect(categoryIds).toContain('objects');
    expect(categoryIds).toContain('symbols');
    expect(categoryIds).toContain('flags');
  });

  it('contains over 30 Caribbean nation and territory flags and cultural elements', () => {
    const caribbeanCategory = UNICODE_EMOJI_DATASET.find((c) => c.id === 'caribbean');
    expect(caribbeanCategory).toBeDefined();
    expect(caribbeanCategory?.emojis.length).toBeGreaterThanOrEqual(30);

    const caribbeanEmojis = caribbeanCategory?.emojis.map((e) => e.emoji) || [];
    // Key Caribbean flags
    expect(caribbeanEmojis).toContain('🇯🇲'); // Jamaica
    expect(caribbeanEmojis).toContain('🇹🇹'); // Trinidad & Tobago
    expect(caribbeanEmojis).toContain('🇧🇧'); // Barbados
    expect(caribbeanEmojis).toContain('🇧🇸'); // Bahamas
    expect(caribbeanEmojis).toContain('🇭🇹'); // Haiti
    expect(caribbeanEmojis).toContain('🇩🇴'); // Dominican Republic
    expect(caribbeanEmojis).toContain('🇵🇷'); // Puerto Rico
    expect(caribbeanEmojis).toContain('🇨🇺'); // Cuba
    expect(caribbeanEmojis).toContain('🇬🇩'); // Grenada
    expect(caribbeanEmojis).toContain('🇱🇨'); // Saint Lucia
    expect(caribbeanEmojis).toContain('🇻🇨'); // St. Vincent & Grenadines
    expect(caribbeanEmojis).toContain('🇦🇬'); // Antigua & Barbuda
    expect(caribbeanEmojis).toContain('🇩🇲'); // Dominica
    expect(caribbeanEmojis).toContain('🇰🇳'); // St. Kitts & Nevis
    expect(caribbeanEmojis).toContain('🇬🇾'); // Guyana
    expect(caribbeanEmojis).toContain('🇸🇷'); // Suriname
    expect(caribbeanEmojis).toContain('🇧🇿'); // Belize
  });

  it('marks people and hand gesture emojis as skin tone modifiable', () => {
    const peopleCategory = UNICODE_EMOJI_DATASET.find((c) => c.id === 'people');
    expect(peopleCategory).toBeDefined();
    const modifiableEmojis = peopleCategory?.emojis.filter((e) => e.supportsSkinTone);
    expect(modifiableEmojis?.length).toBeGreaterThan(0);
    
    // Wave hand and thumbs up should support skin tone
    const wave = peopleCategory?.emojis.find((e) => e.emoji === '👋');
    expect(wave?.supportsSkinTone).toBe(true);
    const thumbsUp = peopleCategory?.emojis.find((e) => e.emoji === '👍');
    expect(thumbsUp?.supportsSkinTone).toBe(true);
  });

  it('searches emojis instantaneously using tokenized keywords', () => {
    // Exact or prefix query for Jamaica
    const jamaicaResults = searchEmojis('jamaica');
    expect(jamaicaResults.length).toBeGreaterThan(0);
    expect(jamaicaResults[0].emoji).toBe('🇯🇲');

    // Trinidad
    const trinidadResults = searchEmojis('trinidad');
    expect(trinidadResults.length).toBeGreaterThan(0);
    expect(trinidadResults.some((e) => e.emoji === '🇹🇹')).toBe(true);

    // Barbados
    const barbadosResults = searchEmojis('barbados');
    expect(barbadosResults.length).toBeGreaterThan(0);
    expect(barbadosResults.some((e) => e.emoji === '🇧🇧')).toBe(true);

    // Common items
    const fireResults = searchEmojis('fire');
    expect(fireResults.some((e) => e.emoji === '🔥')).toBe(true);

    const sunResults = searchEmojis('sun');
    expect(sunResults.some((e) => e.emoji === '☀️')).toBe(true);

    // Non-existent search term
    const emptyResults = searchEmojis('xyznonexistenttoken999');
    expect(emptyResults).toHaveLength(0);
  });

  it('handles empty query gracefully', () => {
    expect(searchEmojis('')).toHaveLength(0);
    expect(searchEmojis('   ')).toHaveLength(0);
  });
});
