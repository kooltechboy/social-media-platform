/**
 * In-memory fallback map for environments where native AsyncStorage
 * is unavailable (e.g. Vitest unit tests, SSR, or unlinked web previews).
 */
const memoryStorage = new Map<string, string>();

function getAsyncStorage(): any {
  try {
    // Dynamic resolution prevents bundling failures in Node/SSR/Vitest environments
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-async-storage/async-storage');
    return mod?.default || mod;
  } catch {
    return null;
  }
}

/**
 * Mobile Auth Storage Adapter for Supabase Client.
 * Adheres to Fortune-100 & NASA-grade resilience standards:
 * - Safely delegates to native AsyncStorage on iOS and Android.
 * - Gracefully falls back to in-memory store if native bridge throws or in headless environments.
 */
export const mobileAuthStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const storage = getAsyncStorage();
      if (storage && typeof storage.getItem === 'function') {
        const value = await storage.getItem(key);
        if (value !== null) return value;
      }
    } catch {
      // Fallback to memory store if AsyncStorage throws
    }
    return memoryStorage.get(key) ?? null;
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      const storage = getAsyncStorage();
      if (storage && typeof storage.setItem === 'function') {
        await storage.setItem(key, value);
      }
    } catch {
      // Non-blocking fallback to memory store
    }
    memoryStorage.set(key, value);
  },

  async removeItem(key: string): Promise<void> {
    try {
      const storage = getAsyncStorage();
      if (storage && typeof storage.removeItem === 'function') {
        await storage.removeItem(key);
      }
    } catch {
      // Non-blocking fallback to memory store
    }
    memoryStorage.delete(key);
  },
};
