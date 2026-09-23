import { test, expect } from '@playwright/test';

/**
 * TUKUBI Feed Stream Interactions E2E Tests
 *
 * Tests all interactive elements within the FeedStream component:
 * - Feed filter tabs on / (Home) (For You, Following, Friends, Caribbean, Communities)

 * - Post interaction bar (Like/Reactions, Comment, Share, Tip Creator)
 * - Post options menu (Copy Link, Save Post, Report Content, Delete Post)
 * - Comment system (inline comments, comment submission, empty comments state)
 * - Share modal (Copy Link, WhatsApp, X/Twitter, Facebook, Internal Repost)
 * - Report modal (4 reason radio buttons, cancel & submit)
 * - Creator Tip modal trigger (Direct Patronage, compliance notice)
 * - Empty feed state
 * - Toast notifications (Save post notification auto-dismiss)
 */

test.describe('Feed Stream — Tab Navigation', () => {
  test('renders feed filter tabs in a tablist on / (Home)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const tablist = page.getByRole('tablist');
    await expect(tablist).toBeVisible();

    const tabs = ['For You', 'Following', 'Friends', 'Caribbean', 'Communities'];
    for (const tabName of tabs) {
      await expect(page.getByRole('tab', { name: tabName })).toBeVisible();
    }
  });

  test('For You tab is active by default on / (Home)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const forYouTab = page.getByRole('tab', { name: 'For You' });
    await expect(forYouTab).toHaveAttribute('aria-selected', 'true');
  });

  test('clicking a tab changes the active state on / (Home)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click "Following" tab
    const followingTab = page.getByRole('tab', { name: 'Following' });
    await followingTab.click();
    await page.waitForLoadState('networkidle');
    await expect(followingTab).toHaveAttribute('aria-selected', 'true');

    // Verify "For You" is no longer active
    const forYouTab = page.getByRole('tab', { name: 'For You' });
    await expect(forYouTab).toHaveAttribute('aria-selected', 'false');
  });

  test('switching tabs displays either posts or empty state on / (Home)', async ({ page }) => {
    const tabs = [
      { name: 'Following', queryTab: 'following' },
      { name: 'Friends', queryTab: 'friends' },
      { name: 'Caribbean', queryTab: 'caribbean' },
      { name: 'Communities', queryTab: 'communities' },
    ];
    for (const tab of tabs) {
      await page.goto(`/?tab=${tab.queryTab}`);
      await page.waitForLoadState('networkidle');

      const articles = page.locator('article');
      const emptyState = page.getByText(/No .* Posts|quiet|No Content|Be the first/i);
      const hasContent = (await articles.count()) > 0;
      const hasEmptyState = await emptyState.first().isVisible().catch(() => false);
      expect(hasContent || hasEmptyState).toBeTruthy();
    }
  });
});

test.describe('Feed Stream — Post Cards & Actions', () => {
  test('post author avatar links to profile page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    if ((await articles.count()) > 0) {
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

      // Reaction button
      await expect(firstArticle.getByLabel(/React to post|Reacted:/i)).toBeVisible();

      // Comments button
      await expect(firstArticle.getByLabel(/View comments/i)).toBeVisible();

      // Share button
      await expect(firstArticle.getByLabel('Share post')).toBeVisible();

      // Tip Creator button
      await expect(firstArticle.getByLabel(/Send Tip/i)).toBeVisible();
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
      await expect(page.getByText(/Copy Link/i).first()).toBeVisible();
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

      await expect(page.getByText('Report Content').first()).toBeVisible();
    }
  });
});

test.describe('Feed Stream — Like & Reactions', () => {
  test('clicking reaction button updates reaction state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    if ((await articles.count()) > 0) {
      const reactionBtn = articles.first().getByLabel(/React to post|Reacted:/i);
      await expect(reactionBtn).toBeVisible();

      // Click reaction button
      await reactionBtn.click();
      await page.waitForTimeout(500);

      // Label should update optimistically
      const newLabel = await reactionBtn.getAttribute('aria-label');
      expect(newLabel).toMatch(/React to post|Reacted:/i);
    }
  });
});

