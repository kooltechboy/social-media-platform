import { describe, it, expect } from 'vitest';
import {
  CARIBBEAN_GEO_ENTITIES,
  CARIBBEAN_GEO_BY_ISO,
  type CaribbeanGeoEntity,
} from '../../apps/web/src/lib/constants/caribbean-geography';
import { CARIBBEAN_TERRITORIES } from '../../apps/web/src/lib/constants/caribbean-territories';

describe('Caribbean Geospatial Taxonomy & Canonical Registry', () => {
  it('covers all Caribbean sovereign nations, territories, and diaspora hubs', () => {
    expect(CARIBBEAN_GEO_ENTITIES.length).toBeGreaterThanOrEqual(35);

    // Verify all canonical territories from CARIBBEAN_TERRITORIES are accounted for
    for (const territory of CARIBBEAN_TERRITORIES) {
      const geo = CARIBBEAN_GEO_BY_ISO[territory.iso];
      expect(geo, `Territory ${territory.iso} (${territory.name}) should exist in geography registry`).toBeDefined();
      expect(geo.flag).toBe(territory.flag);
      expect(geo.iso).toBe(territory.iso);
    }
  });

  it('validates coordinate boundaries and canvas rendering specs for all entities', () => {
    for (const entity of CARIBBEAN_GEO_ENTITIES) {
      // Must have valid ISO code format (3 uppercase letters)
      expect(entity.iso).toMatch(/^[A-Z]{3}$/);

      // Must have valid names and capitals
      expect(entity.name.length).toBeGreaterThan(0);
      expect(entity.shortName.length).toBeGreaterThan(0);
      expect(entity.capital.length).toBeGreaterThan(0);
      expect(entity.flag.length).toBeGreaterThan(0);

      // Must be within the 1000x750 SVG viewport
      expect(entity.x).toBeGreaterThanOrEqual(20);
      expect(entity.x).toBeLessThanOrEqual(980);
      expect(entity.y).toBeGreaterThanOrEqual(15);
      expect(entity.y).toBeLessThanOrEqual(720);

      // Must have a valid interaction radius and stats
      expect(entity.r).toBeGreaterThanOrEqual(4);
      expect(entity.creatorsCount.length).toBeGreaterThan(0);
      expect(entity.businessesCount.length).toBeGreaterThan(0);
      expect(entity.eventsCount.length).toBeGreaterThan(0);
      expect(entity.activeLive).toBeGreaterThanOrEqual(0);
      expect(entity.trendingTag.startsWith('#')).toBe(true);
      expect(entity.summary.length).toBeGreaterThan(20);
    }
  });

  it('verifies regional groupings are balanced and geographically sound', () => {
    const validRegions = [
      'Greater Antilles',
      'Lesser Antilles (Leeward)',
      'Lesser Antilles (Windward)',
      'Southern Caribbean & ABC',
      'Guianas & Mainland Coast',
      'Diaspora Hub',
    ];

    for (const entity of CARIBBEAN_GEO_ENTITIES) {
      expect(validRegions).toContain(entity.region);
    }

    const greaterAntilles = CARIBBEAN_GEO_ENTITIES.filter((e) => e.region === 'Greater Antilles');
    const leeward = CARIBBEAN_GEO_ENTITIES.filter((e) => e.region === 'Lesser Antilles (Leeward)');
    const windward = CARIBBEAN_GEO_ENTITIES.filter((e) => e.region === 'Lesser Antilles (Windward)');
    const southern = CARIBBEAN_GEO_ENTITIES.filter((e) => e.region === 'Southern Caribbean & ABC');
    const diaspora = CARIBBEAN_GEO_ENTITIES.filter((e) => e.region === 'Diaspora Hub');

    expect(greaterAntilles.length).toBeGreaterThanOrEqual(6);
    expect(leeward.length).toBeGreaterThanOrEqual(7);
    expect(windward.length).toBeGreaterThanOrEqual(5);
    expect(southern.length).toBeGreaterThanOrEqual(4);
    expect(diaspora.length).toBeGreaterThanOrEqual(6);
  });

  it('validates diaspora hub flight connection links resolve to valid Caribbean island ISOs', () => {
    const diasporaHubs = CARIBBEAN_GEO_ENTITIES.filter((e) => e.region === 'Diaspora Hub');
    for (const hub of diasporaHubs) {
      expect(hub.diasporaLinks).toBeDefined();
      expect(hub.diasporaLinks!.length).toBeGreaterThanOrEqual(2);
      for (const targetIso of hub.diasporaLinks!) {
        const targetEntity = CARIBBEAN_GEO_BY_ISO[targetIso];
        expect(targetEntity, `Diaspora link ${targetIso} in ${hub.name} should exist`).toBeDefined();
      }
    }
  });
});

describe('Map Deep-Linking and URL Route Integrity', () => {
  function generateTerritoryExploreUrl(iso: string): string {
    return `/explore?country=${encodeURIComponent(iso)}`;
  }

  function generateTerritoryEventsUrl(shortName: string): string {
    return `/events?city=${encodeURIComponent(shortName)}`;
  }

  function generateTerritoryCommunityUrl(iso: string): string {
    return `/communities?country=${encodeURIComponent(iso)}`;
  }

  it('generates deterministic and valid deep links for every Caribbean territory', () => {
    for (const entity of CARIBBEAN_GEO_ENTITIES) {
      const exploreUrl = generateTerritoryExploreUrl(entity.iso);
      const eventsUrl = generateTerritoryEventsUrl(entity.shortName);
      const communityUrl = generateTerritoryCommunityUrl(entity.iso);

      expect(exploreUrl).toBe(`/explore?country=${entity.iso}`);
      expect(eventsUrl.startsWith('/events?city=')).toBe(true);
      expect(communityUrl).toBe(`/communities?country=${entity.iso}`);
    }
  });
});
