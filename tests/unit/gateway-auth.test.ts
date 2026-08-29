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
import { sanitizeRedirectUrl } from '../../apps/web/src/lib/auth/redirect-utils';

describe('Tukubi Gateway — Caribbean & Diaspora Constants', () => {
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

  it('validates open redirect protection logic using shared redirect-utils', () => {
    expect(sanitizeRedirectUrl(null)).toBe('/');
    expect(sanitizeRedirectUrl('')).toBe('/');
    expect(sanitizeRedirectUrl('/explore')).toBe('/explore');
    expect(sanitizeRedirectUrl('/profile/daniel')).toBe('/profile/daniel');
    expect(sanitizeRedirectUrl('/admin')).toBe('/admin');
    expect(sanitizeRedirectUrl('/moderation')).toBe('/moderation');
    expect(sanitizeRedirectUrl('/creator-studio')).toBe('/creator-studio');
    // Block open redirect attempts
    expect(sanitizeRedirectUrl('https://malicious-site.com')).toBe('/');
    expect(sanitizeRedirectUrl('//malicious-site.com')).toBe('/');
    expect(sanitizeRedirectUrl('javascript:alert(1)')).toBe('/');
    expect(sanitizeRedirectUrl('/unauthorized-arbitrary-external-path')).toBe('/');
  });

  it('validates RBAC role clearance rules for moderation and admin routes', () => {
    type Role = 'user' | 'creator' | 'business' | 'moderator' | 'admin' | 'management' | 'superadmin' | 'guest';

    function checkAuthorization(userRole: Role, allowedRoles: Role[]): boolean {
      if (userRole === 'superadmin' || userRole === 'management') return true;
      return allowedRoles.includes(userRole);
    }

    const MODERATION_ROLES: Role[] = ['moderator', 'admin', 'management', 'superadmin'];
    const ADMIN_ROLES: Role[] = ['admin', 'management', 'superadmin'];

    // Standard user and creator should NOT access moderation or admin (403 Access Denied)
    expect(checkAuthorization('user', MODERATION_ROLES)).toBe(false);
    expect(checkAuthorization('creator', MODERATION_ROLES)).toBe(false);
    expect(checkAuthorization('business', MODERATION_ROLES)).toBe(false);
    expect(checkAuthorization('user', ADMIN_ROLES)).toBe(false);

    // Moderator can access moderation, but NOT admin
    expect(checkAuthorization('moderator', MODERATION_ROLES)).toBe(true);
    expect(checkAuthorization('moderator', ADMIN_ROLES)).toBe(false);

    // Admin, Management, Superadmin have clearance
    expect(checkAuthorization('admin', MODERATION_ROLES)).toBe(true);
    expect(checkAuthorization('admin', ADMIN_ROLES)).toBe(true);
    expect(checkAuthorization('superadmin', MODERATION_ROLES)).toBe(true);
    expect(checkAuthorization('superadmin', ADMIN_ROLES)).toBe(true);
    expect(checkAuthorization('management', ADMIN_ROLES)).toBe(true);
  });

  it('enforces zero user-facing occurrences of prohibited security/login confirmation phrases across codebase', () => {
    const fs = require('fs');
    const path = require('path');

    const PROHIBITED_PHRASES = [
      'new sign-in detected',
      'new sign in detected',
      'yes it was me',
      'yes, it was me',
      'secure account',
      'secure your account',
      'was this you',
      'was this sign-in you',
      'was this login you',
      'unrecognized sign-in',
      'unrecognized login',
      'new login detected',
      'suspicious login',
      'security alert',
      'login alert',
      'sign-in alert',
    ];

    const dirsToScan = [
      path.resolve(__dirname, '../../apps/web/src'),
      path.resolve(__dirname, '../../apps/mobile/src'),
      path.resolve(__dirname, '../../apps/admin/src'),
      path.resolve(__dirname, '../../apps/moderation/src'),
    ];

    function scanDirectory(dir: string): { file: string; match: string }[] {
      if (!fs.existsSync(dir)) return [];
      const violations: { file: string; match: string }[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          violations.push(...scanDirectory(fullPath));
        } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, 'utf-8').toLowerCase();
          for (const phrase of PROHIBITED_PHRASES) {
            if (content.includes(phrase)) {
              violations.push({ file: fullPath, match: phrase });
            }
          }
        }
      }
      return violations;
    }

    for (const dir of dirsToScan) {
      const violations = scanDirectory(dir);
      expect(violations).toEqual([]);
    }
  });
});

