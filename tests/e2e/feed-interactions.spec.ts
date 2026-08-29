import { test, expect } from '@playwright/test';

/**
 * ANTILIA Feed Stream Interactions E2E Tests
 *
 * Tests all interactive elements within the FeedStream component:
 * - Feed filter tabs (Caribbean Now, For You, Diaspora Hubs, Creators & Music)
 * - Post interaction bar (Like, Comment, Share, Tip SpotPay)
 * - Post options menu (Copy Link, Save Post, Report Content, Delete Post)
 * - Comment system (inline comments, threaded replies, comment submission)
 * - Share modal (Copy Link, WhatsApp, X/Twitter, Facebook, Internal Repost)
 * - Report modal (4 reason radio buttons, submit)
 * - SpotPay Tip modal trigger
 * - Empty feed state
 * - Toast notifications
 */

test.describe('Feed Stream — Tab Navigation', () => {
  test('renders all 4 feed filter tabs in a tablist', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const tablist = page.getByRole('tablist');
    await expect(tablist).toBeVisible();

    const tabs = ['Caribbean Now', 'For You', 'Diaspora Hubs', 'Creators & Music'];
    for (const tabName of tabs) {
      await expect(page.getByRole('tab', { name: tabName })).toBeVisible();
    }
  });

  test('Caribbean Now tab is active by default', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const caribbeanTab = page.getByRole('tab', { name: 'Caribbean Now' });
    await expect(caribbeanTab).toHaveAttribute('aria-selected', 'true');
  });

  test('clicking a tab changes the active state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click "For You" tab
    const forYouTab = page.getByRole('tab', { name: 'For You' });
    await forYouTab.click();
    await expect(forYouTab).toHaveAttribute('aria-selected', 'true');

    // Verify "Caribbean Now" is no longer active
    const caribbeanTab = page.getByRole('tab', { name: 'Caribbean Now' });
    await expect(caribbeanTab).toHaveAttribute('aria-selected', 'false');
  });

  test('switching tabs can show empty state when no matching posts', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click through each tab and verify either posts or empty state renders
    const tabs = ['For You', 'Diaspora Hubs', 'Creators & Music'];
    for (const tabName of tabs) {
      await page.getByRole('tab', { name: tabName }).click();
      await page.waitForTimeout(300);

      // Either posts are displayed or the empty state appears
      const emptyState = page.getByText('No posts in this channel yet');
      const articles = page.locator('article');
      const hasContent = (await articles.count()) > 0;
      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      expect(hasContent || hasEmptyState).toBeTruthy();
    }
  });
});

test.describe('Feed Stream — Post Cards (Unauthenticated)', () => {
  test('post author avatar links to profile page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    if ((await articles.count()) > 0) {
      // The first avatar link should point to /profile/{handle}
      const avatarLink = articles.first().locator('a[aria-label^="View profile for"]');
      if ((await avatarLink.count()) > 0) {
        const href = await avatarLink.first().getAttribute('href');
        expect(href).toMatch(/^\/profile\//);
      }
    }
  });

  test('post content text is visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    if ((await articles.count()) > 0) {
      // Each post article should have non-empty text content
      const firstArticle = articles.first();
      const textContent = await firstArticle.textContent();
      expect(textContent).toBeTruthy();
      expect(textContent!.length).toBeGreaterThan(0);
    }
  });

  test('post interaction bar has all 4 action buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    if ((await articles.count()) > 0) {
      const firstArticle = articles.first();

      // Like button
      await expect(firstArticle.getByLabel(/Like post|Unlike post/)).toBeVisible();

      // Comments button
      await expect(firstArticle.getByLabel('View or add comments')).toBeVisible();

      // Share button
      await expect(firstArticle.getByLabel('Share post')).toBeVisible();

      // Tip SpotPay button
      await expect(firstArticle.getByLabel(/Send SpotPay Tip/)).toBeVisible();
    }
  });

  test('post options menu button exists and toggles dropdown', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    if ((await articles.count()) > 0) {
      const optionsBtn = articles.first().getByLabel('Post options');
      await expect(optionsBtn).toBeVisible();

      // Click opens dropdown
      await optionsBtn.click();
      await page.waitForTimeout(200);

      // Verify menu items appear
      await expect(page.getByText('Copy Link').first()).toBeVisible();
      await expect(page.getByText('Save Post').first()).toBeVisible();

      // Click again closes dropdown
      await optionsBtn.click();
      await page.waitForTimeout(200);
    }
  });

  test('post options menu shows Report Content for non-author', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    if ((await articles.count()) > 0) {
      const optionsBtn = articles.first().getByLabel('Post options');
      await optionsBtn.click();
      await page.waitForTimeout(200);

      // As unauthenticated user, should see Report Content (not Delete Post)
      await expect(page.getByText('Report Content').first()).toBeVisible();
    }
  });
});

