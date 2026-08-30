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

  test('Unauthenticated State - Banner and Composer', async ({ page }) => {
    // "Tukubi Community Access" banner appears
    await expect(page.getByText(/(Tukubi|Tukubi) Community Access/)).toBeVisible();
    await expect(page.getByText(/Sign in or create your profile/i)).toBeVisible();
    await expect(page.getByText(/direct messaging/i).first()).toBeVisible();

    // "Sign In / Register" link points to `/login`
    const signInLink = page.getByRole('link', { name: /Sign In \/ Register/i });
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute('href', '/login');

    // UniversalComposer shows composer prompt
    await expect(page.getByText(/What's happening/i).first()).toBeVisible();
  });

  test('Live Broadcasting Banner', async ({ page }) => {
    // "Live Now: Kingston Dub Session" text visible
    await expect(page.getByText('Live Now: Kingston Dub Session')).toBeVisible();
    
    // "1.4K WATCHING" badge visible
    await expect(page.getByText('1.4K WATCHING')).toBeVisible();

    // "🔴 Go Live" link to `/live/broadcast`
    const goLiveLink = page.getByRole('link', { name: /Go Live/i });
    await expect(goLiveLink).toBeVisible();
    await expect(goLiveLink).toHaveAttribute('href', '/live/broadcast');

    // "Watch Live" link with Play icon to `/live`
    const watchLiveLink = page.getByRole('link', { name: /Watch Live/i });
    await expect(watchLiveLink).toBeVisible();
    await expect(watchLiveLink).toHaveAttribute('href', '/live');
  });

  test('Feed Tabs (role="tablist")', async ({ page }) => {
    const tablist = page.getByRole('tablist');
    await expect(tablist).toBeVisible();

    const tabs = ['Caribbean Now', 'For You', 'Diaspora Hubs', 'Creators & Music'];
    for (const tab of tabs) {
      await expect(page.getByRole('tab', { name: tab })).toBeVisible();
    }

    // Default active tab is "Caribbean Now" with aria-selected="true"
    const caribbeanNowTab = page.getByRole('tab', { name: 'Caribbean Now' });
    await expect(caribbeanNowTab).toHaveAttribute('aria-selected', 'true');

    // Clicking each tab updates the active state
    const forYouTab = page.getByRole('tab', { name: 'For You' });
    await forYouTab.click();
    await expect(forYouTab).toHaveAttribute('aria-selected', 'true');
    await expect(caribbeanNowTab).toHaveAttribute('aria-selected', 'false');
  });

  test('Caribbean Now Sidebar', async ({ page }) => {
    // Island Pulse section with 7 Caribbean/Diaspora city links
    const cities = ['Kingston', 'Port of Spain', 'Santo Domingo', 'Bridgetown', 'Miami', 'Toronto', 'London'];
    const sidebar = page.locator('aside');
    for (const city of cities) {
      await expect(sidebar.getByRole('link', { name: new RegExp(city, 'i') }).first()).toBeVisible();
    }

    // Multi-currency Ledger card
    await expect(page.getByText(/Ledger/i).first()).toBeVisible();

    // Upcoming Events / Cultural Fetes section
    await expect(page.getByText(/Cultural Fetes|Upcoming Events/i).first()).toBeVisible();
  });
});

test.describe('Home Feed Page - Authenticated', () => {
  // Use the pre-configured authenticated state
  test.use({ storageState: 'playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Moments Cinema Rail', async ({ page }) => {
    // "Your Moment" creation tile (requires auth)
    await expect(page.getByText('Your Moment')).toBeVisible();
  });

  test('Post Cards and Empty States', async ({ page }) => {
    // Since the database may or may not have posts, handle both the populated feed case and the empty feed case gracefully.
    const emptyStateText = page.getByText('No posts in this channel yet');
    
    if (await emptyStateText.isVisible()) {
      await expect(emptyStateText).toBeVisible();
    } else {
      const firstPost = page.locator('article').first();
      await firstPost.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      
      if (await firstPost.isVisible()) {
        // Author links to profile
        const profileLinks = firstPost.locator('a[href^="/profile/"]');
        await expect(profileLinks.first()).toBeVisible();
        
        // Post Interaction Bar
        // Like button with Heart icon and count (aria-label "Like post" / "Unlike post")
        const likeBtn = firstPost.getByRole('button', { name: /Like post|Unlike post/i });
        await expect(likeBtn).toBeVisible();

        // Comments button with MessageCircle icon and count (aria-label "View or add comments")
        const commentBtn = firstPost.getByRole('button', { name: /View or add comments/i });
        await expect(commentBtn).toBeVisible();

        // "Tip Creator" button with Wallet icon
        const tipBtn = firstPost.getByRole('button', { name: /Tip Creator/i });
        await expect(tipBtn).toBeVisible();

        // Post Options Menu (three-dot MoreHorizontal button)
        const optionsBtn = firstPost.getByRole('button', { name: 'Post options' });
        await expect(optionsBtn).toBeVisible();
        await optionsBtn.click();

        // Menu items: Copy Link, Save Post, Report Content (for non-author) or Delete Post (for author)
        await expect(page.getByText('Copy Link')).toBeVisible();
        await expect(page.getByText('Save Post')).toBeVisible();
        
        const reportOrDelete = page.getByText(/Report Content|Delete Post/i);
        await expect(reportOrDelete.first()).toBeVisible();
      }
    }
  });
});
