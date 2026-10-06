/**
 * TUKUBI Security Policy — Absolute Prohibition of Tester Account Posts
 * 
 * Inviolable Mandate: Under no circumstances may Bravo Tester and/or Alpha Tester
 * post, publish, or appear on the TUKUBI production platform.
 */

export const BANNED_TESTER_USER_IDS = new Set<string>([
  'a5df3d20-e923-4995-ab94-544fef75a751', // Bravo Tester
  '7102174d-57f0-4140-bbba-5ac21455d777', // Alpha Tester
]);

export const BANNED_TESTER_IDENTIFIERS = [
  'bravo_tester',
  'alpha_tester',
  'bravotester',
  'alphatester',
  'bravo tester',
  'alpha tester',
];

export function isBannedTesterAccount(account?: {
  id?: string | null;
  username?: string | null;
  displayName?: string | null;
  display_name?: string | null;
  author?: string | null;
  handle?: string | null;
} | null): boolean {
  if (!account) return false;
  if (account.id && BANNED_TESTER_USER_IDS.has(account.id)) {
    return true;
  }

  const valuesToCheck = [
    account.username,
    account.displayName,
    account.display_name,
    account.author,
    account.handle,
  ]
    .filter(Boolean)
    .map((s) => s!.toLowerCase().trim());

  for (const v of valuesToCheck) {
    if (
      BANNED_TESTER_IDENTIFIERS.includes(v) ||
      v.includes('bravo tester') ||
      v.includes('alpha tester')
    ) {
      return true;
    }
  }

  return false;
}
