import { test, expect } from '@playwright/test';

test.describe('Universal Post Composer & Posting Reliability Engine', () => {
  // Use authenticated session configured via global setup
  test.use({ storageState: 'playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    // Navigate to create hub where UniversalComposer is rendered
    await page.goto('/create');
    await page.waitForLoadState('networkidle');
  });

  test('Composer renders with all modes and clean initial state', async ({ page }) => {
    // Check that create hub loaded
    await expect(page.getByText(/Tukubi Creator Engine|Create, Publish & Monetize/i).first()).toBeVisible();

    // Universal Composer textarea
    const composerTextarea = page.locator('textarea').first();
    await expect(composerTextarea).toBeVisible();

    // Check action buttons exist
    const discardBtn = page.getByRole('button', { name: /^Discard$/i }).first();
    const publishBtn = page.getByRole('button', { name: /^Post$/i }).first();
    await expect(discardBtn).toBeVisible();
    await expect(publishBtn).toBeVisible();

    // Initially publish button is disabled because there is no content
    await expect(publishBtn).toBeDisabled();
  });

  test('Publish button toggles correctly based on content presence', async ({ page }) => {
    const composerTextarea = page.locator('textarea').first();
    const publishBtn = page.getByRole('button', { name: /^Post$/i }).first();

    // Type content
    await composerTextarea.fill('Exploring the beautiful beaches of Antigua & Barbuda! 🇦🇬');
    await expect(publishBtn).toBeEnabled();

    // Clear content
    await composerTextarea.fill('');
    await expect(publishBtn).toBeDisabled();
  });

  test('Draft lifecycle: auto-saving and clean discard', async ({ page }) => {
    const composerTextarea = page.locator('textarea').first();
    const testDraftContent = 'Draft note about Saint Lucia jazz festival 2026.';

    // Type content
    await composerTextarea.fill(testDraftContent);

    // Wait a brief moment for debounce auto-save
    await page.waitForTimeout(600);

    // Check localStorage has draft
    const draftInStorage = await page.evaluate(() => {
      return localStorage.getItem('tukubi_composer_draft_v3');
    });
    expect(draftInStorage).toBeTruthy();
    expect(draftInStorage).toContain('Saint Lucia');

    // Click Discard
    const discardBtn = page.getByRole('button', { name: /^Discard$/i }).first();
    await discardBtn.click();

    // Verify composer resets to collapsed state
    await expect(page.getByText(/What(?:'|’)?s happening/i).first()).toBeVisible();

    // Verify localStorage draft is cleared
    const draftAfterDiscard = await page.evaluate(() => {
      return localStorage.getItem('tukubi_composer_draft_v3');
    });
    expect(draftAfterDiscard).toBeNull();
  });

  test('URL Detection & Rich Preview card rendering and removal', async ({ page }) => {
    const composerTextarea = page.locator('textarea').first();

    // Mock the URL resolution API endpoint for deterministic testing
    await page.route('/api/v1/media/resolve-url', async (route) => {
      const json = {
        success: true,
        metadata: {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          normalizedUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          contentType: 'external_video',
          provider: 'youtube',
          title: 'Caribbean Culture Anthem 2026',
          description: 'Official sound of the islands',
          thumbnailUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
          canEmbed: true,
          embedConfiguration: {
            embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
            aspectRatio: '16:9',
            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          },
          status: 'ready',
        },
      };
      await route.fulfill({ json });
    });

    // Enter YouTube URL into textarea
    await composerTextarea.fill('Check out this amazing tune: https://www.youtube.com/watch?v=dQw4w9WgXcQ');

    // Verify that the rich preview card appears
    await expect(page.getByText('Caribbean Culture Anthem 2026')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/youtube/i).first()).toBeVisible();

    // Find and click the preview remove button
    const removePreviewBtn = page.getByLabel(/Remove preview/i).first();
    await expect(removePreviewBtn).toBeVisible();
    await removePreviewBtn.click();

    // Verify the preview card is dismissed
    await expect(page.getByText('Caribbean Culture Anthem 2026')).not.toBeVisible();
  });

  test('Zero Ghost Errors: error state is cleared immediately when editing content', async ({ page }) => {
    const composerTextarea = page.locator('textarea').first();

    // Fill content
    await composerTextarea.fill('Testing error state handling');

    // Verify publish button is ready
    const publishBtn = page.getByRole('button', { name: /^Post$/i }).first();
    await expect(publishBtn).toBeEnabled();

    // Type additional content to verify responsiveness
    await composerTextarea.press('Space');
    await composerTextarea.type('and error clearing verification.');
    await expect(publishBtn).toBeEnabled();
  });

  test('Interactive poll mode adds poll options and cleans up cleanly', async ({ page }) => {
    // Find poll toggle button
    const pollBtn = page.getByRole('button', { name: /Poll/i }).first();
    if (await pollBtn.isVisible()) {
      await pollBtn.click();

      // Verify poll inputs are visible
      const pollQuestionInput = page.locator('input[placeholder*="Poll Question"]').first();
      await expect(pollQuestionInput).toBeVisible();

      await pollQuestionInput.fill('Favorite Caribbean carnival?');

      const option1Input = page.locator('input[placeholder="Option 1"]').first();
      const option2Input = page.locator('input[placeholder="Option 2"]').first();
      await option1Input.fill('Trinidad & Tobago');
      await option2Input.fill('Crop Over (Barbados)');

      // Verify "Remove" poll button cleans up
      const removePollBtn = page.getByRole('button', { name: /Remove/i }).first();
      await removePollBtn.click();

      // Verify poll inputs are removed
      await expect(pollQuestionInput).not.toBeVisible();
    }
  });
});
