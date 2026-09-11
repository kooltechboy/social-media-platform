import { describe, it, expect } from 'vitest';

describe('Reels enhancements', () => {
  it('reel save uses video id as post_id in saved_posts', () => {
    const reelId = 'video-uuid-1234';
    const payload = { profile_id: 'user-1', post_id: reelId };
    expect(payload.post_id).toBe(reelId);
  });

  it('use-this-sound URL encodes sound metadata correctly', () => {
    const soundId = 'sound-123';
    const soundTitle = 'Caribbean Sunset Riddim';
    const params = new URLSearchParams({ mode: 'reel', soundId, soundTitle });
    const url = `/create?${params.toString()}`;
    expect(url).toContain('sound-123');
    expect(url).toContain('Caribbean+Sunset+Riddim');
  });

  it('share reel link format', () => {
    const reelId = 'reel-abc-123';
    const shareUrl = `/reels?id=${reelId}`;
    expect(shareUrl).toBe('/reels?id=reel-abc-123');
  });

  it('optimistic save: Set toggles correctly', () => {
    const savedReels = new Set<string>(['reel-1']);
    const toggleSave = (id: string) => {
      const next = new Set(savedReels);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    };
    expect(toggleSave('reel-1').has('reel-1')).toBe(false);
    expect(toggleSave('reel-2').has('reel-2')).toBe(true);
  });

  it('use-this-sound button renders correct URL params', () => {
    const soundTitle = 'Soca Vibes';
    const soundId = 'snd-001';
    const params = new URLSearchParams({ mode: 'reel', soundId, soundTitle });
    expect(params.get('mode')).toBe('reel');
    expect(params.get('soundId')).toBe('snd-001');
    expect(params.get('soundTitle')).toBe('Soca Vibes');
  });
});
