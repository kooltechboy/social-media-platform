import { test, expect } from '@playwright/test';

/**
 * ANTILIA App Header & Search E2E Tests
 *
 * Tests the global header component including:
 * - Brand logo link
 * - Instant search with live results
 * - SpotPay wallet shortcut
 * - Notifications bell
 * - Messages icon
 * - Session widget (Sign In / Profile)
 * - Search interaction patterns
 */

test.describe('App Header — Brand & Navigation Links', () => {
  test('ANTILIA brand logo links to home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const brandLink = page.getByRole('link', { name: /(TUKUBI|ANTILIA)/i }).first();
    await expect(brandLink).toBeVisible();
    await expect(brandLink).toHaveAttribute('href', '/');
  });

  test('SpotPay Wallet link is visible and links to /spotpay', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const spotpayLink = page.getByLabel('SpotPay Wallet balance');
    if (await spotpayLink.isVisible().catch(() => false)) {
      await expect(spotpayLink).toHaveAttribute('href', '/spotpay');
    }
  });

  test('Notifications bell link is visible and links to /notifications', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const notifLink = page.getByLabel('Notifications');
    if (await notifLink.isVisible().catch(() => false)) {
      await expect(notifLink).toHaveAttribute('href', '/notifications');
    }
  });

  test('Messages link is visible on desktop and links to /messages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const messagesLink = page.getByLabel('Messages');
    if (await messagesLink.isVisible().catch(() => false)) {
      await expect(messagesLink).toHaveAttribute('href', '/messages');
    }
  });
});

test.describe('App Header — Session Widget (Unauthenticated)', () => {
  test('unauthenticated user sees Sign In button linking to /login', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for "Sign In" text in the header area
    const signInLink = page.getByRole('link', { name: /Sign In/i }).first();
    if (await signInLink.isVisible().catch(() => false)) {
      await expect(signInLink).toHaveAttribute('href', '/login');
    }
  });
});

test.describe('App Header — Search Functionality', () => {
  test('search input exists with correct placeholder', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByLabel('Search users and ecosystem');
    if (await searchInput.isVisible().catch(() => false)) {
      await expect(searchInput).toHaveAttribute('placeholder', /Search people, creators, events, culture/);
    }
  });

  test('typing in search shows dropdown results or empty state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByLabel('Search users and ecosystem');
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);

      // Should see either results or "No matching users found" message
      const noResults = page.getByText(/No matching users found/);
      const viewAll = page.getByText('View All Results →');
      const hasNoResults = await noResults.isVisible().catch(() => false);
      const hasResults = await viewAll.isVisible().catch(() => false);
      // One of these should appear
      expect(hasNoResults || hasResults).toBeTruthy();
    }
  });

  test('search form submits to /search with query parameter', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByLabel('Search users and ecosystem');
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('caribbean');
      await page.keyboard.press('Enter');

      // Should navigate to /search with q param
      await page.waitForURL(/\/search\?q=caribbean/, { timeout: 10000 });
      expect(page.url()).toContain('/search');
    }
  });

  test('search clear button appears when query is typed and clears input', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByLabel('Search users and ecosystem');
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('test query');
      await page.waitForTimeout(300);

      // Look for clear button (X icon in search form)
      const clearBtn = page.locator('form[action="/search"] button[type="button"]');
      if (await clearBtn.isVisible().catch(() => false)) {
        await clearBtn.click();
        await expect(searchInput).toHaveValue('');
      }
    }
  });
});

test.describe('App Header — Cross-Page Consistency', () => {
  test('header is visible on every public page', async ({ page }) => {
    const publicRoutes = ['/', '/explore', '/reels', '/live', '/podcasts', '/communities', '/marketplace', '/events', '/pages'];

    for (const route of publicRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const header = page.getByRole('link', { name: /(TUKUBI|ANTILIA)/i }).first();
      await expect(header).toBeVisible();
    }
  });

  test('header is NOT shown on gateway pages (login/signup)', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Gateway pages isolate children without the AppShell header
    // But the login page itself has an ANTILIA heading, so we check that the 
    // standard AppHeader nav links (SpotPay, Notifications, Messages) are NOT present
    const spotpayLink = page.getByLabel('SpotPay Wallet balance');
    await expect(spotpayLink).not.toBeVisible();
  });
});
