import { test, expect } from '@playwright/test';

test.describe('Critical journeys', () => {
  test('home page loads with navigation and feed modes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('link', { name: /(TUKUBI|TUKUBI)/i }).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Caribbean Now' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'For You' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Diaspora Hubs' })).toBeVisible();
  });

  test('explore renders the Caribbean country grid', async ({ page }) => {
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Caribbean Discovery Engine/i })).toBeVisible();
  });

  test('explore renders diaspora hubs', async ({ page }) => {
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Global Diaspora Hubs/i)).toBeVisible();
    await expect(page.getByText(/Toronto/i).first()).toBeVisible();
  });

  test('messages page redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForLoadState('networkidle');
    const url = new URL(page.url());
    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('next')).toBe('/messages');
  });

  test('moderation console redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/moderation');
    await page.waitForLoadState('networkidle');
    const url = new URL(page.url());
    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('next')).toBe('/moderation');
  });

  test('admin console redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    const url = new URL(page.url());
    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('next')).toBe('/admin');
  });

  test('health endpoint reports database status', async ({ request }) => {
    const response = await request.get('/api/v1/health');
    expect([200, 503]).toContain(response.status());
    const body = await response.json();
    expect(['ok', 'degraded']).toContain(body.status);
    expect(typeof body.latencyMs).toBe('number');
  });
});
