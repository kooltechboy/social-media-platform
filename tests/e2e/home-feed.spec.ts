import { test, expect } from '@playwright/test';

test.describe('Home Feed Page - Unauthenticated', () => {
  // Override storageState to ensure unauthenticated state for these tests
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Root / redirects unauthenticated guests to login gateway', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const url = new URL(page.url());
    expect(url.pathname).toBe('/login');
  });

  test('Public Marketing Portal (/about) loads clean Caribbean structure', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');

    const brandLockup = page.getByText('TUKUBI').first();
    await expect(brandLockup).toBeVisible();

    // Tagline badge and master headline
    await expect(page.getByText('The Caribbean Connected.').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Born in the Caribbean/i }).first()).toBeVisible();

    // Primary CTA buttons
    const joinBtn = page.getByRole('link', { name: /Join the Caribbean Network/i });
    await expect(joinBtn).toBeVisible();
    await expect(joinBtn).toHaveAttribute('href', '/signup');

    const exploreBtn = page.getByRole('link', { name: /Explore Culture/i });
    await expect(exploreBtn).toBeVisible();
    await expect(exploreBtn).toHaveAttribute('href', '/explore');

    const signInLink = page.getByRole('link', { name: /Sign In/i }).first();
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute('href', '/login');
  });

  test('Public Marketing Portal displays Caribbean Identity & Six Pillars', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/Engineered Around Caribbean Identity/i)).toBeVisible();
    await expect(page.getByText(/30\+ Islands & Territories/i).first()).toBeVisible();
  });

  test('Public Marketing Portal displays Global Diaspora Hubs', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/Global Diaspora Hubs/i)).toBeVisible();
    const hubs = ['Miami', 'Toronto', 'London'];
    for (const hub of hubs) {
      await expect(page.getByText(new RegExp(hub, 'i')).first()).toBeVisible();
    }
  });
});

test.describe('Home Feed Page - Authenticated', () => {
  // Use the pre-configured authenticated state
  test.use({ storageState: 'playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Authenticated Home Stream & Editorial Composer', async ({ page }) => {
    // Composer trigger button for authenticated user
    const composerTrigger = page.getByRole('button', { name: /What's on your mind/i }).first();
    await expect(composerTrigger).toBeVisible({ timeout: 10000 });

    // Quick creation shortcuts
    await expect(page.getByRole('button', { name: /Photo/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Video/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Poll/i }).first()).toBeVisible();
  });

  test('Feed Stream & Interaction Bar', async ({ page }) => {
    // Mode tabs render For You tab by default
    await expect(page.getByRole('tab', { name: /For You/i })).toBeVisible({ timeout: 10000 });

    const emptyState = page.getByText(/No Content Found in This Feed|Your Following Stream is Quiet|No Friends Posts Yet|No Community Posts Yet/i).first();
    const postArticle = page.locator('article').first();

    // Wait deterministically for either post cards to hydrate or the empty state to appear
    await expect(postArticle.or(emptyState)).toBeVisible({ timeout: 10000 });

    const hasPost = await postArticle.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    expect(hasPost || hasEmpty).toBeTruthy();

    if (hasPost) {
      // Interaction bar elements
      await expect(postArticle.getByLabel(/View comments/i)).toBeVisible();
      await expect(postArticle.getByLabel(/Share post/i)).toBeVisible();
      await expect(postArticle.getByLabel(/Send Tip/i)).toBeVisible();
      await expect(postArticle.getByLabel(/Post options/i)).toBeVisible();
    }
  });
});
