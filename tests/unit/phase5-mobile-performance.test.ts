import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 5: Mobile & Performance Optimization', () => {
  const rootDir = path.resolve(__dirname, '../..');

  it('mobile nav implements full 5-tab bar with WCAG compliant 44px touch targets', () => {
    const filePath = path.join(rootDir, 'apps/web/src/components/mobile-nav.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 5 core tabs
    expect(content).toContain('aria-label="Home"');
    expect(content).toContain('aria-label="Feeds"');
    expect(content).toContain('aria-label="Create on TUKUBI"');
    expect(content).toContain('aria-label="Explore Caribbean"');
    expect(content).toContain('aria-label="Ecosystem Menu"');

    // WCAG touch targets (min-w-[44px] min-h-[44px])
    expect(content).toContain('min-w-[44px] min-h-[44px]');
  });

  it('mobile nav creation sheet covers all 9 Caribbean ecosystem creation actions', () => {
    const filePath = path.join(rootDir, 'apps/web/src/components/mobile-nav.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('href="/create"'); // Post
    expect(content).toContain('href="/reels"'); // Reel
    expect(content).toContain('href="/live"'); // Go Live
    expect(content).toContain('href="/events"'); // Event
    expect(content).toContain('href="/marketplace/seller-center/create"'); // Market
    expect(content).toContain('href="/communities/create"'); // Community
    expect(content).toContain('href="/pages/create"'); // Page
    expect(content).toContain('href="/podcasts"'); // Podcast
    expect(content).toContain('href="/sounds"'); // Sound
  });

  it('mobile nav ecosystem menu includes profile, identity switcher, and authenticated navigation', () => {
    const filePath = path.join(rootDir, 'apps/web/src/components/mobile-nav.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('IdentitySwitcher');
    expect(content).toContain('UserAvatar');
    expect(content).toContain('handleSignOut');
    expect(content).toContain('unreadMessagesCount');
  });

  it('app shell accommodates fixed mobile nav with safe bottom padding and responsive layout', () => {
    const filePath = path.join(rootDir, 'apps/web/src/components/app-shell.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Mobile nav included
    expect(content).toContain('<MobileNav />');

    // Main bottom padding prevents fixed bottom nav occlusion
    expect(content).toContain('pb-24 md:pb-6');

    // Sidebar hidden on mobile
    expect(content).toContain('hidden md:block');
  });

  it('app header provides accessible >= 44px touch targets on mobile viewports', () => {
    const filePath = path.join(rootDir, 'apps/web/src/components/app-header.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Mobile search button touch target
    expect(content).toMatch(/href="\/search"[\s\S]*?min-h-\[44px\] min-w-\[44px\]/);

    // Notifications touch target
    expect(content).toMatch(/href="\/notifications"[\s\S]*?min-h-\[44px\] min-w-\[44px\]/);

    // Messages touch target
    expect(content).toMatch(/href="\/messages"[\s\S]*?min-h-\[44px\] min-w-\[44px\]/);
  });

  it('universal composer adheres to WCAG touch targets and integrates camera modal', () => {
    const filePath = path.join(rootDir, 'apps/web/src/components/universal-composer.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('TukubiCameraModal');
    expect(content).toContain('min-h-[44px] min-w-[44px]');
  });
});
