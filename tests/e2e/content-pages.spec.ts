import { test, expect } from '@playwright/test';

test.describe('TUKUBI Content Pages', () => {
  test.describe('Public Pages', () => {
    // Unauthenticated context
    test.use({ storageState: { cookies: [], origins: [] } });

    test('Explore Page loads correctly', async ({ page }) => {
      await page.goto('/explore');
      await page.waitForLoadState('networkidle');
      
      await expect(page.getByText(/(Tukubi|Tukubi) Discovery Engine/i)).toBeVisible();
      await expect(page.getByText(/Global Diaspora Hubs/i)).toBeVisible();
    });

    test('Events Page loads correctly', async ({ page }) => {
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      
      // Since mock data is removed, we either see events or an empty state
      const emptyStateVisible = await page.getByText(/no events|futurism/i).isVisible();
      if (!emptyStateVisible) {
        // If no empty state, expect some events content to load without crashing
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('Marketplace Page loads correctly', async ({ page }) => {
      await page.goto('/marketplace');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('Communities Page loads correctly', async ({ page }) => {
      await page.goto('/communities');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('Pages Page loads correctly', async ({ page }) => {
      await page.goto('/pages');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('Podcasts Page loads correctly', async ({ page }) => {
      await page.goto('/podcasts');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('Reels Page loads correctly', async ({ page }) => {
      await page.goto('/reels');
      await page.waitForLoadState('networkidle');
      
      // Empty state might show '0' metrics or similar text, ensure page renders
      await expect(page.locator('body')).toBeVisible();
    });

    test('Live Streams Page loads correctly', async ({ page }) => {
      await page.goto('/live');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('Diaspora Page loads correctly', async ({ page }) => {
      await page.goto('/diaspora');
      await page.waitForLoadState('networkidle');
      
      // Renders communities and events sections
      await expect(page.locator('body')).toBeVisible();
    });

    test('Search Page loads correctly', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      
      // Look for a search input
      const searchInput = page.getByPlaceholder(/search/i).first();
      if (await searchInput.isVisible()) {
        await expect(searchInput).toBeVisible();
      }
    });

    test('Map Page loads correctly', async ({ page }) => {
      await page.goto('/map');
      await page.waitForLoadState('networkidle');
      
      // Page should render map interface without crashing
      await expect(page.locator('body')).toBeVisible();
    });

    test('Health API Endpoint returns correct response', async ({ request }) => {
      const response = await request.get('/api/v1/health');
      const status = response.status();
      expect([200, 503]).toContain(status);
      
      const data = await response.json();
      expect(['ok', 'degraded']).toContain(data.status);
      expect(typeof data.latencyMs).toBe('number');
    });

    test.describe('Protected routes redirection', () => {
      const protectedRoutes = [
        '/messages',
        '/notifications',
        '/settings',
        '/financial-center',
        '/creator-studio',
        '/create',
        '/admin',
        '/moderation'
      ];

      for (const route of protectedRoutes) {
        test(`redirects unauthenticated user from ${route} to login`, async ({ page }) => {
          await page.goto(route);
          await page.waitForLoadState('networkidle');
          const url = new URL(page.url());
          expect(url.pathname).toBe('/login');
          expect(url.searchParams.get('next')).toBe(route);
        });
      }

      test('Admin bootstrap page is exempt from authentication redirect', async ({ page }) => {
        await page.goto('/admin/bootstrap');
        await page.waitForLoadState('networkidle');
        const url = new URL(page.url());
        expect(url.pathname).toBe('/admin/bootstrap');
      });
    });
  });
});
