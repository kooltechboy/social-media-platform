import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import robots from '../../apps/web/src/app/robots';
import sitemap from '../../apps/web/src/app/sitemap';
import { metadata } from '../../apps/web/src/app/layout';

describe('Phase 20 — SEO, Canonical Metadata & OpenGraph Certification', () => {
  const webRoot = path.resolve(process.cwd(), 'apps/web');

  // ===========================================================================
  // 1. Robots.txt Crawl Boundary Invariants
  // ===========================================================================
  describe('1. Robots.txt Search Engine Crawl Directives', () => {
    const robotConfig = robots();
    const rules = Array.isArray(robotConfig.rules) ? robotConfig.rules[0] : robotConfig.rules;
    const allowed = Array.isArray(rules?.allow) ? rules.allow : [rules?.allow];
    const disallowed = Array.isArray(rules?.disallow) ? rules.disallow : [rules?.disallow];

    it('points to authoritative XML sitemap location', () => {
      expect(robotConfig.sitemap).toBe('https://www.tukubi.com/sitemap.xml');
    });

    it('allows search crawlers access to public Caribbean social surfaces', () => {
      const publicSurfaces = [
        '/', '/explore', '/map', '/sounds', '/podcasts',
        '/marketplace', '/events', '/pages', '/reels', '/communities',
        '/terms', '/privacy', '/login', '/signup',
      ];
      publicSurfaces.forEach((route) => {
        expect(allowed).toContain(route);
      });
    });

    it('strictly shields private, financial, and privileged surfaces from crawlers', () => {
      const shieldedSurfaces = [
        '/api/', '/settings', '/financial-center', '/messages',
        '/notifications', '/admin', '/moderation', '/moderator',
        '/merchant', '/creator-studio',
      ];
      shieldedSurfaces.forEach((route) => {
        expect(disallowed).toContain(route);
      });
    });
  });

  // ===========================================================================
  // 2. Sitemap Dynamic Route Hierarchy
  // ===========================================================================
  describe('2. Sitemap XML Hierarchy & Change Frequencies', () => {
    const routes = sitemap();

    it('generates non-empty sitemap with required priority gradients', () => {
      expect(Array.isArray(routes)).toBe(true);
      expect(routes.length).toBeGreaterThanOrEqual(15);

      const root = routes.find((r) => r.url === 'https://www.tukubi.com');
      expect(root?.priority).toBe(1.0);
      expect(root?.changeFrequency).toBe('daily');

      const explore = routes.find((r) => r.url === 'https://www.tukubi.com/explore');
      expect(explore?.priority).toBe(0.9);

      const marketplace = routes.find((r) => r.url === 'https://www.tukubi.com/marketplace');
      expect(marketplace?.priority).toBe(0.8);
      expect(marketplace?.changeFrequency).toBe('hourly');
    });

    it('ensures every sitemap entry possesses a valid HTTPS absolute URL', () => {
      routes.forEach((route) => {
        expect(route.url.startsWith('https://www.tukubi.com')).toBe(true);
        expect(route.lastModified).toBeInstanceOf(Date);
      });
    });
  });

  // ===========================================================================
  // 3. OpenGraph, Twitter Cards & Canonical Link Tags
  // ===========================================================================
  describe('3. OpenGraph, Twitter & Canonical Metadata', () => {
    it('declares canonical metadataBase pointing to https://www.tukubi.com', () => {
      expect(metadata.metadataBase?.toString()).toBe('https://www.tukubi.com/');
    });

    it('defines brand title, descriptions, and keywords', () => {
      expect(metadata.title).toBe('TUKUBI — The Caribbean Connected.');
      expect(metadata.description).toContain('The Caribbean Connected.');
      expect(metadata.description).toContain('Born in the Caribbean. Built for the World.');
    });

    it('sets OpenGraph website type, siteName, and preview images', () => {
      expect((metadata.openGraph as any)?.type).toBe('website');
      expect(metadata.openGraph?.siteName).toBe('TUKUBI');
      expect(metadata.openGraph?.url?.toString()).toBe('https://www.tukubi.com');
      expect(metadata.openGraph?.images).toBeDefined();
    });

    it('configures Twitter summary_large_image card', () => {
      expect((metadata.twitter as any)?.card).toBe('summary_large_image');
      expect(metadata.twitter?.title).toBe('TUKUBI — The Caribbean Connected.');
    });

    it('specifies root canonical route alternate', () => {
      expect(metadata.alternates?.canonical).toBe('/');
    });
  });

  // ===========================================================================
  // 4. Schema.org JSON-LD Structured Data
  // ===========================================================================
  describe('4. Schema.org Structured Data & Front Door Validation', () => {
    it('verifies public-front-door.tsx contains WebSite and Organization JSON-LD markup', () => {
      const frontDoorPath = path.join(webRoot, 'src/components/public-front-door.tsx');
      expect(fs.existsSync(frontDoorPath)).toBe(true);

      const content = fs.readFileSync(frontDoorPath, 'utf-8');
      expect(content).toContain('application/ld+json');
      expect(content).toContain('WebSite');
      expect(content).toContain('Organization');
      expect(content).toContain('https://www.tukubi.com');
    });
  });
});
