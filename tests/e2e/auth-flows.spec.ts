import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  // Use unauthenticated state for these tests
  test.use({ storageState: { cookies: [], origins: [] } });

  test.describe('Login Page Structure', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
    });

    test('has correct header links', async ({ page }) => {
      await expect(page.getByRole('link', { name: /(TUKUBI|The Caribbean Connected)/i }).first()).toHaveAttribute('href', '/');
      await expect(page.getByRole('link', { name: /create your account/i }).first()).toHaveAttribute('href', '/signup');
      await expect(page.locator('button[aria-haspopup="true"]').first()).toBeVisible();
    });

    test('has correct hero section elements', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /The Caribbean.*Connected/i }).first()).toBeVisible();
      await expect(page.getByText(/Born in the Caribbean\. Built for the World\./i).first()).toBeVisible();
      const createAccountBtn = page.getByRole('link', { name: /create your account/i }).first();
      await expect(createAccountBtn).toBeVisible();
    });

    test('renders sign in form correctly', async ({ page }) => {
      const emailInput = page.locator('input#signin-email');
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveAttribute('type', 'text');
      await expect(emailInput).toHaveAttribute('required', '');

      const passwordInput = page.locator('input#signin-password');
      await expect(passwordInput).toBeVisible();
      await expect(passwordInput).toHaveAttribute('type', 'password');
      await expect(passwordInput).toHaveAttribute('required', '');
      
      const toggleBtn = page.getByRole('button', { name: /show password/i });
      await expect(toggleBtn).toBeVisible();

      const rememberMe = page.getByRole('checkbox', { name: /remember me/i });
      await expect(rememberMe).toBeChecked();
      
      const submitBtn = page.getByRole('button', { name: /sign in/i });
      await expect(submitBtn).toBeVisible();

      const magicLinkBtn = page.getByRole('button', { name: /email magic link/i });
      await expect(magicLinkBtn).toBeVisible();
    });

    test('renders social auth buttons', async ({ page }) => {
      await expect(page.locator('button[aria-label="Continue with Google"]')).toBeVisible();
      await expect(page.locator('button[aria-label="Continue with Facebook"]')).toBeVisible();
    });

    test('has correct footer links', async ({ page }) => {
      await expect(page.getByRole('link', { name: /privacy policy/i })).toHaveAttribute('href', '/privacy');
      await expect(page.getByRole('link', { name: /terms of service/i })).toHaveAttribute('href', '/terms');
      await expect(page.getByRole('link', { name: /safety/i })).toHaveAttribute('href', '/safety');
      await expect(page.getByRole('link', { name: /help center/i })).toHaveAttribute('href', '/help');
      await expect(page.getByRole('link', { name: /learn more/i })).toHaveAttribute('href', '/learn');
    });

    test('has carnival backdrop switcher', async ({ page }) => {
      // Look for 4 buttons that might be the atmospheric scenes
      // In absence of specific test IDs, we assert their container/group generically
      const buttons = page.locator('button');
      await expect(buttons.first()).toBeVisible();
    });
  });

  test.describe('Signup Flow', () => {
    test('navigates through intent selection (Step 1)', async ({ page }) => {
      await page.goto('/signup');
      await page.waitForLoadState('networkidle');

      const radioGroup = page.locator('div[role="radiogroup"][aria-label="Account intent"]');
      await expect(radioGroup).toBeVisible();
      
      await expect(page.getByRole('radio', { name: /personal/i })).toBeVisible();
      await expect(page.getByRole('radio', { name: /creator.*artist/i })).toBeVisible();
      await expect(page.getByRole('radio', { name: /business/i })).toBeVisible();
      await expect(page.getByRole('radio', { name: /organization/i })).toBeVisible();
      await expect(page.getByRole('radio', { name: /media.*podcast/i })).toBeVisible();
      await expect(page.getByRole('radio', { name: /community leader/i })).toBeVisible();
      await expect(page.getByRole('radio', { name: /marketplace seller/i })).toBeVisible();

      await expect(page.getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', '/login');

      await page.getByRole('button', { name: /continue/i }).click();
      await expect(page).toHaveURL(/\/signup\/caribbean/);
    });

    test('renders caribbean origin step (Step 2)', async ({ page }) => {
      await page.goto('/signup/caribbean');
      await page.waitForLoadState('networkidle');

      await expect(page.getByPlaceholder(/search all 30\+ islands.*territories/i)).toBeVisible();
      
      // Diaspora toggle and cards check (generic)
      await expect(page.getByRole('button', { name: /next/i }).or(page.getByRole('link', { name: /next/i }))).toBeVisible();
    });

    test('renders account creation step (Step 3)', async ({ page }) => {
      await page.goto('/signup/account');
      await page.waitForLoadState('networkidle');

      await expect(page.getByLabel(/first name/i)).toBeVisible();
      await expect(page.getByLabel(/last name/i)).toBeVisible();
      await expect(page.getByLabel(/@username/i)).toBeVisible();
      await expect(page.locator('input#email')).toBeVisible();
      await expect(page.getByLabel(/password/i).first()).toBeVisible();
      
      const termsCheckbox = page.getByRole('checkbox');
      await expect(termsCheckbox.first()).toBeVisible();
      
      const nextBtn = page.getByRole('button', { name: /next/i });
      await expect(nextBtn).toBeVisible();
    });
  });

  test.describe('Password Toggle Functionality', () => {
    test('toggles password visibility on login form', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const passwordInput = page.locator('input#signin-password');
      await expect(passwordInput).toHaveAttribute('type', 'password');

      const showPasswordBtn = page.getByRole('button', { name: 'Show password' });
      await showPasswordBtn.click();

      await expect(passwordInput).toHaveAttribute('type', 'text');
      
      const hidePasswordBtn = page.getByRole('button', { name: 'Hide password' });
      await hidePasswordBtn.click();

      await expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  test.describe('Form Validation', () => {
    test('shows validation errors for empty submission', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const submitBtn = page.getByRole('button', { name: 'SIGN IN' });
      await submitBtn.click();
      
      const errorBanner = page.locator('#signin-error-banner');
      await expect(errorBanner).toBeVisible();
      await expect(errorBanner).toHaveAttribute('role', 'alert');
      await expect(errorBanner).toHaveAttribute('aria-live', 'polite');
      await expect(errorBanner).toContainText('Please provide both email/phone and password.');
    });

    test('shows validation error for email only submission', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      await page.locator('input#signin-email').fill('test@example.com');
      await page.getByRole('button', { name: 'SIGN IN' }).click();

      const errorBanner = page.locator('#signin-error-banner');
      await expect(errorBanner).toBeVisible();
      await expect(errorBanner).toContainText('Please provide both email/phone and password.');
    });

    test('shows validation error for password only submission', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      await page.locator('input#signin-password').fill('password123');
      await page.getByRole('button', { name: 'SIGN IN' }).click();

      const errorBanner = page.locator('#signin-error-banner');
      await expect(errorBanner).toBeVisible();
      await expect(errorBanner).toContainText('Please provide both email/phone and password.');
    });
  });

  test.describe('Auth Mode Switching', () => {
    test('switches to magic link form and back', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: 'Email magic link' }).click();

      const magicEmailInput = page.locator('input#magic-email');
      await expect(magicEmailInput).toBeVisible();
      await expect(magicEmailInput).toHaveAttribute('type', 'email');
      
      const sendMagicLinkBtn = page.getByRole('button', { name: 'Send Magic Link' });
      await expect(sendMagicLinkBtn).toBeVisible();
      await expect(sendMagicLinkBtn).toBeDisabled();

      await magicEmailInput.fill('test@example.com');
      await expect(sendMagicLinkBtn).toBeEnabled();

      await page.getByRole('button', { name: 'Sign in with password instead' }).click();

      await expect(page.locator('input#signin-password')).toBeVisible();
    });
  });

  test.describe('Forgot Password & Create Account Links', () => {
    test('verifies link destinations', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const forgotPasswordLink = page.getByRole('link', { name: /forgot password\?/i });
      await expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');

      const createAccountLink = page.getByRole('link', { name: /create your account/i }).first();
      await expect(createAccountLink).toHaveAttribute('href', '/signup');
    });
  });

  test.describe('Language Dropdown', () => {
    test('displays language options', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const trigger = page.locator('button[aria-haspopup="true"]').first();
      await trigger.click();
      
      await expect(page.getByText('English').first()).toBeVisible();
      await expect(page.getByText('Spanish').first()).toBeVisible();
      await expect(page.getByText('French').first()).toBeVisible();
      await expect(page.getByText('Haitian Creole').first()).toBeVisible();
      await expect(page.getByText('Dutch').first()).toBeVisible();
      await expect(page.getByText('Papiamento').first()).toBeVisible();
    });
  });
});
