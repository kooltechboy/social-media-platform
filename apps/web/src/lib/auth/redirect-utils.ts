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
  '/pages',
  '/messages',
  '/notifications',
  '/create',
  '/search',
  '/reels',
  '/diaspora',
  '/sounds',
  '/onboarding',
  '/admin',
  '/moderation',
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

  // Prevent protocol-relative URLs (//evil.com), explicit schemes, backslashes, path traversal, and control chars
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes('://') ||
    trimmed.includes('\\') ||
    trimmed.includes('..') ||
    /[\r\n\t\0]/.test(trimmed)
  ) {
    return '/';
  }

  // Extract path portion excluding query/hash for prefix validation
  const pathOnly = trimmed.split('?')[0].split('#')[0];

  const isAllowed = ALLOWED_REDIRECT_PREFIXES.some(
    (prefix) => pathOnly === prefix || pathOnly.startsWith(`${prefix}/`)
  );
  return isAllowed ? trimmed : '/';
}
