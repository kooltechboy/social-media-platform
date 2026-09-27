import type { SkinTone } from './types';
import { UNICODE_EMOJI_DATASET } from './unicode-dataset';

export const SKIN_TONE_MODIFIERS: Record<SkinTone, string> = {
  default: '',
  light: '🏻',
  'medium-light': '🏼',
  medium: '🏽',
  'medium-dark': '🏾',
  dark: '🏿',
};

const SKIN_TONE_REGEX = /[\u{1F3FB}-\u{1F3FF}]/gu;

const SUPPORTED_EMOJIS = new Set<string>();

for (const category of UNICODE_EMOJI_DATASET) {
  for (const item of category.emojis) {
    if (item.supportsSkinTone) {
      SUPPORTED_EMOJIS.add(item.emoji);
      SUPPORTED_EMOJIS.add(item.emoji.replace(/\uFE0F/g, ''));
    }
  }
}

/**
 * Checks if a given base emoji supports Fitzpatrick skin-tone modification.
 */
export function supportsSkinTone(emoji: string): boolean {
  if (!emoji) return false;
  const clean = emoji.replace(SKIN_TONE_REGEX, '');
  return SUPPORTED_EMOJIS.has(clean) || SUPPORTED_EMOJIS.has(clean.replace(/\uFE0F/g, ''));
}

/**
 * Applies a Fitzpatrick skin-tone modifier to a supported emoji glyph.
 * Returns the unmodified glyph if skin tones are unsupported or tone is 'default'.
 */
export function applySkinTone(baseEmoji: string, tone: SkinTone): string {
  if (!baseEmoji) return '';

  const clean = baseEmoji.replace(SKIN_TONE_REGEX, '');
  const cleanWithoutVariation = clean.replace(/\uFE0F/g, '');

  if (!SUPPORTED_EMOJIS.has(clean) && !SUPPORTED_EMOJIS.has(cleanWithoutVariation)) {
    return baseEmoji;
  }

  const modifier = SKIN_TONE_MODIFIERS[tone] ?? '';
  if (!modifier || tone === 'default') {
    return clean;
  }

  // Handle Zero-Width-Joiner (ZWJ) sequences like 🧑‍💻 or 🧑‍🍳
  if (clean.includes('\u200D')) {
    const parts = clean.split('\u200D');
    const firstPart = parts[0].replace(/\uFE0F/g, '');
    return `${firstPart}${modifier}\u200D${parts.slice(1).join('\u200D')}`;
  }

  // Handle standard glyphs, stripping variation selector before modifier
  const baseGlyph = clean.replace(/\uFE0F/g, '');
  return `${baseGlyph}${modifier}`;
}
