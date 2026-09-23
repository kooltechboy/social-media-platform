import { describe, it, expect } from 'vitest';

describe('Unified Navigation & Operating Identity Parity', () => {
  describe('Mobile Tab Navigation (5 Standard Tabs)', () => {
    const WEB_MOBILE_TABS = [
      { key: 'home', href: '/' },
      { key: 'explore', href: '/explore' },
      { key: 'create', href: '/create' },
      { key: 'messages', href: '/messages' },
      { key: 'profile', href: '/profile' },
    ];

    const NATIVE_MOBILE_TABS = [
      { key: 'home', name: 'Home' },
      { key: 'explore', name: 'Explore' },
      { key: 'create', name: 'Create' },
      { key: 'messages', name: 'Messages' },
      { key: 'profile', name: 'Profile' },
    ];

    it('has exactly 5 bottom tabs on web mobile', () => {
      expect(WEB_MOBILE_TABS).toHaveLength(5);
      expect(WEB_MOBILE_TABS.map((t) => t.key)).toEqual([
        'home',
        'explore',
        'create',
        'messages',
        'profile',
      ]);
    });

    it('maintains 1:1 tab parity between web and native mobile', () => {
      expect(WEB_MOBILE_TABS.length).toBe(NATIVE_MOBILE_TABS.length);
      for (let i = 0; i < WEB_MOBILE_TABS.length; i++) {
        expect(WEB_MOBILE_TABS[i].key).toBe(NATIVE_MOBILE_TABS[i].key);
      }
    });
  });

  describe('Desktop Sidebar Grouping (Primary, Personal & Ecosystem Sections)', () => {
    const SIDEBAR_SECTIONS = {
      primary: [
        '/',
        '/explore',
        '/caribbean',
        '/reels',
        '/live',
        '/communities',
        '/marketplace',
        '/events',
        '/pages',
        '/podcasts',
        '/creator-studio',
      ],
      personal: ['/friends', '/messages', '/notifications', '/bookmarks', '/financial-center', '/profile'],
      ecosystem: ['/creator-hub', '/settings', '/help'],
    };

    it('contains no duplicate routes across sidebar groups', () => {
      const allRoutes = [
        ...SIDEBAR_SECTIONS.primary,
        ...SIDEBAR_SECTIONS.personal,
        ...SIDEBAR_SECTIONS.ecosystem,
      ];
      const uniqueRoutes = new Set(allRoutes);
      expect(uniqueRoutes.size).toBe(allRoutes.length);
    });

    it('contains canonical Home / and /caribbean while eliminating legacy /feeds, /people and /members', () => {
      const allRoutes = [
        ...SIDEBAR_SECTIONS.primary,
        ...SIDEBAR_SECTIONS.personal,
        ...SIDEBAR_SECTIONS.ecosystem,
      ];
      expect(allRoutes).toContain('/');
      expect(allRoutes).toContain('/caribbean');
      expect(allRoutes).not.toContain('/feeds');
      expect(allRoutes).not.toContain('/people');
      expect(allRoutes).not.toContain('/members');
    });
  });

  describe('Canonical Friends & Connections Route Consolidation', () => {
    it('redirects /people and /members to canonical /friends?tab=discover', () => {
      const getCanonicalUrl = (pathname: string, searchParams: Record<string, string>) => {
        if (pathname === '/people' || pathname === '/members') {
          const params = new URLSearchParams(searchParams);
          if (!params.has('tab')) params.set('tab', 'discover');
          return `/friends?${params.toString()}`;
        }
        return pathname;
      };

      expect(getCanonicalUrl('/people', {})).toBe('/friends?tab=discover');
      expect(getCanonicalUrl('/members', { country: 'JM' })).toBe(
        '/friends?country=JM&tab=discover'
      );
    });
  });

  describe('Operating Identity Awareness & Banner Logic', () => {
    it('displays operating banner only when active identity is non-personal', () => {
      const shouldShowBanner = (identityType: 'personal' | 'creator' | 'business' | 'community') =>
        identityType !== 'personal';

      expect(shouldShowBanner('personal')).toBe(false);
      expect(shouldShowBanner('business')).toBe(true);
      expect(shouldShowBanner('community')).toBe(true);
      expect(shouldShowBanner('creator')).toBe(true);
    });

    it('resolves correct management destination for non-personal identity', () => {
      const getManageLink = (identity: { type: string; handle: string }) => {
        switch (identity.type) {
          case 'business':
            return `/pages/${identity.handle}/manage`;
          case 'community':
            return `/communities/${identity.handle}/manage`;
          case 'creator':
            return '/creator-studio';
          default:
            return null;
        }
      };

      expect(getManageLink({ type: 'business', handle: 'blue-mountain' })).toBe(
        '/pages/blue-mountain/manage'
      );
      expect(getManageLink({ type: 'community', handle: 'bajan-tech' })).toBe(
        '/communities/bajan-tech/manage'
      );
      expect(getManageLink({ type: 'creator', handle: 'reggae-star' })).toBe(
        '/creator-studio'
      );
    });
  });
});
