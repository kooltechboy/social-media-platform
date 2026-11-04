import { test, expect } from '@playwright/test';

test.describe('Profile Page', () => {
  test.describe('Unauthenticated Guest Access', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('profile route redirects unauthenticated guest to login gateway with next param', async ({ page }) => {
      await page.goto('/profile/tukubi');
      await page.waitForLoadState('networkidle');
      const url = new URL(page.url());
      expect(url.pathname).toBe('/login');
      expect(url.searchParams.get('next')).toBe('/profile/tukubi');
    });
  });

  test.describe('Authenticated Member Access', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    test('can navigate to member profile page', async ({ page }) => {
      await page.goto('/profile/tukubi');
      await page.waitForLoadState('networkidle');

      // Verify TUKUBI display name, handle, and Caribbean Connected positioning
      await expect(page.getByText('TUKUBI').first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(/@tukubi/i).first()).toBeVisible();
      await expect(page.getByText(/The Caribbean Connected/i).first()).toBeVisible();
    });
  });
});
