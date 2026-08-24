import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('can navigate to login page and switch modes', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'ANTILIA' })).toBeVisible();
    
    // Default is Sign In
    await expect(page.getByPlaceholder('Email address')).toBeVisible();
    
    // Switch to Create Account
    await page.getByRole('tab', { name: 'Create Account' }).click();
    await expect(page.getByPlaceholder('Full name')).toBeVisible();
    await expect(page.getByPlaceholder('Username (e.g. danieljwilliams)')).toBeVisible();
  });
});
