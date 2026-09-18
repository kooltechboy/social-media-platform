import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import robots from '../../apps/web/src/app/robots';
import sitemap from '../../apps/web/src/app/sitemap';
import { metadata } from '../../apps/web/src/app/layout';

describe('TUKUBI Public Front Door, SEO & Social Discovery Suite', () => {
  const webRoot = path.resolve(process.cwd(), 'apps/web');

  describe('1. robots.ts Crawl Policy Integrity', () => {
    it('returns a valid Robots config with sitemap declaration', () => {
      const result = robots();
      expect(result.sitemap).toBe('https://www.tukubi.com/sitemap.xml');
      expect(Array.isArray(result.rules) || typeof result.rules === 'object').toBe(true);
    });

    it('allows public access to all core Caribbean discovery surfaces', () => {
      const result = robots();
      const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
      const allowed = Array.isArray(rules?.allow) ? rules.allow : [rules?.allow];

      expect(allowed).toContain('/');
      expect(allowed).toContain('/explore');
      expect(allowed).toContain('/map');
      expect(allowed).toContain('/sounds');
      expect(allowed).toContain('/podcasts');
      expect(allowed).toContain('/marketplace');
      expect(allowed).toContain('/events');
      expect(allowed).toContain('/pages');
      expect(allowed).toContain('/reels');
      expect(allowed).toContain('/signup');
      expect(allowed).toContain('/login');
    });

    it('strictly disallows private, sensitive, and financial surfaces from indexing', () => {
      const result = robots();
      const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
      const disallowed = Array.isArray(rules?.disallow) ? rules.disallow : [rules?.disallow];

      expect(disallowed).toContain('/api/');
      expect(disallowed).toContain('/settings');
      expect(disallowed).toContain('/financial-center');
      expect(disallowed).toContain('/messages');
      expect(disallowed).toContain('/notifications');
      expect(disallowed).toContain('/admin');
      expect(disallowed).toContain('/moderation');
      expect(disallowed).toContain('/merchant');
      expect(disallowed).toContain('/creator-studio');
    });
  });

  describe('2. sitemap.ts Discovery Indexing Integrity', () => {
    it('generates canonical sitemap routes with proper priority hierarchy', () => {
      const routes = sitemap();
      expect(Array.isArray(routes)).toBe(true);
      expect(routes.length).toBeGreaterThanOrEqual(10);

      const rootRoute = routes.find((r) => r.url === 'https://www.tukubi.com');
      expect(rootRoute).toBeDefined();
      expect(rootRoute?.priority).toBe(1.0);
      expect(rootRoute?.changeFrequency).toBe('daily');

      const exploreRoute = routes.find((r) => r.url === 'https://www.tukubi.com/explore');
      expect(exploreRoute).toBeDefined();
      expect(exploreRoute?.priority).toBe(0.9);

      const mapRoute = routes.find((r) => r.url === 'https://www.tukubi.com/map');
      expect(mapRoute).toBeDefined();
      expect(mapRoute?.priority).toBe(0.9);

      const soundsRoute = routes.find((r) => r.url === 'https://www.tukubi.com/sounds');
      expect(soundsRoute).toBeDefined();

      const podcastsRoute = routes.find((r) => r.url === 'https://www.tukubi.com/podcasts');
      expect(podcastsRoute).toBeDefined();

      const marketplaceRoute = routes.find((r) => r.url === 'https://www.tukubi.com/marketplace');
      expect(marketplaceRoute).toBeDefined();
    });
  });

  describe('3. Root Layout OpenGraph & Metadata Architecture', () => {
    it('specifies canonical metadataBase pointing to https://www.tukubi.com', () => {
      expect(metadata.metadataBase?.toString()).toBe('https://www.tukubi.com/');
    });

    it('enforces official brand tagline and core description', () => {
      expect(metadata.title).toBe('TUKUBI — The Caribbean Connected.');
      expect(metadata.description).toContain('The Caribbean Connected.');
      expect(metadata.description).toContain('Born in the Caribbean. Built for the World.');
    });

    it('configures Open Graph card with required social discovery attributes', () => {
      expect((metadata.openGraph as any)?.type).toBe('website');
      expect(metadata.openGraph?.siteName).toBe('TUKUBI');
      expect(metadata.openGraph?.title).toBe('TUKUBI — The Caribbean Connected.');
      expect(metadata.openGraph?.url?.toString()).toBe('https://www.tukubi.com');
      expect(metadata.openGraph?.images).toBeDefined();
    });

    it('configures Twitter summary_large_image card', () => {
      expect((metadata.twitter as any)?.card).toBe('summary_large_image');
      expect(metadata.twitter?.title).toBe('TUKUBI — The Caribbean Connected.');
    });

    it('sets canonical alternate path', () => {
      expect(metadata.alternates?.canonical).toBe('/');
    });
  });

  describe('4. PublicFrontDoor Component Visual & Cultural Authenticity', () => {
    const frontDoorPath = path.join(webRoot, 'src/components/public-front-door.tsx');

    it('exists and is saved in components directory', () => {
      expect(fs.existsSync(frontDoorPath)).toBe(true);
    });

    it('includes JSON-LD structured data script for WebSite and Organization', () => {
      const content = fs.readFileSync(frontDoorPath, 'utf-8');
      expect(content).toContain('application/ld+json');
      expect(content).toContain('TUKUBI');
      expect(content).toContain('https://www.tukubi.com');
      expect(content).toContain('The Caribbean Connected.');
    });

    it('contains the non-negotiable brand tagline and broader positioning', () => {
      const content = fs.readFileSync(frontDoorPath, 'utf-8');
      expect(content).toContain('The Caribbean Connected.');
      expect(content).toContain('Born in the Caribbean.');
      expect(content).toContain('Built for the World.');
    });

    it('features all 6 core product pillars without mock data', () => {
      const content = fs.readFileSync(frontDoorPath, 'utf-8');
      expect(content).toContain('Real Social Connection');
      expect(content).toContain('Caribbean Sounds &amp; Stems');
      expect(content).toContain('Caribbean Map &amp; Discovery');
      expect(content).toContain('Creators, Reels &amp; Podcasts');
      expect(content).toContain('Commerce &amp; Bespoke Stores');
      expect(content).toContain('Global Diaspora Hubs');
    });

    it('provides clear conversion CTAs to signup, login, and explore', () => {
      const content = fs.readFileSync(frontDoorPath, 'utf-8');
      expect(content).toContain('href="/signup"');
      expect(content).toContain('href="/login"');
      expect(content).toContain('href="/explore"');
    });
  });
});
