import { describe, it, expect } from 'vitest';
import { VIBE_CATEGORIES } from '../../apps/web/src/lib/explore/actions';
import { CARIBBEAN_TERRITORIES, CARIBBEAN_TERRITORIES_BY_ISO } from '../../apps/web/src/lib/constants/caribbean-territories';
import { DIASPORA_CITY_HUBS, DIASPORA_COUNTRIES } from '../../apps/web/src/lib/constants/diaspora-hubs';

describe('Explore by Vibe Taxonomy & Tag Matching', () => {
  it('defines all 8 canonical Caribbean vibes with icons, descriptions and tag clusters', () => {
    expect(VIBE_CATEGORIES.length).toBe(8);
    const vibeIds = VIBE_CATEGORIES.map((v) => v.id);
    expect(vibeIds).toEqual([
      'music',
      'carnival',
      'food',
      'tech',
      'fashion',
      'nightlife',
      'sports',
      'travel',
    ]);

    for (const vibe of VIBE_CATEGORIES) {
      expect(vibe.name.length).toBeGreaterThan(0);
      expect(vibe.icon.length).toBeGreaterThan(0);
      expect(vibe.tags.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('matches post content correctly to vibe tag clusters', () => {
    const musicVibe = VIBE_CATEGORIES.find((v) => v.id === 'music')!;
    const foodVibe = VIBE_CATEGORIES.find((v) => v.id === 'food')!;

    const post1 = { content: 'Check out this new soca sound system mix from Kingston!', cultural_tags: ['soca', 'music'] };
    const post2 = { content: 'Secret jerk chicken recipe from Portland with pimento wood smoke', cultural_tags: ['food', 'jerk'] };

    const matchesMusic1 = musicVibe.tags.some((t) => post1.content.toLowerCase().includes(t) || post1.cultural_tags.includes(t));
    const matchesMusic2 = musicVibe.tags.some((t) => post2.content.toLowerCase().includes(t) || post2.cultural_tags.includes(t));
    const matchesFood2 = foodVibe.tags.some((t) => post2.content.toLowerCase().includes(t) || post2.cultural_tags.includes(t));

    expect(matchesMusic1).toBe(true);
    expect(matchesMusic2).toBe(false);
    expect(matchesFood2).toBe(true);
  });
});

describe('Island Nations & Territories Single Source of Truth', () => {
  it('covers all major Caribbean sovereign nations and territories with ISO3 mapping', () => {
    expect(CARIBBEAN_TERRITORIES.length).toBeGreaterThanOrEqual(28);

    // Verify key territories
    expect(CARIBBEAN_TERRITORIES_BY_ISO['JAM']).toBeDefined();
    expect(CARIBBEAN_TERRITORIES_BY_ISO['JAM'].name).toBe('Jamaica');
    expect(CARIBBEAN_TERRITORIES_BY_ISO['JAM'].flag).toBe('🇯🇲');
    expect(CARIBBEAN_TERRITORIES_BY_ISO['JAM'].sovereign).toBe(true);

    expect(CARIBBEAN_TERRITORIES_BY_ISO['TTO']).toBeDefined();
    expect(CARIBBEAN_TERRITORIES_BY_ISO['TTO'].name).toBe('Trinidad & Tobago');
    expect(CARIBBEAN_TERRITORIES_BY_ISO['TTO'].flag).toBe('🇹🇹');

    expect(CARIBBEAN_TERRITORIES_BY_ISO['DOM']).toBeDefined();
    expect(CARIBBEAN_TERRITORIES_BY_ISO['DOM'].name).toBe('Dominican Republic');
    expect(CARIBBEAN_TERRITORIES_BY_ISO['DOM'].flag).toBe('🇩🇴');

    expect(CARIBBEAN_TERRITORIES_BY_ISO['PRI']).toBeDefined();
    expect(CARIBBEAN_TERRITORIES_BY_ISO['PRI'].name).toBe('Puerto Rico');
    expect(CARIBBEAN_TERRITORIES_BY_ISO['PRI'].flag).toBe('🇵🇷');
    expect(CARIBBEAN_TERRITORIES_BY_ISO['PRI'].sovereign).toBe(false);
  });

  it('maintains valid ISO codes and language mappings across all territories', () => {
    const validLangs = ['en', 'es', 'fr', 'ht', 'nl', 'pap'];
    for (const territory of CARIBBEAN_TERRITORIES) {
      expect(territory.iso).toMatch(/^[A-Z]{3}$/);
      expect(validLangs).toContain(territory.lang);
      expect(territory.flag.length).toBeGreaterThan(0);
    }
  });
});

describe('Global Diaspora Hubs & City Centers', () => {
  it('includes primary metropolitan diaspora hubs across US, Canada, UK, and Europe', () => {
    expect(DIASPORA_CITY_HUBS.length).toBeGreaterThanOrEqual(15);

    const hubCities = DIASPORA_CITY_HUBS.map((h) => h.city);
    expect(hubCities.some((c) => c.includes('Miami'))).toBe(true);
    expect(hubCities.some((c) => c.includes('New York'))).toBe(true);
    expect(hubCities.some((c) => c.includes('Toronto'))).toBe(true);
    expect(hubCities.some((c) => c.includes('London'))).toBe(true);
    expect(hubCities.some((c) => c.includes('Amsterdam'))).toBe(true);
  });

  it('maps diaspora country ISOs correctly', () => {
    const countries = DIASPORA_COUNTRIES.map((c) => c.iso);
    expect(countries).toContain('USA');
    expect(countries).toContain('CAN');
    expect(countries).toContain('GBR');
    expect(countries).toContain('NLD');
    expect(countries).toContain('FRA');
  });
});

describe('Multi-dimensional Filter & URL Parameter Resolution', () => {
  function constructExploreUrl(params: { vibe?: string | null; country?: string | null; hub?: string | null; q?: string | null }): string {
    const urlParams = new URLSearchParams();
    if (params.vibe) urlParams.set('vibe', params.vibe);
    if (params.country) urlParams.set('country', params.country);
    if (params.hub) urlParams.set('hub', params.hub);
    if (params.q && params.q.trim()) urlParams.set('q', params.q.trim());
    return urlParams.toString() ? `/explore?${urlParams.toString()}` : '/explore';
  }

  it('builds canonical search URLs for single and combined discovery dimensions', () => {
    expect(constructExploreUrl({})).toBe('/explore');
    expect(constructExploreUrl({ vibe: 'music' })).toBe('/explore?vibe=music');
    expect(constructExploreUrl({ country: 'JAM' })).toBe('/explore?country=JAM');
    expect(constructExploreUrl({ vibe: 'food', country: 'JAM', hub: 'Brooklyn', q: 'jerk' })).toBe(
      '/explore?vibe=food&country=JAM&hub=Brooklyn&q=jerk'
    );
  });
});