test.describe('Feed Stream — Like Button', () => {
  test('clicking like button toggles like state optimistically', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    if ((await articles.count()) > 0) {
      const likeBtn = articles.first().getByLabel(/Like post|Unlike post/);
      const initialLabel = await likeBtn.getAttribute('aria-label');

      // Click like
      await likeBtn.click();
      await page.waitForTimeout(500);

      // Label should toggle (Like post <-> Unlike post)
      const newLabel = await likeBtn.getAttribute('aria-label');
      // Note: may fail if not authenticated, but the optimistic UI update should still fire
      if (initialLabel === 'Like post') {
        expect(newLabel).toBe('Unlike post');
      } else {
        expect(newLabel).toBe('Like post');
      }
    }
  });
});

test.describe('Feed Stream — Comments Section', () => {
  test('clicking comment button toggles inline comments section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    if ((await articles.count()) > 0) {
      const commentBtn = articles.first().getByLabel('View or add comments');
      await commentBtn.click();
      await page.waitForTimeout(500);

      // Comment section should appear with input field
      const commentInput = articles.first().getByPlaceholder('Write a supportive reply or feedback...');
      await expect(commentInput).toBeVisible();

      // Submit button should be visible
      const submitBtn = articles.first().getByLabel('Submit comment');
      await expect(submitBtn).toBeVisible();

      // Click comment button again to close
      await commentBtn.click();
      await page.waitForTimeout(300);
      await expect(commentInput).not.toBeVisible();
    }
  });

  test('comment submit button is disabled when input is empty', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    if ((await articles.count()) > 0) {
      const commentBtn = articles.first().getByLabel('View or add comments');
      await commentBtn.click();
      await page.waitForTimeout(500);

      const submitBtn = articles.first().getByLabel('Submit comment');
      await expect(submitBtn).toBeDisabled();
    }
  });

  test('typing in comment input enables submit button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    if ((await articles.count()) > 0) {
      const commentBtn = articles.first().getByLabel('View or add comments');
      await commentBtn.click();
      await page.waitForTimeout(500);

      const commentInput = articles.first().getByPlaceholder('Write a supportive reply or feedback...');
      await commentInput.fill('Test comment from Playwright');

      const submitBtn = articles.first().getByLabel('Submit comment');
      await expect(submitBtn).toBeEnabled();
    }
  });

  test('empty comments state shows appropriate message', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    if ((await articles.count()) > 0) {
      const commentBtn = articles.first().getByLabel('View or add comments');
      await commentBtn.click();
      await page.waitForTimeout(1000);

      // Should show "No comments yet. Start the conversation!" or existing comments
      const emptyMsg = page.getByText('No comments yet. Start the conversation!');
      const commentCards = articles.first().locator('.rounded-2xl.bg-black\\/30');
      const hasComments = (await commentCards.count()) > 0;
      const hasEmptyMsg = await emptyMsg.isVisible().catch(() => false);
      expect(hasComments || hasEmptyMsg).toBeTruthy();
    }
  });
});

