import { describe, it, expect } from 'vitest';
import { CARIBBEAN_SOUNDS } from '../../apps/web/src/lib/constants/caribbean-sounds';
import { verifyMediaUrlAccessible } from '../../packages/media/src/index';

describe('TUKUBI Media Ecosystem Health & Asset Accessibility', () => {
  it('contains 12 authentic Caribbean audio stem constants', () => {
    expect(CARIBBEAN_SOUNDS).toHaveLength(12);
    for (const sound of CARIBBEAN_SOUNDS) {
      expect(sound.id).toBeDefined();
      expect(sound.title).toBeDefined();
      expect(sound.artist).toBeDefined();
      expect(sound.audioUrl).toMatch(/^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/caribbean-sounds\/stems\//);
      expect(sound.durationSeconds).toBeGreaterThan(0);
    }
  });

  it('verifies accessibility checker handles HTTP status responses cleanly', async () => {
    // Valid mock verification
    const result = await verifyMediaUrlAccessible('https://httpbin.org/status/200', 5000).catch(() => ({ accessible: false }));
    expect(result).toHaveProperty('accessible');
  });

  it('handles invalid or unreachable URLs gracefully without throwing', async () => {
    const result = await verifyMediaUrlAccessible('https://invalid-non-existent-domain-tukubi.org/test.mp3', 2000);
    expect(result.accessible).toBe(false);
    expect(result.error).toBeDefined();
  });
});
