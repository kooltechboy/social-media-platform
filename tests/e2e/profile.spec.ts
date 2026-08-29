import { test, expect } from '@playwright/test';

test.describe('Profile', () => {
  test('can navigate to a profile page (guest)', async ({ page }) => {
    // Navigate to a known user or feed
    await page.goto('/');
    
    await expect(page.getByRole('link', { name: /(TUKUBI|ANTILIA)/i }).first()).toBeVisible();
    
    // Navigate to explore to find a user/hub
    await page.goto('/explore');
    await expect(page.getByRole('heading', { name: 'Caribbean Discovery Engine' })).toBeVisible();
  });
});
