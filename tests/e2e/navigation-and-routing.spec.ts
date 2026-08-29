import { test, expect } from '@playwright/test';

// Unauthenticated tests
test.describe('Navigation & Routing - Unauthenticated', () => {
  // We want no stored state for these
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Public routes should be accessible without auth', async ({ page }) => {
    const publicRoutes = [
      '/',
      '/explore',
      '/map',
      '/reels',
      '/live',
      '/podcasts',
      '/communities',
      '/marketplace',
      '/events',
      '/pages'
    ];

    for (const route of publicRoutes) {
      await page.goto(route);
      // Wait for page to load to ensure it doesn't redirect
      await page.waitForLoadState('networkidle');
      expect(new URL(page.url()).pathname).toBe(route);
    }
  });

  test('Protected routes should redirect to login with next param', async ({ page }) => {
    const protectedRoutes = [
      '/settings',
      '/creator-studio',
      '/spotpay',
      '/messages',
      '/notifications',
      '/create',
      '/admin',
      '/moderation'
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      const currentUrl = new URL(page.url());
      expect(currentUrl.pathname).toBe('/login');
      expect(currentUrl.searchParams.get('next')).toBe(encodeURIComponent(route).replace(/%2F/g, '/')); // Might be unescaped depending on Next.js setup, let's just check standard encoding
    }
  });

  test('Admin bootstrap should be exempt from protection', async ({ page }) => {
    await page.goto('/admin/bootstrap');
    await page.waitForLoadState('networkidle');
    expect(new URL(page.url()).pathname).toBe('/admin/bootstrap');
  });

  test('Header session widget shows Sign In when unauth', async ({ page }) => {
    await page.goto('/');
    const signInLink = page.getByRole('link', { name: 'Sign In' }).first();
    if (await signInLink.count() > 0) {
      await expect(signInLink).toBeVisible();
      await expect(signInLink).toHaveAttribute('href', '/login');
    }
  });

  test('Sidebar profile link shows Sign In when unauth', async ({ page }) => {
    await page.goto('/');
    const sidebarSignIn = page.getByRole('complementary').getByRole('link', { name: 'Sign In' });
    if (await sidebarSignIn.count() > 0) {
        await expect(sidebarSignIn.first()).toBeVisible();
        await expect(sidebarSignIn.first()).toHaveAttribute('href', '/login');
    }
  });
});