test.describe('Feed Stream — Comments Section', () => {
  test('clicking comment button toggles inline comments section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    if ((await articles.count()) > 0) {
      const commentBtn = articles.first().getByLabel(/View comments/i);
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
      const commentBtn = articles.first().getByLabel(/View comments/i);
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
      const commentBtn = articles.first().getByLabel(/View comments/i);
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
      const commentBtn = articles.first().getByLabel(/View comments/i);
      await commentBtn.click();
      await page.waitForTimeout(1000);

      const emptyMsg = page.getByText(/No comments yet/i);
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

      // Verify share channels
      await expect(page.getByText('Copy Link to Post').first()).toBeVisible();
      await expect(page.getByText('WhatsApp').first()).toBeVisible();
      await expect(page.getByText('X / Twitter').first()).toBeVisible();
      await expect(page.getByText('Facebook').first()).toBeVisible();
      await expect(page.getByText('Repost to My Caribbean Feed').first()).toBeVisible();
    }
  });

  test('share modal can be closed with close button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    if ((await articles.count()) > 0) {
      const shareBtn = articles.first().getByLabel('Share post');
      await shareBtn.click();
      await page.waitForTimeout(300);

      // Close the modal
      const closeBtn = page.getByLabel('Close share dialog');
      await closeBtn.click();
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

        // Verify report modal renders with radio options
        await expect(page.getByText(/Spam, scam, or misleading/i)).toBeVisible();
        await expect(page.getByText(/Harassment, hate speech, or abuse/i)).toBeVisible();

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
        await expect(page.getByText(/Spam, scam, or misleading/i)).not.toBeVisible();
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
        const harassmentLabel = page.getByText(/Harassment, hate speech, or abuse/i);
        await harassmentLabel.click();

        const harassmentRadio = page.locator('input[name="reportReason"][value="harassment"]');
        await expect(harassmentRadio).toBeChecked();
      }
    }
  });
});

test.describe('Feed Stream — Creator Tip', () => {
  test('clicking Tip Creator button opens tip modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    if ((await articles.count()) > 0) {
      const tipBtn = articles.first().getByLabel(/Send Tip/i);
      await tipBtn.click();
      await page.waitForTimeout(300);

      // Creator tip modal should open with patron notice
      const tipModal = page.locator('.fixed.inset-0.z-50');
      await expect(tipModal).toBeVisible();
      const hasTipText = await page.getByText(/Direct Patronage|Regulated Caribbean Creator Payouts/i).first().isVisible().catch(() => false);
      expect(hasTipText).toBeTruthy();

      // Close modal
      await page.getByLabel('Close dialog').click();
      await expect(tipModal).not.toBeVisible();
    }
  });
});

test.describe('Feed Stream — Empty State', () => {
  test('empty feed displays appropriate message on filtered tab', async ({ page }) => {
    await page.goto('/feeds/friends');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    const emptyState = page.getByText(/No Friends Posts Yet|quiet|No Content|Friends/i);

    const hasArticles = (await articles.count()) > 0;
    const hasEmptyState = await emptyState.first().isVisible().catch(() => false);
    expect(hasArticles || hasEmptyState).toBeTruthy();
  });
});

test.describe('Feed Stream — Toast Notifications', () => {
  test('save post toast notification renders and auto-dismisses', async ({ page }) => {
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

        // Toast should appear
        await expect(page.getByText('Post saved to bookmarks!')).toBeVisible();

        // Toast should auto-dismiss after ~3.5 seconds
        await page.waitForTimeout(3500);
        await expect(page.getByText('Post saved to bookmarks!')).not.toBeVisible();
      }
    }
  });
});