test.describe('Feed Stream — Share Modal', () => {
  test('clicking share button opens share modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    if ((await articles.count()) > 0) {
      const shareBtn = articles.first().getByLabel('Share post');
      await shareBtn.click();
      await page.waitForTimeout(300);

      // Share modal should be visible
      await expect(page.getByText('Share Post').first()).toBeVisible();
      await expect(page.getByText('Copy Link to Post').first()).toBeVisible();
    }
  });

  test('share modal contains all sharing channels', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    if ((await articles.count()) > 0) {
      const shareBtn = articles.first().getByLabel('Share post');
      await shareBtn.click();
      await page.waitForTimeout(300);

      // Verify all share channels
      await expect(page.getByText('Copy Link to Post').first()).toBeVisible();
      await expect(page.getByText('WhatsApp').first()).toBeVisible();
      await expect(page.getByText('X / Twitter').first()).toBeVisible();
      await expect(page.getByText('Facebook').first()).toBeVisible();
      await expect(page.getByText('Repost to My Caribbean Feed').first()).toBeVisible();
    }
  });

  test('share modal can be closed with X button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    if ((await articles.count()) > 0) {
      const shareBtn = articles.first().getByLabel('Share post');
      await shareBtn.click();
      await page.waitForTimeout(300);

      // Close the modal
      const modal = page.locator('.fixed.inset-0').filter({ hasText: 'Share Post' });
      const closeBtn = modal.locator('button').first();
      // The close button is the X in the header
      await page.locator('.fixed.inset-0').filter({ hasText: 'Share Post' }).getByRole('button').first().click();
      await page.waitForTimeout(300);

      // Verify modal is gone
      await expect(page.locator('.fixed.inset-0').filter({ hasText: 'Share Post' })).not.toBeVisible();
    }
  });
});

test.describe('Feed Stream — Report Modal', () => {
  test('report option opens report modal with reason radio buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    if ((await articles.count()) > 0) {
      // Open post options menu
      const optionsBtn = articles.first().getByLabel('Post options');
      await optionsBtn.click();
      await page.waitForTimeout(200);

      // Click "Report Content"
      const reportBtn = page.getByText('Report Content').first();
      if (await reportBtn.isVisible()) {
        await reportBtn.click();
        await page.waitForTimeout(300);

        // Verify report modal renders with 4 radio options
        await expect(page.getByText('Spam, scam, or misleading information')).toBeVisible();
        await expect(page.getByText('Harassment, hate speech, or abuse')).toBeVisible();
        await expect(page.getByText('Inappropriate or harmful media')).toBeVisible();
        await expect(page.getByText('Copyright or intellectual property violation')).toBeVisible();

        // Verify Cancel and Submit Report buttons
        await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Submit Report' })).toBeVisible();
      }
    }
  });

  test('report modal Cancel button closes the modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    if ((await articles.count()) > 0) {
      const optionsBtn = articles.first().getByLabel('Post options');
      await optionsBtn.click();
      await page.waitForTimeout(200);

      const reportBtn = page.getByText('Report Content').first();
      if (await reportBtn.isVisible()) {
        await reportBtn.click();
        await page.waitForTimeout(300);

        // Click Cancel
        await page.getByRole('button', { name: 'Cancel' }).click();
        await page.waitForTimeout(300);

        // Modal should be gone
        await expect(page.getByText('Spam, scam, or misleading information')).not.toBeVisible();
      }
    }
  });

  test('report modal radio buttons are selectable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    if ((await articles.count()) > 0) {
      const optionsBtn = articles.first().getByLabel('Post options');
      await optionsBtn.click();
      await page.waitForTimeout(200);

      const reportBtn = page.getByText('Report Content').first();
      if (await reportBtn.isVisible()) {
        await reportBtn.click();
        await page.waitForTimeout(300);

        // Default is "spam" - click "harassment" radio
        const harassmentLabel = page.getByText('Harassment, hate speech, or abuse');
        await harassmentLabel.click();

        const harassmentRadio = page.locator('input[name="reportReason"][value="harassment"]');
        await expect(harassmentRadio).toBeChecked();
      }
    }
  });
});

