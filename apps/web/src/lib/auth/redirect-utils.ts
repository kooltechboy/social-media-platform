/**
 * TUKUBI — Shared redirect URL sanitization utility
 * Prevents open-redirect attacks by validating redirect targets
 * against a strict whitelist of allowed path prefixes.
 */

const ALLOWED_REDIRECT_PREFIXES = [
  '/',
  '/explore',
  '/profile',
  '/settings',
  '/live',
  '/podcasts',
  '/marketplace',
  '/creator-studio',
  '/spotpay',
  '/communities',
  '/map',
  '/events',
  '/messages',
  '/notifications',
  '/create',
  '/search',
  '/reels',
  '/diaspora',
  '/sounds',
  '/onboarding',
] as const;

/**
 * Sanitize a redirect URL target to prevent open-redirect attacks.
 * Returns '/' if the target is invalid or not in the whitelist.
 *
 * Security checks:
 * - Must start with '/'
 * - Must not start with '//' (protocol-relative URL)
 * - Must not contain '://' (absolute URL scheme)
 * - Must match one of the allowed prefix patterns
 */
export function sanitizeRedirectUrl(target: string | null | undefined): string {
  if (!target) return '/';
  const trimmed = target.trim();

  // Prevent protocol-relative URLs (e.g. //evil.com) and explicit scheme redirects
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('://')) {
    return '/';
  }

  const isAllowed = ALLOWED_REDIRECT_PREFIXES.some(
    (prefix) => trimmed === prefix || trimmed.startsWith(`${prefix}/`)
  );
  return isAllowed ? trimmed : '/';
}
