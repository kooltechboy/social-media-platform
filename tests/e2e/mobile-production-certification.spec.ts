import { test, expect } from '@playwright/test';

test.describe('Mobile-First Production Certification Suite', () => {
  test.describe('1. Mobile Viewport (iPhone 14/15/16 - 390x844)', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('mobile header renders brand, search, bell, and messages icon with touch-safe targets', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Brand Logo
      const logo = page.locator('header a[href="/"]').first();
      await expect(logo).toBeVisible();

      // Search button (mobile icon)
      const searchBtn = page.locator('header a[href="/search"]');
      await expect(searchBtn).toBeVisible();

      // Notifications button
      const notifBtn = page.locator('header a[href="/notifications"]');
      await expect(notifBtn).toBeVisible();

      // Direct Messages button (certified mobile visibility)
      const msgBtn = page.locator('header a[href="/messages"]');
      await expect(msgBtn).toBeVisible();

      // Verify touch target dimensions (>= 40x40px)
      const msgBox = await msgBtn.boundingBox();
      expect(msgBox).not.toBeNull();
      if (msgBox) {
        expect(msgBox.width).toBeGreaterThanOrEqual(40);
        expect(msgBox.height).toBeGreaterThanOrEqual(40);
      }
    });

    test('bottom 5-tab bar renders Home, Explore, Create (FAB), Messages, and Menu', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const nav = page.locator('nav[aria-label="Main mobile navigation"]');
      await expect(nav).toBeVisible();

      // 5 tabs
      await expect(nav.getByRole('tab', { name: 'Home' })).toBeVisible();
      await expect(nav.getByRole('tab', { name: 'Explore Caribbean' })).toBeVisible();
      await expect(nav.getByRole('tab', { name: 'Create on TUKUBI' })).toBeVisible();
      await expect(nav.getByRole('tab', { name: 'Messages' })).toBeVisible();
      await expect(nav.getByRole('tab', { name: 'Ecosystem Menu' })).toBeVisible();
    });

    test('menu sheet drawer opens and displays ecosystem destinations including Messages', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const menuTab = page.locator('nav[aria-label="Main mobile navigation"]').getByRole('tab', { name: 'Ecosystem Menu' });
      await menuTab.click();

      const menuDialog = page.getByRole('dialog', { name: 'TUKUBI Ecosystem Menu' });
      await expect(menuDialog).toBeVisible();

      // Verify Direct Messages destination in Menu
      await expect(menuDialog.getByRole('link', { name: /Messages & Direct Chat/i })).toBeVisible();

      // Verify Key Ecosystem Destinations
      await expect(menuDialog.getByRole('link', { name: /Pages/i })).toBeVisible();
      await expect(menuDialog.getByRole('link', { name: /Communities/i })).toBeVisible();
      await expect(menuDialog.getByRole('link', { name: /Marketplace/i })).toBeVisible();
      await expect(menuDialog.getByRole('link', { name: /Cultural Events/i })).toBeVisible();
      await expect(menuDialog.getByRole('link', { name: /Reels & Video/i })).toBeVisible();
      await expect(menuDialog.getByRole('link', { name: /Podcasts/i })).toBeVisible();
      await expect(menuDialog.getByRole('link', { name: /Live Broadcasts/i })).toBeVisible();
      await expect(menuDialog.getByRole('link', { name: /Sounds & Stems/i })).toBeVisible();
      await expect(menuDialog.getByRole('link', { name: /Caribbean Map/i })).toBeVisible();
      await expect(menuDialog.getByRole('link', { name: /Financial Center & Wallet/i })).toBeVisible();
      await expect(menuDialog.getByRole('link', { name: /Settings & Privacy/i })).toBeVisible();
      await expect(menuDialog.getByRole('link', { name: /Help & Learn Center/i })).toBeVisible();

      // Close menu sheet
      const closeBtn = menuDialog.getByRole('button', { name: 'Close menu' });
      await closeBtn.click();
      await expect(menuDialog).not.toBeVisible();
    });

    test('create FAB opens quick action sheet with creation destinations', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const createTab = page.locator('nav[aria-label="Main mobile navigation"]').getByRole('tab', { name: 'Create on TUKUBI' });
      await createTab.click();

      const createDialog = page.getByRole('dialog', { name: 'Create on TUKUBI' });
      await expect(createDialog).toBeVisible();

      await expect(createDialog.getByRole('link', { name: /Post/i })).toBeVisible();
      await expect(createDialog.getByRole('link', { name: /Reel/i })).toBeVisible();
      await expect(createDialog.getByRole('link', { name: /Go Live/i })).toBeVisible();
      await expect(createDialog.getByRole('link', { name: /Market/i })).toBeVisible();
      await expect(createDialog.getByRole('link', { name: /Community/i })).toBeVisible();
      await expect(createDialog.getByRole('link', { name: /Page/i })).toBeVisible();

      // Close create sheet
      const closeBtn = createDialog.getByRole('button', { name: 'Close creation menu' });
      await closeBtn.click();
      await expect(createDialog).not.toBeVisible();
    });

    test('mobile viewport has zero horizontal scroll overflow', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });
  });

  test.describe('2. Desktop Viewport (1280x800)', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('desktop renders centered search, left sidebar, and desktop header controls', async ({ page }) => {
      await page.goto('/explore');
      await page.waitForLoadState('networkidle');

      // Desktop centered search input
      const searchInput = page.locator('header input[name="q"]');
      await expect(searchInput).toBeVisible();

      // Desktop left navigation sidebar
      const sidebar = page.locator('aside').first();
      await expect(sidebar).toBeVisible();

      // Notifications and Messages buttons
      await expect(page.locator('header a[href="/notifications"]')).toBeVisible();
      await expect(page.locator('header a[href="/messages"]')).toBeVisible();

      // Mobile bottom nav should be hidden on desktop
      const mobileNav = page.locator('nav[aria-label="Main mobile navigation"]');
      await expect(mobileNav).not.toBeVisible();
    });

    test('desktop search instant live dropdown triggers on input', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const searchInput = page.locator('header input[name="q"]');
      await searchInput.fill('Tukubi');

      // Verify dropdown container renders
      const dropdown = page.locator('header .animate-fadeIn');
      await expect(dropdown).toBeVisible();
    });
  });
});
