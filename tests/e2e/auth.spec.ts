import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('can navigate to login page and switch modes', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: /(TUKUBI|TUKUBI)/i }).first()).toBeVisible();
    
    // Default is Sign In with email & password
    const emailInput = page.locator('input#signin-email');
    await expect(emailInput).toBeVisible();
    await expect(page.locator('input#signin-password')).toBeVisible();
    
    // Switch to Magic Link mode
    await page.getByRole('button', { name: /magic link/i }).click();
    await expect(page.locator('input#magic-email')).toBeVisible();
    
    // Switch back to password mode
    await page.getByRole('button', { name: /sign in with password/i }).click();
    await expect(page.locator('input#signin-password')).toBeVisible();
    
    // Navigate to Create Account
    const createAccountLink = page.getByRole('link', { name: /create.*account/i }).first();
    await expect(createAccountLink).toHaveAttribute('href', '/signup');
  });
});
