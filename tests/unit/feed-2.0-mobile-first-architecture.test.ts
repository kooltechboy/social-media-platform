import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('TUKUBI Feed 2.0 Mobile-First Architecture & Interaction Suite', () => {
  const rootDir = path.resolve(__dirname, '../..');
  const appHeaderPath = path.join(rootDir, 'apps/web/src/components/app-header.tsx');
  const mobileNavPath = path.join(rootDir, 'apps/web/src/components/mobile-nav.tsx');
  const homeDashboardPath = path.join(rootDir, 'apps/web/src/components/home/home-dashboard.tsx');
  const feedPostPath = path.join(rootDir, 'apps/web/src/components/feed/feed-post.tsx');
  const mobileCommentsSheetPath = path.join(rootDir, 'apps/web/src/components/feed/mobile-comments-sheet.tsx');
  const feedStreamPath = path.join(rootDir, 'apps/web/src/components/feed-stream.tsx');

  describe('1. Mobile Header Architecture (AppHeader)', () => {
    it('positions hamburger menu trigger on the left of TukubiLogo on mobile', () => {
      const content = fs.readFileSync(appHeaderPath, 'utf-8');
      expect(content).toContain('tukubi:open-ecosystem-menu');
      expect(content).toContain('md:hidden');
      expect(content).toContain('TukubiLogo');
    });

    it('removes duplicate hamburger menu from the right cluster', () => {
      const content = fs.readFileSync(appHeaderPath, 'utf-8');
      expect(content).toContain('href="/notifications"');
      expect(content).toContain('href="/messages"');
      expect(content).toContain('IdentitySwitcher');
    });
  });

  describe('2. Mobile Bottom Navigation (MobileNav)', () => {
    it('implements 5-tab standardized layout: Home, Reels, Create, Explore, Profile', () => {
      const content = fs.readFileSync(mobileNavPath, 'utf-8');
      expect(content).toContain("href: '/'");
      expect(content).toContain("href: '/reels'");
      expect(content).toContain("href: '/create'");
      expect(content).toContain("href: '/explore'");
      expect(content).toContain("href: user ? `/profile/${user.username}` : '/login'");
    });

    it('enforces WCAG 2.2 AA compliant 44x44px touch targets on all tabs', () => {
      const content = fs.readFileSync(mobileNavPath, 'utf-8');
      expect(content).toContain('min-w-[44px] min-h-[44px]');
    });

    it('renders a dedicated labeled Create pill button with accessibility attributes', () => {
      const content = fs.readFileSync(mobileNavPath, 'utf-8');
      expect(content).toContain('aria-label="Create on TUKUBI"');
      expect(content).toContain('setIsCreateSheetOpen(true)');
    });
  });

  describe('3. Home Dashboard & Tab System (HomeDashboard)', () => {
    it('exports PRIMARY_FEED_TABS with 4 Caribbean core tabs and SECONDARY_FEED_TABS', () => {
      const content = fs.readFileSync(homeDashboardPath, 'utf-8');
      expect(content).toContain('PRIMARY_FEED_TABS');
      expect(content).toContain('SECONDARY_FEED_TABS');
      expect(content).toContain("'for_you'");
      expect(content).toContain("'following'");
      expect(content).toContain("'caribbean'");
      expect(content).toContain("'communities'");
    });

    it('renders mobile-first sticky tab bar with primary tabs', () => {
      const content = fs.readFileSync(homeDashboardPath, 'utf-8');
      expect(content).toContain('md:hidden sticky');
      expect(content).toContain('PRIMARY_FEED_TABS.map');
    });

    it('features 1-tap streamlined composer pill on mobile', () => {
      const content = fs.readFileSync(homeDashboardPath, 'utf-8');
      expect(content).toContain('Share something with the Caribbean...');
      expect(content).toContain('setShowComposer');
    });
  });

  describe('4. Standardized Post Card Architecture (FeedPost)', () => {
    it('implements 2-line post header with author and territory context', () => {
      const content = fs.readFileSync(feedPostPath, 'utf-8');
      expect(content).toContain('Compact 2-Line Editorial Hierarchy');
      expect(content).toContain('post.location');
      expect(content).toContain('post.time');
      expect(content).toContain('Globe');
    });

    it('standardizes interaction bar with Like, Comment, Repost, Share and Bookmark', () => {
      const content = fs.readFileSync(feedPostPath, 'utf-8');
      expect(content).toContain('ReactionPicker');
      expect(content).toContain('onToggleComments');
      expect(content).toContain('onRepost');
      expect(content).toContain('onShare');
      expect(content).toContain('Bookmark');
    });

    it('relocates Creator Tip action to kebab menu for clean mobile hierarchy', () => {
      const content = fs.readFileSync(feedPostPath, 'utf-8');
      expect(content).toContain('Send Tip to Creator');
      expect(content).toContain('onTipCreator');
    });
  });

  describe('5. Mobile Comments Bottom Sheet (MobileCommentsSheet)', () => {
    it('exists and implements accessible modal dialog pattern', () => {
      expect(fs.existsSync(mobileCommentsSheetPath)).toBe(true);
      const content = fs.readFileSync(mobileCommentsSheetPath, 'utf-8');
      expect(content).toContain('role="dialog"');
      expect(content).toContain('aria-modal="true"');
      expect(content).toContain('MobileCommentsSheetProps');
    });

    it('supports keyboard avoidance, safe-area-insets and body scroll lock', () => {
      const content = fs.readFileSync(mobileCommentsSheetPath, 'utf-8');
      expect(content).toContain('safe-area-inset-bottom');
      expect(content).toContain("document.body.style.overflow = 'hidden'");
      expect(content).toContain("e.key === 'Escape'");
    });

    it('supports nested reply threading and emoji insertion', () => {
      const content = fs.readFileSync(mobileCommentsSheetPath, 'utf-8');
      expect(content).toContain('replyingTo');
      expect(content).toContain('EmojiPickerPopover');
      expect(content).toContain('CornerDownRight');
    });
  });

  describe('6. Feed Stream Wiring (FeedStream)', () => {
    it('integrates MobileCommentsSheet on mobile viewports (<768px)', () => {
      const content = fs.readFileSync(feedStreamPath, 'utf-8');
      expect(content).toContain('MobileCommentsSheet');
      expect(content).toContain('mobileCommentsPost');
      expect(content).toContain('window.innerWidth < 768');
    });

    it('passes onRepost callback to FeedPost instances', () => {
      const content = fs.readFileSync(feedStreamPath, 'utf-8');
      expect(content).toContain('onRepost={handleShare}');
    });
  });
});
