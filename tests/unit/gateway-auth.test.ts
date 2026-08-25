import { describe, it, expect } from 'vitest';
import {
  CARIBBEAN_TERRITORIES,
  SOVEREIGN_CARIBBEAN,
  CARIBBEAN_TERRITORIES_BY_ISO,
} from '../../apps/web/src/lib/constants/caribbean-territories';
import {
  DIASPORA_COUNTRIES,
  DIASPORA_CITY_HUBS,
  DIASPORA_BY_REGION,
} from '../../apps/web/src/lib/constants/diaspora-hubs';

describe('Antilia Gateway — Caribbean & Diaspora Constants', () => {
  it('contains all required sovereign Caribbean states and overseas territories', () => {
    expect(CARIBBEAN_TERRITORIES.length).toBeGreaterThanOrEqual(30);

    const isos = CARIBBEAN_TERRITORIES.map((t) => t.iso);
    // Key nations must be present
    expect(isos).toContain('JAM'); // Jamaica
    expect(isos).toContain('TTO'); // Trinidad & Tobago
    expect(isos).toContain('DOM'); // Dominican Republic
    expect(isos).toContain('BRB'); // Barbados
    expect(isos).toContain('HTI'); // Haiti
    expect(isos).toContain('BHS'); // Bahamas
    expect(isos).toContain('CUB'); // Cuba
    expect(isos).toContain('PRI'); // Puerto Rico
    expect(isos).toContain('GUY'); // Guyana
    expect(isos).toContain('SUR'); // Suriname
    expect(isos).toContain('BLZ'); // Belize
    expect(isos).toContain('LCA'); // Saint Lucia
    expect(isos).toContain('GRD'); // Grenada
    expect(isos).toContain('ATG'); // Antigua & Barbuda
    expect(isos).toContain('DMA'); // Dominica
    expect(isos).toContain('VCT'); // St. Vincent
    expect(isos).toContain('KNA'); // St. Kitts & Nevis
    expect(isos).toContain('TCA'); // Turks & Caicos
    expect(isos).toContain('CYM'); // Cayman Islands
    expect(isos).toContain('ABW'); // Aruba
    expect(isos).toContain('CUW'); // Curaçao
    expect(isos).toContain('BES'); // Bonaire
    expect(isos).toContain('GLP'); // Guadeloupe
    expect(isos).toContain('MTQ'); // Martinique
    expect(isos).toContain('SXM'); // Sint Maarten
    expect(isos).toContain('AIA'); // Anguilla
    expect(isos).toContain('VIR'); // US Virgin Islands
    expect(isos).toContain('VGB'); // British Virgin Islands
    expect(isos).toContain('MSR'); // Montserrat
    expect(isos).toContain('GUF'); // French Guiana
    expect(isos).toContain('PAN'); // Panama
    expect(isos).toContain('COL'); // Colombia (Caribbean)
  });

  it('verifies sovereign vs dependency territory partitioning', () => {
    expect(SOVEREIGN_CARIBBEAN.length).toBeGreaterThan(10);
    const jamaica = CARIBBEAN_TERRITORIES_BY_ISO['JAM'];
    expect(jamaica).toBeDefined();
    expect(jamaica.sovereign).toBe(true);
    expect(jamaica.flag).toBe('🇯🇲');

    const martinique = CARIBBEAN_TERRITORIES_BY_ISO['MTQ'];
    expect(martinique).toBeDefined();
    expect(martinique.sovereign).toBe(false);
    expect(martinique.flag).toBe('🇲🇶');
  });

  it('provides comprehensive diaspora coverage across regions', () => {
    expect(DIASPORA_COUNTRIES.length).toBeGreaterThanOrEqual(25);
    expect(DIASPORA_CITY_HUBS.length).toBeGreaterThanOrEqual(10);

    const diasporaIsos = DIASPORA_COUNTRIES.map((c) => c.iso);
    expect(diasporaIsos).toContain('USA');
    expect(diasporaIsos).toContain('CAN');
    expect(diasporaIsos).toContain('GBR');
    expect(diasporaIsos).toContain('NLD');
    expect(diasporaIsos).toContain('FRA');

    expect(DIASPORA_BY_REGION['north_america']).toBeDefined();
    expect(DIASPORA_BY_REGION['europe']).toBeDefined();
  });

  it('validates username regex rules (3-30 chars, alphanumeric, underscore, dot)', () => {
    const validUsernames = ['danieljwilliams', 'karene_reid', 'soca.king', 'carlos99', 'carib_user'];
    const invalidUsernames = ['ab', 'a'.repeat(31), 'user@name', 'user-name!', 'with space'];

    const regex = /^[a-zA-Z0-9_.]{3,30}$/;

    for (const valid of validUsernames) {
      expect(regex.test(valid)).toBe(true);
    }

    for (const invalid of invalidUsernames) {
      expect(regex.test(invalid)).toBe(false);
    }
  });
});
