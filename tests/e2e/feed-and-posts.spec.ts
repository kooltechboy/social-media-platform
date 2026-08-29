import { test, expect } from '@playwright/test';

test.describe('Feed and Posts', () => {
  test('unauthenticated users see sign-in prompts on interaction', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByRole('link', { name: /(TUKUBI|TUKUBI)/i })).toBeVisible();
    
    // Try to click Create Hub or something similar
    // The UI has a 'Create' button
    await page.goto('/create');
    await expect(page.getByText('Sign in')).toBeVisible();
  });
});
