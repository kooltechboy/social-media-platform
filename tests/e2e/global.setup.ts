import { test as setup, expect } from '@playwright/test';
import * as crypto from 'crypto';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // We need a unique email and password for each run if the database clears or doesn't allow duplicates.
  // Using a random UUID ensures a fresh user every time.
  const randomSuffix = crypto.randomUUID().substring(0, 8);
  const email = `testuser_${randomSuffix}@example.com`;
  const password = `TestPassword!123_${randomSuffix}`;
  const username = `test_${randomSuffix}`;

  await page.goto('/login');

  // Switch to Sign Up mode
  await page.getByRole('tab', { name: 'Create Account' }).click();

  // Fill out Sign Up form
  await page.getByPlaceholder('Full name').fill('Playwright Test User');
  await page.getByPlaceholder('Username').fill(username);
  await page.getByPlaceholder('Email address').fill(email);
  await page.getByPlaceholder('Password (min 8 characters)').fill(password);
  await page.getByPlaceholder('Confirm password').fill(password);
  
  // Accept terms
  await page.getByRole('checkbox').check();

  // Submit the form
  await page.getByRole('button', { name: 'Create Account' }).click();

  // Wait briefly to see if an error message appears
  await page.waitForTimeout(2000);
  const errorLocator = page.locator('[role="alert"]');
  if (await errorLocator.isVisible()) {
    const errorText = await errorLocator.innerText();
    console.error(`Signup failed with error: ${errorText}`);
    throw new Error(`Signup failed with error: ${errorText}`);
  }

  // Also check info messages
  const infoLocator = page.locator('[role="status"]');
  if (await infoLocator.isVisible()) {
    const infoText = await infoLocator.innerText();
    console.log(`Signup info: ${infoText}`);
  }

  await page.waitForURL('**/', { timeout: 10000 });

  // Wait for the Profile link which is only available/different when logged in, or just wait for network idle.
  // For safety, we wait for network idle to ensure auth tokens are saved in storage.
  await page.waitForLoadState('networkidle');

  // Save the browser context state (cookies, localStorage, sessionStorage)
  await page.context().storageState({ path: authFile });
});
