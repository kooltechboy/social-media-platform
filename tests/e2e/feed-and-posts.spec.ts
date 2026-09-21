import { test, expect } from '@playwright/test';

test.describe('Feed and Posts', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('unauthenticated users see sign-in prompts on interaction', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByRole('link', { name: /(TUKUBI|TUKUBI)/i }).first()).toBeVisible();
    
    // Try to navigate to /create which is protected
    await page.goto('/create');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
});
