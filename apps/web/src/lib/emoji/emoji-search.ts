import { UNICODE_EMOJI_DATASET } from './unicode-dataset';
import type { EmojiItem } from './types';

// Inverted index for sub-millisecond search
interface IndexedEmoji {
  item: EmojiItem;
  normalizedName: string;
  nameTokens: string[];
  keywords: string[];
}

let indexedEmojis: IndexedEmoji[] | null = null;
let emojiMapByChar: Map<string, EmojiItem> | null = null;

function getIndexedEmojis(): { indexed: IndexedEmoji[]; charMap: Map<string, EmojiItem> } {
  if (indexedEmojis && emojiMapByChar) {
    return { indexed: indexedEmojis, charMap: emojiMapByChar };
  }

  const seen = new Set<string>();
  const list: IndexedEmoji[] = [];
  const map = new Map<string, EmojiItem>();

  for (const category of UNICODE_EMOJI_DATASET) {
    for (const emoji of category.emojis) {
      if (seen.has(emoji.emoji)) {
        // Merge keywords if already seen
        const existing = map.get(emoji.emoji);
        if (existing) {
          const mergedKeywords = Array.from(new Set([...existing.keywords, ...emoji.keywords]));
          existing.keywords = mergedKeywords;
        }
        continue;
      }
      seen.add(emoji.emoji);
      map.set(emoji.emoji, emoji);

      const normalizedName = emoji.name.toLowerCase();
      const nameTokens = normalizedName.split(/[\s\-_,]+/).filter(Boolean);
      const keywords = emoji.keywords.map((k) => k.toLowerCase());

      list.push({
        item: emoji,
        normalizedName,
        nameTokens,
        keywords,
      });
    }
  }

  indexedEmojis = list;
  emojiMapByChar = map;
  return { indexed: indexedEmojis, charMap: emojiMapByChar };
}

/**
 * Searches the Unicode emoji dataset by query tokens, names, and keywords.
 * Returns unique matching EmojiItems sorted by relevance score.
 */
export function searchEmojis(query: string, limit: number = 50): EmojiItem[] {
  if (!query || typeof query !== 'string') {
    return [];
  }

  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return [];
  }

  const { indexed, charMap } = getIndexedEmojis();

  // If exact emoji character was typed/pasted
  if (charMap.has(trimmed)) {
    return [charMap.get(trimmed)!];
  }

  const queryTokens = trimmed.split(/[\s\-_,]+/).filter(Boolean);
  if (queryTokens.length === 0) {
    return [];
  }

  const scored: Array<{ item: EmojiItem; score: number }> = [];

  for (const entry of indexed) {
    let score = 0;

    // Check exact name match
    if (entry.normalizedName === trimmed) {
      score += 100;
    } else if (entry.normalizedName.startsWith(trimmed)) {
      score += 60;
    } else if (entry.normalizedName.includes(trimmed)) {
      score += 30;
    }

    // Check exact keyword match
    if (entry.keywords.includes(trimmed)) {
      score += 80;
    }

    // Token matching
    let allTokensMatched = true;
    for (const qToken of queryTokens) {
      let tokenMatched = false;

      // Check name tokens
      for (const nToken of entry.nameTokens) {
        if (nToken === qToken) {
          score += 40;
          tokenMatched = true;
        } else if (nToken.startsWith(qToken)) {
          score += 20;
          tokenMatched = true;
        } else if (nToken.includes(qToken)) {
          score += 10;
          tokenMatched = true;
        }
      }

      // Check keywords
      for (const kw of entry.keywords) {
        if (kw === qToken) {
          score += 40;
          tokenMatched = true;
        } else if (kw.startsWith(qToken)) {
          score += 20;
          tokenMatched = true;
        } else if (kw.includes(qToken)) {
          score += 10;
          tokenMatched = true;
        }
      }

      if (!tokenMatched) {
        allTokensMatched = false;
      }
    }

    if (score > 0 && allTokensMatched) {
      scored.push({ item: entry.item, score });
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.item);
}
