import { describe, it, expect } from 'vitest';
import {
  CANONICAL_GEOGRAPHIES,
  GEOGRAPHIES_BY_ISO,
  GEOGRAPHIES_BY_SLUG,
  CARIBBEAN_CORE_ENTITIES,
  CARIBBEAN_SOVEREIGN_COUNTRIES,
  CARIBBEAN_TERRITORIES_ONLY,
  DIASPORA_HUBS_ONLY,
  resolveGeography,
} from '../../apps/web/src/lib/explore/canonical-geography';
import { VIBE_CATEGORIES } from '../../apps/web/src/lib/explore/constants';

describe('Canonical Caribbean Geography Master Data & Registry', () => {
  it('covers all Caribbean sovereign nations, territories, and diaspora metropolitan hubs', () => {
    expect(CANONICAL_GEOGRAPHIES.length).toBeGreaterThanOrEqual(35);
    expect(CARIBBEAN_SOVEREIGN_COUNTRIES.length).toBeGreaterThanOrEqual(15);
    expect(CARIBBEAN_TERRITORIES_ONLY.length).toBeGreaterThanOrEqual(14);
    expect(DIASPORA_HUBS_ONLY.length).toBeGreaterThanOrEqual(10);
  });

  it('guarantees unique, lowercase, URL-safe slugs for every geographic entity', () => {
    const slugSet = new Set<string>();
    for (const geo of CANONICAL_GEOGRAPHIES) {
      expect(geo.slug).toMatch(/^[a-z0-9-]+$/);
      expect(slugSet.has(geo.slug), `Duplicate slug detected: ${geo.slug}`).toBe(false);
      slugSet.add(geo.slug);
    }
  });

  it('guarantees valid 3-letter uppercase ISO codes for every entity', () => {
    const isoSet = new Set<string>();
    for (const geo of CANONICAL_GEOGRAPHIES) {
      expect(geo.iso).toMatch(/^[A-Z]{3}$/);
      expect(isoSet.has(geo.iso), `Duplicate ISO code detected: ${geo.iso}`).toBe(false);
      isoSet.add(geo.iso);
    }
  });

  it('resolves key Caribbean sovereign nations bi-directionally by slug and ISO code', () => {
    const jamBySlug = resolveGeography('jamaica');
    const jamByIso = resolveGeography('JAM');
    expect(jamBySlug).toBeDefined();
    expect(jamByIso).toBeDefined();
    expect(jamBySlug?.iso).toBe('JAM');
    expect(jamByIso?.slug).toBe('jamaica');
    expect(jamBySlug?.name).toBe('Jamaica');
    expect(jamBySlug?.sovereign).toBe(true);

    const domBySlug = resolveGeography('dominican-republic');
    const domByIso = resolveGeography('DOM');
    expect(domBySlug).toBeDefined();
    expect(domByIso).toBeDefined();
    expect(domBySlug?.iso).toBe('DOM');
    expect(domBySlug?.name).toBe('Dominican Republic');

    const ttoBySlug = resolveGeography('trinidad-and-tobago');
    const ttoByIso = resolveGeography('TTO');
    expect(ttoBySlug).toBeDefined();
    expect(ttoByIso?.name).toBe('Trinidad & Tobago');
  });

  it('resolves Caribbean island territories accurately', () => {
    const pri = resolveGeography('puerto-rico');
    expect(pri).toBeDefined();
    expect(pri?.iso).toBe('PRI');
    expect(pri?.sovereign).toBe(false);

    const cuw = resolveGeography('curacao');
    expect(cuw).toBeDefined();
    expect(cuw?.iso).toBe('CUW');

    const abw = resolveGeography('aruba');
    expect(abw).toBeDefined();
    expect(abw?.iso).toBe('ABW');

    const sxm = resolveGeography('sint-maarten');
    expect(sxm).toBeDefined();
    expect(sxm?.iso).toBe('SXM');
  });

  it('resolves global diaspora metropolitan hubs accurately', () => {
    const tor = resolveGeography('toronto');
    expect(tor).toBeDefined();
    expect(tor?.isDiasporaHub).toBe(true);
    expect(tor?.capital).toBe('Toronto');

    const mia = resolveGeography('miami');
    expect(mia).toBeDefined();
    expect(mia?.isDiasporaHub).toBe(true);

    const nyc = resolveGeography('new-york');
    expect(nyc).toBeDefined();
    expect(nyc?.isDiasporaHub).toBe(true);

    const lon = resolveGeography('london');
    expect(lon).toBeDefined();
    expect(lon?.isDiasporaHub).toBe(true);
  });

  it('resolves cultural search aliases for common vernacular expressions', () => {
    const rd = resolveGeography('rd');
    expect(rd?.iso).toBe('DOM');

    const ayiti = resolveGeography('ayiti');
    expect(ayiti?.iso).toBe('HTI');

    const caribana = resolveGeography('caribana');
    expect(caribana?.slug).toBe('toronto');

    const spiceIsle = resolveGeography('spice isle');
    expect(spiceIsle?.iso).toBe('GRD');

    const bajan = resolveGeography('bajan');
    expect(bajan?.iso).toBe('BRB');
  });

  it('validates canonical classification assignments', () => {
    const validClassifications = [
      'sovereign_state',
      'constituent_country',
      'dependent_territory',
      'special_municipality',
      'overseas_department',
      'coastal_region',
      'diaspora_hub',
    ];

    for (const geo of CANONICAL_GEOGRAPHIES) {
      expect(validClassifications).toContain(geo.type);
      if (geo.sovereign) {
        expect(['sovereign_state', 'coastal_region']).toContain(geo.type);
      }
    }
  });
});

describe('Zero Mock Data & Honest Count Integrity', () => {
  it('guarantees no mock count strings in canonical geography', () => {
    for (const geo of CANONICAL_GEOGRAPHIES) {
      expect((geo as any).creatorsCount).toBeUndefined();
      expect((geo as any).businessesCount).toBeUndefined();
      expect((geo as any).eventsCount).toBeUndefined();
      expect(geo.summary.length).toBeGreaterThan(15);
    }
  });

  it('ensures VIBE_CATEGORIES contains canonical IDs matching tests', () => {
    expect(VIBE_CATEGORIES.length).toBe(8);
    const ids = VIBE_CATEGORIES.map((v) => v.id);
    expect(ids).toContain('music');
    expect(ids).toContain('carnival');
    expect(ids).toContain('food');
    expect(ids).toContain('tech');
    expect(ids).toContain('fashion');
    expect(ids).toContain('nightlife');
    expect(ids).toContain('sports');
    expect(ids).toContain('travel');
  });
});
