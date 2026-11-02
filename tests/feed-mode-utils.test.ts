import { describe, it, expect } from 'vitest';
import {
  normalizeFeedMode,
  feedModeToSlug,
  getFeedModeTitle,
} from '../apps/web/src/lib/feed/feed-mode-utils';

describe('Feed Mode Normalization Utilities', () => {
  it('normalizes alias variations of for_you', () => {
    expect(normalizeFeedMode('for_you')).toBe('for_you');
    expect(normalizeFeedMode('for-you')).toBe('for_you');
    expect(normalizeFeedMode('foryou')).toBe('for_you');
    expect(normalizeFeedMode(undefined)).toBe('for_you');
    expect(normalizeFeedMode(null as any)).toBe('for_you');
  });

  it('normalizes valid community and creator modes', () => {
    expect(normalizeFeedMode('friends')).toBe('friends');
    expect(normalizeFeedMode('following')).toBe('following');
    expect(normalizeFeedMode('creators')).toBe('creators');
    expect(normalizeFeedMode('creator')).toBe('creators');
    expect(normalizeFeedMode('communities')).toBe('communities');
    expect(normalizeFeedMode('community')).toBe('communities');
    expect(normalizeFeedMode('caribbean')).toBe('caribbean');
    expect(normalizeFeedMode('pages')).toBe('pages');
    expect(normalizeFeedMode('official')).toBe('official');
  });

  it('falls back to for_you for unknown modes', () => {
    expect(normalizeFeedMode('invalid-tab-xyz')).toBe('for_you');
  });

  it('converts feed mode to safe URL slug', () => {
    expect(feedModeToSlug('for_you')).toBe('for-you');
    expect(feedModeToSlug('creators')).toBe('creators');
  });

  it('provides accessible titles for each feed mode', () => {
    expect(getFeedModeTitle('for_you')).toMatch(/For You/i);
    expect(getFeedModeTitle('friends')).toMatch(/Friends/i);
    expect(getFeedModeTitle('official')).toMatch(/Official/i);
  });
});
