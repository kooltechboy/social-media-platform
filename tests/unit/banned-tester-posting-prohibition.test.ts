import { describe, it, expect } from 'vitest';
import {
  isBannedTesterAccount,
  BANNED_TESTER_USER_IDS,
} from '../../apps/web/src/lib/auth/banned-testers';
import { hydratePostsEngagement } from '../../apps/web/src/lib/feed/hydrate-posts';

describe('Banned Tester Account Posting Prohibition — P0 Enforcement', () => {
  it('identifies banned tester accounts by exact UUID', () => {
    expect(isBannedTesterAccount({ id: 'a5df3d20-e923-4995-ab94-544fef75a751' })).toBe(true);
    expect(isBannedTesterAccount({ id: '7102174d-57f0-4140-bbba-5ac21455d777' })).toBe(true);
    expect(BANNED_TESTER_USER_IDS.has('a5df3d20-e923-4995-ab94-544fef75a751')).toBe(true);
    expect(BANNED_TESTER_USER_IDS.has('7102174d-57f0-4140-bbba-5ac21455d777')).toBe(true);
  });

  it('identifies banned tester accounts by username (case-insensitive)', () => {
    expect(isBannedTesterAccount({ username: 'bravo_tester' })).toBe(true);
    expect(isBannedTesterAccount({ username: 'Bravo_Tester' })).toBe(true);
    expect(isBannedTesterAccount({ username: 'alpha_tester' })).toBe(true);
    expect(isBannedTesterAccount({ username: 'ALPHA_TESTER' })).toBe(true);
    expect(isBannedTesterAccount({ username: 'bravotester' })).toBe(true);
    expect(isBannedTesterAccount({ username: 'alphatester' })).toBe(true);
  });

  it('identifies banned tester accounts by display name (case-insensitive)', () => {
    expect(isBannedTesterAccount({ displayName: 'Bravo Tester' })).toBe(true);
    expect(isBannedTesterAccount({ displayName: 'bravo tester' })).toBe(true);
    expect(isBannedTesterAccount({ displayName: 'Alpha Tester' })).toBe(true);
    expect(isBannedTesterAccount({ displayName: 'ALPHA TESTER' })).toBe(true);
    expect(isBannedTesterAccount({ display_name: 'Bravo Tester' })).toBe(true);
    expect(isBannedTesterAccount({ author: 'Alpha Tester' })).toBe(true);
  });

  it('allows legitimate Caribbean platform members to post', () => {
    expect(isBannedTesterAccount({ id: 'usr_real_jamaican_user', username: 'caribbean_king', displayName: 'Marcus Garvey' })).toBe(false);
    expect(isBannedTesterAccount({ id: 'usr_real_trini_user', username: 'soca_vibes', displayName: 'Port of Spain Music' })).toBe(false);
    expect(isBannedTesterAccount({ id: 'usr_official', username: 'tukubi', displayName: 'TUKUBI' })).toBe(false);
    expect(isBannedTesterAccount(null)).toBe(false);
    expect(isBannedTesterAccount(undefined)).toBe(false);
  });

  it('filters out any posts from Bravo Tester or Alpha Tester during feed hydration', async () => {
    const rawPosts = [
      {
        id: 'post_1',
        author_id: 'a5df3d20-e923-4995-ab94-544fef75a751',
        content: 'Bravo Tester Post that should be blocked',
        profiles: { display_name: 'Bravo Tester', username: 'bravo_tester' },
      },
      {
        id: 'post_2',
        author_id: '7102174d-57f0-4140-bbba-5ac21455d777',
        content: 'Alpha Tester Post that should be blocked',
        profiles: { display_name: 'Alpha Tester', username: 'alpha_tester' },
      },
      {
        id: 'post_3',
        author_id: 'usr_legitimate_caribbean_artist',
        content: 'Carnival in Bridgetown was amazing!',
        profiles: { display_name: 'Rihanna Fenty', username: 'rihanna', is_verified: true },
      },
    ];

    const hydrated = await hydratePostsEngagement(rawPosts, null);

    // Only post_3 should survive; post_1 and post_2 must be completely omitted
    expect(hydrated).toHaveLength(1);
    expect(hydrated[0].id).toBe('post_3');
    expect(hydrated[0].author).toBe('Rihanna Fenty');
    expect(hydrated[0].content).toBe('Carnival in Bridgetown was amazing!');
  });
});
