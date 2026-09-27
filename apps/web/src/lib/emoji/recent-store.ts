const RECENT_EMOJIS_KEY = 'tukubi_recent_emojis';
const FAVORITE_EMOJIS_KEY = 'tukubi_favorite_emojis';
const MAX_RECENTS = 32;

let memoryRecents: string[] = [];
let memoryFavorites: string[] = [];

function isLocalStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Retrieves the list of recently used emojis in LRU order (most recent first).
 */
export function getRecentEmojis(): string[] {
  if (isLocalStorageAvailable()) {
    try {
      const stored = window.localStorage.getItem(RECENT_EMOJIS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          memoryRecents = parsed;
          return parsed;
        }
      }
    } catch {
      // Fallback to memory store
    }
  }
  return [...memoryRecents];
}

/**
 * Adds an emoji to recently used with LRU ordering and max capacity limit of 32.
 */
export function addRecentEmoji(emoji: string): void {
  if (!emoji || typeof emoji !== 'string') return;

  const current = getRecentEmojis();
  const filtered = current.filter((item) => item !== emoji);
  const updated = [emoji, ...filtered].slice(0, MAX_RECENTS);

  memoryRecents = updated;

  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore quota or access errors
    }
  }
}

/**
 * Clears the recently used emojis store.
 */
export function clearRecentEmojis(): void {
  memoryRecents = [];
  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.removeItem(RECENT_EMOJIS_KEY);
    } catch {
      // Ignore
    }
  }
}

/**
 * Retrieves user's favorite emojis list.
 */
export function getFavoriteEmojis(): string[] {
  if (isLocalStorageAvailable()) {
    try {
      const stored = window.localStorage.getItem(FAVORITE_EMOJIS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          memoryFavorites = parsed;
          return parsed;
        }
      }
    } catch {
      // Fallback to memory store
    }
  }
  return [...memoryFavorites];
}

/**
 * Toggles an emoji in the favorites list.
 * Returns true if the emoji was added to favorites, false if removed.
 */
export function toggleFavoriteEmoji(emoji: string): boolean {
  if (!emoji || typeof emoji !== 'string') return false;

  const current = getFavoriteEmojis();
  const exists = current.includes(emoji);
  let updated: string[];
  let isFavorite: boolean;

  if (exists) {
    updated = current.filter((item) => item !== emoji);
    isFavorite = false;
  } else {
    updated = [...current, emoji];
    isFavorite = true;
  }

  memoryFavorites = updated;

  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.setItem(FAVORITE_EMOJIS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  }

  return isFavorite;
}

/**
 * Checks whether an emoji is in favorites.
 */
export function isFavoriteEmoji(emoji: string): boolean {
  return getFavoriteEmojis().includes(emoji);
}

/**
 * Clears the favorites store.
 */
export function clearFavoriteEmojis(): void {
  memoryFavorites = [];
  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.removeItem(FAVORITE_EMOJIS_KEY);
    } catch {
      // Ignore
    }
  }
}
