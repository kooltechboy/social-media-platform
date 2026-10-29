import { test, expect } from '@playwright/test';

test.describe('Universal Rich Media Engine — Provider-Neutral End-to-End Certification', () => {
  const TEST_YOUTUBE_URL = 'https://youtu.be/IIQ3mIGKquc?si=faAZYkCPvSl1iH44';
  const CANONICAL_YOUTUBE_URL = 'https://www.youtube.com/watch?v=IIQ3mIGKquc';

  test.beforeEach(async ({ page }) => {
    // Intercept media resolution API to guarantee deterministic, reproducible test environments
    await page.route('/api/v1/media/resolve-url', async (route) => {
      const req = route.request();
      let urlParam = new URL(req.url()).searchParams.get('url');
      if (!urlParam && req.method() === 'POST') {
        try {
          const body = req.postDataJSON();
          urlParam = body?.url;
        } catch {}
      }

      if (urlParam && (urlParam.includes('youtu.be/IIQ3mIGKquc') || urlParam.includes('youtube.com/watch?v=IIQ3mIGKquc'))) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            metadata: {
              url: TEST_YOUTUBE_URL,
              normalizedUrl: CANONICAL_YOUTUBE_URL,
              canonicalUrl: CANONICAL_YOUTUBE_URL,
              provider: 'youtube',
              providerDisplayName: 'YouTube',
              siteName: 'YouTube',
              contentType: 'video',
              title: 'Caribbean Island Symphony & Golden Hour Vibes',
              description: 'Authentic Caribbean music showcase streamed directly from the islands.',
              authorName: 'Caribbean Vibes Official',
              authorUrl: 'https://www.youtube.com/@caribbeanvibes',
              thumbnailUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
              embedUrl: 'https://www.youtube-nocookie.com/embed/IIQ3mIGKquc?autoplay=1&enablejsapi=1',
              canEmbed: true,
              aspectRatio: '16:9',
              durationSeconds: 225,
              status: 'ready',
              extra: {
                id: 'IIQ3mIGKquc',
                embedRestrictedNotice: 'Embed playback restricted by content owner.',
              },
            },
          }),
        });
      }

      if (urlParam && urlParam.includes('spotify.com')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            metadata: {
              url: urlParam,
              normalizedUrl: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
              provider: 'spotify',
              contentType: 'audio',
              title: 'Caribbean Heat — Soca Summer',
              description: 'Top Caribbean Soca Hits 2026',
              authorName: 'Machel Montano',
              thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
              embedUrl: 'https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT',
              canEmbed: true,
              aspectRatio: '16:9',
              status: 'ready',
            },
          }),
        });
      }

      // Default generic route fulfillment
      return route.continue();
    });
  });

  test('1. Pasting YouTube URL in composer triggers canonicalization and rich preview card', async ({ page }) => {
    await page.goto('/create');
    await page.waitForLoadState('networkidle');

    const composerTextarea = page.locator('textarea').first();
    await expect(composerTextarea).toBeVisible();

    // Paste YouTube URL with tracking parameters
    await composerTextarea.fill(`Check out this vibe: ${TEST_YOUTUBE_URL}`);

    // Verify preview card renders with canonical title and provider badge
    await expect(page.getByText('Caribbean Island Symphony & Golden Hour Vibes')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/youtube/i).first()).toBeVisible();

    // Verify play button is present on the idle video card
    const playButton = page.getByRole('button', { name: /play/i }).first();
    await expect(playButton).toBeVisible();
  });

  test('2. Rich Media Player handles YouTube embedding and graceful fallback', async ({ page }) => {
    await page.goto('/create');
    await page.waitForLoadState('networkidle');

    const composerTextarea = page.locator('textarea').first();
    await composerTextarea.fill(TEST_YOUTUBE_URL);

    await expect(page.getByText('Caribbean Island Symphony & Golden Hour Vibes')).toBeVisible({ timeout: 10000 });

    const playButton = page.getByRole('button', { name: /play/i }).first();
    await expect(playButton).toBeVisible();

    // Click play to initiate player state machine
    await playButton.click();

    // The iframe or player container is initialized with enablejsapi=1
    const iframe = page.locator('iframe[title="Caribbean Island Symphony & Golden Hour Vibes"]');
    await expect(iframe).toBeAttached({ timeout: 5000 });

    // Simulate YouTube player postMessage error 150 (playback restricted / embedding disabled)
    await page.evaluate(() => {
      const iframe = document.querySelector('iframe') as HTMLIFrameElement;
      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify({
            event: 'onError',
            info: 150,
          }),
          source: iframe?.contentWindow || window,
          origin: 'https://www.youtube-nocookie.com',
        })
      );
    });

    // Verify state machine transitions to fallback with graceful user notice
    await expect(
      page.getByText(/Playback (restricted|unavailable)|Embedding disabled by content owner|Embed response timed out/i).first()
    ).toBeVisible({ timeout: 5000 });

    // Verify pristine canonical external CTA button is presented to the user
    const watchOnYouTubeBtn = page.getByRole('link', { name: /Watch on YouTube/i }).first();
    await expect(watchOnYouTubeBtn).toBeVisible();
    await expect(watchOnYouTubeBtn).toHaveAttribute('href', CANONICAL_YOUTUBE_URL);
    await expect(watchOnYouTubeBtn).toHaveAttribute('target', '_blank');
  });

  test('3. Audio providers (Spotify) render rich responsive cards', async ({ page }) => {
    await page.goto('/create');
    await page.waitForLoadState('networkidle');

    const composerTextarea = page.locator('textarea').first();
    await composerTextarea.fill('Listen to this: https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT');

    await expect(page.getByText('Caribbean Heat — Soca Summer')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/spotify/i).first()).toBeVisible();
  });

  test('4. Mobile Viewport Certification: zero horizontal overflow & accessible touch targets', async ({ page }) => {
    // Set mobile viewport: iPhone 13 (375 x 812)
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/create');
    await page.waitForLoadState('networkidle');

    const composerTextarea = page.locator('textarea').first();
    await composerTextarea.fill(TEST_YOUTUBE_URL);

    await expect(page.getByText('Caribbean Island Symphony & Golden Hour Vibes')).toBeVisible({ timeout: 10000 });

    // Verify card does not horizontally overflow viewport
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(isOverflowing).toBe(false);

    // Verify play button meets touch target requirements (>= 44px)
    const playButton = page.getByRole('button', { name: /play/i }).first();
    const box = await playButton.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});
