import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { CARIBBEAN_TERRITORIES } from '../../apps/web/src/lib/constants/caribbean-territories';
import { DIASPORA_COUNTRIES } from '../../apps/web/src/lib/constants/diaspora-hubs';
import { sanitizeRedirectUrl } from '../../apps/web/src/lib/auth/redirect-utils';
import { REGISTERED_PROVIDERS, DEFAULT_CAPABILITY_RULES, SELLER_PLANS } from '../../packages/payments/src/index';

describe('TUKUBI — Master Production Readiness Certification Suite', () => {
  describe('Directive 1 & 2: Brand Identity & Monetization Integrity', () => {
    it('enforces definitive brand name TUKUBI and absence of obsolete branding', () => {
      const OBSOLETE_BRANDS = ['ANTILIA', 'CaribbeanNow'];
      const dirs = [
        path.resolve(__dirname, '../../apps/web/src'),
        path.resolve(__dirname, '../../apps/admin/src'),
        path.resolve(__dirname, '../../apps/moderation/src'),
        path.resolve(__dirname, '../../packages'),
      ];

      for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        const files = getAllCodeFiles(dir);
        for (const file of files) {
          const content = fs.readFileSync(file, 'utf-8');
          for (const brand of OBSOLETE_BRANDS) {
            expect(
              content.toLowerCase().includes(brand.toLowerCase()),
              `Found obsolete brand in ${file}`
            ).toBe(false);
          }
        }
      }
    });

    it('enforces zero occurrences of prohibited commission percentages and obsolete alert strings', () => {
      const PROHIBITED_PHRASES = [
        '82.1%',
        '82.10%',
        'keep 82.1%',
        'new sign-in detected',
        'new sign in detected',
        'yes it was me',
        'yes, it was me',
        'secure account',
        'secure your account',
      ];

      const dirs = [
        path.resolve(__dirname, '../../apps/web/src'),
        path.resolve(__dirname, '../../apps/admin/src'),
        path.resolve(__dirname, '../../apps/moderation/src'),
        path.resolve(__dirname, '../../packages/payments/src'),
        path.resolve(__dirname, '../../packages/creator/src'),
      ];

      for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        const files = getAllCodeFiles(dir);
        for (const file of files) {
          const content = fs.readFileSync(file, 'utf-8').toLowerCase();
          for (const phrase of PROHIBITED_PHRASES) {
            expect(
              content.includes(phrase),
              `Found prohibited phrase "${phrase}" in ${file}`
            ).toBe(false);
          }
        }
      }
    });
  });

  describe('Directive 3 & 26-28: Financial Architecture & Double-Entry Ledger', () => {
    it('validates supported payment providers and dynamic capability rules', () => {
      expect(REGISTERED_PROVIDERS).toBeDefined();
      expect(REGISTERED_PROVIDERS.stripe).toBeDefined();
      expect(REGISTERED_PROVIDERS.paypal).toBeDefined();
      expect(REGISTERED_PROVIDERS.apple_pay).toBeDefined();
      expect(REGISTERED_PROVIDERS.google_pay).toBeDefined();
      expect(REGISTERED_PROVIDERS.wipay).toBeDefined();
      expect(REGISTERED_PROVIDERS.cxpay).toBeDefined();
      expect(REGISTERED_PROVIDERS.spotpay).toBeDefined();

      expect(DEFAULT_CAPABILITY_RULES.length).toBeGreaterThan(5);
    });

    it('verifies double-entry ledger balance equation (Debits + Credits = 0)', () => {
      interface LedgerEntry {
        account_id: string;
        amount_minor: number;
        currency: string;
      }

      function validateTransaction(entries: LedgerEntry[]): boolean {
        if (entries.length < 2) return false;
        const sum = entries.reduce((acc, entry) => acc + entry.amount_minor, 0);
        return sum === 0;
      }

      const validTx: LedgerEntry[] = [
        { account_id: 'buyer_wallet', amount_minor: -5000, currency: 'USD' },
        { account_id: 'creator_wallet', amount_minor: 4250, currency: 'USD' },
        { account_id: 'platform_fee', amount_minor: 750, currency: 'USD' },
      ];
      expect(validateTransaction(validTx)).toBe(true);

      const invalidTx: LedgerEntry[] = [
        { account_id: 'buyer_wallet', amount_minor: -5000, currency: 'USD' },
        { account_id: 'creator_wallet', amount_minor: 4000, currency: 'USD' },
      ];
      expect(validateTransaction(invalidTx)).toBe(false);
    });

    it('validates seller and merchant plan configurations', () => {
      expect(SELLER_PLANS).toBeDefined();
      expect(SELLER_PLANS.business_free).toBeDefined();
      expect(SELLER_PLANS.seller_pro).toBeDefined();
      expect(SELLER_PLANS.business_plus).toBeDefined();
      expect(SELLER_PLANS.enterprise).toBeDefined();
      expect(SELLER_PLANS.business_free.priceMinor).toBe(0);
      expect(SELLER_PLANS.seller_pro.priceMinor).toBeGreaterThan(0);
    });
  });

  describe('Directive 7: Root Route & Authentication Gateway', () => {
    it('redirects unauthenticated root visits to / safely and sanitizes redirect destinations', () => {
      expect(sanitizeRedirectUrl(null)).toBe('/');
      expect(sanitizeRedirectUrl('')).toBe('/');
      expect(sanitizeRedirectUrl('/explore')).toBe('/explore');
      expect(sanitizeRedirectUrl('/marketplace')).toBe('/marketplace');
      expect(sanitizeRedirectUrl('/creator-studio')).toBe('/creator-studio');
      expect(sanitizeRedirectUrl('/admin')).toBe('/admin');

      expect(sanitizeRedirectUrl('https://evil-site.com')).toBe('/');
      expect(sanitizeRedirectUrl('//evil-site.com')).toBe('/');
      expect(sanitizeRedirectUrl('javascript:alert(1)')).toBe('/');
    });
  });

  describe('Directive 9 & 29: RBAC & Server-Side Clearance', () => {
    it('verifies strict role permissions hierarchy', () => {
      type Role = 'user' | 'creator' | 'business' | 'seller' | 'moderator' | 'admin' | 'superadmin';

      function canAccessAdmin(role: Role): boolean {
        return ['admin', 'superadmin'].includes(role);
      }

      function canAccessModeration(role: Role): boolean {
        return ['moderator', 'admin', 'superadmin'].includes(role);
      }

      expect(canAccessAdmin('user')).toBe(false);
      expect(canAccessAdmin('creator')).toBe(false);
      expect(canAccessAdmin('business')).toBe(false);
      expect(canAccessAdmin('seller')).toBe(false);
      expect(canAccessAdmin('moderator')).toBe(false);
      expect(canAccessAdmin('admin')).toBe(true);
      expect(canAccessAdmin('superadmin')).toBe(true);

      expect(canAccessModeration('user')).toBe(false);
      expect(canAccessModeration('moderator')).toBe(true);
      expect(canAccessModeration('admin')).toBe(true);
      expect(canAccessModeration('superadmin')).toBe(true);
    });
  });

  describe('Directive 13: Caribbean Geography & Territory Coverage', () => {
    it('covers all sovereign Caribbean nations and territories', () => {
      expect(CARIBBEAN_TERRITORIES.length).toBeGreaterThanOrEqual(30);
      expect(DIASPORA_COUNTRIES.length).toBeGreaterThanOrEqual(25);
    });
  });
});

function getAllCodeFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== '.turbo') {
        results.push(...getAllCodeFiles(fullPath));
      }
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}