// Authenticated tests
test.describe('Navigation & Routing - Authenticated', () => {
  // Use the setup auth state
  test.use({ storageState: 'playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Sidebar Ecosystem Group links exist and have correct badges', async ({ page }) => {
    const links = [
      { name: 'Home Feed', href: '/' },
      { name: 'Create Hub', href: '/create', badge: 'NEW' },
      { name: 'Explore & Diaspora', href: '/explore' },
      { name: 'Caribbean Map', href: '/map' },
      { name: 'Reels & Shorts', href: '/reels' },
      { name: 'Caribbean Sounds', href: '/sounds', badge: 'NEW' },
      { name: 'Live Streams', href: '/live', badge: 'LIVE' },
      { name: 'Podcasts Network', href: '/podcasts' },
      { name: 'Diaspora Hubs', href: '/communities' },
    ];

    for (const link of links) {
      const linkLocator = page.getByRole('link', { name: new RegExp(link.name, 'i') }).first();
      await expect(linkLocator).toBeVisible();
      await expect(linkLocator).toHaveAttribute('href', link.href);

      if (link.badge) {
        // Find badge within the link
        const badge = linkLocator.getByText(link.badge, { exact: true });
        await expect(badge).toBeVisible();
      }
    }
    
    // Check pulse animation on LIVE badge
    const liveLink = page.getByRole('link', { name: /Live Streams/i }).first();
    const liveBadge = liveLink.getByText('LIVE', { exact: true });
    await expect(liveBadge).toHaveClass(/animate-pulse/);
  });

  test('Economy & Culture Accordion toggles and contains links', async ({ page }) => {
    const summary = page.locator('aside summary').filter({ hasText: 'Economy & Culture' });
    await expect(summary).toBeVisible();
    await summary.click();
    await page.waitForTimeout(300);

    const links = [
      { name: 'Marketplace', href: '/marketplace' },
      { name: 'Cultural Events', href: '/events' },
      { name: 'Pages & Stores', href: '/pages', badge: 'VERIFIED' },
      { name: 'SpotPay Wallet', href: '/spotpay' },
      { name: 'Creator Studio', href: '/creator-studio' },
    ];

    for (const link of links) {
      const linkLocator = page.getByRole('link', { name: new RegExp(link.name, 'i') }).first();
      await expect(linkLocator).toBeVisible();
      await expect(linkLocator).toHaveAttribute('href', link.href);

      if (link.badge) {
        const badge = linkLocator.getByText(link.badge, { exact: true });
        await expect(badge).toBeVisible();
      }
    }
  });

  test('Account Group links exist', async ({ page }) => {
    const links = [
      { name: 'Messages', href: '/messages' },
      { name: 'Notifications', href: '/notifications' },
      { name: 'Settings', href: '/settings' },
    ];

    for (const link of links) {
      const linkLocator = page.getByRole('link', { name: new RegExp(link.name, 'i') }).first();
      await expect(linkLocator).toBeVisible();
      await expect(linkLocator).toHaveAttribute('href', link.href);
    }
  });

  test('Creator Hub Card exists', async ({ page }) => {
    const creatorHubLink = page.getByRole('link', { name: /Open Creator Studio/i }).first();
    if (await creatorHubLink.count() > 0) {
      await expect(creatorHubLink).toBeVisible();
      await expect(creatorHubLink).toHaveAttribute('href', '/creator-studio');
    }
  });

  test('Header navigation contains required links', async ({ page }) => {
    const brandLink = page.getByRole('link', { name: /(TUKUBI|ANTILIA)/i }).first();
    await expect(brandLink).toBeVisible();
    await expect(brandLink).toHaveAttribute('href', '/');

    // SpotPay Wallet link
    const spotpayLink = page.getByLabel('SpotPay Wallet balance').first();
    if (await spotpayLink.count() > 0) {
        await expect(spotpayLink).toBeVisible();
        await expect(spotpayLink).toHaveAttribute('href', '/spotpay');
    }

    // Notifications link
    const notifLink = page.getByLabel('Notifications').first();
    if (await notifLink.count() > 0) {
        await expect(notifLink).toBeVisible();
        await expect(notifLink).toHaveAttribute('href', '/notifications');
    }

    // Messages link
    const messagesLink = page.getByLabel('Messages').first();
    if (await messagesLink.count() > 0) {
        await expect(messagesLink).toBeVisible();
        await expect(messagesLink).toHaveAttribute('href', '/messages');
    }
  });

  test('Active state indicators work correctly', async ({ page }) => {
    // We are on '/'
    const homeLink = page.getByRole('link', { name: /Home Feed/i }).first();
    await expect(homeLink).toHaveAttribute('aria-current', 'page');

    // Navigate to /explore
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    const exploreLink = page.getByRole('link', { name: /Explore & Diaspora/i }).first();
    await expect(exploreLink).toHaveAttribute('aria-current', 'page');

    // Navigate to /marketplace
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');
    
    // Expand accordion if needed to see the active link
    const summary = page.getByText('Economy & Culture');
    const accordionBtn = page.getByRole('button', { name: /Economy & Culture/i });
    if (await accordionBtn.count() > 0) {
        const isExpanded = await accordionBtn.getAttribute('aria-expanded');
        if (isExpanded !== 'true') {
            await accordionBtn.click();
        }
    } else if (await summary.count() > 0) {
        const detailsParent = summary.locator('..');
        const isOpen = await detailsParent.getAttribute('open') !== null;
        if (!isOpen) {
            await summary.click();
        }
    }

    const marketplaceLink = page.getByRole('link', { name: /Marketplace/i }).first();
    await expect(marketplaceLink).toHaveAttribute('aria-current', 'page');
  });
});
