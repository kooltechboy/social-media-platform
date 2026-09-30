import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

describe('Phase 4 — Mobile Experience & Screen Parity Production Certification', () => {
  const rootDir = join(__dirname, '../..');
  const mobileScreensDir = join(rootDir, 'apps/mobile/src/screens');
  const mobileAppPath = join(rootDir, 'apps/mobile/App.tsx');
  const webMobileNavPath = join(rootDir, 'apps/web/src/components/mobile-nav.tsx');

  // ===========================================================================
  // 1. Universal Expo React Native Screen Parity (17 Screens)
  // ===========================================================================
  describe('1. Universal Expo React Native Screen Inventory & Exports', () => {
    const ALL_17_SCREENS = [
      { file: 'HomeScreen.tsx', component: 'HomeScreen' },
      { file: 'ExploreScreen.tsx', component: 'ExploreScreen' },
      { file: 'CreateScreen.tsx', component: 'CreateScreen' },
      { file: 'MessagesScreen.tsx', component: 'MessagesScreen' },
      { file: 'ProfileScreen.tsx', component: 'ProfileScreen' },
      { file: 'AuthScreen.tsx', component: 'AuthScreen' },
      { file: 'ReelsScreen.tsx', component: 'ReelsScreen' },
      { file: 'CommunitiesScreen.tsx', component: 'CommunitiesScreen' },
      { file: 'FinancialCenterScreen.tsx', component: 'FinancialCenterScreen' },
      { file: 'NotificationsScreen.tsx', component: 'NotificationsScreen' },
      { file: 'MarketplaceScreen.tsx', component: 'MarketplaceScreen' },
      { file: 'SellProductScreen.tsx', component: 'SellProductScreen' },
      { file: 'SoundsScreen.tsx', component: 'SoundsScreen' },
      { file: 'LiveScreen.tsx', component: 'LiveScreen' },
      { file: 'PodcastsScreen.tsx', component: 'PodcastsScreen' },
      { file: 'FriendsScreen.tsx', component: 'FriendsScreen' },
      { file: 'FeedsScreen.tsx', component: 'FeedsScreen' },
    ];

    it('verifies all 17 React Native screen files exist in apps/mobile/src/screens', () => {
      expect(ALL_17_SCREENS).toHaveLength(17);
      for (const screen of ALL_17_SCREENS) {
        const filePath = join(mobileScreensDir, screen.file);
        expect(existsSync(filePath), `Missing mobile screen: ${screen.file}`).toBe(true);
      }
    });

    it('verifies every mobile screen exports its primary React component', () => {
      for (const screen of ALL_17_SCREENS) {
        const filePath = join(mobileScreensDir, screen.file);
        const content = readFileSync(filePath, 'utf-8');
        const hasExport =
          content.includes(`export function ${screen.component}`) ||
          content.includes(`export default function ${screen.component}`) ||
          content.includes(`export const ${screen.component}`);
        expect(hasExport, `Component ${screen.component} not exported in ${screen.file}`).toBe(true);
      }
    });

    it('verifies App.tsx imports and registers the complete screen fleet', () => {
      const appContent = readFileSync(mobileAppPath, 'utf-8');
      for (const screen of ALL_17_SCREENS) {
        expect(appContent).toContain(screen.component);
      }
    });

    it('verifies deep linking configuration supports universal app navigation', () => {
      const appContent = readFileSync(mobileAppPath, 'utf-8');
      expect(appContent).toContain("prefixes: ['tukubi://', 'https://tukubi.com']");
      expect(appContent).toContain('Home:');
      expect(appContent).toContain('Explore:');
      expect(appContent).toContain('Marketplace:');
      expect(appContent).toContain('Reels:');
      expect(appContent).toContain('Sounds:');
      expect(appContent).toContain('Live:');
      expect(appContent).toContain('Podcasts:');
      expect(appContent).toContain('Messages:');
      expect(appContent).toContain('Profile:');
      expect(appContent).toContain('Finance:');
      expect(appContent).toContain('Notifications:');
      expect(appContent).toContain('Friends:');
    });
  });

  // ===========================================================================
  // 2. Mobile Web Navigation & WCAG Touch Target Compliance
  // ===========================================================================
  describe('2. Mobile Web Navigation & WCAG Touch Targets', () => {
    it('verifies mobile navigation component exists and is readable', () => {
      expect(existsSync(webMobileNavPath)).toBe(true);
      const navContent = readFileSync(webMobileNavPath, 'utf-8');
      expect(navContent.length).toBeGreaterThan(1000);
    });

    it('enforces WCAG 2.2 AA minimum 44x44px touch targets across tabs and buttons', () => {
      const navContent = readFileSync(webMobileNavPath, 'utf-8');
      expect(navContent).toContain('min-w-[44px]');
      expect(navContent).toContain('min-h-[44px]');
    });

    it('implements tab navigation accessibility roles (tablist, tab, aria-selected)', () => {
      const navContent = readFileSync(webMobileNavPath, 'utf-8');
      expect(navContent).toContain('role="tablist"');
      expect(navContent).toContain('role="tab"');
      expect(navContent).toContain('aria-selected=');
      expect(navContent).toContain('aria-label=');
    });

    it('separates unread indicators for Messages vs Menu notifications', () => {
      const navContent = readFileSync(webMobileNavPath, 'utf-8');
      expect(navContent).toContain('unreadMessagesCount > 0');
      expect(navContent).toContain('unreadNotificationsCount > 0');
    });

    it('provides multi-destination creation bottom sheet with Caribbean categories', () => {
      const navContent = readFileSync(webMobileNavPath, 'utf-8');
      expect(navContent).toContain('Create on TUKUBI');
      expect(navContent).toContain('href="/create"');
      expect(navContent).toContain('href="/reels"');
      expect(navContent).toContain('href="/live"');
      expect(navContent).toContain('href="/events"');
      expect(navContent).toContain('href="/marketplace/seller-center/create"');
      expect(navContent).toContain('href="/communities/create"');
    });

    it('provides comprehensive ecosystem menu with studios, wallet, settings, and help', () => {
      const navContent = readFileSync(webMobileNavPath, 'utf-8');
      expect(navContent).toContain('href="/creator-studio"');
      expect(navContent).toContain('href="/financial-center"');
      expect(navContent).toContain('href="/settings"');
      expect(navContent).toContain('href="/help"');
      expect(navContent).toContain('href="/podcasts"');
      expect(navContent).toContain('href="/sounds"');
      expect(navContent).toContain('href="/map"');
    });
  });
});
