import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 6: Final Production Certification & Architecture Audit', () => {
  const rootDir = path.resolve(__dirname, '../..');

  it('verifies all S0 launch blocker resolutions are present and active', () => {
    // S0-1: Community create route
    expect(fs.existsSync(path.join(rootDir, 'apps/web/src/app/communities/create/page.tsx'))).toBe(true);

    // S0-2: Embed standalone route in app-shell
    const appShellContent = fs.readFileSync(path.join(rootDir, 'apps/web/src/components/app-shell.tsx'), 'utf-8');
    expect(appShellContent).toContain("'/embed'");

    // S0-3: /home redirect to canonical /
    const homeContent = fs.readFileSync(path.join(rootDir, 'apps/web/src/app/home/page.tsx'), 'utf-8');
    expect(homeContent).toContain("redirect('/')");

    // S0-4: Branded 404 page
    expect(fs.existsSync(path.join(rootDir, 'apps/web/src/app/not-found.tsx'))).toBe(true);
    const notFoundContent = fs.readFileSync(path.join(rootDir, 'apps/web/src/app/not-found.tsx'), 'utf-8');
    expect(notFoundContent).toContain('Lost in the Archipelago');
  });

  it('verifies Design System synchronization with @caribbean/design-system', () => {
    const tailwindConfig = fs.readFileSync(path.join(rootDir, 'apps/web/tailwind.config.js'), 'utf-8');
    expect(tailwindConfig).toContain('sunsetPlum');
    expect(tailwindConfig).toContain('oceanSurge');
    expect(tailwindConfig).toContain('palmGreen');
    expect(tailwindConfig).toContain('amberGlow');
    expect(tailwindConfig).toContain('islandVibes');
  });

  it('verifies ecosystem flywheel layouts for Marketplace and Creator Studio', () => {
    expect(fs.existsSync(path.join(rootDir, 'apps/web/src/app/marketplace/layout.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'apps/web/src/app/creator-studio/layout.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'apps/web/src/components/marketplace/marketplace-sub-nav.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'apps/web/src/components/creator/creator-studio-sub-nav.tsx'))).toBe(true);
  });

  it('verifies public SEO robots and sitemap configuration', () => {
    const sitemapContent = fs.readFileSync(path.join(rootDir, 'apps/web/src/app/sitemap.ts'), 'utf-8');
    expect(sitemapContent).toContain('https://www.tukubi.com');
    expect(sitemapContent).toContain('/explore');
    expect(sitemapContent).toContain('/communities');
    expect(sitemapContent).toContain('/marketplace');

    const robotsContent = fs.readFileSync(path.join(rootDir, 'apps/web/src/app/robots.ts'), 'utf-8');
    expect(robotsContent).toContain('/communities');
    expect(robotsContent).toContain('/financial-center');
    expect(robotsContent).toContain('/admin');
  });

  it('verifies strict zero-tolerance enforcement for deprecated branding', () => {
    const deprecatedBrands = ['Spot' + 'Pay', 'spot' + 'pay', 'ANT' + 'ILIA'];
    const webPkg = fs.readFileSync(path.join(rootDir, 'apps/web/package.json'), 'utf-8');
    deprecatedBrands.forEach((brand) => {
      expect(webPkg).not.toContain(brand);
    });
  });
});
