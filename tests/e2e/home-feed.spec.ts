import { test, expect } from '@playwright/test';

test.describe('Home Feed Page - Unauthenticated', () => {
  // Override storageState to ensure unauthenticated state for these tests
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Page Load & Basic Structure', async ({ page }) => {
    const brandLink = page.getByRole('link', { name: /(TUKUBI|TUKUBI)/i }).first();
    await expect(brandLink).toBeVisible();

    // Main feed area renders (checking for main role or content section)
    await expect(page.getByRole('main').or(page.locator('main'))).toBeVisible();

    // Sidebar renders (desktop)
    const sidebar = page.locator('aside').first();
    if (await sidebar.count() > 0) {
      await expect(sidebar).toBeVisible();
    }
  });

  test('Unauthenticated State - Hero and Call to Actions', async ({ page }) => {
    // Tagline badge and master headline
    await expect(page.getByText('The Caribbean Connected.').first()).toBeVisible();
    await expect(page.getByText(/Born in the Caribbean/i).first()).toBeVisible();

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

  test('Caribbean Identity & Six Pillars', async ({ page }) => {
    await expect(page.getByText(/Engineered Around Caribbean Identity/i)).toBeVisible();
    await expect(page.getByText(/30\+ Islands & Territories/i).first()).toBeVisible();
  });

  test('Global Diaspora Hubs', async ({ page }) => {
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

  test('Authenticated Horizon Card & Quick Actions', async ({ page }) => {
    // Welcome back heading for authenticated user
    await expect(page.getByText(/Welcome back/i).first()).toBeVisible();

    // Quick Creation Bar Trigger
    await expect(page.getByText(/What’s happening across your Caribbean world\?/i)).toBeVisible();

    // Quick creation action links
    const quickActions = ['Post', 'Reel', 'Go Live'];
    for (const action of quickActions) {
      await expect(page.getByRole('link', { name: new RegExp(action, 'i') }).first()).toBeVisible();
    }
  });

  test('Feed Stream & Interaction Bar', async ({ page }) => {
    // Feed container renders "Home Stream"
    await expect(page.getByText(/Home Stream|Happening in Your World/i).first()).toBeVisible();

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
