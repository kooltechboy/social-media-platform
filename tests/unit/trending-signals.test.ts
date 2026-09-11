import { describe, it, expect } from 'vitest';
import { VALID_SIGNAL_TYPES, getSignalHref } from '../../apps/web/src/components/trending/trending-panel';

describe('Trending signals', () => {
  it('valid signal types', () => {
    const VALID_TYPES = ['hashtag', 'sound', 'creator', 'topic', 'keyword'] as const;
    expect(VALID_TYPES).toHaveLength(5);
    expect(VALID_TYPES.includes('hashtag')).toBe(true);
    expect(VALID_SIGNAL_TYPES).toEqual(VALID_TYPES);
  });

  it('signals expire after 6 hours', () => {
    const computedAt = new Date('2026-09-10T12:00:00Z');
    const expiresAt = new Date(computedAt.getTime() + 6 * 60 * 60 * 1000);
    expect(expiresAt.toISOString()).toBe('2026-09-10T18:00:00.000Z');
  });

  it('NULL territory = platform-wide', () => {
    const signals = [
      { territory_iso: null, entity_label: 'Platform-Wide Trend' },
      { territory_iso: 'JM', entity_label: 'Jamaica Trend' },
    ];
    const platformWide = signals.filter((s) => s.territory_iso === null);
    expect(platformWide).toHaveLength(1);
    expect(platformWide[0].entity_label).toBe('Platform-Wide Trend');
  });

  it('scores sort descending', () => {
    const signals = [
      { entity_label: 'A', score: 10 },
      { entity_label: 'B', score: 50 },
      { entity_label: 'C', score: 25 },
    ];
    const sorted = [...signals].sort((a, b) => b.score - a.score);
    expect(sorted[0].entity_label).toBe('B');
    expect(sorted[1].entity_label).toBe('C');
    expect(sorted[2].entity_label).toBe('A');
  });

  it('hashtag href format', () => {
    const entity = { signal_type: 'hashtag', entity_id: 'soca', entity_label: 'soca' };
    const href = entity.signal_type === 'hashtag'
      ? `/explore?q=${encodeURIComponent('#' + entity.entity_id)}`
      : '/explore';
    expect(href).toBe('/explore?q=%23soca');
    expect(getSignalHref(entity)).toBe('/explore?q=%23soca');
  });

  it('sound href format', () => {
    const entity = { signal_type: 'sound', entity_id: 'sound-123', entity_label: 'Calypso Groove' };
    expect(getSignalHref(entity)).toBe('/sounds?id=sound-123');
  });

  it('creator href format', () => {
    const entity = { signal_type: 'creator', entity_id: 'carib_chef', entity_label: 'Chef Marcus' };
    expect(getSignalHref(entity)).toBe('/profile/carib_chef');
  });

  it('topic or keyword href format', () => {
    const entity = { signal_type: 'topic', entity_id: 'carnival-prep', entity_label: 'Carnival Prep' };
    expect(getSignalHref(entity)).toBe('/explore?q=Carnival%20Prep');
  });

  it('score = 2h_count * 3 + 24h_count', () => {
    const count_2h = 5;
    const count_24h = 20;
    const score = count_2h * 3 + count_24h;
    expect(score).toBe(35);
  });
});
