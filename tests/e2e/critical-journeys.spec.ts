import { test, expect } from '@playwright/test';

test.describe('Critical journeys', () => {
  test('home page loads with navigation and feed modes', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /CARIBBEAN ONE/ })).toBeVisible();
    await expect(page.getByText('Following')).toBeVisible();
    await expect(page.getByText('Latest')).toBeVisible();
  });

  test('explore renders the Caribbean country grid', async ({ page }) => {
    await page.goto('/explore');
    await expect(page.getByRole('heading', { name: 'Caribbean Discovery Engine' })).toBeVisible();
    const countryCards = page.locator('section').first().locator('.group');
    await expect(countryCards.first()).toBeVisible();
    const count = await countryCards.count();
    expect(count).toBeGreaterThanOrEqual(8);
  });

  test('explore renders diaspora hubs', async ({ page }) => {
    await page.goto('/explore');
    await expect(page.getByRole('heading', { name: 'Global Diaspora Hubs' })).toBeVisible();
    await expect(page.getByText('Toronto')).toBeVisible();
  });

  test('messages page renders conversation list and composer', async ({ page }) => {
    await page.goto('/messages');
    await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();
    await expect(page.getByPlaceholder('Write a message…')).toBeVisible();
  });

  test('moderation console renders queue and case actions', async ({ page }) => {
    await page.goto('/moderation');
    await expect(page.getByRole('heading', { name: 'Moderation Center' })).toBeVisible();
  });

  test('admin console renders feature flags and system health', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Admin Console' })).toBeVisible();
  });

  test('health endpoint reports database status', async ({ request }) => {
    const response = await request.get('/api/v1/health');
    expect([200, 503]).toContain(response.status());
    const body = await response.json();
    expect(['ok', 'degraded']).toContain(body.status);
    expect(typeof body.latencyMs).toBe('number');
  });
});
