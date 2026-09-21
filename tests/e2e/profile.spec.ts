import { test, expect } from '@playwright/test';

test.describe('Profile', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('can navigate to a profile page (guest)', async ({ page }) => {
    // Navigate to the official TUKUBI profile
    await page.goto('/profile/tukubi');
    
    // Verify TUKUBI display name, handle, and Caribbean Connected positioning
    await expect(page.getByText('TUKUBI').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/@tukubi/i).first()).toBeVisible();
    await expect(page.getByText(/The Caribbean Connected/i).first()).toBeVisible();
  });
});
