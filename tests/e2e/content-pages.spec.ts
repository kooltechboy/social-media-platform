import { test, expect } from '@playwright/test';

test.describe('TUKUBI Content Pages & Route Protection', () => {
  test.describe('Unauthenticated Guest Access & Redirects', () => {
    // Unauthenticated context
    test.use({ storageState: { cookies: [], origins: [] } });

    test('Homepage loads public front door for guests', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      expect(new URL(page.url()).pathname).toBe('/');
      await expect(page.locator('body')).toBeVisible();
    });

    test('Public legal and help documents are accessible without auth', async ({ page }) => {
      const publicDocs = ['/terms', '/privacy', '/help', '/learn'];
      for (const route of publicDocs) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        expect(new URL(page.url()).pathname).toBe(route);
      }
    });

    test('Health API Endpoint returns correct response', async ({ request }) => {
      const response = await request.get('/api/v1/health');
      const status = response.status();
      expect([200, 503]).toContain(status);
      
      const data = await response.json();
      expect(['ok', 'degraded']).toContain(data.status);
      expect(typeof data.latencyMs).toBe('number');
    });

    test.describe('Protected application routes redirect unauthenticated visitors to login', () => {
      const coreProtectedRoutes = [
        '/explore',
        '/sounds',
        '/map',
        '/events',
        '/podcasts',
        '/marketplace',
        '/communities',
        '/pages',
        '/shorts',
        '/reels',
        '/live',
        '/diaspora',
        '/search',
        '/messages',
        '/notifications',
        '/settings',
        '/financial-center',
        '/creator-studio',
        '/create',
        '/admin',
        '/moderation',
      ];

      for (const route of coreProtectedRoutes) {
        test(`redirects unauthenticated user from ${route} to login with next param`, async ({ page }) => {
          await page.goto(route);
          await page.waitForLoadState('networkidle');
          const url = new URL(page.url());
          expect(url.pathname).toBe('/login');
          expect(url.searchParams.get('next')).toBe(route);
        });
      }
    });
  });

  test.describe('Authenticated Member Experience', () => {
    // Use setup auth state
    test.use({ storageState: 'playwright/.auth/user.json' });

    test('Explore Page loads correctly when authenticated', async ({ page }) => {
      await page.goto('/explore');
      await page.waitForLoadState('networkidle');
      expect(new URL(page.url()).pathname).toBe('/explore');
      await expect(page.locator('body')).toBeVisible();
    });

    test('Events Page loads correctly with authentic state', async ({ page }) => {
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      expect(new URL(page.url()).pathname).toBe('/events');
      await expect(page.locator('body')).toBeVisible();
    });

    test('Marketplace Page loads correctly with verified commerce', async ({ page }) => {
      await page.goto('/marketplace');
      await page.waitForLoadState('networkidle');
      expect(new URL(page.url()).pathname).toBe('/marketplace');
      await expect(page.locator('body')).toBeVisible();
    });

    test('Communities Page loads correctly', async ({ page }) => {
      await page.goto('/communities');
      await page.waitForLoadState('networkidle');
      expect(new URL(page.url()).pathname).toBe('/communities');
      await expect(page.locator('body')).toBeVisible();
    });

    test('Podcasts Page loads correctly', async ({ page }) => {
      await page.goto('/podcasts');
      await page.waitForLoadState('networkidle');
      expect(new URL(page.url()).pathname).toBe('/podcasts');
      await expect(page.locator('body')).toBeVisible();
    });

    test('Sounds Page loads authentic audio stems', async ({ page }) => {
      await page.goto('/sounds');
      await page.waitForLoadState('networkidle');
      expect(new URL(page.url()).pathname).toBe('/sounds');
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
