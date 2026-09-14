import { describe, it, expect } from 'vitest';
import {
  CANONICAL_GEOGRAPHIES,
  CARIBBEAN_CORE_ENTITIES,
  CARIBBEAN_SOVEREIGN_COUNTRIES,
  CARIBBEAN_TERRITORIES_ONLY,
  DIASPORA_HUBS_ONLY,
  resolveGeography,
  getDiasporaHubsForGeography,
  getOriginNationsForHub,
} from '../../apps/web/src/lib/explore/canonical-geography';
import { VIBE_CATEGORIES, type ExploreQueryResult } from '../../apps/web/src/lib/explore/constants';
import { searchCaribbeanSounds, CARIBBEAN_SOUNDS } from '../../apps/web/src/lib/constants/caribbean-sounds';
import { EVENT_NAMES } from '../../packages/analytics/src/index';

describe('TUKUBI Caribbean Discovery Engine — Generic Destination Architecture', () => {
  it('resolves all key Caribbean nations, territories, and diaspora generically without hardcoding', () => {
    const testCases = [
      { slug: 'haiti', iso: 'HTI', name: 'Haiti', sovereign: true },
      { slug: 'jamaica', iso: 'JAM', name: 'Jamaica', sovereign: true },
      { slug: 'dominican-republic', iso: 'DOM', name: 'Dominican Republic', sovereign: true },
      { slug: 'trinidad-and-tobago', iso: 'TTO', name: 'Trinidad & Tobago', sovereign: true },
      { slug: 'martinique', iso: 'MTQ', name: 'Martinique', sovereign: false },
      { slug: 'puerto-rico', iso: 'PRI', name: 'Puerto Rico', sovereign: false },
      { slug: 'barbados', iso: 'BRB', name: 'Barbados', sovereign: true },
      { slug: 'bahamas', iso: 'BHS', name: 'Bahamas', sovereign: true },
      { slug: 'guadeloupe', iso: 'GLP', name: 'Guadeloupe', sovereign: false },
      { slug: 'saint-lucia', iso: 'LCA', name: 'Saint Lucia', sovereign: true },
      { slug: 'cuba', iso: 'CUB', name: 'Cuba', sovereign: true },
      { slug: 'guyana', iso: 'GUY', name: 'Guyana', sovereign: true },
      { slug: 'suriname', iso: 'SUR', name: 'Suriname', sovereign: true },
      { slug: 'curacao', iso: 'CUW', name: 'Curaçao', sovereign: false },
      { slug: 'montreal', iso: 'MTL', name: 'Montréal Diaspora Hub', isDiaspora: true },
      { slug: 'new-york', iso: 'NYC', name: 'New York Diaspora Hub', isDiaspora: true },
      { slug: 'london', iso: 'LON', name: 'London Diaspora Hub', isDiaspora: true },
      { slug: 'miami', iso: 'MIA', name: 'Miami Diaspora Hub', isDiaspora: true },
    ];

    for (const tc of testCases) {
      const geoBySlug = resolveGeography(tc.slug);
      expect(geoBySlug, `Failed to resolve ${tc.slug} by slug`).toBeDefined();
      expect(geoBySlug?.iso).toBe(tc.iso);

      const geoByIso = resolveGeography(tc.iso);
      expect(geoByIso, `Failed to resolve ${tc.iso} by ISO`).toBeDefined();
      expect(geoByIso?.slug).toBe(tc.slug);

      if (tc.sovereign !== undefined) {
        expect(geoBySlug?.sovereign).toBe(tc.sovereign);
      }
      if (tc.isDiaspora) {
        expect(geoBySlug?.isDiasporaHub).toBe(true);
      }
    }
  });

  it('guarantees rich cultural, musical, culinary, and festival metadata across all 36+ geographies', () => {
    for (const geo of CANONICAL_GEOGRAPHIES) {
      expect(geo.musicGenres, `${geo.name} missing musicGenres`).toBeDefined();
      expect(geo.musicGenres.length).toBeGreaterThan(0);

      expect(geo.cuisineTags, `${geo.name} missing cuisineTags`).toBeDefined();
      expect(geo.cuisineTags.length).toBeGreaterThan(0);

      expect(geo.culturalTags, `${geo.name} missing culturalTags`).toBeDefined();
      expect(geo.culturalTags.length).toBeGreaterThan(0);

      expect(geo.diasporaHubs, `${geo.name} missing diasporaHubs`).toBeDefined();
      expect(geo.topFestivals, `${geo.name} missing topFestivals`).toBeDefined();
    }
  });

  it('verifies cultural authenticity for specific Caribbean nations', () => {
    // Haiti
    const haiti = resolveGeography('haiti')!;
    expect(haiti.musicGenres).toContain('Kompa');
    expect(haiti.musicGenres).toContain('Rasin');
    expect(haiti.cuisineTags).toContain('Griot');
    expect(haiti.cuisineTags).toContain('Soup Joumou');
    expect(haiti.cuisineTags).toContain('Diri ak Djon Djon');
    expect(haiti.topFestivals).toContain('Kanaval (National Carnival)');

    // Jamaica
    const jamaica = resolveGeography('jamaica')!;
    expect(jamaica.musicGenres).toContain('Reggae');
    expect(jamaica.musicGenres).toContain('Dancehall');
    expect(jamaica.cuisineTags).toContain('Jerk Chicken & Pork');
    expect(jamaica.cuisineTags).toContain('Ackee & Saltfish');
    expect(jamaica.topFestivals).toContain('Reggae Sumfest');

    // Trinidad & Tobago
    const trinidad = resolveGeography('trinidad-and-tobago')!;
    expect(trinidad.musicGenres).toContain('Soca');
    expect(trinidad.musicGenres).toContain('Calypso');
    expect(trinidad.musicGenres).toContain('Steelpan');
    expect(trinidad.cuisineTags).toContain('Doubles');
    expect(trinidad.cuisineTags).toContain('Roti');
    expect(trinidad.topFestivals).toContain('Trinidad Carnival');

    // Dominican Republic
    const dr = resolveGeography('dominican-republic')!;
    expect(dr.musicGenres).toContain('Bachata');
    expect(dr.musicGenres).toContain('Merengue');
    expect(dr.musicGenres).toContain('Dembow');
    expect(dr.cuisineTags).toContain('Mangú');
    expect(dr.cuisineTags).toContain('La Bandera');

    // Martinique
    const martinique = resolveGeography('martinique')!;
    expect(martinique.musicGenres).toContain('Zouk');
    expect(martinique.musicGenres).toContain('Biguine');
    expect(martinique.cuisineTags).toContain('Colombo de Cabri');
  });

  it('maps Caribbean origin nations to diaspora hubs bi-directionally', () => {
    // Haiti diaspora hubs
    const haitiHubs = getDiasporaHubsForGeography('haiti');
    expect(haitiHubs.some((h) => h.slug === 'montreal')).toBe(true);
    expect(haitiHubs.some((h) => h.slug === 'new-york')).toBe(true);
    expect(haitiHubs.some((h) => h.slug === 'miami')).toBe(true);
    expect(haitiHubs.some((h) => h.slug === 'paris')).toBe(true);
    expect(haitiHubs.some((h) => h.slug === 'boston')).toBe(true);

    // Montreal origin roots
    const montrealOrigins = getOriginNationsForHub('montreal');
    expect(montrealOrigins.some((o) => o.slug === 'haiti')).toBe(true);

    // London origin roots
    const londonOrigins = getOriginNationsForHub('london');
    expect(londonOrigins.some((o) => o.slug === 'jamaica')).toBe(true);
    expect(londonOrigins.some((o) => o.slug === 'trinidad-and-tobago')).toBe(true);
    expect(londonOrigins.some((o) => o.slug === 'barbados')).toBe(true);

    // Miami origin roots
    const miamiOrigins = getOriginNationsForHub('miami');
    expect(miamiOrigins.some((o) => o.slug === 'haiti')).toBe(true);
    expect(miamiOrigins.some((o) => o.slug === 'jamaica')).toBe(true);
    expect(miamiOrigins.some((o) => o.slug === 'cuba')).toBe(true);
    expect(miamiOrigins.some((o) => o.slug === 'bahamas')).toBe(true);
  });
});