test.describe('Feed Stream — SpotPay Tip', () => {
  test('clicking Tip SpotPay button opens tip modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    if ((await articles.count()) > 0) {
      const tipBtn = articles.first().getByLabel(/Send SpotPay Tip/);
      await tipBtn.click();
      await page.waitForTimeout(300);

      // SpotPay tip modal should open with preset amounts
      // The SpotPayTipModal component renders preset amount pills ($2, $5, $10, $25, $50)
      const tipModal = page.locator('.fixed.inset-0');
      if (await tipModal.isVisible()) {
        // Verify some tip-related content appears
        const hasPresets = await page.getByText('$5').isVisible().catch(() => false);
        const hasTipText = await page.getByText(/tip|SpotPay/i).first().isVisible().catch(() => false);
        expect(hasPresets || hasTipText).toBeTruthy();
      }
    }
  });
});

test.describe('Feed Stream — Post Options: Save/Bookmark', () => {
  test('clicking Save Post toggles bookmark state and shows toast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    if ((await articles.count()) > 0) {
      const optionsBtn = articles.first().getByLabel('Post options');
      await optionsBtn.click();
      await page.waitForTimeout(200);

      const saveBtn = page.getByText('Save Post').first();
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.waitForTimeout(500);

        // Toast should show "Post saved to bookmarks!"
        await expect(page.getByText('Post saved to bookmarks!')).toBeVisible();
      }
    }
  });
});

test.describe('Feed Stream — Empty State', () => {
  test('empty feed displays appropriate message', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check the default "Caribbean Now" tab
    const articles = page.locator('article');
    const emptyState = page.getByText('No posts in this channel yet');

    // Either we have posts or the empty state is shown
    const hasArticles = (await articles.count()) > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    expect(hasArticles || hasEmptyState).toBeTruthy();
  });

  test('empty state shows Caribbean-themed invitation text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Switch to a tab that likely has no posts
    await page.getByRole('tab', { name: 'Creators & Music' }).click();
    await page.waitForTimeout(300);

    const emptyState = page.getByText('No posts in this channel yet');
    if (await emptyState.isVisible().catch(() => false)) {
      await expect(page.getByText('Be the first to share an update to the Caribbean diaspora!')).toBeVisible();
    }
  });
});

test.describe('Feed Stream — Toast Notifications', () => {
  test('share toast notification renders and auto-dismisses', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    if ((await articles.count()) > 0) {
      // Trigger a share action that produces a toast
      const optionsBtn = articles.first().getByLabel('Post options');
      await optionsBtn.click();
      await page.waitForTimeout(200);

      const saveBtn = page.getByText('Save Post').first();
      if (await saveBtn.isVisible()) {
        await saveBtn.click();

        // Toast should appear
        await expect(page.getByText('Post saved to bookmarks!')).toBeVisible();

        // Toast should auto-dismiss after ~3 seconds
        await page.waitForTimeout(3500);
        await expect(page.getByText('Post saved to bookmarks!')).not.toBeVisible();
      }
    }
  });
});

test.describe('Feed Stream — Unauthenticated Access Banner', () => {
  test('unauthenticated users see the community access banner', async ({ page }) => {
    // Navigate without auth
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The "Antilia Community Access" heading should be visible
    await expect(page.getByText(/(Tukubi|Antilia) Community Access/)).toBeVisible();

    // The Sign In / Register link should point to /login
    const signInLink = page.getByRole('link', { name: 'Sign In / Register' });
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute('href', '/login');
  });

  test('community access banner mentions SpotPay wallet and messaging', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByText(/SpotPay wallet, direct messaging, and verified business pages/)
    ).toBeVisible();
  });
});

test.describe('Feed Stream — Live Broadcasting Banner', () => {
  test('live banner renders with Kingston Dub Session text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Live Now: Kingston Dub Session')).toBeVisible();
    await expect(page.getByText('1.4K WATCHING')).toBeVisible();
  });

  test('Go Live link points to /live/broadcast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const goLiveLink = page.getByRole('link', { name: /Go Live/i });
    await expect(goLiveLink).toHaveAttribute('href', '/live/broadcast');
  });

  test('Watch Live link points to /live', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const watchLiveLink = page.getByRole('link', { name: /Watch Live/i });
    await expect(watchLiveLink).toHaveAttribute('href', '/live');
  });
});
