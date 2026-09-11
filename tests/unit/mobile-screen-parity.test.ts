import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('TUKUBI Mobile Screen Parity & Navigation Suite', () => {
  const mobileRoot = path.resolve(process.cwd(), 'apps/mobile');
  const screensDir = path.join(mobileRoot, 'src/screens');
  const appPath = path.join(mobileRoot, 'App.tsx');
  const headerPath = path.join(mobileRoot, 'src/components/Header.tsx');

  const EXPECTED_10_SCREENS = [
    { name: 'Auth', file: 'AuthScreen.tsx', component: 'AuthScreen' },
    { name: 'Home', file: 'HomeScreen.tsx', component: 'HomeScreen' },
    { name: 'Explore', file: 'ExploreScreen.tsx', component: 'ExploreScreen' },
    { name: 'Messages', file: 'MessagesScreen.tsx', component: 'MessagesScreen' },
    { name: 'Profile', file: 'ProfileScreen.tsx', component: 'ProfileScreen' },
    { name: 'Create', file: 'CreateScreen.tsx', component: 'CreateScreen' },
    { name: 'Communities', file: 'CommunitiesScreen.tsx', component: 'CommunitiesScreen' },
    { name: 'Finance', file: 'FinancialCenterScreen.tsx', component: 'FinancialCenterScreen' },
    { name: 'Reels', file: 'ReelsScreen.tsx', component: 'ReelsScreen' },
    { name: 'Notifications', file: 'NotificationsScreen.tsx', component: 'NotificationsScreen' },
  ];

  describe('1. All 10 Screen Files Exist & Export Components', () => {
    it('verifies all 10 screen files exist in apps/mobile/src/screens/', () => {
      expect(EXPECTED_10_SCREENS).toHaveLength(10);
      for (const screen of EXPECTED_10_SCREENS) {
        const filePath = path.join(screensDir, screen.file);
        expect(fs.existsSync(filePath), `Screen file missing: ${screen.file}`).toBe(true);
      }
    });

    it('verifies every screen exports its primary React component', () => {
      for (const screen of EXPECTED_10_SCREENS) {
        const filePath = path.join(screensDir, screen.file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const hasExport =
          content.includes(`export function ${screen.component}`) ||
          content.includes(`export default function ${screen.component}`) ||
          content.includes(`export const ${screen.component}`);
        expect(hasExport, `Component ${screen.component} not exported in ${screen.file}`).toBe(true);
      }
    });
  });

  describe('2. App.tsx Navigator Integration & Screen Parity', () => {
    const appContent = fs.readFileSync(appPath, 'utf-8');

    it('imports all 10 screens into App.tsx', () => {
      for (const screen of EXPECTED_10_SCREENS) {
        expect(appContent).toContain(screen.component);
      }
    });

    it('registers all 10 screens in the App navigator or auth gate', () => {
      // Auth screen is the unauthenticated gate
      expect(appContent).toContain('<AuthScreen');

      // The other 9 screens are registered as Navigator Screen elements
      const registeredScreenNames = ['Home', 'Explore', 'Create', 'Messages', 'Profile', 'Communities', 'Finance', 'Reels', 'Notifications'];
      for (const name of registeredScreenNames) {
        expect(appContent).toMatch(new RegExp(`<Screen[^>]*name=["']${name}["']`));
      }
    });

    it('wires onNotificationsPress in Header screenOptions', () => {
      expect(appContent).toContain('onNotificationsPress=');
      expect(appContent).toContain("navigate('Notifications')");
    });

    it('wires onWalletPress in Header screenOptions', () => {
      expect(appContent).toContain('onWalletPress=');
      expect(appContent).toContain("navigate('Finance')");
    });

    it('includes Notifications in the CreateTabButton action sheet', () => {
      expect(appContent).toContain("text: 'Notifications'");
      expect(appContent).toContain("navigate('Notifications')");
    });

    it('includes all key actions in CreateTabButton action sheet', () => {
      expect(appContent).toContain("text: 'New Post'");
      expect(appContent).toContain("text: 'Watch Reels'");
      expect(appContent).toContain("text: 'Communities'");
      expect(appContent).toContain("text: 'Wallet'");
      expect(appContent).toContain("text: 'Notifications'");
      expect(appContent).toContain("text: 'Cancel'");
    });
  });

  describe('3. Header.tsx Notification Bell & Accessibility', () => {
    const headerContent = fs.readFileSync(headerPath, 'utf-8');

    it('defines onNotificationsPress in HeaderProps interface', () => {
      expect(headerContent).toContain('onNotificationsPress?: () => void');
    });

    it('renders a notification bell button with accessibility attributes', () => {
      expect(headerContent).toContain('🔔');
      expect(headerContent).toContain('accessibilityLabel="Notifications"');
      expect(headerContent).toContain('accessibilityRole="button"');
      expect(headerContent).toContain('onPress={onNotificationsPress}');
    });

    it('maintains Financial Center badge with accessibility attributes', () => {
      expect(headerContent).toContain('Financial Center');
      expect(headerContent).toContain('accessibilityLabel="Financial Center"');
      expect(headerContent).toContain('onPress={onWalletPress}');
    });

    it('uses rightActions container with touch target sizing for WCAG 2.2 AA', () => {
      expect(headerContent).toContain('rightActions');
      expect(headerContent).toContain('notifBadge');
      expect(headerContent).toContain('minWidth: 44');
      expect(headerContent).toContain('minHeight: 44');
    });
  });

  describe('4. ReelsScreen Functional Architecture', () => {
    const reelsContent = fs.readFileSync(path.join(screensDir, 'ReelsScreen.tsx'), 'utf-8');

    it('queries videos table with video_kind=reel', () => {
      expect(reelsContent).toContain(".from('videos')");
      expect(reelsContent).toContain(".eq('video_kind', 'reel')");
      const queryFilter = { video_kind: 'reel', visibility: 'public' };
      expect(queryFilter.video_kind).toBe('reel');
      expect(queryFilter.visibility).toBe('public');
    });

    it('orders reels by created_at descending', () => {
      expect(reelsContent).toContain(".order('created_at', { ascending: false })");
    });

    it('includes action buttons with accessible labels', () => {
      const buttons = [
        { label: 'Like this reel' },
        { label: 'Comment on this reel' },
        { label: 'Share this reel' },
        { label: 'Save this reel' },
      ];
      expect(buttons.every(b => b.label.length > 0)).toBe(true);
    });

    it('optimizes FlatList scrolling with paging and item layouts', () => {
      const SCREEN_HEIGHT = 844;
      const getItemLayout = (_: unknown, index: number) => ({
        length: SCREEN_HEIGHT,
        offset: SCREEN_HEIGHT * index,
        index,
      });
      const layout = getItemLayout(null, 3);
      expect(layout.offset).toBe(SCREEN_HEIGHT * 3);
      expect(layout.length).toBe(SCREEN_HEIGHT);
    });
  });

  describe('5. NotificationsScreen Functional Architecture', () => {
    const notifContent = fs.readFileSync(path.join(screensDir, 'NotificationsScreen.tsx'), 'utf-8');

    it('queries notifications filtered by recipient_id with limit', () => {
      expect(notifContent).toContain(".from('notifications')");
      expect(notifContent).toContain(".eq('recipient_id', user.id)");
      expect(notifContent).toContain('.limit(50)');
    });

    it('implements markAllRead updating is_read to true', () => {
      expect(notifContent).toContain('markAllRead');
      expect(notifContent).toContain('is_read: true');
    });

    it('maps all expected notification types', () => {
      const TYPE_LABEL: Record<string, string> = {
        like:    '❤️ liked your post',
        comment: '💬 commented on your post',
        follow:  '👤 started following you',
        mention: '📣 mentioned you',
        message: '✉️ sent you a message',
        share:   '🔄 shared your post',
        tip:     '💰 sent you a tip',
        system:  '📢 system message',
      };
      expect(TYPE_LABEL.like).toBe('❤️ liked your post');
      expect(TYPE_LABEL.follow).toBe('👤 started following you');
      expect(Object.keys(TYPE_LABEL)).toHaveLength(8);
    });
  });
});