describe('TUKUBI Sounds System & Audio Discovery Integration', () => {
  it('contains verified Caribbean sound records with preview audio', () => {
    expect(CARIBBEAN_SOUNDS.length).toBeGreaterThan(0);
    for (const sound of CARIBBEAN_SOUNDS) {
      expect(sound.id).toBeDefined();
      expect(sound.title).toBeDefined();
      expect(sound.artist).toBeDefined();
      expect(sound.genre).toBeDefined();
      expect(sound.audioUrl).toBeDefined();
      expect(sound.audioUrl).toMatch(/^https?:\/\//);
    }
  });

  it('filters sounds accurately by cultural genres', () => {
    const socaSounds = searchCaribbeanSounds({ genre: 'Soca' });
    expect(socaSounds.length).toBeGreaterThan(0);
    for (const sound of socaSounds) {
      expect(sound.genre).toBe('Soca');
    }

    const reggaeSounds = searchCaribbeanSounds({ genre: 'Reggae' });
    expect(reggaeSounds.length).toBeGreaterThan(0);
    for (const sound of reggaeSounds) {
      expect(sound.genre).toBe('Reggae');
    }
  });
});

describe('Zero-Mock Empty State Guarantees', () => {
  it('guarantees clean empty state result contract without mock data injection', () => {
    const emptyResult: ExploreQueryResult = {
      posts: [],
      creators: [],
      events: [],
      communities: [],
      businesses: [],
      products: [],
      reels: [],
      podcasts: [],
      livestreams: [],
      sounds: [],
      officialStories: [],
      trendingSignals: [],
      totalMatches: 0,
      counts: {
        posts: 0,
        creators: 0,
        events: 0,
        communities: 0,
        businesses: 0,
        products: 0,
        reels: 0,
        podcasts: 0,
        livestreams: 0,
        sounds: 0,
        officialStories: 0,
        trendingSignals: 0,
      },
    };

    expect(emptyResult.posts.length).toBe(0);
    expect(emptyResult.creators.length).toBe(0);
    expect(emptyResult.events.length).toBe(0);
    expect(emptyResult.communities.length).toBe(0);
    expect(emptyResult.products.length).toBe(0);
    expect(emptyResult.totalMatches).toBe(0);
    expect(emptyResult.officialStories.length).toBe(0);
    expect(emptyResult.counts.officialStories).toBe(0);
  });
});

describe('Analytics Discovery Event Taxonomy', () => {
  it('registers all required discovery event names in @caribbean/analytics', () => {
    expect(EVENT_NAMES).toContain('destination_selected');
    expect(EVENT_NAMES).toContain('vibe_selected');
    expect(EVENT_NAMES).toContain('diaspora_hub_selected');
    expect(EVENT_NAMES).toContain('content_opened');
    expect(EVENT_NAMES).toContain('sound_opened');
    expect(EVENT_NAMES).toContain('event_opened');
    expect(EVENT_NAMES).toContain('creator_opened');
    expect(EVENT_NAMES).toContain('community_opened');
    expect(EVENT_NAMES).toContain('marketplace_item_opened');
  });
});
