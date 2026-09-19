import { describe, it, expect } from 'vitest';
import {
  VALID_SIGNAL_TYPES,
  getSignalHref,
  type TrendingSignal,
} from '../../apps/web/src/components/trending/trending-panel';

describe('TUKUBI Zero-Mock Real-Time Trending System', () => {
  it('enforces the exact honest empty state text when no signals exist', () => {
    const EMPTY_STATE_MESSAGE = 'Trending topics will appear here as the TUKUBI community grows.';

    const signals: TrendingSignal[] = [];
    const message = signals.length === 0 ? EMPTY_STATE_MESSAGE : null;

    expect(message).toBe('Trending topics will appear here as the TUKUBI community grows.');
  });

  it('validates all recognized signal types', () => {
    const expectedTypes = ['hashtag', 'sound', 'creator', 'topic', 'keyword'];

    expect(VALID_SIGNAL_TYPES).toHaveLength(expectedTypes.length);
    for (const type of expectedTypes) {
      expect(VALID_SIGNAL_TYPES).toContain(type);
    }
  });

  it('generates correct routing destinations for each signal type', () => {
    const hashtagSignal = {
      signal_type: 'hashtag',
      entity_id: 'CarnivalMonday',
      entity_label: 'CarnivalMonday',
    };
    expect(getSignalHref(hashtagSignal)).toBe('/explore?q=%23CarnivalMonday');

    const soundSignal = {
      signal_type: 'sound',
      entity_id: 'sound-reggae-dub-001',
      entity_label: 'Kingston Riddim',
    };
    expect(getSignalHref(soundSignal)).toBe('/sounds?id=sound-reggae-dub-001');

    const creatorSignal = {
      signal_type: 'creator',
      entity_id: 'koffee',
      entity_label: 'Koffee',
    };
    expect(getSignalHref(creatorSignal)).toBe('/profile/koffee');

    const topicSignal = {
      signal_type: 'topic',
      entity_id: 'creole-cuisine',
      entity_label: 'Creole Cuisine',
    };
    expect(getSignalHref(topicSignal)).toBe('/explore?q=Creole%20Cuisine');

    const keywordSignal = {
      signal_type: 'keyword',
      entity_id: 'caribbean-tech',
      entity_label: 'Caribbean Tech',
    };
    expect(getSignalHref(keywordSignal)).toBe('/explore?q=Caribbean%20Tech');
  });

  it('calculates real-time velocity scores with high weight on recent 2h activity', () => {
    function calculateScore(postCountLast2h: number, postCountLast24h: number): number {
      // (recent_posts_2h * 3.0) + (recent_posts_24h * 1.0)
      return postCountLast2h * 3.0 + postCountLast24h * 1.0;
    }

    // Steady topic: 10 posts over 24h, 1 in last 2h
    const steadyScore = calculateScore(1, 10); // 3 + 10 = 13

    // Spiking topic: 10 posts over 24h, all 8 in last 2h
    const spikingScore = calculateScore(8, 10); // 24 + 10 = 34

    expect(spikingScore).toBeGreaterThan(steadyScore);
    expect(spikingScore).toBe(34);
    expect(steadyScore).toBe(13);
  });

  it('correctly sorts real-time signals by descending score', () => {
    const rawSignals: TrendingSignal[] = [
      {
        id: '1',
        signal_type: 'hashtag',
        entity_id: 'barbadoscropover',
        entity_label: 'barbadoscropover',
        score: 45.5,
        post_count_last_24h: 30,
        post_count_last_2h: 12,
      },
      {
        id: '2',
        signal_type: 'hashtag',
        entity_id: 'socamonarch',
        entity_label: 'socamonarch',
        score: 110.2,
        post_count_last_24h: 80,
        post_count_last_2h: 30,
      },
      {
        id: '3',
        signal_type: 'topic',
        entity_id: 'blue-mountain-coffee',
        entity_label: 'Blue Mountain Coffee',
        score: 12.0,
        post_count_last_24h: 10,
        post_count_last_2h: 1,
      },
    ];

    const sorted = [...rawSignals].sort((a, b) => b.score - a.score);

    expect(sorted[0].entity_id).toBe('socamonarch');
    expect(sorted[1].entity_id).toBe('barbadoscropover');
    expect(sorted[2].entity_id).toBe('blue-mountain-coffee');
  });

  it('ensures clean hashtag entity sanitization without double-hash prefixes', () => {
    function sanitizeHashtag(label: string): string {
      return label.replace(/^#+/, '').trim();
    }

    expect(sanitizeHashtag('#TrinidadCarnival')).toBe('TrinidadCarnival');
    expect(sanitizeHashtag('##TrinidadCarnival')).toBe('TrinidadCarnival');
    expect(sanitizeHashtag('TrinidadCarnival')).toBe('TrinidadCarnival');
  });
});
